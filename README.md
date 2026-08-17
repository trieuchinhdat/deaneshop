# 🌿 ECOCROS (DeanCore E-Commerce Platform)

Hệ thống thương mại điện tử Headless thế hệ mới được xây dựng trên nền tảng **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, **Sanity CMS v5**, **Zustand v5** và tích hợp sẵn **Commerce Admin & CRM** nội bộ.

---

## 📑 Mục lục

1. [Tổng Quan Kiến Trúc & Công Nghệ](#-tổng-quan-kiến-trúc--công-nghệ)
2. [Cấu Trúc Thư Mục Dự Án](#-cấu-trúc-thư-mục-dự-án)
3. [Cài Đặt & Cấu Hình Môi Trường](#-cài-đặt--cấu-hình-môi-trường)
4. [Tập Lệnh Phát Triển (NPM Scripts)](#-tập-lệnh-phát-triển-npm-scripts)
5. [Cơ Chế Dynamic Page Builder (Module Resolver)](#-cơ-chế-dynamic-page-builder-module-resolver)
6. [Hệ Thống Phân Hệ Chính (Core Features)](#-hệ-thống-phân-hệ-chính-core-features)
   - [1. Phân hệ Bán Hàng & E-Commerce](#1-phân-hệ-bán-hàng--e-commerce)
   - [2. Phân hệ Quản Trị Vận Hành (Commerce Admin)](#2-phân-hệ-quản-trị-vận-hành-commerce-admin)
   - [3. Phân hệ Sanity Studio (CMS)](#3-phân-hệ-sanity-studio-cms)
   - [4. Phân hệ Xác Thực (Authentication & Customer Portal)](#4-phân-hệ-xác-thực-authentication--customer-portal)
   - [5. Phân hệ Marketing & Tương Tác](#5-phân-hệ-marketing--tương-tác)
   - [6. Phân hệ Theme & Design Tokens](#6-phân-hệ-theme--design-tokens)
7. [Hướng Dẫn Phát Triển Module Mới](#-hướng-dẫn-phát-triển-module-mới)
8. [Quy Chuẩn Code & Best Practices](#-quy-chuẩn-code--best-practices)

---

## 🚀 Tổng Quan Kiến Trúc & Công Nghệ

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT BROWSERS                                   |
+-----------------------------------------------------------------------------------+
       ▲                                 ▲                                   ▲
       │ (Storefront Routes)             │ (Admin & CSKH Hub)                │ (Visual Editing)
       ▼                                 ▼                                   ▼
+-----------------------------------------------------------------------------------+
|                        NEXT.JS 16.1.1 (APP ROUTER)                                |
|  - React 19.2.3 (React Compiler Enabled)                                          |
|  - Tailwind CSS v4 & Dynamic CSS Variables Token Engine                           |
|  - Server Components (RSC) + Selective Client Boundaries                          |
|  - Nuqs (URL State) + Zustand v5 (Persisted Cart, Wishlist, Auth)                 |
+-----------------------------------------------------------------------------------+
       ▲                                 ▲                                   ▲
       │ Live Queries / GROQ             │ Server Actions & API Routes       │ Mutations
       ▼                                 ▼                                   ▼
+-----------------------------------------------------------------------------------+
|                        SANITY CMS v5 & DATA LAYER                                 |
|  - Live Content API (Real-time updates)                                           |
|  - Custom Desk Structure (Products, Settings, Marketing, Redirects)               |
|  - Documents: Product, Order, Customer CRM, Review, Blog, Site Settings           |
|  - Read/Write Token Access with automatic Typegen                                 |
+-----------------------------------------------------------------------------------+
```

### 🛠️ Tech Stack Chi Tiết

| Thành phần | Công nghệ / Thư viện | Vai trò |
|---|---|---|
| **Core Framework** | `Next.js 16.1.1` (App Router) | Render Server-Side (RSC), Dynamic Routing, Route Handlers, ISR |
| **UI Runtime** | `React 19.2.3` | UI Components, React Compiler enabled (`babel-plugin-react-compiler`) |
| **Styling** | `Tailwind CSS v4.1` + PostCSS | Utility-first CSS, `@theme` tokens, dynamic CSS variables via ThemeProvider |
| **CMS Platform** | `Sanity v6.9` / `next-sanity v12` | Headless CMS, GROQ queries, Live Content API, Visual Editing |
| **State Management** | `Zustand v5.0` + `persist` | Quản lý Giỏ hàng (`useCartStore`), Yêu thích (`useWishlistStore`), Phiên đăng nhập (`useAuthStore`) |
| **Authentication** | Custom HMAC-SHA256 JWT + Google OAuth | Quản lý phiên đăng nhập khách hàng an toàn qua HTTP-only cookies |
| **UI Components** | `lucide-react`, `react-icons`, `swiper v12`, `sweetalert2`, `lightbox.js-react` | Icons, Carousels, Toasts, Image Zoom Lightbox |
| **Performance & SEO** | `@vercel/analytics`, `nuqs`, Selective Fonts Loader, JSON-LD Schema | Tối ưu Core Web Vitals (CWV), LCP, Rich Snippets |

---

## 📁 Cấu Trúc Thư Mục Dự Án

```
ecocros/
├── .agents/                      # AI Agent Skills & Customization Configs
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── (admin)/              # Phân hệ Commerce Admin & Quản lý vận hành
│   │   │   ├── admin/            # Dashboard quản lý: Đơn hàng, Khách hàng CRM, Đánh giá
│   │   │   └── layout.tsx        # Layout dành riêng cho Admin CSKH
│   │   ├── (frontend)/           # Phân hệ Khách hàng (Storefront)
│   │   │   ├── [[...slug]]/      # Dynamic Page Router (Xử lý Trang chủ & Trang tĩnh)
│   │   │   ├── account/          # Trang Thông tin tài khoản & Lịch sử đơn hàng
│   │   │   ├── api/              # Route Handlers (Auth, Orders, Reviews, Popup, Wishlist...)
│   │   │   ├── blog/             # Trang Blog danh mục, chi tiết bài viết & RSS Feed
│   │   │   ├── checkout/         # Trang Đặt hàng & Thanh toán
│   │   │   ├── collections/      # Trang Danh mục bộ sưu tập sản phẩm
│   │   │   ├── order-success/    # Trang Thông báo đặt hàng thành công & Tra cứu đơn
│   │   │   ├── products/         # Trang Chi tiết sản phẩm (PDP) & RSS XML Feed
│   │   │   ├── search/           # Trang Tìm kiếm sản phẩm & Bài viết
│   │   │   ├── wishlist/         # Trang Danh sách sản phẩm yêu thích
│   │   │   ├── layout.tsx        # Root Layout: Header, Footer, Popup, Chatbox, Tracking
│   │   │   └── not-found.tsx     # Trang 404 tùy biến
│   │   ├── (studio)/             # Phân hệ Sanity Studio CMS
│   │   │   └── studio/[[...tool]]# Sanity Studio GUI tích hợp trong ứng dụng (`/studio`)
│   │   ├── app.css               # Định nghĩa CSS gốc, `@theme` Tokens & Utilities
│   │   └── sitemap.ts            # Tự động sinh XML Sitemap cho toàn bộ website
│   ├── hooks/                    # Custom React Hooks
│   │   ├── use-header-height.ts  # Đo và đồng bộ chiều cao dynamic header
│   │   ├── useMatchMedia.ts      # Kiểm tra responsive media queries
│   │   ├── useMounted.ts         # Tránh lỗi Hydration Mismatch
│   │   └── usePagination.tsx     # Phân trang dữ liệu Client-side
│   ├── lib/                      # Tiện ích chung & Thư viện dùng chung
│   │   ├── auth.ts               # Xử lý tạo/giải mã JWT Session Token & Helper cookie
│   │   ├── env.ts                # Khai báo hằng số môi trường & ROUTES
│   │   ├── fonts.ts              # Loader nạp font Google tối ưu tốc độ LCP
│   │   └── utils.ts              # Utility helpers: format tiền tệ VND, cn(), slugify...
│   ├── sanity/                   # Cấu hình Sanity CMS & Schemas
│   │   ├── lib/                  # Sanity Client, Live Query, Image URL builder, Token
│   │   │   ├── client.ts         # Sanity Read Client
│   │   │   ├── write-client.ts   # Sanity Write Client (Dùng cho API Mutation)
│   │   │   ├── live.ts           # Sanity Live Content API Runner
│   │   │   ├── image.ts          # Helper `urlFor()` tạo link ảnh tối ưu
│   │   │   └── queries.ts        # Toàn bộ GROQ Queries & Fragments của dự án
│   │   ├── presentation/         # Visual Editing & Live Preview config
│   │   ├── schemaTypes/          # Toàn bộ Schema định nghĩa trong Sanity
│   │   │   ├── documents/        # Documents: product, order, customer, review, site, theme...
│   │   │   ├── modules/          # Page Builder Modules: product-list, hero.split, prose...
│   │   │   └── objects/          # Object Schemas: cta, link, metadata, variant...
│   │   ├── structure.ts          # Tùy biến thanh điều hướng Sanity Desk Structure
│   │   └── types.ts              # TypeScript Types tự động sinh bởi `sanity typegen`
│   ├── store/                    # Quản lý Global State với Zustand
│   │   ├── use-auth-store.ts     # Trạng thái đăng nhập & thông tin User
│   │   ├── use-cart-store.ts     # Trạng thái Giỏ hàng, tính giá, đổi Variant
│   │   └── use-wishlist-store.ts # Danh sách Wishlist lưu trữ LocalStorage
│   └── ui/                       # Thư viện UI Components
│       ├── cart/                 # Modal đổi phân loại trong giỏ hàng (`cart-variant-modal`)
│       ├── footer/               # Footer toàn trang, USP Bar, Social, Newsletter
│       ├── header/               # Header bar, Navigation, MegaMenu, Cart Drawer, Search Modal
│       ├── modules/              # Toàn bộ UI Components tương ứng với Sanity Modules
│       │   ├── blog/             # Module Blog list, Post content, TOC, Related posts
│       │   ├── collection/       # Module Collection grid, bộ lọc danh mục
│       │   ├── product/          # Module Product Detail, Gallery, Reviews, Flash Sale...
│       │   ├── wishlist/         # Module Wishlist display & tương tác
│       │   ├── index.tsx         # `ModulesResolver` - Bộ phân giải render Module động
│       │   └── ...               # Hero, Banners, Accordion, Quotes, Logos, Stats...
│       ├── popup/                # Popup Marketing (Quảng cáo, Thu thập Lead nhận Voucher)
│       ├── chatbox.tsx           # Floating Contact Widgets (Zalo, Hotline, Messenger)
│       ├── theme-provider.tsx    # Inject CSS Variables động từ Sanity Theme Settings
│       └── tracking-scripts.tsx  # Dynamic Script Injector (GA4, GTM, Pixel, TikTok)
├── next.config.ts                # Cấu hình Next.js (View Transition, Redirects, Images CDN)
├── sanity.config.ts              # Cấu hình Sanity Studio Plugins & Workspaces
└── package.json                  # Dependencies & Scripts
```

---

## ⚙️ Cài Đặt & Cấu Hình Môi Trường

### 1. Yêu Cầu Hệ Thống

- **Node.js**: Phiên bản `>= 20.x` (Khuyến nghị dùng Node 20 LTS hoặc 22).
- **Package Manager**: `npm` hoặc `yarn`.

### 2. Cấu Hình Biến Môi Trường (`.env.local`)

Tạo file `.env.local` tại thư mục gốc của dự án dựa trên mẫu sau:

```env
# 1. Base URL Website
NEXT_PUBLIC_BASE_URL="http://localhost:3000"

# 2. Sanity Project & Dataset
NEXT_PUBLIC_SANITY_PROJECT_ID="your_sanity_project_id"
NEXT_PUBLIC_SANITY_DATASET="production"
NEXT_PUBLIC_SANITY_API_VERSION="2025-07-01"

# 3. Sanity API Tokens
# Token đọc dữ liệu (View & Preview Drafts)
SANITY_API_READ_TOKEN="your_sanity_read_token"
# Token ghi dữ liệu (Dùng cho API tạo Đơn hàng, Đánh giá, Khách hàng CRM, Lead popup)
SANITY_API_WRITE_TOKEN="your_sanity_write_token"

# 4. Google OAuth (Đăng nhập tài khoản bằng Google)
GOOGLE_CLIENT_ID="your_google_client_id.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# 5. Session JWT Secret (Chuỗi bảo mật mã hóa Cookie đăng nhập)
AUTH_SECRET="your_random_ultra_secure_jwt_secret_key_minimum_32_chars"
```

---

## 💻 Tập Lệnh Phát Triển (NPM Scripts)

Trong quá trình phát triển, sử dụng các lệnh sau trong terminal:

| Lệnh | Ý nghĩa & Mô tả |
|---|---|
| `npm run dev` | Khởi chạy server phát triển với chế độ Webpack (`http://localhost:3000`) |
| `npm run dev:turbopack` | Khởi chạy server phát triển với Turbopack cực nhanh |
| `npm run build` | Build ứng dụng phục vụ Production bundle |
| `npm run start` | Chạy ứng dụng Production đã build |
| `npm run typegen` | **Trích xuất Sanity Schema & tự động sinh lại TypeScript types** (`src/sanity/types.ts`) |
| `npm run typecheck` | Kiểm tra toàn diện lỗi TypeScript (`tsc --noEmit`) |
| `npm run lint` | Chạy Next.js ESLint kiểm tra cú pháp và quy chuẩn code |
| `npm run format` | Tự động format toàn bộ mã nguồn bằng Prettier |

---

## 🧩 Cơ Chế Dynamic Page Builder (Module Resolver)

Dự án áp dụng kiến trúc **Block-based Dynamic Page Builder**. Người quản trị có thể sắp xếp, ẩn/hiện, thay đổi thứ tự mọi khối hiển thị trên bất kỳ trang nào qua Sanity Studio.

```
                    +------------------------------------+
                    |       Sanity Page / Product        |
                    |    (Chứa mảng modules: Array)      |
                    +------------------------------------+
                                      │
                                      ▼
                    +------------------------------------+
                    |        Page Server Component       |
                    |         (src/app/.../page.tsx)     |
                    +------------------------------------+
                                      │
                                      ▼
                    +------------------------------------+
                    |          ModulesResolver           |
                    |     (src/ui/modules/index.tsx)     |
                    +------------------------------------+
                                      │
        ┌──────────────┬──────────────┼──────────────┬──────────────┐
        ▼              ▼              ▼              ▼              ▼
  [HeroSplit]   [ProductList]  [CarouselBanner] [AccordionList] [CustomHTML]
```

### Danh Sách 25+ Modules Được Hỗ Trợ:

| Tên Module (`_type`) | Component UI | Công dụng |
|---|---|---|
| `hero.split` | `HeroSplit` | Khối banner Hero dạng chia 2 cột (Text + Media/Image) |
| `carousel-banner-list` | `WrapCarouselBannerList` | Slider / Banner băng chuyền chuyển động đa năng |
| `product-list` | `productList` | Danh sách sản phẩm dạng Grid/Carousel (lọc theo danh mục, flash sale) |
| `product-content` | `productContent` | Khối nội dung chi tiết sản phẩm: Thư viện ảnh, giá, biến thể, review |
| `collection-content` | `CollectionContent` | Trang danh mục sản phẩm kèm thanh lọc (Bộ sưu tập) |
| `cart-checkout` | `WrapCartCheckout` | Khối bảng giỏ hàng & Form thanh toán đơn hàng trực tiếp |
| `wishlist` | `WishlistModule` | Khối hiển thị toàn bộ danh sách sản phẩm yêu thích của khách hàng |
| `blog-index` | `BlogIndex` | Giao diện trang chủ tin tức / blog |
| `blog-post-list` | `BlogPostList` | Danh sách bài viết theo danh mục hoặc mới nhất |
| `blog-post-content` | `BlogPostContent` | Chi tiết bài viết chuẩn SEO, mục lục TOC, thanh đọc tiến độ, tác giả |
| `accordion-list` | `AccordionList` | Khối câu hỏi thường gặp (FAQ) hoặc thông tin thu gọn Accordion |
| `card-list` | `CardList` | Danh sách thẻ thông tin, tính năng nổi bật |
| `logo-list` | `LogoList` | Băng chuyền / Lưới logo đối tác, thương hiệu |
| `person-list` | `PersonList` | Danh sách thành viên đội ngũ, chuyên gia |
| `quote-list` | `QuoteList` | Khối feedback, đánh giá của khách hàng tiêu biểu |
| `stat-list` | `StatList` | Khối số liệu thống kê thành tựu ấn tượng |
| `step-list` | `StepList` | Quy trình từng bước hướng dẫn mua hàng / dịch vụ |
| `callout` | `Callout` | Khối kêu gọi hành động nổi bật |
| `prose` | `Prose` | Khối văn bản tự do định dạng phong phú (Rich Text) |
| `search-module` | `SearchModule` | Thanh tìm kiếm và kết quả tìm kiếm thời gian thực |
| `custom-html` | `CustomHTML` | Nhúng mã HTML / CSS / iFrame tùy chỉnh |
| `theme-background` | `ThemeBackground` | Đổi màu nền / hiệu ứng nền cho phân đoạn trang |
| `breadcrumbs` | `Breadcrumbs` | Thanh điều hướng phân cấp chuẩn SEO |
| `affiliate-link` | `AffiliateLink` | Khối liên kết tiếp thị liên kết (Affiliate) |
| `announcement-item` | `AnnouncementItem` | Thông báo / Banner khuyến mãi nổi bật |

---

## 🌟 Hệ Thống Phân Hệ Chính (Core Features)

### 1. Phân hệ Bán Hàng & E-Commerce

- **Quản lý Sản phẩm & Đa Biến thể (Variants)**:
  - Hỗ trợ sản phẩm nhiều thuộc tính (Màu sắc, Kích thước, Dung tích, Chất liệu...).
  - Quản lý giá gốc, giá so sánh (`compareAtPrice`), quản lý SKU và tồn kho riêng cho từng biến thể.
  - Bộ chọn biến thể thông minh (`CartVariantSelector` & `CartVariantModal`) cho phép khách hàng **thay đổi biến thể trực tiếp ngay trong Giỏ hàng** mà không cần quay lại trang sản phẩm.
- **Trải nghiệm Chi tiết Sản phẩm (PDP)**:
  - Thư viện ảnh tương tác cao, hỗ trợ xem Lightbox & Zoom độ nét cao.
  - Flash Sale Countdown Timer đếm ngược theo thời gian thực.
  - Mua hàng nhanh 1-Click hoặc Thêm vào Giỏ hàng với hiệu ứng Toast mượt mà.
  - Bảng đánh giá sản phẩm có ảnh/video thực tế từ người mua.
- **Giỏ Hàng & Checkout**:
  - Drawer Giỏ hàng trượt mượt mà từ cạnh phải, tự động tính tổng tiền và thanh tiến độ Miễn phí vận chuyển.
  - Trang Đặt hàng `/checkout` tối ưu hóa chuyển đổi, hỗ trợ hình thức COD (Thanh toán khi nhận hàng) và Chuyển khoản ngân hàng.
  - Đồng bộ trạng thái đơn hàng tự động vào cơ sở dữ liệu Sanity.

### 2. Phân hệ Quản Trị Vận Hành (Commerce Admin)

Truy cập tại URL: `/admin` (Dành cho bộ phận CSKH & Quản lý bán hàng).

- **Quản lý Đơn hàng (Orders Pipeline)**:
  - Theo dõi danh sách đơn hàng theo trạng thái: *Chờ xác nhận*, *Đã xác nhận*, *Đang giao*, *Hoàn thành*, *Đã hủy*.
  - Cập nhật mã vận đơn, đơn vị vận chuyển (GHTK, GHN, Viettel Post...), ghi chú nội bộ.
  - **In Hóa Đơn Bán Hàng (`OrderPrintModal`)**: Xem trước và in phiếu xuất kho / hóa đơn bán hàng chuẩn xác.
- **Quản lý Khách Hàng (Customer CRM)**:
  - Tự động gom nhóm khách hàng theo Số điện thoại & Email.
  - Thống kê tổng số đơn, tổng giá trị chi tiêu (LTV), lịch sử tương tác và ghi chú CSKH.
- **Duyệt Đánh Giá Sản Phẩm (Reviews Moderation)**:
  - Kiểm duyệt đánh giá có hình ảnh/video của khách trước khi cho phép hiển thị ra website.
  - Phản hồi bình luận từ phía Admin Shop.

### 3. Phân hệ Sanity Studio (CMS)

Truy cập tại URL: `/studio` (hoặc mở trực tiếp từ thanh công cụ Admin).

- **Cấu hình Thương hiệu & Doanh nghiệp**: Quản lý Logo (Sáng/Tối), Hotline, Email, Giờ làm việc, Thông tin pháp lý Doanh nghiệp.
- **Cấu hình Menu & MegaMenu**: Hỗ trợ Menu đa cấp, gán nhãn Badge ("Hot", "Mới"), nhúng banner quảng cáo ngay trong dropdown menu.
- **Điều hướng & SEO Redirects**: Quản lý các quy tắc chuyển hướng 301 / 302 tự động mà không cần can thiệp file cấu hình server.
- **Chế độ Bảo trì (Maintenance Mode)**: Kích hoạt chế độ bảo trì toàn trang tức thì chỉ bằng 1 nút gạt trong CMS.

### 4. Phân hệ Xác Thực (Authentication & Customer Portal)

- **Đăng nhập Google 1-Click (Google OAuth)** & Đăng nhập thông thường.
- Lưu trữ phiên đăng nhập bằng JWT có chữ ký số an toàn lưu trong Cookie `ecocros_session`.
- **Trang Khách hàng `/account`**:
  - Xem và cập nhật thông tin cá nhân (Họ tên, SĐT, Địa chỉ giao hàng mặc định).
  - Tra cứu toàn bộ lịch sử đơn hàng và trạng thái vận chuyển thời gian thực.
- **Danh sách Yêu thích `/wishlist`**:
  - Lưu sản phẩm yêu thích vào LocalStorage qua Zustand store, hỗ trợ tra cứu nhanh thông tin sản phẩm.

### 5. Phân hệ Marketing & Tương Tác

- **Popup Marketing Thông Minh (`PopupModal`)**:
  - Hỗ trợ Popup dạng Banner khuyến mãi hoặc Form thu thập Email/SĐT nhận Voucher giảm giá.
  - Tùy chỉnh điều kiện kích hoạt: Theo thời gian trễ (Delay seconds), Theo tỷ lệ cuộn trang (Scroll percentage), Giới hạn tần suất hiển thị (Frequency days).
- **Floating Contact & Chat Widget**:
  - Bộ nút liên hệ nổi góc màn hình hỗ trợ gọi Hotline, Zalo Chat, Facebook Messenger, Chatbot.
- **Hệ thống Tracking Scripts**:
  - Quản lý linh hoạt Google Tag Manager (GTM), Google Analytics 4 (GA4), Meta (Facebook) Pixel, TikTok Pixel với các chiến lược tải (`afterInteractive`, `lazyOnload`, `beforeInteractive`).

### 6. Phân hệ Theme & Design Tokens

Toàn bộ giao diện được điều khiển động từ Sanity Studio (`Theme & Design Tokens`):

- Tùy chỉnh bảng màu chính (`Primary Color`), màu nền (`Background`), màu chữ (`Foreground`), màu Header & Footer.
- Tùy chỉnh bán kính bo góc viền (`Border Radius`: 0px, 4px, 8px, 12px, 16px, 9999px).
- Tùy chỉnh Font chữ tiêu đề (`Heading Font`) và Font chữ nội dung (`Body Font`) từ thư viện Google Fonts (Plus Jakarta Sans, Inter, Roboto, Playfair Display, Montserrat...).
- Cơ chế `ThemeProvider` (`src/ui/theme-provider.tsx`) tự động chuyển đổi các cài đặt này thành CSS Variables chuẩn cấp phát cho Tailwind v4.

---

## 🛠️ Hướng Dẫn Phát Triển Module Mới

Khi cần tạo thêm một Block / Module mới vào hệ thống Page Builder, hãy thực hiện đúng 5 bước sau:

### Bước 1: Khai báo Schema Sanity
Tạo file `src/sanity/schemaTypes/modules/<ten-module>.ts`:
```ts
import { defineField, defineType } from 'sanity'
import { VscSymbolNamespace } from 'react-icons/vsc'

export default defineType({
  name: 'my-new-module',
  title: 'My New Module',
  type: 'object',
  icon: VscSymbolNamespace,
  fields: [
    defineField({
      name: 'title',
      title: 'Tiêu đề',
      type: 'string',
    }),
    defineField({
      name: 'description',
      title: 'Mô tả',
      type: 'text',
    }),
  ],
  preview: {
    select: { title: 'title' },
    prepare: ({ title }) => ({
      title: title || 'Chưa đặt tiêu đề',
      subtitle: 'My New Module',
    }),
  },
})
```

### Bước 2: Đăng ký Schema vào Index
Mở `src/sanity/schemaTypes/index.ts`:
- Import schema vừa tạo.
- Thêm vào mảng `types` trong đối tượng `schema`.

### Bước 3: Cập nhật GROQ Queries & Sinh Type
Mở `src/sanity/lib/queries.ts`, thêm projection cho module vào `MODULES_QUERY` (nếu cần lấy chi tiết ảnh/tham chiếu).
Sau đó chạy lệnh:
```bash
npm run typegen
```

### Bước 4: Tạo UI Component
Tạo file `src/ui/modules/my-new-module.tsx`:
```tsx
import { moduleAttributes, type ModuleProps } from './index'

type Props = ModuleProps & {
  title?: string
  description?: string
}

export default function MyNewModule({ title, description, ...props }: Props) {
  return (
    <section {...moduleAttributes(props)} className="py-12 px-4 max-w-7xl mx-auto">
      {title && <h2 className="text-2xl font-bold mb-4">{title}</h2>}
      {description && <p className="text-gray-600">{description}</p>}
    </section>
  )
}
```

### Bước 5: Đăng ký vào `ModulesResolver`
Mở `src/ui/modules/index.tsx`:
- Import component `MyNewModule`.
- Thêm `my-new-module: MyNewModule` vào đối tượng `MODULES_MAP`.

---

## 📋 Quy Chuẩn Code & Best Practices

1. **Phân Định Server vs Client Component**:
   - Mặc định giữ các file `page.tsx` và `layout.tsx` là **Server Components**.
   - Chỉ tách logic có tương tác (state, effects, event listener) ra file riêng và đặt tên theo quy tắc `*-client.tsx` có chỉ thị `'use client'`.

2. **Xử Lý Ảnh An Toàn với `urlFor()`**:
   - Luôn kiểm tra sự tồn tại của ảnh trước khi gọi `urlFor()` để tránh crash server:
   ```tsx
   // ❌ KHÔNG NÊN
   const imgUrl = urlFor(product.images[0]).url()

   // ✅ ĐÚNG CHUẨN
   const imgUrl = product.images?.[0]
     ? urlFor(product.images[0]).width(800).auto('format').url()
     : '/fallback-product.png'
   ```

3. **Tối Ưu Hiệu Năng & SEO**:
   - Sử dụng thẻ Next.js `Image` hoặc component `<Img />` có sẵn để tận dụng WebP/AVIF và Lazy Loading.
   - Thêm đầy đủ metadata OpenGraph và JSON-LD Schema (`OrganizationJsonLd`, `Product Schema`, `Article Schema`).

4. **Quản Lý Biến Thể & Giỏ Hàng**:
   - Luôn sử dụng hàm `updateVariant()` trong `useCartStore` khi người dùng thay đổi lựa chọn thuộc tính trong giỏ hàng để tránh phân mảnh dữ liệu.

---

## 📄 Bản Quyền & Giấy Phép

Phát triển bởi **DeanCore E-Commerce Team**. Được cấp phép sử dụng nội bộ cho dự án thương mại điện tử **ECOCROS**. Mọi quyền được bảo lưu © 2026.
