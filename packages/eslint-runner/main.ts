import * as fs from "fs";
import {
  buildScopedModuleLoader,
  buildScopedResolver,
  getNativeLoader,
  Module,
  ModuleCache
} from "@brex_rules_js/compiler-infra/module-loader";
import buildCache, {CacheManifest} from "@brex_rules_js/compiler-infra/cache";
import {workerMain} from "@brex_rules_js/compiler-infra/worker";
import {parseCli, Options} from "@brex_rules_js/eslint-runner/config";
import {buildConfig, runLinterOnFiles} from "@brex_rules_js/eslint-runner/eslint";

const moduleCache = buildCache<Module>();

async function runBuild(argv: string[], manifest?: CacheManifest) {
  const { options, resolver } = parseCli(argv);

  if (manifest) {
    moduleCache.updateManifest(resolver.resolveManifest(manifest));
  }

  const loader = buildModuleLoader(options, moduleCache, !!manifest);
  const config = buildConfig(options, loader);
  const results = await runLinterOnFiles(options, config);

  if (options.statusFile) {
    fs.writeFileSync(options.statusFile, results.status);
  }

  if (options.diffFile) {
    fs.writeFileSync(options.diffFile, results.patch);
  }

  return true;
}

function buildModuleLoader(
  options: Options,
  cache: ModuleCache,
  useWhitelist: boolean
) {
  const validate = useWhitelist
    ? (f: string) => cache.isInManifest(f)
    : undefined;

  const sys = getNativeLoader();
  const scoped = buildScopedResolver(options.nodeModulesRoot, validate);

  return buildScopedModuleLoader(scoped, cache, sys);
}

if (require.main === module) {
  workerMain(
    process.argv,
    runBuild,
  );
}
