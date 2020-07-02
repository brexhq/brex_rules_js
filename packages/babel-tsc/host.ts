import * as fs from "fs";
import * as path from "path";
import { Config } from "./config"
import { EvictingCache } from "./cache";

export type Logger = {
    log(...items: unknown[])
}

export type CompilationResult = {
    result: 'ok',
} | {
    result: 'error',
    error: string | Error,
}

export type Dependencies = {
    logger: Logger,
    config: Config,
    fileCache: EvictingCache<string>,
    restrictToCache?: boolean,
}

export type CompilerHost = {
    fileExists(filePath: string, restrictToInputs?: boolean): boolean
    readFile(filePath: string): string | undefined
    writeFile(filename: string, contents: string)
}

export default function buildHost({ logger, config, fileCache, restrictToCache }: Dependencies): CompilerHost {
    const relativeRoots = config.resolutionRoots.map(r => path.relative(config.root, r));

    const resolveOutput = (fileName: string) => {
        let result = fileName;

        // outDir/relativeRoots[i]/path/to/file -> relativeRoots[i]/path/to/file
        if (fileName.startsWith(config.root)) {
            result = path.relative(config.root, fileName);
        }

        for (const dir of relativeRoots) {
            // relativeRoots[i]/path/to/file -> path/to/file
            const rel = path.relative(dir, result);
            if (!rel.startsWith('..')) {
                result = rel;
                // relativeRoots is sorted longest first so we can short-circuit
                // after the first match
                break;
            }
        }
        return result;
    };

    return {
        fileExists(filePath, restrictToInputs) {
            if (restrictToCache) {
                if (!restrictToInputs) {
                    return fileCache.inManifest(filePath);
                }

                return config.inputFiles.indexOf(filePath) !== -1;
            } else {
                return fs.existsSync(filePath);
            }
        },

        readFile(filename) {
            return fileCache.getOrInitialize(filename, (filename) => {
                return fs.readFileSync(filename, 'utf-8');
            });
        },

        writeFile(filename, contents) {
            let output = path.join(config.output, resolveOutput(filename));

            fs.mkdirSync(path.dirname(output), { recursive: true });

            if (!fs.existsSync(output) || fs.readFileSync(output, 'utf-8') !== contents) {
                fs.writeFileSync(output, contents);
            }
        },
    }
}
