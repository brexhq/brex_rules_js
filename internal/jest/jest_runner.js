const fs = require('fs');
const path = require('path');
const minimist = require('minimist');
const {runCLI} = require('@jest/core');

const runfiles = require(process.env['BAZEL_NODE_RUNFILES_HELPER']);

const UTF8 = {
    encoding: 'utf-8'
};

// These exit codes are handled specially by Bazel:
// https://github.com/bazelbuild/bazel/blob/486206012a664ecb20bdb196a681efc9a9825049/src/main/java/com/google/devtools/build/lib/util/ExitCode.java#L44
const BAZEL_EXIT_TESTS_FAILED = 3;
const BAZEL_EXIT_NO_TESTS_FOUND = 4;

// Set the StackTraceLimit to infinity. This will make stack capturing slower, but more useful.
// Since we are running tests having proper stack traces is very useful and should be always set to
// the maximum (See: https://nodejs.org/api/errors.html#errors_error_stacktracelimit)
Error.stackTraceLimit = Infinity;

const IS_TEST_FILE = /[^a-zA-Z0-9](spec|test)\.js$/i;
const IS_NODE_MODULE = /\/node_modules\//;

// Set some relevant flags
process.env.CI = 'true'
process.env.NODE_ENV = 'test'

// TODO: Test if this is right
process.env.TEST_REPORT_PATH = path.dirname(process.env.XML_OUTPUT_FILE);
process.env.TEST_REPORT_FILENAME = path.basename(process.env.XML_OUTPUT_FILE);

const resolverPackage = runfiles.resolve('brex_rules_js/packages/jest-bazel-resolver');

async function main(args) {
    const argv = minimist(args);
    const manifest = runfiles.resolveWorkspaceRelative(argv.manifest)

    if (argv.config) {
        argv.config = runfiles.resolveWorkspaceRelative(argv.config)
    }

    const files =
      fs.readFileSync(manifest, UTF8)
        .split('\n')
        .filter(l => l.length > 0)
        // Filter out files from node_modules
        .filter(f => !IS_NODE_MODULE.test(f))
        // Use runfiles resolve to resolve the file path that
        // bazel passes to the runner to its absolute path
        .map(f => runfiles.resolveWorkspaceRelative(f))
        // Filter here so that only files ending in `spec.js` and `test.js`
        // are added to jasmine as spec files. This is important as other
        // deps such as '@npm//typescript' if executed may cause the test to
        // fail or have unexpected side-effects. '@npm//typescript' would
        // try to execute tsc, print its help, and process.exit(1)
        .filter(f => IS_TEST_FILE.test(f));

    const { results } = await runCLI({
        $0: 'jest',
        ci: true,
        cache: false,
        watchman: false,
        config: argv.config,
        runTestsByPath: true,
        resolver: resolverPackage,
        testResultsProcessor: 'jest-junit-reporter',
        testEnvironment: 'node',
        _: files,
    }, [process.cwd()])

    if (results.numTotalTests == 0) {
        return BAZEL_EXIT_NO_TESTS_FOUND
    }

    if (!results.success) {
        return BAZEL_EXIT_TESTS_FAILED
    }

    return 0;
}

if (require.main === module) {
    main(process.argv.slice(2))
      .then((code) => process.exit(code))
      .catch((e) => {
          console.log(e);
          process.exit(1);
      })
}

