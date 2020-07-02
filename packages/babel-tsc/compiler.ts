import * as path from "path";
import * as ts from "typescript";
import { parseCli, buildConfig } from "./config";
import buildCache, { CacheManifest, EvictingCache } from "./cache";
import buildHost, { Logger } from './host';
import { compileDeclarations, buildTsConfig } from './ts';
import { compileToJavascript } from './js';

type Compiler = {
    compile(args: string[], manifest?: CacheManifest): Promise<boolean>
}

export function buildCompiler(logger: Logger): Compiler {
    const caches = {
        file: new EvictingCache<string>(),
        source: new EvictingCache<ts.SourceFile>(),
        tsConfig: new EvictingCache<ts.ParsedCommandLine>(),
        program: buildCache<ts.Program>(),
    }

    const getUpdatedCache = <T>(cache: EvictingCache<T>, manifest?: CacheManifest) => {
        if (manifest) {
            const inputs = new Map<string, string>();

            for (let key of Object.keys(manifest)) {
                inputs.set(path.resolve(key), manifest[key]);
            }

            cache.updateCache(inputs);
        }

        return cache;
    }

    return {
        async compile(args, manifest) {
            const cli = parseCli(args);
            const config = buildConfig(cli);
            const fileCache = getUpdatedCache(caches.file, manifest);
            const sourceCache = getUpdatedCache(caches.source, manifest);
            const tsConfigCache = getUpdatedCache(caches.tsConfig, manifest);

            const host = buildHost({
                logger,
                config,
                fileCache,
                restrictToCache: !!manifest,
            });

            const tsConfig = buildTsConfig({
                config,
                host,
                logger,
                cache: tsConfigCache,
            })

            const results = await Promise.all([
                compileDeclarations({
                    logger,
                    config,
                    host,
                    sourceCache,
                    programCache: caches.program,
                    tsConfig,
                }, config.inputFiles),

                // Transpile
                ...config.inputFiles.map(f => compileToJavascript({
                    logger,
                    host,
                    config,
                }, f)),
            ])

            let success = true;

            for (let result of results) {
                if (result.result == 'error') {
                    success = false;
                }
            }

            return success;
        }
    }
}
