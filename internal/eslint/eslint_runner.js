const path = require('path');
const minimist = require('minimist');
const { CLIEngine } = require('eslint');
const runfiles = require(process.env['BAZEL_NODE_RUNFILES_HELPER']);

// These exit codes are handled specially by Bazel:
// https://github.com/bazelbuild/bazel/blob/486206012a664ecb20bdb196a681efc9a9825049/src/main/java/com/google/devtools/build/lib/util/ExitCode.java#L44
const BAZEL_EXIT_TESTS_FAILED = 3;
const BAZEL_EXIT_NO_TESTS_FOUND = 4;

const ALL_EXTENSIONS = ['.ts', '.tsx', '.d.ts', '.js', '.jsx']

const importResolver = runfiles.resolve('brex_rules_js/packages/eslint-import-resolver/index.js')

async function main(args) {
    const argv = minimist(args);
    let packageDir = null;

    if (argv.package) {
        argv.package = runfiles.resolveWorkspaceRelative(argv.package)
    }

    if (argv.config) {
        argv.config = runfiles.resolveWorkspaceRelative(argv.config)
    }

    if (argv.package) {
        packageDir = path.dirname(argv.package)
    }

    const files =
        argv._
            // Use runfiles resolve to resolve the file path that
            // bazel passes to the runner to its absolute path
            .map(f => runfiles.resolveWorkspaceRelative(f));

    const engine = new CLIEngine({
        useEslintrc: false,
        cache: false,
        configFile: argv.config,
        fix: argv.fix,
        baseConfig: {
            parser: '@typescript-eslint/parser',
            parserOptions: {
                ecmaVersion: 6,
                sourceType: 'module',
                ecmaFeatures: {
                    modules: true,
                },
            },
            plugins: ['@typescript-eslint'],
            rules: {
                'import/no-extraneous-dependencies': [
                    "error", {
                        packageDir: argv.packageDir,
                        optionalDependencies: false,
                    },
                ]
            },
            settings: {
                'import/extensions': ALL_EXTENSIONS,
                'import/parsers': {
                    '@typescript-eslint/parser': ['.ts', '.tsx', '.d.ts'],
                },
                'import/resolver': {
                    [importResolver]: {},
                },
            },
            rules: {
                "import/extensions": ["off"],
            }
        },
    });

    const report = await engine.executeOnFiles(files)

    if (report.results.length == 0) {
        return BAZEL_EXIT_NO_TESTS_FOUND;
    }

    const formatter = await engine.getFormatter();
    const base = process.cwd();

    if (argv.fix) {
        CLIEngine.outputFixes(report);
    }

    for (let result of report.results) {
        // Fix displayed path

        result.filePath = path.relative(base, result.filePath);
    }

    const output = formatter(report.results);

    console.log(output)

    if (report.errorCount > 0) {
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
        })
}
