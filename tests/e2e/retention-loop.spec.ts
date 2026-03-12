import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("player can return, solve a case, and launch a second case", async ({
  page,
}) => {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Ash");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");

  await page.goto("/cases/hollow-bishop");
  await page.getByLabel("Field Notes").fill("Return to the receipts.");
  await page.getByRole("button", { name: /save notes/i }).click();
  await page.getByLabel("Suspect").selectOption("bookkeeper");
  await page.getByLabel("Motive").selectOption("embezzlement");
  await page.getByLabel("Method").selectOption("poisoned-wine");
  await Promise.all([
    page.waitForLoadState("networkidle"),
    page.getByRole("button", { name: /save draft/i }).click(),
  ]);
  await expect(page.getByLabel("Suspect")).toHaveValue("bookkeeper");
  await expect(page.getByLabel("Motive")).toHaveValue("embezzlement");
  await expect(page.getByLabel("Method")).toHaveValue("poisoned-wine");

  await page.goto("/vault");
  await page.goto("/cases/hollow-bishop");
  await expect(page.getByLabel("Field Notes")).toHaveValue(/receipts/i);
  await expect(page.getByLabel("Suspect")).toHaveValue("bookkeeper");

  await page.getByRole("button", { name: /submit report/i }).click();
  await page.waitForURL("**/debrief");
  await expect(
    page.getByRole("heading", { name: /debrief: the hollow bishop/i }),
  ).toBeVisible();

  await page.goto("/cases/red-harbor");
  await expect(
    page.getByRole("heading", { name: /signal at red harbor/i }),
  ).toBeVisible();
});
