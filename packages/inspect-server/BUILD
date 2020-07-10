load("@npm//@bazel/typescript:index.bzl", "ts_library")
load("@build_bazel_rules_nodejs//:index.bzl", "nodejs_binary")

# gazelle:lang none
# gazelle:ts_config @brex_rules_js//:tsconfig.json

nodejs_binary(
    name = "inspect-server",
    entry_point = ":main.ts",
    data = [":main"],
    visibility = ["//visibility:public"],
)

ts_library(
    name = "main",
    srcs = ["main.ts"],
    module_name = "@brex_rules_js/inspect-server",
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":rpc",
        ":service",
        "@npm//@types",
    ],
)

ts_library(
    name = "service",
    srcs = ["service.ts"],
    module_name = "@brex_rules_js/inspect-server",
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":code",
        ":rpc",
        ":yarnpkg-lockfile.d",  #keep
        "@npm//@types",
        "@npm//@yarnpkg/lockfile",
    ],
)

ts_library(
    name = "rpc",
    srcs = ["rpc.ts"],
    module_name = "@brex_rules_js/inspect-server",
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//node-worker-threads-pool",
    ],
)

ts_library(
    name = "code",
    srcs = ["code.ts"],
    module_name = "@brex_rules_js/inspect-server",
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        ":babel-resolver.d",  #keep
        "@npm//@types",
        "@npm//@babel/parser",
        "@npm//@babel/traverse",
    ],
)

ts_library(
    name = "babel-resolver.d",
    srcs = ["babel-resolver.d.ts"],
    module_name = "@brex_rules_js/inspect-server",
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = [
        "@npm//@types",
        "@npm//@babel/types",
    ],
)

ts_library(
    name = "yarnpkg-lockfile.d",
    srcs = ["yarnpkg-lockfile.d.ts"],
    module_name = "@brex_rules_js/inspect-server",
    tsconfig = "@brex_rules_js//:tsconfig.json",
    visibility = ["//visibility:public"],
    deps = ["@npm//@types"],
)
