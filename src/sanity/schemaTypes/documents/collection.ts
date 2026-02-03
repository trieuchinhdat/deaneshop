import { defineField, defineType } from 'sanity'
import { BsCollection } from 'react-icons/bs'

type ProductCategoryDocument = {
	products?: {
		_ref: string
	}[]
}

export default defineType({
	name: 'collection',
	title: 'Collection',
	type: 'document',
	icon: BsCollection,
	fields: [
		defineField({
			name: 'title',
			type: 'string',
		}),
		defineField({
			name: 'slug',
			type: 'slug',
			options: { source: 'title' },
		}),
		defineField({
			name: 'products',
			title: 'List product',
			type: 'array',
			validation: (Rule) => Rule.unique(),

			of: [
				{
					type: 'reference',
					to: [{ type: 'product' }],
					// 2. Cấu hình Filter động
					options: {
						filter: ({ document }) => {
							// Lấy danh sách các sản phẩm đang có trong mảng (nếu có)
							// document là object Category hiện tại bạn đang sửa
							const existingIds =
								(document as any)?.products
									?.map((item: any) => item._ref)
									.filter((id: string) => id) || []

							return {
								// Câu truy vấn GROQ:
								// Chọn sản phẩm VÀ ID của nó KHÔNG nằm trong danh sách đã có
								filter: '!(_id in $existingIds) && !(_id in path("drafts.**"))',
								params: {
									existingIds,
								},
							}
						},
					},
				},
			],
		}),
	],
	preview: {
		select: {
			title: 'title',
		},
	},
})
