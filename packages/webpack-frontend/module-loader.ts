import * as vm from 'vm';
import * as fs from 'fs';
import * as path from 'path';
import { createRequire } from 'module';
import { sync as resolveSync, isCore } from 'resolve';
import { Config } from './config';

const scopedCache: { [k: string]: Module } = {}

export type ResolveOptions = {
  paths: string[],
}

export type Module = {
  exports: any,

  require(request: string): any,

  readonly id: string,
  readonly path: string,
  readonly filename: string,
  readonly loaded: boolean,
  readonly parent?: Module,
  readonly children: Module[],
  readonly paths: string[],
};

export type ModuleResolver = {
  resolve(request: string, from?: Module, options?: ResolveOptions): string
}

export type ModuleLoader = {
  resolve(request: string, from?: Module, options?: ResolveOptions): string
  require(request: string, from?: Module): any
}

export function getNativeResolver(): ModuleResolver {
  return {
    resolve(request, from, options) {
      if (from) {
        return createRequire(from.filename).resolve(request, options);
      } else {
        return require.resolve(request, options);
      }
    },
  }
}

export function getNativeLoader(): ModuleLoader {
  const resolver = getNativeResolver();

  return {
    resolve(request, from, options) {
      return resolver.resolve(request, from, options);
    },

    require(request, from) {
      return require(resolver.resolve(request, from))
    }
  }
}

export function buildScopedResolver(nodeModules: string, whitelist?: (filename: string) => boolean): ModuleResolver {
  return {
    resolve(request, from, options) {
      return resolveSync(request, {
        basedir: from?.path,
        paths: options?.paths || [nodeModules],
        preserveSymlinks: true,

        isFile(file) {
          if (whitelist) {
            return whitelist(file)
          } else {
            try {
              return fs.statSync(file).isFile();
            } catch (err) {
              if (err.code === 'ENOENT' || err.code === 'ENOTDIR') {
                return false;
              }

              throw err;
            }
          }
        },
      })
    },
  }
}

export function buildScopedModuleLoader(resolver: ModuleResolver, parent?: ModuleLoader): ModuleLoader {
  const resolveModule = (request: string, from?: Module, options?: ResolveOptions) => {
    if (parent) {
      try {
        return parent.resolve(request, from, options);
      } catch {
      }
    }

    return resolver.resolve(request, from, options);
  };

  const loadModule = (filename: string, parent?: Module) => {
    if (scopedCache[filename]) {
      return scopedCache[filename];
    }

    const dirname = path.dirname(filename);
    const contents = fs.readFileSync(filename, 'utf-8');
    const wrapped = '(function(exports, require, module, __filename, __dirname) {\n' + contents + '});';
    const script = new vm.Script(wrapped, {
      filename: filename,
      lineOffset: 1,
    })
    
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
        throw new Error("not available")
      },

      get paths(): string[] {
        throw new Error("not available")
      },

      require(id) {
        return localRequire(id);
      }
    }

    const localResolve = (request: string, options?: ResolveOptions): string => {
      return resolveModule(request, mod, options);
    };

    const localRequire = (request: string): any => {
      return resolveAndRequire(request, mod);
    };

    localRequire.resolve = localResolve;

    script.runInThisContext()(mod.exports, localRequire, mod, filename, dirname);

    loaded = true;

    return mod;
  };

  const resolveAndRequire = (request: string, from?: Module) => {
    if (parent) {
      try {
        return parent.require(request, from);
      } catch {
      }
    }

    return loadModule(resolveModule(request, from)).exports;
  };

  return {
    resolve: resolveModule,
    require: resolveAndRequire,
  }
}
