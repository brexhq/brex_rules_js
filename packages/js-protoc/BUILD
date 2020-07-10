load("@brex_rules_js//:defs.bzl", "babel_library", "eslint_test")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:js_compiler babel

nodejs_binary(
    name = "js-protoc",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

babel_library(
    name = "compiler",
    srcs = ["compiler.ts"],
    module_name = "@brex_rules_js/js-protoc",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "@npm//@babel/core",
        "@npm//@babel/plugin-syntax-typescript",
        "@npm//@types",
    ],
)

babel_library(
    name = "config",
    srcs = ["config.ts"],
    module_name = "@brex_rules_js/js-protoc",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//yargs",
    ],
)

babel_library(
    name = "main",
    srcs = ["main.ts"],
    module_name = "@brex_rules_js/js-protoc",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":compiler",
        ":config",
        ":protoc",
        "//packages/compiler-infra:cache",
        "//packages/compiler-infra:worker",
        "@npm//@bazel/worker",
        "@npm//@types",
    ],
)

babel_library(
    name = "protoc",
    srcs = ["protoc.ts"],
    module_name = "@brex_rules_js/js-protoc",
    ts_config = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "@npm//@types",
    ],
)

eslint_test(
    name = "compiler.lint",
    srcs = [":compiler"],
    config = "//:eslint-config",
)

eslint_test(
    name = "config.lint",
    srcs = [":config"],
    config = "//:eslint-config",
)

eslint_test(
    name = "main.lint",
    srcs = [":main"],
    config = "//:eslint-config",
)

eslint_test(
    name = "protoc.lint",
    srcs = [":protoc"],
    config = "//:eslint-config",
)
