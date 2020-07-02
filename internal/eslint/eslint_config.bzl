load("@brex_rules_js//internal/js_library:js_library.bzl", "js_library")

def eslint_config(name, config, deps = [], **kwargs):
    js_library(
        name = name,
        srcs = [config],
        deps = deps,
        **kwargs,
    )
