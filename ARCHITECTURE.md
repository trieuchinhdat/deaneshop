### 2. `ARCHITECTURE.md`

> **Mục đích**: Mô tả bức tranh tổng thể về sơ đồ thư mục, luồng dữ liệu (Data Flow), và cơ chế render để AI đưa ra giải pháp đúng vị trí component mà không bị tạo trùng lặp code.

**Nội dung mẫu gợi ý cho `ARCHITECTURE.md`:**

```markdown
# PROJECT ARCHITECTURE & DATA FLOW

## Directory Layout

- `src/app/(frontend)/`: Next.js App Router routes (`page.tsx`, `layout.tsx`).
- `src/sanity/`: Sanity Studio configurations, schemas, live client, and GROQ queries.
  - `schemaTypes/documents/`: Master models (Product, Post, Site Settings).
  - `schemaTypes/modules/`: Block-based UI components configurable in CMS.
  - `lib/queries.ts`: Main GROQ queries fetching pages & modules.
- `src/ui/`: UI components library.
  - `ui/modules/`: Component implementations corresponding to Sanity modules.
  - `ui/header/`, `ui/footer/`: Global structural components.
- `src/store/`: Zustand state stores (e.g., `use-cart-store.ts`).

## Data Fetching Strategy

1. Next.js Server Components query Sanity using `sanityFetchLive` from `src/sanity/lib/live.ts`.
2. Fetched data includes an array of `modules`.
3. `page.tsx` renders `<ModulesResolver modules={data.modules} />`.
4. Client components subscribe to Zustand stores for cart state & checkout.
```
