# SANITY CMS SCHEMA & GROQ CONVENTIONS

## Creating a New Module (Centralized Module Preview Architecture)

All modules in DEANFLOW must utilize the Centralized Module Preview Architecture to ensure 100% consistent module identification across Sanity Studio.

### Step-by-Step Workflow for Adding a New Module:

1. **Register Merchant Friendly Name:**
   Add the schema identifier to `MODULE_FRIENDLY_NAMES` in `src/sanity/lib/module-preview-config.ts`:
   ```ts
   export const MODULE_FRIENDLY_NAMES = {
     // ...
     'new-module': 'New Module Friendly Name',
   } as const
   ```

2. **Define Schema with `defineModulePreview`:**
   Create schema file at `src/sanity/schemaTypes/modules/<module-name>.ts`. Always use the shared helper and **never write manual `preview.prepare`**:
   ```ts
   import { defineField, defineType } from 'sanity'
   import { SparklesIcon } from '@sanity/icons'
   import { defineModulePreview } from '@/sanity/lib/define-module-preview'

   export default defineType({
     name: 'new-module',
     title: 'New Module',
     type: 'object',
     icon: SparklesIcon,
     groups: [
       { name: 'content', title: 'Content', default: true },
       { name: 'design', title: 'Design' },
       { name: 'settings', title: 'Settings' },
     ],
     fields: [
       defineField({
         name: 'heading',
         title: 'Main Headline',
         type: 'string',
         group: 'content',
       }),
       // ... other fields
     ],
     preview: defineModulePreview({
       schemaName: 'new-module',
       icon: SparklesIcon,
       titleFields: ['heading', 'title'],
       imageField: 'image', // optional image preview
       select: {
         items: 'items',
       },
       metadata: (doc) => [
         doc.items?.length ? `${doc.items.length} items` : null,
       ],
     }),
   })
   ```

3. **Standardized Preview Output Format:**
   - **Title**: `[Friendly Name] - ${heading || title || 'Untitled'}`
   - **Subtitle**: `<metadata>` (clean display, e.g., `3 columns | 4 rows`, or omitted if no metadata).
   - **Image Fallback**: When `imageField` is configured but no valid asset exists, `(No content)` is displayed in the subtitle while media safely falls back to the module icon.
   - **Hidden State**: When a module is hidden (`hidden: true` or `attributes.hidden: true`), `[Hidden]` is automatically prefixed to the subtitle.

4. **Register Schema in System:**
   - `src/sanity/schemaTypes/index.ts` (added to dynamic modules array with `withModuleHidden`).
   - `src/sanity/schemaTypes/fragments/modules.ts` (added to Page Builder array and insertMenu groups).

5. **Query & Frontend Binding:**
   - Add GROQ projection fragment in `src/sanity/lib/queries.ts`.
   - Build UI component in `src/ui/modules/<module-name>/`.
   - Register component mapping in `src/ui/modules/index.tsx` (`MODULES_MAP`).

---

## Adding New Fields to Existing Modules

1. Update schema file in `src/sanity/schemaTypes/modules/`.
2. Update the corresponding GROQ projection fragment in `src/sanity/lib/queries.ts`.
3. Run `npm run typegen` to regenerate TypeScript types (`src/sanity/types.ts`).
4. Update TS props interface in `src/ui/modules/<module-name>/`.

---

## Sanity Query Standards

- Always project required fields explicitly in GROQ to prevent fetching heavy unused assets.
- Ensure optional object references use safe selection syntax (`image { asset->, alt }`).
