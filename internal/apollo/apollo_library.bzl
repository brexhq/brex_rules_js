load("@bazel_skylib//lib:dicts.bzl", "dicts")
load("@brex_rules_js//internal/apollo:apollo.bzl", "apollo_compile", "APOLLO_REQUIRED_ATTRS")
load("@brex_rules_js//internal/apollo:apollo_schema.bzl", "ApolloSchema")

def _apollo_library_impl(ctx):
    return apollo_compile(
        ctx,
        schema = ctx.attr.schema,
        compile_global_types = True,
        srcs = ctx.files.srcs,
    )

apollo_library = rule(
    implementation = _apollo_library_impl,
    attrs = dicts.add({
        "schema": attr.label(
            mandatory = True,
            providers = [ApolloSchema],
        ),
        "srcs": attr.label_list(
            allow_files = True,
        )
    }, APOLLO_REQUIRED_ATTRS)
)
