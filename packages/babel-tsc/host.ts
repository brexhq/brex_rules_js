import * as fs from "fs";
import * as path from "path";
import { Config } from "./config";
import { Cache } from "../compiler-infra/cache";

export type Logger = {
  log(...items: unknown[]): void;
};

export type CompilationResult =
  | {
      result: "ok";
    }
  | {
      result: "error";
      error: string | Error;
    };

export type Dependencies = {
  logger: Logger;
  config: Config;
  fileCache: Cache<string>;
  restrictToCache?: boolean;
};

export type CompilerHost = {
  fileExists(filePath: string, restrictToInputs?: boolean): boolean;
  readFile(filePath: string): string | undefined;
  writeFile(filename: string, contents: string): void;
};

export default function buildHost({
  config,
  fileCache,
  restrictToCache,
}: Dependencies): CompilerHost {
  const outputPaths = [config.output, config.declarationOutput].sort(
    (a, b) => b.length - a.length
  );

  const relativeRoots = config.resolutionRoots
    .sort((a, b) => b.length - a.length)
    .map((r) => path.relative(config.root, r));

  const resolveOutput = (fileName: string) => {
    let outputBase = "";
    let result = fileName;

    for (const outputPath of outputPaths) {
      // outDir/relativeRoots[i]/path/to/file -> relativeRoots[i]/path/to/file
      if (result.startsWith(outputPath)) {
        outputBase = outputPath;
        result = path.relative(outputBase, result);
        break;
      }
    }

    for (const dir of relativeRoots) {
      // relativeRoots[i]/path/to/file -> path/to/file
      const rel = path.relative(dir, result);
      if (!rel.startsWith("..")) {
        result = rel;
        // relativeRoots is sorted longest first so we can short-circuit
        // after the first match
        break;
      }
    }

    result = path.relative(config.packageRoot, result);

    return path.join(outputBase, result);
  };

  return {
    fileExists(filePath, restrictToInputs) {
      if (restrictToCache) {
        if (!restrictToInputs) {
          return fileCache.isInManifest(filePath);
        }

        return config.inputFiles.indexOf(filePath) !== -1;
      }
      return fs.existsSync(filePath);
    },

    readFile(filename) {
      return fileCache.getOrInitialize(filename, (filename) => {
        return fs.readFileSync(filename, "utf-8");
      });
    },

    writeFile(filename, contents) {
      const output = resolveOutput(filename);

      fs.mkdirSync(path.dirname(output), { recursive: true });

      if (
        !fs.existsSync(output) ||
        fs.readFileSync(output, "utf-8") !== contents
      ) {
        fs.writeFileSync(output, contents);
      }
    },
  };
}
