import type { CartProduct, ProductPage } from './types'

const BASE_URL = 'https://dummyjson.com'
const PRODUCT_FIELDS = 'id,title,price,rating,thumbnail,category'
const CART_PRODUCT_FIELDS = 'id,title,price,thumbnail'

export const PAGE_SIZE = 30
export const REQUEST_TIMEOUT_MS = 3000

export async function fetchProducts(page = 1): Promise<ProductPage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String((page - 1) * PAGE_SIZE),
    select: PRODUCT_FIELDS,
  })

  const response = await fetch(`${BASE_URL}/products?${params}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (!response.ok) {
    throw new Error(`DummyJSON responded with ${response.status}`)
  }

  return (await response.json()) as ProductPage
}

async function fetchCartProduct(id: number): Promise<CartProduct | null> {
  const response = await fetch(`${BASE_URL}/products/${id}?select=${CART_PRODUCT_FIELDS}`, {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  })
  if (response.status === 404) return null
  if (!response.ok) {
    throw new Error(`DummyJSON responded with ${response.status}`)
  }

  return (await response.json()) as CartProduct
}

export async function fetchCartProducts(ids: number[]): Promise<CartProduct[]> {
  const products = await Promise.all(ids.map(fetchCartProduct))
  return products.filter((product) => product !== null)
}
