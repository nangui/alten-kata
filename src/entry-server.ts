import { renderToString, type SSRContext } from 'vue/server-renderer'
import { parsePage } from './api/pagination'
import { createApp } from './main'
import { useCounterStore } from './stores/counter'
import { fetchProducts } from './api/client'
import { APP_DATA_KEY, type AppData } from './composables/useAppData'

export async function render(url: string, ctx: SSRContext = {}) {
  const { app, pinia } = createApp()

  const page = parsePage(new URL(url, 'http://localhost').searchParams.get('page'))
  const data: AppData = { page, productPage: await fetchProducts(page) }
  app.provide(APP_DATA_KEY, data)

  useCounterStore(pinia).count = 10

  const html = await renderToString(app, ctx)
  return {
    html,
    payload: { data, state: pinia.state.value },
  }
}
