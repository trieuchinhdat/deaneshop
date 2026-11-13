const fs = require('node:fs')
const path = require('node:path')
const prettier = require('prettier')
const file = path.resolve(__dirname, '../../src/sanity/types.ts')
prettier
	.format(fs.readFileSync(file, 'utf8'), {
		parser: 'typescript',
		semi: false,
		useTabs: true,
		singleQuote: true,
		trailingComma: 'all',
	})
	.then((text) => fs.writeFileSync(file, text))
	.catch((error) => {
		console.error(error.message)
		process.exitCode = 1
	})
