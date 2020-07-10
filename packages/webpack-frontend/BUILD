load("@brex_rules_js//:defs.bzl", "eslint_test")
load("@npm//@bazel/typescript:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

nodejs_binary(
    name = "webpack-frontend",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

nodejs_binary(
    name = "webpack-devserver",
    entry_point = ":devserver.ts",
    data = [":devserver"],
    visibility = ["//visibility:public"],
)

ts_library(
    name = "config",
    srcs = ["config.ts"],
    module_name = "@brex_rules_js/webpack-frontend",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//yargs",
    ],
)

ts_library(
    name = "devserver",
    srcs = ["devserver.ts"],
    module_name = "@brex_rules_js/webpack-frontend",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":compiler",
        ":config",
        "@npm//@types",
        "@npm//webpack",
        "@npm//webpack-dev-server",
    ],
)

ts_library(
    name = "main",
    srcs = ["main.ts"],
    module_name = "@brex_rules_js/webpack-frontend",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":compiler",
        ":config",
        "@npm//@bazel/worker",
        "@npm//@types",
        "@npm//webpack",
    ],
)

ts_library(
    name = "compiler",
    srcs = ["compiler.ts"],
    module_name = "@brex_rules_js/webpack-frontend",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "//packages/compiler-infra:module-loader",
        "@npm//@types",
        "@npm//enhanced-resolve",
        "@npm//webpack",
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
    name = "devserver.lint",
    srcs = [":devserver"],
    config = "//:eslint-config",
)

eslint_test(
    name = "main.lint",
    srcs = [":main"],
    config = "//:eslint-config",
)
