load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")
load("@brex_rules_js//internal/webpack:webpack.bzl", "build_options")

def _webpack_devserver_impl(ctx):
    options = build_options(ctx)

    # Require for worker mode
    args = []

    if options.config != None:
        args.extend(["--config", options.config.path])

    for name, entry in options.entrypoints.items():
        args.extend(["--entrypoint", name + ":" + entry.path])

    args.extend(["--root", options.root])
    args.extend(["--node-modules-prefix", options.node_modules_prefix])

    for root, root_paths in options.module_roots.items():
        for path in root_paths:
            args.extend(["--module-root", "%s:%s" % (root, path)])

    devserver = ctx.attr._webpack_devserver[DefaultInfo]
    launcher = ctx.actions.declare_file("%s_devserver.sh" % ctx.label.name)

    ctx.actions.expand_template(
        template = ctx.file._launcher,
        output = launcher,
        is_executable = True,
        substitutions ={
            "{DEVSERVER}": devserver.files_to_run.executable.short_path,
            "{DEVSERVER_ARGS}": " ".join(args),
        },
    )

    runfiles = ctx.runfiles(transitive_files = options.inputs)
    runfiles = runfiles.merge(devserver.default_runfiles)
    
    return [
        DefaultInfo(
            executable = launcher,
            runfiles = runfiles,
        ),
    ]

_webpack_devserver = rule(
    implementation = _webpack_devserver_impl,
    executable = True,
    attrs = {
        "entrypoint": attr.label(
            allow_single_file = True,
        ),
        "entrypoints": attr.label_keyed_string_dict(),
        "data": attr.label_list(
            allow_files = True,
            default = [],
        ),
        "config": attr.label(
            allow_single_file = True,
            aspects = [node_modules_aspect]
        ),
        "_webpack_devserver": attr.label(
            executable = True,
            cfg = "target",
            default = "@brex_rules_js//packages/webpack-frontend:webpack-devserver",
        ),
        "_bash_runfile_helpers": attr.label(
            default = "@bazel_tools//tools/bash/runfiles",
        ),
        "_launcher": attr.label(
            allow_single_file = True,
            default = "@brex_rules_js//internal/webpack:devserver_launcher.sh",
        ),
    }
)

def webpack_devserver(tags = [], **kwargs):
    _webpack_devserver(
        tags = tags + ["ibazel_notify_changes"],
        **kwargs,
    )
