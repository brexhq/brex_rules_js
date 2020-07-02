load("@bazel_skylib//lib:paths.bzl", "paths")
load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")

JsProtoCompiler = provider(
    doc = "Information and dependencies needed to generate JS code from protos",
)

def js_proto_compile(ctx, compiler, protos, imports):
    srcs = []
    proto_paths = {}
    desc_sets = []
    outpath = None

    for proto in protos:
        desc_sets.append(proto.transitive_descriptor_sets)

        for src in proto.check_deps_sources.to_list():
            path = proto_path(src, proto)

            if path in proto_paths:
                if proto_paths[path] != src:
                    fail("proto files {} and {} have the same import path, {}".format(
                        src.path,
                        proto_paths[path].path,
                        path,
                    ))

                continue

            proto_paths[path] = src

            file_name = src.basename[:-len(src.extension) - 1]

            srcs.extend([
                ctx.actions.declare_file(file_name + suffix)
                for suffix
                in compiler.suffixes
            ])

    output_dir = ctx.var["BINDIR"]
    transitive_descriptor_sets = depset(direct = [], transitive = desc_sets)
    tools = [compiler.internal.protoc, compiler.internal.js_protoc]

    # Require for worker mode
    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    for name in compiler.internal.plugins:
        plugin = compiler.internal.plugins[name]

        if plugin.executable:
            info = plugin.executable[DefaultInfo].files_to_run

            tools.append(info)
            args.add("--plugin", "%s:%s" % (name, info.executable.path))
        else:
            args.add("--plugin", name)

        if plugin.options != "":
            args.add("--plugin-option=%s:%s" % (name, plugin.options))

    args.add("--output", output_dir)
    args.add("--protoc", compiler.internal.protoc.executable)
    args.add_all(transitive_descriptor_sets, before_each = "--descriptor-set")
    args.add_all(srcs, before_each = "--expected")
    args.add_all(imports, before_each = "--import-map")
    args.add_all(proto_paths.keys())

    ctx.actions.run(
        tools = tools,
        inputs = depset(transitive = [transitive_descriptor_sets]),
        outputs = srcs,
        progress_message = "Generating into %s" % srcs[0].dirname,
        mnemonic = "JsProtocGen",
        executable = compiler.internal.js_protoc,
        arguments = [args],
        use_default_shell_env = True,
        execution_requirements = {"supports-workers": "1"},
        env = {"COMPILATION_MODE": ctx.var["COMPILATION_MODE"]},
    )

    return srcs

def _js_proto_compiler_impl(ctx):
    external = {}

    for key in ctx.attr.plugins:
        external[ctx.attr.plugins[key]] = key

    plugin_names = []
    plugin_names.extend(ctx.attr.builtin_plugins)
    plugin_names.extend(external.keys())

    plugins = {}

    for name in plugin_names:
        plugins[name] = struct(
            executable = external.get(name, None),
            options = ctx.attr.options.get(name, ""),
        )

    return [
        JsProtoCompiler(
            compile = js_proto_compile,
            runtime_deps = ctx.attr.runtime_deps,
            suffixes = ctx.attr.suffixes,
            internal = struct(
                plugins = plugins,
                protoc = ctx.attr._protoc.files_to_run,
                js_protoc = ctx.attr._js_protoc.files_to_run,
            ),
        ),
    ]

js_proto_compiler = rule(
    implementation = _js_proto_compiler_impl,
    attrs = {
        "builtin_plugins": attr.string_list(),
        "plugins": attr.label_keyed_string_dict(
            default = {},
            allow_empty = True,
            cfg = "host",
        ),
        "options": attr.string_dict(
            allow_empty = True,
            default = {},
        ),
        "suffixes": attr.string_list(
            allow_empty = False,
            default = ["_pb.js"],
        ),
        "runtime_deps": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "_protoc": attr.label(
            executable = True,
            cfg = "host",
            default = "@com_google_protobuf//:protoc",
            allow_files = True,
        ),
        "_js_protoc": attr.label(
            executable = True,
            cfg = "host",
            default = "@brex_rules_js//packages/js-protoc",
            allow_files = True,
        ),
    }
)

def proto_path(src, proto):
    """proto_path returns the string used to import the proto. This is the proto
    source path within its repository, adjusted by import_prefix and
    strip_import_prefix.
    Args:
        src: the proto source File.
        proto: the ProtoInfo provider.
    Returns:
        An import path string.
    """

    if proto.proto_source_root == ".":
        # true if proto sources were generated
        prefix = src.root.path + "/"
    elif proto.proto_source_root.startswith(src.root.path):
        # sometimes true when import paths are adjusted with import_prefix
        prefix = proto.proto_source_root + "/"
    else:
        # usually true when paths are not adjusted
        prefix = paths.join(src.root.path, proto.proto_source_root) + "/"

    if not src.path.startswith(prefix):
        # sometimes true when importing multiple adjusted protos
        return src.path

    return src.path[len(prefix):]
