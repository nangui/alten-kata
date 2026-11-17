# AGENTS.md

## 1. Stack

- Package manager: pnpm 10.
- Vue 3.5 + Pinia, TypeScript 6.0, Vite 8 (SSR mode), Hono 4 via `@hono/node-server` 2, `devalue` for payload serialization.
- TypeScript stays on 6.0: TS 7 has no JS API yet, which `vue-tsc` and `typescript-eslint` require.
- Tooling: `vue-tsc` (typecheck), ESLint + `typescript-eslint` + `eslint-plugin-vue` (lint), Prettier (format), Vitest (test).
- ESLint checks correctness only; Prettier owns formatting. Never add stylistic ESLint rules.
- `server.ts` runs with Node's native type stripping (Node >= 23.6): types are erased, never checked at runtime.
- Product API: DummyJSON.
- **No meta-framework** (no Nuxt, Next, Vike, Astro, `vite-plugin-ssr`…): the kata forbids them, so SSR is wired by hand on top of Vite's SSR API.

## 2. Commands

| Command             | Purpose                                                               |
| :------------------ | :-------------------------------------------------------------------- |
| `pnpm dev`          | `node server.ts`: Vite in middleware mode, Hono as fallback           |
| `pnpm build:client` | `vite build --outDir dist/client --ssrManifest`                       |
| `pnpm build:server` | `vite build --outDir dist/server --ssr src/entry-server.ts`           |
| `pnpm build`        | `build:client` then `build:server`                                    |
| `pnpm typecheck`    | `vue-tsc --noEmit` (`.ts` and `.vue`)                                 |
| `pnpm lint`         | `eslint . --max-warnings 0`                                           |
| `pnpm test`         | `vitest run`                                                          |
| `pnpm format`       | `prettier --write .` (formats every file)                             |
| `pnpm format:check` | `prettier --check .` (fails on unformatted files)                     |
| `pnpm verify`       | `format:check` + `build` + `typecheck` + `lint` + `test`, in sequence |

## 3. Architecture boundaries

- `server.ts`: HTTP adapter only (Hono + Vite middlewares). Reads the request, calls `render`, writes the response.
- `src/main.ts`: `createApp()` factory, returns `{ app, pinia }`.
- `src/entry-server.ts`: exports `render(url, ctx)`. **It knows nothing about any HTTP server**: no `Request`, no Hono context. Hono is just an adapter that could be replaced.
- `src/entry-client.ts`: restores state from the payload, then hydrates.
- `src/api/`: typed DummyJSON client and types. `src/stores/`: Pinia stores. `src/components/`, `src/composables/`: UI.

## 4. SSR invariants (non-negotiable)

1. `createApp()` is a **factory**, never an exported value. No `createApp`, `createPinia`, `ref` or `Map` at module level: the Node process is shared, and module state leaks between requests (between users).
2. `createSSRApp` on **both** server and client.
3. State goes through `<script type="application/json">`, serialized with `devalue` (never `JSON.stringify`, never `window.__DATA__`).
4. The cart lives in a **cookie**, never in `localStorage`.

## 5. Definition of done

Nothing is committed unless `pnpm verify` is green **and** the browser console is **empty** (zero hydration warnings).

## 6. What agents may and may not touch

- **Free:** `src/components/`, `src/composables/`, `src/api/types.ts`, `tests/`.
- **Forbidden without explicit approval:** `server.ts`, `src/entry-server.ts`, `src/entry-client.ts`, `src/stores/cart.ts`.

## 7. Commit convention

Conventional Commits (`feat:`, `fix:`, `chore:`, `docs:`, `test:`, `refactor:`). One commit per intent. Never `wip`.
