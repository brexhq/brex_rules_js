import * as babel from "@babel/core";
import { CompilerHost, Logger, CompilationResult } from "../host";
import { replaceExtension } from "../utils";
import { BabelConfig, buildBabelConfig } from "./config";
import { Config } from "../config";

type Context = {
    config: Config,
    host: CompilerHost,
    logger: Logger,
}

export async function compileToJavascript(ctx: Context, file: string): Promise<CompilationResult> {
    const source = ctx.host.readFile(file);
    const babelConfig = buildBabelConfig(ctx.config, file);

    const result = await babel.transformAsync(source, {
        ...babelConfig.options,

        code: true,
        ast: false,
    });

    if (!result || result.code == null) {
        return {
            result: 'error',
            error: new Error('not output'),
        }
    }

    let output = replaceExtension(file, '.js');

    ctx.host.writeFile(output, result.code)

    return {
        result: 'ok',
    };
}
