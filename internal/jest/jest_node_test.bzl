load("@bazel_skylib//lib:shell.bzl", "shell")
load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")
load("@brex_rules_js//internal/utils:collect.bzl", "collect_runtime")
load("@brex_rules_js//internal/utils:config.bzl", "get_config_entrypoint")
load("@brex_rules_js//internal/utils:roots.bzl", "compute_node_modules_root", "get_module_mappings")
load("@brex_rules_js//internal/jest:jest_config.bzl", "JestConfig")

def _jest_test_impl(ctx):
    build_deps = []
    compiler_deps = []

    build_deps.extend(ctx.attr.srcs)
    build_deps.extend(ctx.attr.deps)

    if ctx.attr.config:
        cfg = ctx.attr.config[JestConfig]

        compiler_deps.append(ctx.attr.config)
        build_deps.extend(cfg.runtime_deps)

    # Collect all deps
    build_deps = collect_runtime(build_deps)
    compiler_deps = collect_runtime(compiler_deps)
    all_inputs = depset(transitive = [build_deps, compiler_deps])

    # Compile manifest
    manifest = ctx.actions.declare_file("%s.MF" % ctx.label.name)

    ctx.actions.write(
        output = manifest,
        content = "\n".join([
            f.short_path
            for f in build_deps.to_list()
        ])
    )

    # Build args
    args = []

    if ctx.attr.config:
        args.extend(["--config", ctx.attr.config[JestConfig].config.short_path])

    args.extend([
        src.short_path
        for src
        in ctx.files.srcs
    ])

    # Create runner script
    jest = ctx.attr._jest[DefaultInfo]
    runner = ctx.actions.declare_file("%s_runner.sh" % ctx.label.name)

    ctx.actions.expand_template(
        template = ctx.file._runner_template,
        output = runner,
        is_executable = True,
        substitutions = {
            "__TMPL_CMD": shell.quote(jest.files_to_run.executable.short_path),
            "__TMPL_ARGS": " ".join([shell.quote(x) for x in args])
        },
    )

    runfiles = ctx.runfiles(
        files = ctx.files._bash_runfile_helpers + [manifest],
        transitive_files = all_inputs,
    )

    runfiles = runfiles.merge(jest.default_runfiles)

    return (
        DefaultInfo(
            executable = runner,
            runfiles = runfiles,
        )
    )

_jest_test = rule(
    implementation = _jest_test_impl,
    executable = True,
    test = True,
    attrs = {
        "srcs": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "deps": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "config": attr.label(
            providers = [JestConfig],
            aspects = [node_modules_aspect]
        ),
        "_bash_runfile_helpers": attr.label(
            default = "@bazel_tools//tools/bash/runfiles",
        ),
        "_runner_template": attr.label(
            allow_single_file = True,
            default = "@brex_rules_js//internal/jest:runner.sh",
        ),
        "_jest": attr.label(
            executable = True,
            cfg = "target",
            default = "@brex_rules_js//packages/jest-runner",
        ),
        "npm_workspace": attr.string(),
    }
)

def jest_node_test(name, tags = [], **kwargs):
    _jest_test(
        name = name,
        tags = tags + ["jest_test"],
        **kwargs,
    )
