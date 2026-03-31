import { isProtectedPath } from "@/lib/route-protection";

test("treats vault and case routes as protected", () => {
  expect(isProtectedPath("/vault")).toBe(true);
  expect(isProtectedPath("/cases/hollow-bishop")).toBe(true);
  expect(isProtectedPath("/cases/red-harbor/debrief")).toBe(true);
  expect(isProtectedPath("/the-system-into")).toBe(true);
  expect(isProtectedPath("/api/the-system-into/audio")).toBe(true);
  expect(isProtectedPath("/apply")).toBe(false);
});
