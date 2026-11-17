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

  it('coalesces clicks made during a save into a single follow-up save', async () => {
    let releaseFirst!: () => void
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        () => new Promise<Response>((resolve) => (releaseFirst = () => resolve(noContent()))),
      )
      .mockImplementation(async () => noContent())
    vi.stubGlobal('fetch', fetchMock)

    const cart = useCartStore()
    cart.add(12)
    cart.add(12)
    const last = cart.add(12)

    await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))
    expect(cart.status).toBe('saving')
    releaseFirst()
    await last

    expect(fetchMock.mock.calls.map(([, init]) => init.body)).toEqual(['12:1', '12:3'])
    expect(cart.status).toBe('idle')
  })

  it('rolls back to the last saved cart when a save fails', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    )
    const cart = useCartStore()
    cart.lines = [{ id: 5, qty: 1 }]

    await cart.add(12)

    expect(cart.lines).toEqual([{ id: 5, qty: 1 }])
    expect(cart.count).toBe(1)
    expect(cart.status).toBe('error')
  })

  it('keeps the rejected change so the shopper can retry it', async () => {
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(async () => new Response(null, { status: 503 }))
      .mockImplementation(async () => noContent())
    vi.stubGlobal('fetch', fetchMock)
    const cart = useCartStore()

    await cart.add(12)
    expect(cart.lines).toEqual([])

    await cart.retry()

    expect(cart.lines).toEqual([{ id: 12, qty: 1 }])
    expect(cart.status).toBe('idle')
    expect(fetchMock.mock.calls.at(-1)?.[1]?.body).toBe('12:1')
  })

  it('removes a line when its quantity drops to zero', async () => {
    const cart = useCartStore()
    cart.lines = [
      { id: 12, qty: 1 },
      { id: 5, qty: 2 },
    ]

    await cart.setQuantity(12, 0)
    await cart.setQuantity(5, 1)

    expect(cart.lines).toEqual([{ id: 5, qty: 1 }])
  })

  it('rolls back a removal that fails to save', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(null, { status: 503 })),
    )
    const cart = useCartStore()
    cart.lines = [{ id: 12, qty: 2 }]

    await cart.remove(12)

    expect(cart.lines).toEqual([{ id: 12, qty: 2 }])
    expect(cart.status).toBe('error')
  })
})
