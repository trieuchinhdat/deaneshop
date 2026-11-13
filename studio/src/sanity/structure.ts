import { StructureBuilder, structureTool } from 'sanity/structure'
import {
	FiEdit3,
	FiFileText,
	FiFolder,
	FiGrid,
	FiHome,
	FiLayers,
	FiMessageCircle,
	FiNavigation,
	FiShoppingBag,
	FiShuffle,
	FiSmile,
	FiStar,
	FiTag,
	FiUsers,
} from 'react-icons/fi'
import {
	VscCode,
	VscColorMode,
	VscCommentDiscussion,
	VscGlobe,
	VscLayout,
	VscLayoutMenubar,
	VscMegaphone,
	VscPackage,
	VscSettings,
} from 'react-icons/vsc'
import { group, singleton } from './lib/builders'

const HOME_PAGE_ID =
	process.env.SANITY_STUDIO_HOME_PAGE_ID || '7afa548f-8003-4d6e-9fb2-25a3eb2c51a4'

export default structureTool({
	title: 'Content',
	structure: (S: StructureBuilder) =>
		S.list()
			.title('Content Studio')
			.items([
				/* ================= 1. HOME PAGE (SINGLETON DIRECT ACCESS) ================= */
				S.listItem()
					.title('Home Page')
					.id('home-page')
					.icon(FiHome)
					.child(
						S.editor()
							.id('homePage')
							.schemaType('page')
							.documentId(HOME_PAGE_ID)
							.title('Home Page'),
					),

				/* ================= 2. ALL OTHER PAGES (EXCLUDES HOME) ================= */
				S.listItem()
					.title('Pages')
					.id('all-pages')
					.icon(FiFileText)
					.child(
						S.documentList()
							.title('All Pages')
							.filter(
								'_type == "page" && metadata.slug.current != "index" && _id != $homeId && _id != $draftHomeId',
							)
							.params({
								homeId: HOME_PAGE_ID,
								draftHomeId: `drafts.${HOME_PAGE_ID}`,
							}),
					),

				/* ================= 3. GLOBAL REUSABLE MODULES ================= */
				S.documentTypeListItem('global-module')
					.title('Global Modules')
					.icon(FiLayers),

				S.divider(),

				/* ================= 4. CATALOG & STORE (WITH CONTEXTUAL SETTINGS) ================= */
				group(
					S,
					'Catalog & Store',
					[
						S.documentTypeListItem('product')
							.title('Products')
							.icon(FiShoppingBag),
						S.documentTypeListItem('product.category')
							.title('Product Categories')
							.icon(FiTag),
						S.documentTypeListItem('collection')
							.title('Collections')
							.icon(FiGrid),
						S.divider(),
						singleton(S, 'product-settings')
							.title('Product Page Settings')
							.icon(VscPackage),
						singleton(S, 'product-card-settings')
							.title('Product Card Settings')
							.icon(VscLayout),
						singleton(S, 'checkout-settings')
							.title('Checkout & Cart Settings')
							.icon(FiShoppingBag),
					],
					'group-catalog',
				).icon(FiShoppingBag),

				/* ================= 5. EDITORIAL & BLOG (WITH CONTEXTUAL SETTINGS) ================= */
				group(
					S,
					'Editorial & Blog',
					[
						S.documentTypeListItem('blog.post')
							.title('Articles')
							.icon(FiFileText),
						S.documentTypeListItem('blog.category')
							.title('Categories & Topics')
							.icon(FiFolder),
						S.divider(),
						singleton(S, 'blog-settings')
							.title('Blog Configuration')
							.icon(FiEdit3),
					],
					'group-editorial',
				).icon(FiEdit3),

				S.divider(),

				/* ================= 6. GROWTH & CONVERSION ================= */
				group(
					S,
					'Growth & Conversion',
					[
						singleton(S, 'popup-settings')
							.title('Promotional Popups')
							.icon(VscMegaphone),
						singleton(S, 'widget-settings')
							.title('Floating Contact Hub')
							.icon(VscCommentDiscussion),
						S.documentTypeListItem('quote')
							.title('Editorial Quotes & Press')
							.icon(FiMessageCircle),
						S.documentTypeListItem('logo')
							.title('Trust & Partner Logos')
							.icon(FiSmile),
					],
					'group-growth-conversion',
				).icon(VscMegaphone),

				S.divider(),

				/* ================= 7. GLOBAL SITE SETTINGS ================= */
				group(
					S,
					'Global Settings',
					[
						singleton(S, 'site')
							.title('Brand & Business Profile')
							.icon(VscGlobe),
						singleton(S, 'header-settings')
							.title('Header & Main Navigation')
							.icon(VscLayoutMenubar),
						S.documentTypeListItem('navigation')
							.title('Navigation Menus')
							.icon(FiNavigation),
						singleton(S, 'footer-settings')
							.title('Footer & Legal Notices')
							.icon(VscLayout),
						singleton(S, 'theme-settings')
							.title('Theme & Appearance')
							.icon(VscColorMode),
						singleton(S, 'system-settings')
							.title('SEO & Tracking Scripts')
							.icon(VscCode),
						S.divider(),
						S.documentTypeListItem('redirect')
							.title('URL Redirects')
							.icon(FiShuffle),
						S.documentTypeListItem('person')
							.title('Team & Authors')
							.icon(FiUsers),
					],
					'group-global-settings',
				).icon(VscSettings),
			]),
})
