load("@bazel_skylib//lib:paths.bzl", "paths")
load("@build_bazel_rules_nodejs//:providers.bzl", "NpmPackageInfo", "LinkablePackageInfo")

DEFAULT_MODULE_MAPPING_ATTRS = ["srcs", "deps"]

ModuleMappings = provider()
DeclarationPackageInfo = provider()

def compute_node_modules_root(deps):
    node_modules_root = None

    for d in deps:
        if NpmPackageInfo in d:
            possible_root = paths.join("external", d[NpmPackageInfo].workspace, "node_modules")

            if not node_modules_root:
                node_modules_root = possible_root
            elif node_modules_root != possible_root:
                fail("All npm dependencies need to come from a single workspace. Found '%s' and '%s'." % (node_modules_root, possible_root))

    return node_modules_root

def _append_mapping(mappings, kind, name, path):
    key = (kind, name)
    existing = mappings.get(key, None)

    if existing and existing != path:
        fail("conflicting %s mappings for package %s declared: %s vs %s" (kind, name, path, existing))

    mappings[key] = path

def get_module_mappings(deps):
    mappings = {}

    for d in deps:
        if ModuleMappings in d:
            for (kind, package_name), path in d[ModuleMappings].mappings.items():
                _append_mapping(mappings, kind, package_name, path)

        if LinkablePackageInfo in d:
            package_name = d[LinkablePackageInfo].package_name
            path = d[LinkablePackageInfo].path

            _append_mapping(mappings, "source", package_name, path)

        if DeclarationPackageInfo in d:
            package_name = d[DeclarationPackageInfo].package_name
            path = d[DeclarationPackageInfo].path

            _append_mapping(mappings, "declaration", package_name, path)

    return mappings

def get_module_mappings_in(attrs, attr_names = DEFAULT_MODULE_MAPPING_ATTRS):
    all_deps = [
        d
        for n in attr_names
        if hasattr(attrs, n)
        for d in getattr(attrs, n)
    ]

    return get_module_mappings(all_deps)

def _module_mappings_aspect_impl(target, ctx):
    return ModuleMappings(
        mappings = get_module_mappings_in(ctx.rule.attr),
    )

module_mappings_aspect = aspect(
    _module_mappings_aspect_impl,
    attr_aspects = DEFAULT_MODULE_MAPPING_ATTRS,
)



