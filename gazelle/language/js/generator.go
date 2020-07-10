package js

import (
	"fmt"
	"log"
	"path/filepath"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/label"
	"github.com/bazelbuild/bazel-gazelle/language/proto"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

type generator struct {
	cfg         *Config
	rel         string
	dir         string
	protoMode   proto.Mode
	packageName string
}

func (g *generator) generateLibrary(info *FileInfo) []*rule.Rule {
	var kind string

	rules := make([]*rule.Rule, 0)
	base := strings.TrimSuffix(info.Name, filepath.Ext(info.Name))
	name := base

	if info.IsTest {
		name = base + "_" + "tests"

		r := rule.NewRule("jest_node_test", base)
		r.SetAttr("srcs", []string{":" + name})

		if g.cfg.EslintConfig != label.NoLabel {
			r.SetAttr("config", g.cfg.JestConfig.String())
		}

		rules = append(rules, r)
	}

	if g.cfg.EslintEnabled {
		r := rule.NewRule("eslint_test", base+".lint")
		r.SetAttr("srcs", []string{":" + name})

		if g.cfg.EslintConfig != label.NoLabel {
			r.SetAttr("config", g.cfg.EslintConfig.String())
		}

		rules = append(rules, r)
	}

	if g.cfg.Compiler == CompilerBabel {
		kind = "babel_library"
	} else {
		switch info.Language {
		case JavascriptLanguage:
			kind = "js_library"
		case TypescriptLanguage:
			kind = "ts_library"
		default:
			log.Printf("unknown language for file %s", info.Name)
			return nil
		}
	}

	r := rule.NewRule(kind, name)

	r.SetAttr("srcs", []string{info.Name})

	if info.IsTest {
		r.SetPrivateAttr(IsTestFileAttr, true)
		r.SetAttr("testonly", true)
	} else {
		r.SetAttr("visibility", []string{"//visibility:public"})
	}

	if kind == "ts_library" {
		if g.cfg.NpmWorkspaceName != "npm" {
			r.SetAttr("compiler", fmt.Sprintf("@%s//@bazel/typescript/bin:tsc_wrapped", g.cfg.NpmWorkspaceName))
			r.SetAttr("node_modules", fmt.Sprintf("@%s//typescript:typescript__typings", g.cfg.NpmWorkspaceName))
		}

		if g.cfg.TsConfig != label.NoLabel {
			r.SetAttr("tsconfig", g.cfg.TsConfig.String())
		}

		r.SetAttr("module_name", g.packageName)
	} else if kind == "babel_library" {
		if g.cfg.BabelConfig != label.NoLabel {
			r.SetAttr("babel_config", g.cfg.BabelConfig.String())
		}

		if g.cfg.TsConfig != label.NoLabel {
			r.SetAttr("ts_config", g.cfg.TsConfig.String())
		}

		r.SetAttr("module_name", g.packageName)

		if info.IsTest {
			r.SetAttr("global_types", []string{"node", "jest"})
		}
	}

	imports := buildImports(g.packageName, info.Imports)
	r.SetPrivateAttr(config.GazelleImportsKey, imports)

	rules = append(rules, r)

	return rules
}

func (g *generator) generateProto(name string, pkg proto.Package) []*rule.Rule {
	if !g.protoMode.ShouldGenerateRules() {
		return nil
	}

	if len(pkg.Files) == 0 {
		return nil
	}

	ruleName := buildProtoLibraryName(name)
	imports := buildImportsFromMap(g.packageName, pkg.Imports)
	compilers := []string{"@brex_rules_js//proto:proto"}

	if pkg.HasServices {
		compilers = []string{"@brex_rules_js//proto:grpc"}
	}

	r := rule.NewRule("js_proto_library", ruleName)
	r.SetAttr("proto", ":"+name)
	r.SetAttr("visibility", []string{"//visibility:public"})
	r.SetAttr("compilers", compilers)
	r.SetPrivateAttr(config.GazelleImportsKey, imports)

	if g.packageName != g.cfg.WorkspacePath(g.rel) {
		r.SetAttr("module_name", g.packageName)
	}

	return []*rule.Rule{r}
}

func (g *generator) generateAsset(f string) []*rule.Rule {
	ruleName := fmt.Sprintf("asset-%s", f)

	r := rule.NewRule("webpack_asset", ruleName)
	r.SetAttr("srcs", []string{f})
	r.SetAttr("visibility", []string{"//visibility:public"})

	if g.packageName != g.cfg.WorkspacePath(g.rel) {
		r.SetAttr("module_name", g.packageName)
	}

	return []*rule.Rule{r}
}

func (g *generator) unifyPackage(allRules []*rule.Rule) []*rule.Rule {
	var rules []*rule.Rule

	ruleMap := map[string]*rule.Rule{}

	for _, r := range allRules {
		isTest, _ := r.PrivateAttr(IsTestFileAttr).(bool)

		if isTest || !MatchesAny(r.Kind(), "js_library", "ts_library", "babel_library", "apollo_library") {
			rules = append(rules, r)
			continue
		}

		if r.Kind() != "apollo_library" && g.cfg.PackageMode != PackageModeUnified {
			rules = append(rules, r)
			continue
		}

		grule, ok := ruleMap[r.Kind()]

		if !ok {
			if r.Kind() == "apollo_library" {
				r.SetName("apollo_default_library")
			} else {
				r.SetName("js_default_library")
			}

			ruleMap[r.Kind()] = r
			continue
		}

		srcs := grule.AttrStrings("srcs")
		srcs = append(srcs, r.AttrStrings("srcs")...)
		grule.SetAttr("srcs", srcs)

		impsRaw := r.PrivateAttr(config.GazelleImportsKey)
		if impsRaw != nil {
			imps := impsRaw.([]Import)
			gimp := grule.PrivateAttr(config.GazelleImportsKey).([]Import)
			gimp = append(gimp, imps...)
			grule.SetPrivateAttr(config.GazelleImportsKey, gimp)
		}
	}

	for _, v := range ruleMap {
		rules = append(rules, v)
	}

	return rules
}

func buildProtoLibraryName(name string) string {
	return strings.TrimSuffix(name, "_proto") + "_js_proto"
}

func buildImports(packageName string, imports []string) []Import {
	result := make([]Import, len(imports))

	for i, v := range imports {
		result[i] = Import{
			FromPackage: packageName,
			Import:      v,
		}
	}

	return result
}

func buildImportsFromMap(packageName string, imports map[string]bool) []Import {
	result := make([]Import, 0, len(imports))

	for imp := range imports {
		result = append(result, Import{
			FromPackage: packageName,
			Import:      imp,
		})
	}

	return result
}
