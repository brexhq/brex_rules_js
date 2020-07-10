load("@bazel_skylib//lib:shell.bzl", "shell")
load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")
load("@brex_rules_js//internal/utils:collect.bzl", "collect_runtime")
load("@brex_rules_js//internal/utils:config.bzl", "get_config_entrypoint")
load("@brex_rules_js//internal/utils:roots.bzl", "compute_node_modules_root", "get_module_mappings")
load("@brex_rules_js//internal/eslint:eslint_config.bzl", "EslintConfig")

CollectedInput = provider()

def _to_manifest_path(ctx, file):
    if file.short_path.startswith("../"):
        return file.short_path[3:]
    else:
        return ctx.workspace_name + "/" + file.short_path

def _format_module_root(root):
    name, path = root

    return "--module-root=%s:%s" % (name, path)

def _collect_input_aspect_impl(target, ctx):
    sources = []
    deps = []

    if hasattr(ctx.rule.attr, 'srcs'):
        for src in ctx.rule.attr.srcs:
            sources.append(src[DefaultInfo].files)

    if hasattr(ctx.rule.attr, 'deps'):
        deps.extend(ctx.rule.attr.deps)

    return [
        CollectedInput(
            sources = depset(transitive = sources),
            deps = deps,
        ),
    ]

_collect_input_aspect = aspect(
    implementation = _collect_input_aspect_impl,
)

def build_options(srcs, config, deps = []):
    collected_sources = []
    direct_inputs = []
    build_deps = []
    compiler_deps = []
    cfg = config[EslintConfig]

    for src in srcs:
        if CollectedInput in src:
            collected_sources.append(src[CollectedInput].sources)
            build_deps.extend(src[CollectedInput].deps)
        else:
            collected_sources.append(src[DefaultInfo].files)

    build_deps.extend(deps)
    compiler_deps.append(config)
    direct_inputs.append(cfg.package_json)

    # Calculate roots
    node_modules_root = compute_node_modules_root(build_deps + compiler_deps)
    module_roots = get_module_mappings(build_deps + compiler_deps)

    module_roots = [
        (root, path)
        for ((kind, root), path)
        in module_roots.items()
    ]

    # Collect all deps
    build_deps = collect_runtime(build_deps)
    compiler_deps = collect_runtime(compiler_deps)

    # Build depsets
    all_srcs = depset(transitive = collected_sources)

    build_inputs = depset(
        transitive = [all_srcs, build_deps]
    )

    compiler_inputs = depset(
        direct = direct_inputs,
        transitive = [compiler_deps]
    )

    return struct(
        sources = all_srcs,
        build_inputs = build_inputs,
        compiler_inputs = compiler_inputs,
        config = cfg.config,
        package_json = cfg.package_json,
        node_modules_root = node_modules_root,
        module_roots = module_roots,
    )

def _eslint_test_impl(ctx):
    options = build_options(
        srcs = ctx.attr.srcs,
        config = ctx.attr.config,
        deps = ctx.attr.deps,
    )

    all_inputs = depset(transitive = [options.build_inputs, options.compiler_inputs])

    status_file = ctx.actions.declare_file("%s.status" % ctx.label.name)
    diff_file = ctx.actions.declare_file("%s.diff" % ctx.label.name)

    # Required for worker mode
    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    if options.config:
        args.add("--config", options.config)

    if options.package_json:
        args.add("--package-json", options.package_json)

    args.add("--status-file", status_file)
    args.add("--diff-file", diff_file)
    args.add("--node-modules-root", options.node_modules_root)

    args.add_all(
        options.module_roots,
        map_each = _format_module_root,
        expand_directories = False,
        uniquify = True,
    )

    args.add_all(options.sources, expand_directories = True)

    ctx.actions.run(
        inputs = all_inputs,
        outputs = [status_file, diff_file],
        progress_message = "Running Eslint on target %s" % ctx.label,
        mnemonic = "Eslint",
        executable = ctx.executable._eslint,
        arguments = [args],
        use_default_shell_env = True,
        execution_requirements = {"supports-workers": "1"},
        env = {"COMPILATION_MODE": ctx.var["COMPILATION_MODE"]},
    )

    runner = ctx.actions.declare_file("%s_runner.sh" % ctx.label.name)
    runner_args = []

    ctx.actions.expand_template(
        template = ctx.file._runner_template,
        output = runner,
        is_executable = True,
        substitutions = {
            "__TMPL_STATUS": _to_manifest_path(ctx, status_file),
            "__TMPL_DIFF": _to_manifest_path(ctx, diff_file),
        },
    )

    runfiles = ctx.runfiles(
        files = ctx.files._bash_runfile_helpers + [status_file, diff_file],
    )

    return [
        DefaultInfo(
            files = depset(direct = [status_file, diff_file]),
            executable = runner,
            runfiles = runfiles,
        )
    ]

_eslint_test = rule(
    implementation = _eslint_test_impl,
    executable = True,
    test = True,
    attrs = {
        "srcs": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect, _collect_input_aspect],
        ),
        "deps": attr.label_list(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "config": attr.label(
            aspects = [node_modules_aspect],
            providers = [EslintConfig],
            mandatory = True,
        ),
        "_bash_runfile_helpers": attr.label(
            default = "@bazel_tools//tools/bash/runfiles",
        ),
        "_runner_template": attr.label(
            allow_single_file = True,
            default = "@brex_rules_js//internal/eslint:runner.sh",
        ),
        "_eslint": attr.label(
            executable = True,
            cfg = "target",
            default = "@brex_rules_js//packages/eslint-runner",
        ),
        "npm_workspace": attr.string(),
    }
)

def eslint_test(name, tags = [], **kwargs):
    _eslint_test(
        name = name,
        tags = tags + ["eslint_test"],
        **kwargs,
    )
