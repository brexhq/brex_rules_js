load("@bazel_skylib//lib:paths.bzl", "paths")
load("@build_bazel_rules_nodejs//:providers.bzl", "DeclarationInfo", "LinkablePackageInfo", "js_named_module_info", "node_modules_aspect", "run_node")
load("@brex_rules_js//internal/utils:collect.bzl", "collect_declarations", "collect_runtime")
load("@brex_rules_js//internal/utils:roots.bzl", "compute_node_modules_root", "module_mappings_aspect")
load("@brex_rules_js//internal/utils:config.bzl", "get_config_entrypoint")
load("@brex_rules_js//internal/babel:babel_config.bzl", "BabelConfig")

def _filter_ts_input(f):
    return f.extension in ["js", "jsx", "ts", "tsx", "json"]

def _get_module_roots(ctx, node_modules_root):
    base_path_mappings = ["%s/*" % p for p in [
        ".",
        ctx.configuration.genfiles_dir.path,
        ctx.configuration.bin_dir.path,
    ]]

    node_modules_mappings = []

    node_modules_mappings.append("/".join([p for p in [
        node_modules_root,
        "*",
    ] if p]))

    # TypeScript needs to look up ambient types from a 'node_modules'
    # directory, but when Bazel manages the dependencies, this directory
    # isn't in the project so TypeScript won't find it.
    # We can add it to the path mapping to make this lookup work.
    # See https://github.com/bazelbuild/rules_typescript/issues/179
    node_modules_mappings.append("/".join([p for p in [
        node_modules_root,
        "@types",
        "*",
    ] if p]))

    return {
        "*": node_modules_mappings,
        ctx.workspace_name + "/*": base_path_mappings,
    }


def _get_outputs(ctx):
    js_outputs = []
    declaration_outputs = []

    for src in ctx.files.srcs:
        js = paths.replace_extension(src.basename, ".js")
        js_outputs.append(ctx.actions.declare_file(js))

        if src.extension == "ts" or src.extension == "tsx":
            dts = paths.replace_extension(src.basename, ".d.ts")
            declaration_outputs.append(ctx.actions.declare_file(dts))

    return struct(
        sources = js_outputs,
        declarations = declaration_outputs,
    )

def _babel_library_impl(ctx):
    workspace_root = "."

    node_modules_root = compute_node_modules_root(
        deps = ctx.attr.deps,
        node_modules = ctx.attr.node_modules,
    )

    resolution_roots = [
        workspace_root,
        paths.join(workspace_root, ctx.configuration.bin_dir.path),
        paths.join(workspace_root, ctx.configuration.genfiles_dir.path),
    ]

    type_roots = ["/".join([p for p in [
        workspace_root,
        node_modules_root,
        "@types",
    ] if p])]

    outputs = _get_outputs(ctx)
    declaration_deps = collect_declarations(deps = ctx.attr.deps, node_modules = ctx.attr.node_modules)
    module_roots = _get_module_roots(ctx, node_modules_root)

    # Those will be loaded as code inside the compiler
    runtime_deps = []

    if ctx.attr.babel_config:
        runtime_deps.append(ctx.attr.babel_config)

    if ctx.attr.ts_config:
        runtime_deps.append(ctx.attr.ts_config)

    runtime_deps = collect_runtime(deps = runtime_deps)

    # Calculate inputs
    ts_deps = collect_runtime(
        deps = ctx.attr.deps,
        node_modules = ctx.attr.node_modules,
        filter = _filter_ts_input,
    )

    transitive_declarations = depset(
        direct = outputs.declarations,
        transitive = [declaration_deps.transitive_declarations],
    )

    all_inputs = depset(
        direct = ctx.files.srcs,
        transitive = [
            ts_deps.sources,
            ts_deps.node_modules,
            runtime_deps.sources,
            declaration_deps.transitive_declarations,
        ],
    )

    all_outputs = outputs.sources + outputs.declarations

    # Require for worker mode
    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    if ctx.attr.babel_config != None:
        babel_config = get_config_entrypoint(
            ctx.attr.babel_config,
            provider = BabelConfig,
            rule_name = "babel_config",
        )

        args.add("--babel-config", babel_config)

    if ctx.file.ts_config != None:
        args.add("--ts-config", ctx.file.ts_config)

    args.add("--root", workspace_root)
    args.add("--target", str(ctx.label))
    args.add("--output", ctx.configuration.bin_dir.path)
    args.add("--node-modules-prefix", node_modules_root)

    for root, root_paths in module_roots.items():
        for path in root_paths:
            args.add("--module-root", "%s:%s" % (root, path))

    args.add_all(type_roots, before_each = "--type-roots", )
    args.add_all(resolution_roots, before_each = "--resolution-root")
    args.add_all(declaration_deps.transitive_declarations, before_each = "--declaration")
    args.add_all(ctx.files.srcs)

    ctx.actions.run(
        inputs = all_inputs,
        outputs = all_outputs,
        progress_message = "Building Babel target %s" % ctx.label,
        mnemonic = "CompileBabel",
        executable = ctx.executable._babel_tsc,
        arguments = [args],
        use_default_shell_env = True,
        execution_requirements = {"supports-workers": "1"},
        env = {"COMPILATION_MODE": ctx.var["COMPILATION_MODE"]},
    )

    files_depset = depset(direct = outputs.sources + outputs.declarations)

    providers = [
        DefaultInfo(
            files = files_depset,
            runfiles = ctx.runfiles(
                collect_default = True,
                collect_data = True,
            ),
        ),
        DeclarationInfo(
            declarations = depset(direct = outputs.declarations),
            transitive_declarations = transitive_declarations,
            type_blacklisted_declarations = declaration_deps.type_blacklisted_declarations,
        ),
        js_named_module_info(
            sources = depset(direct = outputs.sources),
            deps = ctx.attr.deps,
        ),
    ]

    if ctx.attr.package_name:
        path = "/".join([p for p in [ctx.bin_dir.path, ctx.label.workspace_root, ctx.label.package] if p])

        providers.append(LinkablePackageInfo(
            package_name = ctx.attr.package_name,
            path = path,
            files = files_depset,
        ))

    return providers

babel_library = rule(
    implementation = _babel_library_impl,
    attrs = {
        "srcs": attr.label_list(
            allow_files = True,
        ),
        "deps": attr.label_list(
            aspects = [node_modules_aspect, module_mappings_aspect],
        ),
        "package_name": attr.string(),
        "babel_config": attr.label(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
        "ts_config": attr.label(
            allow_single_file = True,
            aspects = [node_modules_aspect],
        ),
        "node_modules": attr.label(
            default = "@npm//typescript:typescript__typings",
        ),
        "_babel_tsc": attr.label(
            executable = True,
            cfg = "host",
            default = "@brex_rules_js//packages/babel-tsc",
        ),
    }
)
