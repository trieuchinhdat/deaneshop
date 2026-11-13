# AI AGENT CODING GUIDELINES & ARCHITECTURE (DEANFLOW / DEANCORE)

## 1. Stack & Runtime Rules

- **Framework**: Next.js 16.4.6 (App Router), React/React DOM 19.3.1 (React Compiler enabled). Node.js >=22.12; use npm and package-lock.json for security overrides.
- **Language**: TypeScript 5.9 strict mode. Always use types generated from Sanity (`sanity typegen`).
- **Styling**: Tailwind CSS v4.
- **State Management**: Zustand v5 with `persist` middleware for local storage.
- **CMS**: Sanity CMS v6 with GROQ queries & Live Content API.

## 2. Dynamic Block Builder Architecture

- **Global Module Resolver**: ALL pages (Home, Product Detail, Blog, Static Pages) resolve dynamic Sanity blocks through `src/ui/modules/index.tsx` (`ModulesResolver`).
- **Creating a New Module**:
  1. Add friendly name to `MODULE_FRIENDLY_NAMES` in `studio/src/sanity/lib/module-preview-config.ts`.
  2. Define schema in `studio/src/sanity/schemaTypes/modules/<module-name>.ts` using `defineModulePreview()`. Never write manual `preview.prepare`.
  3. Register schema in `studio/src/sanity/schemaTypes/index.ts` & `studio/src/sanity/schemaTypes/fragments/modules.ts`.
  4. Include in GROQ fragment queries in `src/sanity/lib/queries.ts`.
  5. Create UI component in `src/ui/modules/<module-name>/`.
  6. Register the `_type` mapping in `src/ui/modules/index.tsx`.

## 3. Strict Coding Conventions

- **Client vs Server Components**: Keep page entry points as Server Components (`page.tsx`). Extract interactive logic into separate `*-client.tsx` components with `'use client'`.
- **Sanity Image Safety**: NEVER call `urlFor()` directly on an array item without fallback verification:

  ```ts
  // BAD
  urlFor(images?.[0]).url()

  // GOOD
  images?.[0] ? urlFor(images[0]).url() : '/fallback-image.png'
  ```

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
