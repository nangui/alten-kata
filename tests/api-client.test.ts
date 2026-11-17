import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPublicCache, fetchCartProducts, fetchProducts, PAGE_SIZE } from '../src/api/client'

const emptyPage = { products: [], total: 194, skip: 0, limit: PAGE_SIZE }

describe('fetchProducts', () => {
  beforeEach(() => {
    clearPublicCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('requests only the fields the PLP needs, with limit/skip pagination', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(emptyPage))
    vi.stubGlobal('fetch', fetchMock)

    await fetchProducts(2)

    const url = new URL(fetchMock.mock.calls[0][0])
    expect(url.pathname).toBe('/products')
    expect(url.searchParams.get('limit')).toBe('30')
    expect(url.searchParams.get('skip')).toBe('30')
    expect(url.searchParams.get('select')).toBe('id,title,price,rating,thumbnail,category')
  })

  it('throws when DummyJSON answers with an error status', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))

    await expect(fetchProducts()).rejects.toThrow('503')
  })

  it('aborts the request when DummyJSON does not answer in time', async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(emptyPage))
    vi.stubGlobal('fetch', fetchMock)

    await fetchProducts()

    expect(fetchMock.mock.calls[0][1].signal).toBeInstanceOf(AbortSignal)
  })

  it('fetches cart product details and skips products that no longer exist', async () => {
    const fetchMock = vi.fn(async (url: string) =>
      url.includes('/products/404')
        ? new Response(null, { status: 404 })
        : Response.json({ id: 1, title: 'Mascara', price: 9.99, thumbnail: 't.webp' }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const products = await fetchCartProducts([1, 404])

    expect(products).toEqual([{ id: 1, title: 'Mascara', price: 9.99, thumbnail: 't.webp' }])
    expect(new URL(fetchMock.mock.calls[0][0]).searchParams.get('select')).toBe(
      'id,title,price,thumbnail',
    )
  })
})
