import { parse } from 'devalue'
import { createApp } from './main'

const { app, pinia } = createApp()

const el = document.getElementById('__APP_DATA__')
if (el?.textContent) {
  const payload = parse(el.textContent)
  pinia.state.value = payload.state
}
app.mount('#app')
