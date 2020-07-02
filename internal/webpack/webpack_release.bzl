load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")
load("@brex_rules_js//internal/webpack:webpack.bzl", "build_options")

def _webpack_release_impl(ctx):
    options = build_options(ctx)
    output = ctx.actions.declare_directory(ctx.label.name)

    # Require for worker mode
    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    if options.config != None:
        args.add("--config", options.config)

    for name, entry in options.entrypoints.items():
        args.add("--entrypoint", entry, format = name + ":%s")

    args.add("--root", options.root)
    args.add("--output", output.path)
    args.add("--node-modules-prefix", options.node_modules_prefix)

    for root, root_paths in options.module_roots.items():
        for path in root_paths:
            args.add("--module-root", "%s:%s" % (root, path))

    ctx.actions.run(
        inputs = options.inputs,
        outputs = [output],
        progress_message = "Building Webpack target %s" % ctx.label,
        mnemonic = "Webpack",
        executable = ctx.executable._webpack_frontend,
        arguments = [args],
        use_default_shell_env = True,
        execution_requirements = {"supports-workers": "1"},
        env = {"COMPILATION_MODE": ctx.var["COMPILATION_MODE"]},
    )

    return [
        DefaultInfo(
            files = depset(direct = [output]),
        ),
    ]

webpack_release = rule(
    implementation = _webpack_release_impl,
    attrs = {
        "entrypoint": attr.label(
            allow_single_file = True,
        ),
        "entrypoints": attr.label_keyed_string_dict(
        ),
        "data": attr.label_list(
            allow_files = True,
            default = [],
        ),
        "config": attr.label(
            allow_single_file = True,
            aspects = [node_modules_aspect]
        ),
        "_webpack_frontend": attr.label(
            executable = True,
            cfg = "host",
            default = "@brex_rules_js//packages/webpack-frontend",
        ),
    }
)
