import * as path from 'path';
import yargs from 'yargs';

export type CliOptions = {
  _: string[],
  output: string,
  babelConfig: string,
  tsConfig: string,
  root: string,
  nodeModulesPrefix: string,
  resolutionRoots: string[],
  typeRoots: string[],
  declarations: string[],
  moduleRoots: {root: string, path: string}[],
  target: string,
}

export type Config = {
  inputFiles: string[],
  output: string,
  babelConfig: string,
  tsConfig: string,
  root: string,
  nodeModulesPrefix: string,
  resolutionRoots: string[],
  typeRoots: string[],
  declarations: string[],
  moduleRoots: {[k: string]: string[]},
  target: string,
}

const yargsOptions: { [k: string]: yargs.Options } = {
  'output': {
    type: 'string',
    demandOption: true,
    normalize: true,
  },
  'babelConfig': {
    alias: 'babel-config',
    type: 'string',
    normalize: true,
  },
  'tsConfig': {
    alias: 'ts-config',
    type: 'string',
    normalize: true,
  },
  'target': {
    type: 'string',
    demandOption: true,
  },
  'root': {
    type: 'string',
    demandOption: true,
    normalize: true,
  },
  'nodeModulePrefix': {
    alias: 'node-module-prefix',
    type: 'string',
    normalize: true,
  },
  'resolutionRoots': {
    alias: 'resolution-root',
    type: 'array',
    nargs: 1,
    normalize: true,
  },
  'typeRoots': {
    alias: 'type-root',
    type: 'array',
    nargs: 1,
    normalize: true,
  },
  'declarations': {
    alias: 'declaration',
    type: 'array',
    nargs: 1,
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
  '_': {
    type: 'string',
    normalize: true,
  }
};

export function parseCli(args: string[]) {
  return yargs
    .exitProcess(false)
    .options(yargsOptions)
    .parse(args) as unknown as CliOptions;
}

export function buildConfig(cli: CliOptions): Config {
  const moduleRoots: { [k: string]: string[] } = {}
  
  for (let root of cli.moduleRoots) {
    if (!moduleRoots[root.root]) {
      moduleRoots[root.root] = []
    }

    moduleRoots[root.root].push(root.path)
  }

  const config = {
    ...cli,
    moduleRoots,
    inputFiles: cli._,
  }

  config.root = path.resolve(config.root);

  if (config.tsConfig) {
    config.tsConfig = path.resolve(config.root, config.tsConfig);
  }

  if (config.babelConfig) {
    config.babelConfig = path.resolve(config.root, config.babelConfig);
  }

  config.resolutionRoots = config.resolutionRoots.map(f => path.resolve(config.root, f));
  config.resolutionRoots.sort((a, b) => b.length - a.length);

  config.nodeModulesPrefix = path.resolve(config.root, config.nodeModulesPrefix);
  config.typeRoots = config.typeRoots.map(f => path.resolve(config.root, f));
  config.declarations = config.declarations.map(f => path.resolve(config.root, f));
  config.inputFiles = config.inputFiles.map(f => path.resolve(config.root, f));

  return config;
}
