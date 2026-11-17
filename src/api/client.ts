import type { ProductPage } from './types'

const BASE_URL = 'https://dummyjson.com'
const PRODUCT_FIELDS = 'id,title,price,rating,thumbnail,category'

export const PAGE_SIZE = 30

 export async function fetchProducts(page = 1): Promise<ProductPage> {
  const params = new URLSearchParams({
    limit: String(PAGE_SIZE),
    skip: String((page - 1) * PAGE_SIZE),
    select: PRODUCT_FIELDS,
  })

  const response = await fetch(`${BASE_URL}/products?${params}`)
  if (!response.ok) {
    throw new Error(`DummyJSON responded with ${response.status}`)
  }

  return (await response.json()) as ProductPage
 }
