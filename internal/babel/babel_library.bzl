load("@bazel_skylib//lib:dicts.bzl", "dicts")
load("@brex_rules_js//internal/babel:babel.bzl", "babel_compile", "BABEL_DEFAULT_ATTRS", "BABEL_REQUIRED_ATTRS")

def _babel_library_impl(ctx):
    return babel_compile(ctx)

babel_library = rule(
    implementation = _babel_library_impl,
    attrs = dicts.add(BABEL_DEFAULT_ATTRS, BABEL_REQUIRED_ATTRS)
)
