import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("incorrect graded objective submissions keep the answer visible and show feedback", async ({
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
  await page.getByLabel("Response").selectOption("captain");

  await page.getByRole("button", { name: /submit objective/i }).click();

  await expect(
    page.getByText(/incorrect graded objective submission\./i),
  ).toBeVisible();
  await expect(page.getByLabel("Response")).toHaveValue("captain");
});
