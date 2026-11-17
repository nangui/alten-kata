import { parse } from 'devalue'
import { createApp } from './main'
import { APP_DATA_KEY } from './composables/useAppData'

const { app, pinia } = createApp()

const el = document.getElementById('__APP_DATA__')
if (el?.textContent) {
  const payload = parse(el.textContent)
  app.provide(APP_DATA_KEY, payload.data)
  pinia.state.value = payload.state
}
app.mount('#app')
