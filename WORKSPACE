workspace(name = "brex_rules_js")

load("@bazel_tools//tools/build_defs/repo:http.bzl", "http_archive")
load("@bazel_tools//tools/build_defs/repo:git.bzl", "git_repository")

http_archive(
    name = "io_bazel_rules_go",
    sha256 = "87f0fb9747854cb76a0a82430adccb6269f7d394237104a4523b51061c469171",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/rules_go/releases/download/v0.23.1/rules_go-v0.23.1.tar.gz",
        "https://github.com/bazelbuild/rules_go/releases/download/v0.23.1/rules_go-v0.23.1.tar.gz",
    ],
)

git_repository(
    name = "com_google_protobuf",
    commit = "1f2d6bf4b5f6e7cada0c3598a3c64b2966ebb28e",
    remote = "https://github.com/protocolbuffers/protobuf",
    shallow_since = "1581713445 -0800",
)

http_archive(
    name = "bazel_gazelle",
    sha256 = "bfd86b3cbe855d6c16c6fce60d76bd51f5c8dbc9cfcaef7a2bb5c1aafd0710e8",
    urls = [
        "https://mirror.bazel.build/github.com/bazelbuild/bazel-gazelle/releases/download/v0.21.0/bazel-gazelle-v0.21.0.tar.gz",
        "https://github.com/bazelbuild/bazel-gazelle/releases/download/v0.21.0/bazel-gazelle-v0.21.0.tar.gz",
    ],
)

load("@io_bazel_rules_go//go:deps.bzl", "go_rules_dependencies", "go_register_toolchains")
load("@com_google_protobuf//:protobuf_deps.bzl", "protobuf_deps")
load("@bazel_gazelle//:deps.bzl", "gazelle_dependencies", "go_repository")

protobuf_deps()

go_rules_dependencies()

go_register_toolchains()

gazelle_dependencies()

load("@brex_rules_js//:repos.bzl", "js_repos")

js_repos()

load("@brex_rules_js//:deps.bzl", "add_js")

add_js()

load("@brex_rules_js//:ts.bzl", "add_ts")

add_ts()

load("//:bazel/js_third_party.bzl", "js_deps")

# gazelle:repository_macro bazel/js_third_party.bzl%js_deps
js_deps()

load("//:bazel/go_third_party.bzl", "go_deps")

# gazelle:repository_macro bazel/go_third_party.bzl%go_deps
go_deps()
