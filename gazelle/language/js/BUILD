load("@io_bazel_rules_go//go:def.bzl", "go_library", "go_test")

go_library(
    name = "go_default_library",
    srcs = [
        "config.go",
        "fileinfo.go",
        "generate.go",
        "language.go",
        "resolver.go",
        "utils.go",
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
    ],
)

go_test(
    name = "go_default_test",
    srcs = ["fileinfo_test.go"],
    embed = [":go_default_library"],
)
