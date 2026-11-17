import { afterEach, describe, expect, it, vi } from 'vitest'
import { saveCart } from '../src/api/cart'

describe('saveCart', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it('fails without calling the API when VITE_FAKE_FAILURE_RATE is 1', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubEnv('VITE_FAKE_FAILURE_RATE', '1')

    await expect(saveCart([{ id: 12, qty: 1 }])).rejects.toThrow('Simulated')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('throws when the API answers with an error status', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 500 })),
    )

    await expect(saveCart([{ id: 12, qty: 1 }])).rejects.toThrow('500')
  })
})
