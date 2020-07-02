export type Version = string | undefined;
export type VersionReference = Version | CacheManifest;

export type CachedItem<T> = {
  version: string | null;
  item: T;
}

export type CacheManifest = {
  [k: string]: string,
}

export type Cache<T> = {
  get(name: string, version: VersionReference): T | undefined
  put(name: string, version: VersionReference, item: T)
  getEntry(name: string): CachedItem<T> | undefined
  delete(name: string)
  getOrInitialize(name: string, version: VersionReference, init: (name: string, version: Version) => T);
}

export class EvictingCache<T> {
  private cache = buildCache<T>();

  /**
   * FileCache does not know how to construct bazel's opaque digests. This
   * field caches the last (or current) compile run's digests, so that code
   * below knows what digest to assign to a newly loaded file.
   */
  private lastDigests = new Map<string, string>();

  constructor() {}

  /**
   * Updates the cache with the given digests.
   *
   * updateCache must be called before loading files - only files that were
   * updated (with a digest) previously can be loaded.
   */
  updateCache(digests: Map<string, string>): void {
    this.lastDigests = digests;

    for (let [key, digest] of digests.entries()) {
      const entry = this.cache.getEntry(key);

      if (entry && entry.version != digest) {
        this.cache.delete(key);
      }
    }
  }

  getLastDigest(filePath: string): string {
    const digest = this.lastDigests.get(filePath);

    if (!digest) {
      const errorMsg = `missing input digest for ${filePath}. `;
      let entriesToPrint = Array.from(this.lastDigests.keys());
      if (entriesToPrint.length > 100) {
        throw new Error(
            errorMsg +
            `(only have ${entriesToPrint.slice(0, 100)} and ${
                entriesToPrint.length - 100} more)`);
      }

      throw new Error(errorMsg + `(only have ${entriesToPrint})`);
    }

    return digest;
  }

  getOrInitialize(name: string, init: (name: string, version: Version) => T) {
    return this.cache.getOrInitialize(name, this.getLastDigest(name), init);
  }

  get(name: string): T|undefined {
    return this.cache.get(name, this.getLastDigest(name));
  }

  put(name: string, version: Version, entry: T): void {
    this.cache.put(name, version, entry);
  }

  inManifest(name: string): boolean {
    return this.lastDigests.has(name);
  }
}

export default function buildCache<T>(): Cache<T> {
  const cache = new Map<string, CachedItem<T>>();

  const getVersion = (name: string, v: VersionReference): string | null => {
    if (!v) {
      return null;
    }

    if (typeof v == 'object') {
      return v[name];
    }

    return v;
  };

  const getEntry = (name: string): CachedItem<T> | undefined => {
    return cache.get(name);
  }

  const get = (name: string, version: VersionReference) => {
    const v = getVersion(name, version);
    const entry = getEntry(name);

    if (!entry || entry.version != v) {
      return undefined;
    }

    return entry.item;
  };

  const put = (name: string, version: VersionReference, item: T) => {
    const v = getVersion(name, version);

    cache.set(name, {
      version: v,
      item,
    })
  };

  return {
    get,
    put,
    getEntry,

    delete(name) {
      cache.delete(name);
    },

    getOrInitialize(name, version, build) {
      const existing = get(name, version);

      if (existing) {
        return existing;
      }

      const value = build(name, typeof version == 'string' ? version : undefined);

      put(name, version, value);

      return value;
    }
  }
}
