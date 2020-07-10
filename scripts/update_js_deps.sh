#!/bin/bash
bazel run //:gazelle -- update-repos -from_file=yarn.lock -package-json=package.json -to_macro=bazel/js_third_party.bzl%js_deps
