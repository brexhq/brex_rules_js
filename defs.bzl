load("@brex_rules_js//internal/js_library:js_library.bzl", _js_library = "js_library")
load("@brex_rules_js//internal/jest:jest_node_test.bzl", _jest_node_test = "jest_node_test")
load("@brex_rules_js//internal/jest:jest_config.bzl", _jest_config = "jest_config")
load("@brex_rules_js//internal/eslint:eslint_test.bzl", _eslint_test = "eslint_test")
load("@brex_rules_js//internal/eslint:eslint_config.bzl", _eslint_config = "eslint_config")
load("@brex_rules_js//internal/babel:babel_library.bzl", _babel_library = "babel_library")
load("@brex_rules_js//internal/babel:babel_config.bzl", _babel_config = "babel_config")
load("@brex_rules_js//internal/proto:js_proto_library.bzl", _js_proto_library = "js_proto_library")
load("@brex_rules_js//internal/webpack:webpack_config.bzl", _webpack_config = "webpack_config")
load("@brex_rules_js//internal/webpack:webpack_release.bzl", _webpack_release = "webpack_release")
load("@brex_rules_js//internal/webpack:webpack_devserver.bzl", _webpack_devserver = "webpack_devserver")
load("@build_bazel_rules_nodejs//:index.bzl", _nodejs_binary = "nodejs_binary")
load("@npm_bazel_typescript//:index.bzl", _ts_library = "ts_library")


js_library = _js_library
ts_library = _ts_library
js_proto_library = _js_proto_library
jest_node_test = _jest_node_test
jest_config = _jest_config
eslint_test = _eslint_test
eslint_config = _eslint_config
nodejs_binary = _nodejs_binary
babel_library = _babel_library
babel_config = _babel_config
webpack_release = _webpack_release
webpack_config = _webpack_config
webpack_devserver = _webpack_devserver
