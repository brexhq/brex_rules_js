import * as path from 'path';
import yargs from 'yargs';

export type ModuleRoot = {
  root: string,
  path: string,
}

export type Entrypoint = {
  name: string,
  path: string,
}

export type CliOptions = {
  root: string,
  output: string,
  config: string,
  entrypoints: Entrypoint[],
  nodeModulesPrefix: string,
  moduleRoots: ModuleRoot[],
}

export type Config = {
  root: string,
  output: string,
  config: string,
  entrypoints: Entrypoint[],
  nodeModulesPrefix: string,
  moduleRoots: ModuleRoot[],
}

const yargsOptions: { [k: string]: yargs.Options } = {
  'root': {
    type: 'string',
    demandOption: true,
    normalize: true,
  },
  'output': {
    type: 'string',
    //demandOption: true,
    normalize: true,
  },
  'nodeModulePrefix': {
    alias: 'node-module-prefix',
    type: 'string',
    normalize: true,
  },
  'moduleRoots': {
    alias: 'module-root',
    type: 'array',
    nargs: 1,
    coerce: (values) => {
      return values.map((value) => {
        const [root, p] = value.split(path.delimiter, 2)

        return { root, path: p }
      });
    },
  },
  'config': {
    alias: 'config',
    type: 'string',
    normalize: true,
  },
  'entrypoints': {
    alias: 'entrypoint',
    type: 'array',
    demandOption: true,
    nargs: 1,
    coerce(values) {
      return values.map((value) => {
        const [nameOrPath, path] = value.split(':', 2)

        if (path) {
          return { name: nameOrPath, path: path };
        } else {
          return { name: 'main', path: nameOrPath };
        }
      })
    }
  },
};

export function parseCli(args: string[]) {
  return yargs
    .exitProcess(false)
    .options(yargsOptions)
    .parse(args) as unknown as CliOptions;
}

export function buildConfig(cli: CliOptions): Config {
  const config = {
    ...cli,
  }

  config.root = path.resolve(config.root)
  config.nodeModulesPrefix = path.resolve(config.root, config.nodeModulesPrefix)

  if (config.output) {
    config.output = path.resolve(config.root, config.output)
  }

  if (config.config) {
    config.config = path.resolve(config.root, config.config)
  }

  for (let entry of config.entrypoints) {
    entry.path = path.resolve(config.root, entry.path)
  }

  for (let root of config.moduleRoots) {
    root.path = path.resolve(config.root, root.path)
  }

  return config;
}
