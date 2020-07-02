load("@build_bazel_rules_nodejs//:providers.bzl", "DeclarationInfo", "js_named_module_info", "node_modules_aspect")
load("@brex_rules_js//internal/utils:collect.bzl", "declaration_info")

def _js_library(ctx):
    return [
        DefaultInfo(
            files = depset(direct = ctx.files.srcs),
            runfiles = ctx.runfiles(
                collect_default = True,
                collect_data = True,
            ),
        ),
        declaration_info(
            direct = [],
            deps = ctx.attr.deps,
        ),
        js_named_module_info(
            sources = ctx.files.srcs,
            deps = ctx.attr.deps,
        ),
    ]

js_library = rule(
    implementation = _js_library,
    attrs = {
        "srcs": attr.label_list(
            allow_files = [".js"],
        ),
        "deps": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "data": attr.label_list(
            allow_files = True,
        )
    },
)
