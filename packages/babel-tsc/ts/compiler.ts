import * as ts from "typescript";
import { Cache, EvictingCache } from "../cache";
import { Config } from "../config";
import { CompilerHost, Logger, CompilationResult } from "../host";
import { TsConfig } from "./types";
import { buildTsHost } from "./host";

type Context = {
    config: Config,
    host: CompilerHost,
    logger: Logger,

    tsConfig: TsConfig,
    sourceCache: EvictingCache<ts.SourceFile>,
    programCache: Cache<ts.Program>,
}

export async function compileDeclarations(ctx: Context, files: string[]): Promise<CompilationResult> {
    const host = buildTsHost(ctx);

    const inputs = [files, ctx.config.declarations].flat();
    const existing = ctx.programCache.get(ctx.config.target, undefined);
    const program = ts.createProgram(inputs, ctx.tsConfig.options, host, existing);

    ctx.programCache.put(ctx.config.target, undefined, program);

    const targets =
        program.getSourceFiles()
            .filter(x => files.indexOf(x.fileName) !== -1);

    const diagnostics: ts.Diagnostic[] = [];

    for (let target of targets) {
        const result = program.emit(target);

        diagnostics.push(...result.diagnostics);
    }

    diagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let { line, character } = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n");
            ctx.logger.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        } else {
            ctx.logger.log(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
        }
    });

    if (diagnostics.length > 0) {
        return {
            result: 'error',
            error: new Error('Typescript compilation failed'),
        }
    }

    return {
        result: 'ok',
    }
}
