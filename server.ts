import { createServer as createHttp } from 'node:http'
import { createServer as createViteServer } from 'vite'
import { Hono } from 'hono'
import { stringify } from 'devalue'
import { getRequestListener } from '@hono/node-server'
import { getCookie } from 'hono/cookie'
import { readFile } from 'node:fs/promises'

const app = new Hono()

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
})

app.get('/', async (c) => {
  const { pathname, search } = new URL(c.req.url)
  const url = pathname + search
  try {
    const template = await readFile(new URL('./index.html', import.meta.url), 'utf-8')
    const page = await vite.transformIndexHtml(url, template)

    const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
    const { html, payload } = await render(url, getCookie(c, 'cart'))
    const dataScript = `<script type="application/json" id="__APP_DATA__">${stringify(payload)}</script>`

    return c.html(
      page.replace('<!--ssr-outlet-->', () => html).replace('<!--app-data-->', () => dataScript),
    )
  } catch (e) {
    const err = e as Error
    vite.ssrFixStacktrace(err)
    console.error(err)
    return c.text(err.message, 500)
  }
})

const hono = getRequestListener(app.fetch)

createHttp((req, res) => {
  vite.middlewares(req, res, () => hono(req, res))
}).listen(5173, () => console.log('http://localhost:5173'))
