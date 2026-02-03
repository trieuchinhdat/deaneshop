// hooks/use-header-height.ts
import { useEffect, useState } from 'react'

export function useHeaderHeight() {
	const [height, setHeight] = useState(0)

	useEffect(() => {
		// Hàm cập nhật chiều cao
		const updateHeight = () => {
			// Giả sử Header của bạn là thẻ <header> hoặc có id="main-header"
			// Bạn nên đặt id="site-header" cho header chính để chính xác nhất
			const header =
				document.querySelector('header') ||
				document.getElementById('site-header')

			if (header) {
				setHeight(header.offsetHeight)
			}
		}

		// 1. Đo ngay khi mount
		updateHeight()

		// 2. Đo khi resize màn hình
		window.addEventListener('resize', updateHeight)

		// 3. (Optional) Dùng ResizeObserver để đo nếu header tự co giãn DOM
		const header = document.querySelector('header')
		let observer: ResizeObserver | null = null

		if (header) {
			observer = new ResizeObserver(updateHeight)
			observer.observe(header)
		}

		return () => {
			window.removeEventListener('resize', updateHeight)
			if (observer) observer.disconnect()
		}
	}, [])

	return height
}
