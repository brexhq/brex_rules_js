load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")
load("@brex_rules_js//internal/utils:collect.bzl", "collect_runtime")
load("@brex_rules_js//internal/utils:config.bzl", "get_config_entrypoint")
load("@brex_rules_js//internal/utils:roots.bzl", "compute_node_modules_root")
load("@brex_rules_js//internal/webpack:webpack_config.bzl", "WebpackConfig")

def get_module_roots(ctx, node_modules_root):
    base_path_mappings = ["%s" % p for p in [
        ".",
        ctx.configuration.genfiles_dir.path,
        ctx.configuration.bin_dir.path,
    ]]

    node_modules_mappings = []

    if node_modules_root:
        node_modules_mappings.append("/".join([p for p in [
            node_modules_root,
        ] if p]))

    return {
        "": node_modules_mappings,
        ctx.workspace_name: base_path_mappings,
    }

def build_options(ctx):
    workspace_root = "."

    inputs = []
    entrypoints = {}

    if ctx.attr.entrypoint:
        if ctx.attr.entrypoints:
            fail("entrypoint and entrypoints are mutually exclusive")

        entrypoints["main"] = ctx.file.entrypoint
    elif ctx.attr.entrypoints:
        if ctx.attr.entrypoint:
            fail("entrypoint and entrypoints are mutually exclusive")

        for target, name in ctx.attr.entrypoints.items():
            if len(target.files) != 1:
                fail("each entrypoint can only reference a single file")


            entrypoints[name] = target.files[0]
    else:
        fail("either entrypoint or entrypoints must be set")

    # Those will be loaded as code inside the compiler
    compiler_deps = []
    runtime_deps = []

    runtime_deps.extend(ctx.attr.data)

    if ctx.attr.config:
        config = get_config_entrypoint(
            ctx.attr.config,
            provider = WebpackConfig,
            rule_name = "webpack_config",
        )

        compiler_deps.append(ctx.attr.config)

        if WebpackConfig in ctx.attr.config:
            runtime_deps.extend(ctx.attr.config[WebpackConfig].runtime_deps)

    # Calculate roots
    node_modules_root = compute_node_modules_root(
        deps = runtime_deps,
    )

    module_roots = get_module_roots(ctx, node_modules_root)

    # Collect all deps
    compiler_deps = collect_runtime(compiler_deps)
    runtime_deps = collect_runtime(runtime_deps)

    # Calculate all inputs
    all_inputs = depset(direct = inputs, transitive = [
        compiler_deps,
        runtime_deps,
    ])

    return struct(
        inputs = all_inputs,
        config = config,
        entrypoints = entrypoints,
        root = workspace_root,
        node_modules_prefix = node_modules_root,
        module_roots = module_roots,
    )
