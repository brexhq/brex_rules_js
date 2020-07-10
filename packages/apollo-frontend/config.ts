import * as path from 'path';
import yargs from 'yargs';

export type CliOptions = {
  root: string,
  output: string,
  config: string,
  schema: string,
  global: boolean,
  globalTypesPackage: string,
  _: string[],
}

export type Config = {
  root: string,
  output: string,
  config: string,
  schema: string,
  global: boolean,
  globalTypesPackage: string,
  inputFiles: string[],
}

const yargsOptions: { [k: string]: yargs.Options } = {
  'root': {
    type: 'string',
    demandOption: true,
    normalize: true,
  },
  'output': {
    type: 'string',
    demandOption: true,
    normalize: true,
  },
  'config': {
    type: 'string',
    normalize: true,
  },
  'schema': {
    type: 'string',
    demandOption: true,
    normalize: true,
  },
  'global': {
    type: 'boolean',
  },
  'globalTypesPackage': {
    alias: 'global-types-package',
    type: 'string',
    normalize: true,
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

    inputFiles: cli._ || [],
  }

  config.root = path.resolve(config.root)
  config.schema = path.resolve(config.root, config.schema)
  config.output = path.resolve(config.root, config.output)

  if (config.config) {
    config.config = path.resolve(config.root, config.config)
  }

  config.inputFiles = config.inputFiles.map(f => path.resolve(config.root, f))

  return config;
}
