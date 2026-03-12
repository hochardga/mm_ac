import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("agent can review evidence and save notes plus a draft report", async ({
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

  await expect(
    page.getByRole("heading", { name: /the hollow bishop/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /evidence intake/i }),
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /field notes/i })).toBeVisible();

  await page.getByLabel("Field Notes").fill("Check the receipts.");
  await page.getByRole("button", { name: /save notes/i }).click();
  await expect(page.getByLabel("Field Notes")).toHaveValue(/receipts/i);

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
});
