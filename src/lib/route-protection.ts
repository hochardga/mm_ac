export function isProtectedPath(pathname: string) {
  return (
    pathname === "/vault" ||
    pathname.startsWith("/cases/") ||
    pathname === "/the-system-into" ||
    pathname.startsWith("/the-system-into/") ||
    pathname === "/api/the-system-into/audio" ||
    pathname.startsWith("/api/the-system-into/audio/")
  );
}
