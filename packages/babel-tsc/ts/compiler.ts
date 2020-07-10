import * as ts from "typescript";
import { Cache } from "@brex_rules_js/compiler-infra/cache";
import { Config } from "../config";
import { CompilationResult, CompilerHost, Logger } from "../host";
import { TsConfig } from "./types";
import { buildTsHost } from "./host";

type Context = {
  config: Config;
  host: CompilerHost;
  logger: Logger;

  tsConfig: TsConfig;
  sourceCache: Cache<ts.SourceFile>;
  programCache: Cache<ts.Program>;
};

function getProgramFromCache(
  ctx: Context,
  host: ts.CompilerHost,
  files: string[]
): ts.Program {
  try {
    const existing = ctx.programCache.get(ctx.config.target);
    const program = ts.createProgram(
      files,
      ctx.tsConfig.options,
      host,
      existing
    );

    ctx.programCache.put(ctx.config.target, program);

    return program;
  } catch {
    ctx.logger.log(`Warning: Cache error while building ${ctx.config.target}, please report this to brex_rules_js maintainers. This will _not_ affect your build.`);

    // Updating the cache fails sometimes, start over if so
    const program = ts.createProgram(files, ctx.tsConfig.options, host);

    ctx.programCache.put(ctx.config.target, program);

    return program;
  }
}

export async function compileDeclarations(
  ctx: Context,
  files: string[]
): Promise<CompilationResult> {
  const host = buildTsHost(ctx);
  const program = getProgramFromCache(ctx, host, files);

  const targets = program
    .getSourceFiles()
    .filter((x) => files.indexOf(x.fileName) !== -1);

  const diagnostics: ts.Diagnostic[] = [];

  for (const target of targets) {
    const result = program.emit(target);

    diagnostics.push(...result.diagnostics);
  }

  diagnostics.forEach((diagnostic) => {
    if (diagnostic.file) {
      const { line, character } = diagnostic.file.getLineAndCharacterOfPosition(
        diagnostic.start!
      );
      const message = ts.flattenDiagnosticMessageText(
        diagnostic.messageText,
        "\n"
      );
      ctx.logger.log(
        `${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`
      );
    } else {
      ctx.logger.log(
        ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n")
      );
    }
  });

  if (diagnostics.length > 0) {
    return {
      result: "error",
      error: new Error("Typescript compilation failed"),
    };
  }

  return {
    result: "ok",
  };
}
