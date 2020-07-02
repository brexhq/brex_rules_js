package js

import (
	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/rule"
)

type JSLanguage struct {
}

func NewLanguage() language.Language {
	return &JSLanguage{}
}

func (js *JSLanguage) Kinds() map[string]rule.KindInfo {
	return map[string]rule.KindInfo{
		"js_library": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs": true,
				"deps": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"ts_library": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs":         true,
				"deps":         true,
				"compiler":     true,
				"node_modules": true,
				"tsconfig":     true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"babel_library": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs":         true,
				"deps":         true,
				"ts_config":    true,
				"babel_config": true,
				"package_name": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"js_proto_library": {
			MatchAttrs:      []string{"proto"},
			NonEmptyAttrs:   map[string]bool{"proto": true},
			SubstituteAttrs: map[string]bool{"proto": true},
			MergeableAttrs: map[string]bool{
				"deps":      true,
				"compilers": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"jest_node_test": {
			MatchAttrs: []string{"tests"},
			NonEmptyAttrs: map[string]bool{
				"tests": true,
			},
			MergeableAttrs: map[string]bool{
				"tests":         true,
				"deps":          true,
				"npm_workspace": true,
				"config":        true,
			},
			SubstituteAttrs: map[string]bool{"tests": true},
			ResolveAttrs:    map[string]bool{"deps": true},
		},
		"eslint_test": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs":          true,
				"deps":          true,
				"npm_package":   true,
				"npm_workspace": true,
				"config":        true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
	}
}

func (s *JSLanguage) Loads() []rule.LoadInfo {
	return []rule.LoadInfo{
		{
			Name:    "@brex_rules_js//:defs.bzl",
			Symbols: []string{"js_library", "jest_node_test", "js_proto_library", "eslint_test", "babel_library"},
		},
		{
			Name:    "@npm_bazel_typescript//:index.bzl",
			Symbols: []string{"ts_library"},
		},
	}
}
