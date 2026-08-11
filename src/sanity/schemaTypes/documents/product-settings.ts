import { defineField, defineType } from 'sanity'

export default defineType({
	name: 'product-settings',
	title: 'Product Page Settings',
	type: 'document',
	groups: [
		{ name: 'promotional', title: 'Promotional Settings', default: true },
		{ name: 'socialProof', title: 'Trust & Social Proof' },
		{ name: 'conversion', title: 'Conversion & Inventory' },
	],
	fieldsets: [
		{
			name: 'addToCartGroup',
			title: 'Cấu hình Nút "Thêm vào giỏ"',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'buyNowGroup',
			title: 'Cấu hình Nút "Mua ngay"',
			options: { collapsible: true, collapsed: false },
		},
		{
			name: 'contactGroup',
			title: 'Cấu hình Nút "Liên hệ tư vấn"',
			options: { collapsible: true, collapsed: false },
		},
	],
	fields: [
		// ================= 1. PROMOTIONAL SETTINGS =================
		defineField({
			name: 'defaultPromotions',
			title: 'Khuyến mãi mặc định (Toàn shop)',
			description:
				'Khối khuyến mãi mặc định hiển thị trên các sản phẩm sử dụng cài đặt khuyến mãi chung.',
			type: 'object',
			group: 'promotional',
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
									title:
										'Chữ liên kết đính kèm (Ví dụ: "(Xem chi tiết tại đây)")',
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
		defineField({
			name: 'defaultSpecialConditions',
			title: 'Lưu ý / Điều kiện mua hàng mặc định',
			description:
				'Danh sách các điều kiện mua hàng mặc định khi sử dụng Giá Đặc Biệt (Ví dụ: "Không áp dụng với khuyến mãi khác", "1 số điện thoại chỉ mua được 3 sản phẩm")',
			type: 'array',
			group: 'promotional',
			of: [{ type: 'string' }],
			initialValue: [
				'Không áp dụng với khuyến mãi khác',
				'1 số điện thoại chỉ mua được 3 sản phẩm',
			],
		}),
		defineField({
			name: 'promoBanners',
			title: 'Banner khuyến mãi theo Tag sản phẩm',
			description:
				'Danh sách Banner hiển thị bên dưới Trust Badges. Tự động đối chiếu Tag của sản phẩm để hiển thị banner tương ứng.',
			type: 'array',
			group: 'promotional',
			of: [
				{
					type: 'object',
					name: 'tagBanner',
					title: 'Banner theo Tag',
					fields: [
						defineField({
							name: 'title',
							title: 'Tên Banner (Ghi chú Admin)',
							type: 'string',
						}),
						defineField({
							name: 'tag',
							title: 'Tag sản phẩm áp dụng',
							description:
								'Nhập Tag sản phẩm muốn khớp (Ví dụ: "khuyen-mai", "nano-bac"). Để trống hoặc nhập "*" để áp dụng cho mọi sản phẩm.',
							type: 'string',
						}),
						defineField({
							name: 'image',
							title: 'Hình ảnh Banner (Desktop)',
							description:
								'Kích thước khuyên dùng: Tỉ lệ 3:1 hoặc 16:9 (ví dụ: 1200x400px), định dạng WebP/JPG, dung lượng < 500KB.',
							type: 'image',
							options: { hotspot: true },
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'mobileImage',
							title: 'Hình ảnh Banner (Mobile - Tùy chọn)',
							description:
								'Kích thước khuyên dùng cho Mobile: Tỉ lệ 1:1 hoặc 4:3 (ví dụ: 600x600px), dung lượng < 300KB.',
							type: 'image',
							options: { hotspot: true },
						}),
						defineField({
							name: 'link',
							title: 'Đường dẫn liên kết (Tùy chọn)',
							description:
								'Chọn trang hoặc nhập link đích khi click vào Banner. Để trống nếu chỉ hiển thị hình ảnh.',
							type: 'link',
						}),
						defineField({
							name: 'isActive',
							title: 'Kích hoạt Banner',
							type: 'boolean',
							initialValue: true,
						}),
					],
					preview: {
						select: {
							title: 'title',
							tag: 'tag',
							media: 'image',
							isActive: 'isActive',
						},
						prepare({ title, tag, media, isActive }) {
							return {
								title: title || 'Banner khuyến mãi',
								subtitle: `${isActive !== false ? '🟢 Đang bật' : '🔴 Đã tắt'} | Tag: ${tag || 'Tất cả (*)'}`,
								media,
							}
						},
					},
				},
			],
		}),

		// ================= 2. TRUST & SOCIAL PROOF =================
		defineField({
			name: 'trustBadges',
			title: 'Trust Badges & Store Commitments',
			description:
				'Danh sách các cam kết của cửa hàng hiển thị tại trang sản phẩm (Ví dụ: Miễn phí vận chuyển, Bảo hành, Đổi trả)',
			type: 'array',
			group: 'socialProof',
			of: [
				{
					type: 'object',
					name: 'badge',
					title: 'Badge',
					fields: [
						defineField({
							name: 'title',
							title: 'Tiêu đề',
							type: 'string',
							validation: (Rule) => Rule.required(),
						}),
						defineField({
							name: 'subtitle',
							title: 'Mô tả ngắn',
							type: 'string',
						}),
						defineField({
							name: 'icon',
							title: 'Hình ảnh / Biểu tượng',
							description:
								'Biểu tượng cam kết. Kích thước khuyên dùng: Vuông 1:1 (ví dụ 64x64px), PNG/SVG trong suốt, dung lượng < 50KB.',
							type: 'image',
							options: { hotspot: true },
						}),
					],
					preview: {
						select: {
							title: 'title',
							subtitle: 'subtitle',
							media: 'icon',
						},
					},
				},
			],
		}),
		defineField({
			name: 'enableReviewStars',
			title: 'Hiển thị Số sao & Lượt đánh giá',
			description:
				'Hiển thị điểm số sao trung bình và số lượt đánh giá bên dưới tên sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'socialProof',
		}),
		defineField({
			name: 'enableSoldCount',
			title: 'Hiển thị Lượt đã bán',
			description:
				'Hiển thị số lượng sản phẩm đã bán (Ví dụ: Đã bán 120) bên dưới tên sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'socialProof',
		}),
		defineField({
			name: 'enableReviews',
			title: 'Bật đánh giá sản phẩm',
			description:
				'Hiển thị phần đánh giá và cho phép khách hàng viết nhận xét trên trang sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'socialProof',
		}),
		defineField({
			name: 'defaultReviewSort',
			title: 'Thứ tự sắp xếp đánh giá mặc định',
			type: 'string',
			options: {
				list: [
					{ title: 'Mới nhất', value: 'newest' },
					{ title: 'Đánh giá cao nhất', value: 'highest' },
					{ title: 'Đánh giá thấp nhất', value: 'lowest' },
				],
				layout: 'radio',
			},
			initialValue: 'newest',
			group: 'socialProof',
		}),

		// ================= 3. CONVERSION & INVENTORY =================
		defineField({
			name: 'enableCategoryDisplay',
			title: 'Hiển thị Danh mục sản phẩm (Category)',
			description: 'Hiển thị dòng Danh mục (CATEGORY: ...) trên trang sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
		}),

		// Fieldset: Add To Cart
		defineField({
			name: 'enableAddToCartButton',
			title: 'Bật nút "Thêm vào giỏ"',
			description: 'Hiển thị nút Thêm vào giỏ hàng trên trang sản phẩm',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
			fieldset: 'addToCartGroup',
		}),
		defineField({
			name: 'addToCartButtonText',
			title: 'Nhãn nút "Thêm vào giỏ"',
			description:
				'Ghi chú chữ hiển thị trên nút Thêm vào giỏ hàng (Mặc định: Thêm vào giỏ)',
			type: 'string',
			initialValue: 'Thêm vào giỏ',
			group: 'conversion',
			fieldset: 'addToCartGroup',
			hidden: ({ parent }) => parent?.enableAddToCartButton === false,
		}),

		// Fieldset: Buy Now
		defineField({
			name: 'enableBuyNowButton',
			title: 'Bật nút "Mua ngay"',
			description: 'Hiển thị nút mua ngay để chuyển thẳng đến trang thanh toán',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
			fieldset: 'buyNowGroup',
		}),
		defineField({
			name: 'buyNowButtonText',
			title: 'Nhãn nút "Mua ngay"',
			description:
				'Ghi chú chữ hiển thị trên nút Mua ngay (Mặc định: Mua ngay)',
			type: 'string',
			initialValue: 'Mua ngay',
			group: 'conversion',
			fieldset: 'buyNowGroup',
			hidden: ({ parent }) => parent?.enableBuyNowButton === false,
		}),

		// Fieldset: Contact Button
		defineField({
			name: 'enableContactButton',
			title: 'Bật nút "Liên hệ tư vấn / Báo giá"',
			description:
				'Hiển thị nút Liên hệ ở một dòng riêng bên dưới các nút mua hàng chính',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
			fieldset: 'contactGroup',
		}),
		defineField({
			name: 'contactButtonText',
			title: 'Nhãn nút Liên hệ',
			description:
				'Ghi chú chữ hiển thị trên nút Liên hệ (Mặc định: 📞 Liên hệ tư vấn ngay)',
			type: 'string',
			initialValue: '📞 Liên hệ tư vấn ngay',
			group: 'conversion',
			fieldset: 'contactGroup',
			hidden: ({ parent }) => parent?.enableContactButton === false,
		}),
		defineField({
			name: 'contactButtonLink',
			title: 'Đường dẫn nút Liên hệ (URL hoặc SĐT/Zalo)',
			description:
				'Nhập liên kết trang liên hệ (vd: /pages/lien-he), link Zalo (https://zalo.me/...) hoặc cú pháp gọi SĐT (tel:0901234567)',
			type: 'string',
			initialValue: 'https://zalo.me',
			group: 'conversion',
			fieldset: 'contactGroup',
			hidden: ({ parent }) => parent?.enableContactButton === false,
		}),

		// General Conversion Settings
		defineField({
			name: 'enableStickyAddToCart',
			title: 'Bật thanh Add to Cart cố định (Sticky Cart)',
			description:
				'Tự động hiển thị thanh mua hàng ở chân trang khi cuộn qua nút mua hàng chính',
			type: 'boolean',
			initialValue: true,
			group: 'conversion',
		}),
		defineField({
			name: 'lowStockThreshold',
			title: 'Ngưỡng cảnh báo hàng sắp hết',
			description:
				'Hiển thị cảnh báo khi số lượng tồn kho của biến thể sản phẩm nhỏ hơn hoặc bằng số này',
			type: 'number',
			initialValue: 5,
			validation: (Rule) => Rule.min(0),
			group: 'conversion',
		}),
	],
	preview: {
		prepare: () => ({
			title: 'Product Page Settings',
		}),
	},
})
