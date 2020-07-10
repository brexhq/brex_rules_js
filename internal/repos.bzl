load("@bazel_gazelle//:deps.bzl", _go_repository = "go_repository")

def go_repository(**kwargs):
    go_repository(_go_repository, **kwargs)

def _maybe(repo_rule, name, **kwargs):
    if name not in native.existing_rules():
        repo_rule(name = name, **kwargs)
