const path = require("path");
const resolveBazel = require('brex_rules_js/packages/resolver-bazel')

exports.interfaceVersion = 2

exports.resolve = function (modulePath, file, config) {
    config = Object.assign({}, config, {
        basedir: path.dirname(file),
    });

    try {
        return {
            found: true,
            path: resolveBazel(modulePath, config),
        }
    } catch {
        return {
            found: false,
        }
    }
}
