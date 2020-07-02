import {delimiter as pathSeparator} from 'path';
import {spawn} from 'child_process';
import { Config } from './config';

type Logger = {
  log(...args: unknown[]);
}

type Result = {
  result: 'error',
  error: Error,
  status: number,
} | {
  result: 'ok',
}

function buildArgs(config: Config) {
  const args: string[] = []

  for (let name in config.plugins) {
    let options = '';
    const plugin = config.plugins[name];

    if (plugin.options) {
      options = plugin.options + ':';
    }

    if (plugin.exec) {
      args.push(`--plugin=protoc-gen-${name}=${plugin.exec}`);
    }

    args.push(`--${name}_out=${options}${config.output}`);
  }

  args.push('--descriptor_set_in=' + config.descriptorSets.join(pathSeparator));
  args.push(...config.inputFiles);

  return args.flat();
}

export async function runProtoc(config: Config, logger: Logger): Promise<Result> {
  const args = buildArgs(config);
  const env = Object.assign({}, process.env);

  // Clean Bazel environment
  delete env.RUNFILES;
  delete env.RUNFILES_DIR;
  delete env.RUNFILES_MANIFEST_FILE;

  return new Promise<Result>((resolve, reject) => {
    let done = false;

    const p = spawn(config.protoc, args, {
      env: env,
      stdio: [null, 'pipe', 'pipe'],
    });

    p.stdout.on('data', (data) => {
      logger.log(data.toString());
    });

    p.stderr.on('data', (data) => {
      logger.log(data.toString());
    });

    p.on('error', (error) => {
      if (done) {
        return;
      }

      done = true;
      p.kill();
      reject(error);
    })

    p.on('exit', (code) => {
      if (done) {
        return;
      }

      done = true;

      if (code != 0) {
        resolve({
          result: 'error',
          error: new Error('protoc returned non-zero status'),
          status: code || 1,
        });
      } else {
        resolve({
          result: 'ok',
        });
      }
    });
  });
}
