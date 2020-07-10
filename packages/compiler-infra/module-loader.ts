import * as vm from "vm";
import * as fs from "fs";
import * as path from "path";
import { createRequire } from "module";
import { sync as resolveSync } from "resolve";
import { Cache } from "./cache";

export type ModuleCache = Cache<Module>;

export type ResolveOptions = {
  paths: string[];
};

export type Module = {
  exports: any;

  require(request: string): any;

  readonly id: string;
  readonly path: string;
  readonly filename: string;
  readonly loaded: boolean;
  readonly parent?: Module;
  readonly children: Module[];
  readonly paths: string[];
};

export type ModuleResolver = {
  resolve(request: string, from?: Module, options?: ResolveOptions): string;
};

export type ModuleLoader = {
  resolve(request: string, from?: Module, options?: ResolveOptions): string;
  require(request: string, from?: Module): any;
};

export function getNativeResolver(): ModuleResolver {
  return {
    resolve(request, from, options) {
      if (from) {
        return createRequire(from.filename).resolve(request, options);
      }
      return require.resolve(request, options);
    },
  };
}

export function getNativeLoader(): ModuleLoader {
  const resolver = getNativeResolver();

  return {
    resolve(request, from, options) {
      return resolver.resolve(request, from, options);
    },

    require(request, from) {
      return require(resolver.resolve(request, from));
    },
  };
}

export function buildMockModule(
  loader: ModuleLoader,
  filePath: string,
  parent?: Module,
): Module {
  const dirname = path.dirname(filePath);

  const mod: Module = {
    exports: {},

    get filename() {
      return filePath;
    },

    get id() {
      return filePath;
    },

    get loaded() {
      return false;
    },

    get parent() {
      return parent;
    },

    get path() {
      return dirname;
    },

    get children(): Module[] {
      throw new Error("not available");
    },

    get paths(): string[] {
      throw new Error("not available");
    },

    require(id) {
      return loader.require(id, mod);
    },
  };

  return mod;
}

export function buildScopedResolver(
  nodeModules: string,
  whitelist?: (filename: string) => boolean
): ModuleResolver {
  return {
    resolve(request, from, options) {
      return resolveSync(request, {
        basedir: from?.path,
        paths: options?.paths || [nodeModules],
        preserveSymlinks: true,

        isFile(file) {
          if (whitelist) {
            return whitelist(file);
          }
          try {
            return fs.statSync(file).isFile();
          } catch (err) {
            if (err.code === "ENOENT" || err.code === "ENOTDIR") {
              return false;
            }

            throw err;
          }
        },
      });
    },
  };
}

export function buildScopedModuleLoader(
  resolver: ModuleResolver,
  cache: ModuleCache,
  parent?: ModuleLoader
): ModuleLoader {
  const resolveModule = (
    request: string,
    from?: Module,
    options?: ResolveOptions
  ) => {
    if (parent) {
      try {
        return parent.resolve(request, from, options);
      } catch (e) {
        if (e.code != "MODULE_NOT_FOUND") throw e;
      }
    }

    return resolver.resolve(request, from, options);
  };

  const loadModule = (filename: string, parent?: Module) => {
    const dirname = path.dirname(filename);
    const contents = fs.readFileSync(filename, "utf-8");
    const wrapped = `(function(exports, require, module, __filename, __dirname) {\n${contents}});`;
    const script = new vm.Script(wrapped, {
      filename,
      lineOffset: 1,
    });

    let loaded = false;

    const mod: Module = {
      exports: {},

      get filename() {
        return filename;
      },

      get id() {
        return filename;
      },

      get loaded() {
        return loaded;
      },

      get parent() {
        return parent;
      },

      get path() {
        return dirname;
      },

      get children(): Module[] {
        throw new Error("not available");
      },

      get paths(): string[] {
        throw new Error("not available");
      },

      require(id) {
        // eslint-disable-next-line no-use-before-define
        return localRequire(id);
      },
    };

    const localResolve = (
      request: string,
      options?: ResolveOptions
    ): string => {
      return resolveModule(request, mod, options);
    };

    const localRequire = (request: string): any => {
      // eslint-disable-next-line no-use-before-define
      return resolveAndRequire(request, mod);
    };

    localRequire.resolve = localResolve;

    script.runInThisContext()(
      mod.exports,
      localRequire,
      mod,
      filename,
      dirname
    );

    loaded = true;

    return mod;
  };

  const loadModuleOrCached = (filename: string, parent?: Module) => {
    return cache.getOrInitialize(filename, () => loadModule(filename, parent));
  };

  const resolveAndRequire = (request: string, from?: Module) => {
    if (parent) {
      try {
        return parent.require(request, from);
      } catch (e) {
        if (e.code != "MODULE_NOT_FOUND") throw e;
      }
    }

    return loadModuleOrCached(resolveModule(request, from)).exports;
  };

  return {
    resolve: resolveModule,
    require: resolveAndRequire,
  };
}
