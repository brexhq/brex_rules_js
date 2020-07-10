import webpack from 'webpack';
import AliasPlugin from "enhanced-resolve/lib/AliasPlugin";
import { Config } from './config';
import { getNativeLoader, buildScopedModuleLoader, ModuleLoader, buildScopedResolver } from '@brex_rules_js/compiler-infra/module-loader';

type CustomConfiguration = {
  polyfills?: string[],
}

export function buildModuleLoader(config: Config): ModuleLoader {
  const sys = getNativeLoader();
  const scoped = buildScopedResolver(config.nodeModulesPrefix);
  
  return buildScopedModuleLoader(scoped, sys);
}

export function buildCompiler(config: Config): webpack.Compiler {
  const loader = buildModuleLoader(config);
  const webpackConfig = buildWebpackConfig(config, loader);
  const compiler = webpack(webpackConfig);

  return compiler;
}

export function buildWebpackConfig(config: Config, loader: ModuleLoader): webpack.Configuration {
  const { userConfig, custom } = buildUserConfig(config, loader);

  const entry = config.entrypoints.reduce((all, e) => {
    all[e.name] = [...(custom.polyfills || []), e.path];

    return all
  }, {})

  const alias = config.moduleRoots
    .filter(r => r.root != '')
    .map(r => ({
      name: r.root,
      alias: r.path,
      onlyModule: false,
    }))

  return {
    ...userConfig,

    mode: 'development',
    context: config.root,
    entry: entry,

    output: {
      ...userConfig.output,

      path: config.output,
    },

    resolve: {
      modules: [config.nodeModulesPrefix],

      plugins: [
        new AliasPlugin("described-resolve", alias, "resolve"),
      ]
    },

    resolveLoader: {
      modules: [config.nodeModulesPrefix],
    },
  }
}

function buildUserConfig(config: Config, loader: ModuleLoader): { userConfig: webpack.Configuration, custom: CustomConfiguration } {
  if (!config.config) {
    return { userConfig: {}, custom: {} }
  }

  const loaded = loader.require(config.config) as webpack.Configuration & { bazel: CustomConfiguration }
  const custom = loaded.bazel || {};

  delete loaded.bazel;

  return {
    userConfig: loaded,
    custom: custom,
  }
}
