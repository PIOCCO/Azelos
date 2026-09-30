/**
 * Single authoritative sidebar active item from the current URL.
 * Prefix match requires a path segment boundary (trailing slash), so `/dora`
 * does not match `/dora/relationship-map`.
 */
export function navPathMatches(pathname: string, itemPath: string): boolean {
  if (itemPath === "/") return pathname === "/";
  if (pathname === itemPath) return true;
  return pathname.startsWith(`${itemPath}/`);
}

/** Among all nav paths, return the most specific path that matches pathname. */
export function resolveActiveNavPath(pathname: string, navPaths: string[]): string | null {
  const matches = navPaths.filter((p) => navPathMatches(pathname, p));
  if (matches.length === 0) return null;
  return matches.sort((a, b) => b.length - a.length)[0]!;
}

export function isNavItemActive(pathname: string, itemPath: string, allNavPaths: string[]): boolean {
  return resolveActiveNavPath(pathname, allNavPaths) === itemPath;
}
