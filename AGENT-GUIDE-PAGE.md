# 📘 AGENT-GUIDE-PAGE.md: TÀI LIỆU TOÀN DIỆN AUDIT & HƯỚNG DẪN HOẠT ĐỘNG HỆ THỐNG MODULES (DEANFLOW / DEANCORE)

> **Trạng thái review (2026-11-11):** Đây là tài liệu tải xuống cho importer. Cần đối chiếu số lượng module, field, ví dụ JSON và các tuyên bố tính năng với schema/action hiện tại trước khi sử dụng. Phạm vi sản phẩm hiện hành nằm trong `STRATEGY_POSITIONING.md`.

> **DeanFlow Commercial Conversion Engine** — Kiến trúc khối động (Dynamic Block Builder Architecture) xây dựng trên nền tảng **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Sanity CMS v6**, **Cloudflare D1 Edge SQL** và **Zustand v5**.

---

## 📑 MỤC LỤC TỔNG QUAN

1. [Tổng Quan Kiến Trúc Khối Động (Dynamic Block Builder Architecture)](#1-tổng-quan-kiến-trúc-khối-động)
2. [Vòng Đời Xử Lý & Chu Trình Dữ Liệu (Lifecycle & Resolution Pipeline)](#2-vòng-đời-xử-lý--chu-trình-dữ-liệu)
3. [Phân Nhóm & Danh Mục 23 Pure Dynamic Modules](#3-phân-nhóm--danh-mục-23-pure-dynamic-modules)
   - [Nhóm I: Commerce & Conversion (7 Modules)](#nhóm-i-commerce--conversion)
   - [Nhóm II: Story & Layout (9 Modules)](#nhóm-ii-story--layout)
   - [Nhóm III: Trust & Utilities (7 Modules)](#nhóm-iii-trust--utilities)
4. [Audit Chi Tiết Từng Module Trong 23 Pure Dynamic Modules](#4-audit-chi-tiết-từng-module-trong-23-pure-dynamic-modules)
   - [1. `lead-capture-form` (Lead Capture Form / B2B RFQ Ingestion)](#1-lead-capture-form)
   - [2. `tiered-pricing` (Tiered Volume Pricing Matrix)](#2-tiered-pricing)
   - [3. `compliance-vault` (Compliance Vault & Gated Content)](#3-compliance-vault)
   - [4. `countdown-banner` (Urgency & Scarcity Countdown Banner)](#4-countdown-banner)
   - [5. `sticky-mobile-cta` (Sticky Buy Bar & Quick Action)](#5-sticky-mobile-cta)
   - [6. `comparison-table` (Product vs Competitor Comparison Table)](#6-comparison-table)
   - [7. `social-proof` (Verified Reviews & Trust Stat Counters)](#7-social-proof)
   - [8. `hero.split` (Split-Screen Hero Banner)](#8-herosplit)
   - [9. `hero-slider` (Full-Screen Hero Slideshow)](#9-hero-slider)
   - [10. `media-grid` (Showcase & Gallery Media Grid)](#10-media-grid)
   - [11. `carousel-banner-list` (Interactive Banner Carousel)](#11-carousel-banner-list)
   - [12. `card-list` (Feature & Value Proposition Cards)](#12-card-list)
   - [13. `step-list` (Process & Onboarding Steps)](#13-step-list)
   - [14. `prose` (Rich Text Editorial & Embedded Elements)](#14-prose)
   - [15. `callout` (Promo & Warning Callout Box)](#15-callout)
   - [16. `custom-html` (Code, iFrame & App Embed Sandbox)](#16-custom-html)
   - [17. `product-list` (Product Showcase & Live Filter Catalog)](#17-product-list)
   - [18. `quote-list` (Wall of Love Testimonials)](#18-quote-list)
   - [19. `logo-list` (Partner & Client Logo Marquee)](#19-logo-list)
   - [20. `stat-list` (Impact & Production Metrics)](#20-stat-list)
   - [21. `accordion-list` (FAQ Drawer & Knowledge Hub)](#21-accordion-list)
   - [22. `person-list` (Leadership, Advisory & Experts Showcase)](#22-person-list)
   - [23. `blog-post-list` (Insights & Content Hub List)](#23-blog-post-list)
5. [Audit Chi Tiết 7 Specialized Core Page Modules (Cấu Trúc Cốt Lõi)](#5-audit-chi-tiết-7-specialized-core-page-modules)
   - [24. `breadcrumbs` (Điều hướng phân cấp & BreadcrumbList Schema)](#24-breadcrumbs)
   - [25. `product-content` (Cốt lõi Trang Chi tiết Sản phẩm PDP)](#25-product-content)
   - [26. `collection-content` (Cốt lõi Trang Bộ sưu tập Collection)](#26-collection-content)
   - [27. `blog-index` (Cốt lõi Trang Tổng hợp Tin tức & Tạp chí)](#27-blog-index)
   - [28. `blog-post-content` (Cốt lõi Trang Đọc Bài viết Chuyên sâu)](#28-blog-post-content)
   - [29. `cart-checkout` (Cốt lõi Trang Thanh toán & Xuất RFQ B2B)](#29-cart-checkout)
   - [30. `search-module` (Cốt lõi Trang Tìm kiếm Thời gian thực)](#30-search-module)
6. [Audit Chi Tiết 6 Portable Text Embed Blocks (Khối Nhúng Bài Viết)](#6-audit-chi-tiết-6-portable-text-embed-blocks)
   - [31. `callout-box`](#31-callout-box)
   - [32. `cta-banner`](#32-cta-banner)
   - [33. `faq-accordion`](#33-faq-accordion)
   - [34. `image-gallery`](#34-image-gallery)
   - [35. `product-embed`](#35-product-embed)
   - [36. `video-embed` & `affiliateLink`](#36-video-embed--affiliatelink)
7. [Ma Trận Tương Tác & Phối Hợp Giữa Các Modules (Inter-Module Event Bus)](#7-ma-trận-tương-tác--phối-hợp-giữa-các-modules)
8. [Quy Chuẩn Kỹ Thuật Khi Xây Dựng / Mở Rộng Module Mới](#8-quy-chuẩn-kỹ-thuật-khi-xây-dựng--mở-rộng-module-mới)
9. [Bảng Tra Cứu Nhanh Toàn Bộ Modules (Quick Reference Cheat Sheet)](#9-bảng-tra-cứu-nhanh-toàn-bộ-modules)

---

## 1. TỔNG QUAN KIẾN TRÚC KHỐI ĐỘNG

Hệ thống module trong **DeanFlow** được thiết kế theo mô hình **Composable Page Builder**:
- Mọi trang (Landing Pages, PDP, Blog, Collections, Custom Pages) đều là tập hợp các khối độc lập (independent blocks) được lưu trữ dưới dạng mảng JSON trong Sanity CMS (`modules[]`).
- Biên tập viên có thể kéo thả, thêm mới, xóa bỏ, ẩn tạm thời hoặc tùy biến các tham số hiển thị trực tiếp trong Sanity Studio mà **không cần can thiệp vào mã nguồn**.
- Hệ thống hỗ trợ **Global Modules**: Các khối dùng chung có thể được chèn tự động trước (`before`) hoặc sau (`after`) các khối riêng của từng trang dựa trên quy tắc đường dẫn (Path Matching: `*`, `blog/`, `products/`,...).

```
┌────────────────────────────────────────────────────────────────────────┐
│                        SANITY CMS CONTENT LAKE                         │
│  - Document: page, product, collection, blog.post, global-module       │
│  - Array: modules[] (23 pure dynamic modules + custom objects)         │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼ (GROQ Query with Fragments: MODULES_QUERY)
┌────────────────────────────────────────────────────────────────────────┐
│                      NEXT.JS 16 SERVER COMPONENT                       │
│  - Page Entry: app/(frontend)/[[...slug]]/page.tsx                     │
│  - Live Content Fetching & First-Party Marketing Attribution           │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
                                    ▼
┌────────────────────────────────────────────────────────────────────────┐
│                      MODULES RESOLVER (modules/index.tsx)              │
│  - Lọc bỏ module ẩn: !module.hidden && !module.attributes?.hidden      │
│  - Ánh xạ _type -> MODULES_MAP                                         │
│  - Bọc hiệu ứng cuộn: ScrollRevealWrapper (fade-up, blur-reveal, ...)  │
│  - Bơm thuộc tính Click-to-Edit Visual Presentation (data-sanity)      │
└───────────────────┬────────────────────────────────┬───────────────────┘
                    │                                │
                    ▼                                ▼
       Server Components (RSC)           Interactive Client Components
  (hero.split, prose, callout, ...)      ('use client' with Zustand Store)
```

---

## 2. VÒNG ĐỜI XỬ LÝ & CHU TRÌNH DỮ LIỆU

Mỗi module trải qua chu trình 5 giai đoạn từ khi cấu hình đến khi người dùng tương tác:

1. **Khởi tạo & Cấu hình (Sanity Studio)**:
   - Schema được định nghĩa tại `src/sanity/schemaTypes/modules/<name>.ts`.
   - Sử dụng tiện ích `defineModulePreview()` từ `src/sanity/lib/define-module-preview.ts` kết hợp với `MODULE_FRIENDLY_NAMES` trong `src/sanity/lib/module-preview-config.ts` để hiển thị tên thân thiện, icon và thumbnail SVG trong Studio Insert Menu.
   - Trường dùng chung `module-attributes` cung cấp HTML Anchor ID (`uid`) và nút gạt ẩn/hiện (`hidden`).

2. **Truy vấn & Bóc tách Dữ liệu (GROQ Resolution)**:
   - Fragment `MODULES_QUERY` tại `src/sanity/lib/queries.ts` mở rộng dữ liệu tham chiếu (Asset references, internal links, categories, reviews, authors, price tiers).
   - Ghép nối dữ liệu: `Global Modules (before)` + `Page Modules` + `Global Modules (after)`.

3. **Phân giải & Điều phối (ModulesResolver)**:
   - File điều phối: `src/ui/modules/index.tsx`.
   - Kiểm tra `hidden` từ document hoặc attributes.
   - Gắn `data-sanity` phục vụ chế độ Sanity Visual Presentation (Live Click-to-Edit).
   - Kiểm tra `page.appearance.scrollReveal` để áp dụng hoạt cảnh cuộn mượt (`ScrollRevealWrapper`).

4. **Kết xuất Giao diện (Render Phase)**:
   - Áp dụng triết lý phân tách Server/Client: Giao diện tĩnh bọc ngoài được render phía Server (RSC), các logic tương tác phức tạp (Form, Carousel, Modal, Cart Store) được tách thành file `*-client.tsx` đánh dấu `'use client'`.
   - Sử dụng hàm `stegaClean()` trên tất cả các biến logic/theme/layout để loại bỏ chuỗi vô hình của Sanity Live Stega, chống gãy style CSS.

5. **Tương tác Phản hồi (Client Event Bus & Edge Data Sync)**:
   - Các module tương tác với nhau qua Custom Event Bus (`window.dispatchEvent` / `addEventListener`) và Global Zustand Store (`useCartStore`).
   - Dữ liệu chuyển đổi (Leads, Orders, Reviews) được gửi trực tiếp qua Route Handlers (`/api/leads`, `/api/orders`, `/api/reviews`) tới **Cloudflare D1 SQL** với độ trễ dưới 10ms.

---

## 3. PHÂN NHÓM & DANH MỤC 23 PURE DYNAMIC MODULES

Được phân bổ trong menu thêm khối (Insert Menu) của Sanity Studio thành 3 nhóm chiến lược:

| Nhóm Chiến Lược | Số Lượng | Danh Sách Modules (`_type`) | Trọng Tâm Nghiệp Vụ |
|---|---|---|---|
| **I. Commerce & Conversion** | 7 Modules | `product-list`, `tiered-pricing`, `compliance-vault`, `countdown-banner`, `sticky-mobile-cta`, `lead-capture-form`, `social-proof` | Thúc đẩy doanh thu trực tiếp, chốt đơn tức thì, thu thập thông tin khách hàng tiềm năng B2B & giải tỏa rào cản thanh toán |
| **II. Story & Layout** | 9 Modules | `hero.split`, `hero-slider`, `media-grid`, `carousel-banner-list`, `card-list`, `step-list`, `prose`, `callout`, `comparison-table` | Kể câu chuyện thương hiệu, định vị giá trị sản phẩm, dẫn dắt tâm lý người mua qua các bố cục đa phương tiện |
| **III. Trust & Utilities** | 7 Modules | `quote-list`, `logo-list`, `stat-list`, `accordion-list`, `person-list`, `blog-post-list`, `custom-html` | Xây dựng niềm tin vững chắc (E-E-A-T), minh chứng năng lực thực tế, giải đáp thắc mắc và tích hợp ứng dụng mở rộng |

---

## 4. AUDIT CHI TIẾT TỪNG MODULE TRONG 23 PURE DYNAMIC MODULES

---

### 1. `lead-capture-form`
- **Friendly Name trong Studio**: `Lead Capture Form`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/lead-capture-form.ts`
  - Server Wrapper: `src/ui/modules/lead-capture-form/index.tsx`
  - Client Logic: `src/ui/modules/lead-capture-form/lead-capture-form-client.tsx`
- **Định vị phễu**: B2B Wholesale & RFQ, High-Ticket Consultation.
- **Mục đích nghiệp vụ**: Thu thập thông tin khách hàng doanh nghiệp, nhu cầu báo giá xuất khẩu sỉ hoặc lịch tư vấn 1-1 với đội ngũ chuyên gia.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `badge`, `headline`, `subtitle`: Tiêu đề và thông điệp kêu gọi hành động.
- `benefits`: Danh sách 3–5 điểm cộng cam kết (VD: Báo giá trong 24h, bảo mật thông tin NDA).
- `fieldOptions`: Bật/tắt linh hoạt các trường nhập liệu (`showName`, `showEmail`, `showPhone`, `showCompany`, `showCountry`, `showBudget`, `showMessage`, `showConsent`) kèm cờ bắt buộc (`*Required`).
- `layout`: 3 phong cách hiển thị:
  - `split`: 2 cột (Cột trái nêu lợi ích/cam kết, cột phải form nhập liệu).
  - `card`: Khối thẻ card đóng khung nổi bật ở giữa trang.
  - `centered`: Căn giữa tinh gọn tối đa hóa tập trung.
- `bgStyle`: `white` | `slate` | `gradient` | `dark`.
- `successBehavior`: `message` (hiện thông báo cảm ơn tại chỗ) hoặc `redirect` (chuyển hướng sang trang cảm ơn hoặc lịch Calendly).

#### Sơ Đồ & Luồng Hoạt Động (Workflow)
```
[User điền form] 
       │
       ▼
[Tự động thu thập bối cảnh]
├── Đọc Cookie tiếp thị 90 ngày: 'deanflow_attr' (utm_source, medium, campaign, click_id)
├── Đọc Session Journey: 8 trang xem gần nhất từ sessionStorage qua 'journey-tracker.ts'
└── Bắt sự kiện 'tiered-pricing:select' (nếu user đã chọn nấc giá sỉ trước đó)
       │
       ▼
[POST /api/leads]
       │
       ├── 1. Xác thực dữ liệu & lọc Honeypot chống bot tự động
       ├── 2. Bóc tách Cloudflare Headers (cf-ipcountry, cf-ipcity)
       ├── 3. Chạy thuật toán AI Lead Scoring (0–100 điểm, phân tầng Hot/Warm/Cold)
       ├── 4. Tự động sinh bản thảo tiếp cận (Pitch Draft) & tóm tắt nhu cầu
       ├── 5. Ghi dữ liệu vào bảng 'leads' của Cloudflare D1
       ├── 6. Gửi cảnh báo tức thì qua Telegram Bot & Webhooks
       └── 7. Bắn sự kiện thời gian thực Server-Sent Events (SSE) tới Admin Workspace (/admin)
```

---

### 2. `tiered-pricing`
- **Friendly Name trong Studio**: `Tiered Volume Pricing`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/tiered-pricing.ts`
  - UI Component: `src/ui/modules/tiered-pricing/index.tsx`
- **Định vị phễu**: B2B Wholesale & RFQ, High-Ticket Volume Purchasing.
- **Mục đích nghiệp vụ**: Minh bạch hóa ma trận giá bán sỉ theo cấp bậc số lượng (Economies of Scale), tích hợp chuẩn điều kiện thương mại quốc tế Incoterms 2020 (FOB, CIF, EXW, DDP).

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `tiers[]`: Mảng danh sách các nấc giá:
  - `minQty`, `maxQty`: Khoảng số lượng áp dụng.
  - `unitPrice`: Đơn giá trên mỗi đơn vị.
  - `discountPercent`: Tỷ lệ chiết khấu tiết kiệm so với giá lẻ.
  - `incoterm`: Điều kiện giao nhận ngoại thương (FOB, CIF, EXW,...).
  - `badge`: Huy hiệu nổi bật (VD: "Most Popular", "Best Export Value").
  - `isCustomQuote`: Nấc số lượng cực lớn yêu cầu liên hệ trực tiếp.
- `actionType`:
  - `rfq`: Bấm chọn nấc giá sẽ cuộn mượt xuống form báo giá `#lead-form`.
  - `cart`: Bấm chọn sẽ thêm trực tiếp khối lượng vào giỏ hàng `useCartStore`.
- `enableCurrencySelector`: Bật bộ chuyển đổi tỷ giá thời gian thực (USD, EUR, GBP, CAD, AUD) lưu vào `localStorage`.
- `showCalculator`: Bật máy tính tính toán tổng chi phí và số tiền tiết kiệm được theo số lượng tùy biến.

#### Sơ Đồ & Luồng Hoạt Động (Workflow)
```
[User kéo thanh trượt / gõ số lượng trong Calculator]
       │
       ▼
[Thuật toán định vị Tier: findTierForQty()]
├── Tự động so khớp nấc giá tối ưu nhất
├── Tính toán Batch Investment = Qty × ConvertedUnitPrice
└── Tính toán Tổng tiết kiệm so với Tier 1 cơ bản
       │
       ▼
[User nhấn CTA Action]
├── Nếu actionType == 'cart':
│   └── Thêm item vào useCartStore -> Phát event 'cart:open' mở Cart Drawer
└── Nếu actionType == 'rfq':
    └── Dispatch Custom Event 'tiered-pricing:select' chứa chi tiết nấc giá 
        -> Tự động điền spec vào 'lead-capture-form' và cuộn mượt xuống form
```

---

### 3. `compliance-vault`
- **Friendly Name trong Studio**: `Compliance Vault`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/compliance-vault.ts`
  - UI Component: `src/ui/modules/compliance-vault/index.tsx`
- **Định vị phễu**: B2B Export Sourcing, High-Ticket Enterprise Trust.
- **Mục đích nghiệp vụ**: Số hóa hồ sơ năng lực nhà máy, chứng chỉ quốc tế (FDA, ISO 9001, BSCI, CE) và tài liệu kỹ thuật (TDS, MSDS) theo mô hình **Gated Content** nhằm thu thập thông tin người phụ trách mua hàng.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `certificates[]`: Danh sách chứng chỉ kèm tổ chức cấp, mã chứng chỉ và logo kiểm định.
- `gatedDocuments[]`: Danh sách tài liệu kỹ thuật (TDS, MSDS, Báo cáo kiểm nghiệm, Catalogue giá 2026).
- `factoryMetrics[]`: Các con số ấn tượng về nhà xưởng (VD: Công suất 500.000 sp/ngày, diện tích 25.000m² chuẩn ISO Class 8).
- `vaultTheme`: `dark` (Giao diện bảo mật ngân hàng cao cấp) hoặc `light`.

#### Sơ Đồ & Luồng Hoạt Động (Workflow)
```
[User bấm "Download Technical Dossier" trên 1 tài liệu]
       │
       ├── Đã xác thực trước đó trong Session? (unlockedEmail tồn tại)
       │    └── YES ──> Tự động tải file PDF về máy ngay lập tức
       │
       └── NO (Chưa cấp quyền)
            │
            ▼
       [Hiện Modal Xác Thực Doanh Nghiệp]
       ├── Yêu cầu nhập Work Email, Họ tên, Tên công ty
       ├── Kiểm tra chống Spam Bot (Honeypot field)
       └── Bấm "Unlock & Download"
            │
            ▼
       [Đồng thời thực hiện 3 tác vụ song song]
       ├── 1. Gửi Lead vào bảng 'leads' D1 với source 'compliance_vault_gated'
       ├── 2. Kích hoạt Resend API gửi email đính kèm link tài liệu chính thức
       └── 3. Lưu email vào sessionStorage ('deanflow_compliance_unlocked_email')
            │
            ▼
       [Mở khóa toàn bộ kho tài liệu cho phiên làm việc hiện tại]
```

---

### 4. `countdown-banner`
- **Friendly Name trong Studio**: `Countdown Banner`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/countdown-banner.ts`
  - Server Wrapper: `src/ui/modules/countdown-banner/index.tsx`
  - Client Logic: `src/ui/modules/countdown-banner/countdown-banner-client.tsx`
- **Định vị phễu**: D2C Flash Sale, Promo Launch Campaign.
- **Mục đích nghiệp vụ**: Tạo độ khẩn cấp (Urgency) và tính khan hiếm thời gian thực (Scarcity) nhằm thúc đẩy quyết định mua sắm ngay lập tức.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `countdownType`:
  - `fixed`: Đếm ngược tới một mốc thời gian cố định toàn cầu (`targetDate` chuẩn ISO).
  - `evergreen`: Đồng hồ đếm ngược cá nhân hóa cho từng khách truy cập (lưu mốc hết hạn vào `localStorage`, tính theo số giờ `fallbackHours`, ví dụ: 48 tiếng).
- `showProgressBar`, `stockRemaining`, `stockTotal`: Thanh đo số lượng tồn kho còn lại thực tế.
- `themeStyle`: `urgent` (đỏ cam), `brand` (màu nhận diện), `dark` (đen sang trọng), `light`, `accent`.
- `layout`: `card` (thẻ hộp nổi bật), `split` (2 cột), `strip` (dải băng ngang toàn màn hình).
- `expiredAction`: Xử lý khi đồng hồ về 0:
  - `show_message`: Ẩn đồng hồ và hiển thị thông điệp đã kết thúc ưu đãi.
  - `hide`: Tự động ẩn hoàn toàn module khỏi trang.
  - `evergreen_fallback`: Tự động reset lại chu kỳ đếm ngược mới.

#### Sơ Đồ & Luồng Hoạt Động (Workflow)
```
[Module Mount trên Client]
       │
       ▼
[Kiểm tra countdownType]
├── 'fixed' ────> Tính khoảng cách: TargetDate - Date.now()
└── 'evergreen' ─> Đọc localStorage('countdown_end_<moduleKey>')
                   ├── Chưa có ─> Lưu Date.now() + fallbackHours * 3600000
                   └── Đã có  ─> Đọc mốc hết hạn của khách
       │
       ▼
[Interval 1000ms tính toán: days, hours, minutes, seconds]
       │
       ├── Còn thời gian: Hiển thị đồng hồ số động + Cập nhật thanh stock bar
       └── Hết thời gian: Kích hoạt expiredAction (show_message / hide / reset)
```

---

### 5. `sticky-mobile-cta`
- **Friendly Name trong Studio**: `Sticky Buy Bar`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/sticky-mobile-cta.ts`
  - Server Wrapper: `src/ui/modules/sticky-mobile-cta/index.tsx`
  - Client Logic: `src/ui/modules/sticky-mobile-cta/sticky-mobile-cta-client.tsx`
- **Định vị phễu**: D2C Mobile Funnel, Hero 1-Page Funnel.
- **Mục đích nghiệp vụ**: Duy trì nút bấm mua hàng / gửi yêu cầu luôn trong tầm tay khi người dùng cuộn xem nội dung dài trên thiết bị di động, triệt tiêu ma sát cuộn ngược lên đầu trang.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `title`, `price`, `originalPrice`, `badge`: Tên gói, giá khuyến mãi và nhãn giảm giá.
- `actionType`:
  - `anchor`: Cuộn mượt đến phần tử mục tiêu (mặc định `#lead-form` hoặc `#product-form`).
  - `direct_cart`: Bỏ trực tiếp sản phẩm vào giỏ hàng và mở Cart Drawer.
  - `link`: Điều hướng đến URL trang ngoài.
- `secondaryButtonType`: Nút liên hệ phụ trợ (`whatsapp`, `phone`, `link`, `none`).
- `triggerMode`: Điều kiện hiển thị thanh ghim:
  - `scroll`: Chỉ hiện khi cuộn qua ngưỡng pixel (`scrollThreshold`, mặc định 250px).
  - `target_element`: Sử dụng `IntersectionObserver` theo dõi khi form chính trượt ra khỏi màn hình.
  - `always`: Luôn ghim cố định.
- `autoHideOnTarget`: Tự động ẩn thanh ghim khi người dùng đã cuộn tới đúng khu vực form đặt hàng chính để tránh trùng lặp 2 nút mua trên màn hình.
- `syncWithProduct`: Tự động đồng bộ hình ảnh, giá và tên biến thể khi người dùng chọn phân loại trên trang PDP.

#### Sơ Đồ & Luồng Hoạt Động (Workflow)
```
[User cuộn trang trên điện thoại di động]
       │
       ├── Window Scroll > scrollThreshold 
       │    └── Thanh Sticky trượt lên từ đáy màn hình (slide-up)
       │
       ├── User đổi màu sắc / phân loại trên trang PDP
       │    └── Bắt Event 'product:variant-change' 
       │        └── Đồng bộ giá mới, ảnh mới và tiêu đề biến thể tức thì
       │
       ├── Khối form chính (#lead-form) cuộn vào tầm nhìn (In Viewport)
       │    └── 'autoHideOnTarget' kích hoạt: Thanh Sticky tạm thời ẩn đi
       │
       └── User nhấn "Order Now"
            ├── Nếu actionType == 'anchor' ─> Cuộn mượt đến form chốt đơn
            └── Nếu actionType == 'direct_cart' ─> Thêm vào useCartStore & Mở giỏ
```

---

### 6. `comparison-table`
- **Friendly Name trong Studio**: `Comparison Table`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/comparison-table.ts`
  - UI Component: `src/ui/modules/comparison-table.tsx`
- **Định vị phễu**: D2C Hero Product, High-Ticket Differentiation.
- **Mục đích nghiệp vụ**: Định hình nhận thức người mua về sự vượt trội của sản phẩm chủ lực so với các giải pháp thông thường hoặc hàng trôi nổi ngoài thị trường.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `headers[]`: Tiêu đề các cột so sánh (Cột 1: Tính năng / Tiêu chí, Cột 2: Sản phẩm của chúng tôi, Cột 3+: Đối thủ / Thị trường).
- `rows[].cells[]`: Dữ liệu từng ô. Hệ thống tích hợp **bộ phân tích cú pháp thông minh (Smart Cell Parser)**:
  - Nhận diện ký tự `✅`, `✓`, `yes`, `true` -> Tự động render huy hiệu Check xanh.
  - Nhận diện ký tự `❌`, `✕`, `no`, `false` -> Tự động render huy hiệu Cross đỏ/xám.
  - Nhận diện ký tự `⚠️`, `limited`, `partial` -> Tự động render huy hiệu Warning vàng.
- `highlightedColumnIndex`: Cột ưu tiên làm nổi bật (mặc định cột của sản phẩm mình: viền đậm, đổ bóng, màu nền tương phản cao).
- `mobileLayout`: Xử lý giao diện trên màn hình nhỏ:
  - `sticky-column`: Cố định cột tiêu chí bên trái, vuốt ngang các cột đối thủ.
  - `cards`: Chuyển đổi bảng thành các thẻ so sánh độc lập dạng danh sách.
  - `scroll`: Cho phép thanh cuộn ngang mượt mà.

---

### 7. `social-proof`
- **Friendly Name trong Studio**: `Verified Reviews`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/social-proof.ts`
  - Server Wrapper: `src/ui/modules/social-proof/index.tsx`
  - Client Logic: `src/ui/modules/social-proof/social-proof-client.tsx` & `social-proof-card.tsx`
- **Định vị phễu**: Cả 3 mô hình (D2C, High-Ticket, B2B).
- **Mục đích nghiệp vụ**: Củng cố niềm tin tuyệt đối thông qua các số liệu thống kê quy mô lớn kết hợp lời nhận xét có xác thực của khách hàng toàn cầu kèm video UGC thực tế.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `trustStats[]`: 2–4 con số bảo chứng uy tín (VD: 4.9/5 điểm đánh giá, 10,000+ đơn hàng đã giao, 99.4% độ hài lòng).
- `reviews[]`: Danh sách đánh giá chi tiết:
  - `authorName`, `authorRole`, `authorCompany`, `authorCountry`: Thông tin minh bạch.
  - `rating`: Số sao (1–5).
  - `title`, `quote`: Tiêu đề & nội dung nhận xét.
  - `verifiedBuyer`: Huy hiệu xác nhận đơn mua thực tế ("Verified Purchase").
  - `videoUrl`, `videoThumbnail`: Cho phép phát video trải nghiệm người dùng thực tế qua Popup Lightbox.
  - `helpfulCount`: Bộ đếm số người thấy đánh giá này hữu ích (tương tác trực tiếp trên client).
- `layout`: `grid` (dạng lưới đa cột) hoặc `carousel` (băng chuyền vuốt cảm ứng đa điểm Swiper).

---

### 8. `hero.split`
- **Friendly Name trong Studio**: `Hero Split`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/hero.split.ts`
  - UI Component: `src/ui/modules/hero.split.tsx`
- **Định vị phễu**: Landing Page Header, Product Introduction.
- **Mục đích nghiệp vụ**: Tạo ấn tượng đầu tiên mạnh mẽ ngay khi tải trang (Above the Fold) với tỷ lệ phân chia màn hình tối ưu, kết hợp giữa thông điệp chuyển đổi và hình ảnh/video chất lượng cao.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `content`: Nội dung biên tập phong phú (Badge, Tiêu đề chính H1/H2, Đoạn mở đầu, Cam kết bảo đảm).
- `ctas[]`: Bộ đôi nút hành động Dual-CTA (Primary CTA nổi bật + Secondary Ghost/Video CTA).
- `image`: Hình ảnh chất lượng cao kèm `mobileImage` tối ưu hóa riêng cho di động:
  - `loadingStrategy`: `eager` (tải ưu tiên đảm bảo điểm LCP Core Web Vitals < 1.2s) hoặc `lazy`.
  - `mediaAspectRatio`: `auto` | `4/3` | `16/9` | `1/1` | `4/5`.
- `desktopLayout`: Đặt media bên phải (`mediaRight`) hoặc bên trái (`mediaLeft`).
- `mobileLayout`: Văn bản lên trước (`textFirst`) hoặc ảnh lên trước (`mediaFirst`).
- `splitRatio`: Tỷ lệ chia cột: `50-50`, `60-40`, hoặc `40-60`.

---

### 9. `hero-slider`
- **Friendly Name trong Studio**: `Hero Slider`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/hero-slider.ts`
  - Server Wrapper: `src/ui/modules/hero-slider/index.tsx`
  - Client Logic: `src/ui/modules/hero-slider/hero-slider-client.tsx`
- **Định vị phễu**: Trang chủ thương hiệu (Brand Homepage), Chiến dịch mùa vụ (Seasonal Collection).
- **Mục đích nghiệp vụ**: Trình diễn các bộ sưu tập trọng điểm hoặc các chương trình ưu đãi lớn nối tiếp nhau qua slider toàn màn hình.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `slides[]`: Danh sách các slide:
  - `image` & `mobileImage`: Bộ đôi ảnh riêng biệt cho Desktop & Mobile.
  - `eyebrow`, `title`, `description`: Tiêu đề và nội dung ngắn gọn.
  - `ctas[]`: Nút bấm điều hướng chuyên biệt cho từng slide.
  - `textPosition`: Đặt nội dung ở giữa (`center`) hoặc góc dưới (`bottom`).
  - `overlay`: Lớp phủ làm dịu ảnh (`gradient`, `dark`, `deep-dark`, `none`) để tăng độ tương phản chữ.
- `fullWidth`: Tràn viền 100% màn hình hoặc đóng khung trong container an toàn.
- `height`: Chiều cao: `dvh-80` (80% màn hình), `dvh-100` (toàn màn hình), hoặc `ratio`.
- `autoSlide`, `interval`: Tự động chuyển slide sau chu kỳ X giây (tự tạm dừng khi di chuột).

---

### 10. `media-grid`
- **Friendly Name trong Studio**: `Media Gallery Grid`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/media-grid.ts`
  - UI Component: `src/ui/modules/media-grid/index.tsx`
- **Định vị phễu**: High-Ticket Showcase, Factory & Facility Tours.
- **Mục đích nghiệp vụ**: Trực quan hóa quy trình sản xuất, công nghệ đóng gói, kiểm thử sản phẩm hoặc thư viện ảnh chụp thực tế từ các góc nhìn khác nhau.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `layout`:
  - Lưới đồng đều: `2-cols`, `3-cols`, `4-cols`.
  - Bento Grid hiện đại: `bento-1-2` (1 ảnh lớn nổi bật bên trái, 2 ảnh nhỏ bên phải) hoặc `bento-2-1`.
- `mobileLayout`:
  - `peek-scroll`: Dạng trượt ngang lộ một phần ảnh tiếp theo gợi ý vuốt ngón tay.
  - `grid-2`: Lưới 2 cột tiết kiệm không gian.
  - `stacked`: Xếp chồng từng ảnh theo chiều dọc.
- `items[].cardStyle`: `overlay` (văn bản nổi trên ảnh kèm gradient), `below` (văn bản ở dưới ảnh), hoặc `visual-only` (chỉ hiển thị ảnh tinh khiết).

---

### 11. `carousel-banner-list`
- **Friendly Name trong Studio**: `Banner Carousel`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/carousel-banner-list.ts`
  - Server Wrapper: `src/ui/modules/carousel-banner-list.tsx`
  - Client Logic: `src/ui/modules/carousel-banner-list-client.tsx`
- **Định vị phễu**: Mid-Page Banners, Promotional Interstitial.
- **Mục đích nghiệp vụ**: Băng chuyền trình chiếu các banner quảng cáo khuyến mãi, banner đối tác hoặc chiến dịch flash sale giữa trang.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `items[]`: Danh sách banner với ảnh Desktop và Mobile, liên kết nội bộ (`internalSlug`) hoặc liên kết ngoài (`external`).
- `options`: Tùy biến tự động cuộn, tốc độ trượt và nút điều hướng prev/next.
- `backgroundColor`, `textColor`: Màu nền và màu chữ tùy biến cho vùng chứa.

---

### 12. `card-list`
- **Friendly Name trong Studio**: `Feature Cards`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/card-list.ts`
  - Server Wrapper: `src/ui/modules/card-list.tsx`
  - Client Carousel: `src/ui/modules/card-list-carousel.tsx`
- **Định vị phễu**: Cả 3 mô hình (D2C, High-Ticket, B2B).
- **Mục đích nghiệp vụ**: Trình bày danh sách tính năng, giá trị cốt lõi (USPs), hoặc lợi ích dịch vụ dưới dạng các thẻ card trực quan, bắt mắt.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `cards[]`:
  - `icon`: Biểu tượng tùy biến (File ảnh SVG tải lên từ CMS hoặc chọn nhanh từ danh mục 25+ vector preset Lucide icons: `shield`, `zap`, `leaf`, `truck`, `globe`, `award`,...).
  - `content`: Tiêu đề và mô tả được định dạng qua PortableText.
  - `image`: Hình ảnh minh họa cho thẻ.
  - `ctas[]`: Nút hành động riêng cho từng thẻ.
- `desktopLayout`: Hiển thị dạng lưới (`grid`) hoặc băng chuyền (`carousel`).
- Hiệu ứng tương tác: Card hover elevation (nổi bóng khi lướt chuột), bo góc hiện đại.

---

### 13. `step-list`
- **Friendly Name trong Studio**: `Process Steps`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/step-list.ts`
  - Server Wrapper: `src/ui/modules/step-list.tsx`
  - Client Timeline: `src/ui/modules/step-list-client.tsx`
- **Định vị phễu**: B2B Sourcing Process, Custom Order Onboarding.
- **Mục đích nghiệp vụ**: Minh bạch hóa quy trình làm việc 3–5 bước (VD: Gửi yêu cầu -> Nhận mẫu thử -> Ký hợp đồng xuất khẩu -> Sản xuất & Giao hàng). Tự động sinh dữ liệu cấu trúc SEO Google `HowTo`.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `steps[]`: Danh sách các bước:
  - `title`, `content`: Tên bước và chi tiết hướng dẫn.
  - `image` / `videoThumbnail`: Ảnh minh họa hoặc video ngắn hướng dẫn thao tác.
  - `link` / `ctas`: Liên kết hành động riêng cho bước đó.
- `layout`: `split` (tiêu đề bên trái, các bước bên phải), `horizontal` (tiến trình ngang), `grid` (lưới thẻ), hoặc `vertical` (dòng thời gian dọc có đường kẻ kết nối).
- `enableSchema`: Tự động trích xuất nội dung thành JSON-LD Schema.org `HowTo` để hiển thị rich snippet từng bước trên kết quả tìm kiếm Google.

---

### 14. `prose`
- **Friendly Name trong Studio**: `Editorial Story`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/prose.ts`
  - UI Component: `src/ui/modules/prose/index.tsx`
- **Định vị phễu**: Brand Storytelling, Deep Technical Specs, Editorial Articles.
- **Mục đích nghiệp vụ**: Xây dựng các khối nội dung dạng văn bản biên tập tạp chí phong phú (Rich Text) kết hợp mục lục tự động (TOC), định dạng mã nguồn (Code syntax highlighting) và nhúng khối tương tác.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `content`: Mảng PortableText đa dạng hỗ trợ tiêu đề có liên kết neo (Anchored Headings), danh sách, khối trích dẫn, bảng và các khối nhúng tùy biến.
- `tableOfContents`: Tự động quét các thẻ `<h2>`, `<h3>` để tạo mục lục neo ở bên trái (`left`) hoặc bên phải (`right`) bám dính khi cuộn (Sticky TOC).
- `showReadingTime`: Hiển thị ước tính thời gian đọc bài dựa trên độ dài từ vựng (tính theo công thức 200 từ/phút).
- `enableDropCap`: Bật hiệu ứng chữ hoa đầu dòng phong cách báo chí truyền thống.
- `containerWidth`: Chiều rộng vùng đọc chuẩn mực: `narrow` (672px), `standard` (768px), `wide` (896px), hoặc `full`.

---

### 15. `callout`
- **Friendly Name trong Studio**: `Promo Callout`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/callout.ts`
  - UI Component: `src/ui/modules/callout.tsx`
- **Định vị phễu**: Mid-Page Conversion Interruption, Crucial Alerts.
- **Mục đích nghiệp vụ**: Tạo điểm ngắt thị giác nổi bật giữa bài để thu hút sự chú ý vào một ưu đãi chớp nhoáng, thông báo quan trọng hoặc cam kết độc quyền.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `theme`: 5 bảng màu chuẩn tương phản WCAG 2.2 AA:
  - `brand`: Nhận diện thương hiệu chính.
  - `urgent`: Cảnh báo khẩn cấp / Hạn chót khuyến mãi (nền vàng cam / hổ phách).
  - `success`: Thông báo bảo đảm / Miễn phí vận chuyển (nền xanh lá).
  - `neutral`: Phong cách tối giản xám đá.
  - `dark`: Nền đen huyền bí sang trọng.
- `borderAccent`: Điểm nhấn viền: `left` (viền dày mép trái), `top` (viền dày mép trên), hoặc `full` (viền toàn khung).
- `iconBox`: Biểu tượng vector nhấn mạnh (`info`, `tag`, `announcement`, `sparkle`, `shield`, `check`, `alert`).

---

### 16. `custom-html`
- **Friendly Name trong Studio**: `Code & App Embed`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/custom-html.ts`
  - UI Component: `src/ui/modules/custom-html/index.tsx`
- **Định vị phễu**: Mở rộng ứng dụng bên thứ ba (Third-Party Integrations).
- **Mục đích nghiệp vụ**: Nhúng an toàn các đoạn mã HTML, CSS tùy biến, ứng dụng bên ngoài như lịch hẹn Calendly, máy tính báo giá tùy chỉnh, form Typeform, bản đồ Google Maps hoặc video nhúng đặc thù.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `html.code`: Mã HTML / Widget nhúng.
- `css.code`: Mã CSS tùy biến. **Hệ thống tự động scoped CSS vào ID duy nhất của module** (`#module-${_key}` hoặc `#${uid}`) để không làm vỡ giao diện chung của trang.
- `sandboxMode`: Kích hoạt chế độ iFrame cách ly bảo mật (Sandboxed Frame) với các chính sách:
  - `standard`: `allow-scripts allow-forms allow-same-origin`.
  - `strict`: Không cho phép chạy script xâm lấn.
  - `permissive`: Mở rộng cho các widget phức tạp.
- `responsiveIframe`: Tự động tối ưu tỷ lệ khung hình iFrame theo chuẩn `16/9`, `4/3`, hoặc `1/1` chống tràn màn hình điện thoại di động.

---

### 17. `product-list`
- **Friendly Name trong Studio**: `Product Showcase`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/product-list.ts`
  - Server Wrapper: `src/ui/modules/product/product-list.tsx`
  - Client Logic: `src/ui/modules/product/product-list-client.tsx`
- **Định vị phễu**: Product Discovery, Cross-Sell, Collection Filtering.
- **Mục đích nghiệp vụ**: Trình diễn danh mục sản phẩm có lọc theo danh mục con (Category Facets), sắp xếp theo giá/ngày xuất bản, hỗ trợ xem nhanh (Quick View Modal) và mở form báo giá RFQ tại chỗ (In-Page RFQ Modal).

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `collection`: Tham chiếu tới bộ sưu tập cụ thể trong Sanity.
- `limit`, `itemsPerPage`: Số lượng sản phẩm hiển thị và phân trang.
- `layout`: `grid` (lưới đa cột) hoặc `carousel` (trượt ngang Swiper).
- `columnsDesktop` (2, 3, 4) & `columnsMobile` (1, 2).
- `enableFilter`: Bật thanh tab lọc danh mục con động với số lượng sản phẩm thực tế (`count`).
- `enableSort`: Bật dropdown sắp xếp (Giá tăng/giảm, Mới nhất, Phổ biến).
- Tích hợp tính năng mua hàng:
  - Nút thêm nhanh vào giỏ (`useCartStore`).
  - Nút Xem nhanh (Quick View) hiển thị bảng biến thể và ảnh sản phẩm mà không cần rời trang.
  - Nút Request RFQ mở modal hỏi giá sỉ cho sản phẩm cụ thể.

---

### 18. `quote-list`
- **Friendly Name trong Studio**: `Wall of Love (Testimonials)`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/quote-list.ts`
  - Server Wrapper: `src/ui/modules/quote-list.tsx`
  - Client Logic: `src/ui/modules/quote-list-client.tsx` & `quote-card.tsx`
- **Định vị phễu**: B2B Trust, High-Ticket Authority.
- **Mục đích nghiệp vụ**: Tổng hợp lời khen ngợi từ các đối tác thương mại quốc tế, khách hàng doanh nghiệp hoặc người tiêu dùng VIP.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `testimonials[]`: Danh sách lời chứng thực (kết nối trực tiếp document `quote` hoặc tạo inline):
  - `author`: Tên, chức vụ, công ty, ảnh chân dung avatar.
  - `quote`: Nội dung đánh giá.
  - `rating`: Số sao.
  - `mediaLogo`: Logo đơn vị truyền thông hoặc doanh nghiệp của người phát biểu (VD: Forbes, TechCrunch, chuỗi bán lẻ).
  - `videoThumbnail` & `videoUrl`: Hỗ trợ lời chứng thực bằng video phỏng vấn khách hàng thực tế.
- `showTrustScore`: Khối huy hiệu xếp hạng tổng thể (VD: "4.9/5.0 từ 2,500+ khách hàng") kèm liên kết tới nền tảng đánh giá độc lập (Trustpilot, Google Reviews, Clutch).
- `layout`: `masonry` (so le tự nhiên như Pinterest), `grid`, `carousel`, hoặc `marquee` (chạy cuộn vô tận).

---

### 19. `logo-list`
- **Friendly Name trong Studio**: `Logo Marquee`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/logo-list.ts`
  - Server Wrapper: `src/ui/modules/logo-list.tsx`
  - Client Logic: `src/ui/modules/logo-list-client.tsx`
- **Định vị phễu**: Brand Credibility, Export Partner Validation.
- **Mục đích nghiệp vụ**: Băng chuyền chuyển động liên tục hiển thị logo của các khách hàng lớn, các tổ chức chứng nhận quốc tế (FDA, ISO, SGS, BSCI) hoặc đối tác vận chuyển toàn cầu.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `logos[]`: Danh sách các logo thương hiệu (tham chiếu document `logo`).
- `autoScroll`: Kích hoạt cuộn liên tục (CSS Infinite Marquee) với cơ chế nhân đôi mảng logo mượt mà không bị giật khung hình.
- `speed`: `slow` (chậm rãi, uy tín), `medium`, hoặc `fast`.
- `direction`: Cuộn từ phải sang trái (`left`) hoặc ngược lại (`right`).
- `pauseOnHover`: Tự động dừng lại khi người dùng rê chuột lên logo.
- `showControls`: Hiển thị nút Play/Pause nhỏ góc dưới cho người dùng chủ động điều khiển.

---

### 20. `stat-list`
- **Friendly Name trong Studio**: `Impact Metrics`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/stat-list.ts`
  - Server Wrapper: `src/ui/modules/stat-list.tsx`
  - Client Counter: `src/ui/modules/stat-list-client.tsx`
- **Định vị phễu**: High-Ticket Enterprise, Factory Capabilities.
- **Mục đích nghiệp vụ**: Số hóa năng lực sản xuất, quy mô xuất khẩu và thành tựu doanh nghiệp bằng các con số ấn tượng dễ ghi nhớ.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `stats[]`:
  - `value`: Con số đo lường (VD: "500,000+", "99.8%", "35+").
  - `label`, `sublabel`: Diễn giải chỉ số.
  - `icon`: Biểu tượng đi kèm (Preset Lucide icon hoặc ảnh SVG tải lên).
- `layout`: `grid` (lưới cân đối), `split` (tiêu đề bên trái, chỉ số bên phải), `bento`, hoặc `divider` (ngăn cách bằng đường kẻ thanh lịch).
- `animateCounter`: Hiệu ứng nhảy số tăng dần (Count-Up Animation) khi cuộn vào khung hình.
- `numberColor`: `brand` (màu nhận diện), `gradient` (chuyển sắc rực rỡ), hoặc `neutral`.

---

### 21. `accordion-list`
- **Friendly Name trong Studio**: `FAQ Drawer`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/accordion-list.ts`
  - Server Wrapper: `src/ui/modules/accordion-list.tsx`
  - Client Logic: `src/ui/modules/accordion-list-client.tsx`
- **Định vị phễu**: Cả 3 mô hình (D2C, High-Ticket, B2B).
- **Mục đích nghiệp vụ**: Giải đáp toàn bộ băn khoăn của người mua (Vận chuyển, bảo hành, MOQ, đổi trả, điều khoản thanh toán) ngay tại chỗ. Tự động sinh dữ liệu cấu trúc SEO Google `FAQPage`.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `items[]`: Danh sách câu hỏi và câu trả lời (PortableText).
- `exclusive`: Chỉ cho phép mở duy nhất 1 câu tại một thời điểm (Accordion) hoặc cho phép mở nhiều câu cùng lúc (Collapse).
- `enableSchema`: Tự động trích xuất nội dung thành JSON-LD Schema.org `FAQPage` để bài viết đạt Featured Snippet FAQ trên kết quả tìm kiếm Google.
- `showSearch`: Thanh tìm kiếm câu hỏi nhanh cho các trang chính sách có nhiều nội dung.
- `showExpandAll`: Nút mở tất cả / đóng tất cả tiện lợi.
- `supportCard`: Khối thông tin liên hệ phụ trợ gắn bên cạnh FAQ (Hotline, Email, Chat trực tiếp) khi khách hàng không tìm thấy câu trả lời phù hợp.

---

### 22. `person-list`
- **Friendly Name trong Studio**: `Leadership & Experts`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/person-list.ts`
  - Server Wrapper: `src/ui/modules/person-list.tsx`
  - Client Logic: `src/ui/modules/person-list-client.tsx`
- **Định vị phễu**: High-Ticket Authority, Google E-E-A-T Signals.
- **Mục đích nghiệp vụ**: Giới thiệu đội ngũ chuyên gia cố vấn, kỹ sư trưởng hoặc ban lãnh đạo đứng sau chất lượng sản phẩm nhằm tăng chỉ số tín nhiệm (Experience, Expertise, Authoritativeness, Trustworthiness).

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `people[]`: Danh sách nhân sự (tham chiếu document `person`):
  - `name`, `role`, `image`: Họ tên, học vị/chức danh và ảnh chân dung.
  - `bio`: Tiểu sử năng lực và kinh nghiệm chuyên môn.
  - `social`: Các liên kết mạng xã hội nghề nghiệp (LinkedIn, X/Twitter, ResearchGate, Website cá nhân).
- `layout`: `grid`, `carousel`, `featured` (nhân sự chủ chốt kích thước lớn), hoặc `compact`.
- `imageAspectRatio`: `3/4` (chân dung chuẩn studio), `1/1` (vuông), `circle` (tròn).
- `imageEffect`: `color` hoặc `grayscale` (chuyển đen trắng, hover hiện màu).

---

### 23. `blog-post-list`
- **Friendly Name trong Studio**: `Content Hub / Insights`
- **Vị trí tệp**:
  - Schema: `src/sanity/schemaTypes/modules/blog-post-list.ts`
  - Server Wrapper: `src/ui/modules/blog/blog-post-list.tsx`
  - Client Carousel: `src/ui/modules/blog/blog-post-list-carousel.tsx`
- **Định vị phễu**: Inbound Traffic, Internal Linking, Thought Leadership.
- **Mục đích nghiệp vụ**: Hiển thị danh sách các bài viết cẩm nang, tin tức chuyên ngành hoặc hướng dẫn mua sắm, dẫn dắt người đọc qua các bài viết liên quan.

#### Cấu Trúc Dữ Liệu & Trường Cấu Hình Chính
- `sourceType`: 4 cơ chế lấy bài viết linh hoạt:
  - `recent`: Lấy các bài viết mới xuất bản gần đây nhất.
  - `category`: Lấy các bài viết thuộc danh mục chỉ định (`blog.category`).
  - `featured`: Chỉ lọc các bài viết được đánh dấu tiêu điểm (`isFeatured == true`).
  - `manual`: Chọn thủ công danh sách bài viết mong muốn (`manualPosts[]`).
- `limit`: Số lượng bài viết hiển thị (mặc định 3 hoặc 6).
- Thẻ bài viết tích hợp đầy đủ: Ảnh cover tỉ lệ chuẩn, nhãn danh mục, thời gian đọc ước tính (`readTime`), tác giả và ngày đăng tải.

---

## 5. AUDIT CHI TIẾT 7 SPECIALIZED CORE PAGE MODULES

Các module dưới đây là **các thành phần cấu trúc trang cốt lõi** phục vụ các luồng chức năng chuyên biệt (không nằm trong danh sách tự do kéo thả nhưng được nhúng mặc định hoặc tương thích ngược):

---

### 24. `breadcrumbs`
- **File**: `src/ui/modules/breadcrumbs.tsx` (Schema: `src/sanity/schemaTypes/modules/breadcrumbs.ts`)
- **Vị trí hiển thị**: Đầu trang PDP, Trang Chi Tiết Bài Viết, Trang Bộ Sưu Tập, Trang Tìm Kiếm.
- **Luồng hoạt động**:
  1. Nhận prop `currentPage` (Product, Collection, BlogPost, hoặc Page).
  2. Tự động sinh phân cấp đường dẫn:
     - Với Product: `Home > Category > Product Title`.
     - With BlogPost: `Home > Blog > Category > Post Title`.
     - With Collection: `Home > Collections > Collection Title`.
  3. Render thẻ Semantic HTML `<nav>` kết hợp Microdata chuẩn SEO: `itemScope itemType="https://schema.org/BreadcrumbList"` và từng mục con `ListItem`.

---

### 25. `product-content`
- **File**: `src/ui/modules/product/product-content.tsx` & `product-content-client.tsx`
- **Vị trí hiển thị**: Cốt lõi của trang Chi tiết Sản phẩm (`app/(frontend)/products/[slug]/page.tsx`).
- **Luồng hoạt động**:
  1. **Gallery & Lightbox**: Hiển thị ảnh sản phẩm với Swiper Carousel và tính năng phóng to Lightbox (`lightbox.js-react`).
  2. **Variant Matrix Engine**:
     - Cho phép chọn nhiều thuộc tính (Kích thước, Màu sắc, Chất liệu).
     - Tự động tìm biến thể khớp (`findMatchingVariant`).
     - Khi biến thể thay đổi: Cập nhật giá, mã SKU, trạng thái tồn kho và **phát Custom Event `product:variant-change`** để thanh `sticky-mobile-cta` đồng bộ ngay lập tức.
  3. **Dual Conversion Model**:
     - *D2C Checkout*: Chọn số lượng -> Thêm vào giỏ hàng (`useCartStore`) -> Mở Cart Drawer.
     - *B2B RFQ*: Hiển thị bảng giá nấc số lượng (`priceTiers`), MOQ, và nút mở form Báo giá sỉ (`InPageRfqModal`).
  4. **Lead Time & Shipping Estimator**: Widget tính toán ngày hàng cập cảng đường biển (Ocean Freight) hoặc đường hàng không (Air Express) theo quốc gia đích của khách hàng.
  5. **UGC Reviews & Video Lightbox**: Hiển thị đánh giá được duyệt từ Cloudflare D1, hỗ trợ lọc theo số sao, xem video đánh giá và mở form gửi đánh giá mới (`ReviewFormModal`).

---

### 26. `collection-content`
- **File**: `src/ui/modules/collection/collection-content.tsx`
- **Vị trí hiển thị**: Cốt lõi của trang Bộ sưu tập (`app/(frontend)/collections/[slug]/page.tsx`).
- **Luồng hoạt động**:
  1. Hiển thị Banner bộ sưu tập, Tiêu đề H1 và Mô tả danh mục.
  2. Tích hợp trực tiếp với `ProductListClient`: Tự động áp bộ lọc ID bộ sưu tập hiện tại, cho phép người dùng lọc tiếp theo các danh mục con, sắp xếp giá và phân trang.

---

### 27. `blog-index`
- **File**: `src/ui/modules/blog/blog-index/index.tsx`
- **Vị trí hiển thị**: Cốt lõi của trang Tin tức & Tạp chí (`app/(frontend)/blog/page.tsx`).
- **Luồng hoạt động**:
  1. Truy vấn toàn bộ danh sách bài viết và cài đặt từ `blog-settings`.
  2. Thanh công cụ tìm kiếm và lọc:
     - `FilterList`: Lọc theo danh mục bài viết.
     - `SearchBar`: Tìm kiếm từ khóa theo thời gian thực (debounce).
     - `SortBy`: Sắp xếp theo ngày xuất bản hoặc tiêu đề.
  3. `PaginatedPosts`: Hiển thị danh sách bài viết kèm phân trang mượt mà (Next/Prev, số trang).
  4. `NewsletterBox`: Hộp đăng ký nhận bản tin qua email ở cuối danh sách.

---

### 28. `blog-post-content`
- **File**: `src/ui/modules/blog/blog-post-content.tsx`
- **Vị trí hiển thị**: Cốt lõi của trang Đọc Bài Viết (`app/(frontend)/blog/[slug]/page.tsx`).
- **Luồng hoạt động**:
  1. **Reading Progress**: Thanh đo tiến độ đọc cuộn ở mép trên cùng màn hình.
  2. **E-E-A-T Byline**: Hiển thị tác giả (`author`), chuyên gia phản biện (`reviewedBy`), ngày xuất bản, ngày cập nhật và thời gian đọc.
  3. **Key Takeaways Box**: Khối tóm tắt các luận điểm cốt lõi trước khi vào bài đọc.
  4. **FTC Commercial Disclosure**: Băng thông báo minh bạch liên kết tiếp thị liên kết (nếu bài viết có chứa affiliate links).
  5. **Sticky TOC Sidebar**: Mục lục tự động neo bám theo nội dung bài viết.
  6. **Interactive UGC Comments**: Hệ thống bình luận lưu trữ tại Cloudflare D1 (`BlogCommentsWrapper`), có honeypot chống bot và duyệt bình luận.
  7. **Related Recommendations**: Tự động gợi ý 3 bài viết cùng chủ đề và các sản phẩm nhúng liên quan.

---

### 29. `cart-checkout`
- **File**: `src/ui/modules/cart-checkout/index.tsx` & `cart-checkout-client.tsx`
- **Vị trí hiển thị**: Trang Thanh toán & Báo giá (`app/(frontend)/checkout/page.tsx`).
- **Luồng hoạt động**:
  1. Đọc trạng thái từ `useCartStore`.
  2. **Bộ chuyển đổi chế độ kép (Checkout Type Switcher)**:
     - *Direct Order (`direct`)*: Dành cho đơn mua mẫu (Sample) hoặc B2C chốt nhanh.
     - *Wholesale RFQ (`rfq`)*: Dành cho đơn hàng sỉ số lượng lớn, yêu cầu chiết khấu và lập hóa đơn Proforma.
  3. **Kiểm tra MOQ & Variant Pooling**:
     - Tự động cộng dồn số lượng các biến thể cùng 1 sản phẩm để kiểm tra MOQ và mở khóa nấc giá rẻ nhất.
     - Nút `roundUpToMoq()`: Tự động bù đủ số lượng thiếu chỉ với 1 cú click.
  4. **Xác thực Work Email**: Tự động nhận diện email doanh nghiệp (tách biệt Gmail, Yahoo, Hotmail...).
  5. **Gửi đơn qua `/api/orders`**:
     - Lưu đơn vào bảng `orders` của Cloudflare D1.
     - Thu thập First-Party Attribution 90 ngày (`deanflow_attr`) và lịch sử 8 trang xem gần nhất.
     - Kích hoạt Resend API gửi email Báo giá sơ bộ (Proforma Estimate) trong vòng 3 giây.
     - Chuyển hướng sang trang xác nhận `/order-success?orderId=...` và tạo trang tài liệu in ấn A4 chuẩn ngoại thương tại `/quote/[id]`.

---

### 30. `search-module`
- **File**: `src/ui/modules/search/index.tsx`
- **Vị trí hiển thị**: Trang Tìm kiếm toàn trang (`app/(frontend)/search/page.tsx`).
- **Luồng hoạt động**:
  1. Nhận từ khóa tìm kiếm qua URL query string (`?query=...` hoặc `?q=...`) quản lý bởi thư viện `nuqs`.
  2. Tìm kiếm đa nguồn (Storefront GROQ Query hoặc Google Programmable Search Engine).
  3. Tự động bóc tách và phân loại kết quả thành 3 tab riêng biệt:
     - Sản phẩm (`product`)
     - Bài viết (`blog.post`)
     - Trang tĩnh (`page`)
  4. Hỗ trợ phân trang độc lập cho từng nhóm kết quả.

---

## 6. AUDIT CHI TIẾT 6 PORTABLE TEXT EMBED BLOCKS

Các khối nhúng này được chèn trực tiếp vào giữa các đoạn văn bản của module `prose` hoặc `blog-post-content`:

---

### 31. `callout-box`
- **Schema**: `src/sanity/schemaTypes/objects/callout-box.ts`
- **Component**: `src/ui/modules/blog/blocks/callout-box.tsx`
- **Đặc điểm**: Khung hộp nhấn mạnh trong bài viết với 4 phong cách: `info` (thông tin xanh dương), `tip` (mẹo hay xanh lá), `warning` (lưu ý vàng cam), `quote` (trích dẫn xám).

---

### 32. `cta-banner`
- **Schema**: `src/sanity/schemaTypes/objects/cta-banner.ts`
- **Component**: `src/ui/modules/blog/blocks/cta-banner.tsx`
- **Đặc điểm**: Băng rôn kêu gọi hành động giữa bài với tiêu đề, phụ đề, nút bấm liên kết và ảnh nền tùy biến.

---

### 33. `faq-accordion`
- **Schema**: `src/sanity/schemaTypes/objects/faq-accordion.ts`
- **Component**: `src/ui/modules/blog/blocks/faq-accordion.tsx`
- **Đặc điểm**: Cụm câu hỏi thường gặp dạng đóng/mở (Accordion) nhúng ngay trong bài viết để giải đáp thắc mắc liên quan trực tiếp đến nội dung đang đọc.

---

### 34. `image-gallery`
- **Schema**: `src/sanity/schemaTypes/objects/image-gallery.ts`
- **Component**: `src/ui/modules/blog/blocks/image-gallery.tsx`
- **Đặc điểm**: Bộ sưu tập 2–8 hình ảnh hiển thị dạng lưới (Grid) hoặc so le (Masonry), nhấp vào để mở trình xem ảnh phóng to toàn màn hình (Lightbox zoom).

---

### 35. `product-embed`
- **Schema**: `src/sanity/schemaTypes/objects/product-embed.ts`
- **Component**: `src/ui/modules/blog/blocks/product-embed.tsx`
- **Đặc điểm**: Thẻ sản phẩm sống động (Shoppable Product Card) nhúng giữa bài viết. Tự động cập nhật giá từ Sanity, tự động gắn tham số UTM (`?utm_source=blog&utm_medium=product_embed`) và hỗ trợ **nút bấm Thêm vào giỏ hàng ngay tại chỗ**.

---

### 36. `video-embed` & `affiliateLink`
- **`video-embed`** (`src/sanity/schemaTypes/objects/video-embed.ts` & `video-embed.tsx`): Nhúng video YouTube, Vimeo hoặc file MP4 trực tiếp với ảnh thumbnail tùy biến và trình phát Lightbox.
- **`affiliateLink`** (`src/sanity/schemaTypes/objects/affiliate-link.ts` & `src/ui/modules/affiliate-link.tsx`): Khối thẻ giới thiệu sản phẩm liên kết tiếp thị (Affiliate Marketing Card) hiển thị giá, mã giảm giá (Coupon copy-to-clipboard), đánh giá biên tập viên (Editor's Verdict) và nút chuyển hướng tiếp thị với thuộc tính `rel="sponsored noopener noreferrer"`.

---

## 7. MA TRẬN TƯƠNG TÁC & PHỐI HỢP GIỮA CÁC MODULES

Các module trong DeanFlow không hoạt động cô lập mà phối hợp chặt chẽ tạo thành một mạng lưới chuyển đổi liên hoàn thông qua **Custom Event Bus** và **Global Zustand State**:

```
                                  ┌──────────────────────────────┐
                                  │      GLOBAL BROWSER BUS      │
                                  │  (window.dispatchEvent/on)   │
                                  └──────────────┬───────────────┘
                                                 │
         ┌───────────────────────────────────────┼───────────────────────────────────────┐
         │ Event: 'tiered-pricing:select'        │ Event: 'product:variant-change'       │ Event: 'cart:open'
         ▼                                       ▼                                       ▼
┌─────────────────────────────────┐     ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
│     lead-capture-form (Module)  │     │    sticky-mobile-cta (Module)   │     │    cart-drawer (Header / Store) │
├─────────────────────────────────┤     ├─────────────────────────────────┤     ├─────────────────────────────────┤
│ • Lắng nghe khi user bấm nấc giá│     │ • Lắng nghe khi user chọn màu/size│   │ • Mở ngăn kéo giỏ hàng trượt ra │
│ • Tự điền số lượng, đơn giá FOB,│     │ • Cập nhật giá mới, ảnh biến thể│     │ • Hiển thị tổng thanh toán, MOQ │
│   mức chiết khấu vào ô Message  │     │   và tên phân loại thời gian    │     │ • Chuyển mượt sang /checkout    │
│ • Cuộn mượt màn hình tới form   │     │   thực mà không cần tải lại     │     │                                 │
└─────────────────────────────────┘     └─────────────────────────────────┘     └─────────────────────────────────┘
```

### Các Kịch Bản Phối Hợp Tiêu Biểu:

1. **Kịch bản B2B Wholesale: `tiered-pricing` ➡️ `lead-capture-form`**:
   - Khi khách hàng xem bảng giá nấc sỉ trong `tiered-pricing` và nhấp vào nấc "5,000 pcs ($12.50/unit - FOB)", module sẽ dispatch Custom Event `tiered-pricing:select`.
   - Module `lead-capture-form` lập tức bắt lấy sự kiện này, tự động điền cấu hình đặt hàng vào ô ghi chú và kích hoạt cuộn mượt xuống form giúp khách hàng gửi RFQ trong 5 giây.

2. **Kịch bản PDP Mobile: `product-content` ➡️ `sticky-mobile-cta`**:
   - Khi người mua đổi phân loại màu sắc hoặc dung tích trên trang chi tiết sản phẩm, `product-content-client` bắn sự kiện `product:variant-change`.
   - Thanh ghim đáy màn hình `sticky-mobile-cta-client` lập tức cập nhật lại hình ảnh, đơn giá và tiêu đề biến thể tương ứng.
   - Khi form mua chính cuộn vào màn hình, `IntersectionObserver` tự động ẩn thanh ghim để tránh trùng lặp nút bấm.

3. **Kịch bản Gated Dossier: `compliance-vault` ➡️ Cloudflare D1 ➡️ Resend**:
   - Khách hàng yêu cầu tải tài liệu kiểm định nhà máy.
   - Module thu thập Work Email -> Lưu ngay vào bảng `leads` của Cloudflare D1 -> Resend API gửi email đính kèm tài liệu -> Trình duyệt lưu `sessionStorage` mở khóa toàn bộ các tài liệu khác trong suốt phiên làm việc.

4. **Kịch bản Nhúng Đa Điểm: `prose` ➡️ `product-embed` ➡️ `useCartStore`**:
   - Độc giả đang đọc bài viết hướng dẫn chuyên sâu có thể bấm nút "Thêm vào giỏ" ngay trên thẻ sản phẩm nhúng giữa bài. Sản phẩm được đưa vào `useCartStore` kèm theo tham số theo dõi chiến dịch tiếp thị.

---

## 8. QUY CHUẨN KỸ THUẬT KHI XÂY DỰNG / MỞ RỘNG MODULE MỚI

Khi bổ sung module mới vào hệ thống DeanFlow, lập trình viên **phải tuân thủ nghiêm ngặt chu trình 6 bước** sau để đảm bảo tính đồng nhất kiến trúc:

### Bước 1: Đăng ký Tên Thân Thiện (Friendly Name)
Mở tệp `src/sanity/lib/module-preview-config.ts` và thêm tên thương mại hiển thị trong Sanity Studio vào đối tượng `MODULE_FRIENDLY_NAMES`:
```ts
export const MODULE_FRIENDLY_NAMES = {
  // ...
  'brand-timeline': 'Brand Milestones Timeline',
}
```

### Bước 2: Định Nghĩa Schema với `defineModulePreview()`
Tạo tệp schema tại `src/sanity/schemaTypes/modules/<module-name>.ts`. Sử dụng hàm chuẩn hóa `defineModulePreview()`:
```ts
import { defineField, defineType } from 'sanity'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
  name: 'brand-timeline',
  title: 'Brand Milestones Timeline',
  type: 'object',
  fields: [
    defineField({ name: 'badge', type: 'string' }),
    defineField({ name: 'title', type: 'string' }),
    // ...
  ],
  preview: defineModulePreview('brand-timeline', {
    titleField: 'title',
    subtitleField: 'badge',
  }),
})
```

### Bước 3: Đăng Ký Schema vào Danh Mục Studio
- Mở `src/sanity/schemaTypes/index.ts`: Import schema và đưa vào mảng `pure dynamic modules` (sử dụng hàm `withModuleHidden`).
- Mở `src/sanity/schemaTypes/fragments/modules.ts`: Đưa `{ type: '<module-name>' }` vào mảng `of: [...]` và chỉ định nhóm hiển thị (`groups`).

### Bước 4: Mở Rộng GROQ Fragment Query
Mở `src/sanity/lib/queries.ts` và thêm logic trích xuất các trường dữ liệu tham chiếu trong `MODULES_QUERY`:
```groq
_type == 'brand-timeline' => {
  ...,
  milestones[]{
    ...,
    image { ..., asset-> }
  }
},
```

### Bước 5: Xây Dựng Component Giao Diện (UI Component)
Tạo thư mục `src/ui/modules/<module-name>/`:
- Tạo Server Component `index.tsx` bọc ngoài, áp dụng hàm `moduleAttributes(props)`.
- Nếu có tương tác người dùng, tạo file con `*-client.tsx` đánh dấu `'use client'`.
- Áp dụng `stegaClean()` cho tất cả các biến logic và xử lý ảnh an toàn:
```tsx
// Luôn kiểm tra fallback trước khi gọi urlFor
const imageUrl = item.image ? urlFor(item.image).url() : '/fallback-image.png'
```

### Bước 6: Khai Báo trong `ModulesResolver`
Mở `src/ui/modules/index.tsx`:
- Import component vào đầu file.
- Đăng ký `_type` tương ứng trong bảng tra cứu `MODULES_MAP`.
- Nếu component là Client Component, khai báo cờ trong biến `isClientComponent` để xử lý tối ưu thuộc tính `data-sanity`.

---

## 9. BẢNG TRA CỨU NHANH TOÀN BỘ MODULES

*(Quick Reference Cheat Sheet cho Developer & Content Editor)*

| TT | Tên Module (`_type`) | Friendly Name trong Studio | Phân Loại | File Component Chính | Phễu Trọng Tâm |
|---|---|---|---|---|---|
| 1 | `lead-capture-form` | Lead Capture Form | Pure Dynamic | `src/ui/modules/lead-capture-form/index.tsx` | B2B & High-Ticket |
| 2 | `tiered-pricing` | Tiered Volume Pricing | Pure Dynamic | `src/ui/modules/tiered-pricing/index.tsx` | B2B Wholesale |
| 3 | `compliance-vault` | Compliance Vault | Pure Dynamic | `src/ui/modules/compliance-vault/index.tsx` | B2B Export |
| 4 | `countdown-banner` | Countdown Banner | Pure Dynamic | `src/ui/modules/countdown-banner/index.tsx` | D2C Flash Sale |
| 5 | `sticky-mobile-cta` | Sticky Buy Bar | Pure Dynamic | `src/ui/modules/sticky-mobile-cta/index.tsx` | D2C 1-Page Funnel |
| 6 | `comparison-table` | Comparison Table | Pure Dynamic | `src/ui/modules/comparison-table.tsx` | D2C & High-Ticket |
| 7 | `social-proof` | Verified Reviews | Pure Dynamic | `src/ui/modules/social-proof/index.tsx` | Cả 3 Phễu |
| 8 | `hero.split` | Hero Split | Pure Dynamic | `src/ui/modules/hero.split.tsx` | Cả 3 Phễu |
| 9 | `hero-slider` | Hero Slider | Pure Dynamic | `src/ui/modules/hero-slider/index.tsx` | Brand Homepage |
| 10 | `media-grid` | Media Gallery Grid | Pure Dynamic | `src/ui/modules/media-grid/index.tsx` | High-Ticket & B2B |
| 11 | `carousel-banner-list`| Banner Carousel | Pure Dynamic | `src/ui/modules/carousel-banner-list.tsx` | Promotion |
| 12 | `card-list` | Feature Cards | Pure Dynamic | `src/ui/modules/card-list.tsx` | Cả 3 Phễu |
| 13 | `step-list` | Process Steps | Pure Dynamic | `src/ui/modules/step-list.tsx` | B2B Sourcing |
| 14 | `prose` | Editorial Story | Pure Dynamic | `src/ui/modules/prose/index.tsx` | Storytelling |
| 15 | `callout` | Promo Callout | Pure Dynamic | `src/ui/modules/callout.tsx` | Conversion Focus |
| 16 | `custom-html` | Code & App Embed | Pure Dynamic | `src/ui/modules/custom-html/index.tsx` | Integrations |
| 17 | `product-list` | Product Showcase | Pure Dynamic | `src/ui/modules/product/product-list.tsx` | E-Commerce |
| 18 | `quote-list` | Wall of Love | Pure Dynamic | `src/ui/modules/quote-list.tsx` | High-Ticket & B2B |
| 19 | `logo-list` | Logo Marquee | Pure Dynamic | `src/ui/modules/logo-list.tsx` | Brand Trust |
| 20 | `stat-list` | Impact Metrics | Pure Dynamic | `src/ui/modules/stat-list.tsx` | B2B Capabilities |
| 21 | `accordion-list` | FAQ Drawer | Pure Dynamic | `src/ui/modules/accordion-list.tsx` | Cả 3 Phễu |
| 22 | `person-list` | Leadership & Experts | Pure Dynamic | `src/ui/modules/person-list.tsx` | High-Ticket E-E-A-T |
| 23 | `blog-post-list` | Content Hub / Insights | Pure Dynamic | `src/ui/modules/blog/blog-post-list.tsx` | Inbound SEO |
| 24 | `breadcrumbs` | Breadcrumbs Navigation | Core Specialized | `src/ui/modules/breadcrumbs.tsx` | Navigation & SEO |
| 25 | `product-content` | Product Detail (PDP) | Core Specialized | `src/ui/modules/product/product-content.tsx` | E-Commerce Core |
| 26 | `collection-content` | Collection Catalog | Core Specialized | `src/ui/modules/collection/collection-content.tsx` | Catalog Browsing |
| 27 | `blog-index` | Editorial Archive | Core Specialized | `src/ui/modules/blog/blog-index/index.tsx` | Journal Archive |
| 28 | `blog-post-content` | Single Post Reading | Core Specialized | `src/ui/modules/blog/blog-post-content.tsx` | Deep Content |
| 29 | `cart-checkout` | Cart & Checkout | Core Specialized | `src/ui/modules/cart-checkout/index.tsx` | Checkout & RFQ |
| 30 | `search-module` | Search Engine | Core Specialized | `src/ui/modules/search/index.tsx` | Search & Discovery |
| 31 | `callout-box` | Callout Box | Embed Block | `src/ui/modules/blog/blocks/callout-box.tsx` | Article Emphasis |
| 32 | `cta-banner` | CTA Banner | Embed Block | `src/ui/modules/blog/blocks/cta-banner.tsx` | Article Banner |
| 33 | `faq-accordion` | FAQ Accordion | Embed Block | `src/ui/modules/blog/blocks/faq-accordion.tsx` | In-Article FAQ |
| 34 | `image-gallery` | Image Gallery | Embed Block | `src/ui/modules/blog/blocks/image-gallery.tsx` | Photo Lightbox |
| 35 | `product-embed` | Product Embed | Embed Block | `src/ui/modules/blog/blocks/product-embed.tsx` | Shoppable Article |
| 36 | `video-embed` | Video Embed | Embed Block | `src/ui/modules/blog/blocks/video-embed.tsx` | Video Player |

---

---

## 10. ĐẶC TẢ CẤU TRÚC JSON CHO AI AGENT (JSON PAYLOAD SPECIFICATION)

> **Mục tiêu**: Đây là chuẩn kỹ thuật chính thức (Ground Truth) để AI Agent (ChatGPT, Claude, Gemini...) dựa vào khi đọc file này để tạo ra landing page JSON hoàn chỉnh, hợp lệ 100% cho hệ thống Smart Page Importer.

### 1. Cấu Trúc Khung JSON Gốc (Root Schema)
```json
{
  "title": "B2B Export Packaging OEM/ODM Solutions",
  "slug": "oem-export-packaging",
  "appearance": {
    "colorScheme": "light",
    "backgroundType": "default",
    "headerMode": "transparent",
    "hideFooter": false,
    "scrollReveal": "fade-up"
  },
  "seo": {
    "metaTitle": "Global B2B Compostable Packaging Solutions | Brand Name",
    "metaDescription": "Direct-from-factory sustainable packaging for international enterprise brands. Fast RFQ in 12 hours.",
    "noIndex": false
  },
  "modules": [
    // Chọn từ 5 đến 10 modules theo mạch phễu chuyển đổi
  ],
  "manualActionNotes": [
    // 3 đến 5 bước tinh gọn: step + title + location
    { "step": 1, "title": "Upload Primary Visual Asset (16:9)", "location": "Tab 1: Content -> Hero Split" },
    { "step": 2, "title": "Select 6+ Partner Logos", "location": "Tab 1: Content -> Logo Marquee" },
    { "step": 3, "title": "Verify Canvas Theme", "location": "Tab 2: Appearance" },
    { "step": 4, "title": "Attach Social Share Image", "location": "Tab 3: Metadata & SEO" }
  ]
}
```

### 2. Bảng Tra Cứu Trường Dữ Liệu & Giá Trị Enum Hợp Lệ Của 23 Dynamic Modules

1. **`hero.split`**:
   - `type`: `"hero.split"`
   - `tagline` / `badge`: Chuỗi ngắn (eyebrow)
   - `headline`: Tiêu đề chính H1
   - `subtext`: Đoạn văn giải thích dưới headline
   - `mediaPosition`: `"right"` | `"left"`
   - `image`: `{ "alt": "Mô tả chi tiết chuẩn SEO WCAG 2.2 AA" }`
   - `primaryCta`: `{ "label": "...", "link": "#rfq-form" }`
   - `secondaryCta`: `{ "label": "...", "link": "#specs-table" }`

2. **`hero-slider`**:
   - `type`: `"hero-slider"`
   - `slides`: Mảng các slide: `[{ "headline": "...", "subheadline": "...", "badge": "...", "primaryCtaText": "...", "primaryCtaLink": "...", "image": { "alt": "..." } }]`

3. **`countdown-banner`**:
   - `type`: `"countdown-banner"`
   - `countdownType`: `"fixed"` | `"evergreen"`
   - `endDate`: Chuỗi ISO 8601 (VD: `"2026-12-31T23:59:59Z"`)
   - `badge`, `headline`, `subheadline`, `ctaText`, `ctaLink`

4. **`logo-list`**:
   - `type`: `"logo-list"`
   - `headline`: Tiêu đề khối (VD: "Trusted by 500+ Brands Worldwide")
   - `logoType`: `"default"` | `"dark"` | `"light"`

5. **`stat-list`**:
   - `type`: `"stat-list"`
   - `badge`, `headline`
   - `columns`: `2` | `3` | `4`
   - `layout`: `"grid"` | `"carousel"`
   - `cardStyle`: `"card"` | `"elevated"` | `"minimal"` | `"outline"`
   - `stats`: `[{ "value": "50M+", "label": "...", "subtext": "...", "iconPreset": "factory" }]`
   - `iconPreset` hợp lệ: `"factory"`, `"layers"`, `"globe"`, `"leaf"`, `"barchart"`, `"shield"`, `"zap"`, `"check"`, `"award"`, `"truck"`, `"clock"`, `"flame"`, `"droplets"`, `"recycle"`, `"none"`

6. **`social-proof`**:
   - `type`: `"social-proof"`
   - `badge`, `headline`, `subtitle`
   - `headerAlignment`: `"center"` | `"left"`
   - `showTrustStats`: `true` | `false`
   - `reviews`: `[{ "authorName": "...", "authorRole": "...", "authorCompany": "...", "rating": 5, "title": "...", "quote": "..." }]`

7. **`quote-list`**:
   - `type`: `"quote-list"`
   - `badge`, `headline`, `subtitle`
   - `layout`: `"masonry"` | `"grid"` | `"carousel"`
   - `columns`: `2` | `3` | `4`
   - `cardStyle`: `"bordered"` | `"elevated"` | `"minimal"` | `"glass"`
   - `quotes`: `[{ "quote": "...", "author": "...", "company": "...", "role": "...", "rating": 5 }]`

8. **`card-list`**:
   - `type`: `"card-list"`
   - `badge`, `headline`
   - `columns`: `2` | `3` | `4`
   - `desktopLayout`: `"grid"` | `"carousel"`
   - `cardStyle`: `"card"` | `"elevated"` | `"minimal"` | `"glass"`
   - `cards`: `[{ "badge": "...", "title": "...", "description": "...", "iconPreset": "shield" }]`
   - `iconPreset` hợp lệ: `"shield"`, `"zap"`, `"check"`, `"sparkles"`, `"leaf"`, `"award"`, `"truck"`, `"globe"`, `"barchart"`, `"clock"`, `"lock"`, `"heart"`, `"flame"`, `"none"`

9. **`step-list`**:
   - `type`: `"step-list"`
   - `badge`, `headline`
   - `layout`: `"split"` | `"horizontal"` | `"grid"` | `"vertical"`
   - `columns`: `2` | `3` | `4`
   - `showConnector`: `true` | `false`
   - `steps`: `[{ "step": "01", "title": "...", "description": "...", "iconPreset": "cpu" }]`
   - `iconPreset` hợp lệ: `"search"`, `"fileText"`, `"cpu"`, `"factory"`, `"check"`, `"package"`, `"truck"`, `"globe"`, `"zap"`, `"shield"`, `"sparkles"`, `"none"`

10. **`comparison-table`**:
    - `type`: `"comparison-table"`
    - `badge`, `title`, `caption`
    - `tableStyle`: `"card"` | `"bordered"` | `"minimal"`
    - `highlightedColumnIndex`: `1` (cột giải pháp của bạn)
    - `highlightBadge`: `"Our Solution"` | `"Recommended"`
    - `headers`: `["Tiêu chí", "Giải pháp của chúng tôi", "Giải pháp truyền thống"]`
    - `rows`: Mảng 2 chiều các cell text so sánh

11. **`compliance-vault`**:
    - `type`: `"compliance-vault"`
    - `badge`, `headline`, `subtitle`
    - `vaultTheme`: `"dark"` | `"light"`
    - `headerAlignment`: `"center"` | `"left"`
    - `certificates`: `[{ "title": "...", "issuer": "...", "code": "...", "description": "..." }]`

12. **`tiered-pricing`**:
    - `type`: `"tiered-pricing"`
    - `badge`, `headline`, `subtitle`
    - `currency`: `"USD"` | `"EUR"` | `"VND"`
    - `tableStyle`: `"cards"` | `"table"` | `"minimal"`
    - `highlightBestValue`: `true` | `false`
    - `tiers`: `[{ "minQty": 1000, "maxQty": 5000, "unitPrice": 0.45, "incoterm": "FOB", "badge": "Wholesale Tier", "isCustomQuote": false }]`

13. **`accordion-list`**:
    - `type`: `"accordion-list"`
    - `badge`, `headline`
    - `layout`: `"vertical"` | `"horizontal"` | `"grid"`
    - `accordionStyle`: `"card"` | `"separated"` | `"contained"`
    - `faq`: `[{ "question": "...", "answer": "...", "badge": "...", "iconPreset": "package" }]`
    - `iconPreset` hợp lệ: `"package"`, `"truck"`, `"fileCheck"`, `"leaf"`, `"credit-card"`, `"shield"`, `"globe"`, `"sparkles"`, `"refresh"`, `"help"`, `"none"`

14. **`lead-capture-form`**:
    - `type`: `"lead-capture-form"`
    - `badge`, `headline`, `subtitle`, `ctaText`
    - `layout`: `"split"` | `"card"` | `"centered"`
    - `bgStyle`: `"slate"` | `"white"` | `"gradient"` | `"dark"`
    - `benefits`: Danh sách 3 cam kết

15. **`callout`**:
    - `type`: `"callout"`
    - `badge`, `headline`, `content`, `ctaText`, `ctaLink`
    - `layout`: `"centered"` | `"split"`
    - `themeStyle`: `"brand"` | `"dark"` | `"light"` | `"subtle"`
    - `borderStyle`: `"accent-left"` | `"full"`

16. **`prose`**:
    - `type`: `"prose"`
    - `headline`: Tiêu đề tuỳ chọn
    - `content`: `["Đoạn văn 1", "Đoạn văn 2"]`

17. **`sticky-mobile-cta`**:
    - `type`: `"sticky-mobile-cta"`
    - `title`: Tiêu đề ngắn gọn sản phẩm / ưu đãi
    - `badge`: Huy hiệu (VD: "Save 30%")
    - `price`: Mức giá hiển thị (VD: "From $0.038 / unit")
    - `ctaText`: Nhãn nút (VD: "Request Factory Quote")
    - `ctaLink`: Đường dẫn neo (VD: "#rfq-form")

18. **`person-list`**:
    - `type`: `"person-list"`
    - `badge`, `headline`, `subtitle`
    - `columns`: `2` | `3` | `4`
    - `layout`: `"grid"` | `"carousel"`
    - `cardStyle`: `"card"` | `"minimal"`
    - `people`: `[{ "name": "...", "role": "...", "credentials": "...", "department": "...", "shortBio": "...", "image": { "alt": "..." } }]`

19. **`media-grid`**:
    - `type`: `"media-grid"`
    - `headline`, `subtitle`
    - `columns`: `2` | `3` | `4`
    - `items`: `[{ "title": "...", "subtitle": "...", "badge": "...", "image": { "alt": "..." }, "link": { "label": "...", "params": "#" } }]`

20. **`carousel-banner-list`**:
    - `type`: `"carousel-banner-list"`
    - `headline`
    - `items`: `[{ "alt": "...", "external": "https://...", "linkBannerType": "external" }]`

21. **`product-list`**:
    - `type`: `"product-list"`
    - `badge`, `headline`, `subtitle`
    - `columns`: `2` | `3` | `4`
    - `layout`: `"grid"` | `"carousel"`
    - `showViewAll`: `true`

22. **`blog-post-list`**:
    - `type`: `"blog-post-list"`
    - `badge`, `headline`, `subtitle`
    - `columns`: `2` | `3` | `4`
    - `layout`: `"grid"` | `"carousel"`
    - `limit`: `3`

23. **`custom-html`**:
    - `type`: `"custom-html"`
    - `badge`, `headline`, `subtitle`
    - `embedType`: `"custom"` | `"iframe"`
    - `html`: Mã nhúng HTML / iframe widget

---

*Tài liệu được cập nhật và kiểm toán toàn diện ngày 08/11/2026 bởi Đội ngũ Kiến trúc DeanFlow / DeanCore E-Commerce.*
