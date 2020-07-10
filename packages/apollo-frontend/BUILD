load("@brex_rules_js//:defs.bzl", "eslint_test")
load("@npm//@bazel/typescript:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:lang js

nodejs_binary(
    name = "apollo-frontend",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

ts_library(
    name = "config",
    srcs = ["config.ts"],
    module_name = "@brex_rules_js/apollo-frontend",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//yargs",
    ],
)

ts_library(
    name = "main",
    srcs = ["main.ts"],
    module_name = "@brex_rules_js/apollo-frontend",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "@npm//@bazel/worker",
        "@npm//@types",
        "@npm//apollo-codegen-core",
        "@npm//apollo-codegen-typescript",
        "@npm//apollo-language-server",
        "@npm//graphql",
        "@npm//vscode-uri",
    ],
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
