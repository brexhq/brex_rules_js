load("@bazel_skylib//lib:paths.bzl", "paths")
load("@build_bazel_rules_nodejs//:providers.bzl", "DeclarationInfo", "LinkablePackageInfo", "js_named_module_info", "node_modules_aspect")
load("@brex_rules_js//internal/utils:collect.bzl", "declaration_info")

def _js_library(ctx):
    output_dir = paths.join(ctx.bin_dir.path, ctx.label.workspace_root, ctx.label.package)
    sources = []

    for src in ctx.files.srcs:
        path = src.basename

        if ctx.attr.module_root:
            path = paths.relativize(ctx.attr.module_root, path)

        js = ctx.actions.declare_file(path)
        ctx.actions.symlink(output = js, target_file = src)
        sources.append(js)

    sources_depset = depset(direct = sources)

    providers = [
        DefaultInfo(
            files = sources_depset,
            runfiles = ctx.runfiles(
                collect_default = True,
                collect_data = True,
            ),
        ),
        declaration_info(
            declarations = [],
            deps = ctx.attr.deps,
        ),
        js_named_module_info(
            sources = sources_depset,
            deps = ctx.attr.deps,
        ),
    ]

    if ctx.attr.module_name:
        providers.extend([
            LinkablePackageInfo(
                package_name = ctx.attr.module_name,
                path = output_dir,
                files = sources_depset,
            ),
        ])

    return providers

js_library = rule(
    implementation = _js_library,
    attrs = {
        "srcs": attr.label_list(
            allow_files = [".js"],
            aspects = [node_modules_aspect],
        ),
        "deps": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "data": attr.label_list(
            allow_files = True,
        ),
        "module_name": attr.string(),
        "module_root": attr.string(),
    },
)
