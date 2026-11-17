interface CacheEntry {
  expiresAt: number
  value: Promise<unknown>
}

export interface TtlCacheOptions {
  ttlMs: number
  maxEntries: number
  now?: () => number
}

export function createTtlCache({ ttlMs, maxEntries, now = Date.now }: TtlCacheOptions) {
  const entries = new Map<string, CacheEntry>()

  function get<T>(key: string, load: () => Promise<T>): Promise<T> {
    const cached = entries.get(key)
    if (cached && cached.expiresAt > now()) {
      entries.delete(key)
      entries.set(key, cached)
      return cached.value as Promise<T>
    }

    const value = load()
    entries.delete(key)
    entries.set(key, { expiresAt: now() + ttlMs, value })

    value.catch(() => {
      if (entries.get(key)?.value === value) entries.delete(key)
    })

    while (entries.size > maxEntries) {
      const oldest = entries.keys().next().value
      if (oldest === undefined) break
      entries.delete(oldest)
    }

    return value
  }

  return {
    get,
    clear: () => entries.clear(),
    get size() {
      return entries.size
    },
  }
}
