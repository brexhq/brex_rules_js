#!/bin/bash

bazel run //:gazelle -- update-repos -from_file=go.mod -to_macro=bazel/go_third_party.bzl%go_deps
sed -E 's/@bazel_gazelle\/\/\:deps\.bzl/@brex_rules_js\/\/internal:repos.bzl/g' bazel/go_third_party.bzl
