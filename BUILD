load("@bazel_gazelle//:def.bzl", "gazelle", "gazelle_binary")

# gazelle:lang go,proto
# gazelle:workspace brex_rules_js
# gazelle:prefix github.com/brexhq/brex_rules_js
# gazelle:ts_config @brex_rules_js//:tsconfig.json
# gazelle:exclude node_modules

gazelle_binary(
    name = "gazelle-full",
    languages = [
        "@bazel_gazelle//language/proto:go_default_library",
        "@bazel_gazelle//language/go:go_default_library",
        "@brex_rules_js//gazelle/language/js:go_default_library",
    ],
)

gazelle(
    name = "gazelle",
    gazelle = ":gazelle-full",
)

filegroup(
    name = "all",
    srcs = glob(["*"]),
    visibility = ["//visibility:public"],
)

exports_files(
    [
        "package.json",
        "yarn.lock",
        "tsconfig.json",
    ],
    visibility = ["//visibility:public"],
)
