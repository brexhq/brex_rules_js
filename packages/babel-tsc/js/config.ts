import * as path from "path";
import * as babel from "@babel/core";
import { ModuleLoader } from "@brex_rules_js/compiler-infra/module-loader";
import { Config } from "../config";

// Just so babel gets our dependencies
import "@babel/preset-env";
import "@babel/preset-typescript";
import "@babel/plugin-transform-typescript";
import "@babel/plugin-proposal-decorators";
import "@babel/plugin-proposal-class-properties";
import "@babel/plugin-proposal-optional-chaining";
import "@babel/plugin-proposal-object-rest-spread";
import "@babel/plugin-proposal-nullish-coalescing-operator";
import "babel-plugin-transform-typescript-metadata";

export type BabelConfig = {
  options: babel.TransformOptions;
};

const EXACT_RE = /^module:/;
const BABEL_PLUGIN_PREFIX_RE = /^(?!@|module:|[^/]+\/|babel-plugin-)/;
const BABEL_PRESET_PREFIX_RE = /^(?!@|module:|[^/]+\/|babel-preset-)/;
const BABEL_PLUGIN_ORG_RE = /^(@babel\/)(?!plugin-|[^/]+\/)/;
const BABEL_PRESET_ORG_RE = /^(@babel\/)(?!preset-|[^/]+\/)/;
const OTHER_PLUGIN_ORG_RE = /^(@(?!babel\/)[^/]+\/)(?![^/]*babel-plugin(?:-|\/|$)|[^/]+\/)/;
const OTHER_PRESET_ORG_RE = /^(@(?!babel\/)[^/]+\/)(?![^/]*babel-preset(?:-|\/|$)|[^/]+\/)/;
const OTHER_ORG_DEFAULT_RE = /^(@(?!babel$)[^/]+)$/;

export function buildBabelConfig(
  config: Config,
  loader: ModuleLoader,
  filename: string
): BabelConfig {
  const userOptions = loadUserOptions(config, loader);

  const allOptions: babel.TransformOptions[] = [
    {
      presets: [
        [
          "@babel/preset-env",
          {
            targets: { node: true },
          },
        ],
      ],
    },
    {
      test: /\.tsx?$/,
      presets: [["@babel/preset-typescript"]],
      plugins: [
        ["babel-plugin-transform-typescript-metadata"],
        [
          "@babel/plugin-proposal-decorators",
          {
            legacy: true,
          },
        ],
        [
          "@babel/plugin-proposal-class-properties",
          {
            loose: true,
          },
        ],
        ["@babel/plugin-proposal-optional-chaining"],
        ["@babel/plugin-proposal-object-rest-spread"],
        ["@babel/plugin-proposal-nullish-coalescing-operator"],
        ["@babel/plugin-proposal-numeric-separator"],
      ],
    },
    {
      plugins: userOptions.plugins,
      presets: userOptions.presets,
    },
  ];

  preprocessConfigs(loader, allOptions);

  const options = babel.loadOptions({
    root: config.root,
    sourceMaps: "inline",
    filename,
    overrides: allOptions,
  });

  if (!options) {
    throw new Error("failed to load babel config");
  }

  return { options };
}

function loadUserOptions(
  config: Config,
  loader: ModuleLoader
): babel.TransformOptions {
  if (!config.babelConfig) {
    return {};
  }

  return loader.require(config.babelConfig);
}

function preprocessConfigs(
  loader: ModuleLoader,
  options: babel.TransformOptions[]
) {
  options.forEach((o) => preprocessConfig(loader, o));
}

function preprocessConfig(
  loader: ModuleLoader,
  options: babel.TransformOptions
) {
  options.plugins = (options.plugins || []).map((p) => {
    const preloaded = preloadConfigItem(loader, "plugin", p);

    return babel.createConfigItem(preloaded, {
      type: "plugin",
    });
  });

  options.presets = (options.presets || []).map((p) => {
    const preloaded = preloadConfigItem(loader, "preset", p);

    return babel.createConfigItem(preloaded, {
      type: "preset",
    });
  });

  preprocessConfigs(loader, options.overrides || []);
}

function preloadConfigItem(
  loader: ModuleLoader,
  type: "plugin" | "preset",
  item: any
): any {
  let target: any = null;
  let rest: unknown[] = [];

  if (Array.isArray(item)) {
    target = item[0];
    rest = item.slice(1);
  } else {
    target = item;
  }

  if (typeof target === "string") {
    target = loadPlugin(loader, type, target);
  }

  return [target, ...rest];
}

function loadPlugin(
  loader: ModuleLoader,
  type: "plugin" | "preset",
  name: string
): any {
  const filepath = resolveStandardizedName(type, name, loader);

  if (!filepath) {
    throw new Error(`${type} ${name} not found`);
  }

  return requireModule(loader, type, filepath);
}

function standardizeName(type: "plugin" | "preset", name: string) {
  // Let absolute and relative paths through.
  if (path.isAbsolute(name)) return name;

  const isPreset = type === "preset";

  return (
    name
      // foo -> babel-preset-foo
      .replace(
        isPreset ? BABEL_PRESET_PREFIX_RE : BABEL_PLUGIN_PREFIX_RE,
        `babel-${type}-`
      )
      // @babel/es2015 -> @babel/preset-es2015
      .replace(
        isPreset ? BABEL_PRESET_ORG_RE : BABEL_PLUGIN_ORG_RE,
        `$1${type}-`
      )
      // @foo/mypreset -> @foo/babel-preset-mypreset
      .replace(
        isPreset ? OTHER_PRESET_ORG_RE : OTHER_PLUGIN_ORG_RE,
        `$1babel-${type}-`
      )
      // @foo -> @foo/babel-preset
      .replace(OTHER_ORG_DEFAULT_RE, `$1/babel-${type}`)
      // module:mypreset -> mypreset
      .replace(EXACT_RE, "")
  );
}

function resolveStandardizedName(
  type: "plugin" | "preset",
  name: string,
  loader: ModuleLoader
) {
  const standardizedName = standardizeName(type, name);

  try {
    return loader.resolve(standardizedName);
  } catch (e) {
    if (e.code !== "MODULE_NOT_FOUND") throw e;

    if (standardizedName !== name) {
      let resolvedOriginal = false;
      try {
        loader.resolve(name);
        resolvedOriginal = true;
      } catch {}

      if (resolvedOriginal) {
        e.message += `\n- If you want to resolve "${name}", use "module:${name}"`;
      }
    }

    let resolvedBabel = false;
    try {
      loader.resolve(standardizeName(type, `@babel/${name}`));
      resolvedBabel = true;
    } catch {}

    if (resolvedBabel) {
      e.message += `\n- Did you mean "@babel/${name}"?`;
    }

    let resolvedOppositeType = false;
    const oppositeType = type === "preset" ? "plugin" : "preset";
    try {
      loader.resolve(standardizeName(oppositeType, name));
      resolvedOppositeType = true;
    } catch {}

    if (resolvedOppositeType) {
      e.message += `\n- Did you accidentally pass a ${oppositeType} as a ${type}?`;
    }

    throw e;
  }
}

const LOADING_MODULES = new Set();
function requireModule(loader: ModuleLoader, type: string, name: string): any {
  if (LOADING_MODULES.has(name)) {
    throw new Error(
      `Reentrant ${type} detected trying to load "${name}". This module is not ignored ` +
        "and is trying to load itself while compiling itself, leading to a dependency cycle. " +
        'We recommend adding it to your "ignore" list in your babelrc, or to a .babelignore.'
    );
  }

  try {
    LOADING_MODULES.add(name);
    return loader.require(name);
  } finally {
    LOADING_MODULES.delete(name);
  }
}
