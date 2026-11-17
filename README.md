# Kata E-shop — hand-wired Vue 3 SSR

Production-grade product gallery MVP for the Frontend E-shop Gallery Kata (v4.4): Vue 3 and TypeScript, server-rendered with Vite's SSR API behind a Hono
adapter. No Nuxt or other meta-framework.

> **Work in progress.** Architecture, measurements and trade-offs will be documented here when both user stories are complete.

## Prerequisites

- Node.js **≥ 23.6** (developed on 24.21): `server.ts` runs with Node's native TypeScript type stripping, with no build step.
- pnpm 10

## Getting started

```bash
pnpm install
pnpm dev
```

Then open http://localhost:5173.

## Scripts

| Command             | Purpose                                                     |
| :------------------ | :---------------------------------------------------------- |
| `pnpm dev`          | Development server: Vite in middleware mode, Hono for SSR   |
| `pnpm build`        | Client bundle with SSR manifest, then server bundle         |
| `pnpm typecheck`    | `vue-tsc` on `.ts` and `.vue` files                         |
| `pnpm lint`         | ESLint, zero warnings allowed                               |
| `pnpm format:check` | Prettier check                                              |
| `pnpm test`         | Vitest                                                      |
| `pnpm verify`       | All of the above, in sequence: the gate before every commit |

## Status

- [x] SSR with hydration, state transferred with `devalue`, zero hydration warnings
- [x] **US1, Product List Page:** server-rendered first page (image, name, price, rating), layout-stable images, URL-driven pagination with progressive
      enhancement
- [ ] **US2, Shopping cart:** cookie-persisted cart rendered on first paint ✔︎; add to cart, optimistic updates with rollback in progress
- [ ] Bonus features
- [ ] Final documentation: architecture, performance measurements, trade-offs

The interface is in French (`9,99 €`); code, commits and documentation are in English.

Every line is true today:

- I tested pnpm install then pnpm verify from a fresh clone of develop, and both pass.
- The status doesn't claim anything that isn't done yet.
