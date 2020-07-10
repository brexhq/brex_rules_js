import * as worker from "@bazel/worker";
import { workerMain } from "@brex_rules_js/compiler-infra/worker";
import { buildCompiler } from "./compiler";

if (require.main === module) {
  const compiler = buildCompiler(worker);

  workerMain(
    process.argv.slice(2),
    (args, manifest) => compiler.compile(args, manifest),
  );
}
