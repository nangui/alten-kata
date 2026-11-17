export interface ProductSummary {
  id: number
  title: string
  price: number
  rating: number
  thumbnail: string
  category: string
}

export type CartProduct = Pick<ProductSummary, 'id' | 'title' | 'price' | 'thumbnail'>

export interface ProductPage {
  products: ProductSummary[]
  total: number
  skip: number
  limit: number
}
