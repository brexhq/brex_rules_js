import * as path from "path";
import {buildPathResolver} from "@brex_rules_js/compiler-infra/path-resolver";
import {parseArgs} from "@brex_rules_js/compiler-infra/arg-parser";

export type ModuleRoot = {
  root: string,
  path: string,
}

export type Options = {
  root?: string,
  config?: string;
  packageJson?: string,
  statusFile?: string,
  diffFile?: string,
  nodeModulesRoot: string,
  moduleRoots: ModuleRoot[],
  _: string[];
};

export function parseCli(argv: string[]) {
  const options = parseArgs<Options>(
    {
      root: {
        type: "string",
        normalize: true,
        default: ".",
        coerce: (f) => path.resolve(f),
      },
      statusFile: {
        type: "string",
        normalize: true,
      },
      diffFile: {
        type: "string",
        normalize: true,
      },
      config: {
        type: "string",
        normalize: true,
      },
      packageJson: {
        type: "string",
        normalize: true,
      },
      nodeModulesRoot: {
        type: "string",
        demand: true,
        normalize: true,
      },
      moduleRoots: {
        alias: "moduleRoot",
        type: "array",
        nargs: 1,
        coerce: (values: string[]) => {
          return values.map((f) => {
            const parts = f.split(":", 2);

            return {
              root: parts[0],
              path: parts[1],
            };
          });
        },
      },
    },
    argv
  );

  return resolvePaths(options);
}

export function resolvePaths(options: Options) {
  const resolver = buildPathResolver(options.root, false);

  options = {...options};

  options.config = resolver.resolvePath(options.config);
  options.packageJson = resolver.resolvePath(options.packageJson);
  options.nodeModulesRoot = resolver.resolvePath(options.nodeModulesRoot);
  options.moduleRoots = resolver.resolvePathObjects('path', options.moduleRoots || []);
  options._ = resolver.resolvePaths(options._);

  return { options, resolver };
}
