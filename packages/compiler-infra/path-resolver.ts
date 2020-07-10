import {CacheManifest} from "@brex_rules_js/compiler-infra/cache";
import * as path from "path";

export type Resolve = (f: string) => string;

type ObjectWithKey<TKey extends string> = {
  [k in TKey]: string
}

export function buildPathResolver(resolveOrRoot?: string | Resolve, useRunfiles?: boolean) {
  let resolve: Resolve;

  if (useRunfiles && process.env.BAZEL_NODE_RUNFILES_HELPER) {
    const helper = require(process.env.BAZEL_NODE_RUNFILES_HELPER);

    resolveOrRoot = (f: string) => helper.resolveWorkspaceRelative(f);
  }

  if (!resolveOrRoot) {
    resolveOrRoot = process.cwd();
  }

  if (typeof resolveOrRoot == 'string') {
    const root = resolveOrRoot;

    resolve = (f: string) => path.resolve(root, f);
  } else {
    resolve = resolveOrRoot;
  }

  return {
    resolvePath<T extends string | undefined>(rel: T): string | T {
      if (!rel) {
        return undefined;
      }

      return resolve(rel);
    },

    resolvePaths(paths: string[]): string[] {
      return paths.map(f => this.resolvePath(f));
    },

    resolvePathObject<TObj extends ObjectWithKey<TKey>, TKey extends string>(key: TKey, obj: TObj): TObj {
      obj[key] = this.resolvePath(obj[key]);

      return obj;
    },

    resolvePathObjects<TObj extends ObjectWithKey<TKey>, TKey extends string>(key: TKey, objs: TObj[]): TObj[] {
      return objs.map(f => this.resolvePathObject(key, f));
    },

    resolveManifest(manifest: CacheManifest): CacheManifest {
      const resolved: CacheManifest = {};

      for (const key of Object.keys(manifest)) {
        resolved[this.resolvePath(key)] = manifest[key];
      }

      return resolved;
    }
  };
}

