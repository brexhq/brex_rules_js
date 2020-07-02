load("@brex_rules_js//proto:compiler.bzl", "js_proto_compiler")

js_proto_compiler(
    name = "proto",
    visibility = ["//visibility:public"],
    builtin_plugins = ["js"],
    plugins = {
        "@npm//grpc_tools_node_protoc_ts/bin:protoc-gen-ts": "ts",
    },
    options = {
        "js": "import_style=commonjs,binary",
        "ts": "generate_package_definition",
    },
    suffixes = [
        "_pb.js",
        "_pb.d.ts",
    ],
    runtime_deps = [
        "@npm//google-protobuf",
    ],
)

js_proto_compiler(
    name = "grpc",
    visibility = ["//visibility:public"],
    builtin_plugins = ["js"],
    plugins = {
        "@npm//grpc-tools/bin:grpc_tools_node_protoc_plugin": "grpc",
        "@npm//grpc_tools_node_protoc_ts/bin:protoc-gen-ts": "ts",
    },
    options = {
        "js": "import_style=commonjs,binary",
        "grpc": "grpc_js",
        "ts": "generate_package_definition",
    },
    suffixes = [
        "_pb.js",
        "_grpc_pb.js",
        "_pb.d.ts",
        "_grpc_pb.d.ts",
    ],
    runtime_deps = [
        "@npm//google-protobuf",
        "@npm//@grpc/grpc-js",
    ],
)
