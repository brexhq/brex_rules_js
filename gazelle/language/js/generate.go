package js

import (
	"fmt"
	"path"
	"path/filepath"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/language/proto"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

const IsTestFileAttr = "is_test_file"

func (s *JSLanguage) GenerateRules(args language.GenerateArgs) language.GenerateResult {
	var rules []*rule.Rule
	var empty []*rule.Rule
	var usedFiles []string

	c := args.Config
	cfg := GetConfig(c)
	protoMode := GetProtoMode(c)

	for _, other := range args.OtherGen {
		if other.Kind() != "proto_library" {
			continue
		}

		pkg := other.PrivateAttr(proto.PackageKey).(proto.Package)
		rules = append(rules, generateProto(protoMode, other.Name(), pkg)...)
	}

	for _, f := range append(args.RegularFiles, args.GenFiles...) {
		if strings.HasPrefix(f, ".") || HasAnySuffix(f, IgnoredExtensions...) {
			continue
		}

		base := strings.ToLower(path.Base(f))
		base = strings.TrimSuffix(base, filepath.Ext(base))

		if !cfg.IsRelevantFile(f) {
			continue
		}

		usedFiles = append(usedFiles, f)

		test := cfg.IsTestFile(f)
		info := GetFileinfo(args.Dir, f)
		name := base
		lint := false
		kind := ""

		if cfg.IsJavascript(f) {
			kind = "js_library"
			lint = true
		} else if cfg.IsTypescript(f) {
			kind = "ts_library"
			lint = true
		}

		if cfg.Compiler == CompilerBabel {
			kind = "babel_library"
		}

		if test {
			name = base + "_" + "tests"

			r := rule.NewRule("jest_node_test", base)
			r.SetAttr("tests", []string{":" + name})
			r.SetAttr("config", cfg.JestConfig)
			r.SetAttr("npm_workspace", cfg.NpmWorkspaceName)
			r.SetPrivateAttr(config.GazelleImportsKey, []string{})
			rules = append(rules, r)
		}

		if lint && cfg.EslintEnabled {
			r := rule.NewRule("eslint_test", base+".lint")
			r.SetAttr("srcs", []string{f})
			r.SetAttr("config", cfg.EslintConfig)
			r.SetAttr("npm_workspace", cfg.NpmWorkspaceName)
			r.SetAttr("npm_package", cfg.NpmPackage)
			r.SetPrivateAttr(config.GazelleImportsKey, info.Imports)
			rules = append(rules, r)
		}

		r := rule.NewRule(kind, name)

		r.SetAttr("srcs", []string{f})

		if test {
			r.SetPrivateAttr(IsTestFileAttr, true)
			r.SetAttr("testonly", true)
		} else {
			r.SetAttr("visibility", []string{"//visibility:public"})
		}

		if cfg.Compiler == CompilerTsLibrary {
			if cfg.IsTypescript(f) {
				if cfg.NpmWorkspaceName != "npm" {
					r.SetAttr("compiler", fmt.Sprintf("@%s//@bazel/typescript/bin:tsc_wrapped", cfg.NpmWorkspaceName))
					r.SetAttr("node_modules", fmt.Sprintf("@%s//typescript:typescript__typings", cfg.NpmWorkspaceName))
				}

				r.SetAttr("tsconfig", cfg.TsConfig)
			}
		} else {
			if cfg.BabelConfig != "" {
				r.SetAttr("babel_config", cfg.BabelConfig)
			}

			if cfg.Package != "" {
				r.SetAttr("package_name", cfg.Package)
			}

			if cfg.IsTypescript(f) && cfg.TsConfig != "" {
				r.SetAttr("ts_config", cfg.TsConfig)
			}
		}

		r.SetPrivateAttr(config.GazelleImportsKey, info.Imports)

		rules = append(rules, r)
	}

	if cfg.PackageMode == PackageModeUnified {
		rules = unifyPackage(cfg, args, rules)
	}

	var res language.GenerateResult

	for _, r := range args.OtherEmpty {
		if r.Kind() == "proto_library" {
			// Remove js_proto_library for all removed proto_library
			empty = append(empty, rule.NewRule("js_proto_library", buildProtoLibraryName(r.Name())))
		}
	}

	// Empty is a list of rules that cannot be built with the files found in the
	// directory GenerateRules was asked to process. These will be merged with
	// existing rules. If ther merged rules are empty, they will be deleted.
	// In order to keep the BUILD file clean, if no file is included in the
	// default rule for this directory, then remove it.
	res.Empty = append(empty, generateEmpty(args.File, usedFiles, map[string]bool{
		"js_library":     true,
		"ts_library":     true,
		"babel_library":  true,
		"jest_node_test": true,
		"eslint_test":    true,
	})...)

	for _, r := range rules {
		res.Gen = append(res.Gen, r)
		res.Imports = append(res.Imports, r.PrivateAttr(config.GazelleImportsKey))
	}

	return res
}

func generateProto(mode proto.Mode, name string, pkg proto.Package) []*rule.Rule {
	if !mode.ShouldGenerateRules() {
		return nil
	}

	if len(pkg.Files) == 0 {
		return nil
	}

	ruleName := buildProtoLibraryName(name)
	imports := make([]string, 0, len(pkg.Imports))

	for i := range pkg.Imports {
		imports = append(imports, i)
	}

	compilers := []string{"@brex_rules_js//proto:proto"}

	if pkg.HasServices {
		compilers = []string{"@brex_rules_js//proto:grpc"}
	}

	r := rule.NewRule("js_proto_library", ruleName)
	r.SetAttr("proto", ":"+name)
	r.SetAttr("visibility", []string{"//visibility:public"})
	r.SetAttr("compilers", compilers)
	r.SetPrivateAttr(config.GazelleImportsKey, imports)

	return []*rule.Rule{r}
}

func unifyPackage(cfg *Config, args language.GenerateArgs, allRules []*rule.Rule) []*rule.Rule {
	var rules []*rule.Rule

	ruleMap := map[string]*rule.Rule{}

	for _, r := range allRules {
		isTest, _ := r.PrivateAttr(IsTestFileAttr).(bool)

		if isTest || !MatchesAny(r.Kind(), "js_library", "ts_library", "babel_library") {
			rules = append(rules, r)
			continue
		}

		grule, ok := ruleMap[r.Kind()]
		imps := r.PrivateAttr(config.GazelleImportsKey).([]string)

		if !ok {
			r.SetName("js_default_library")
			ruleMap[r.Kind()] = r
			continue
		}

		srcs := grule.AttrStrings("srcs")
		srcs = append(srcs, r.AttrStrings("srcs")...)
		grule.SetAttr("srcs", srcs)

		gimp := grule.PrivateAttr(config.GazelleImportsKey).([]string)
		gimp = append(gimp, imps...)
		grule.SetPrivateAttr(config.GazelleImportsKey, gimp)
	}

	for _, v := range ruleMap {
		rules = append(rules, v)
	}

	return rules
}

func (s *JSLanguage) Fix(c *config.Config, f *rule.File) {
}

// generateEmpty generates a list of jest_node_test, js_library and js_import rules that may be
// deleted. This is generated from these existing rules with srcs lists that don't match any
// static or generated files.
func generateEmpty(f *rule.File, files []string, knownRuleKinds map[string]bool) []*rule.Rule {
	if f == nil {
		return nil
	}
	knownFiles := make(map[string]bool)
	for _, f := range files {
		knownFiles[f] = true
	}
	var empty []*rule.Rule
outer:
	for _, r := range f.Rules {
		if !knownRuleKinds[r.Kind()] {
			continue
		}
		srcs := r.AttrStrings("srcs")
		if len(srcs) == 0 && r.Attr("srcs") != nil {
			// srcs is not a string list; leave it alone
			continue
		}
		for _, src := range r.AttrStrings("srcs") {
			if knownFiles[src] {
				continue outer
			}
		}
		empty = append(empty, rule.NewRule(r.Kind(), r.Name()))
	}
	return empty
}

func buildProtoLibraryName(name string) string {
	return strings.TrimSuffix(name, "_proto") + "_js_proto"
}
