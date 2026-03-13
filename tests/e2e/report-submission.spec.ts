import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("incorrect report keeps submitted deductions visible and shows handler feedback", async ({
  page,
}) => {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Harbor");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");

  await page.goto("/cases/red-harbor");
  await page.getByLabel("Suspect").selectOption("captain");
  await page.getByLabel("Motive").selectOption("insurance");
  await page.getByLabel("Method").selectOption("drowned");

  await page.getByRole("button", { name: /submit report/i }).click();

  await expect(
    page.getByText(
      /the harbor file remains open\. reconstruct the signal chain again\./i,
    ),
  ).toBeVisible();
  await expect(page.getByLabel("Suspect")).toHaveValue("captain");
  await expect(page.getByLabel("Motive")).toHaveValue("insurance");
  await expect(page.getByLabel("Method")).toHaveValue("drowned");
});
