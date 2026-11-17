import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createApp } from './main'
import { fetchProducts } from './api/client'
import { pageCount, parsePage } from './api/pagination'
import { parseCart } from './cart/cookie'
import { useCartStore } from './stores/cart'
import { APP_DATA_KEY, type AppData } from './composables/useAppData'

export async function render(url: string, cartCookie?: string) {
  const { app, pinia } = createApp()

  const page = parsePage(new URL(url, 'http://localhost').searchParams.get('page'))
  const data: AppData = { page, productPage: await fetchProducts(page) }
  app.provide(APP_DATA_KEY, data)

  useCartStore(pinia).lines = parseCart(cartCookie)

  const ctx: SSRContext = {}
  const html = await renderToString(app, ctx)
  const status = page > pageCount(data.productPage.total) ? 404 : 200

  return {
    html,
    payload: { data, state: pinia.state.value },
    status,
  }
}
