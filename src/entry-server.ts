import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createApp } from './main'
import { useCounterStore } from './stores/counter'
import { fetchProducts } from './api/client'
import { APP_DATA_KEY, type AppData } from './composables/useAppData'

export async function render(url: string, ctx: SSRContext = {}) {
  const { app, pinia } = createApp()

  const data: AppData = { productPage: await fetchProducts(1) }
  app.provide(APP_DATA_KEY, data)

  useCounterStore(pinia).count = 10

  const html = await renderToString(app, ctx)
  return {
    html,
    payload: { data, state: pinia.state.value }
  }
}
