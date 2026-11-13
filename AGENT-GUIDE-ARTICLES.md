# 📰 AGENT-GUIDE-ARTICLES.md: MASTER SPECIFICATION - EDITORIAL & ARTICLE ENGINE ARCHITECTURE (DEANFLOW / DEANCORE)

> **Review status (2026-11-11):** This downloadable importer guide is historical reference material. Verify field names, JSON examples, and feature claims against the current Sanity schema and importer action before use. Current product scope is defined in `STRATEGY_POSITIONING.md`.

> **DeanFlow Commercial Editorial Engine** — High-impact publishing and content-led commerce conversion platform built on **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Sanity CMS v6**, and **Cloudflare D1 Edge SQL**. Engineered for international **Google E-E-A-T** authority and **GEO (Generative Engine Optimization)** for modern AI search engines.

---

## 📑 TABLE OF CONTENTS

1. [Editorial Engine Architecture Overview](#1-editorial-engine-architecture-overview)
2. [Data Modeling & Schema Specification (Sanity CMS)](#2-data-modeling--schema-specification)
   - [2.1. Article Document `blog.post` (Strategic 4-Tab Architecture)](#21-article-document-blogpost)
   - [2.2. Category Document `blog.category`](#22-category-document-blogcategory)
   - [2.3. Global Configuration `blog-settings` (3 Management Tabs)](#23-global-configuration-blog-settings)
   - [2.4. Discussion Storage `blog.comment` & Cloudflare D1 Hybrid Model](#24-discussion-storage-blogcomment--hybrid-model)
3. [Routing Mechanisms, Server Pipeline & Advanced GROQ Queries](#3-routing-mechanisms-server-pipeline--groq-queries)
   - [3.1. Route `/blog/[slug]` — Deep-Dive Article Experience](#31-route-blogslug--deep-dive-article-experience)
   - [3.2. Route `/blog` — Central Journal & Editorial Hub](#32-route-blog--central-journal--editorial-hub)
   - [3.3. Route `/blog/category/[slug]` — Category Landing Pages](#33-route-blogcategoryslug--category-landing-pages)
   - [3.4. Route `/blog/rss.xml` — International RSS 2.0 Syndication Feed](#34-route-blogrssxml--international-rss-20-feed)
4. [Ecosystem of 8 Advanced PortableText Embed Blocks](#4-ecosystem-of-8-advanced-portabletext-embed-blocks)
   - [4.1. `callout-box` (Multi-Tone Editorial Alert)](#41-callout-box)
   - [4.2. `comparison-table` (Enterprise Technical Benchmark Matrix)](#42-comparison-table)
   - [4.3. `product-embed` (Commerce Card & 1-Click Cart Ingestion)](#43-product-embed)
   - [4.4. `cta-banner` (High-Converting Action Banner)](#44-cta-banner)
   - [4.5. `faq-accordion` (Deep Technical Q&A + Auto FAQPage Schema)](#45-faq-accordion)
   - [4.6. `image-gallery` (LQIP-Optimized Grid & Slider Showcase)](#46-image-gallery)
   - [4.7. `video-embed` (16:9 Sandboxed Video Embed)](#47-video-embed)
   - [4.8. `code` & `affiliateLink` (Technical Specs & Affiliate Cards)](#48-code--affiliatelink)
5. [Google E-E-A-T & Generative Engine Optimization (GEO)](#5-google-e-e-a-t--generative-engine-optimization-geo)
   - [5.1. Quadruple E-E-A-T Trust Signals](#51-quadruple-e-e-a-t-trust-signals)
   - [5.2. Generative Engine Optimization (GEO) & Google AI Overviews](#52-generative-engine-optimization-geo)
   - [5.3. Entity Graph JSON-LD Structured Data](#53-entity-graph-json-ld-structured-data)
6. [Automated Publishing: 1-Click Smart Blog Importer](#6-automated-publishing-1-click-smart-blog-importer)
   - [6.1. Dual Parser Engine (Structured JSON AST & Markdown Lexer)](#61-dual-parser-engine)
   - [6.2. Zero-Loss Media Safeguard](#62-zero-loss-media-safeguard)
   - [6.3. Dual Workflow & Master System Prompt for AI Agents](#63-dual-workflow--master-system-prompt)
7. [Real-Time Quality Audit: Universal SEO & GEO Editorial Engine](#7-real-time-quality-audit-universal-seo--geo-editorial-engine)
8. [Interactive Discussion Architecture: Cloudflare D1 Live Comments](#8-interactive-discussion-architecture-cloudflare-d1-live-comments)
9. [Smart Navigation: Sticky Table of Contents (TOC)](#9-smart-navigation-sticky-table-of-contents-toc)
10. [Editorial Operations Playbook (5-Step Publication Workflow)](#10-editorial-operations-playbook)
11. [Engineering Standards & Developer Extension Guide](#11-engineering-standards--developer-extension-guide)

---

## 1. EDITORIAL ENGINE ARCHITECTURE OVERVIEW

In the **DeanFlow / DeanCore** ecosystem, an article is not merely static blog prose; it is an **Enterprise Thought Leadership Asset** and a **High-Conversion Commerce Acquisition Engine** (Content-Led Commerce).

### Core Architectural Principles:
1. **Comprehensive Google E-E-A-T:** Complete transparency regarding credited Authorship (`author`), independent technical verification (`reviewedBy`), fact-checking timestamp (`factCheckedDate`), content freshness tracking (`lastUpdatedDate`), and US FTC legal disclosures (`ftcDisclosure`).
2. **Generative Engine Optimization (GEO):** Structured deliberately for ingestion by Large Language Models and AI search engines (Google AI Overviews, Perplexity, Copilot, ChatGPT Search). High-density summary cards (**Key Takeaways / TL;DR**) and side-by-side benchmarking matrices ensure priority citation in AI summaries.
3. **Content-Led Commerce & First-Party Attribution:** Commercial products are woven seamlessly into editorial narratives using interactive blocks (`product-embed`). Links carry automated first-party campaign attribution (`?utm_source=blog&utm_medium=product_embed...`), and readers can **Add to Cart in 1 click** without losing their reading flow.
4. **Hybrid Data Architecture:**
   - Editorial articles, taxonomies, media assets, and theme settings are managed in the **Sanity CMS Content Lake** (leveraging Visual Presentation and the Live Content API).
   - High-frequency reader interactions (inquiries, comments, threaded replies, lead capture) are processed directly by **Cloudflare D1 Edge SQL Database** for sub-millisecond global latency, isolated completely from CMS read/write quotas.

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SANITY CMS CONTENT LAKE                         │
│  - Documents: blog.post, blog.category, blog-settings, person, product  │
│  - Features: PortableText Rich Builder, Live Content API, AI Scoring   │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (GROQ Query: Real-Time Headings, ReadTime & References)
┌────────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS 16 APPS SERVER (RSC)                      │
│  - Entry Point: app/(frontend)/blog/[slug]/page.tsx                   │
│  - Static Params Generation (SSG) & On-Demand ISR Revalidation        │
│  - Dynamic Metadata & OpenGraph Engine                                 │
│  - Global Modules Ingestion (globalBefore, customModules, globalAfter) │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                  ┌─────────────────┴─────────────────┐
                  ▼                                   ▼
┌──────────────────────────────────┐ ┌──────────────────────────────────┐
│      PORTABLETEXT ENGINE         │ │     INTERACTIVE CLIENT LAYER     │
│ - Anchored Headings (H1-H6)      │ │ - ReadingProgress (0-100% Top)   │
│ - CalloutBox (5 styles)          │ │ - Sticky Header & Sidebar TOC    │
│ - ComparisonTable (Sticky Matrix)│ │ - SocialShare Bar (WebAPI)       │
│ - ProductEmbed (+ Direct Cart)   │ │ - Zustand Store Ingestion        │
│ - CTABanner, FAQ, Gallery, Video │ │ - PostSidebar (IntersectionObs)  │
└──────────────────────────────────┘ └─────────────────┬────────────────┘
                                                       │
                                                       ▼ (Suspense Boundary)
                                     ┌──────────────────────────────────┐
                                     │     CLOUDFLARE D1 (EDGE SQL)     │
                                     │ - Table: comments                │
                                     │ - Honeypot Anti-Spam Trap        │
                                     │ - Two-Tier Moderation (/admin)   │
                                     │ - Author/Specialist Verified Tag │
                                     └──────────────────────────────────┘
```

---

## 2. DATA MODELING & SCHEMA SPECIFICATION

### 2.1. Article Document `blog.post`
Constructed around a **Strategic 4-Tab Architecture** to organize rich editorial workflows:

```
[Tab 1: Content] -> [Tab 2: Publishing] -> [Tab 3: SEO & Metadata] -> [Tab 4: AI Scoring Engine]
```

#### Field Specifications:
| Field Name | Type | Tab | Purpose & Operational Mechanics |
| :--- | :--- | :--- | :--- |
| `title` | `string` | Content | Primary headline (50–70 chars). Renders as H1 and serves as SEO fallback. |
| `excerpt` | `text` (3 rows) | Content | Executive summary / Sapo (150–200 chars). Displayed on cards, Hero banner, RSS feed, and meta description fallback. |
| `keyTakeaways` | `array of string` | Content | 3–5 quantified bullet points (TL;DR). Featured in a prominent callout at the top for quick scanning and Google AI Overviews. |
| `content` | `array of blocks` | Content | Rich PortableText tree containing standard text, code blocks, images with hotspots, and 8 custom embed blocks. |
| `isFeatured` | `boolean` | Publishing | Pins the article to the 12-column **Magazine Hero Banner** at the top of the blog index. |
| `publishDate` | `date` | Publishing | Publication date for ordering, display, and RSS chronology. |
| `lastUpdatedDate` | `date` | Publishing | Freshness tracking date. Boosts rankings via the *Google Freshness Algorithm*. |
| `categories` | `array of ref` | Publishing | References to `blog.category`. At least 1 category is mandatory. |
| `tags` | `array of string` | Publishing | Keyword tags for tag footers and internal search index matching. |
| `author` | `reference` | Publishing | Author profile reference (`person`). Supplies Byline and footer Author Bio Box. |
| `reviewedBy` | `reference` | Publishing | Technical specialist reference (`person`) who audited the data. |
| `factCheckedDate` | `date` | Publishing | Formal technical verification date. |
| `ftcDisclosure` | `string` (radio) | Publishing | Legal disclosure notice (`default`, `affiliate`, `sponsored`, or `none`). Triggers studio warnings if commercial blocks exist. |
| `customFtcDisclosure` | `text` (2 rows) | Publishing | Optional article-specific legal override statement. |
| `tableOfContents` | `string` (list) | Publishing | TOC positioning (`default`, `sticky-bar`, `left`, `right`, or `hidden`). |
| `sidebarLayout` | `string` (list) | Publishing | Desktop sidebar configuration (`none`, `left`, `right`). |
| `allowComments` | `boolean` | Publishing | Per-article discussion section toggle. |
| `relatedProducts` | `array of ref` | Publishing | Products referenced in the article, showcased at the bottom. |
| `relatedPosts` | `array of ref` | Publishing | Curated related articles (falls back to category matching if empty). |
| `metadata` | `object` | SEO | Canonical slug, SEO title, meta description, OpenGraph image, and noIndex toggle. |
| `seoAuditPanel` | `custom input` | AI Engine | Real-time 100-point auditing panel measuring SERP pixel widths, E-E-A-T badges, and WCAG accessibility. |

---

### 2.2. Category Document `blog.category`
Taxonomy organization for the content catalog:
- `title`: Category name (e.g., *Sustainable Solutions*, *Material Science*, *Global Logistics*).
- `slug`: Hierarchical URL identifier auto-generated from `title`.
- `description`: Editorial overview displayed on the category landing page header.
- `image`: Category cover photo (recommended 16:9 aspect ratio, hotspot & LQIP enabled).
- `postsList`: Custom Studio input component (`CategoryPostsList`) displaying live assigned articles.
- `metadata`: Dedicated category SEO configuration.

---

### 2.3. Global Configuration `blog-settings`
Singleton document controlling global layout, styling, reading experience, and CRO modules:

#### Tab 1: Blog Hub & Listing
- **Hero & Spotlight:** Main headline (`title`), Subtitle (`subtitle`), Pill badge (`badgeText`), and Header background banner (`heroBanner`).
- **Listing Layout (`defaultLayout`):**
  - `magazine`: Magazine Hero Spotlight (12 cols) + 3-column sub-grid.
  - `grid`: Standard equal-card grid.
  - `list`: Minimalist editorial row list.
- **Pagination & Discovery:** `postsPerPage` (default 9), Real-time keyword search toggle (`enableSearch`).
- **Article Card Container (`cardStyle`):** Boxed with borders (`boxed`) or Frameless minimalist (`minimalist`).
- **Card Thumbnail Aspect Ratio:** `16:9`, `3:2`, `4:3`, or `1:1`.
- **Card Micro-Elements:** Toggles for category pills, category post counts, excerpts, author avatars, dates, and read times.

#### Tab 2: Article Experience & Engagement
- **Default Author:** Fallback profile when an article has no explicit author.
- **Reading Speed:** Words-per-minute rate (default 200 WPM) used by GROQ for read time calculations.
- **Default TOC Position:** Global TOC position (`sticky-bar`, `left`, `right`, `hidden`).
- **Desktop Sidebar Layout:** Global article layout (`none`, `left`, `right`).
- **Social Sharing Bar:** One-click sharing buttons (X, LinkedIn, Facebook, WhatsApp, Pinterest, Copy Link).
- **FTC Disclosures:** Global legal templates for affiliate commissions and sponsored partnerships.
- **Author Bio Box:** E-E-A-T credential box at the foot of articles.
- **Newsletter Capture:** Lead generation email box on index and article footers.
- **Section Titles:** Global labels for related articles, featured products, latest articles, and discussion.

#### Tab 3: CRO Modules & SEO
- **Top Dynamic Modules (`topModules`):** Banners, countdowns, or announcements injected above the blog hub.
- **Bottom Dynamic Modules (`bottomModules`):** Lead capture forms, catalog grids, or social proof injected below the blog listing.

---

### 2.4. Discussion Storage `blog.comment` & Hybrid Model
- **Cloudflare D1 (Table `comments`):** Serves as the **Primary Production Database** for reader comments, threaded replies, and email lead capture. Optimized for high-frequency writes and sub-millisecond edge reads.
- **Sanity Document `blog.comment`:** Legacy read-only archive (`readOnly: true`). All active comment moderation and official author responses take place inside `/admin`.

---

## 3. ROUTING MECHANISMS, SERVER PIPELINE & GROQ QUERIES

Next.js 16 App Router powers the frontend with 100% React Server Components (RSC), selective Suspense boundaries, and zero client-side waterfall requests.

### 3.1. Route `/blog/[slug]` — Deep-Dive Article Experience
Entry file: `src/app/(frontend)/blog/[slug]/page.tsx`

#### 1. High-Performance GROQ Query (`BLOG_POST_QUERY`):
Executes in a single round-trip:

```groq
*[_type == 'blog.post' && metadata.slug.current == $slug][0]{
	...,
	excerpt,
	keyTakeaways,
	isFeatured,
	lastUpdatedDate,
	factCheckedDate,
	ftcDisclosure,
	customFtcDisclosure,
	tags,
	content[]{
		...,
		_type == 'image' => { ..., asset-> },
		_type == 'affiliateLink' => { ..., affiliateRef->{ ... } },
		_type == 'product-embed' => { ..., product->{ ... } },
		_type == 'image-gallery' => { ..., images[]{ ..., asset-> } },
		_type == 'cta-banner' => { ..., buttonLink{ ${LINK_QUERY} } }
	},
	// 1. Plain text extraction from PortableText tree
	'contentPlainText': pt::text(content),

	// 2. Real-time read time calculation at 200 words/minute
	'readTime': length(string::split(pt::text(content), ' ')) / 200,

	// 3. Real-time heading tree extraction (H2-H6) for TOC
	'headings': content[style in ['h2', 'h3', 'h4', 'h5', 'h6']]{
		style,
		'text': pt::text(@)
	},

	// 4. Resolve taxonomy, author, and reviewer profiles
	categories[]->{ title, slug },
	author->{ name, role, shortBio, socialLinks, image{ ..., asset-> } },
	reviewedBy->{ name, role, shortBio, image{ ..., asset-> } },

	// 5. Expand featured commerce products
	relatedProducts[]->{
		_id, title, price, compareAtPrice, tags, sold, stock, hasVariants,
		options[]{ name, values },
		variants[]{ ... },
		"slug": metadata.slug.current,
		images[]{ ..., asset-> },
		"reviews": *[_type == "review" && references(^._id) && isApproved == true]{ rating },
		categories[]->{ title, "slug": slug.current }
	},

	// 6. Curated related articles
	relatedPosts[]->{
		_id, title, publishDate, excerpt,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		metadata{ ..., image{ ..., asset-> } }
	},

	// 7. Automated fallback category related articles
	'categoryRelatedPosts': *[
		_type == 'blog.post' && references(^.categories[0]._id) && _id != ^._id
	][0...3]{
		_id, title, publishDate, excerpt,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		metadata{ ..., image{ ..., asset-> } }
	},

	// 8. Latest articles deduplication pool
	'latestPosts': *[
		_type == 'blog.post' && _id != ^._id && metadata.noIndex != true
	] | order(publishDate desc)[0...6]{
		_id, title, publishDate, excerpt,
		'readTime': length(string::split(pt::text(content), ' ')) / 200,
		metadata{ ..., image{ ..., asset-> } }
	},

	// 9. Composable global modules resolution
	'globalBefore': (
		*[_type == 'global-module' && path == '*'].before[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == $blogDir].before[]{ ${MODULES_QUERY} }
	),
	'customModules': coalesce(modules, [])[]{ ${MODULES_QUERY} },
	'globalAfter': (
		*[_type == 'global-module' && path == $blogDir].after[]{ ${MODULES_QUERY} }
		+ *[_type == 'global-module' && path == '*'].after[]{ ${MODULES_QUERY} }
	)
}
```

#### 2. Render Pipeline in `BlogPostContent`:
1. **Reading Progress Bar:** `<ReadingProgress />` tracks viewport scroll percentage (0–100%) at `fixed top-0`.
2. **Breadcrumbs:** Structured path: `Home > Journal > [Primary Category] > [Article Title]`.
3. **Editorial Header:**
   - Linked category badge pill.
   - H1 Title with `text-balance` to avoid awkward wrapping.
   - Executive Sapo in prominent typography (`text-lg`).
   - US FTC Compliance Disclosure (`<FTCDisclosure />`) positioned **above the fold**.
   - Credential line: Author Byline, Verified Reviewer Badge ("Fact-checked by Dr. Jonathan Vance"), Publication Date, and Read Time.
   - Top Social Sharing Bar.
   - **Key Takeaways (TL;DR) Box** for executive skimming and Google AI Overviews.
4. **Sticky Table of Contents Bar:** Slides in when scrolled past the fold if set to `sticky-bar`.
5. **Body & Responsive Sidebar Grid:**
   - Evaluates active state: `hasActiveSidebar = isConfiguredSidebar && (hasSidebarHeadings || hasSidebarRelated)`. Automatically collapses to a clean single column (`max-w-4xl`) if no headings or related posts exist.
   - Main body styled via `@portabletext/react` with Tailwind typography (`prose prose-zinc`).
6. **Footer Engagement:**
   - Tag badges.
   - Bottom social sharing bar.
   - Author Bio Box with avatar, title, bio, and social links.
   - **Cloudflare D1 Live Discussion Engine:** Streamed inside `<Suspense fallback={<CommentsSkeleton />}>`.
   - Referenced Products Showcase (`RelatedProducts`).
   - Related Articles & Latest Posts.
7. **JSON-LD Schema Graph:** Embedded in `<Schema post={post} />`.

---

### 3.2. Route `/blog` — Central Journal & Editorial Hub
Entry file: `src/app/(frontend)/blog/page.tsx`

Organized in **3 Modular Strata**:
1. **Top CRO Modules:** Combines global path modules with `blogSettings.topModules`.
2. **Functional Editorial Hub (`<BlogIndex />`):**
   - Magazine header with badge, title, and subtitle.
   - **Real-Time Interactive Toolbar:**
     - `<FilterList />`: Instant category filtering via `useBlogIndexStore`.
     - `<SearchBar />`: Real-time keyword filtering (matches title, excerpt, and tags).
     - `<SortBy />`: Sorting by date (desc/asc) or title (A-Z / Z-A).
   - **Layout Rendering:**
     - On page 1 of `magazine` layout: The featured article is isolated as a prominent **Magazine Hero Spotlight Card (`PostPreviewLarge`)** with a 16:10 aspect ratio across 7 columns.
     - Remaining articles display in a clean grid or list.
   - **Client-Side Pagination:** Managed by the `usePagination` hook.
   - **Lead Capture:** Integrated `<NewsletterBox />`.
3. **Bottom CRO Modules:** Ingests conversion blocks from `blogSettings.bottomModules`.

---

### 3.3. Route `/blog/category/[slug]` — Category Landing Pages
Entry file: `src/app/(frontend)/blog/category/[slug]/page.tsx`
- Ingests `[slug]` to query `getBlogCategory(slug)`.
- Displays category icon, back link, title, editorial description, and live article count pill.
- Article cards strictly inherit global presentation settings from `blog-settings`.
- Dedicated canonical URL and OpenGraph metadata generation.

---

### 3.4. Route `/blog/rss.xml` — International RSS 2.0 Feed
Entry file: `src/app/(frontend)/blog/rss.xml/route.ts`
- Formats article data according to the **RSS 2.0 Specification** for news aggregators (Feedly, Apple News, Google News).
- XML Namespaces: `xmlns:dc="http://purl.org/dc/elements/1.1/"` and `xmlns:content="http://purl.org/rss/1.0/modules/content/"`.
- High-resolution 1200px JPEG media enclosures for feed readers.
- Uses `toHTML` from `@portabletext/to-html` wrapped in `<![CDATA[ ... ]]>`.

---

## 4. ECOSYSTEM OF 8 ADVANCED PORTABLETEXT EMBED BLOCKS

All custom embed blocks include the `not-prose` class to prevent Tailwind typography styles from interfering with component designs:

### 4.1. `callout-box` (Multi-Tone Editorial Alert)
Highlights critical information across 5 semantic tones:
- `tip`: Emerald styling, `Lightbulb` icon. For expert recommendations (*Pro Tip*).
- `info`: Blue styling, `Info` icon. For contextual insights (*Information*).
- `warning`: Amber styling, `TriangleAlert` icon. For procedural warnings (*Important Note*).
- `danger`: Rose styling, `CircleAlert` icon. For critical liabilities (*Caution / Critical Risk*).
- `quote`: Zinc styling, `Quote` icon. For summary takeaways (*Key Takeaway*).

### 4.2. `comparison-table` (Enterprise Technical Benchmark Matrix)
Side-by-side technical evaluation matrix:
- **Header Section:**
  - `badge`: Technical validation badge (e.g., *"Verified Technical Matrix"* with `Shield` icon).
  - `title`: Primary comparison headline.
  - `caption`: Contextual lab testing or methodology notes.
- **Columns & Rows:**
  - `headers`: Column header labels.
  - `rows`: Data rows containing cell values (`cells`).
  - `highlightedColumnIndex`: Highlighted column index (defaults to column 1).
  - `highlightBadge`: Badge pill atop the highlighted column (e.g., *"Recommended"* or *"DeanFlow Solution"*).
- **Intelligent Cell Parser (`parseCell`):**
  - Automatically identifies indicators and renders appropriate icons:
    - `✅`, `✓`, `yes`, `true` ➔ Emerald `CheckCircle2` icon.
    - `❌`, `no`, `false` ➔ Rose `XCircle` icon.
    - `⚠️`, `warn`, `risk` ➔ Amber `AlertTriangle` icon.
  - Generates accessible `aria-label` screen reader announcements for WCAG compliance.
- **Mobile-First Layout Adaptability:**
  - `tableStyle`: Visual styles (`card`, `bordered`, `minimal`).
  - `mobileLayout`:
    - `"sticky-column"`: Freezes the criterion column on the left while horizontal scrolling, with subtle shadow dividers.
    - `"cards"`: Deconstructs rows into independent stacked cards on mobile viewports.
    - `"scroll"`: Standard horizontal scroll with an edge-fade indicator.
- **Footnotes & CTA:**
  - `footnote`: Verified benchmark data citation with `Info` icon.
  - `ctaText`, `ctaLink`, `ctaStyle` (`primary`, `secondary`, `outline`), `ctaSubtext`: Direct conversion action beneath the table.

### 4.3. `product-embed` (Commerce Card & 1-Click Cart Ingestion)
Editorial-to-commerce conversion component:
- **3 Presentation Layouts:**
  1. `minimal`: Compact rounded inline pill badge.
  2. `card`: Standard vertical product card with pricing and quick action button.
  3. `banner`: Wide horizontal spotlight with product image, `customBadge`, `customReviewSnippet`, and primary buy action.
- **First-Party Attribution:** Automatically appends campaign parameters via `appendUtm()`:
  ```
  /products/sustainable-cup?utm_source=blog&utm_medium=product_embed&utm_campaign=sustainable-cup
  ```
- **Global Currency Formatting:** Formatted via `formatPrice()`.
- **Intelligent Inventory Routing:**
  - Out of stock (`inStock === false` or `stock === 0`) ➔ Displays *"Sold Out • Details"*.
  - Multi-variant products (`hasVariants === true`) ➔ Displays *"Select Options"*.
  - Standard in-stock product ➔ **Direct 1-click Add to Cart** into Zustand store (`useCartStore`) with animated confirmation.

### 4.4. `cta-banner` (High-Converting Action Banner)
Conversion banner with 3 themes (`dark`, `light`, `accent` using `bg-linear-to-r`), decorative background glow (`blur-3xl`), and multi-destination link support.

### 4.5. `faq-accordion` (Deep Technical Q&A)
Accordion questions featuring smooth CSS Grid animations (`grid-rows-[1fr]`) to eliminate height clipping. Questions and answers are automatically parsed into Google's `FAQPage` schema.

### 4.6. `image-gallery` (LQIP-Optimized Showcase)
Multi-column photo grid (`grid-2`, `grid-3`, `slider`) with automated WebP compression and Low-Quality Image Placeholders (LQIP).

### 4.7. `video-embed` (16:9 Sandboxed Video Embed)
16:9 widescreen video embed (with 4:3, 1:1, and 9:16 support) for YouTube, Vimeo, or direct MP4 streams within secure sandbox containers.

### 4.8. `code` & `affiliateLink`
- `code`: Syntax-highlighted code block with language tags (`language`) and filenames (`filename`).
- `affiliateLink`: Commercial card with merchant branding, pricing, discount coupon codes, star ratings, and automatic FTC disclosure enforcement.

---

## 5. GOOGLE E-E-A-T & GENERATIVE ENGINE OPTIMIZATION (GEO)

### 5.1. Quadruple E-E-A-T Trust Signals
1. **Experience:** High-resolution in-article photography, operational testing data, and engineering specifications.
2. **Expertise:** Verified Author profiles (`person`) complete with corporate titles, professional bios, and verified social URLs.
3. **Authoritativeness:** Independent technical review attribution (`reviewedBy`) displaying public fact-check notices and verification dates (`factCheckedDate`).
4. **Trustworthiness:**
   - Strict adherence to **US FTC Guidelines (16 CFR Part 255)**. Omitting disclosure on commercial articles triggers validation warnings in Sanity Studio.
   - Content freshness timestamps (`lastUpdatedDate`) demonstrate continuous maintenance.

### 5.2. Generative Engine Optimization (GEO)
Optimized for AI citation in Google AI Overviews, Perplexity, and ChatGPT Search:
- **Key Takeaways Box (TL;DR):** Positioned at the top of the article, containing 3–5 bullet points with **quantified metrics** (e.g., *"-72% lifecycle carbon footprint"*, *"ASTM D6400 mandate takes effect Q2 2026"*).
- **Semantic H2/H3 Hierarchy:** Headings structured to directly answer enterprise procurement queries.

### 5.3. Entity Graph JSON-LD Structured Data
File: `src/ui/modules/blog/schema.tsx`

Assembles a unified JSON-LD graph with safe XSS escaping (`\u003c`):
- **`BlogPosting`**:
  - `headline`, `description`, `datePublished`, `dateModified`, `inLanguage: 'en-US'`.
  - `image`: 1200 × 630 px.
  - `author`: `Person` entity (jobTitle, bio, avatar, sameAs URLs).
  - `publisher`: `Organization` entity with official logo.
  - `keywords`: Merged from article tags and category taxonomies.
- **`BreadcrumbList`**: Complete 4-tier navigation breadcrumb trail.
- **`FAQPage`**: Ingests all in-article FAQ blocks via `getBlockText` to power Google Rich Results.

---

## 6. AUTOMATED PUBLISHING: 1-CLICK SMART BLOG IMPORTER

File: `src/sanity/actions/smart-blog-importer.tsx` & `src/app/(frontend)/api/sanity/import-post/route.ts`

```
┌─────────────────────────┐       JSON / Markdown        ┌─────────────────────────┐
│     AI AGENT MASTER     │ ───────────────────────────> │  SANITY STUDIO ACTION   │
│ (ChatGPT / Claude / ...)│        Clipboard Copy        │ (Smart Blog Importer)   │
└─────────────────────────┘                              └────────────┬────────────┘
                                                                      │
                                                                      ▼ POST /api/sanity/import-post
                                                         ┌─────────────────────────┐
                                                         │   DUAL PARSER ENGINE    │
                                                         │ - Path A: JSON AST      │
                                                         │ - Path B: Markdown Lex  │
                                                         └────────────┬────────────┘
                                                                      │
                                                                      ▼ Smart Resolvers
                                                         ┌─────────────────────────┐
                                                         │ - Auto Category Link    │
                                                         │ - Auto Author Link      │
                                                         │ - Auto Product Embed    │
                                                         │ - Media Checklist Guide │
                                                         │ - Zero-Loss Cover Guard │
                                                         └─────────────────────────┘
```

### 6.1. Dual Parser Engine
1. **Path A (Structured JSON AST Parser):**
   - Extracts all core fields: `title`, `excerpt`, `keyTakeaways`, `publishDate`, `tags`, `tableOfContents`, `ftcDisclosure`.
   - **Intelligent Reference Matching:** Matches `categoryName`, `authorName`, and `productName` against existing Sanity documents to link `_ref` IDs automatically.
   - Transforms `sections` into PortableText blocks, callout boxes, comparison tables, product embeds, CTA banners, video embeds, and galleries.
   - Converts `faq` arrays into `faq-accordion` blocks.
2. **Path B (Markdown Lexer Fallback):**
   - Automatically parses raw markdown `#`, `##`, `###`, bullet lists, and standard callout blocks (`> [!TIP]`, `> [!WARNING]`, `> [!INFO]`, `> [!DANGER]`, `> [!QUOTE]`).

### 6.2. Zero-Loss Media Safeguard
**Existing Cover Images (`metadata.image`) are NEVER overwritten during re-imports**. Editors can safely update copy and structure without risking custom artwork. In-article image recommendations are output to `mediaChecklist` with pre-written WCAG 2.1 AA Alt texts.

### 6.3. Dual Workflow & Master System Prompt

> **2-Track Operational Workflow:**
> 1. **1-Click Rapid Workflow (Recommended Daily):** Click **"Copy AI Master Prompt"** in Sanity Studio ➔ Paste into ChatGPT / Claude with your topic brief ➔ Paste the resulting JSON into the importer and click Parse. The prompt is **100% self-contained**.
> 2. **Deep Architectural Track (Optional for Power Users):** Click **"Download AGENT-GUIDE-ARTICLES.md (Optional)"** to attach this architectural specification to your AI Agent for complex modeling.

```text
You are an International Senior Content Strategist & Google E-E-A-T Editorial Specialist (US/UK Standards).
Your task is to transform the provided editorial briefing into a deeply researched, comprehensive B2B article. Output a single, strictly typed JSON object adhering 100% to this structure for automated 1-Click Sanity CMS import:

MANDATORY EDITORIAL RULES:
1. OUTPUT: Return ONLY a single ```json ... ``` block. Absolutely NO conversational filler, greetings, or text outside the JSON code block.
2. TITLE: 50–70 characters (optimal SERP pixel width 300–580px), compelling, click-worthy, and search-intent aligned.
3. EXECUTIVE SAPO ("excerpt"): 150–200 characters summarizing core technical findings, commercial impact, and executive takeaways.
4. KEY TAKEAWAYS ("keyTakeaways"): 3–5 high-impact bullet points with quantified metrics or actionable findings (vital for Google AI Overviews and executive skimming).
5. RICH CONTENT BUILDER ("sections"): Construct authoritative narrative sections featuring structured headings (H2), comprehensive body paragraphs, and our full suite of 8 interactive embed blocks:
   - "callout": Supports 5 tone styles ("tip", "info", "warning", "danger", "quote") with "title" and "text".
   - "table": Enterprise comparison table with rich cell formatting ("✅ Supported", "❌ Not available", "⚠️ Partial/Conditional"), highlightColumn, mobileLayout ("sticky-column" or "cards"), footnote, and CTA button.
   - "productEmbed": Interactive commerce card with "productName", layout ("card", "banner", or "minimal"), "customBadge", and "customReviewSnippet".
   - "ctaBanner": Conversion banner with "badge", "title", "description", "buttonText", "buttonUrl", and "style" ("dark", "light", "accent").
   - "videoEmbed": Technical proof video with "url", "title", "caption", and "aspectRatio" ("16:9").
   - "imageGallery": Visual proof gallery with "layout" ("grid-2", "grid-3") and image checklists.
   - "image": Single inline photo placeholder with descriptive WCAG 2.1 AA "alt" text and "caption".
6. FAQ ACCORDION ("faq"): 2–3 genuine technical or commercial questions with direct, authoritative answers (automatically ingested into Google FAQPage Schema).
7. E-E-A-T & LEGAL METADATA:
   - "authorName": Primary author name (auto-linked to Sanity person).
   - "reviewerName": Certified technical specialist who verified the data (maps to "Fact-checked by [Name]").
   - "publishDate": YYYY-MM-DD.
   - "tableOfContents": Always set to "sticky-bar".
   - "ftcDisclosure": Set to "default" (or "affiliate" / "sponsored" if commercial elements are present; NEVER "none" when recommending commercial products).
8. MEDIA CHECKLIST ("mediaChecklist"): Shot guide and pre-written Google Image SEO Alt texts for Featured Cover Image and in-article photos.

JSON STRUCTURE SCHEMA (WITH ADVANCED UI EMBEDS):
{
  "title": "Decarbonizing Global Supply Chains: The 2026 Sustainable Packaging Playbook",
  "publishDate": "2026-03-15",
  "categoryName": "Sustainable Solutions",
  "tags": ["esg-compliance", "packaging", "astm-d6400", "global-trade"],
  "authorName": "DeanFlow Editorial Board",
  "reviewerName": "Dr. Jonathan Vance",
  "featured": true,
  "tableOfContents": "sticky-bar",
  "ftcDisclosure": "default",
  "excerpt": "Comprehensive strategic report on transitioning enterprise supply chains to certified compostable packaging under tightening 2026 ESG and EPR mandates across North America and the EU.",
  "keyTakeaways": [
    "Reduces supply chain lifecycle carbon footprint by over 72% compared to petroleum polymers.",
    "Ensures full compliance with the 2026 Extended Producer Responsibility (EPR) packaging laws.",
    "ASTM D6400 and EN 13432 certifications are now mandatory pre-requisites for EU customs clearance.",
    "Optimized nested bio-molding designs yield up to 35% savings in international ocean freight and warehousing volume."
  ],
  "sections": [
    {
      "heading": "1. Regulatory Frameworks and Material Standards",
      "paragraphs": [
        "Next-generation bio-composites reinforced with natural sugarcane bagasse and modified cornstarch exhibit exceptional tensile strength and wide thermal operating resilience from -20°C up to 120°C.",
        "Unlike legacy molded pulp products that weakened when exposed to boiling oils, contemporary hydraulic thermoforming achieves an ultra-dense molecular matrix resistant to grease permeation without relying on toxic fluorinated substances (PFAS)."
      ],
      "callout": {
        "type": "tip",
        "title": "Customs Verification Pro Tip",
        "text": "When exporting to stringent European markets, always require suppliers to furnish third-party heavy metal test reports showing concentrations below 100 ppm to avoid customs holds."
      },
      "image": {
        "alt": "High-precision automated thermoforming production line for biodegradable meal trays",
        "caption": "Precision hydraulic bio-molding machinery at global manufacturing center"
      }
    },
    {
      "heading": "2. Comparative Performance Matrix: Bio-Packaging vs. Conventional Plastics",
      "paragraphs": [
        "A rigorous side-by-side operational comparison reveals clear sustainability advantages across all core compliance categories:"
      ],
      "table": {
        "badge": "Verified Technical Benchmarking",
        "title": "Technical Performance & Environmental Impact Benchmark",
        "caption": "Laboratory validation conducted under ASTM D6400 and EN 13432 certified test protocols.",
        "headers": ["Evaluation Metric", "DeanFlow Bio-Packaging", "Conventional Fossil Plastic"],
        "rows": [
          ["Degradation Lifecycle", "✅ Under 90 days in industrial compost", "❌ Exceeds 450 years in landfill"],
          ["Food Contact Safety", "✅ Compliant with US FDA 21 CFR 176.170", "⚠️ Risk of microplastic & phthalate migration"],
          ["Microwave & Oven Safety", "✅ 100% safe (-20°C to 120°C, Zero PFAS)", "⚠️ Prone to chemical off-gassing and warping"],
          ["Carbon Footprint (LCA)", "✅ 72% lower net CO2e emissions", "❌ High fossil fuel consumption and emissions"]
        ],
        "highlightedColumnIndex": 1,
        "highlightBadge": "DeanFlow Solution",
        "tableStyle": "card",
        "mobileLayout": "sticky-column",
        "footnote": "Certified lifecycle analysis independently verified by TÜV Rheinland (Report #TR-2026-PKG).",
        "ctaText": "Request Bulk Specification Datasheet",
        "ctaLink": "#rfq-form",
        "ctaStyle": "primary",
        "ctaSubtext": "Dispatched within 24 hours with complete lab certification dossier."
      }
    },
    {
      "heading": "3. Recommended Commercial Transition Solutions",
      "paragraphs": [
        "For enterprise food service and export retail brands, transitioning to certified molded fiber trays provides immediate compliance with minimum operational re-tooling."
      ],
      "productEmbed": {
        "productName": "3-Compartment Compostable Bagasse Meal Container",
        "layout": "banner",
        "customBadge": "Top Export Solution",
        "customReviewSnippet": "Tested across 500+ international catering shipments with zero leak incidents and full FDA compliance."
      },
      "ctaBanner": {
        "badge": "Procurement 2026",
        "title": "Schedule a Sustainable Supply Chain Audit",
        "description": "Our senior packaging engineers will analyze your current shipping SKUs and calculate exact carbon and freight volume savings.",
        "buttonText": "Book Engineering Consultation",
        "buttonUrl": "/contact",
        "style": "dark"
      }
    }
  ],
  "faq": [
    {
      "question": "What is the certified shelf life of bagasse packaging in standard warehousing?",
      "answer": "With proprietary dual-barrier bio-coatings, the packaging retains full moisture and oxygen barrier properties for 12 to 18 months under standard dry warehouse storage."
    },
    {
      "question": "Can custom brand logos be imprinted onto biodegradable packaging?",
      "answer": "Yes. We utilize natural soy-based inks that deliver sharp resolution and vibrant color reproduction without hindering industrial compostability timelines."
    }
  ],
  "mediaChecklist": [
    {
      "slot": "Featured Cover Image (Social & Hero 16:9)",
      "guide": "Wide shot of high-tech sustainable manufacturing line or eco facility",
      "suggestedAlt": "Automated sustainable packaging manufacturing facility meeting ASTM D6400 standards"
    },
    {
      "slot": "In-Article Illustration 1",
      "guide": "Close-up laboratory testing and quality verification",
      "suggestedAlt": "Laboratory verification of biodegradable food-contact packaging material"
    }
  ]
}
```

---

## 7. REAL-TIME QUALITY AUDIT: GLOBAL EDITORIAL QUALITY & SEARCH READINESS (GEQSR-1.0)

Files: `src/sanity/lib/article-audit.ts`, `src/sanity/actions/ai-audit-action.tsx`, `src/sanity/ui/ai-audit-footer-button.tsx`, `src/sanity/badges/ai-score-badge.ts`.

Audits articles against an **objective 100-point multi-layer rubric** in real-time inside Sanity Studio, separating **Critical Compliance Gates** from **Editorial & Search Quality Scoring**:

```
+------------------------------------------------------------------------+
| GEQSR-1.0 EDITORIAL QUALITY & SEARCH READINESS INDEX: 94 / 100 PTS     |
+------------------------------------------------------------------------+
| STATUS: ALL CRITICAL GATES PASSED | TIER: TIER 1 GLOBAL FLAGSHIP       |
+------------------------------------------------------------------------+
| PILLAR I: CONTENT DEPTH & AUTHORITY (47 PTS)                           |
| [PASSED] 01. Search Intent & Audience Alignment (10/10 PTS)            |
| [PASSED] 02. Content Depth & Editorial Quality  (14/15 PTS)            |
| [PASSED] 03. E-E-A-T & Trustworthiness          (11/12 PTS)            |
| [PASSED] 04. Originality & Information Gain     (9/10 PTS)             |
+------------------------------------------------------------------------+
| PILLAR II: SEARCH & AI READINESS (31 PTS)                              |
| [PASSED] 05. Semantic SEO & On-Page SERP Pixels (10/10 PTS)            |
| [PASSED] 06. GEO / AEO / AI Search Extraction   (8/8 PTS)              |
| [PASSED] 07. Technical SEO & Clean Permalinks   (8/8 PTS)              |
| [PASSED] 08. Structured Data & Entity Graph     (5/5 PTS)              |
+------------------------------------------------------------------------+
| PILLAR III: EXPERIENCE & COMPLIANCE (22 PTS)                           |
| [PASSED] 09. WCAG 2.2 AA Image Accessibility    (7/7 PTS)              |
| [PASSED] 10. User Experience & Readability      (5/5 PTS)              |
| [PASSED] 11. CRO & Commercial Compliance        (5/5 PTS)              |
| [PASSED] 12. Localization & Multi-Market Prep   (4/5 PTS)              |
+------------------------------------------------------------------------+
```

### Core Architecture & Compliance Rules:
1. **Critical Compliance Gates (Veto Power):**
   - **P0 Critical (Block Publish):** US FTC 16 CFR Part 255 compliance (commercial blocks require active disclosure; cannot be set to "none"), document body existence, and headline integrity.
   - **P1 Required (Block Publish-Ready):** Valid URL slug, crawler indexation safety (`noIndex: false`), semantic H2 structure, inline image Alt text baseline, and SERP title bounds (<= 630px).
2. **5-Tier Quality Classification:**
   - **Tier 1 (Global Flagship Quality):** Total Score >= 90, all Gates Passed, and Pillar I (Content Quality) >= 80% (37.6/47 pts).
   - **Tier 2 (Professional Quality):** Total Score >= 80, all Gates Passed.
   - **Tier 3 (Needs Improvement):** Total Score 65-79 pts.
   - **Tier 4 (Major Revision):** Total Score < 65 pts.
   - **Blocked (Compliance / Technical Block):** Any P0 or P1 failure.
3. **Partial Scoring (5 Levels):** Scores are awarded on a 5-step scale: Level 0 (0%), Level 1 (25%), Level 2 (50%), Level 3 (75%), Level 4 (100%). Every score is supported by concrete article evidence.
4. **Actionable Remediation & Shareable Reporting:** Generates prioritized top action items with targeted Sanity Studio tabs (`content`, `publishing`, `seo`), and offers 1-click Markdown report export for client sign-offs.

---

## 8. INTERACTIVE DISCUSSION ARCHITECTURE: CLOUDFLARE D1 LIVE COMMENTS

File: `src/lib/d1.ts`, `src/app/(frontend)/api/blog/comments/route.ts`, `src/ui/modules/blog/comments/*`

### 1. Ingestion Pipeline & Honeypot Anti-Spam Trap:
- Submissions send a POST request to `/api/blog/comments`.
- **Honeypot Trap:** Forms include a hidden field (`honeypot`). Automated spam bots filling this field receive a mock HTTP 200 response while the payload is silently dropped. This eliminates intrusive CAPTCHAs for legitimate users.
- Legitimate comments are stored in the D1 `comments` table with `is_approved = 0` (pending moderation).

### 2. Threaded Nested Hierarchy:
- Comments support `parent_comment_id`.
- The UI organizes comments into root discussions and nested child replies.

### 3. Verified Official Response Badge:
- Comments submitted or edited by administrators in `/admin` with `is_author_reply = 1` display an **"Official Response"** badge with a verified shield icon.

### 4. Moderation Console (`/admin`):
- Administrators manage discussions via `CommentModal` to approve, delete, or submit official replies.

---

## 9. SMART NAVIGATION: STICKY TABLE OF CONTENTS (TOC)

File: `src/ui/table-of-contents/toc.tsx` & `src/ui/modules/blog/post-sidebar.tsx`

### Technical Highlights:
1. **Normalized Anchor Identifiers:** Headings generate clean IDs using:
   ```ts
   const id = slug(h.text, { removeLeadingNumberAndHyphen: true })
   ```
   (e.g., `"1. Regulatory Frameworks"` normalizes cleanly to `"regulatory-frameworks"`).
2. **IntersectionObserver Scroll Tracking:**
   Uses `IntersectionObserver` with an optimized margin instead of heavy scroll event listeners:
   ```ts
   rootMargin: '-100px 0px -70% 0px'
   ```
   Smoothly activates the active heading item without frame stutter.
3. **Dynamic Header Height Compensation:**
   Clicking a TOC item calculates the dynamic header height (`useHeaderHeight()`) plus bar offsets to scroll smoothly to a 20px reading cushion above the heading.

---

## 10. EDITORIAL OPERATIONS PLAYBOOK

5-step publication workflow for content teams:

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│    STEP 1:   │     │    STEP 2:   │     │    STEP 3:   │     │    STEP 4:   │     │    STEP 5:   │
│  AI Drafting │ ──> │ 1-Click Smart│ ──> │ Photo Asset  │ ──> │ SEO & Legal  │ ──> │ Publish &    │
│  Master Brief│     │    Import    │     │  Fulfillment │     │  Audit (A+)  │     │ Lead Monitor │
└──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘     └──────────────┘
```

1. **Step 1: AI Drafting (1-Click or Document Track)**
   - Open Sanity Studio and navigate to **Articles**.
   - Click **"Smart Importer (JSON/Markdown)"** on the document action bar.
   - **Track 1 (Recommended Daily):** Click **"Copy AI Master Prompt"** ➔ Paste into ChatGPT / Claude with your article brief.
   - **Track 2 (Optional for Power Users):** Click **"Download AGENT-GUIDE-ARTICLES.md (Optional)"** to attach the full architectural specification.
2. **Step 2: 1-Click Ingestion**
   - Copy the generated JSON block from your AI Agent, paste it into the textarea, and click **"Parse & Populate Article"**.
   - All fields across all 4 tabs are mapped automatically.
3. **Step 3: Media Fulfillment**
   - Switch to Tab 3 (SEO & Metadata) and upload your **Featured Cover Image** (recommended 1200 × 675 px, 16:9, under 250 KB).
   - Review the `mediaChecklist` to attach inline photos and verify Alt texts.
4. **Step 4: Real-Time Quality Audit**
   - Switch to Tab 4 (**AI Scoring Engine**).
   - Resolve any warnings until the score reaches **Grade A / A+ (85+ points)**.
5. **Step 5: Publish & Monitor**
   - Click **Publish**. The article is live immediately and syndicated to `/blog/rss.xml`.
   - Monitor inquiries and reader discussions in `/admin`.

---

## 11. ENGINEERING STANDARDS & DEVELOPER EXTENSION GUIDE

### 1. Extending PortableText Embed Blocks (5-Step Protocol):
1. **Define Schema Object:** Create `studio/src/sanity/schemaTypes/objects/<block-name>.ts`.
2. **Register Schema:** Export in `studio/src/sanity/schemaTypes/index.ts`.
3. **Add to Document:** Include `{ type: '<block-name>' }` in the `content` field of `studio/src/sanity/schemaTypes/documents/blog.post.ts`.
4. **Expand GROQ Query:** Add fragment projections in `BLOG_POST_QUERY` inside `src/app/(frontend)/blog/[slug]/page.tsx`.
5. **Implement UI Component:** Create `src/ui/modules/blog/blocks/<block-name>.tsx` and register in `components.types` within `src/ui/modules/blog/blog-post-content.tsx`.

### 2. Sanity Image Safety Protocol:
Never call `urlFor(image).url()` directly without fallback validation:
```tsx
// ❌ DANGEROUS: May crash SSR if asset reference is missing
const imageUrl = urlFor(post.metadata.image).url()

// ✅ ROBUST: Production-safe fallback guard
const imageUrl = post.metadata?.image?.asset
	? urlFor(post.metadata.image).width(1200).height(630).url()
	: `${baseUrl}/api/og?slug=${ROUTES.blog}/${slug}`
```

### 3. Performance & Core Web Vitals (INP, LCP, CLS):
- First article thumbnails on the journal hub (`PostPreviewLarge`) must specify `priority={true}` and `loading="eager"`.
- Use `text-balance` on headlines to avoid Cumulative Layout Shift (CLS).
- Wrap heavy interactive or database-driven components (such as live Edge SQL comments) in `<Suspense>` boundaries to leverage Next.js Streaming SSR.

---

> **DeanFlow Commerce Engine — Enterprise Content Architecture.**  
> Verified and tested on Next.js 16.1.1, React 19.2.3, Sanity CMS v6, and Cloudflare D1.
