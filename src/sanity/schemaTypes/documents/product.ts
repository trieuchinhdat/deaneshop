import { defineArrayMember, defineField, defineType } from 'sanity'
import {
	EditIcon,
	ErrorScreenIcon,
	HomeIcon,
	ImageIcon,
	SearchIcon,
} from '@sanity/icons'
import { FiFilm, FiImage, FiPlay, FiStar } from 'react-icons/fi'
import { VscEyeClosed } from 'react-icons/vsc'
import VariantGeneratorInput from '../../ui/variant-generator-input'
import modules from '../fragments/modules'

export default defineType({
	name: 'product',
	title: 'Product',
	type: 'document',

	groups: [
		{ name: 'content', title: 'Content & Pricing', default: true },
		{ name: 'variants', title: 'Variants' },
		{ name: 'promotion', title: 'Promotions & Deals' },
		{ name: 'metadata', title: 'SEO & Metadata' },
	],

	fieldsets: [
		{
			name: 'priceRow',
			title: 'Price',
			options: { columns: 3 },
		},
		{
			name: 'skuStockRow',
			title: 'SKU & Stock',
			options: { columns: 2 },
		},
	],
	fields: [
		defineField({
			name: 'title',
			type: 'string',
			group: 'content',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'description',
			type: 'array',
			of: [
				{ type: 'block' },
				defineArrayMember({
					type: 'image',
					icon: ImageIcon,
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					fields: [
						defineField({
							name: 'alt',
							type: 'string',
						}),
						defineField({
							name: 'figcaption',
							type: 'array',
							of: [
								{
									type: 'block',
									styles: [{ title: 'Normal', value: 'normal' }],
								},
							],
						}),
					],
				}),
				{ type: 'custom-html' },
				{ type: 'affiliateLink' },
			],
			group: 'content',
		}),

		defineField({
			name: 'images',
			title: 'Product Media (Ảnh & Video)',
			description:
				'Tải lên danh sách hình ảnh hoặc video sản phẩm (File MP4 hoặc link YouTube/TikTok). Kích thước ảnh khuyên dùng: Vuông 1:1 (800x800px), dung lượng < 500KB.',
			type: 'array',
			group: 'content',
			of: [
				defineArrayMember({
					type: 'image',
					options: {
						hotspot: true,
						metadata: ['lqip'],
					},
					preview: {
						select: {
							title: 'alt',
							media: 'asset',
						},
						prepare({ title, media }) {
							return {
								title: title || 'Product Image',
								media: media || FiImage,
							}
						},
					},
				}),
				defineArrayMember({
					type: 'file',
					name: 'video',
					title: 'Video sản phẩm (File MP4/WebM)',
					icon: FiFilm,
					options: {
						accept: 'video/*',
					},
					fields: [
						defineField({
							name: 'alt',
							title: 'Tiêu đề / Chú thích Video',
							type: 'string',
						}),
					],
					preview: {
						select: {
							title: 'alt',
						},
						prepare({ title }) {
							return {
								title: title || 'Product Video (File)',
								media: FiFilm,
							}
						},
					},
				}),
				defineArrayMember({
					type: 'object',
					name: 'videoUrl',
					title: 'Video từ Link (YouTube / Vimeo / TikTok)',
					icon: FiPlay,
					fields: [
						defineField({
							name: 'url',
							title: 'Đường dẫn Video (URL)',
							type: 'url',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'alt',
							title: 'Tiêu đề / Chú thích Video',
							type: 'string',
						}),
					],
					preview: {
						select: {
							title: 'alt',
							subtitle: 'url',
						},
						prepare({ title, subtitle }) {
							return {
								title: title || 'Product Video (Link)',
								subtitle,
								media: FiPlay,
							}
						},
					},
				}),
			],
		}),

		defineField({
			name: 'sku',
			title: 'SKU',
			type: 'string',
			group: 'content',
			fieldset: 'skuStockRow',
			validation: (Rule) => Rule.required(),
		}),

		defineField({
			name: 'sold',
			title: 'Sold',
			type: 'number',
			group: 'content',
			fieldset: 'skuStockRow',
			initialValue: 0,
		}),
		defineField({
			name: 'categories',
			type: 'array',
			of: [{ type: 'reference', to: [{ type: 'product.category' }] }],
			group: 'content',
		}),
		defineField({
			name: 'tags',
			title: 'Product Tags',
			type: 'array',
			of: [{ type: 'string' }],
			options: {
				layout: 'tags',
			},
			group: 'content',
		}),

		defineField({
			name: 'price',
			title: 'Price',
			type: 'number',
			group: 'content',
			fieldset: 'priceRow',
			validation: (Rule) => Rule.required().min(0),
		}),

		defineField({
			name: 'compareAtPrice',
			title: 'Compare At Price',
			type: 'number',
			group: 'content',
			fieldset: 'priceRow',
			validation: (Rule) =>
				Rule.min(0).custom((compareAtPrice, context) => {
					const parent = context.parent as { price?: number }

					if (
						typeof compareAtPrice === 'number' &&
						typeof parent?.price === 'number' &&
						compareAtPrice < parent.price
					) {
						return 'Compare at price must be higher than regular price'
					}

					return true
				}),
		}),
		defineField({
			name: 'stock',
			title: 'Stock',
			type: 'number',
			group: 'content',
			fieldset: 'priceRow',
			initialValue: 0,
		}),
		defineField({
			name: 'hasVariants',
			title: 'Enable Variants',
			type: 'boolean',
			description: 'Toggle on to enable multi-option product variants (e.g. Size, Color)',
			group: 'variants',
			initialValue: false,
		}),
		defineField({
			name: 'options',
			title: 'Product Options',
			type: 'array',
			description: 'Define options such as Color, Size, Material',
			group: 'variants',
			hidden: ({ parent }) => !parent?.hasVariants,
			of: [defineArrayMember({ type: 'product.option' })],
		}),
		defineField({
			name: 'variants',
			title: 'Product Variants',
			type: 'array',
			description: 'List of specific product variants with individual pricing, SKU, stock, and images',
			group: 'variants',
			components: {
				input: VariantGeneratorInput,
			},
			hidden: ({ parent }) => !parent?.hasVariants,
			of: [defineArrayMember({ type: 'product.variant' })],
		}),
		defineField({
			...modules(),
			of: [
				{ type: 'theme-background' },
				{ type: 'prose' },
				{ type: 'callout' },
				{ type: 'custom-html' },
				{ type: 'accordion-list' },
				{ type: 'hero.split' },
				{ type: 'quote-list' },
				{ type: 'step-list' },
				{ type: 'card-list' },
				{ type: 'product-list' },
				{ type: 'carousel-banner-list' },
			],
			group: 'content',
		}),

		// CẤU HÌNH KHUYẾN MÃI (Bên trong Tab Promotions & Deals)
		defineField({
			name: 'promotionMode',
			title: 'Cấu hình Khuyến mãi',
			description: 'Chọn chế độ hiển thị danh sách khuyến mãi cho sản phẩm này',
			type: 'string',
			group: 'promotion',
			options: {
				list: [
					{ title: 'Sử dụng Khuyến mãi Mặc định (Từ Cài đặt chung)', value: 'default' },
					{ title: 'Tùy chỉnh Khuyến mãi riêng cho sản phẩm này', value: 'custom' },
					{ title: 'Tắt Khuyến mãi (Không hiển thị)', value: 'disabled' },
				],
				layout: 'radio',
			},
			initialValue: 'disabled',
		}),

		defineField({
			name: 'promotions',
			title: 'Khuyến mãi riêng cho sản phẩm',
			description: 'Nhập danh sách khuyến mãi độc quyền dành riêng cho sản phẩm này',
			type: 'object',
			group: 'promotion',
			hidden: ({ parent }) => parent?.promotionMode !== 'custom',
			fields: [
				defineField({
					name: 'title',
					title: 'Tiêu đề khối',
					type: 'string',
					initialValue: 'Khuyến mãi',
				}),
				defineField({
					name: 'subtitle',
					title: 'Phụ đề / Ghi chú',
					type: 'string',
					initialValue: 'Giá và khuyến mãi có thể kết thúc sớm hơn dự kiến',
				}),
				defineField({
					name: 'items',
					title: 'Danh sách mục khuyến mãi',
					type: 'array',
					of: [
						{
							type: 'object',
							name: 'promotionItem',
							title: 'Mục khuyến mãi',
							fields: [
								defineField({
									name: 'text',
									title: 'Nội dung khuyến mãi',
									type: 'string',
									validation: (Rule) => Rule.required(),
								}),
								defineField({
									name: 'linkText',
									title: 'Chữ liên kết đính kèm (Ví dụ: "(Xem chi tiết tại đây)")',
									type: 'string',
								}),
								defineField({
									name: 'linkUrl',
									title: 'Đường dẫn liên kết (Link URL)',
									type: 'string',
								}),
								defineField({
									name: 'highlight',
									title: 'Nổi bật (In đậm chữ)',
									type: 'boolean',
									initialValue: false,
								}),
							],
							preview: {
								select: {
									title: 'text',
									subtitle: 'linkText',
								},
							},
						},
					],
				}),
			],
		}),

		// CẤU HÌNH GIÁ ĐẶC BIỆT / FLASH SALE
		defineField({
			name: 'enableSpecialDeal',
			title: 'Bật chương trình Giá Đặc Biệt / Flash Sale',
			description: 'Hiển thị Banner Flash Sale màu đỏ, đồng hồ đếm ngược và khung viền nổi bật cho sản phẩm này',
			type: 'boolean',
			group: 'promotion',
			initialValue: false,
		}),

		defineField({
			name: 'specialDealConfig',
			title: 'Cấu hình Giá Đặc Biệt / Flash Sale',
			type: 'object',
			group: 'promotion',
			hidden: ({ parent }) => !parent?.enableSpecialDeal,
			fields: [
				defineField({
					name: 'badgeTitle',
					title: 'Tên nhãn / Tiêu đề chương trình',
					description: 'Ví dụ: "Online Giá Rẻ Quá", "Giá Đặc Biệt", "Flash Sale Hot"',
					type: 'string',
					initialValue: 'Online Giá Rẻ Quá',
				}),
				defineField({
					name: 'badgeIcon',
					title: 'Icon nhãn / Biểu tượng chương trình',
					description:
						'Tải lên hình ảnh / biểu tượng hiển thị cạnh Tiêu đề (Mặc định hiển thị ngọn lửa 🔥 nếu để trống). Kích thước khuyên dùng: Vuông 1:1 (ví dụ 100x100px), PNG trong suốt, dung lượng < 100KB.',
					type: 'image',
					options: { hotspot: true },
				}),
				defineField({
					name: 'channelText',
					title: 'Nhãn kênh áp dụng',
					description: 'Ví dụ: "CHỈ BÁN ONLINE", "ÁP DỤNG MUA ONLINE & SHOWROOM"',
					type: 'string',
					initialValue: 'CHỈ BÁN ONLINE',
				}),
				defineField({
					name: 'endTime',
					title: 'Thời gian kết thúc đếm ngược',
					type: 'datetime',
				}),
				defineField({
					name: 'totalQuota',
					title: 'Tổng số suất ưu đãi',
					type: 'number',
					initialValue: 20,
				}),
				defineField({
					name: 'remainingQuota',
					title: 'Số suất còn lại',
					type: 'number',
					initialValue: 14,
				}),
				defineField({
					name: 'specialConditions',
					title: 'Lưu ý / Điều kiện mua hàng riêng',
					description: 'Nhập danh sách điều kiện mua hàng riêng cho sản phẩm này. Nếu để trống sẽ tự động lấy từ Cài đặt chung.',
					type: 'array',
					of: [{ type: 'string' }],
				}),
			],
		}),

		defineField({
			name: 'metadata',
			type: 'metadata',
			group: 'metadata',
		}),
	],

	preview: {
		select: {
			title: 'title',
			subtitle: 'publishDate',
			media: 'metadata.image',
		},
	},
	orderings: [
		{
			name: 'title',
			title: 'Title',
			by: [{ field: 'title', direction: 'asc' }],
		},
	],
})
