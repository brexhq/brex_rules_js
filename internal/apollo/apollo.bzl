load("@bazel_skylib//lib:dicts.bzl", "dicts")
load("@bazel_skylib//lib:paths.bzl", "paths")
load("@bazel_skylib//lib:types.bzl", "types")
load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect", "run_node")
load("@brex_rules_js//internal/utils:collect.bzl", "collect_declarations", "collect_runtime")
load("@brex_rules_js//internal/utils:config.bzl", "get_config_entrypoint")
load("@brex_rules_js//internal/babel:babel.bzl", "babel_compile", "BABEL_REQUIRED_ATTRS")
load("@brex_rules_js//internal/apollo:apollo_config.bzl", "ApolloConfig")
load("@brex_rules_js//internal/apollo:apollo_schema.bzl", "ApolloSchema")

APOLLO_REQUIRED_ATTRS = dicts.add({
    "module_name": attr.string(),
    "_apollo": attr.label(
        executable = True,
        cfg = "host",
        default = "@brex_rules_js//packages/apollo-frontend",
    )
}, BABEL_REQUIRED_ATTRS)

def apollo_compile(ctx, schema, config = None, compile_global_types = True, srcs = []):
    if ApolloSchema in schema:
        schema_entry = schema[ApolloSchema].schema
        config = schema[ApolloSchema].config
    else:
        schema_entry = schema[DefaultInfo].files

    runtime_deps = []

    if config:
        runtime_deps.append(config)

    runtime_deps = collect_runtime(runtime_deps)

    all_inputs = depset(
        transitive = [
            schema_entry,
            runtime_deps,
        ],
    )

    output = ctx.actions.declare_directory(ctx.label.name)

    # Require for worker mode
    args = ctx.actions.args()
    args.use_param_file("@%s", use_always = True)
    args.set_param_file_format("multiline")

    args.add("--root", ".")
    args.add("--output", output.path)
    args.add_all(schema_entry, before_each = "--schema")

    if config:
        config_entry = get_config_entrypoint(
            config,
            provider = ApolloConfig,
            rule_name = "apollo_config",
        )
    
        args.add("--config", config_entry)

    args.add_all(srcs)

    ctx.actions.run(
        inputs = all_inputs,
        outputs = [output],
        progress_message = "Building GraphQL schema for %s" % ctx.label,
        mnemonic = "ApolloGen",
        executable = ctx.executable._apollo,
        arguments = [args],
        use_default_shell_env = True,
        execution_requirements = {"supports-workers": "1"},
        env = {"COMPILATION_MODE": ctx.var["COMPILATION_MODE"]},
    )

    providers = babel_compile(
        ctx,
        srcs = [output],
        module_root = output.basename,
        attribute_whitelist = ["module_name"],
    )

    if compile_global_types:
        providers.append(
            ApolloSchema(
                config = config,
                schema = schema_entry,
                module_name = ctx.attr.module_name,
            )
        )

    return providers

