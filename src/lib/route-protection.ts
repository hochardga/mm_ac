export function isProtectedPath(pathname: string) {
  return (
    pathname === "/vault" ||
    pathname.startsWith("/cases/") ||
    pathname === "/the-system-intro" ||
    pathname.startsWith("/the-system-intro/") ||
    pathname === "/api/the-system-intro/audio" ||
    pathname.startsWith("/api/the-system-intro/audio/")
  );
}
