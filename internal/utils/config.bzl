load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect", "js_named_module_info")

CONFIG_RULE_ATTRS = {
    "config": attr.label(
        allow_single_file = True,
    ),
    "deps": attr.label_list(
        allow_files = True,
        aspects = [node_modules_aspect],
        default = [],
    ),
    "runtime_deps": attr.label_list(
        allow_files = True,
        aspects = [node_modules_aspect],
        default = [],
    ),
    "data": attr.label_list(),
}

def default_config_rule_impl(ctx, provider):
    js_sources = []
    config = ctx.file.config

    if config.extension == "js":
        js_sources.append(config)

    return [
        DefaultInfo(
            files = depset(direct = [ctx.file.config]),
            runfiles = ctx.runfiles(
                collect_default = True,
                collect_data = True,
            ),
        ),
        js_named_module_info(
            sources = depset(direct = js_sources),
            deps = ctx.attr.deps,
        ),
        provider(
            config = config,
            runtime_deps = ctx.attr.runtime_deps,
        ),
    ]

def config_rule(implementation, attrs = CONFIG_RULE_ATTRS, **kwargs):
    return rule(
        implementation = implementation,
        attrs = CONFIG_RULE_ATTRS,
        **kwargs,
    )

def get_config_entrypoint(attr, provider = None, rule_name = "config rule"):
    if provider and attr[provider]:
        return attr[provider].config
    elif attr.files:
        files = attr.files.to_list()

        if len(files) == 0:
            return files[0]
        else:
            fail("multiple files provided as configuration, provide single file or use " + rule_name)
    else:
        fail("invalid target provided as configuration, provide single file or use " + rule_name)
