load("@brex_rules_js//internal/utils:config.bzl", "config_rule", "default_config_rule_impl")

WebpackConfig = provider()

def _webpack_config_impl(ctx):
    return default_config_rule_impl(ctx, WebpackConfig)

webpack_config = config_rule(_webpack_config_impl, provides = [WebpackConfig])
