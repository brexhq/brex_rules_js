import * as path from "path";
import * as ts from "typescript";
import { Cache } from "@brex_rules_js/compiler-infra/cache";
import { Config } from "../config";
import { CompilerHost, Logger } from "../host";
import { TsConfig } from "./types";

export type Dependencies = {
  logger: Logger;
  config: Config;
  tsConfig: TsConfig;
  host: CompilerHost;
  sourceCache: Cache<ts.SourceFile>;
};

export function buildTsHost({
  logger,
  config,
  tsConfig,
  host,
  sourceCache,
}): ts.CompilerHost {
  const delegated = ts.createCompilerHost(tsConfig.options);

  return {
    getSourceFile(
      filename,
      languageVersion,
      _onError,
      shouldCreateNewSourceFile
    ) {
      // FIXME: This happens when compiler options change
      // maybe source file cache should be coupled to the tsconfig cache.
      // Right now we just invalidate, but might be able to be optimized
      // if we have too many cache misses, on the expense of memory.
      if (shouldCreateNewSourceFile) {
        sourceCache.delete(filename);
      }

      return sourceCache.getOrInitialize(filename, (filePath) => {
        const sourceText = host.readFile(filePath);

        return ts.createSourceFile(filename, sourceText, languageVersion, true);
      });
    },

    getDefaultLibLocation(): string {
      return path.dirname(this.getDefaultLibFileName(tsConfig.options));
    },

    getDefaultLibFileName(options: ts.CompilerOptions): string {
      if (config.nodeModulesRoot) {
        return path.join(
          config.nodeModulesRoot,
          "typescript/lib",
          ts.getDefaultLibFileName(options)
        );
      }

      return delegated.getDefaultLibFileName(options);
    },

    getCanonicalFileName(path: string) {
      return delegated.getCanonicalFileName(path);
    },

    getCurrentDirectory(): string {
      return delegated.getCurrentDirectory();
    },

    useCaseSensitiveFileNames(): boolean {
      return delegated.useCaseSensitiveFileNames();
    },

    getNewLine(): string {
      return delegated.getNewLine();
    },

    getDirectories(path: string) {
      return delegated.getDirectories ? delegated.getDirectories(path) : [];
    },

    writeFile(filename, contents) {
      host.writeFile(filename, contents);
    },

    readFile(fileName: string): string | undefined {
      return host.readFile(fileName);
    },

    fileExists(filePath: string): boolean {
      return host.fileExists(filePath);
    },

    trace(s: string): void {
      logger.log(s);
    },
  };
}
