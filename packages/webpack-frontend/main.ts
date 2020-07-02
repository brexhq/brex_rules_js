import * as worker from '@bazel/worker';
import webpack from 'webpack';
import { parseCli, buildConfig } from './config';
import { buildCompiler } from './compiler';

async function runOneBuild(args: string[], manifest?: any) {
  const cli = parseCli(args);
  const config = buildConfig(cli);
  const compiler = buildCompiler(config);

  const stats = await new Promise<webpack.Stats>((resolve, reject) => {
    compiler.run((err, stats) => {
      if (err) {
        reject(err);
      } else {
        resolve(stats);
      }
    })
  })

  console.error(stats.toString({
    colors: true,
    chunks: false,
  }))

  if (stats.hasErrors()) {
    return false;
  }

  return true;
}

if (require.main === module) {
  const run = async (args: string[], manifest?: any) => {
    try {
      return runOneBuild(args, manifest);
    } catch (e) {
      console.error('Error:', e)
      return false;
    }
  };

  if (worker.runAsWorker(process.argv)) {
    // Patch console.log, just to make sure
    console.log = console.error;

    worker.log('Running as a Bazel worker');

    worker.runWorkerLoop(run);
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

