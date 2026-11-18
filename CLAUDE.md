# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project state

Adm Bar is a mobile-first, offline stock and cash register app in Brazilian Portuguese. It has no backend: `app/page.tsx` mounts the client-only `components/app.tsx`, which switches screens from the URL hash (`lib/router.ts`).

- `lib/store.ts` owns all data in `localStorage` (`adm-bar:dados`). Every load and backup import passes through `validarDados`, so new fields on `Dados` must be defaulted there to migrate existing data.
- Every user action appends a `Movimento` to the timeline.
- `lib/senha.ts` owns the optional access password in a separate key (`adm-bar:senha`), so it never appears in exported backups. It needs `crypto.subtle`, which requires HTTPS or localhost.

## Commands

This project uses npm (`package-lock.json`).

```bash
npm run dev                # Start the dev server on http://localhost:3000
npm run build              # Production build (also type-checks and prerenders routes)
npm start                  # Serve the production build
npm run lint               # Lint the whole repo
npx eslint app/page.tsx    # Lint a single file
npx tsc --noEmit           # Type-check without building
npx next typegen           # Regenerate route types without building
```

No test runner is configured, so there is no test command. Setup guides for Vitest, Jest, Playwright, and Cypress are in `node_modules/next/dist/docs/01-app/02-guides/testing/`.

## Architecture

Stack: Next.js 16.4 (App Router, all routes under `app/`), React 19, TypeScript in strict mode, Tailwind CSS 4. The `@/*` import alias resolves to the repo root.

### Rendering and caching

`next.config.ts` enables `cacheComponents` and `partialPrefetching`, which change the defaults for all route code:

- Data fetching is dynamic by default. An uncached async read must either sit inside `<Suspense>` or be cached with `"use cache"` (paired with `cacheLife`). Otherwise Next.js reports a blocking-route error.
- Routes cannot export the `runtime` segment config.
- Links prefetch one shared App Shell per route. Content that depends on `params` or `searchParams` resolves after navigation unless the link sets `prefetch={true}`.
- Client navigation hides the previous route with React `<Activity>` instead of unmounting it. Component state survives, while effects are cleaned up on hide and re-run on show.

### Styling

- Tailwind runs through the `@tailwindcss/turbopack` loader configured in `next.config.ts`. There is no PostCSS or `tailwind.config` file, and the loader only applies to Turbopack, so `--webpack` builds will not process Tailwind.
- Theme tokens live in the `@theme inline` block of `app/globals.css`. Colors are CSS variables that switch on `prefers-color-scheme`.
- Geist fonts are loaded in `app/layout.tsx` and exposed as `font-sans` and `font-mono`. The `body` rule in `globals.css` sets Arial, so text only uses Geist where `font-sans` is applied.

### Generated files

- `LayoutProps` and `PageProps` are global types generated into `.next/types`. `next-env.d.ts` and `.next/` are gitignored, so run `npx next typegen` before `tsc` on a fresh clone.
- `next dev` maintains the marker-delimited blocks in `AGENTS.md`, including an agent feedback block because `experimental.agentFeedback` is on. Keep project guidance outside those markers, and commit any changes `next dev` makes to the file.
