import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCartStore } from '../src/stores/cart'
import { MAX_QTY } from '../src/cart/cookie'

function noContent() {
  return new Response(null, { status: 204 })
}

describe('cart store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => noContent()),
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('adds a new line, then increments it instead of duplicating it', async () => {
    const cart = useCartStore()

    await cart.add(12)
    await cart.add(12)
    await cart.add(5)

    expect(cart.lines).toEqual([
      { id: 12, qty: 2 },
      { id: 5, qty: 1 },
    ])
    expect(cart.count).toBe(3)
  })

  it(`caps a line at ${MAX_QTY}`, async () => {
    const cart = useCartStore()
    cart.lines = [{ id: 12, qty: MAX_QTY }]

    await cart.add(12)

    expect(cart.lines[0].qty).toBe(MAX_QTY)
  })

  it('persists the cart through PUT /api/cart in the cookie format', async () => {
    const cart = useCartStore()

    await cart.add(12)

    expect(fetch).toHaveBeenCalledWith(
      '/api/cart',
      expect.objectContaining({ method: 'PUT', body: '12:1' }),
    )
  })

  it('sends saves one at a time so an older snapshot never overwrites a newer one', async () => {
    let releaseFirst!: () => void
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise<Response>((resolve) => (releaseFirst = () => resolve(noContent()))),
      )
      .mockImplementation(async () => noContent())
    vi.stubGlobal('fetch', fetchMock)

    const cart = useCartStore()
    const first = cart.add(12)
    const second = cart.add(12)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    releaseFirst()
    await Promise.all([first, second])

    expect(fetchMock.mock.calls.map(([, init]) => init.body)).toEqual(['12:1', '12:2'])
  })
})
