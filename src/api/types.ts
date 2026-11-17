export interface ProductSummary {
  id: number
  title: string
  price: number
  rating: number
  thumbnail: string
  category: string
}

export interface ProductPage {
  products: ProductSummary[]
  total: number,
  skip: number,
  limit: number
}
