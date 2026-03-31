import { isProtectedPath } from "@/lib/route-protection";

test("treats vault, case, and system intro routes as protected", () => {
  expect(isProtectedPath("/vault")).toBe(true);
  expect(isProtectedPath("/cases/hollow-bishop")).toBe(true);
  expect(isProtectedPath("/cases/red-harbor/debrief")).toBe(true);
  expect(isProtectedPath("/the-system-intro")).toBe(true);
  expect(isProtectedPath("/the-system-intro/appendix")).toBe(true);
  expect(isProtectedPath("/api/the-system-intro/audio")).toBe(true);
  expect(isProtectedPath("/api/the-system-intro/audio/chunk")).toBe(true);
  expect(isProtectedPath("/apply")).toBe(false);
});
