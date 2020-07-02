import * as fs from "fs";
import * as path from "path";
import * as ts from "typescript";
import { Config } from "../config";
import { TsConfig } from "./types";
import { CompilerHost, Logger } from "../host";
import { EvictingCache } from "../cache";

type Dependencies = {
    logger: Logger,
    config: Config,
    host: CompilerHost,
    cache: EvictingCache<ts.ParsedCommandLine>,
}

export function buildTsConfig({ config, logger, host, cache }: Dependencies): TsConfig {
    const baseOptions: ts.CompilerOptions = {
        declaration: true,
        emitDeclarationOnly: true,
        esModuleInterop: true,
        inlineSourceMap: true,
        inlineSources: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        preserveConstEnums: false,
        skipDefaultLibCheck: true,
        moduleResolution: ts.ModuleResolutionKind.NodeJs,
        rootDir: config.root,
        rootDirs: config.resolutionRoots,
        baseUrl: config.root,
        outDir: config.output,
        declarationDir: config.output,
        typeRoots: config.typeRoots,
        paths: config.moduleRoots,
    }

    const configHost = buildParseConfigHost(logger, host)
    let userOptions = {}
    
    if (config.tsConfig) {
        const result = cache.getOrInitialize(config.tsConfig, () => loadUserConfig(config, configHost))

        if (result.errors.length > 0) {
            // TODO: Print diagnostics
            logger.log(result.errors);
            throw new Error("error loading tsconfig")
        }

        userOptions = result.options
    }

    const options = Object.assign({}, userOptions, baseOptions);

    return { options };
};

function loadUserConfig(config: Config, host: ts.ParseConfigHost): ts.ParsedCommandLine {
    if (!config.tsConfig) {
        return {
            options: {},
            errors: [],
            fileNames: [],
        }
    }

    const { config: raw, error: loadError } = ts.readConfigFile(config.tsConfig, (path) => fs.readFileSync(path, 'utf-8'));

    if (loadError) {
        return {
            options: {},
            errors: [loadError],
            fileNames: [],
        }
    }

    return ts.parseJsonConfigFileContent({
        compilerOptions: raw.compilerOptions || {},
        files: config.inputFiles,
    }, host, path.dirname(config.root));
}

function buildParseConfigHost(logger: Logger, host: CompilerHost): ts.ParseConfigHost {
    return {
        useCaseSensitiveFileNames: ts.sys.useCaseSensitiveFileNames,

        readDirectory(rootDir: string, extensions: readonly string[], excludes: readonly string[] | undefined, includes: readonly string[], depth?: number): readonly string[] {
            return ts.sys.readDirectory(rootDir, extensions, excludes, includes, depth)
        },

        fileExists(path: string): boolean {
            return host.fileExists(path)
        },

        readFile(path: string): string | undefined {
            return host.readFile(path)
        },

        trace(s: string): void {
            logger.log(s)
        }
    }
}
