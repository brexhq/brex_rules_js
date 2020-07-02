load("@brex_rules_js//internal/utils:config.bzl", "config_rule", "default_config_rule_impl")

BabelConfig = provider()

def _babel_config_impl(ctx):
    return default_config_rule_impl(ctx, BabelConfig)

babel_config = config_rule(_babel_config_impl, provides = [BabelConfig])
