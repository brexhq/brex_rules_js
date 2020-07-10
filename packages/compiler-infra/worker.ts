import { Console } from "console";
import * as worker from "@bazel/worker";
import { CacheManifest } from "@brex_rules_js/compiler-infra/cache";

export type RunBuild = (
  args: string[],
  manifest?: CacheManifest
) => Promise<boolean | number>;

export async function workerMain(args: string[], runBuild: RunBuild) {
  if (worker.runAsWorker(args)) {
    // stdout will be used by Bazel
    console.log = console.error;

    global.console = new Console({
      stderr: process.stderr,
      stdout: process.stderr,
    });

    console.error("Running as Bazel worker");

    await worker.runWorkerLoop(async (args, manifest) => {
      try {
        const result = await runBuild(args, manifest);

        if (typeof result == "boolean") {
          return result;
        }

        return result !== 0;
      } catch (err) {
        console.error("Error:", err);
        return false;
      }
    });
  } else {
    try {
      const result = await runBuild(args.slice(2), undefined);

      if (typeof result == "number") {
        process.exit(result);
      }

      process.exit(result ? 0 : 1);
    } catch (err) {
      console.error("Error:", err);
      process.exit(1);
    }
  }
}
