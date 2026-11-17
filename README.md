# Kata E-shop — hand-wired Vue 3 SSR

A production-grade product gallery and shopping cart for the **Frontend E-shop Gallery Kata (v4.4)**: Vue 3 and TypeScript, server-rendered with **Vite's SSR API behind a Hono adapter**, with no Nuxt or other meta-framework.

The catalogue arrives already rendered on the first paint. The client hydrates without refetching. The cart lives in an `HttpOnly` cookie, so the server renders the right count from the first byte, and every change is applied optimistically and rolled back if the save fails.

| Lighthouse (production build) | Performance | Accessibility | Best practices | SEO |
| :---------------------------- | ----------: | ------------: | -------------: | --: |
| Mobile                        |         100 |           100 |            100 | 100 |
| Desktop                       |         100 |           100 |            100 | 100 |

## Contents

1. [Getting started](#getting-started)
2. [Features](#features)
3. [Acceptance criteria and the tests that prove them](#acceptance-criteria-and-the-tests-that-prove-them)
4. [Measurements](#measurements)
5. [Architecture](#architecture)
6. [Key decisions and trade-offs](#key-decisions-and-trade-offs)
7. [What Nuxt would have provided](#what-nuxt-would-have-provided)
8. [Production considerations and known limitations](#production-considerations-and-known-limitations)
9. [Setup Agentic Dev](#setup-agentic-dev)
10. [Time spent](#time-spent)

## Getting started

### Prerequisites

- **Node.js ≥ 23.6** (developed on 24.21). `server.ts` runs directly with Node's native TypeScript type stripping, with no build step for the server adapter.
- **pnpm 10**

### Run it

```bash
pnpm install

# Development: Vite in middleware mode, hot reload
pnpm dev                 # http://localhost:5173

# Production: built assets, compression, CSP, immutable caching
pnpm build
pnpm start               # http://localhost:5173 (PORT=… to change it)
```

### Quality gate

```bash
pnpm verify              # format:check → build → typecheck → lint → test
```

Nothing is committed unless `pnpm verify` is green **and** the browser console is empty (zero hydration warnings). The gate is defined in [`AGENTS.md`](AGENTS.md).

### Demonstrate the optimistic update and its rollback

The cart API always succeeds locally, so failures are injected (development only, never in a production build):

```bash
cp .env.example .env.local
# then set VITE_FAKE_FAILURE_RATE=1 and VITE_FAKE_LATENCY_MS=800, and restart pnpm dev
```

Click "Ajouter au panier": the badge goes up immediately, comes back down about 0.8 s later, and a message offers to retry.

### Scripts

| Command             | Purpose                                                    |
| :------------------ | :--------------------------------------------------------- |
| `pnpm dev`          | Development server: Vite in middleware mode, Hono for SSR  |
| `pnpm build`        | Client bundle with SSR manifest, then server bundle        |
| `pnpm start`        | Production server (`NODE_ENV=production`), serves `dist/`  |
| `pnpm typecheck`    | `vue-tsc` on `.ts` and `.vue` files                        |
| `pnpm lint`         | ESLint (correctness rules only), zero warnings allowed     |
| `pnpm format:check` | Prettier                                                   |
| `pnpm test`         | Vitest (55 tests)                                          |
| `pnpm verify`       | All of the above in sequence: the gate before every commit |

The interface is in French (`9,99 €`); code, commits and documentation are in English.

## Features

### User Story 1 — Product List Page

- The first page of the catalogue is **server-rendered**: image, name, price (in euros) and rating, already in the HTML.
- **No layout shift**: every image declares `width`/`height`, so the browser reserves its box before it loads (CLS 0).
- **The LCP image is never lazy**: the first four images load eagerly, the rest lazily, all decoded asynchronously.
- **URL-driven pagination with progressive enhancement**: real `<a href="?page=2">` links that work without JavaScript, and that the client intercepts (plain left clicks only) to load the next page without a full reload. Back/Forward, sharing and reloading all land on the right page, and any page can be server-rendered.
- The current products stay visible, dimmed, while the next page loads. Out-of-order responses are ignored, and failures keep the current page on screen with a message.
- Responsive grid, from two columns on a phone to a centred 1200 px container on desktop.

### User Story 2 — Shopping cart

- **State management beyond component state**: a Pinia store whose state is serialized into the SSR payload and restored before hydration.
- **Persistence across browser sessions**: an `HttpOnly`, `SameSite=Lax` cookie with a 30-day `Max-Age`, written only by the server through `PUT /api/cart`.
- **Correct on the first paint**: the server reads the cookie and renders the right count before any JavaScript runs.
- **Optimistic updates with error rollback**: the UI changes immediately. If the save fails, the cart returns to the last state the server confirmed, a message explains what happened, and "Réessayer" re-applies the rejected change.
- **Never blocking**: saves run in the background, one at a time; clicks made during a save are coalesced into a single follow-up save.
- **Cart drawer**: a native `<dialog>` with empty and filled states, quantity controls, removal, line totals and the cart total.

### Bonus features

| Brief bonus             | What was done                                                                                                                                                       |
| :---------------------- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Caching strategy        | Shared in-memory TTL cache (60 s) with LRU eviction and request coalescing, for public catalogue data only. Page TTFB: **602 ms → 9 ms**                            |
| Code splitting          | The cart drawer is a separate chunk, prefetched on hover or keyboard focus of the cart button                                                                       |
| Security headers        | Strict production CSP (`script-src 'self'`, `frame-ancestors 'none'`…) plus `nosniff`, `Referrer-Policy`, COOP/CORP and HSTS                                        |
| A11y excellence         | Lighthouse accessibility 100, keyboard focus management during pagination and in the drawer, live announcements, named controls, `prefers-reduced-motion` respected |
| Error handling          | 3 s timeout on every upstream call, a clean 503 page with `Retry-After`, 404 for out-of-range pages, rollback for cart failures                                     |
| Edge cases              | Malformed cookies, malformed `?page=` values, deleted products in the cart, out-of-order and concurrent requests                                                    |
| Advanced filtering      | Not done. Pagination already syncs its state with the URL, and filters would follow the same pattern                                                                |
| Search, virtual scroll… | Not done (see [Time spent](#time-spent))                                                                                                                            |

## Acceptance criteria and the tests that prove them

I defined these criteria from the brief. Every test named below exists in `tests/`. Criteria marked _manual_ were checked in a real browser at each step (Playwright and Chrome DevTools); they have no automated test yet.

| #     | Criterion                                                                           | Proof                                                                                                                                                                                    |
| :---- | :---------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1  | The first page is fully server-rendered and handed to the client as a payload       | `ssr-invariants` › _render() returns the HTML and a { data, state } payload_                                                                                                             |
| AC-2  | No state leaks between two visitors                                                 | `ssr-invariants` › _createApp() returns a fresh Pinia on every call_; _serves the same catalogue page to a second visitor from the shared cache_ (the second visitor gets an empty cart) |
| AC-3  | Any page can be server-rendered from its URL; pages beyond the catalogue return 404 | `ssr-invariants` › _render() reads the page from the URL…_; _render() reports a 404 for a page beyond the catalogue_                                                                     |
| AC-4  | Images never shift the layout and the LCP image is not delayed                      | `product-card` › _reserves the image box with explicit width and height_; _loads priority images eagerly…_; _lazy-loads images by default_; Lighthouse CLS 0                             |
| AC-5  | Only the fields the page needs are requested from the API                           | `api-client` › _requests only the fields the PLP needs, with limit/skip pagination_                                                                                                      |
| AC-6  | Pagination survives out-of-order responses and failures                             | `product-catalog` › _keeps the latest requested page when responses arrive out of order_; _keeps the current products and reports an error…_                                             |
| AC-7  | A malformed `?page=` never reaches the API                                          | `pagination` › _falls back to page 1 for …_ (10 values: `0x10`, `1e1`, `' 3 '`, `abc`…)                                                                                                  |
| AC-8  | The cart is rendered from the cookie on the first paint                             | `ssr-invariants` › _render() reads the cart cookie so the first paint shows the right count_                                                                                             |
| AC-9  | The cookie is never trusted                                                         | `cart-cookie` › _drops malformed, zero and duplicate lines but keeps the valid ones_; _never reads more than 50 lines_                                                                   |
| AC-10 | The cart is persisted through the API in the cookie format                          | `cart-store` › _persists the cart through PUT /api/cart in the cookie format_                                                                                                            |
| AC-11 | A failed save rolls back to the last confirmed cart                                 | `cart-store` › _rolls back to the last saved cart when a save fails_; _rolls back a removal that fails to save_                                                                          |
| AC-12 | Concurrent saves never lose an item                                                 | `cart-store` › _sends saves one at a time so an older snapshot never overwrites a newer one_; _coalesces clicks made during a save into a single follow-up save_                         |
| AC-13 | The shopper can retry a rejected change                                             | `cart-store` › _keeps the rejected change so the shopper can retry it_                                                                                                                   |
| AC-14 | Failures can be simulated for the demo                                              | `cart-api` › _fails without calling the API when VITE_FAKE_FAILURE_RATE is 1_                                                                                                            |
| AC-15 | The drawer has an empty state and lists lines with named controls                   | `cart-drawer` › _shows an empty state with a way back to the catalogue_; _lists each line with quantity controls named after the product_                                                |
| AC-16 | A slow or failing upstream never hangs the page                                     | `api-client` › _aborts the request when DummyJSON does not answer in time_; _throws when DummyJSON answers with an error status_                                                         |
| AC-17 | The cache is fresh, bounded, coalesced and never caches errors                      | `cache` › all five tests                                                                                                                                                                 |
| AC-18 | Ratings and buttons are meaningful to screen readers                                | `product-card` › _exposes the rating as text for screen readers_; _names each add-to-cart button after its product_                                                                      |
| AC-19 | Zero hydration warnings, empty console                                              | _Manual_, at every step, in development and production                                                                                                                                   |
| AC-20 | Keyboard focus is kept during pagination and in the drawer                          | _Manual_ (focus moves to "Page N : …" after navigation; the drawer traps focus and returns it on close)                                                                                  |

## Measurements

All numbers were measured on `pnpm start` (production build) on a local machine.

| Metric                   | Mobile | Desktop |
| :----------------------- | -----: | ------: |
| First Contentful Paint   |  1.1 s |   0.3 s |
| Largest Contentful Paint |  1.6 s |   0.5 s |
| Total Blocking Time      |   0 ms |    0 ms |
| Cumulative Layout Shift  |      0 |       0 |

Lighthouse 12, simulated mobile throttling (slow 4G, 4× CPU slowdown) and desktop preset.

| Size                                       |                    Raw |            Gzip |
| :----------------------------------------- | ---------------------: | --------------: |
| Initial JS (Vue + Pinia + app)             |                92.3 kB |         36.1 kB |
| Initial CSS                                |                 5.7 kB |          1.7 kB |
| Cart drawer chunk (loaded on intent)       | 4.5 kB JS + 4.0 kB CSS | 1.9 kB + 1.2 kB |
| Server-rendered HTML (page 1, 30 products) |                37.4 kB |          3.7 kB |
| SSR state payload inside that HTML         |                 6.0 kB |               – |

| Optimisation                                    | Before   | After   |
| :---------------------------------------------- | :------- | :------ |
| DummyJSON response for 30 products (`select=`)  | 44 090 B | 5 539 B |
| Server TTFB for a catalogue page (shared cache) | 602 ms   | 9 ms    |
| HTML on the wire (gzip)                         | 37.4 kB  | 3.7 kB  |

## Architecture

```
Browser ──GET /?page=2 (Cookie: cart=12:2,5:1)──▶ server.ts (Hono adapter)
                                                   │  reads URL + cookie, nothing else
                                                   ▼
                                     render(url, cartCookie)   ◀── src/entry-server.ts
                                       ├─ createApp()  → fresh app + fresh Pinia per request
                                       ├─ fetchProducts(page)  → publicCache → DummyJSON
                                       ├─ cart store ← parseCart(cookie)
                                       └─ renderToString → { html, payload, status }
                                                   │
Browser ◀── HTML + <script type="application/json">devalue(payload)</script>
   │
   └─ entry-client.ts: parse payload → provide data + restore Pinia → hydrate (createSSRApp)

Cart change:  store updates now ──▶ PUT /api/cart "12:3" ──▶ parseCart → Set-Cookie (HttpOnly)
                     ▲                                  │
                     └──── rollback to last confirmed ◀─┘ on failure
```

### The boundary

`render(url, cartCookie)` in `src/entry-server.ts` knows nothing about any HTTP server: no `Request`, no Hono context, just two strings in and `{ html, payload, status }` out. `server.ts` is a thin adapter that reads the request, calls `render`, and writes the response. Replacing Hono with Express or a serverless handler would not touch the application.

### The SSR invariants

They are written in [`AGENTS.md`](AGENTS.md); the first and the last are also covered by tests:

1. **`createApp()` is a factory.** No app, Pinia, `ref` or `Map` at module level: the Node process is shared, and module state would leak between users. The one deliberate exception is the public catalogue cache (see below).
2. **`createSSRApp` on both sides**, so the client hydrates the server HTML instead of re-rendering it.
3. **State travels in `<script type="application/json">`, serialized with `devalue`**: XSS-safe (`</script>` is escaped), and it supports types JSON does not. It is data, never executed, so it is compatible with a strict `script-src 'self'` CSP.
4. **The cart lives in a cookie, never in `localStorage`**, because only a cookie reaches the server.

Public catalogue data goes in `payload.data` (provided with `provide`/`inject`, cacheable). Per-user state goes in `payload.state` (Pinia, never cached).

### Source map

```
server.ts                   HTTP adapter: dev (Vite middlewares) and production (dist/), cart API, CSP
src/main.ts                 createApp() factory
src/entry-server.ts         render(url, cartCookie): the SSR boundary
src/entry-client.ts         restore payload, then hydrate
src/api/                    DummyJSON client, TTL cache, pagination parsing, cart API client, types
src/cart/cookie.ts          cart cookie codec, dependency-free so server.ts can reuse it
src/stores/cart.ts          cart store: optimistic updates, coalesced saves, rollback, retry
src/composables/            app data injection, catalogue loading, cart product details
src/components/             ProductList, ProductCard, ProductPagination, CartIndicator, CartDrawer, CartToast
tests/                      Vitest: SSR invariants, store, codec, cache, API, components
```

## Key decisions and trade-offs

**SSR approach: Vite's SSR API, by hand.** The brief rules out meta-frameworks. I considered a static or client-only SPA (fast to build, but the catalogue would not be in the first paint), streaming with `renderToWebStream` (earlier first byte, but the payload must come after the content and error handling gets harder mid-stream), and static generation (instant, but a per-user cart cannot be baked in). I chose `renderToString` per request: the page is small, the cache makes the data fetch ~9 ms, and per-user HTML is simple to reason about.

**Hono as the adapter.** It is small, standards-based (`Request`/`Response`), and ships the cookie, body-limit, compression and security-header middlewares used here. In development it sits behind Vite's middlewares; in production it serves everything.

**Cookie, not `localStorage`.** Only a cookie reaches the server, so the cart is right on the first paint with no hydration mismatch. It holds only `{id, qty}` lines (`12:2,5:1`: 8 bytes instead of 34 in JSON), because a cookie travels with every request and product details are public data. The server is the only writer (`HttpOnly`: an injected script cannot read or forge it) and re-validates everything it receives.

**Optimistic concurrency.** A `PUT` of the whole cart is idempotent, so retrying is safe. Saves are serialized so an older snapshot can never overwrite a newer one. Clicks made during a save are coalesced so ten clicks never mean ten requests. On failure, the store rolls back to the last _confirmed_ state rather than "one click back", which is the only state guaranteed to match the server. For reads (pagination) stale responses are ignored; for writes (cart) they are ordered. Neither can be lost.

**The shared cache, and why it is the exception to invariant 1.** A module-level `Map` is normally a cross-user leak. This one holds only public catalogue data, identical for everyone, and never anything from the cart. It stores promises (so concurrent visitors share one upstream request), never caches failures, expires entries after 60 s, and evicts the least recently used entry beyond 200 (a JavaScript `Map` keeps insertion order, so eviction is O(1)). Across several server instances it would become a shared cache (Redis) or, better, an HTTP cache in front of the API.

**Deterministic rendering.** Prices are formatted with `toFixed(2)` and a comma, never `Intl`, because Node and browsers can ship different ICU data and produce different strings, which means a hydration mismatch.

**Native platform first.** `<dialog>` with `showModal()` gives focus trapping, Escape, an inert background and focus return for free. Real links give progressive enhancement. `:focus-visible`, `@media (hover: hover)` and `prefers-reduced-motion` keep interactions honest across input types.

**Deliberately not done.** `modulepreload` from the SSR manifest: the page has a single initial JS chunk, already declared in the HTML, so there is nothing to preload. A "Commander" button: checkout is out of scope, and a control without behaviour is a false promise.

## What Nuxt would have provided

| Nuxt provides                                 | What I implemented by hand                                                                              | What I deliberately left out                                                     |
| :-------------------------------------------- | :------------------------------------------------------------------------------------------------------ | :------------------------------------------------------------------------------- |
| Server rendering and hydration out of the box | `render(url, cartCookie)` with `renderToString`, `createSSRApp` on both sides, `entry-client` hydration | Streaming SSR                                                                    |
| `useState` / payload transfer                 | `{ data, state }` payload serialized with `devalue` into `<script type="application/json">`             | Payload extraction to separate files                                             |
| Per-request app isolation                     | `createApp()` factory, a fresh Pinia per request, enforced by tests                                     | —                                                                                |
| `useFetch` / `useAsyncData` with dedupe       | Typed DummyJSON client, request coalescing and a TTL cache                                              | Automatic key generation, refresh/polling helpers                                |
| `useCookie`                                   | Cookie codec shared by server and client, `HttpOnly` cookie written by a Hono route                     | —                                                                                |
| Server routes (Nitro)                         | `PUT /api/cart` in Hono, with body limit and validation                                                 | File-based API routing                                                           |
| File-based routing                            | URL-driven pagination on a single route                                                                 | A router (one page did not justify it)                                           |
| Asset handling, code splitting, preloading    | Vite build with SSR manifest, immutable caching, an async drawer chunk prefetched on intent             | `modulepreload` from the manifest (a single entry chunk)                         |
| Error pages                                   | 503 page with `Retry-After`, 404 status for out-of-range pages                                          | Per-route error boundaries                                                       |
| Deployment                                    | `pnpm start` production server: compression, CSP, cache headers                                         | Hybrid rendering per route (`swr`, `isr`, `prerender`), Nitro deployment presets |
| Ecosystem modules (image, i18n, SEO…)         | Image sizing and priorities, French formatting, a meta description                                      | `@nuxt/image` optimisation pipeline, i18n                                        |

Building it by hand cost time but made every mechanism explicit and explainable, and the client ships in 36 kB of gzipped JS including Vue and Pinia.

## Production considerations and known limitations

**Already handled:** compression, immutable caching for hashed assets, `Cache-Control: private, no-cache` on HTML (it embeds the visitor's cart, so no CDN may store it), strict CSP, `Secure` cookie whenever the request arrives over HTTPS (directly or via `X-Forwarded-Proto`), 3 s upstream timeout, 503 page, bounded request body and cache size.

**To do before a real deployment:**

- **Several instances**: the in-memory cache is per process. Use an HTTP cache or a shared store in front of the catalogue API.
- **Observability**: the server logs errors to stdout only. Core Web Vitals reporting (`web-vitals`) and error tracking are not wired.
- **Signed cookie**: the cart cookie is validated but not signed. Tampering only changes the visitor's own cart, and prices never come from it, but signing would make that explicit.
- **Automated end-to-end tests**: hydration warnings, keyboard focus and the drawer were verified manually in a real browser. A Playwright suite would lock them in.
- **Windows**: `pnpm start` uses `NODE_ENV=production` shell syntax.
- **Upstream dependency**: DummyJSON is a demo API. Its `select` parameter keeps payloads small, but its latency (~600 ms) is why the cache matters.

## Setup Agentic Dev

I built this kata with an AI coding agent (Claude Code), under a written protocol, and I want to be precise about who wrote what.

**The agent contract.** [`AGENTS.md`](AGENTS.md) (read by any agent; [`CLAUDE.md`](CLAUDE.md) points to it) defines the stack, the commands, the architecture boundary, the four SSR invariants, the definition of done (`pnpm verify` green and an empty console), the files an agent may not touch without approval, and the commit convention. [`PRODUCT.md`](PRODUCT.md) records the product context, users, constraints and principles used for design decisions.

**How the work was split.**

- **Commits `644564c` to `9bb914b` (setup, SSR, PLP, cookie cart, add to cart): typed by me.** The agent explained each step, showed the code and the reason behind it, and gave the verification command; I typed the code, ran the checks, and answered a control question before moving on. Two exceptions: `AGENTS.md` and `PRODUCT.md` were written by the agent.
- **From `e39472e` onward (optimistic updates and rollback, hardening, production mode, cart drawer, cache, CSP, code splitting, this README): written by the agent at my request**, because of the delivery deadline. I reviewed each change, ran the checks and made the commits.

**How it was verified.**

- `pnpm verify` before every commit: Prettier, build, `vue-tsc`, ESLint with zero warnings, and 55 Vitest tests.
- Every step was also checked in a real browser (Playwright): the rendered HTML, network requests, an empty console, keyboard focus.
- An independent adversarial review by a separate agent, given the code but not my conclusions. Its findings drove the hardening commits (timeouts, 404s, focus management, strict parsing).
- Library facts were checked against current documentation, for example staying on TypeScript 6.0 because TypeScript 7 has no JS API yet for `vue-tsc` and `typescript-eslint`.

## Time spent

**About 5 to 7 hours of effective work, over three days**, breaks excluded:

- **Days 1–2 (≈ 1.5 h):** project setup, the hand-wired SSR spike (Vite middleware mode, Hono, `devalue` payload), guardrails (`AGENTS.md`, typecheck, lint, tests).
- **Day 3 (≈ 4–5 h):** the product list and pagination, the cookie cart, optimistic updates and rollback, the hardening pass, production mode, the cart drawer, the bonuses and this documentation.

**What I would cut to fit the recommended 3–5 hours:** the cart drawer (keep the header count), all the bonuses (cache, CSP, code splitting), and the production-mode polish. Both user stories, the SSR invariants and their tests would stay.
