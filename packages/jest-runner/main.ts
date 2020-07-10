import "./resolver";
import "jest-junit-reporter";
import * as fs from "fs";
import * as path from "path";
import { runCLI } from "@jest/core";
import { parseArgs } from "@brex_rules_js/compiler-infra/arg-parser";
import {buildPathResolver} from "@brex_rules_js/compiler-infra/path-resolver";

// These exit codes are handled specially by Bazel:
// https://github.com/bazelbuild/bazel/blob/486206012a664ecb20bdb196a681efc9a9825049/src/main/java/com/google/devtools/build/lib/util/ExitCode.java#L44
const BAZEL_EXIT_TESTS_FAILED = 3;
const BAZEL_EXIT_NO_TESTS_FOUND = 4;

// Set the StackTraceLimit to infinity. This will make stack capturing slower, but more useful.
// Since we are running tests having proper stack traces is very useful and should be always set to
// the maximum (See: https://nodejs.org/api/errors.html#errors_error_stacktracelimit)
Error.stackTraceLimit = Infinity;

// Set some relevant flags
process.env.NODE_ENV = "test";

// TODO: Test if this is right
process.env.TEST_REPORT_PATH = path.dirname(process.env.XML_OUTPUT_FILE);
process.env.TEST_REPORT_FILENAME = path.basename(process.env.XML_OUTPUT_FILE);

type Config = {
  config?: string;
  _: string[];
};

async function main(argv: string[]) {
  // Protect against early-exits
  fs.writeFileSync(process.env.TEST_PREMATURE_EXIT_FILE, "");

  const resolver = buildPathResolver(undefined, true);

  const args = parseArgs<Config>(
    {
      config: {
        type: "string",
        normalize: true,
        coerce: (path: string) => resolver.resolvePath(path),
      },
    },
    argv
  );

  const testFiles = resolver.resolvePaths(args._);

  const { results } = await runCLI(
    {
      $0: "jest",
      ci: true,
      cache: false,
      watchman: false,
      config: args.config,
      runTestsByPath: true,
      resolver: require.resolve("./resolver"),
      testResultsProcessor: require.resolve("jest-junit-reporter"),
      testEnvironment: "node",
      transformIgnorePatterns: [".*"],
      _: testFiles,
    },
    [process.cwd()]
  );

  fs.unlinkSync(process.env.TEST_PREMATURE_EXIT_FILE);

  if (results.numTotalTests == 0) {
    return BAZEL_EXIT_NO_TESTS_FOUND;
  }

  if (!results.success) {
    return BAZEL_EXIT_TESTS_FAILED;
  }

  return 0;
}

if (require.main === module) {
  main(process.argv.slice(2))
    .then((code) => process.exit(code))
    .catch((e) => {
      console.log(e);
      process.exit(1);
    });
}
