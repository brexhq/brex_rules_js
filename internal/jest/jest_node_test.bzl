load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//internal/node:node.bzl", "nodejs_test")
load("@build_bazel_rules_nodejs//:providers.bzl", "JSNamedModuleInfo")

def _devmode_js_sources_impl(ctx):
    direct = depset(
        transitive = [
            test[JSNamedModuleInfo].direct_sources
            for test in ctx.attr.libraries
        ]
    )

    sources = depset(
        transitive = [
            test[JSNamedModuleInfo].sources
            for test in ctx.attr.libraries
        ]
    )

    ctx.actions.write(ctx.outputs.manifest, "".join([
        f.short_path + "\n"
        for f in sources.to_list()
        if f.path.endswith(".js") or f.path.endswith(".mjs")
    ]))

    return [DefaultInfo(files = sources)]

"""Rule to get devmode js sources from deps.
Outputs a manifest file with the sources listed.
"""
_devmode_js_sources = rule(
    implementation = _devmode_js_sources_impl,
    attrs = {
        "libraries": attr.label_list(
            providers = [JSNamedModuleInfo],
        ),
    },
    outputs = {
        "manifest": "%{name}.MF",
    },
)

def jest_node_test(
        name,
        tests = [],
        tags = [],
        config = None,
        expected_exit_code = 0,
        npm_workspace = "npm",
        _jest_entrypoint = "@brex_rules_js//internal/jest:jest_runner.js",
        **kwargs):
    _devmode_js_sources(
        name = "%s_devmode_srcs" % name,
        libraries = tests,
        testonly = 1,
        tags = tags,
    )

    all_data = []

    all_data += tests
    all_data += [
        "@brex_rules_js//packages/resolver-bazel:index",
        "@brex_rules_js//packages/jest-bazel-resolver:index",
        "@%s//@jest/core" % npm_workspace,
        "@%s//jest-junit-reporter" % npm_workspace,
    ]

    all_data += [":%s_devmode_srcs.MF" % name, ":%s_devmode_srcs" % name]
    all_data += [Label("@build_bazel_rules_nodejs//third_party/github.com/bazelbuild/bazel/tools/bash/runfiles")]

    if config:
        all_data.append(config)

    templated_args = [
        ["--manifest", "$(rootpath :%s_devmode_srcs.MF)" % name],
        ["--config", "$(rootpath %s)" % config] if config else [],
        kwargs.pop("templated_args", [])
    ]

    # Flatten
    templated_args = [x for sub in templated_args for x in sub]

    nodejs_test(
        name = name,
        data = all_data,
        entry_point = _jest_entrypoint,
        templated_args = templated_args,
        testonly = 1,
        expected_exit_code = expected_exit_code,
        tags = tags + ["jest_test"],
    )
