load("@io_bazel_rules_go//go:def.bzl", "go_library")

go_library(
    name = "go_default_library",
    srcs = [
        "builtin.go",
        "config.go",
        "dep.go",
        "fileinfo.go",
        "generate.go",
        "generator.go",
        "inspect.go",
        "language.go",
        "resolve.go",
        "resolver.go",
        "update.go",
        "utils.go",
        "worker.go",
    ],
    data = [
        "@brex_rules_js//packages/inspect-server",
    ],
    importpath = "github.com/brexhq/brex_rules_js/gazelle/language/js",
    visibility = ["//visibility:public"],
    deps = [
        "@bazel_gazelle//config:go_default_library",
        "@bazel_gazelle//label:go_default_library",
        "@bazel_gazelle//language:go_default_library",
        "@bazel_gazelle//language/proto:go_default_library",
        "@bazel_gazelle//repo:go_default_library",
        "@bazel_gazelle//resolve:go_default_library",
        "@bazel_gazelle//rule:go_default_library",
        "@io_bazel_rules_go//go/tools/bazel:go_default_library",
        "@org_golang_x_sync//errgroup:go_default_library",
    ],
)
