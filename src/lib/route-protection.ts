export function isProtectedPath(pathname: string) {
  return pathname === "/vault" || pathname.startsWith("/cases/");
}
