const path = require("path");
const { createRequire } = require("module");

module.exports = function resolve(modulePath, config) {
  if (/^\.\.?\//.test(modulePath)) {
    modulePath = path.resolve(config.basedir, modulePath);
  }

  return createRequire(config.basedir).resolve(modulePath);
};
