brex_rules_js

> DISCLAIMER: This is a snapshot from the internal JS rules. **Do not** use in production as it's currently a proof of concept.

# Overview

## Gazelle

A Gazelle language plugin can generate most of the necessary such as `js_library`, `ts_library`, `babel_library`, `jest_test` and `eslint_test`.

## `babel_library`

Alternative to `ts_library` that uses Babel and doesn't rely on `wrapped_tsc`. Useful when Babel plugins are required.

## `js_proto_library`

Started as a fork from `labs/grpc_web` rules using `google-protobuf`, `grpc-tools` and `grpc_tools_node_protoc_ts`, instead of `grpc-web`.

In its current state it's similar to `go_proto_library`, supporting multiple compilers through `js_proto_compiler` plugins, as long as they're are compatible with `protoc`. Module wrapping and import mapping is done using `@babel/core`.

`packages/js-protoc` provides a custom frontend for `protoc` that supports workers and does the final transpilation using Babel.

## `webpack_release` / `webpack_devserver`

Webpack rules supporting workers, those are very recent and probably unstable.

# External Code

The code in this repo is influenced and/or has code snippets from:

* `bazelbuild/rules_typescript`
* `bazelbuild/rules_nodejs`
* `bazelbuild/rules_go`
* `bazelbuild/rules_go`
* `bazelbuild/gazelle`
* `jasongwartz/bazel_rules_nodejs_contrib`
