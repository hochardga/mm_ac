import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("new recruit can apply and reach the vault", async ({ page }) => {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Ash");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();

  await page.waitForURL("**/vault");
  await expect(
    page.getByRole("heading", { name: /dossier vault/i }),
  ).toBeVisible();
});
