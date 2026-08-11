import { StructureBuilder, structureTool } from 'sanity/structure'
import { VscGlobe, VscLayout, VscPackage, VscSettings } from 'react-icons/vsc'
import { FiStar, FiClock, FiCheckCircle, FiList } from 'react-icons/fi'
import { group, singleton } from './lib/builders'

export default structureTool({
	structure: (S: StructureBuilder) =>
		S.list()
			.title('Content')
			.items([
				/* ================= SITE SETTINGS ================= */
				S.divider().title('Settings'),
				group(S, 'Site Settings', [
					singleton(S, 'site').title('Site Global').icon(VscGlobe),
					singleton(S, 'product-card-settings').title('Product Card Settings').icon(VscLayout),
					singleton(S, 'product-settings').title('Product Page Settings').icon(VscPackage),
				]).icon(VscSettings),
				S.documentTypeListItem('global-module').title('Global modules'),

				/* ================= PAGES ================= */
				S.divider().title('Pages'),
				S.documentTypeListItem('page').title('Pages'),

				/* ================= Product ================= */
				S.divider().title('Products'),
				S.documentTypeListItem('product').title('Products'),
				S.listItem()
					.title('Product Reviews')
					.icon(FiStar)
					.child(
						S.list()
							.title('Quản lý Review')
							.items([
								S.listItem()
									.title('Review Chờ duyệt (Pending)')
									.icon(FiClock)
									.child(
										S.documentList()
											.title('Review Chờ duyệt')
											.filter('_type == "review" && (isApproved == false || !defined(isApproved))')
									),
								S.listItem()
									.title('Review Đã duyệt (Approved)')
									.icon(FiCheckCircle)
									.child(
										S.documentList()
											.title('Review Đã duyệt')
											.filter('_type == "review" && isApproved == true')
									),
								S.listItem()
									.title('Tất cả Review (All)')
									.icon(FiList)
									.child(
										S.documentTypeList('review')
											.title('Tất cả Review')
									),
							])
					),
				// S.documentTypeListItem('productCategory').title('Categories'),
				S.documentTypeListItem('collection').title('Collections'),


				/* ================= BLOG ================= */
				S.divider().title('Blog'),
				S.documentTypeListItem('blog.post').title('Posts'),
				S.documentTypeListItem('blog.category').title('Categories'),

				/* ================= NAVIGATION ================= */
				S.divider().title('Navigation'),
				S.documentTypeListItem('navigation'),
				S.documentTypeListItem('redirect').title('Redirects'),

				/* ================= REFERENCES ================= */
				S.divider().title('References'),
				S.documentTypeListItem('logo').title('Logos'),
				S.documentTypeListItem('person').title('People'),
				S.documentTypeListItem('quote').title('Quotes'),
			]),
})
