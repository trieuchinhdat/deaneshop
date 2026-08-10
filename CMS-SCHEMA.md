# SANITY CMS SCHEMA & GROQ CONVENTIONS

## Adding New Fields to Existing Modules

1. Update schema file in `src/sanity/schemaTypes/modules/`.
2. Update the corresponding GROQ projection fragment in `src/sanity/lib/queries.ts`.
3. Run `npx sanity typegen` (or let type generation reflect structural updates).
4. Update TS props interface in `src/ui/modules/<module-name>/`.

## Sanity Query Standards

- Always project required fields explicitly in GROQ to prevent fetching heavy unused assets.
- Ensure optional object references use safe selection syntax (`image { asset->, alt }`).
