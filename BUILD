load("@brex_rules_js//:defs.bzl", "eslint_config", "runfile_gazelle")
load("@bazel_gazelle//:def.bzl", "gazelle_binary")

# gazelle:workspace brex_rules_js
# gazelle:prefix github.com/brexhq/brex_rules_js
# gazelle:ts_config :tsconfig.json
# gazelle:eslint_enabled yes
# gazelle:eslint_config :eslint-config
# gazelle:exclude node_modules
# gazelle:map_kind go_repository maybe_go_repository @brex_rules_js//internal:repos.bzl

gazelle_binary(
    name = "gazelle-full",
    languages = [
        "@bazel_gazelle//language/proto:go_default_library",
        "@bazel_gazelle//language/go:go_default_library",
        "@brex_rules_js//gazelle/language/js:go_default_library",
    ],
)

runfile_gazelle(
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

eslint_config(
    name = "eslint-config",
    config = "eslint.config.js",
    package_json = "package.json",
    deps = [
        "@npm//eslint-config-airbnb-base",
        "@npm//eslint-config-prettier",
        "@npm//eslint-plugin-prettier",
        ".prettierrc",
    ],
    visibility = ["//visibility:public"],
)
