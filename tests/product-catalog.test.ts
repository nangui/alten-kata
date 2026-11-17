import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { clearPublicCache } from '../src/api/client'
import { useProductCatalog } from '../src/composables/useProductCatalog'
import type { ProductPage } from '../src/api/types'

function pageOf(id: number): ProductPage {
  return {
    products: [{ id, title: `Product ${id}`, price: 1, rating: 1, thumbnail: '', category: 'c' }],
    total: 194,
    skip: 0,
    limit: 30,
  }
}

describe('useProductCatalog', () => {
  beforeEach(() => {
    clearPublicCache()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('keeps the latest requested page when responses arrive out of order', async () => {
    let resolveSlow!: (response: Response) => void
    const fetchMock = vi
      .fn()
      .mockReturnValueOnce(
        new Promise<Response>((resolve) => {
          resolveSlow = resolve
        }),
      )
      .mockResolvedValueOnce(Response.json(pageOf(3)))
    vi.stubGlobal('fetch', fetchMock)

    const catalog = useProductCatalog({ page: 1, productPage: pageOf(1) })

    const slow = catalog.loadPage(2)
    const fast = catalog.loadPage(3)
    await fast
    resolveSlow(Response.json(pageOf(2)))
    await slow

    expect(catalog.page.value).toBe(3)
    expect(catalog.productPage.value.products[0].id).toBe(3)
  })

  it('keeps the current products and reports an error when a page fails to load', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(null, { status: 503 })))

    const catalog = useProductCatalog({ page: 1, productPage: pageOf(1) })
    const loaded = await catalog.loadPage(2)

    expect(loaded).toBe(false)
    expect(catalog.status.value).toBe('error')
    expect(catalog.page.value).toBe(1)
    expect(catalog.productPage.value.products[0].id).toBe(1)
  })
})
