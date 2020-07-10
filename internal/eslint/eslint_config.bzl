load("@bazel_skylib//lib:dicts.bzl", "dicts")
load("@brex_rules_js//internal/utils:config.bzl", "config_rule", "default_config_rule_impl", "CONFIG_RULE_ATTRS")

EslintConfig = provider()

def _eslint_config_impl(ctx):
    return default_config_rule_impl(ctx, EslintConfig, package_json = ctx.file.package_json)

eslint_config = config_rule(
    implementation = _eslint_config_impl,
    provides = [EslintConfig],
    attrs = dicts.add(CONFIG_RULE_ATTRS, {
        "package_json": attr.label(
            allow_single_file = True,
            mandatory = True,
        ),
    }),
)
