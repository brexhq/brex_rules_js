load("@brex_rules_js//internal/utils:config.bzl", "config_rule", "default_config_rule_impl")

JestConfig = provider()

def _jest_config_impl(ctx):
    return default_config_rule_impl(ctx, JestConfig)

jest_config = config_rule(_jest_config_impl, provides = [JestConfig])
