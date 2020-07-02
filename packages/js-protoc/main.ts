import { existsSync, writeFileSync } from 'fs';
import { parseCli, buildConfig, Config } from "./config";
import { runProtoc } from './protoc';
import { transpileFile } from "./compiler";
import * as worker from '@bazel/worker';

type InputManifest = {[k: string]: string}

async function runOneBuild(args: string[], inputs?: InputManifest) {
  const cli = parseCli(args);
  const config = buildConfig(cli);

  const result = await runProtoc(config, worker);

  if (result.result == 'error') {
    worker.log(result.error);
    return false;
  }

  await transpileFiles(config);

  return true;
}

async function transpileFiles(config: Config) {
  return Promise.all(config.expected.map((f) => {
    if (!existsSync(f)) {
      writeFileSync(f, '', 'utf8');
    }

    return transpileFile(config, f, f)
  }));
}

if (require.main === module) {
  if (worker.runAsWorker(process.argv)) {
    // Patch console.log, just to make sure
    console.log = console.error;

    worker.log('Running as a Bazel worker');

    worker.runWorkerLoop(runOneBuild);
  } else {
    runOneBuild(process.argv.slice(2))
      .then((ok) => {
        if (ok) {
          process.exit(0);
        } else {
          process.exit(1);
        }
      })
      .catch((e) => {
        console.log(e);
        process.exit(1);
      })
  }
}
