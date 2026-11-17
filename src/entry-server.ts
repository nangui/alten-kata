import { renderToString, type SSRContext } from 'vue/server-renderer'
import { createApp } from './main'
import { useCounterStore } from './stores/counter'

export async function render(url: string, ctx: SSRContext = {}) {
  const { app, pinia } = createApp()

  useCounterStore(pinia).count = 10

  const html = await renderToString(app, ctx)
  return {
    html,
    payload: { data: {}, state: pinia.state.value }
  }
}
