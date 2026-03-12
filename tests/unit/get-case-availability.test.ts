import { getCaseAvailability } from "@/features/maintenance/get-case-availability";

test("shows maintenance for a broken published revision", () => {
  expect(
    getCaseAvailability({ published: true, broken: true, hasPlayerCase: false }),
  ).toBe("Maintenance");
});

test("keeps started unpublished cases available", () => {
  expect(
    getCaseAvailability({ published: false, broken: false, hasPlayerCase: true }),
  ).toBe("Available");
});
