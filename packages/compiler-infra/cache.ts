export type Version = string | undefined;

export type CachedItem<T> = {
  version: Version,
  item: T;
};

export type CacheManifest = {
  [k: string]: string;
};

export type Cache<T> = {
  get(name: string): T | undefined;
  put(name: string, item: T): void;
  getEntry(name: string): CachedItem<T> | undefined;
  delete(name: string): void;
  getOrInitialize(
    name: string,
    init: (name: string) => T
  ): T;
  updateManifest(manifest: CacheManifest);
  isInManifest(name): boolean;
};

export default function buildCache<T>(): Cache<T> {
  const cache = new Map<string, CachedItem<T>>();
  let manifest: CacheManifest | undefined = undefined;

  const getVersion = (name: string): Version => {
    if (manifest) {
      return manifest[name];
    }

    return undefined;
  };

  const getEntry = (name: string): CachedItem<T> | undefined => {
    return cache.get(name);
  };

  const get = (name: string) => {
    const entry = getEntry(name);

    if (!entry) {
      return undefined;
    }

    return entry.item;
  };

  const put = (name: string, item: T) => {
    const v = getVersion(name);

    cache.set(name, {
      version: v,
      item,
    });
  };

  return {
    get,
    put,
    getEntry,

    delete(name) {
      cache.delete(name);
    },

    getOrInitialize(name, build) {
      const existing = getEntry(name);

      if (existing) {
        return existing.item;
      }

      const value = build(name);

      put(name, value);

      return value;
    },

    updateManifest(newManifest) {
      for (const key of Object.keys(newManifest)) {
        const entry = getEntry(key);

        if (entry && entry.version != manifest[key]) {
          cache.delete(key);
        }
      }

      manifest = newManifest;
    },

    isInManifest(name: string) {
      return !manifest || name in manifest;
    },
  };
}
