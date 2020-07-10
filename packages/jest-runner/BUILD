load("@brex_rules_js//:defs.bzl", "babel_library", "eslint_test")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:js_compiler babel

nodejs_binary(
    name = "jest-runner",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

babel_library(
    name = "main",
    srcs = ["main.ts"],
    module_name = "@brex_rules_js/jest-runner",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":resolver",
        "//packages/compiler-infra:arg-parser",
        "//packages/compiler-infra:path-resolver",
        "@npm//@jest/core",
        "@npm//@types",
        "@npm//jest-junit-reporter",
    ],
)

babel_library(
    name = "resolve",
    srcs = ["resolve.ts"],
    module_name = "@brex_rules_js/jest-runner",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = ["@npm//@types"],
)

babel_library(
    name = "resolver",
    srcs = ["resolver.js"],
    module_name = "@brex_rules_js/jest-runner",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":resolve",
        "@npm//@types",
    ],
)

eslint_test(
    name = "main.lint",
    srcs = [":main"],
    config = "//:eslint-config",
)

eslint_test(
    name = "resolve.lint",
    srcs = [":resolve"],
    config = "//:eslint-config",
)

eslint_test(
    name = "resolver.lint",
    srcs = [":resolver"],
    config = "//:eslint-config",
)
