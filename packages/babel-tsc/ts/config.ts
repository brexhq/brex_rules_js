import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { Cache } from "@brex_rules_js/compiler-infra/cache";
import { Config } from "../config";
import { TsConfig } from "./types";
import { CompilerHost, Logger } from "../host";

type Dependencies = {
  logger: Logger;
  config: Config;
  host: CompilerHost;
  cache: Cache<ts.ParsedCommandLine>;
};

export function buildTsConfig({
  config,
  logger,
  host,
  cache,
}: Dependencies): TsConfig {
  const baseOptions: ts.CompilerOptions = {
    // Output
    declaration: true,
    emitDeclarationOnly: true,
    noEmitOnError: true,
    outDir: config.output,
    declarationDir: config.declarationOutput,

    // Source Maps
    declarationMap: false,
    inlineSourceMap: true,
    inlineSources: true,

    // Enable extra features
    experimentalDecorators: true,
    emitDecoratorMetadata: true,
    preserveConstEnums: true,
    skipDefaultLibCheck: true,

    // Module resolution
    baseUrl: config.root,
    esModuleInterop: true,
    moduleResolution: ts.ModuleResolutionKind.NodeJs,
    paths: config.moduleRoots,
    rootDir: config.root,
    rootDirs: config.resolutionRoots,
    typeRoots: config.typeRoots,
  };

  const configHost = buildParseConfigHost(logger, host);
  let userOptions = {};

  if (config.tsConfig) {
    const result = cache.getOrInitialize(config.tsConfig, () =>
      loadUserConfig(config, configHost)
    );

    if (result.errors.length > 0) {
      // TODO: Print diagnostics
      logger.log(result.errors);
      throw new Error("error loading tsconfig");
    }

    userOptions = result.options;
  }

  const options = { ...userOptions, ...baseOptions };

  options.types = [].concat(options.types || [], config.globalTypes || []);

  return { options };
}

function loadUserConfig(
  config: Config,
  host: ts.ParseConfigHost
): ts.ParsedCommandLine {
  if (!config.tsConfig) {
    return {
      options: {},
      errors: [],
      fileNames: [],
    };
  }

  const { config: raw, error: loadError } = ts.readConfigFile(
    config.tsConfig,
    (path) => fs.readFileSync(path, "utf-8")
  );

  if (loadError) {
    return {
      options: {},
      errors: [loadError],
      fileNames: [],
    };
  }

  return ts.parseJsonConfigFileContent(
    {
      compilerOptions: raw.compilerOptions || {},
      files: config.inputFiles,
    },
    host,
    path.dirname(config.root)
  );
}

function buildParseConfigHost(
  logger: Logger,
  host: CompilerHost
): ts.ParseConfigHost {
  return {
    useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,

    readDirectory(
      rootDir: string,
      extensions: readonly string[],
      excludes: readonly string[] | undefined,
      includes: readonly string[],
      depth?: number
    ): readonly string[] {
      return ts.sys.readDirectory(
        rootDir,
        extensions,
        excludes,
        includes,
        depth
      );
    },

    fileExists(path: string): boolean {
      return host.fileExists(path);
    },

    readFile(path: string): string | undefined {
      return host.readFile(path);
    },

    trace(s: string): void {
      logger.log(s);
    },
  };
}
