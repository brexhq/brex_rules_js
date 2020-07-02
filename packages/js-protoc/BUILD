load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:lang js
# gazelle:ts_config @brex_rules_js//:tsconfig.json

nodejs_binary(
    name = "js-protoc",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

ts_library(
    name = "main",
    srcs = ["main.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":compiler",
        ":config",
        ":protoc",
        "@npm//@bazel/worker",
        "@npm//@types",
    ],
)

ts_library(
    name = "config",
    srcs = ["config.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//yargs",
    ],
)

ts_library(
    name = "protoc",
    srcs = ["protoc.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "@npm//@types",
    ],
)

ts_library(
    name = "compiler",
    srcs = ["compiler.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "@npm//@babel/core",
        "@npm//@babel/plugin-syntax-typescript",
        "@npm//@types",
    ],
)
