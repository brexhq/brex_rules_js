load("@brex_rules_js//internal/utils:config.bzl", "config_rule", "default_config_rule_impl")

ApolloConfig = provider()

def _apollo_config_impl(ctx):
    return default_config_rule_impl(ctx, ApolloConfig)

apollo_config = config_rule(_apollo_config_impl, provides = [ApolloConfig])
