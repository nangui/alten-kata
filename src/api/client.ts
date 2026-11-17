import { createTtlCache } from './cache'
import type { CartProduct, ProductPage } from './types'

const BASE_URL = 'https://dummyjson.com'
const PRODUCT_FIELDS = 'id,title,price,rating,thumbnail,category'
const CART_PRODUCT_FIELDS = 'id,title,price,thumbnail'

export const PAGE_SIZE = 30
export const REQUEST_TIMEOUT_MS = 3000
export const PUBLIC_CACHE_TTL_MS = 60_000

// Deliberate exception to the "no module-level state" rule: this cache is shared by every
// request on the server, which is safe only because it holds public catalogue data.
// Never put cart or any other per-user data in it.
const publicCache = createTtlCache({ ttlMs: PUBLIC_CACHE_TTL_MS, maxEntries: 200 })

export function clearPublicCache() {
  publicCache.clear()
}

function fetchPublicJson<T>(url: string): Promise<T | null> {
  return publicCache.get(url, async () => {
    const response = await fetch(url, { signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) })
    if (response.status === 404) return null
    if (!response.ok) {
      throw new Error(`DummyJSON responded with ${response.status}`)
    }

    return (await response.json()) as T
  })
}

export async function fetchProducts(page = 1): Promise<ProductPage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String((page - 1) * PAGE_SIZE),
    select: PRODUCT_FIELDS,
  })

  const productPage = await fetchPublicJson<ProductPage>(`${BASE_URL}/products?${params}`)
  if (!productPage) {
    throw new Error('DummyJSON responded with 404')
  }

  return productPage
}

export async function fetchCartProducts(ids: number[]): Promise<CartProduct[]> {
  const products = await Promise.all(
    ids.map((id) =>
      fetchPublicJson<CartProduct>(`${BASE_URL}/products/${id}?select=${CART_PRODUCT_FIELDS}`),
    ),
  )
  return products.filter((product) => product !== null)
}
