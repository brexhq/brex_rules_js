import webpack from 'webpack';
import WebpackDevServer from 'webpack-dev-server';
import * as readline from 'readline';
import { parseCli, buildConfig } from './config';
import { buildModuleLoader, buildWebpackConfig } from './compiler';

const IBAZEL_NOTIFY_BUILD_SUCCESS = 'IBAZEL_BUILD_COMPLETED SUCCESS';

async function run(args: string[]) {
  const cli = parseCli(args);
  const config = buildConfig(cli);
  const loader = buildModuleLoader(config);
  const webpackConfig = buildWebpackConfig(config, loader);
  const compiler = webpack(webpackConfig);
  const server = new WebpackDevServer(compiler);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stderr,
    terminal: false,
  })

  rl.on('line', (line) => {
    if (line == IBAZEL_NOTIFY_BUILD_SUCCESS) {
      server.invalidate();
    }
  });
}

if (require.main === module) {
  run(process.argv.slice(2))
}
