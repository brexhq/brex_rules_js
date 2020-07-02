const resolveBazel = require('brex_rules_js/packages/resolver-bazel')

// Bazel already patches the outermost require() to use Runfiles
// Jest by default delegates module resolution to a custom resolver
// that doesn't reuse NodeJS semantics.
// This module implements a custom jest resolver that uses Bazel mechanisms

module.exports = function resolve(modulePath, opts) {
    return resolveBazel(modulePath, opts)
}
