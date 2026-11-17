import { createServer as createHttp } from 'node:http'
import { createServer as createViteServer } from 'vite'
import { Hono } from 'hono'
import { stringify } from 'devalue'
import { getRequestListener } from '@hono/node-server'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { bodyLimit } from 'hono/body-limit'
import { readFile } from 'node:fs/promises'
import { parseCart, serializeCart } from './src/cart/cookie.ts'

const CART_MAX_AGE = 60 * 60 * 24 * 30

const ERROR_PAGE = `<!doctype html>
<html lang="fr">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kata E-shop</title>
    <link rel="icon" href="data:," />
  </head>
  <body style="margin: 0; padding: 4rem 1rem; font-family: system-ui, sans-serif; color: #111827; text-align: center">
    <h1 style="font-size: 1.5rem">Le catalogue est momentanément indisponible</h1>
    <p>Nos produits n’ont pas pu être chargés. Réessayez dans quelques instants.</p>
    <p><a href="/" style="color: #1e3a8a">Recharger la page</a></p>
  </body>
</html>`

const app = new Hono()

const vite = await createViteServer({
  server: { middlewareMode: true },
  appType: 'custom',
})

app.put('/api/cart', bodyLimit({ maxSize: 1024 }), async (c) => {
  const value = serializeCart(parseCart(await c.req.text()))

  if (value === '') {
    deleteCookie(c, 'cart', { path: '/' })
  } else {
    setCookie(c, 'cart', value, {
      path: '/',
      httpOnly: true,
      sameSite: 'Lax',
      maxAge: CART_MAX_AGE,
    })
  }

  return c.body(null, 204)
})

app.get('/', async (c) => {
  const { pathname, search } = new URL(c.req.url)
  const url = pathname + search
  try {
    const template = await readFile(new URL('./index.html', import.meta.url), 'utf-8')
    const page = await vite.transformIndexHtml(url, template)

    const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
    const { html, payload, status } = await render(url, getCookie(c, 'cart'))
    const dataScript = `<script type="application/json" id="__APP_DATA__">${stringify(payload)}</script>`

    return c.html(
      page.replace('<!--ssr-outlet-->', () => html).replace('<!--app-data-->', () => dataScript),
      status,
    )
  } catch (e) {
    const err = e as Error
    vite.ssrFixStacktrace(err)
    console.error(err)
    return c.html(ERROR_PAGE, 503, { 'Retry-After': '30' })
  }
})

const hono = getRequestListener(app.fetch)

createHttp((req, res) => {
  vite.middlewares(req, res, () => hono(req, res))
}).listen(5173, () => console.log('http://localhost:5173'))
