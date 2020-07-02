import * as path from "path";
import * as ts from "typescript";
import { Config } from "../config";
import { CompilerHost, Logger } from "../host";
import { TsConfig } from "./types";
import { EvictingCache } from "../cache";

export type Dependencies = {
    logger: Logger,
    config: Config,
    tsConfig: TsConfig,
    host: CompilerHost,
    sourceCache: EvictingCache<ts.SourceFile>,
}

export function buildTsHost({ logger, config, tsConfig, host, sourceCache }): ts.CompilerHost {
    const delegated = ts.createCompilerHost(tsConfig.options);

    return {
        getSourceFile(filename, languageVersion, onError, shouldCreateNewSourceFile) {
            return sourceCache.getOrInitialize(filename, (filePath) => {
                const sourceText = host.readFile(filePath);
    
                return ts.createSourceFile(filename, sourceText, languageVersion, true);
            });
        },

        getDefaultLibLocation(): string {
            return path.dirname(this.getDefaultLibFileName(tsConfig.options));
        },
        
        getDefaultLibFileName(options: ts.CompilerOptions): string {
            if (config.nodeModulesPrefix) {
                return path.join(config.nodeModulesPrefix, 'typescript/lib', ts.getDefaultLibFileName(options));
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
            return host.readFile(fileName)
        },

        fileExists(filePath: string): boolean {
            return host.fileExists(filePath)
        },

        trace(s: string): void {
            logger.log(s)
        },
    };
}
