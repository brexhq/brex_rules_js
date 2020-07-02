load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")

def js_repos():
    http_archive(
        name = "build_bazel_rules_nodejs",
        sha256 = "84abf7ac4234a70924628baa9a73a5a5cbad944c4358cf9abdb4aab29c9a5b77",
        urls = ["https://github.com/bazelbuild/rules_nodejs/releases/download/1.7.0/rules_nodejs-1.7.0.tar.gz"],
    )
