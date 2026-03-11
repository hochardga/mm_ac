import { isProtectedPath } from "@/lib/auth";

test("treats vault and case routes as protected", () => {
  expect(isProtectedPath("/vault")).toBe(true);
  expect(isProtectedPath("/cases/hollow-bishop")).toBe(true);
  expect(isProtectedPath("/apply")).toBe(false);
});
