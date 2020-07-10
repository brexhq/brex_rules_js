import * as ts from "typescript";
import buildCache, {
  CacheManifest,
  Cache,
} from "@brex_rules_js/compiler-infra/cache";
import {
  Module,
  ModuleCache,
  buildScopedModuleLoader,
  buildScopedResolver,
  getNativeLoader,
} from "@brex_rules_js/compiler-infra/module-loader";
import { Config, buildConfig, parseCli } from "./config";
import buildHost, { Logger } from "./host";
import { buildTsConfig, compileDeclarations } from "./ts";
import { compileToJavascript } from "./js";

type Compiler = {
  compile(args: string[], manifest?: CacheManifest): Promise<boolean>;
};

export function buildCompiler(logger: Logger): Compiler {
  const caches = {
    file: buildCache<string>(),
    source: buildCache<ts.SourceFile>(),
    module: buildCache<Module>(),
    tsConfig: buildCache<ts.ParsedCommandLine>(),
    program: buildCache<ts.Program>(),
  };

  const getUpdatedCache = <T>(
    cache: Cache<T>,
    manifest?: CacheManifest
  ) => {
    if (manifest) {
      cache.updateManifest(manifest);
    }

    return cache;
  };

  return {
    async compile(args, manifest) {
      const cli = parseCli(args);
      const { config, resolver } = buildConfig(cli);

      if (manifest) {
        manifest = resolver.resolveManifest(manifest);
      }

      const fileCache = getUpdatedCache(caches.file, manifest);
      const sourceCache = getUpdatedCache(caches.source, manifest);
      const moduleCache = getUpdatedCache(caches.module, manifest);
      const tsConfigCache = getUpdatedCache(caches.tsConfig, manifest);
      const loader = buildModuleLoader(config, moduleCache, !!manifest);

      const host = buildHost({
        logger,
        config,
        fileCache,
        restrictToCache: !!manifest,
      });

      const tsConfig = buildTsConfig({
        config,
        host,
        logger,
        cache: tsConfigCache,
      });

      const results = await Promise.all([
        compileDeclarations(
          {
            logger,
            config,
            host,
            sourceCache,
            programCache: caches.program,
            tsConfig,
          },
          config.inputFiles
        ),

        // Transpile
        ...config.inputFiles.map((f) =>
          compileToJavascript(
            {
              logger,
              host,
              config,
              loader,
            },
            f
          )
        ),
      ]);

      let success = true;

      for (const result of results) {
        if (result.result == "error") {
          success = false;
        }
      }

      return success;
    },
  };
}

function buildModuleLoader(
  config: Config,
  cache: ModuleCache,
  useWhitelist: boolean
) {
  const validate = useWhitelist
    ? (f: string) => cache.isInManifest(f)
    : undefined;

  const sys = getNativeLoader();
  const scoped = buildScopedResolver(config.nodeModulesRoot, validate);

  return buildScopedModuleLoader(scoped, cache, sys);
}
