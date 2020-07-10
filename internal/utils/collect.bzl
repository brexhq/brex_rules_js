load(
    "@build_bazel_rules_nodejs//:providers.bzl",
    "DeclarationInfo",
    "JSEcmaScriptModuleInfo",
    "JSNamedModuleInfo",
    "NpmPackageInfo",
    "js_named_module_info",
    "js_ecma_script_module_info"
)

def collect_declarations(deps):
    declaration_infos = [dep[DeclarationInfo] for dep in deps if dep[DeclarationInfo]]
    direct_deps_declarations = [dep.declarations for dep in declaration_infos]
    transitive_deps_declarations = [dep.transitive_declarations for dep in declaration_infos]
    type_blacklisted_declarations = [dep.type_blacklisted_declarations for dep in declaration_infos]

    return DeclarationInfo(
        declarations = depset(transitive = direct_deps_declarations),
        transitive_declarations = depset(transitive = transitive_deps_declarations),
        type_blacklisted_declarations = depset(transitive = type_blacklisted_declarations),
    )

def declaration_info(declarations = [], deps = [], blacklisted = []):
    deps = collect_declarations(deps)

    return DeclarationInfo(
        declarations = depset(direct = declarations),
        transitive_declarations = depset(direct = declarations, transitive = [deps.transitive_declarations]),
        type_blacklisted_declarations = depset(direct = blacklisted, transitive = [deps.type_blacklisted_declarations]),
    )

def collect_runtime(deps, filter = None):
    depsets = []

    for d in deps:
        if NpmPackageInfo in d:
            depsets.append(d[NpmPackageInfo].sources)
        if JSNamedModuleInfo in d:
            depsets.append(d[JSNamedModuleInfo].sources)
        if DefaultInfo in d:
            depsets.append(d[DefaultInfo].files)

    deps = depset(transitive = depsets)

    if filter:
        deps = depset(direct = [
            x
            for x in deps.to_list()
            if filter(x)
        ])

    return deps

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

