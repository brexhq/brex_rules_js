load("@build_bazel_rules_nodejs//:providers.bzl", "NpmPackageInfo", "LinkablePackageInfo")

DEFAULT_MODULE_MAPPING_ATTRS = ["srcs", "deps"]

ModuleMappings = provider()

def compute_node_modules_root(deps = [], node_modules = None):
    node_modules_root = None

    if node_modules:
        if NpmPackageInfo in node_modules:
            node_modules_root = "/".join(["external", node_modules[NpmPackageInfo].workspace, "node_modules"])

    for d in deps:
        if NpmPackageInfo in d:
            possible_root = "/".join(["external", d[NpmPackageInfo].workspace, "node_modules"])
            if not node_modules_root:
                node_modules_root = possible_root
            elif node_modules_root != possible_root:
                fail("All npm dependencies need to come from a single workspace. Found '%s' and '%s'." % (node_modules_root, possible_root))

    return node_modules_root

def _append_mapping(mappings, name, path):
    existing = mappings.get(name, None)

    if existing and existing != path:
        fail("conflicting mappings for package %s declared: %s vs %s" (name, path, existing))

    mappings[name] = path


def get_module_mappings(attrs, attr_names = DEFAULT_MODULE_MAPPING_ATTRS):
    mappings = {}

    all_deps = [
        d
        for n in attr_names
        if hasattr(attrs, n)
        for d in getattr(attrs, n)
    ]

    for d in all_deps:
        if ModuleMappings in d:
            for k, v in d[ModuleMappings].mappings.items():
                _append_mapping(mappings, k, v)

        if LinkablePackageInfo in d:
            package_name = d[LinkablePackageInfo].package_name
            path = d[LinkablePackageInfo].path

            _append_mapping(mappings, package_name, path)

    return ModuleMappings(
        mappings = mappings,
    )

def _module_mappings_aspect_impl(target, ctx):
    return get_module_mappings(ctx.rule.attr)

module_mappings_aspect = aspect(
    _module_mappings_aspect_impl,
    attr_aspects = DEFAULT_MODULE_MAPPING_ATTRS,
)



