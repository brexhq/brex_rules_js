import * as worker from '@bazel/worker';
import { buildCompiler } from './compiler';
import { CacheManifest } from './cache';

if (require.main === module) {
  const compiler = buildCompiler(worker);

  const run = async (args: string[], manifest?: CacheManifest) => {
    try {
      return compiler.compile(args, manifest);
    } catch (e) {
      worker.log('Error: ' + e)
      return false;
    }
  };

  if (worker.runAsWorker(process.argv)) {
    // Patch console.log, just to make sure
    console.log = console.error;

    worker.log('Running as a Bazel worker');

    worker.runWorkerLoop(run);
  } else {
    run(process.argv.slice(2))
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

