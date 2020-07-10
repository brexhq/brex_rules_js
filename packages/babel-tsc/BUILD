load("@brex_rules_js//:defs.bzl", "eslint_test")
load("@npm//@bazel/typescript:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

nodejs_binary(
    name = "babel-tsc",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

ts_library(
    name = "compiler",
    srcs = ["compiler.ts"],
    module_name = "@brex_rules_js/babel-tsc",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        ":host",
        "//packages/babel-tsc/js:index",
        "//packages/babel-tsc/ts:index",
        "//packages/compiler-infra:cache",
        "//packages/compiler-infra:module-loader",
        "@npm//@types",
        "@npm//typescript",
    ],
)

ts_library(
    name = "config",
    srcs = ["config.ts"],
    module_name = "@brex_rules_js/babel-tsc",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "//packages/compiler-infra:arg-parser",
        "//packages/compiler-infra:path-resolver",
        "@npm//@types",
    ],
)

ts_library(
    name = "host",
    srcs = ["host.ts"],
    module_name = "@brex_rules_js/babel-tsc",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":config",
        "//packages/compiler-infra:cache",
        "@npm//@types",
    ],
)

ts_library(
    name = "main",
    srcs = ["main.ts"],
    module_name = "@brex_rules_js/babel-tsc",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":compiler",
        "//packages/compiler-infra:worker",
        "@npm//@bazel/worker",
        "@npm//@types",
    ],
)

ts_library(
    name = "utils",
    srcs = ["utils.ts"],
    module_name = "@brex_rules_js/babel-tsc",
    tsconfig = "//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = ["@npm//@types"],
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
    name = "host.lint",
    srcs = [":host"],
    config = "//:eslint-config",
)

eslint_test(
    name = "main.lint",
    srcs = [":main"],
    config = "//:eslint-config",
)

eslint_test(
    name = "utils.lint",
    srcs = [":utils"],
    config = "//:eslint-config",
)
