import { describe, expect, it, vi } from 'vitest'
import { createTtlCache } from '../src/api/cache'

function setup(maxEntries = 10) {
  let time = 0
  const cache = createTtlCache({ ttlMs: 1000, maxEntries, now: () => time })
  return { cache, advance: (ms: number) => (time += ms) }
}

describe('createTtlCache', () => {
  it('serves a fresh entry without calling the loader again', async () => {
    const { cache, advance } = setup()
    const load = vi.fn(async () => 'page')

    await cache.get('a', load)
    advance(999)
    await cache.get('a', load)

    expect(load).toHaveBeenCalledTimes(1)
  })

  it('reloads an entry once its TTL has expired', async () => {
    const { cache, advance } = setup()
    const load = vi.fn(async () => 'page')

    await cache.get('a', load)
    advance(1000)
    await cache.get('a', load)

    expect(load).toHaveBeenCalledTimes(2)
  })

  it('shares one in-flight request between concurrent callers', async () => {
    const { cache } = setup()
    const load = vi.fn(async () => 'page')

    const [first, second] = await Promise.all([cache.get('a', load), cache.get('a', load)])

    expect(load).toHaveBeenCalledTimes(1)
    expect(first).toBe(second)
  })

  it('never caches a failure', async () => {
    const { cache } = setup()
    const load = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(new Error('503'))
      .mockResolvedValueOnce('page')

    await expect(cache.get('a', load)).rejects.toThrow('503')
    await expect(cache.get('a', load)).resolves.toBe('page')
    expect(load).toHaveBeenCalledTimes(2)
  })

  it('evicts the least recently used entry when full', async () => {
    const { cache } = setup(2)
    const load = vi.fn(async () => 'page')

    await cache.get('a', load)
    await cache.get('b', load)
    await cache.get('a', load)
    await cache.get('c', load)
    await cache.get('a', load)
    await cache.get('b', load)

    expect(cache.size).toBe(2)
    expect(load.mock.calls.length).toBe(4)
  })
})
