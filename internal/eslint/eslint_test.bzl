load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//internal/node:node.bzl", "nodejs_test")
load("@build_bazel_rules_nodejs//:providers.bzl", "JSNamedModuleInfo")

def eslint_test(
        name,
        srcs = [],
        deps = [],
        tags = [],
        expected_exit_code = 0,
        config = None,
        npm_package = None,
        npm_workspace= "npm",
        _eslint_entrypoint = "@brex_rules_js//internal/eslint:eslint_runner.js",
        **kwargs):

    all_data = []

    all_data += srcs
    all_data += deps
    all_data += [
        "@brex_rules_js//packages/resolver-bazel:index",
        "@brex_rules_js//packages/eslint-import-resolver:index",
        "@%s//eslint" % npm_workspace,
        "@%s//eslint-plugin-import" % npm_workspace,
        "@%s//resolve" % npm_workspace,
        "@%s//@typescript-eslint/eslint-plugin" % npm_workspace,
        "@%s//@typescript-eslint/parser" % npm_workspace,
    ]

    all_data += [Label("@build_bazel_rules_nodejs//third_party/github.com/bazelbuild/bazel/tools/bash/runfiles")]

    if config:
        all_data.append(config)

    if npm_package:
        all_data.append(npm_package)

    rooted_sources = ["$(rootpath %s)" % src for src in srcs]

    templated_args = [
        ["--package", "$(rootpath %s)" % npm_package] if npm_package else [],
        ["--config", "$(rootpath %s)" % config] if config else [],
        rooted_sources
    ]

    # Flatten
    templated_args = [x for sub in templated_args for x in sub]

    nodejs_test(
        name = name,
        data = all_data,
        entry_point = _eslint_entrypoint,
        templated_args = templated_args,
        testonly = 1,
        expected_exit_code = expected_exit_code,
        tags = tags + ["eslint_test"],
        **kwargs,
    )
