package js

import (
	"context"

	"github.com/bazelbuild/bazel-gazelle/language"
	"github.com/bazelbuild/bazel-gazelle/rule"
	"github.com/bazelbuild/rules_go/go/tools/bazel"
)

type JSLanguage struct {
	inspect *InspectWorker
}

func NewLanguage() language.Language {
	parser, err := bazel.Runfile("brex_rules_js/packages/inspect-server/inspect-server.sh")

	if err != nil {
		parser, err = bazel.Runfile("packages/inspect-server/inspect-server.sh")

		if err != nil {
			panic("language worker not found! make sure runfiles are set properly")
		}
	}

	worker, err := NewInspectWorker(context.Background(), parser)

	if err != nil {
		panic(err)
	}

	go (func() {
		err := worker.Start()

		if err != nil && err != context.Canceled {
			panic(err)
		}
	})()

	return &JSLanguage{inspect: worker}
}

func (s *JSLanguage) Kinds() map[string]rule.KindInfo {
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
				"module_name":  true,
				"module_root":  true,
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
				"module_name":  true,
				"module_root":  true,
				"global_types": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"js_proto_library": {
			MatchAttrs:    []string{"proto"},
			NonEmptyAttrs: map[string]bool{"proto": true},
			MergeableAttrs: map[string]bool{
				"deps":      true,
				"compilers": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"jest_node_test": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs":   true,
				"deps":   true,
				"config": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"eslint_test": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs":   true,
				"deps":   true,
				"config": true,
			},
			ResolveAttrs: map[string]bool{"deps": true},
		},
		"webpack_asset": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs": true,
			},
		},
		"apollo_library": {
			MatchAttrs: []string{"srcs"},
			NonEmptyAttrs: map[string]bool{
				"srcs": true,
			},
			MergeableAttrs: map[string]bool{
				"srcs":        true,
				"schema":      true,
				"module_name": true,
			},
		},
		"npm_repository_index": {
			MatchAttrs: []string{"module_name"},
			NonEmptyAttrs: map[string]bool{
				"module_name": true,
			},
			MergeableAttrs: map[string]bool{
				"module_name": true,
				"version":     true,
				"resolved":    true,
				"integrity":   true,
				"optional":    true,
				"dev_only":    true,
			},
		},
	}
}

func (s *JSLanguage) Loads() []rule.LoadInfo {
	return []rule.LoadInfo{
		{
			Name: "@brex_rules_js//:defs.bzl",
			Symbols: []string{
				"js_library",
				"jest_node_test",
				"js_proto_library",
				"eslint_test",
				"babel_library",
				"webpack_asset",
				"apollo_library",
				"apollo_schema",
				"npm_package_index",
			},
		},
		{
			Name:    "@npm//@bazel/typescript:index.bzl",
			Symbols: []string{"ts_library"},
		},
	}
}
