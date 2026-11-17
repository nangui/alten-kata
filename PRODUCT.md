# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Primary: a general-public shopper** browsing a general-merchandise catalogue (beauty, fragrances, furniture, groceries…) on a phone or a desktop. They scan quickly, compare price and rating at a glance, and add items to a cart without waiting on the page.
- **Evaluating audience: a senior technical jury** (frontend kata for a Senior Fullstack Vue.js position). They judge production quality, performance strategy and architecture, and the design is part of that judgment. The product is built for the shopper first; every choice must also be defensible in a live debrief.

## Product Purpose

A production-grade e-commerce product gallery MVP covering two user stories:

1. **Product List Page (PLP):** server-rendered product listing with image, name, price and rating, sub-second initial paint and smooth interactions.
2. **Shopping cart:** state managed beyond component state, optimistic updates with error rollback, persistence across browser sessions, UI updates that never block interaction.

Success means a shopper can browse and fill a cart with no visible wait or layout jump on any device, and the author can explain every rendering and design decision.

## Positioning

A hand-wired SSR storefront: Vue 3 server rendering on Vite's SSR API behind a Hono adapter, with no meta-framework. The catalogue reaches the first paint already rendered, the client hydrates without refetching, and public catalogue data is kept strictly separate from per-user cart state.

## Operating Context

- Demonstrated locally (`pnpm dev`) during a live interview, on desktop and in narrow/mobile viewports.
- Evaluated through the code, the commit history, the README and Lighthouse measurements.
- Shoppers arrive on the listing page directly; there is no account or checkout flow in scope.

## Capabilities and Constraints

- **Stack (fixed by the brief):** Vue 3, TypeScript, Vite SSR, Hono via `@hono/node-server`, Pinia, `devalue`. No Nuxt, Next or similar meta-framework.
- **Data:** DummyJSON (~194 products, `limit`/`skip` pagination, `select=` to limit fields). Prices carry no currency in the API; they are displayed in euros (`9,99 €`) as a presentation choice.
- **SSR invariants:** `createApp()` is a factory; `createSSRApp` on both sides; payload in `<script type="application/json">` serialized with `devalue`; cart persisted in a cookie (never `localStorage`) so the server renders the correct cart on first paint.
- **Hydration:** zero hydration warnings is a release criterion; formatting must be deterministic between Node and the browser (no `Intl` for prices).
- **In scope next:** client-side pagination, cookie cart, optimistic update with rollback.
- **Optional bonuses (only after both user stories are complete):** multi-criteria filters synced with the URL, debounced search, API response caching, `modulepreload`.
- **Out of scope:** checkout, payment, accounts, product detail page (undecided).

## Brand Commitments

- Name: **Kata E-shop**, neutral, no invented brand. Must not imitate the name, logo or identity of any real retailer.
- Interface language: French (copy, labels, price format).

## Evidence on Hand

- Product data, titles, ratings and 300×300 thumbnails come from DummyJSON. Some titles are truncated at the source (e.g. "Dolce Shine Eau de").
- No real reviews count, testimonials, stock levels, promotions or delivery promises exist; none may be fabricated. DummyJSON's `reviews` field holds sample reviews only.

## Product Principles

1. **Nothing waits, nothing jumps.** The first paint is complete, images reserve their space, and interactions respond immediately.
2. **Every element earns its place.** No control without behaviour (no decorative wishlist or filter placeholders).
3. **Public data and user state stay separate.** Catalogue data is cacheable and shared; cart state is per user and never cached.
4. **Explainable over clever.** Each design and rendering choice must be defensible in the debrief.
5. **Mobile and desktop are both first-class.** Layout adapts from two columns on phones to a centred, bounded grid on desktop.

## Accessibility & Inclusion

- Semantic structure (`main`, list of products, headings per product), descriptive image `alt` text, ratings exposed as text to screen readers.
- Full keyboard operability for every interactive element, with visible focus.
- Respect `prefers-reduced-motion` for any hover or transition effect.
