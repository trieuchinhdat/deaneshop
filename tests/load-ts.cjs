const fs = require('node:fs')
const path = require('node:path')
const vm = require('node:vm')
const ts = require('typescript')
function load(file, mocks = {}, globals = {}) {
 const filename = path.resolve(file)
 const code = ts.transpileModule(fs.readFileSync(filename, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText
 const module = { exports: {} }
 const sandbox = { module, exports: module.exports, Buffer, URL, URLSearchParams, Request, Response, Headers, AbortSignal, TextEncoder, setTimeout, clearTimeout, process, console, fetch, ...globals,
 require(name) {
  if (Object.hasOwn(mocks, name)) return mocks[name]
  if (name.startsWith('@shared/')) return load(path.resolve('shared', name.slice(8)) + '.ts', mocks, globals)
  if (name.startsWith('@/')) return load(path.resolve('src', name.slice(2)) + '.ts', mocks, globals)
  if (name.startsWith('.') && /\.[cm]js$/.test(name)) return require(path.resolve(path.dirname(filename), name))
  if (name.startsWith('.')) return load(path.resolve(path.dirname(filename), name) + '.ts', mocks, globals)
  return require(name)
 }}
 vm.runInNewContext(code, sandbox, { filename })
 return module.exports
}
module.exports = { load }
