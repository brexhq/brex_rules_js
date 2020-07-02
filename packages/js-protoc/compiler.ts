import * as path from 'path';
import { readFileSync, writeFileSync } from "fs";
import { transformAsync } from "@babel/core";
import { Config } from "./config";
import babelTypescript from "@babel/plugin-syntax-typescript";

export async function transpileFile(config: Config, file: string, out: string) {
  const contents = readFileSync(file, 'utf8');
  const result = await transpile(config, file, contents);

  writeFileSync(out, result, 'utf8');
}

export async function transpile(config: Config, file: string, contents: string): Promise<string> {
  // Cleanup the mess google-protobuf does
  if (path.extname(file) == '.js') {
    contents = contents.replace(
      'var global = Function(\'return this\')();',
      'var proto = {};\nvar global = {proto: proto};'
    )
  }

  const result = await transformAsync(contents, {
    ast: false,
    code: true,
    filename: file,
    configFile: false,
    babelrc: false,
    plugins: [
      babelTypescript,
      [transformImports, config],
    ],
  })

  if (!result || result.code == null) {
    throw new Error("no output returned")
  }

  return result.code;
}

function transformImports(babel, config: Config) {
  return {
    visitor: {
      CallExpression(path, state) {
        if (path.node.callee.name != 'require') {
          return
        }

        const [specifier] = path.node.arguments;

        if (!specifier || specifier.type != 'StringLiteral') {
          return
        }

        specifier.value = fixImport(specifier.value, state.file.opts.filename);
      },
    }
  }

  function fixImport(imp, from) {
    let result = imp;

    if (/^\.\.?\//.test(result)) {
      const fromPackage = path.dirname(from);

      result = path.resolve(fromPackage, result)
      result = path.relative(config.output, result)
    }

    if (config.importMap[result]) {
      result = config.importMap[result]
    }

    return result
  }
}
