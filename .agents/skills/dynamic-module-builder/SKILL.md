---
name: dynamic-module-builder
description: Standard operating procedure and architectural guidelines for creating or upgrading dynamic modules in DEANFLOW. Enforces US Standard 3-Tab Sanity schemas, GROQ projection rules, and Presentation-Ready (Click-to-Edit, Stega-clean) Next.js 16/React 19/Tailwind v4 UI components using tiered-pricing as a reference.
argument-hint: "[module-name]"
license: MIT
metadata:
  author: deanflow
  version: "1.0.0"
---

# Dynamic Module Builder Guideline (DEANFLOW Standard)

Tài liệu hướng dẫn (Guideline) chuẩn hóa quy trình xây dựng mới hoặc nâng cấp một Dynamic Module trong hệ thống DEANFLOW (Next.js 16 App Router, React 19, Tailwind CSS v4, Sanity CMS v5). 

Hệ thống lấy module **Bảng giá sỉ phân tầng — Volume Pricing (`tiered-pricing`)** làm ví dụ thực tế xuyên suốt để minh họa cách đạt chuẩn **3-Tab (US Standard)** và **Sanity Presentation-Ready (Click-to-Edit)**.

---

## Khi nào kích hoạt Skill này (When to Activate)

- Khi phát triển một Dynamic Module mới trong `studio/src/sanity/schemaTypes/modules/` và `src/ui/modules/`.
- Khi nâng cấp hoặc refactor một Module hiện có để hỗ trợ Sanity Visual Editing (Click-to-Edit, Live Preview).
- Khi rà soát mã nguồn (code review) để đảm bảo chuẩn schema 3-Tab, chuẩn hóa US Market copywriting, và loại bỏ lỗi vỡ giao diện do ký tự ẩn Stega.

---

## Quy trình 5 bước kiến trúc DEANFLOW (5-Step Architectural Workflow)

Mọi module trong hệ thống DEANFLOW đều phải tuân thủ nghiêm ngặt chu trình 5 bước:

```text
[1. Sanity Schema]       studio/src/sanity/schemaTypes/modules/<module-name>.ts
        ↓
[2. Schema Registry]     studio/src/sanity/schemaTypes/index.ts
        ↓
[3. GROQ Fragment]       src/sanity/lib/queries.ts (MODULES_QUERY)
        ↓
[4. UI Component]        src/ui/modules/<module-name>/index.tsx
        ↓
[5. Module Resolver]     src/ui/modules/index.tsx (MODULES_MAP)
```

---

## PHẦN 1: QUY TẮC THIẾT KẾ SCHEMA TRONG SANITY STUDIO (CHUẨN 3-TAB & US MARKET)

Khi định nghĩa Schema cho một module mới, Developer bắt buộc tuân thủ 4 nguyên tắc tổ chức dữ liệu:

### 1. Khai báo cố định đúng 3 nhóm (Groups / Tabs)

Tuyệt đối không để các trường dữ liệu trôi nổi tự do và **không tạo quá 3 tab**. Mọi module đều phải khai báo 3 nhóm theo đúng thứ tự:

1. **Tab 1 — `content` (Content):** Mặc định mở khi vào module (`default: true`). Chỉ chứa nội dung chữ, hình ảnh, danh sách phần tử và nút bấm mà khách hàng nhìn thấy trực tiếp trên giao diện.
2. **Tab 2 — `design` (Design):** Chứa các tùy chọn bố cục thị giác, bảng màu nền, số cột và kiểu hiển thị.
3. **Tab 3 — `settings` (Settings):** Chứa các cấu hình kỹ thuật, điều kiện ẩn/hiện, mã định danh neo trang (`Anchor ID` / `attributes`), thiết lập SEO hoặc các logic chuyển đổi tự động.

```ts
// Cấu trúc chuẩn 3 nhóm
groups: [
  { name: 'content', title: 'Content', default: true },
  { name: 'design', title: 'Design' },
  { name: 'settings', title: 'Settings' },
],
```

---

### 2. Đặt tên Module và Nhãn trường (Field Labels) theo ngôn ngữ Marketing chuẩn Mỹ

- **Tuyệt đối tránh thuật ngữ lập trình:** Không dùng `Array`, `String`, `Object`, `Wrapper`, `Boolean`, `Data`. Hãy dùng từ ngữ thương mại ngắn gọn, tối đa từ 1 đến 3 từ cho mỗi nhãn.
- **Bắt buộc có Description giải thích CRO:** Mỗi trường cấu hình phức tạp phải đi kèm một dòng mô tả ngắn (`description`) giải thích tác dụng đối với tỷ lệ chuyển đổi hoặc hành vi người mua hàng B2B.

#### Bảng đối chiếu trường cho Module Volume Pricing (`tiered-pricing`):

| Tab | Tên trường (`name`) | Nhãn chuẩn US (`title`) | Kiểu dữ liệu | Mục đích chuyển đổi (CRO Description) |
| :--- | :--- | :--- | :--- | :--- |
| **Content** | `eyebrow` | Header Badge | `string` | Nhãn nhỏ định vị ưu đãi sỉ (VD: "B2B Volume Tier") |
| **Content** | `heading` | Main Headline | `string` | Tiêu đề chính nêu bật lợi ích kinh tế theo quy mô |
| **Content** | `subheading` | Subtitle & Logistics | `text` | Ghi chú điều kiện đóng gói & điều khoản vận chuyển (FOB/EXW) |
| **Content** | `tiers` | Pricing Tiers | `array` | Danh sách các nấc giá sỉ phân tầng theo MOQ |
| ↳ *Tier Item* | `minQty` | Min Order Quantity | `number` | Số lượng đặt hàng tối thiểu cho nấc giá này |
| ↳ *Tier Item* | `maxQty` | Max Quantity | `number` | Bỏ trống nếu là nấc không giới hạn số lượng |
| ↳ *Tier Item* | `unitPrice` | FOB Unit Price ($) | `number` | Đơn giá xuất xưởng theo đơn vị USD |
| ↳ *Tier Item* | `discountPercent` | Savings (% Off) | `number` | Tỷ lệ chiết khấu làm nổi bật mức tiết kiệm chi phí |
| ↳ *Tier Item* | `badge` | Highlight Tag | `string` | Nhãn thúc đẩy mua (VD: "Most Popular", "Best Value") |
| ↳ *Tier Item* | `isCustomQuote` | Enterprise Custom Quote | `boolean` | Chuyển nấc số lượng lớn thành thỏa thuận VIP riêng |
| **Content** | `ctaText` | Button Label | `string` | Lời kêu gọi hành động (VD: "Request Official Quotation") |
| **Content** | `ctaLink` | Button Link | `string` | Đường dẫn neo tới form nhận báo giá (VD: "#quote-form") |
| **Design** | `layoutStyle` | Layout Style | `string` | Chọn kiểu hiển thị `cards` (Thẻ) hoặc `table` (Bảng ngang) |
| **Design** | `highlightBestValue` | Emphasize Best Tier | `boolean` | Tự động làm nổi bật nấc có biên độ tiết kiệm cao nhất |
| **Design** | `colorTheme` | Section Background | `string` | Tone nền tích hợp: `default` (Trắng), `surface` (Xám nhạt), `brand` (Tông thương hiệu) |
| **Settings** | `defaultIncoterm` | Default Incoterm | `string` | Điều kiện thương mại quốc tế chuẩn (FOB, CIF, EXW, DDP) |
| **Settings** | `customQuoteThreshold`| Custom Quote Threshold | `number` | Ngưỡng số lượng tự động chuyển sang trạng thái liên hệ VIP |
| **Settings** | `attributes` | Module Attributes | `module-attributes` | Anchor ID (`#pricing`) và công tắc ẩn/hiện toàn module |

---

### 3. Phẳng hóa dữ liệu văn bản (Flat Text Structure)

- **Quy tắc bất di bất dịch:** Đối với phần mở đầu của bất kỳ module nào, **không** được dùng một khung soạn thảo văn bản lớn (Portable Text) để chứa chung cả tiêu đề lẫn đoạn mô tả.
- **Tách phẳng thành 3 trường độc lập:**
  1. `eyebrow` (`string`): Nhãn chữ ngắn phía trên.
  2. `heading` (`string`): Tiêu đề chính, ngắn gọn, súc tích.
  3. `subheading` (`text`, rows: 2 hoặc 3): Đoạn mô tả phụ trợ.

> **Lý do kỹ thuật:** Việc tách phẳng giúp công cụ Sanity Presentation nhận diện chính xác từng dòng chữ trên giao diện web. Marketer nhấp chuột vào đúng dòng nào là studio tự động highlight đúng ô nhập liệu của trường đó.

---

### 4. Thiết lập Preview thông minh chuẩn hóa (Centralized Module Preview Architecture)

Mọi module trong DEANFLOW bắt buộc sử dụng kiến trúc Preview tập trung (Centralized Preview Architecture) nhằm đảm bảo hiển thị đồng nhất 100% trên toàn bộ Sanity Studio & Page Builder.

1. **Cấp độ Module (Bắt buộc dùng `defineModulePreview`):**
   - **Tuyệt đối không tự viết `preview.prepare` thủ công** ở cấp độ module.
   - Luôn sử dụng helper dùng chung: `import { defineModulePreview } from '@/sanity/lib/define-module-preview'`.
   - Khai báo định danh trong từ điển thân thiện: `MODULE_FRIENDLY_NAMES` (`studio/src/sanity/lib/module-preview-config.ts`).
   - Định dạng Tiêu đề (Title) chuẩn hóa tự động:
     `[Friendly Module Name] - ${heading || title || 'Untitled'}`
   - Định dạng Phụ đề (Subtitle) chuẩn hóa tự động:
     `<Additional metadata>` (loại bỏ hoàn toàn mã kỹ thuật `Type: <name>`, hiển thị trực tiếp thông số như `3 columns | 4 rows`). Nếu không có metadata, subtitle được để trống giúp giao diện tối giản, sạch sẽ.
   - An toàn Media & Ảnh: Nếu module có trường ảnh (`imageField`), helper tự động kiểm tra tính hợp lệ của asset. Nếu thiếu ảnh, hiển thị `(No content)` trong phụ đề và fallback an toàn về `icon` của module mà không làm sập Studio khi biên tập draft.

2. **Cấp độ Phần tử mảng (Array Member):** Vẫn định nghĩa `preview.prepare` cục bộ cho từng phần tử con để hiển thị tóm tắt thông số (ví dụ: *"500 – 999 units: $14.20/unit"* thay vì chuỗi mặc định *"Item 1"*).

#### Code mẫu chuẩn: `studio/src/sanity/schemaTypes/modules/tiered-pricing.ts`

```ts
import { defineArrayMember, defineField, defineType } from 'sanity'
import { BillIcon } from '@sanity/icons'
import { defineModulePreview } from '@/sanity/lib/define-module-preview'

export default defineType({
	name: 'tiered-pricing',
	title: 'Volume Pricing (MOQ)',
	description: 'Wholesale tiered pricing table and MOQ volume discount matrix.',
	type: 'object',
	icon: BillIcon,
	groups: [
		{ name: 'content', title: 'Content', default: true },
		{ name: 'design', title: 'Design' },
		{ name: 'settings', title: 'Settings' },
	],
	fields: [
		// TAB 1: CONTENT
		defineField({
			name: 'eyebrow',
			title: 'Header Badge',
			description: 'Small uppercase tag displayed above the title (e.g., Wholesale Matrix).',
			type: 'string',
			initialValue: 'B2B Wholesale & Volume Discounts',
			group: 'content',
		}),
		defineField({
			name: 'heading',
			title: 'Main Headline',
			description: 'Primary title emphasizing economies of scale.',
			type: 'string',
			initialValue: 'Transparent Volume-Based Pricing',
			validation: (Rule) => Rule.required().error('Headline is required for conversion.'),
			group: 'content',
		}),
		defineField({
			name: 'subheading',
			title: 'Subtitle & Logistics Note',
			description: 'Context on shipping terms, export packaging, or factory lead times.',
			type: 'text',
			rows: 2,
			initialValue: 'Higher order quantities unlock superior manufacturing cost advantages. Standard export packaging included.',
			group: 'content',
		}),
		defineField({
			name: 'tiers',
			title: 'Pricing Tiers',
			description: 'Ordered volume tiers from smallest to largest order quantity.',
			type: 'array',
			group: 'content',
			of: [
				defineArrayMember({
					name: 'tierItem',
					title: 'Pricing Tier',
					type: 'object',
					fields: [
						defineField({
							name: 'minQty',
							title: 'Min Order Quantity',
							type: 'number',
							validation: (Rule) => Rule.required().min(1),
						}),
						defineField({
							name: 'maxQty',
							title: 'Max Quantity (Blank for Unlimited)',
							type: 'number',
						}),
						defineField({
							name: 'unitPrice',
							title: 'Unit Price (USD)',
							type: 'number',
						}),
						defineField({
							name: 'discountPercent',
							title: 'Savings Percent (% Off)',
							type: 'number',
						}),
						defineField({
							name: 'badge',
							title: 'Highlight Tag (e.g., Most Popular)',
							type: 'string',
						}),
						defineField({
							name: 'isCustomQuote',
							title: 'Require VIP Custom Quotation',
							description: 'Enable for large volumes that require custom tooling or direct quote.',
							type: 'boolean',
							initialValue: false,
						}),
					],
					preview: {
						select: {
							minQty: 'minQty',
							maxQty: 'maxQty',
							unitPrice: 'unitPrice',
							isCustomQuote: 'isCustomQuote',
						},
						prepare({ minQty, maxQty, unitPrice, isCustomQuote }) {
							const range = maxQty ? `${minQty?.toLocaleString()} – ${maxQty?.toLocaleString()} units` : `${minQty?.toLocaleString()}+ units`
							const price = isCustomQuote ? 'VIP Custom Quote' : `$${unitPrice ?? 0}/unit`
							return {
								title: `${range}: ${price}`,
							}
						},
					},
				}),
			],
		}),
		defineField({
			name: 'ctaText',
			title: 'Button Label',
			type: 'string',
			initialValue: 'Request Official Quotation (RFQ)',
			group: 'content',
		}),
		defineField({
			name: 'ctaLink',
			title: 'Button Link',
			type: 'string',
			initialValue: '#lead-form',
			group: 'content',
		}),

		// TAB 2: DESIGN
		defineField({
			name: 'layoutStyle',
			title: 'Layout Style',
			description: 'Visual arrangement format for tiers.',
			type: 'string',
			options: {
				list: [
					{ title: 'Interactive Cards Grid', value: 'cards' },
					{ title: 'Comparison Data Table', value: 'table' },
				],
				layout: 'radio',
			},
			initialValue: 'cards',
			group: 'design',
		}),
		defineField({
			name: 'highlightBestValue',
			title: 'Emphasize Best Value Tier',
			description: 'Applies primary border and subtle background elevation to the tier with the highest discount.',
			type: 'boolean',
			initialValue: true,
			group: 'design',
		}),
		defineField({
			name: 'colorTheme',
			title: 'Section Background',
			description: 'Embedded surface theme for this section.',
			type: 'string',
			options: {
				list: [
					{ title: 'Default (Pure White)', value: 'default' },
					{ title: 'Muted Surface (Neutral Tint)', value: 'surface' },
					{ title: 'Brand Accent Tint', value: 'brand' },
				],
			},
			initialValue: 'default',
			group: 'design',
		}),

		// TAB 3: SETTINGS
		defineField({
			name: 'defaultIncoterm',
			title: 'Default Incoterm',
			description: 'Standard international trade term applied across the pricing table.',
			type: 'string',
			options: {
				list: [
					{ title: 'FOB (Free On Board)', value: 'FOB' },
					{ title: 'EXW (Ex Works)', value: 'EXW' },
					{ title: 'CIF (Cost, Insurance & Freight)', value: 'CIF' },
					{ title: 'DDP (Delivered Duty Paid)', value: 'DDP' },
				],
			},
			initialValue: 'FOB',
			group: 'settings',
		}),
		defineField({
			name: 'customQuoteThreshold',
			title: 'Custom Quote Threshold (Units)',
			description: 'Quantities at or above this number automatically trigger custom RFQ mode.',
			type: 'number',
			group: 'settings',
		}),
		defineField({
			name: 'attributes',
			title: 'Module Attributes',
			type: 'module-attributes',
			group: 'settings',
		}),
	],
	preview: defineModulePreview({
		schemaName: 'tiered-pricing',
		icon: BillIcon,
		titleFields: ['headline', 'badge'],
		select: {
			tiers: 'tiers',
			currency: 'currency',
			badge: 'badge',
		},
		metadata: (doc) => [
			doc.badge || null,
			doc.tiers?.length ? `${doc.tiers.length} tiers` : null,
			doc.currency ? `Currency: ${doc.currency}` : null,
		],
	}),
})
```
```

### 5. Kiến trúc Khởi tạo Dữ liệu Tam Giác Vàng (3-Tier Initializer & Empty-State)

Để giải quyết triệt để vấn đề "Màn hình trắng" (Blank Preview) khi Marketer vừa nhấn Add Module mà vẫn đảm bảo an toàn dữ liệu, hệ thống áp dụng mô hình 3 tầng:

1. **Tier 1 (Scalar Fields):** Bắt buộc có `initialValue` cho các trường phẳng (`badge`, `headline`, `ctaText`, `ctaLink`, `layout`). Giúp tiêu đề xuất hiện ngay lập tức trên Live Preview.
2. **Tier 2 (Internal Struct Arrays):** Sử dụng hàm sinh key ngẫu nhiên `initialValue: () => ({ ... })` cho các module có mảng con nội bộ (`accordion-list`, `step-list`, `stat-list`, `card-list`, `tiered-pricing`, `comparison-table`).
   * **Bắt buộc:** Mỗi phần tử con phải có `_key: Math.random().toString(36).substring(2, 9)` để triệt tiêu hoàn toàn lỗi *Duplicate Key Collision* khi kéo nhiều khối cùng loại vào 1 trang.
3. **Tier 3 (Reference & Media Empty-States):** Với các module phụ thuộc document ngoài (`person-list`, `logo-list`, `carousel-banner-list`, `quote-list`), nếu mảng rỗng thì component UI render **Dashed Placeholder Box** (khung nét đứt bo tròn kèm icon và chỉ dẫn).
   * Vừa triệt tiêu lỗi trắng màn hình, vừa cung cấp điểm neo cho con trỏ Sanity Presentation click-to-edit.

---

## PHẦN 2: QUY TẮC TRUY VẤN DỮ LIỆU (GROQ QUERY)

Khi viết câu lệnh lấy dữ liệu cho module để truyền xuống giao diện Next.js, Developer cần tuân thủ 2 nguyên tắc sống còn:

### 1. Luôn lấy đầy đủ thông tin định danh gốc (`_id`, `_type`, `_key`)

- **Bắt buộc:** Khối truy vấn cha phải giữ nguyên `_type` và `_key` của module.
- Mọi mảng phần tử con (như `tiers[]`) bắt buộc phải lấy kèm `_key`. Nếu thiếu `_key`, tính năng Click-to-Edit và Visual Editing Overlays sẽ **hoàn toàn mất khả năng ánh xạ**, không thể xác định con trỏ chuột đang click vào nấc giá nào.

### 2. Không biến đổi hoặc nối chuỗi dữ liệu trong GROQ

- **Lấy dữ liệu thô nguyên bản:** Giữ nguyên số thực `12.5` cho `unitPrice`, chuỗi `'FOB'` cho `defaultIncoterm`.
- **Tuyệt đối không:** Dùng hàm nối chuỗi trong GROQ như `'$' + string(unitPrice) + ' / unit'`. Ký tự mã hóa Stega ẩn được nhúng vào chuỗi thô từ Sanity, nếu biến đổi trong GROQ sẽ làm hỏng Stega hoặc gây sai lệch định dạng. Việc định dạng tiền tệ và đơn vị luôn thực hiện an toàn ở tầng UI.

#### Code mẫu GROQ Fragment trong `src/sanity/lib/queries.ts`:

```groq
// Trong MODULES_QUERY fragment:
export const MODULES_QUERY = groq`
  ...,
  _type == 'tiered-pricing' => {
    ...,
    tiers[]{
      _key,
      minQty,
      maxQty,
      unitPrice,
      discountPercent,
      badge,
      isCustomQuote
    }
  },
`
```

---

## PHẦN 3: QUY TẮC XÂY DỰNG GIAO DIỆN ĐẠT CHUẨN PRESENTATION-READY (CLICK-TO-EDIT)

Để Marketer mở công cụ Sanity Presentation lên, rê chuột vào từng ô giá, từng tiêu đề hay từng nút bấm trên trang web và nhấp chuột là khung chỉnh sửa bên Studio tự động nhảy tới đúng trường dữ liệu đó, Developer phải thực hiện 4 bước sau:

### 1. Gắn thuộc tính định danh dữ liệu (`data-sanity`) cho khung bao ngoài và từng phần tử mảng

1. **Khung bao ngoài (Section Wrapper):** `ModulesResolver` tại `src/ui/modules/index.tsx` tự động truyền thuộc tính `data-sanity` chứa đường dẫn tới module (dựa vào `_key`). Component phải nhận prop này và gắn lên thẻ `<section>` ngoài cùng.
2. **Từng phần tử mảng con:** Sử dụng tiện ích `createDataAttribute` từ `next-sanity` để mở rộng đường dẫn tới từng phần tử mảng `tiers[_key=="${tier._key}"]`. Điều này cho phép:
   - Marketer nhấp thẳng vào một nấc giá để sửa.
   - Thao tác kéo thả đổi thứ tự nấc giá ngay trên Preview.
   - Nhân bản (Duplicate) hoặc Xóa (Delete) nấc giá từ thanh công cụ trực quan.

### 2. Làm sạch ký tự ẩn (`stegaClean`) cho các biến điều khiển giao diện và phép tính

Sanity chèn các ký tự Unicode vô hình (Stega) vào các chuỗi dữ liệu để theo dõi vị trí nguồn. Nếu lấy trực tiếp các chuỗi từ tab **Design** hoặc **Settings** để so sánh `if/switch` hoặc ghép CSS class, ký tự ẩn sẽ làm sai lệch điều kiện hoàn toàn!

```ts
import { stegaClean } from 'next-sanity'

// SAI — Gây lỗi logic vì theme có chứa ký tự ẩn
if (colorTheme === 'brand') { ... }

// ĐÚNG — Làm sạch ký tự ẩn trước khi so sánh điều kiện hoặc ghép class
const cleanTheme = stegaClean(colorTheme) || 'default'
const cleanLayout = stegaClean(layoutStyle) || 'cards'
const cleanAnchor = stegaClean(attributes?.uid)
```

#### Cấu hình bộ lọc Stega tại `src/sanity/lib/client.ts`:

Cấu hình bộ lọc ở tầng Sanity Client để tự động bỏ qua ký tự ẩn cho các trường thuộc tab Design/Settings:

```ts
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '../env'

export const client = createClient({
	projectId,
	dataset,
	apiVersion,
	useCdn: true,
	stega: {
		studioUrl: '/admin',
		filter: (props) => {
			// Không nhúng ký tự ẩn vào các trường điều khiển layout / logic
			const technicalFields = ['layoutStyle', 'colorTheme', 'defaultIncoterm', 'uid', 'hidden']
			const fieldName = props.sourcePath.at(-1)
			if (typeof fieldName === 'string' && technicalFields.includes(fieldName)) {
				return false
			}
			return props.filterDefault(props)
		},
	},
})
```

---

### 3. Giữ nguyên tính nguyên vẹn của thẻ văn bản

- Không gọi `.toUpperCase()`, `.toLowerCase()`, `.slice()` hoặc nối chuỗi bằng JavaScript trên các trường hiển thị trực tiếp (`eyebrow`, `heading`, `subheading`).
- **Muốn viết hoa:** Dùng class Tailwind `uppercase tracking-wider`.
- **Muốn thêm ký hiệu tiền tệ hoặc đơn vị:** Đặt trong các thẻ `<span>` riêng biệt thay vì ghép chuỗi:

```tsx
{/* ĐÚNG: Tách thẻ riêng, bảo toàn chuỗi giá thô cho Sanity Visual Editing */}
<div className="flex items-baseline gap-1">
  <span className="text-xl font-bold text-gray-500">$</span>
  <span className="text-3xl font-extrabold text-gray-900">{tier.unitPrice}</span>
  <span className="text-xs text-gray-500 font-medium">/ unit ({cleanIncoterm})</span>
</div>
```

---

### 4. Vô hiệu hóa các hiệu ứng chuyển động gây cản trở khi ở chế độ chỉnh sửa

Khi mở trang trong Presentation Mode (Live Visual Editing):
- Tắt hiệu ứng cuộn tự động (carousel autoplay, ticker chạy chữ).
- Dừng hiệu ứng đếm số nhảy giây liên tục (countdown timers).
- Hiển thị tĩnh các thành phần vốn bị ẩn theo thao tác cuộn (như sticky CTA bar, floating drawer) để Editor luôn nhìn thấy và nhấp chuột chỉnh sửa được ngay.

---

### Component UI hoàn chỉnh: `src/ui/modules/tiered-pricing/index.tsx`

```tsx
'use client'

import Link from 'next/link'
import { useState } from 'react'
import { createDataAttribute, stegaClean } from 'next-sanity'
import { HiOutlineCheckCircle, HiOutlineSparkles, HiOutlineBuildingStorefront } from 'react-icons/hi2'
import { formatPrice } from '@/lib/utils'

export type TierItem = {
	_key?: string
	minQty: number
	maxQty?: number
	unitPrice?: number
	discountPercent?: number
	badge?: string
	isCustomQuote?: boolean
}

export type TieredPricingProps = {
	_key?: string
	_type?: string
	eyebrow?: string
	heading?: string
	subheading?: string
	tiers?: TierItem[]
	ctaText?: string
	ctaLink?: string
	layoutStyle?: 'cards' | 'table'
	highlightBestValue?: boolean
	colorTheme?: 'default' | 'surface' | 'brand'
	defaultIncoterm?: string
	customQuoteThreshold?: number
	attributes?: {
		uid?: string
		hidden?: boolean
	}
	'data-sanity'?: string
}

export default function TieredPricingModule(props: TieredPricingProps) {
	const {
		_key,
		eyebrow = 'B2B Wholesale & Volume Discounts',
		heading = 'Transparent Volume-Based Pricing',
		subheading = 'Higher order quantities unlock superior manufacturing cost advantages. Standard export packaging included.',
		tiers = [],
		ctaText = 'Request Official Quotation (RFQ)',
		ctaLink = '#lead-form',
		layoutStyle = 'cards',
		highlightBestValue = true,
		colorTheme = 'default',
		defaultIncoterm = 'FOB',
		customQuoteThreshold,
		attributes,
		'data-sanity': sanityAttr,
	} = props

	// 1. Stega-clean all logic & style variables
	const cleanLayout = stegaClean(layoutStyle) || 'cards'
	const cleanTheme = stegaClean(colorTheme) || 'default'
	const cleanIncoterm = stegaClean(defaultIncoterm) || 'FOB'
	const cleanAnchor = stegaClean(attributes?.uid) || (_key ? `pricing-${_key}` : undefined)

	const [selectedMinQty, setSelectedMinQty] = useState<number | null>(
		tiers && tiers.length > 0 ? tiers[0].minQty : null,
	)

	if (!tiers || tiers.length === 0) return null

	// 2. Resolve background styling safely
	const themeBgClass = {
		default: 'bg-white text-gray-900',
		surface: 'bg-gray-50 text-gray-900',
		brand: 'bg-primary/5 text-gray-900 border-y border-primary/10',
	}[cleanTheme] || 'bg-white text-gray-900'

	// Determine best value tier index
	const bestValueIndex = highlightBestValue
		? tiers.reduce((maxIdx, curr, idx, arr) => 
			(curr.discountPercent ?? 0) > (arr[maxIdx]?.discountPercent ?? 0) ? idx : maxIdx, 0)
		: -1

	return (
		<section
			id={cleanAnchor}
			data-sanity={sanityAttr}
			className={`section py-12 lg:py-16 ${themeBgClass} transition-colors`}
		>
			<div className="container mx-auto max-w-5xl px-4">
				{/* Header Area (Flat text representation) */}
				<div className="text-center max-w-2xl mx-auto mb-10">
					{eyebrow && (
						<div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-3">
							<HiOutlineSparkles className="text-sm" />
							<span>{eyebrow}</span>
						</div>
					)}
					{heading && (
						<h2 className="text-2xl lg:text-3xl font-extrabold text-gray-900 tracking-tight">
							{heading}
						</h2>
					)}
					{subheading && (
						<p className="mt-2 text-sm text-gray-600 leading-relaxed">{subheading}</p>
					)}
				</div>

				{/* Cards Layout */}
				{cleanLayout === 'cards' && (
					<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
						{tiers.map((tier, idx) => {
							const isSelected = selectedMinQty === tier.minQty
							const isBestValue = idx === bestValueIndex
							const isCustom = tier.isCustomQuote || 
								(Boolean(customQuoteThreshold) && tier.minQty >= (customQuoteThreshold ?? Infinity))

							const rangeLabel = tier.maxQty
								? `${tier.minQty.toLocaleString()} – ${tier.maxQty.toLocaleString()} pcs`
								: `${tier.minQty.toLocaleString()}+ pcs`

							// Child sub-path for Sanity Visual Editing Click-to-Edit
							const tierSanityAttr = sanityAttr && tier._key 
								? `${sanityAttr}.tiers[_key=="${tier._key}"]` 
								: undefined

							return (
								<div
									key={tier._key || idx}
									data-sanity={tierSanityAttr}
									onClick={() => setSelectedMinQty(tier.minQty)}
									className={`relative flex flex-col justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${
										isSelected
											? 'border-primary bg-primary/[0.02] shadow-lg scale-[1.01]'
											: isBestValue
											? 'border-primary/50 bg-white hover:border-primary shadow-sm'
											: 'border-gray-200 bg-white hover:border-gray-300 shadow-xs'
									}`}
								>
									{/* Tag / Badge */}
									{(tier.badge || (isBestValue && !tier.badge)) && (
										<div className="absolute -top-3 left-6 px-3 py-0.5 rounded-full bg-primary text-white text-[11px] font-bold shadow-xs">
											{tier.badge || 'Best Value'}
										</div>
									)}

									<div>
										<div className="flex items-center justify-between mb-3">
											<span className="text-xs font-bold uppercase tracking-wider text-gray-500">
												Volume Tier #{idx + 1}
											</span>
											{Boolean(tier.discountPercent && tier.discountPercent > 0) && (
												<span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[11px] font-bold">
													Save {tier.discountPercent}%
												</span>
											)}
										</div>

										<p className="text-lg font-black text-gray-900 mb-1">{rangeLabel}</p>

										<div className="flex items-baseline gap-1 my-3">
											{isCustom ? (
												<span className="text-2xl font-black text-primary">
													VIP Custom Quote
												</span>
											) : (
												<>
													<span className="text-3xl font-extrabold text-gray-900">
														{formatPrice(tier.unitPrice ?? 0)}
													</span>
													<span className="text-xs text-gray-500 font-medium">
														/ unit ({cleanIncoterm})
													</span>
												</>
											)}
										</div>

										<ul className="space-y-2 mt-4 text-xs text-gray-600 border-t border-gray-100 pt-4">
											<li className="flex items-center gap-2">
												<HiOutlineCheckCircle className="text-emerald-500 text-sm flex-none" />
												<span>Standard sea-worthy export packaging</span>
											</li>
											<li className="flex items-center gap-2">
												<HiOutlineCheckCircle className="text-emerald-500 text-sm flex-none" />
												<span>Quality inspection report & CoO certification</span>
											</li>
											{isCustom && (
												<li className="flex items-center gap-2 font-semibold text-primary">
													<HiOutlineBuildingStorefront className="text-sm flex-none" />
													<span>Dedicated factory line & custom mold tooling</span>
												</li>
											)}
										</ul>
									</div>

									<div className="mt-6 pt-4 border-t border-gray-100">
										<Link
											href={ctaLink || '#lead-form'}
											className={`w-full py-2.5 px-4 rounded-xl text-center text-xs font-bold transition flex items-center justify-center ${
												isSelected
													? 'bg-primary text-white shadow-md hover:opacity-90'
													: 'bg-gray-100 hover:bg-gray-200 text-gray-800'
											}`}
										>
											{isCustom ? 'Inquire VIP Rate' : ctaText}
										</Link>
									</div>
								</div>
							)
						})}
					</div>
				)}

				{/* Table Layout Alternative */}
				{cleanLayout === 'table' && (
					<div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-xs">
						<table className="w-full text-left text-sm">
							<thead className="bg-gray-50 border-b border-gray-200 text-xs font-bold uppercase text-gray-500">
								<tr>
									<th className="px-6 py-4">Quantity Tier</th>
									<th className="px-6 py-4">FOB Unit Price</th>
									<th className="px-6 py-4">Savings</th>
									<th className="px-6 py-4 text-right">Action</th>
								</tr>
							</thead>
							<tbody className="divide-y divide-gray-100">
								{tiers.map((tier, idx) => {
									const isCustom = tier.isCustomQuote || 
										(Boolean(customQuoteThreshold) && tier.minQty >= (customQuoteThreshold ?? Infinity))
									const tierSanityAttr = sanityAttr && tier._key 
										? `${sanityAttr}.tiers[_key=="${tier._key}"]` 
										: undefined

									return (
										<tr key={tier._key || idx} data-sanity={tierSanityAttr} className="hover:bg-gray-50/50">
											<td className="px-6 py-4 font-bold text-gray-900">
												{tier.maxQty 
													? `${tier.minQty.toLocaleString()} – ${tier.maxQty.toLocaleString()} pcs` 
													: `${tier.minQty.toLocaleString()}+ pcs`}
											</td>
											<td className="px-6 py-4">
												{isCustom ? (
													<span className="font-bold text-primary">Custom Quote</span>
												) : (
													<span>{formatPrice(tier.unitPrice ?? 0)} <span className="text-xs text-gray-400">({cleanIncoterm})</span></span>
												)}
											</td>
											<td className="px-6 py-4 text-emerald-600 font-semibold">
												{tier.discountPercent ? `${tier.discountPercent}% OFF` : '—'}
											</td>
											<td className="px-6 py-4 text-right">
												<Link
													href={ctaLink || '#lead-form'}
													className="inline-flex px-3 py-1.5 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90"
												>
													RFQ
												</Link>
											</td>
										</tr>
									)
								})}
							</tbody>
						</table>
					</div>
				)}
			</div>
		</section>
	)
}
```

---

## PHẦN 4: HỆ THỐNG 21 DYNAMIC MODULES CHÍNH THỨC (US CATALOG)

Hệ thống DEANFLOW chuẩn hóa cố định **21 Modules động** chia đều vào 3 phân nhóm chiến lược:

| Phân nhóm | Mã Module (`_type`) | Tiêu đề Chuẩn US (`title`) | Mục đích & Vai trò CRO |
| :--- | :--- | :--- | :--- |
| **Commerce & Conversion** | `product-list` | **Product Showcase** | Trưng bày bộ sưu tập sản phẩm kèm bộ lọc danh mục và touch slider |
| | `tiered-pricing` | **Volume Pricing (MOQ)** | Bảng chiết khấu số lượng sỉ và đơn giá FOB xuất khẩu chuẩn B2B |
| | `compliance-vault` | **Trust & Compliance Vault** | Trưng bày chứng nhận quốc tế (FDA, SGS) và kho tài liệu mật tải PDF |
| | `countdown-banner` | **Urgency Timer** | Bộ đếm ngược tạo sự cấp bách với CTA đặt hàng tức thì |
| | `sticky-mobile-cta` | **Sticky Buy Bar** | Thanh ghim đáy chốt đơn điện thoại kèm hotline/WhatsApp và CTA |
| | `lead-capture-form` | **RFQ & Lead Form** | Biểu mẫu nhận báo giá sỉ với các trường tùy biến và webhook CRM |
| | `social-proof` | **Verified Reviews** | Chỉ số uy tín và đánh giá thực tế của khách hàng có Verified Badge |
| **Story & Layout** | `hero.split` | **Split Hero** | Khối mở đầu trang 2 cột nổi bật với headline, CTA và hình ảnh lớn |
| | `card-list` | **Feature Grid** | Lưới thẻ tính năng làm nổi bật điểm mạnh sản phẩm/dịch vụ |
| | `step-list` | **Process Steps** | Quy trình từng bước đánh số kèm Schema.org HowTo cho Google SEO |
| | `carousel-banner-list` | **Media Slider** | Banner trượt hình ảnh chất lượng cao kèm điều hướng responsive |
| | `prose` | **Editorial Story** | Bài viết biên tập chuyên sâu dài tập chuẩn báo chí thương mại |
| | `callout` | **Promo Callout** | Hộp thông báo nổi bật có viền màu bên trái và nút kêu gọi hành động |
| | `comparison-table` | **Us vs. Them Comparison** | Bảng so sánh đối đầu trực diện giữa DEANFLOW và đối thủ/nhựa truyền thống |
| **Trust & Utilities** | `quote-list` | **Wall of Love** | Trích dẫn đánh giá của báo chí (Forbes, Vogue) và chuyên gia uy tín |
| | `logo-list` | **Logo Marquee** | Dải logo đối tác/khách hàng chạy chữ marquee vô tận chống chóng mặt |
| | `stat-list` | **Impact Metrics** | Thẻ Bento số liệu quy mô sản lượng, thị phần và thành tựu doanh nghiệp |
| | `accordion-list` | **FAQ Drawer** | Danh sách câu hỏi đáp đóng mở với icon Chevron và Schema.org FAQ |
| | `person-list` | **Leadership & Experts** | Hồ sơ ban lãnh đạo và chuyên gia kèm chức danh, bio và LinkedIn |
| | `blog-post-list` | **Content Hub / Insights** | Lưới bài viết củng cố topical authority và liên kết nội bộ SEO |
| | `custom-html` | **Code & App Embed** | Nhúng mã HTML, iframe Typeform/Calendly hoặc widget bên thứ 3 |

---

## PHẦN 5: TIÊU CHUẨN UX/UI PRO MAX BẮT BUỘC CHO MỌI MODULE

Mọi component UI trong `src/ui/modules/` bắt buộc phải đáp ứng 6 tiêu chuẩn UX/UI Pro Max:

1. **No Emoji as Structural Icons (100% Vector SVG):**
   - Tuyệt đối không dùng emoji (⚡, 🔥, 🔒, ⭐) làm icon trong nhãn, badge, hay nút bấm.
   - Luôn sử dụng icon vector SVG chuẩn từ `react-icons/fi` (Feather/Lucide) hoặc `@phosphor-icons/react` với nét vẽ 1.5px/2px đồng nhất.
2. **Dark Mode Contrast Parity (WCAG 2.1 AA):**
   - Không hardcode `bg-white` hoặc màu cố định. Sử dụng semantic token `bg-surface border-border/60 dark:bg-zinc-900/50`.
   - Bắt buộc gắn `dark:prose-invert max-w-none` cho mọi thẻ chứa `<PortableText>`.
   - Độ tương phản chữ chính đạt tối thiểu `4.5:1` và chữ phụ tối thiểu `3:1` trên cả 2 chế độ sáng và tối.
3. **Touch Target Size >= 44×44px (Apple HIG & Android M3):**
   - Mọi nút bấm CTA, thẻ tag, ô nhập input, mũi tên slider và summary câu hỏi FAQ phải có chiều cao tối thiểu `min-h-[44px]`.
4. **Safe Area & Content Collision Prevention:**
   - Mọi phần tử cố định đáy (như `Sticky Buy Bar`) phải tôn trọng `env(safe-area-inset-bottom)`.
   - Trang có module ghim đáy bắt buộc có lớp đệm đáy bù trừ (`pb-24 lg:pb-0`) để không che khuất nút gửi form hoặc footer.
5. **Zero Layout Shift (CLS) & Performance:**
   - Mọi con số đếm động hoặc đồng hồ đếm ngược phải dùng font số cố định độ rộng: `font-mono tabular-nums`.
   - Dải chạy chữ `logo-list` bắt buộc có `@media (prefers-reduced-motion: reduce)` để người dùng nhạy cảm chuyển động có thể dừng marquee.
6. **Equal Card Heights & Visual Rhythm (8dp Grid):**
   - Các card trong grid phải dùng Flexbox `h-full flex flex-col justify-between` để chiều cao bằng nhau tuyệt đối.
   - Phân cấp khoảng cách theo nhịp 4/8dp chuẩn quốc tế (ví dụ: gap-4, gap-6, py-12, py-16).

---

## PHẦN 6: CHECKLIST NGHIỆM THU MODULE (DEFINITION OF DONE)

Trước khi bàn giao bất kỳ module nào vào nhánh chính (main/production), Developer bắt buộc tự kiểm tra qua bảng 8 tiêu chí nghiệm thu sau:

| STT | Hạng mục kiểm tra | Tiêu chí đạt (Pass Criteria) | Trạng thái |
| :---: | :--- | :--- | :---: |
| **1** | **Chuẩn Studio 3-Tabs** | Studio hiển thị đúng 3 tab: `Content`, `Design`, `Settings`. Không có tab thứ 4. Nhãn tiếng Anh chuẩn thương mại Mỹ (1–3 từ). | [ ] |
| **2** | **Phẳng hóa tiêu đề** | Tab Content tách riêng tiêu đề rõ ràng, không gộp rườm rà vào Portable Text lớn. | [ ] |
| **3** | **Visual Edit Hover & Focus** | Sanity Presentation: Rê chuột lên tiêu đề, nút bấm hay nấc giá con đều hiện khung viền xanh chính xác. Click vào nhảy đúng ô input. | [ ] |
| **4** | **Stega & Dynamic Controls** | Chuyển đổi qua lại giữa Layout, Theme trong Visual Editing: Giao diện cập nhật tức thì mà không bị lỗi chuỗi do ký tự ẩn Stega. | [ ] |
| **5** | **No Emoji in UI** | 100% icons là Vector SVG, không tồn tại emoji trong badge/nút bấm/copywriting. | [ ] |
| **6** | **Dark Mode WCAG Contrast** | Kiểm tra chế độ tối: Không có mảng trắng chói lóa, chữ không bị chìm, có đủ `dark:prose-invert`. | [ ] |
| **7** | **Touch Targets >= 44px** | Toàn bộ nút bấm, tag, summary FAQ trên mobile đạt kích thước chạm tối thiểu 44×44px. | [ ] |
| **8** | **Type-Check Sạch 100%** | Chạy `npx tsc --noEmit` đạt 0 lỗi cảnh báo. | [ ] |

---

## Lệnh xác thực chất lượng mã nguồn (Verification Commands)

Sau khi hoàn thiện code schema và component, chạy tuần tự các lệnh sau trong terminal:

```bash
# 1. Kiểm tra type safety trong toàn dự án
npx tsc --noEmit

# 2. Sinh type tự động từ Sanity Schema (nếu cần cập nhật sanity/types.ts)
npx sanity typegen generate
```
