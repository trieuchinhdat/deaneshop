# AGENT-GUIDE-PRODUCT.md: SMART PRODUCT IMPORTER - AI AGENT MASTER SPECIFICATION

> **Review status (2026-11-11):** This downloadable importer guide needs schema and action verification before its JSON examples or feature claims are used. Product direction is defined in `STRATEGY_POSITIONING.md`.

> **DeanFlow Commerce B2B/D2C Product Engine** — Technical specification, data schema mapping, and international **Master System Prompt** designed for modern AI Agents (ChatGPT, Claude, Gemini, DeepSeek...) to generate high-conversion, export-grade product data compatible 100% with the **1-Click Smart Product Importer** in Sanity Studio.

---

## 1. ARCHITECTURE & 3-TAB CONTENT MAPPING

When pasting the generated JSON (or structured text) into the **"Smart Importer (JSON/Text)"** modal in Sanity Studio, the engine automatically extracts and distributes all fields across the 3 core tabs:

### Tab 1: Overview & Content
* **Product Title (`title`)**: Commercial, SEO-optimized title (50–80 characters).
* **SKU / Model Number (`sku`)**: Industry-standard stock keeping unit identifier (e.g., `ECO-TRAY-850-3C`).
* **Categories (`categoryName` / `categories`)**: Automatically queries existing Sanity categories (`product.category`) and resolves references.
* **Search Tags (`tags`)**: Array of keyword tags for internal catalog filtering and faceted search.
* **Value Proposition / Executive Pitch (`shortPitch`)**: 1–2 high-impact sentences highlighting why commercial buyers should choose this product.
* **Key Selling Highlights (`keyBenefits`)**: Structured selling points as `{ title, description }`.
* **Rich Product Story (`storyDescription` / `description`)**: Full-length PortableText blocks with H2/H3 headings, process breakdowns, and manufacturing quality narratives.
* **Zero-Loss Media Safeguard (`images`)**: **Existing photography is NEVER overwritten**. Editors upload real imagery manually in Tab 1.

### Tab 2: Commercial & Sales
* **Conversion Mode (`conversionType`)**: `rfq` (Request for Quote), `consultation` (Demo/Consultation), or `order_request` (Direct Reserve/Sample Order).
* **Pricing Model (`pricingModel`)**: `fixed`, `range`, `starting_at`, `tiered` (Volume matrix), or `quote_only`.
* **Currency & Unit Price (`currency`, `price`)**: Default currency (USD, EUR, GBP, AUD, SGD, VND) and numeric price.
* **Compare At Price (`compareAtPrice`)**: Original MSRP/list price with automated rule verification (`compareAtPrice >= price`).
* **Price Term Note (`priceNote`)**: Commercial freight & trade terms (e.g., *"Ex-works export price. International shipping, insurance and customs clearance quoted upon inquiry."*).
* **Custom CTA Action (`customCtaText`, `customCtaSubtext`)**: Conversion button label override (e.g., *"Request Official B2B Quotation"*) and trust subtext.
* **MOQ & Lead Time (`moq`, `leadTime`)**: Minimum order quantity and verified factory dispatch lead times.
* **Volume Pricing Matrix (`priceTiers`)**: Tiered discount breakdown (`minQty`, `maxQty`, `unitPrice`, `incoterm`, `badge`, `isCustomQuote`).

### Tab 3: Specs & SEO
* **Technical Specifications (`specs`)**: Key-value attribute pairs `{ label, value }` (e.g. Dimensions, Capacity, Materials, Temperature Range, Certifications, Master Carton packaging).
* **SEO & Social Metadata (`seo` / `metadata`)**: SEO title, description, and canonical `slug`.
* **Photography Guidance & Alt Text Checklist (`mediaChecklist`)**: Displays studio shot concepts with ready-to-copy Google Image SEO Alt texts.

---

## 2. MASTER SYSTEM PROMPT FOR AI AGENTS

> **Quick Workflow:** You can click the **"Copy AI System Prompt"** button directly inside Sanity Studio right above the import textarea, or copy the prompt below:

```text
You are an International B2B Product Director & Global E-Commerce Copywriting Specialist (US/UK Market Standards).
Your task is to transform the provided product briefing into a single, strictly typed JSON object adhering 100% to this structure for automated Sanity CMS import:

MANDATORY RULES:
1. Return ONLY a single ```json ... ``` block. Absolutely NO conversational filler, greetings, or text outside the JSON code block.
2. Numeric fields (price, compareAtPrice, maxPrice, moq, stock, minQty, maxQty, unitPrice) MUST be raw floating-point numbers (e.g. 0.45, NOT "$0.45" or "0,45").
3. DO NOT generate placeholder or fabricated image URLs. Instead, populate "mediaChecklist" with professional photo shoot shot guides and Google SEO Alt texts so the catalog manager can upload real photography manually.
4. "compareAtPrice" (if set) must be greater than or equal to "price".
5. "conversionType" must be one of: "rfq", "consultation", "order_request".
6. "pricingModel" must be one of: "fixed", "range", "starting_at", "tiered", "quote_only".
7. Commercial CTAs & Disclaimers: Populate "priceNote", "customCtaText", and "customCtaSubtext" to reinforce buyer confidence and clarify trade terms (Incoterms, dispatch schedules).

JSON STRUCTURE SCHEMA:
{
  "title": "Full Commercial Product Name (50-80 chars)",
  "sku": "MODEL-SKU-2026",
  "categoryName": "Target Category Name",
  "tags": ["keyword1", "keyword2", "keyword3", "keyword4"],
  "conversionType": "rfq",
  "pricingModel": "tiered",
  "currency": "USD",
  "price": 0.45,
  "compareAtPrice": 0.55,
  "priceNote": "Ex-works export price. International shipping, insurance and customs clearance quoted upon inquiry.",
  "customCtaText": "Request Official B2B Quotation",
  "customCtaSubtext": "No upfront payment required. Dedicated export specialist confirms delivery timeline within 12 hours.",
  "moq": 5000,
  "leadTime": "Dispatches within 5-7 business days worldwide",
  "shortPitch": "1-2 sentence compelling executive summary of the core commercial value proposition.",
  "keyBenefits": [
    {
      "title": "Core Commercial Advantage 1",
      "description": "1-2 sentence quantified commercial benefit."
    },
    {
      "title": "Operational Efficiency 2",
      "description": "Cost savings or logistics efficiency advantage."
    },
    {
      "title": "Compliance & Safety 3",
      "description": "Certified standard or structural durability."
    }
  ],
  "specs": [
    { "label": "Material", "value": "100% Natural Biodegradable Fiber & Food-Grade Additives" },
    { "label": "Dimensions", "value": "230 x 185 x 42 mm" },
    { "label": "Volume Capacity", "value": "850 ml (3 compartments)" },
    { "label": "Unit Weight", "value": "28g ± 2g" },
    { "label": "Thermal Tolerance", "value": "-20°C to 120°C (Microwave & Freezer Safe)" },
    { "label": "International Certifications", "value": "US FDA 21 CFR 176.170, BPI, EN 13432, LFGB" },
    { "label": "Master Carton Packaging", "value": "500 pcs / 5-ply reinforced export master carton" }
  ],
  "priceTiers": [
    { "minQty": 5000, "maxQty": 19999, "unitPrice": 0.45, "incoterm": "FOB", "badge": "Standard" },
    { "minQty": 20000, "maxQty": 49999, "unitPrice": 0.38, "incoterm": "FOB", "badge": "Most Popular" },
    { "minQty": 50000, "isCustomQuote": true, "incoterm": "CIF", "badge": "VIP Contract" }
  ],
  "storyDescription": [
    "## 1. Industry Context & Sustainable Transition\\nComprehensive paragraph analyzing environmental compliance and market dynamics...",
    "## 2. Engineered Thermal & Leak-Proof Performance\\nDetailed technical paragraph on structural integrity and food contact safety...",
    "## 3. Global Freight & Pallet Optimization\\nAnalysis on interlocking nested geometry reducing ocean shipping container volume..."
  ],
  "seo": {
    "metaTitle": "SEO Page Title (50-65 chars) | Brand Name",
    "metaDescription": "Concise meta description (150-160 chars) with strong commercial RFQ call-to-action."
  },
  "mediaChecklist": [
    {
      "slot": "Hero Storefront Image 1",
      "guide": "Front 45-degree angle studio shot on seamless white background",
      "suggestedAlt": "Commercial product front perspective on white background"
    },
    {
      "slot": "Material & Texture Detail 2",
      "guide": "Close-up macro capturing surface density and rim finish",
      "suggestedAlt": "Detail of natural fiber surface texture and rim finish"
    },
    {
      "slot": "Export Packaging & Pallet 3",
      "guide": "Nested stack configuration inside master carton with pallet label",
      "suggestedAlt": "Export master carton packaging and pallet configuration"
    }
  ]
}
```

---

## 3. COMPLETE PRODUCTION-READY SAMPLE (TEST LIVE)

Copy the full JSON payload below and paste it directly into the **"Smart Importer (JSON/Text)"** modal in Sanity Studio:

```json
{
  "title": "Heavy-Duty 3-Compartment Biodegradable Bagasse Meal Tray 850ml",
  "sku": "ECO-TRAY-850-3C",
  "categoryName": "Food Packaging",
  "tags": ["bagasse meal tray", "3-compartment container", "biodegradable packaging", "ASTM D6400", "EU export compliant"],
  "conversionType": "rfq",
  "pricingModel": "tiered",
  "currency": "USD",
  "price": 0.32,
  "compareAtPrice": 0.42,
  "priceNote": "Ex-works export price. International ocean freight and customs clearance quoted upon destination harbor inquiry.",
  "customCtaText": "Request Official Export RFQ",
  "customCtaSubtext": "No upfront payment required today. Dedicated packaging engineer confirms container dispatch within 12 hours.",
  "moq": 5000,
  "leadTime": "Dispatches within 5-7 business days worldwide",
  "shortPitch": "Industrial-grade 3-compartment compostable meal tray engineered from 100% reclaimed sugarcane bagasse, fully certified for North American and European food contact.",
  "keyBenefits": [
    {
      "title": "Heavy-Duty Thermal & Grease Resistance",
      "description": "Withstands continuous exposure to boiling water and hot oil up to 120°C; 100% microwaveable and deep-freeze safe down to -20°C without warping."
    },
    {
      "title": "Certified 90-Day Commercial Compostability",
      "description": "Disintegrates into organic nutrient-rich compost within 90 days in industrial facilities, completely free from microplastics and fluorinated chemicals (PFAS-free)."
    },
    {
      "title": "Precision 3-Compartment Portion Control",
      "description": "Engineered deep partition barriers prevent cross-mixing of sauces and hot sides, ideal for airline catering, healthcare food service, and ghost kitchens."
    }
  ],
  "specs": [
    { "label": "Base Material", "value": "100% Unbleached Sugarcane Bagasse & Modified Starch" },
    { "label": "Capacity Volume", "value": "850 ml total (450ml main + 200ml side + 200ml side)" },
    { "label": "External Dimensions", "value": "230 x 185 x 42 mm (9.05 x 7.28 x 1.65 in)" },
    { "label": "Unit Net Weight", "value": "28g ± 1.5g" },
    { "label": "Operating Temperature Range", "value": "-20°C to 120°C (-4°F to 248°F)" },
    { "label": "International Compliance", "value": "US FDA 21 CFR 176.170, BPI ASTM D6400, EN 13432, German LFGB" },
    { "label": "Packaging Specification", "value": "500 units per master carton (50 pcs x 10 sealed polybags)" }
  ],
  "priceTiers": [
    { "minQty": 5000, "maxQty": 19999, "unitPrice": 0.32, "incoterm": "FOB", "badge": "Starter Tier" },
    { "minQty": 20000, "maxQty": 49999, "unitPrice": 0.28, "incoterm": "FOB", "badge": "High Volume" },
    { "minQty": 50000, "isCustomQuote": true, "incoterm": "CIF", "badge": "VIP Full Container" }
  ],
  "storyDescription": [
    "## 1. Regulatory Transition & Global ESG Requirements\nWith stringent single-use plastic bans taking effect across the European Union and North America, enterprise food chains require certified, leak-proof packaging solutions that satisfy EPR standards while keeping per-unit packaging overhead low.",
    "## 2. 200-Ton Hydraulic Precision Thermoforming\nManufactured with precision 200-ton hydraulic compression molds, each tray features ultra-smooth interior food-grade surfaces, reinforced structural ribs, and airtight perimeter flange sealing compatible with standard automated film lidding machines.",
    "## 3. Freight Density & Ocean Logistics Optimization\nAn optimized draft angle allows 1,000 trays to nest into minimal cubic meters, increasing 40ft High-Cube container capacity by 35% compared to expanded polystyrene (EPS) trays and drastically lowering per-unit ocean freight charges."
  ],
  "seo": {
    "metaTitle": "3-Compartment Bagasse Meal Tray 850ml | Wholesale B2B Export",
    "metaDescription": "Direct-from-factory biodegradable 3-compartment sugarcane meal trays. FDA, BPI & EN 13432 certified. Microwave safe, zero PFAS. Request an instant RFQ in 12 hours."
  },
  "mediaChecklist": [
    {
      "slot": "Hero Storefront (Image 1)",
      "guide": "Front 45-degree angle studio photography on pure white background highlighting all 3 compartments",
      "suggestedAlt": "Heavy-duty 3-compartment compostable bagasse meal tray 850ml"
    },
    {
      "slot": "Material & Texture Detail (Image 2)",
      "guide": "Macro close-up capturing fiber density, anti-grease seal, and reinforced corner bevels",
      "suggestedAlt": "Close-up of sugarcane bagasse fiber density and hydraulic molded rim"
    },
    {
      "slot": "Commercial Food Serving (Image 3)",
      "guide": "High-end plating showing warm rice, protein, and vegetable dishes inside distinct compartments",
      "suggestedAlt": "3-compartment compostable food tray holding hot meal portions"
    },
    {
      "slot": "Export Pallet & Master Carton (Image 4)",
      "guide": "Full export carton packaging configuration showing pallet stacking density and shipping marks",
      "suggestedAlt": "500-count export master carton and pallet configuration for bagasse meal trays"
    }
  ]
}
```

---

## 4. THREE-STEP WORKFLOW FOR EDITORS

1. **Step 1 (Generate with AI Agent)**:
   * Open Sanity Studio (`/studio`) -> Select **Products** -> Click **New Product** (or open an existing draft).
   * Click **"Smart Importer (JSON/Text)"** on the action bar.
   * Click **"Download AGENT-GUIDE-PRODUCT.md"** (to attach full specification to your AI model) or click **"Copy AI System Prompt"**.
   * Paste the prompt into ChatGPT, Claude, or Gemini alongside your product specifications.
2. **Step 2 (1-Click Parse & Populate)**:
   * Copy the JSON output from the AI Agent.
   * Paste it into the modal textarea and observe the instant **Live Preview** badge.
   * Click **"Parse & Populate Product"**. All 3 tabs (Overview, Commercial & Sales, Specs & SEO) are populated in milliseconds.
3. **Step 3 (Manual Photo Upload & Publish)**:
   * The modal will present the **Photography Guidance & Alt Text Checklist**.
   * Switch to **Tab 1 (Product Media)**, drag-and-drop your real product photos, and use the prepared Alt texts (1-click copy buttons).
   * Click **Publish** to take the product live on the storefront!
