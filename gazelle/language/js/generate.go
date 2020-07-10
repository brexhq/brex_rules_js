package js

import (
	"context"
	"fmt"
	"log"
	"path"
	"strings"

	"github.com/bazelbuild/bazel-gazelle/config"
	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/language/proto"
	"github.com/bazelbuild/bazel-gazelle/rule"
	"golang.org/x/sync/errgroup"
)

const IsTestFileAttr = "is_test_file"

type partialGenerateResult struct {
	rules     []*rule.Rule
	empty     []*rule.Rule
	usedFiles []string
}

func (s *JSLanguage) GenerateRules(args language.GenerateArgs) language.GenerateResult {
	var rules []*rule.Rule
	var empty []*rule.Rule
	var usedFiles []string

	c := args.Config
	cfg := GetConfig(c)
	protoMode := GetProtoMode(c)
	packageName := buildPackageName(cfg, args.Rel, nil)

	g := &generator{
		cfg:         cfg,
		rel:         args.Rel,
		dir:         args.Dir,
		protoMode:   protoMode,
		packageName: packageName,
	}

	for _, other := range args.OtherGen {
		if other.Kind() != "proto_library" {
			continue
		}

		pkg := other.PrivateAttr(proto.PackageKey).(proto.Package)
		rules = append(rules, g.generateProto(other.Name(), pkg)...)
	}

	ctx := context.Background()
	eg, _ := errgroup.WithContext(ctx)

	allFiles := append(args.RegularFiles, args.GenFiles...)
	results := make([]partialGenerateResult, len(allFiles))

	for i := range allFiles {
		// We need a copy so we can go into the goroutine
		idx := i
		f := allFiles[i]

		// We go in parallel as extracting file info is quite heavy
		eg.Go(func() error {
			if strings.HasPrefix(f, ".") || HasAnySuffix(f, IgnoredExtensions...) {
				return nil
			}

			if cfg.IsCode(f) {
				info, err := s.inspect.InspectCode(path.Join(args.Dir, f))

				if err != nil {
					return fmt.Errorf("error processing %s:%s: %s", args.Rel, f, err)
				}

				results[idx].rules = append(rules, g.generateLibrary(info)...)
				results[idx].usedFiles = append(usedFiles, f)
			} else if cfg.IsAsset(f) {
				results[idx].rules = append(rules, g.generateAsset(f)...)
				results[idx].usedFiles = append(usedFiles, f)
			}

			return nil
		})
	}

	err := eg.Wait()

	if err != nil {
		log.Printf("%s", err)
	}

	for _, r := range results {
		rules = append(rules, r.rules...)
		empty = append(empty, r.empty...)
		usedFiles = append(usedFiles, r.usedFiles...)
	}

	rules = g.unifyPackage(rules)

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
		"webpack_asset":  true,
	})...)

	for _, r := range rules {
		res.Gen = append(res.Gen, r)
		res.Imports = append(res.Imports, r.PrivateAttr(config.GazelleImportsKey))
	}

	return res
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

