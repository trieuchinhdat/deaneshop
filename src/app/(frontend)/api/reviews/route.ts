import { NextResponse } from 'next/server'
import { createClient } from 'next-sanity'
import { apiVersion, dataset, projectId } from '@/sanity/env'

export async function POST(req: Request) {
	try {
		const token = process.env.SANITY_API_WRITE_TOKEN || process.env.SANITY_API_READ_TOKEN

		if (!token) {
			return NextResponse.json(
				{ error: 'Chưa cấu hình SANITY_API_WRITE_TOKEN trong .env.local' },
				{ status: 500 },
			)
		}

		const writeClient = createClient({
			projectId,
			dataset,
			apiVersion,
			token,
			useCdn: false,
		})

		const formData = await req.formData()
		const productId = formData.get('productId') as string
		const author = formData.get('author') as string
		const rating = Number(formData.get('rating') || 5)
		const comment = formData.get('comment') as string

		if (!productId || !author || !comment) {
			return NextResponse.json(
				{ error: 'Vui lòng điền đầy đủ các thông tin bắt buộc' },
				{ status: 400 },
			)
		}

		// Upload images (nếu có)
		const imageFiles = formData.getAll('images') as File[]
		const imageAssets = []

		for (const file of imageFiles) {
			if (file && file.size > 0 && file.type.startsWith('image/')) {
				const bytes = await file.arrayBuffer()
				const buffer = Buffer.from(bytes)
				const uploadedAsset = await writeClient.assets.upload('image', buffer, {
					filename: file.name,
					contentType: file.type,
				})
				imageAssets.push({
					_key: crypto.randomUUID(),
					_type: 'image',
					asset: {
						_type: 'reference',
						_ref: uploadedAsset._id,
					},
				})
			}
		}

		// Upload videos (nếu có)
		const videoFiles = formData.getAll('videos') as File[]
		const videoAssets = []

		for (const file of videoFiles) {
			if (file && file.size > 0 && file.type.startsWith('video/')) {
				const bytes = await file.arrayBuffer()
				const buffer = Buffer.from(bytes)
				const uploadedAsset = await writeClient.assets.upload('file', buffer, {
					filename: file.name,
					contentType: file.type,
				})
				videoAssets.push({
					_key: crypto.randomUUID(),
					_type: 'file',
					asset: {
						_type: 'reference',
						_ref: uploadedAsset._id,
					},
				})
			}
		}

		// Tạo document review ở trạng thái chờ duyệt (isApproved: false)
		const reviewDoc = await writeClient.create({
			_type: 'review',
			product: {
				_type: 'reference',
				_ref: productId,
			},
			author: author.trim(),
			rating: Math.min(Math.max(rating, 1), 5),
			comment: comment.trim(),
			isApproved: false,
			createdAt: new Date().toISOString(),
			images: imageAssets.length > 0 ? imageAssets : undefined,
			videos: videoAssets.length > 0 ? videoAssets : undefined,
		})

		return NextResponse.json({
			success: true,
			message: 'Đánh giá của bạn đã được gửi thành công và đang chờ admin duyệt!',
			reviewId: reviewDoc._id,
		})
	} catch (error: any) {
		console.error('Error submitting review:', error)
		if (
			error?.statusCode === 403 ||
			error?.message?.includes('Insufficient permissions') ||
			error?.message?.includes('permission "create" required')
		) {
			return NextResponse.json(
				{
					error:
						'Sanity Token hiện tại không có quyền Ghi (Write/Create). Vui lòng tạo Token có quyền Editor trên https://sanity.io/manage và thêm SANITY_API_WRITE_TOKEN vào file .env.local',
				},
				{ status: 403 },
			)
		}
		return NextResponse.json(
			{ error: error?.message || 'Có lỗi xảy ra khi gửi đánh giá' },
			{ status: 500 },
		)
	}
}
