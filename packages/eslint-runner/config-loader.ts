import * as path from "path";
import * as naming from "eslint/lib/shared/naming";
import {ConfigArrayFactory} from "eslint/lib/cli-engine/config-array-factory";
import {ConfigDependency} from "eslint/lib/cli-engine/config-array";
import {ModuleLoader} from "@brex_rules_js/compiler-infra/module-loader";

// Note: This only exists because, just like Babel, we can't override the
// plugin loading logic so we have custom lookup paths and can restrict to
// declared dependencies only.
// We should submit a feature request at some point to clean this up.

export {ConfigArray} from "eslint/lib/cli-engine/config-array";

export function createConfigLoader(loader: ModuleLoader): ConfigArrayFactory {
  const factory = new ConfigArrayFactory();

  factory._loadConfigData = function (ctx: any) {
    return this._normalizeConfigData(loader.require(ctx.filePath), ctx);
  };

  factory._loadParser = function (name: string, ctx: any) {
    try {
      const filePath = loader.resolve(name, null);
      const result = loader.require(filePath);

      return new ConfigDependency({
        id: name,
        filePath: filePath,
        definition: result,
        importerName: ctx.name,
        importerPath: ctx.filePath
      })
    } catch (err) {
      err.message = `Failed to load parser '${name}' declared in '${ctx.name}': ${err.message}`;

      return new ConfigDependency({
        id: name,
        error: err,
        importerName: ctx.name,
        importerPath: ctx.filePath
      });
    }
  };

  factory._loadPlugin = function (name: string, ctx: any) {
    const request = naming.normalizePackageName(name, "eslint-plugin");
    const id = naming.getShorthandName(request, "eslint-plugin");

    try {
      const filePath = loader.resolve(request, null);
      const result = loader.require(filePath);

      return new ConfigDependency({
        id: id,
        filePath: filePath,
        definition: normalizePlugin(result),
        importerName: ctx.name,
        importerPath: ctx.filePath
      })
    } catch (err) {
      if (err && err.code === "MODULE_NOT_FOUND") {
        err.messageTemplate = "plugin-missing";
        err.messageData = {
          pluginName: request,
          resolvePluginsRelativeTo: ctx.pluginBasePath,
          importerName: ctx.name
        };
      }

      err.message = `Failed to load plugin '${name}' declared in '${ctx.name}': ${err.message}`;
      return new ConfigDependency({
        id: id,
        error: err,
        importerName: ctx.name,
        importerPath: ctx.filePath
      });
    }
  };

  factory._loadExtendedShareableConfig = function (name: string, ctx: any) {
    let request: string;
    let filePath: string;

    if (isFilePath(name)) {
      request = name;
    } else if (name.startsWith(".")) {
      request = `./${name}`; // For backward compatibility. A ton of tests depended on this behavior.
    } else {
      request = naming.normalizePackageName(name, "eslint-config");
    }

    try {
      filePath = loader.resolve(request);
    } catch (err) {
      if (err && err.code === "MODULE_NOT_FOUND") {
        throw configMissingError(name, ctx.filePath);
      }

      throw err;
    }

    return this._loadConfigData({
      ...ctx,
      filePath,
      name: `${ctx.name} » ${request}`
    });
  };

  return factory;
}

function configMissingError(configName: string, importerName: string) {
  return Object.assign(
    new Error(`Failed to load config "${configName}" to extend from.`),
    {
      messageTemplate: "extend-config-missing",
      messageData: { configName, importerName }
    }
  );
}

function isFilePath(nameOrPath) {
  return (
    /^\.{1,2}[/\\]/u.test(nameOrPath) ||
    path.isAbsolute(nameOrPath)
  );
}

function normalizePlugin(plugin) {
  return {
    configs: plugin.configs || {},
    environments: plugin.environments || {},
    processors: plugin.processors || {},
    rules: plugin.rules || {}
  };
}
