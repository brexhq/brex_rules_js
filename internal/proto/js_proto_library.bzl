load("@rules_proto//proto:defs.bzl", "ProtoInfo")
load("@bazel_skylib//lib:paths.bzl", "paths")
load("@build_bazel_rules_nodejs//:providers.bzl", "js_named_module_info", "node_modules_aspect")
load("@brex_rules_js//internal/proto:js_proto_compiler.bzl", "JsProtoCompiler", "proto_path")
load("@brex_rules_js//internal/utils:collect.bzl", "declaration_info", "merged_npm_package_info")

JsProtoImports = provider()

def get_imports(ctx, label, rule):
    proto_deps = []

    importpath = label.workspace_name

    if not importpath:
        importpath = ctx.workspace_name

    if label.package != "":
        importpath += "/" + label.package

    if rule.attr.compiler:
        compilers = [rule.attr.compiler]
    else:
        compilers = rule.attr.compilers

    if hasattr(rule.attr, "proto") and rule.attr.proto and ProtoInfo in rule.attr.proto:
        proto_deps = [rule.attr.proto]
    elif hasattr(rule.attr, "protos"):
        proto_deps = [d for d in rule.attr.protos if ProtoInfo in d]
    else:
        proto_deps = []

    suffixes = [
        suffix
        for compiler in compilers
        for suffix in compiler[JsProtoCompiler].suffixes
    ]

    direct = dict()
    for dep in proto_deps:
        for src in dep[ProtoInfo].check_deps_sources.to_list():
            pp = proto_path(src, dep[ProtoInfo])
            pp = paths.replace_extension(pp, "")
            file_name = paths.replace_extension(src.basename, "")

            for suffix in suffixes:
                source = "%s%s" % (pp, suffix)
                target = "%s/%s%s" % (importpath, file_name, suffix)
                direct["{}:{}".format(source, target)] = True

    deps = getattr(rule.attr, "deps", [])

    transitive = [
        dep[JsProtoImports].imports
        for dep in deps
        if JsProtoImports in dep
    ]

    return depset(direct = direct.keys(), transitive = transitive)

def _js_proto_aspect_impl(target, ctx):
    imports = get_imports(ctx, ctx.label, ctx.rule)
    return [JsProtoImports(imports = imports)]

_js_proto_aspect = aspect(
    _js_proto_aspect_impl,
    attr_aspects = ["deps"],
)

def _js_proto_library_impl(ctx):
    if ctx.attr.compiler:
        compilers = [ctx.attr.compiler]
    else:
        compilers = ctx.attr.compilers

    if ctx.attr.proto:
        if ctx.attr.protos:
            fail("Either proto or protos (non-empty) argument must be specified, but not both")
        proto_deps = [ctx.attr.proto]
    else:
        if not ctx.attr.protos:
            fail("Either proto or protos (non-empty) argument must be specified")
        proto_deps = ctx.attr.protos

    srcs = []
    deps = []
    protos = [d[ProtoInfo] for d in proto_deps]
    imports = get_imports(ctx, ctx.label, ctx)

    deps.extend(ctx.attr.deps)

    for c in compilers:
        compiler = c[JsProtoCompiler]

        srcs.extend(compiler.compile(
            ctx,
            compiler = compiler,
            protos = protos,
            imports = imports,
        ))

        deps.extend(compiler.runtime_deps)

    js_sources = [
        src
        for src in srcs
        if src.extension == "js"
    ]

    ts_sources = [
        src
        for src in srcs
        if src.extension == "ts"
    ]

    return [
        DefaultInfo(
            files = depset(direct = ts_sources),
            runfiles = ctx.runfiles(
                collect_default = True,
                collect_data = True,
            ),
        ),
        declaration_info(
            declarations = ts_sources,
            deps = deps,
        ),
        js_named_module_info(
            sources = depset(direct = js_sources),
            deps = deps,
        ),
    ] + merged_npm_package_info(deps = deps)

js_proto_library = rule(
    _js_proto_library_impl,
    attrs = {
        "proto": attr.label(providers = [ProtoInfo]),
        "protos": attr.label_list(
            providers = [ProtoInfo],
            default = [],
        ),
        "deps": attr.label_list(
            aspects = [node_modules_aspect, _js_proto_aspect],
        ),
        "compiler": attr.label(providers = [JsProtoCompiler]),
        "compilers": attr.label_list(
            providers = [JsProtoCompiler],
            default = ["@brex_rules_js//proto:proto"],
        ),
    },
)
