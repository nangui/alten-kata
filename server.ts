import { createServer as createHttp } from 'node:http'
import { readFile } from 'node:fs/promises'
import { Hono } from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { compress } from 'hono/compress'
import { secureHeaders } from 'hono/secure-headers'
import { getCookie, setCookie, deleteCookie } from 'hono/cookie'
import { getRequestListener } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
import { stringify } from 'devalue'
import { parseCart, serializeCart } from './src/cart/cookie.ts'

type Render = typeof import('./src/entry-server.ts').render

const isProduction = process.env.NODE_ENV === 'production'
const port = Number(process.env.PORT ?? 5173)
const SERVER_ENTRY = './dist/server/entry-server.js'

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

const vite = isProduction
  ? undefined
  : await (
      await import('vite')
    ).createServer({
      server: { middlewareMode: true },
      appType: 'custom',
    })

const productionTemplate = isProduction
  ? await readFile(new URL('./dist/client/index.html', import.meta.url), 'utf-8')
  : ''

const productionRender: Render | undefined = isProduction
  ? ((await import(SERVER_ENTRY)) as { render: Render }).render
  : undefined

async function loadPage(url: string): Promise<{ template: string; render: Render }> {
  if (!vite) {
    return { template: productionTemplate, render: productionRender! }
  }

  const template = await readFile(new URL('./index.html', import.meta.url), 'utf-8')
  const { render } = await vite.ssrLoadModule('/src/entry-server.ts')
  return { template: await vite.transformIndexHtml(url, template), render }
}

app.use(
  secureHeaders({
    contentSecurityPolicy: isProduction
      ? {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'"],
          styleSrcAttr: ["'unsafe-inline'"],
          imgSrc: ["'self'", 'data:', 'https://cdn.dummyjson.com'],
          connectSrc: ["'self'", 'https://dummyjson.com'],
          objectSrc: ["'none'"],
          baseUri: ["'self'"],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
        }
      : undefined,
  }),
)

if (isProduction) {
  app.use(compress())
  app.use(
    '/assets/*',
    serveStatic({
      root: './dist/client',
      onFound: (_path, c) => {
        c.header('Cache-Control', 'public, max-age=31536000, immutable')
      },
    }),
  )
}

function isHttps(requestUrl: string, forwardedProto: string | undefined): boolean {
  return forwardedProto === 'https' || new URL(requestUrl).protocol === 'https:'
}

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
      secure: isHttps(c.req.url, c.req.header('x-forwarded-proto')),
    })
  }

  return c.body(null, 204)
})

app.get('/', async (c) => {
  const { pathname, search } = new URL(c.req.url)
  const url = pathname + search
  try {
    const { template: page, render } = await loadPage(url)
    const { html, payload, status } = await render(url, getCookie(c, 'cart'))
    const dataScript = `<script type="application/json" id="__APP_DATA__">${stringify(payload)}</script>`

    return c.html(
      page.replace('<!--ssr-outlet-->', () => html).replace('<!--app-data-->', () => dataScript),
      status,
    )
  } catch (e) {
    const err = e as Error
    vite?.ssrFixStacktrace(err)
    console.error(err)
    return c.html(ERROR_PAGE, 503, { 'Retry-After': '30' })
  }
})

const hono = getRequestListener(app.fetch)

createHttp((req, res) => {
  if (vite) {
    vite.middlewares(req, res, () => hono(req, res))
  } else {
    hono(req, res)
  }
}).listen(port, () => {
  console.log(`http://localhost:${port} (${isProduction ? 'production' : 'development'})`)
})
