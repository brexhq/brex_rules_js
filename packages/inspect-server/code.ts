import * as fs from "fs";
import { parse, ParserOptions } from "@babel/parser";
import traverse from "@babel/traverse";

export default function inspectCode(filename: string) {
  const contents = fs.readFileSync(filename, 'utf-8');

  const ast = parse(contents, {
    errorRecovery: true,
    sourceType: "module",
    strictMode: false,
    plugins: [
      "jsx",
      "typescript",
      "classProperties",
      "decorators-legacy",
      "objectRestSpread",
      "numericSeparator",
    ],
  } as unknown as ParserOptions);

  const imports: string[] = [];

  traverse(ast, {
    ImportDeclaration(path) {
      imports.push(path.node.source.value);
    },

    ExportAllDeclaration(path) {
      if (path.node.source) {
        imports.push(path.node.source.value);
      }
    },

    ExportNamedDeclaration(path) {
      if (path.node.source) {
        imports.push(path.node.source.value);
      }
    },

    CallExpression(path) {
      const node = path.node;

      if (node.callee.type != "Identifier") {
        return;
      }

      if (node.callee.name != "require") {
        return;
      }

      if (node.arguments[0].type != "StringLiteral") {
        return;
      }

      imports.push(node.arguments[0].value);
    },
  })

  return {
    ok: true,
    imports,
  }
}
