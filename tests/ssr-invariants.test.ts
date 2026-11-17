import { afterEach, describe, it, expect, vi } from 'vitest'
import { createApp } from '../src/main'
import { render } from '../src/entry-server'
import { useCartStore } from '../src/stores/cart'

const productPage = {
  products: [
    {
      id: 1,
      title: 'Essence Mascara',
      price: 9.99,
      rating: 2.56,
      thumbnail: 'https://cdn.example/1.webp',
      category: 'beauty',
    },
  ],
  total: 194,
  skip: 0,
  limit: 30,
}

describe('SSR invariants', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('createApp() returns a fresh Pinia on every call', () => {
    const a = createApp()
    const b = createApp()

    useCartStore(a.pinia).lines = [{ id: 1, qty: 1 }]

    expect(a.pinia).not.toBe(b.pinia)
    expect(useCartStore(b.pinia).count).toBe(0)
  })

  it('render() returns the HTML and a { data, state } payload', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(productPage)))

    const { html, payload } = await render('/')

    expect(html).toContain('Essence Mascara')
    expect(payload.data).toEqual({ page: 1, productPage })
    expect(payload.state.cart).toEqual({ lines: [], status: 'idle' })
  })

  it('render() reads the page from the URL so any page can be server-rendered', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(productPage))
    vi.stubGlobal('fetch', fetchMock)

    const { payload } = await render('/?page=2')

    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('skip')).toBe('30')
    expect(payload.data.page).toBe(2)
  })

  it('render() reports a 404 for a page beyond the catalogue', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ ...productPage, products: [] })),
    )

    const { status } = await render('/?page=99')

    expect(status).toBe(404)
  })

  it('render() reads the cart cookie so the first paint shows the right count', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(Response.json(productPage)))

    const { html, payload } = await render('/', '12:2,5:1')

    expect(html).toMatch(/<span class="cart-indicator__count"[^>]*>3<\/span>/)
    expect(payload.state.cart).toEqual({
      lines: [
        { id: 12, qty: 2 },
        { id: 5, qty: 1 },
      ],
      status: 'idle',
    })
  })
})
