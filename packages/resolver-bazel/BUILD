load("@brex_rules_js//:defs.bzl", "eslint_test", "js_library")

js_library(
    name = "index",
    srcs = ["index.js"],
    module_name = "@brex_rules_js/resolver-bazel",
    visibility = ["//visibility:public"],
)

eslint_test(
    name = "index.lint",
    srcs = [":index"],
    config = "//:eslint-config",
)
