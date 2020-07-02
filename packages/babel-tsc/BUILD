load("@npm_bazel_typescript//:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:lang js

nodejs_binary(
    name = "babel-tsc",
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
        ":cache",
        ":compiler",
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
    name = "cache",
    srcs = ["cache.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = ["@npm//@types"],
)

ts_library(
    name = "compiler",
    srcs = ["compiler.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":cache",
        ":config",
        ":host",
        ":utils",
        "//packages/babel-tsc/js:index",
        "//packages/babel-tsc/ts:index",
        "@npm//@types",
        "@npm//typescript",
    ],
)

ts_library(
    name = "host",
    srcs = ["host.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":cache",
        ":config",
        "@npm//@types",
    ],
)

ts_library(
    name = "utils",
    srcs = ["utils.ts"],
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = ["@npm//@types"],
)
