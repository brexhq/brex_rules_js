import * as path from "path";
import {buildPathResolver} from "@brex_rules_js/compiler-infra/path-resolver";
import {parseArgs} from "@brex_rules_js/compiler-infra/arg-parser";

export type CliOptions = {
  _: string[];
  output: string;
  declarationOutput?: string;
  babelConfig: string;
  tsConfig: string;
  root: string;
  packageRoot: string;
  nodeModulesRoot: string;
  resolutionRoots: string[];
  typeRoots: string[];
  globalTypes: string[];
  declarations: string[];
  moduleRoots: { root: string; path: string }[];
  target: string;
};

export type Config = {
  inputFiles: string[];
  output: string;
  declarationOutput: string;
  babelConfig: string;
  tsConfig: string;
  root: string;
  packageRoot: string;
  nodeModulesRoot: string;
  resolutionRoots: string[];
  typeRoots: string[];
  globalTypes: string[];
  declarations: string[];
  moduleRoots: { [k: string]: string[] };
  target: string;
};

export function parseCli(args: string[]) {
  return parseArgs<CliOptions>({
    root: {
      type: "string",
      demandOption: true,
      normalize: true,
      coerce: (f) => path.resolve(f),
    },
    output: {
      type: "string",
      demandOption: true,
      normalize: true,
    },
    declarationOutput: {
      alias: "declaration-output",
      type: "string",
      normalize: true,
    },
    babelConfig: {
      alias: "babel-config",
      type: "string",
      normalize: true,
    },
    tsConfig: {
      alias: "ts-config",
      type: "string",
      normalize: true,
    },
    target: {
      type: "string",
      demandOption: true,
    },
    packageRoot: {
      type: "string",
      demandOption: true,
      normalize: true,
    },
    nodeModuleRoot: {
      alias: "node-module-prefix",
      type: "string",
      normalize: true,
    },
    resolutionRoots: {
      alias: "resolution-root",
      type: "array",
      nargs: 1,
      normalize: true,
    },
    typeRoots: {
      alias: "type-root",
      type: "array",
      nargs: 1,
      normalize: true,
    },
    globalTypes: {
      alias: "global-type",
      type: "array",
      nargs: 1,
    },
    declarations: {
      alias: "declaration",
      type: "array",
      nargs: 1,
      normalize: true,
    },
    moduleRoots: {
      alias: "module-root",
      type: "array",
      nargs: 1,
      coerce: (values: string[]) => {
        return values.map((value) => {
          const [root, p] = value.split(path.delimiter, 2);

          return { root, path: p };
        });
      },
    },
    _: {
      type: "string",
      normalize: true,
    },
  }, args);
}

export function buildConfig(cli: CliOptions) {
  const moduleRoots: { [k: string]: string[] } = {};

  for (const root of cli.moduleRoots) {
    if (!moduleRoots[root.root]) {
      moduleRoots[root.root] = [];
    }

    moduleRoots[root.root].push(root.path);
  }

  const config = {
    ...cli,
    moduleRoots,
    declarationOutput: cli.declarationOutput || cli.output,
    inputFiles: cli._,
  };

  const resolver = buildPathResolver(config.root, false);

  config.output = resolver.resolvePath(config.output);
  config.declarationOutput = resolver.resolvePath(config.declarationOutput);
  config.resolutionRoots = resolver.resolvePaths(config.resolutionRoots);
  config.nodeModulesRoot = resolver.resolvePath(config.nodeModulesRoot);
  config.typeRoots = resolver.resolvePaths(config.typeRoots);
  config.declarations = resolver.resolvePaths(config.declarations);
  config.inputFiles = resolver.resolvePaths(config.inputFiles);
  config.tsConfig = resolver.resolvePath(config.tsConfig);
  config.babelConfig = resolver.resolvePath(config.babelConfig);

  return { config, resolver };
}
