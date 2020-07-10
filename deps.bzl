load("@build_bazel_rules_nodejs//:index.bzl", "node_repositories", "yarn_install")

def add_js():
  node_repositories(
    node_version = "12.16.2",
    yarn_version = "1.22.4",
    node_repositories = {
        "12.16.2-darwin_amd64": ("node-v12.16.2-darwin-x64.tar.gz", "node-v12.16.2-darwin-x64", "483954e311a5ff649ddf32b473f635a58890790d284b5788bdd8d7ff850c6db2"),
        "12.16.2-linux_amd64": ("node-v12.16.2-linux-x64.tar.xz", "node-v12.16.2-linux-x64", "f94a6eb06e80ef2794ebf51a2baed0b89ed307d3196ab5579f16c0fa7cc62901"),
    },
    node_urls = ["https://nodejs.org/dist/v{version}/{filename}"],
  )

  yarn_install(
      name = "npm",
      package_json = "//:package.json",
      yarn_lock = "//:yarn.lock",
  )
