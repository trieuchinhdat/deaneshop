const fs = require('node:fs')
const path = require('node:path')
const ts = require('typescript')
const failures = []
function check(dir) {
	for (const item of fs.readdirSync(dir, { withFileTypes: true })) {
		const file = path.join(dir, item.name)
		if (item.isDirectory()) {
			check(file)
			continue
		}
		if (!/\.tsx?$/.test(file) || file.endsWith('.d.ts')) continue
		const tree = ts.createSourceFile(
			file,
			fs.readFileSync(file, 'utf8'),
			ts.ScriptTarget.Latest,
			true,
		)
		function visit(node) {
			let specifier
			if (ts.isImportDeclaration(node) || ts.isExportDeclaration(node)) {
				if (node.importClause?.isTypeOnly || node.isTypeOnly) return
				specifier = node.moduleSpecifier?.text
			}
			if (
				ts.isCallExpression(node) &&
				node.expression.kind === ts.SyntaxKind.ImportKeyword
			)
				specifier = node.arguments[0]?.text
			if (
				specifier &&
				(/^(sanity(?:\/|$)|@sanity\/(ui|assist|vision|dashboard|code-input)(?:\/|$)|sanity-plugin-|next-sanity\/studio)/.test(
					specifier,
				) ||
					/(^|\/)studio\//.test(specifier))
			)
				failures.push(`${file}: editor runtime import ${specifier}`)
			ts.forEachChild(node, visit)
		}
		visit(tree)
	}
}
check('src')
check('shared')
if (failures.length) {
	console.error(failures.join('\n'))
	process.exitCode = 1
} else
	console.log(
		'Studio boundary passed: website/shared code does not import editor runtime',
	)
