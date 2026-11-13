import prefixes from '../../shared/runtime-routes.json'

export function isRuntimePath(pathname: string): boolean {
	return prefixes.some((prefix) => pathname === `/${prefix}` || pathname.startsWith(`/${prefix}/`))
}
