import * as worker from "@bazel/worker";
import {workerMain} from "@brex_rules_js/compiler-infra/worker";
import {CacheManifest} from "@brex_rules_js/compiler-infra/cache";
import { existsSync, writeFileSync } from "fs";
import { Config, buildConfig, parseCli } from "./config";
import { runProtoc } from "./protoc";
import { transpileFile } from "./compiler";

async function runOneBuild(args: string[], _manifest?: CacheManifest) {
  const cli = parseCli(args);
  const config = buildConfig(cli);

  const result = await runProtoc(config, worker);

  if (result.result == "error") {
    console.error(result.error);
    return false;
  }

  await transpileFiles(config);

  return true;
}

async function transpileFiles(config: Config) {
  return Promise.all(
    config.expected.map((f) => {
      if (!existsSync(f)) {
        writeFileSync(f, "", "utf8");
      }

      return transpileFile(config, f, f);
    })
  );
}

if (require.main === module) {
  workerMain(
    process.argv,
    runOneBuild,
  );
}
