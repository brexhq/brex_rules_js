load(
    "@build_bazel_rules_nodejs//:providers.bzl",
    "DeclarationInfo",
    "JSEcmaScriptModuleInfo",
    "JSNamedModuleInfo",
    "NpmPackageInfo",
    "js_named_module_info",
    "js_ecma_script_module_info"
)

def collect_declarations(deps = [], node_modules = None):
    declaration_infos = [dep[DeclarationInfo] for dep in deps if dep[DeclarationInfo]]
    direct_deps_declarations = [dep.declarations for dep in declaration_infos]
    transitive_deps_declarations = [dep.transitive_declarations for dep in declaration_infos]

    if node_modules:
        if DeclarationInfo in node_modules:
            transitive_deps_declarations.append(node_modules[DeclarationInfo].transitive_declarations)

    type_blacklisted_declarations = [dep.type_blacklisted_declarations for dep in declaration_infos]

    return DeclarationInfo(
        declarations = depset(transitive = direct_deps_declarations),
        transitive_declarations = depset(transitive = transitive_deps_declarations),
        type_blacklisted_declarations = depset(transitive = type_blacklisted_declarations),
    )

def declaration_info(direct = [], deps = [], node_modules = None, blacklisted = []):
    deps = collect_declarations(deps = deps, node_modules = node_modules)

    return DeclarationInfo(
        declarations = depset(direct = direct),
        transitive_declarations = depset(direct = direct, transitive = [deps.transitive_declarations]),
        type_blacklisted_declarations = depset(direct = blacklisted, transitive = [deps.type_blacklisted_declarations]),
    )

def collect_runtime(deps = None, node_modules = None, filter = None):
    node_modules_depsets = []

    if node_modules:
        node_modules_depsets.append(node_modules.files)

        if NpmPackageInfo in node_modules:
            node_modules_depsets.append(node_modules[NpmPackageInfo].sources)

    # Also include files from npm fine grained deps as inputs.
    # These deps are identified by the NpmPackageInfo provider.
    for d in deps:
        if NpmPackageInfo in d:
            node_modules_depsets.append(d[NpmPackageInfo].sources)

    node_modules = depset(transitive = node_modules_depsets)

    # Using an array of depsets will allow us to avoid flattening files and sources
    # inside this loop. This should reduce the performances hits,
    # since we don't need to call .to_list()
    # Also avoid deap transitive depset()s by creating single array of
    # transitive depset()s
    sources_depsets = []

    for d in deps:
        if JSNamedModuleInfo in d:
                sources_depsets.append(d[JSNamedModuleInfo].sources)
        if hasattr(d, "files"):
                sources_depsets.append(d.files)

    sources = depset(transitive = sources_depsets)

    if filter:
        sources = depset(direct = [
            x
            for x in sources.to_list()
            if filter(x)
        ])

        node_modules = depset(direct = [
            x
            for x in node_modules.to_list()
            if filter(x)
        ])

    return struct(
        sources = sources,
        node_modules = node_modules,
    )

# This is the same as node_modules_aspect but allows multiple sources
# other than the "deps" attribute.
def merged_npm_package_info(deps = []):
    sources_depsets = []
    workspace = None

    for dep in deps:
        if NpmPackageInfo in dep:
            if workspace and dep[NpmPackageInfo].workspace != workspace:
                fail("All npm dependencies need to come from a single workspace. Found '%s' and '%s'." % (workspace, dep[NpmPackageInfo].workspace))

            workspace = dep[NpmPackageInfo].workspace
            sources_depsets.append(dep[NpmPackageInfo].sources)

    if not workspace:
        return []

    return [
        NpmPackageInfo(
            direct_sources = depset(),
            sources = depset(transitive = sources_depsets),
            workspace = workspace,
        )
    ]

