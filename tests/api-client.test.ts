import { afterEach, describe, expect, it, vi } from 'vitest'
import { fetchProducts, PAGE_SIZE } from '../src/api/client'

const emptyPage = { products: [], total: 194, skip: 0, limit: PAGE_SIZE }

describe('fetchProducts', () => {
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
})
