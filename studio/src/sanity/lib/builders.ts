import type { ListBuilder, StructureBuilder } from 'sanity/structure'

export const singleton = (S: StructureBuilder, id: string) =>
	S.listItem().id(id).child(S.editor().id(id).schemaType(id).documentId(id))

export const group = (
	S: StructureBuilder,
	title: string,
	items: Parameters<ListBuilder['items']>[0],
	id?: string,
) => {
	const item = S.listItem().title(title)
	if (id) item.id(id)
	return item.child(S.list().title(title).items(items))
}
