load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:lang js

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
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//yargs",
    ],
)

ts_library(
    name = "main",
    srcs = ["main.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
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
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        ":module-loader",
        "@npm//@types",
        "@npm//enhanced-resolve",
        "@npm//webpack",
    ],
)

ts_library(
    name = "devserver",
    srcs = ["devserver.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":compiler",
        ":config",
        "@npm//@types",
        "@npm//express",
        "@npm//webpack",
        "@npm//webpack-dev-middleware",
    ],
)

ts_library(
    name = "module-loader",
    srcs = ["module-loader.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "@npm//@types",
        "@npm//resolve",
    ],
)
