load("@build_bazel_rules_nodejs//:providers.bzl", "node_modules_aspect")

ApolloSchema = provider()

def _apollo_schema_impl(ctx):
    return ApolloSchema(
        config = ctx.attr.config,
        schema = depset(direct = ctx.files.schema),
    )

apollo_schema = rule(
    implementation = _apollo_schema_impl,
    attrs = {
        "schema": attr.label(
            mandatory = True,
            allow_files = True,
        ),
        "config": attr.label(
            allow_files = True,
            aspects = [node_modules_aspect],
        ),
    }
)
