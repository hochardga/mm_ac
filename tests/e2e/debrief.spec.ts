import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("solving a staged case opens a debrief dossier with objective answers and reconstruction", async ({
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
  await page.getByLabel("Response").selectOption("false");
  await page.getByRole("button", { name: /submit objective/i }).click();
  await expect(
    page.getByRole("heading", {
      name: /who poisoned the sacramental wine to silence the bishop/i,
    }),
  ).toBeVisible();
  await page.getByLabel("Response").selectOption("bookkeeper");
  await page.getByRole("button", { name: /submit objective/i }).click();

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
  await expect(
    page.getByText(/who poisoned the sacramental wine to silence the bishop/i).first(),
  ).toBeVisible();
  await expect(page.getByText("Bookkeeper Mara Quinn").first()).toBeVisible();
  await expect(page.getByText(/attempt 1/i).first()).toBeVisible();
});
