import * as path from "path";
import * as babel from "@babel/core";
import { ModuleLoader } from "@brex_rules_js/compiler-infra/module-loader";
import { CompilationResult, CompilerHost, Logger } from "../host";
import { replaceExtension } from "../utils";
import { buildBabelConfig } from "./config";
import { Config } from "../config";

type Context = {
  config: Config;
  host: CompilerHost;
  logger: Logger;
  loader: ModuleLoader;
};

export async function compileToJavascript(
  ctx: Context,
  file: string
): Promise<CompilationResult> {
  const source = ctx.host.readFile(file);
  const babelConfig = buildBabelConfig(ctx.config, ctx.loader, file);

  const result = await babel.transformAsync(source, {
    ...babelConfig.options,

    code: true,
    ast: false,
  });

  if (!result || result.code == null) {
    return {
      result: "error",
      error: new Error("no output"),
    };
  }

  let output = file;

  output = replaceExtension(output, ".js");
  output = path.relative(ctx.config.root, output);
  output = path.join(ctx.config.output, output);

  ctx.host.writeFile(output, result.code);

  return {
    result: "ok",
  };
}
