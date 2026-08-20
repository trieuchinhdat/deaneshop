import { StructureBuilder, structureTool } from 'sanity/structure'
import {
	VscGlobe,
	VscLayout,
	VscLayoutMenubar,
	VscPackage,
	VscSettings,
	VscColorMode,
	VscMegaphone,
	VscCommentDiscussion,
	VscCode,
} from 'react-icons/vsc'
import {
	FiExternalLink,
	FiShoppingBag,
	FiFileText,
	FiFolder,
	FiLayers,
	FiNavigation,
	FiShuffle,
	FiSmile,
	FiUsers,
	FiMessageCircle,
	FiTag,
	FiEdit3,
} from 'react-icons/fi'
import { group, singleton } from './lib/builders'
import ManagementHubLauncher from './ui/management-hub-launcher'

export default structureTool({
	structure: (S: StructureBuilder) =>
		S.list()
			.title('Content Studio')
			.items([
				/* ================= 1. PRODUCTS & CATALOG (TOP PRIORITY) ================= */
				S.documentTypeListItem('product').title('Products').icon(FiShoppingBag),
				S.documentTypeListItem('collection').title('Collections').icon(FiFolder),

				S.divider(),

				/* ================= 2. PAGES & EDITORIAL ================= */
				S.documentTypeListItem('page').title('Pages').icon(FiFileText),
				S.documentTypeListItem('blog.post').title('Blog Posts').icon(FiFileText),
				S.documentTypeListItem('blog.category').title('Blog Categories').icon(FiFolder),
				S.documentTypeListItem('global-module').title('Global Modules').icon(FiLayers),

				S.divider(),

				/* ================= 3. GLOBAL & MARKETING SETTINGS ================= */
				group(S, 'Global Settings', [
					singleton(S, 'site').title('1. Branding & Business Profile').icon(VscGlobe),
					singleton(S, 'theme-settings').title('2. Theme & Design Tokens').icon(VscColorMode),
					singleton(S, 'popup-settings').title('3. Popup Marketing (Banner & Form)').icon(VscMegaphone),
					singleton(S, 'widget-settings').title('4. Floating Widgets & Contact').icon(VscCommentDiscussion),
					singleton(S, 'system-settings').title('5. System & Tracking Scripts').icon(VscCode),
				]).icon(VscGlobe),

				S.divider(),

				/* ================= 4. DESIGN & LAYOUT SETTINGS ================= */
				group(S, 'Layout Settings', [
					singleton(S, 'header-settings').title('Header Settings').icon(VscLayoutMenubar),
					singleton(S, 'footer-settings').title('Footer Settings').icon(VscLayout),
					singleton(S, 'blog-settings').title('Blog & Editorial Settings').icon(FiEdit3),
					singleton(S, 'product-card-settings').title('Product Card Settings').icon(VscLayout),
					singleton(S, 'product-settings').title('Product Page Settings').icon(VscPackage),
				]).icon(VscSettings),

				S.divider(),

				/* ================= 5. NAVIGATION & ASSETS ================= */
				S.documentTypeListItem('navigation').title('Navigation Menus').icon(FiNavigation),
				S.documentTypeListItem('redirect').title('URL Redirects').icon(FiShuffle),
				S.documentTypeListItem('logo').title('Brand Logos').icon(FiSmile),
				S.documentTypeListItem('person').title('Team & Authors').icon(FiUsers),
				S.documentTypeListItem('quote').title('Quotes & Testimonials').icon(FiMessageCircle),
				S.documentTypeListItem('affiliate.product')
					.title('Affiliate Products (Catalog)')
					.icon(FiTag),

				S.divider(),

				/* ================= 6. OPERATIONS & COMMERCE ADMIN (BOTTOM) ================= */
				S.listItem()
					.id('commerce-admin-launcher-item')
					.title('Open Commerce Admin (Orders & CRM) ↗')
					.icon(FiExternalLink)
					.child(
						S.component(ManagementHubLauncher)
							.id('commerce-admin-launcher-pane')
							.title('Commerce Admin'),
					),
			]),
})
