import { StructureBuilder, structureTool } from 'sanity/structure'
import { VscServerProcess } from 'react-icons/vsc'
import { singleton } from './lib/builders'

export default structureTool({
	structure: (S: StructureBuilder) =>
		S.list()
			.title('Content')
			.items([
				/* ================= GLOBAL ================= */
				S.divider().title('Global'),
				singleton(S, 'site').title('Site').icon(VscServerProcess),
				S.documentTypeListItem('global-module').title('Global modules'),

				/* ================= PAGES ================= */
				S.divider().title('Pages'),
				S.documentTypeListItem('page').title('Pages'),

				/* ================= Product ================= */
				S.divider().title('Products'),
				S.documentTypeListItem('product').title('Products'),
				// S.documentTypeListItem('product.category').title('Categories'),
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
