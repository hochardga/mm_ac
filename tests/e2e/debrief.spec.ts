import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("solving a case opens a debrief dossier with the final theory and reconstruction", async ({
  page,
}) => {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Ember");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");

  await page.goto("/cases/hollow-bishop");
  await page.getByLabel("Suspect").selectOption("bookkeeper");
  await page.getByLabel("Motive").selectOption("embezzlement");
  await page.getByLabel("Method").selectOption("poisoned-wine");
  await page.getByRole("button", { name: /submit report/i }).click();

  await page.waitForURL("**/cases/hollow-bishop/debrief");
  await expect(
    page.getByRole("heading", { name: /your final report/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /ashfall reconstruction/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /attempt history/i }),
  ).toBeVisible();
  await expect(page.getByText("Bookkeeper Mara Quinn").first()).toBeVisible();
  await expect(page.getByText("Embezzlement cover-up").first()).toBeVisible();
  await expect(page.getByText("Poisoned sacramental wine").first()).toBeVisible();
  await expect(page.getByText(/attempt 1/i).first()).toBeVisible();
});
