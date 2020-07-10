load("@bazel_skylib//lib:paths.bzl", "paths")
load("@bazel_skylib//lib:dicts.bzl", "dicts")
load("@bazel_skylib//lib:structs.bzl", "structs")
load("@build_bazel_rules_nodejs//:providers.bzl", "DeclarationInfo", "LinkablePackageInfo", "js_named_module_info", "node_modules_aspect", "run_node")
load("@brex_rules_js//internal/utils:collect.bzl", "collect_declarations", "collect_runtime")
load("@brex_rules_js//internal/utils:roots.bzl", "compute_node_modules_root", "module_mappings_aspect", "get_module_mappings", "DeclarationPackageInfo")
load("@brex_rules_js//internal/utils:config.bzl", "get_config_entrypoint")
load("@brex_rules_js//internal/babel:babel_config.bzl", "BabelConfig")

_BABEL_DEFAULT_VALUES = {
    "srcs": [],
    "deps": [],
}

BABEL_DEFAULT_ATTRS = {
    "srcs": attr.label_list(
        allow_files = True,
    ),
    "deps": attr.label_list(
        aspects = [node_modules_aspect, module_mappings_aspect],
    ),
    "module_name": attr.string(),
    "module_root": attr.string(),
    "global_types": attr.string_list(
        default = ["node"],
    ),
    "babel_config": attr.label(
        allow_files = True,
        aspects = [node_modules_aspect],
    ),
    "ts_config": attr.label(
        allow_single_file = True,
        aspects = [node_modules_aspect],
    ),
}

BABEL_REQUIRED_ATTRS = {
    "_stdlib": attr.label_list(
        default = ["@npm//typescript:typescript__typings"],
        aspects = [node_modules_aspect, module_mappings_aspect],
    ),
    "_babel_tsc": attr.label(
        executable = True,
        cfg = "host",
        default = "@brex_rules_js//packages/babel-tsc",
    ),
}

def _format_module_root(root):
    name, paths = root

    return ["--module-root=%s:%s" % (name, path) for path in paths]

def _filter_ts_input(f):
    return f.extension in ["js", "jsx", "ts", "tsx", "json"]

def _mappings_for(root, path):
    return [
        ("%s" % root, ["%s" % path]),
        ("%s/*" % root, ["%s/*" % path]),
    ]

def _get_module_roots(ctx, node_modules_root, deps):
    mappings = []
    dep_mapping = get_module_mappings(deps)
    
    for (kind, root), path in dep_mapping.items():
        if kind != "source" and kind != "declaration":
            continue

        mappings.extend(_mappings_for(root, path))

    base_path_mappings = ["%s/*" % p for p in [
        ctx.configuration.genfiles_dir.path,
        ctx.configuration.bin_dir.path,
        ".",
    ]]

    node_modules_mappings = [
        paths.join(node_modules_root, "*"),
        paths.join(node_modules_root, "@types", "*"),
    ]

    # This should be in evaluation order
    return mappings + [
        (ctx.workspace_name + "/*", base_path_mappings),
        ("*", node_modules_mappings),
    ]

def _module_resolution_config(ctx, attr, workspace_root, deps):
    if attr.module_name:
        module_name = attr.module_name
        requires_mapping = True
    else:
        module_name = paths.join(ctx.workspace_name, ctx.label.package)
        requires_mapping = False

    node_modules_root = compute_node_modules_root(deps)

    resolution_roots = [
        workspace_root,
        paths.join(workspace_root, ctx.configuration.bin_dir.path),
        paths.join(workspace_root, ctx.configuration.genfiles_dir.path),
    ]

    type_roots = [
        paths.join(workspace_root, node_modules_root, "@types"),
    ]

    module_roots = _get_module_roots(ctx, node_modules_root, deps)

    return struct(
        module_name = module_name,
        node_modules_root = node_modules_root,
        resolution_roots = resolution_roots,
        type_roots = type_roots,
        global_types = ctx.attr.global_types,
        module_roots = module_roots,
        requires_mapping = requires_mapping,
    )

def _get_outputs(ctx, attr, srcs):
    module_root = paths.join(ctx.label.workspace_root, ctx.label.package)

    if attr.module_root:
        module_root = paths.join(module_root, attr.module_root)

    js_outputs = []
    dts_outputs = []

    default_output_dir = paths.join(ctx.bin_dir.path, ctx.label.workspace_root, ctx.label.package)
    js_dir = default_output_dir
    dts_dir = default_output_dir

    for src in srcs:
        if src.is_directory:
            if len(srcs) > 1:
                fail("only a single source is allowed when generated sources return a directory")

            js = ctx.actions.declare_directory(src.basename + "_js")
            dts = ctx.actions.declare_directory(src.basename + "_dts")

            js_dir = js.path
            dts_dir = dts.path

            js_outputs.append(js)
            dts_outputs.append(dts)
        else:
            js = paths.replace_extension(src.basename, ".js")
            js_outputs.append(ctx.actions.declare_file(js))

            if src.extension == "ts" or src.extension == "tsx":
                dts = paths.replace_extension(src.basename, ".d.ts")
                dts_outputs.append(ctx.actions.declare_file(dts))

    requires_mapping = js_dir != default_output_dir or dts_dir != default_output_dir

    return struct(
        sources = js_outputs,
        source_output_base = js_dir,
        declarations = dts_outputs,
        declaration_output_base = dts_dir,
        module_root = module_root,
        requires_mapping = requires_mapping,
    )

def _get_compiler_deps(ctx, attr):
    deps = []

    if attr.babel_config:
        deps.append(attr.babel_config)

    if attr.ts_config:
        deps.append(attr.ts_config)

    inputs = collect_runtime(deps)

    return struct(
        deps = deps,
        inputs = inputs,
    )

def _get_build_deps(ctx, attr):
    deps = attr._stdlib + attr.deps

    inputs = collect_runtime(
        deps,
        filter = _filter_ts_input,
    )

    declarations = collect_declarations(deps)

    return struct(
        deps = deps,
        inputs = depset(transitive = [
            inputs,
            declarations.transitive_declarations,
        ]),
        direct_declarations = declarations.declarations,
        transitive_declarations = declarations.transitive_declarations,
        blacklisted_declarations = declarations.type_blacklisted_declarations,
    )

def babel_compile(
    ctx,
    srcs = None,
    attribute_whitelist = None,
    **kwargs
):
    whitelisted = {}
    original = structs.to_dict(ctx.attr)

    if attribute_whitelist:
        for a in BABEL_DEFAULT_ATTRS.keys():
            whitelisted[a] = _BABEL_DEFAULT_VALUES.get(a, None)

        for a in attribute_whitelist:
            whitelisted[a] = original[a]

        for a in BABEL_REQUIRED_ATTRS.keys():
            whitelisted[a] = original.get(a)
    else:
        whitelisted = original

    attr = struct(**dicts.add(whitelisted, **kwargs))

    if not srcs and attr.srcs:
        srcs = ctx.files.srcs

    # Unlike tsc, paths are relative to the compiler cwd
    # which is always the execroot
    workspace_root = "."

    compiler_deps = _get_compiler_deps(ctx, attr)
    build_deps = _get_build_deps(ctx, attr)
    outputs = _get_outputs(ctx, attr, srcs)
    modules = _module_resolution_config(ctx, attr, workspace_root, compiler_deps.deps + build_deps.deps)

    all_inputs = depset(
        direct = srcs,
        transitive = [
            build_deps.inputs,
            compiler_deps.inputs,
        ],
    )

    all_outputs = outputs.sources + outputs.declarations

    # Required for worker mode
    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    args.add("--root", workspace_root)
    args.add("--target", str(ctx.label))
    args.add("--output", outputs.source_output_base)
    args.add("--declaration-output", outputs.declaration_output_base)
    args.add("--package-root", outputs.module_root)
    args.add("--node-modules-root", modules.node_modules_root)

    if attr.babel_config:
        babel_config = get_config_entrypoint(
            attr.babel_config,
            provider = BabelConfig,
            rule_name = "babel_config",
        )

        args.add("--babel-config", babel_config)

    if attr.ts_config:
        args.add("--ts-config", ctx.file.ts_config)

    args.add_all(
        modules.module_roots,
        map_each = _format_module_root,
        expand_directories = False,
        uniquify = True,
    )

    args.add_all(
        modules.type_roots,
        before_each = "--type-roots",
        expand_directories = False,
        uniquify = True,
    )

    args.add_all(
        modules.global_types,
        before_each = "--global-type",
        uniquify = True,
    )

    args.add_all(
        modules.resolution_roots,
        before_each = "--resolution-root",
        expand_directories = False,
        uniquify = True,
    )

    args.add_all(
        build_deps.transitive_declarations,
        before_each = "--declaration",
        uniquify = True,
    )

    args.add_all(srcs, expand_directories = True)

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

    sources_depset = depset(direct = outputs.sources)
    declarations_depset = depset(direct = outputs.declarations)
    transitive_declarations = depset(transitive = [declarations_depset, build_deps.transitive_declarations])
    files_depset = depset(transitive = [sources_depset, declarations_depset])

    providers = [
        DefaultInfo(
            files = files_depset,
            runfiles = ctx.runfiles(
                collect_default = True,
                collect_data = True,
            ),
        ),
        DeclarationInfo(
            declarations = declarations_depset,
            transitive_declarations = transitive_declarations,
            type_blacklisted_declarations = build_deps.blacklisted_declarations,
        ),
        js_named_module_info(
            sources = sources_depset,
            deps = build_deps.deps,
        ),
    ]

    if outputs.requires_mapping or modules.requires_mapping:
        providers.extend([
            DeclarationPackageInfo(
                package_name = modules.module_name,
                path = outputs.declaration_output_base,
                files = declarations_depset,
            ),
            LinkablePackageInfo(
                package_name = modules.module_name,
                path = outputs.source_output_base,
                files = sources_depset,
            ),
        ])

    return providers
