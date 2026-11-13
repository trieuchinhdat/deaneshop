const fs = require('node:fs'),
	path = require('node:path'),
	vm = require('node:vm'),
	ts = require('typescript')
function load(file, globals = {}) {
	const filename = path.resolve(file)
	const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
		compilerOptions: {
			module: ts.ModuleKind.CommonJS,
			target: ts.ScriptTarget.ES2022,
			esModuleInterop: true,
		},
	}).outputText
	const module = { exports: {} }
	vm.runInNewContext(
		code,
		{
			module,
			exports: module.exports,
			console,
			URL,
			Buffer,
			process,
			setTimeout,
			clearTimeout,
			URLSearchParams,
			...globals,
			require(name) {
				if (name.startsWith('@shared/'))
					return load(path.resolve('../shared', name.slice(8)) + '.ts', globals)
				if (name.startsWith('.'))
					return load(
						path.resolve(path.dirname(filename), name) + '.ts',
						globals,
					)
				return require(name)
			},
		},
		{ filename },
	)
	return module.exports
}
module.exports = { load }
