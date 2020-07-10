import "./resolver";
import "eslint-plugin-import";
import "@typescript-eslint/parser";
import "@typescript-eslint/eslint-plugin";
import * as fs from "fs";
import * as diff from "diff";
import * as path from "path";
import {ESLint, Linter} from "eslint";
import * as stylish from "eslint/lib/cli-engine/formatters/stylish";
import {ModuleLoader} from "@brex_rules_js/compiler-infra/module-loader";
import {Options} from "@brex_rules_js/eslint-runner/config";
import {createConfigLoader, ConfigArray} from "@brex_rules_js/eslint-runner/config-loader";

const ALL_EXTENSIONS = [".ts", ".tsx", ".d.ts", ".js", ".jsx"];
const IMPORT_RESOLVER_PATH = require.resolve("./resolver");

type LintResultAndPatch = ESLint.LintResult & {
  patch: string,
}

export async function runLinterOnFiles(options: Options, config: ConfigArray) {
  const engine = new Linter();
  const results = await Promise.all(options._.map(f => runLinter(options,  engine, config, f)));
  const status = stylish.default(results);
  const patch = results.map(r => r.patch).join('\n');
  let hasError = false;

  for (let result of results) {
    if (result.errorCount > 0 || result.warningCount) {
      hasError = true;
    }
  }

  if (!hasError) {
    return {
      status: '',
      patch: '',
      results,
    }
  }

  return {
    status,
    patch,
    results,
  }
}

export async function runLinter(options: Options, linter: Linter, config: ConfigArray, filePath: string): Promise<LintResultAndPatch> {
  const contents = fs.readFileSync(filePath).toString();
  const relativeFilePath = path.relative(options.root, filePath);

  const result = await linter.verifyAndFix(contents, config, {
    allowInlineConfig: true,
    filename: filePath,
    fix: true,
  });

  const patch = diff.createPatch(relativeFilePath, contents, result.output);

  return {
    filePath: relativeFilePath,
    messages: result.messages,
    patch: patch,
    ...calculateStatsPerFile(result.messages),
  }
}

export function buildConfig(options: Options, loader: ModuleLoader): ConfigArray {
  const importResolverConfig = {
    loader,
  };

  const baseConfig: Linter.Config = {
    parser: "@typescript-eslint/parser",
    parserOptions: {
      ecmaVersion: 6,
      sourceType: "module",
      ecmaFeatures: {
        modules: true,
      },
    },
    plugins: ["@typescript-eslint", "eslint-plugin-import"],
    extends: ["plugin:import/typescript"],
    rules: {
      "import/no-extraneous-dependencies": [
        "error",
        {
          packageDir: path.dirname(options.packageJson),
          optionalDependencies: false,
        },
      ],
    },
    settings: {
      "import/extensions": ALL_EXTENSIONS,
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx", ".d.ts"],
      },
      "import/resolver": {
        [IMPORT_RESOLVER_PATH]: importResolverConfig,
      },
    },
  };

  const userConfig = loadUserConfig(options, loader);

  if (userConfig.rules) {
    userConfig.rules["import/no-unresolved"] = "off";
  }

  // Those options should always win
  if (userConfig.rules && userConfig.rules["import/no-extraneous-dependencies"]) {
    const ruleOrLevel = userConfig.rules["import/no-extraneous-dependencies"];
    const override = {
      packageDir: options.packageJson,
    };

    let rule: Linter.RuleEntry;

    if (typeof ruleOrLevel == 'string') {
      rule = [ruleOrLevel, {}];
    } else if (Array.isArray(ruleOrLevel)) {
      rule = ruleOrLevel;
    } else {
      throw new Error("invalid configuration for rule import/no-extraneous-dependencies")
    }

    rule[1] = Object.assign(rule[1], override);

    userConfig.rules["import/no-extraneous-dependencies"] = rule;
  }

  if (userConfig.settings && userConfig.settings["import/resolver"]) {
    userConfig.settings["import/resolver"][IMPORT_RESOLVER_PATH] = importResolverConfig;
  }

  const configLoader = createConfigLoader(loader);

  const base = configLoader.create(baseConfig);
  const user = configLoader.create(userConfig);

  return new ConfigArray(...base, ...user);
}

function loadUserConfig(options: Options, loader: ModuleLoader): Linter.Config {
  if (!options.config) {
    return {};
  }

  return loader.require(options.config) as Linter.Config;
}

function calculateStatsPerFile(messages) {
  return messages.reduce((stat, message) => {
    if (message.fatal || message.severity === 2) {
      stat.errorCount++;
      if (message.fix) {
        stat.fixableErrorCount++;
      }
    } else {
      stat.warningCount++;
      if (message.fix) {
        stat.fixableWarningCount++;
      }
    }
    return stat;
  }, {
    errorCount: 0,
    warningCount: 0,
    fixableErrorCount: 0,
    fixableWarningCount: 0
  });
}

