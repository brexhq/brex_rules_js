import path from 'path';
import yargs from 'yargs';

export type PluginMap = {[k: string]: Plugin}

export type ImportMap = {[source: string]: string}

export type CliOptions = {
  output: string,
  expected: string[],
  protoc: string,
  plugins: {name: string, exec?: string}[],
  pluginOptions: {name: string, options: string}[],
  importMap: {source: string, target: string}[],
  descriptorSets: string[],
  _: string[],
}

export type Config = {
  output: string,
  expected: string[],
  protoc: string,
  plugins: PluginMap,
  importMap: ImportMap,
  descriptorSets: string[],
  inputFiles: string[],
}

export type Plugin = {
  name: string,
  exec?: string,
  options?: string,
}

const yargsOptions: {[k: string]: yargs.Options} = {
  'plugins': {
    alias: 'plugin',
    type: 'array',
    demandOption: true,
    desc: 'Plugin(s) to use in format <name>[:path]',
    nargs: 1,
    coerce: (values) => {
      return values.map((value) => {
        const [name, exec] = value.split(path.delimiter, 2);

        return { name, exec };
      });
    },
  },
  'pluginOptions': {
    alias: 'plugin-option',
    type: 'array',
    desc: 'Options for a particular plugin in format <name>:options',
    nargs: 1,
    coerce: (values) => {
      return values.map((value) => {
        const [name, options] = value.split(path.delimiter, 2);

        return { name, options };
      });
    },
  },
  'protoc': {
    type: 'string',
    demandOption: true,
    normalize: true,
    desc: 'Path to protoc',
  },
  'output': {
    type: 'string',
    demandOption: true,
    normalize: true,
    desc: 'Output directory',
  },
  'expected': {
    type: 'array',
    demandOption: true,
    normalize: true,
    desc: 'Files expected to be generated and should get transpiled',
  },
  'importMap': {
    alias: 'import-map',
    type: 'array',
    desc: 'Import map in the format <source import>:<target import>',
    nargs: 1,
    coerce: (values) => {
      return values.map((value) => {
        const [source, target] = value.split(path.delimiter, 2);

        return { source, target }
      });
    },
  },
  'descriptorSets': {
    alias: 'descriptor-set',
    type: 'array',
    normalize: true,
    nargs: 1,
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
  const plugins: PluginMap = {};
  const importMap: ImportMap = {};

  for (let plugin of cli.plugins) {
    if (plugins[plugin.name]) {
      throw new Error(`Duplicated plugin '${plugin.name}' declared`);
    }

    plugins[plugin.name] = {
      name: plugin.name,
      exec: plugin.exec,
    }
  }

  for (let option of cli.pluginOptions) {
    if (!plugins[option.name]) {
      throw new Error(`Supplied options for unknown plugin '${option.name}'`)
    }

    plugins[option.name].options = option.options;
  }

  for (let imp of cli.importMap) {
    importMap[imp.source] = imp.target
  }

  return {
    expected: cli.expected,
    output: cli.output,
    protoc: cli.protoc,
    descriptorSets: cli.descriptorSets,
    inputFiles: cli._,
    importMap: importMap,
    plugins: plugins,
  }
}
