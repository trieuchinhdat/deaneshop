# AI AGENT CODING GUIDELINES & ARCHITECTURE (ECOCROS / DEANCORE)

## 1. Stack & Runtime Rules

- **Framework**: Next.js 16.1.1 (App Router), React 19.2.3 (React Compiler enabled).
- **Language**: TypeScript 5.9 strict mode. Always use types generated from Sanity (`sanity typegen`).
- **Styling**: Tailwind CSS v4.
- **State Management**: Zustand v5 with `persist` middleware for local storage.
- **CMS**: Sanity CMS v5 with GROQ queries & Live Content API.

## 2. Dynamic Block Builder Architecture

- **Global Module Resolver**: ALL pages (Home, Product Detail, Blog, Static Pages) resolve dynamic Sanity blocks through `src/ui/modules/index.tsx` (`ModulesResolver`).
- **Creating a New Module**:
  1. Define schema in `src/sanity/schemaTypes/modules/<module-name>.ts`.
  2. Register schema in `src/sanity/schemaTypes/index.ts`.
  3. Include in GROQ fragment queries in `src/sanity/lib/queries.ts`.
  4. Create UI component in `src/ui/modules/<module-name>/`.
  5. Register the `_type` mapping in `src/ui/modules/index.tsx`.

## 3. Strict Coding Conventions

- **Client vs Server Components**: Keep page entry points as Server Components (`page.tsx`). Extract interactive logic into separate `*-client.tsx` components with `'use client'`.
- **Sanity Image Safety**: NEVER call `urlFor()` directly on an array item without fallback verification:

  ```ts
  // BAD
  urlFor(images?.[0]).url()

  // GOOD
  images?.[0] ? urlFor(images[0]).url() : '/fallback-image.png'
  ```
