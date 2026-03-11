import { expect, test } from "vitest";

import {
  getDisplayStatus,
  getVaultAvailability,
} from "@/features/cases/case-status";

test("maps closed_unsolved to Case Closed", () => {
  expect(getDisplayStatus("closed_unsolved")).toBe("Case Closed");
});

test("maps unpublished cases to hidden availability", () => {
  expect(getVaultAvailability({ published: false })).toBe("Hidden");
});
