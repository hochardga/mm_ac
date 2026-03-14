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

  await page.goto("/vault");
  await expect(
    page.getByRole("link", { name: /resume notes/i }),
  ).toHaveAttribute("href", "/cases/hollow-bishop#field-notes");

  await Promise.all([
    page.waitForURL("**/cases/hollow-bishop#field-notes"),
    page.getByRole("link", { name: /resume notes/i }).click(),
  ]);
  await expect(page.getByLabel("Field Notes")).toHaveValue(/receipts/i);
  await expect(
    page.getByText(/ashfall restored your saved progress/i),
  ).toBeVisible();

  await page.getByLabel("Suspect").selectOption("bookkeeper");
  await page.getByLabel("Motive").selectOption("embezzlement");
  await page.getByLabel("Method").selectOption("poisoned-wine");
  await Promise.all([
    page.waitForURL(/\/cases\/hollow-bishop\?evidence=/),
    page.getByRole("button", { name: /save draft/i }).click(),
  ]);
  await expect(page.getByLabel("Suspect")).toHaveValue("bookkeeper");
  await expect(page.getByLabel("Motive")).toHaveValue("embezzlement");
  await expect(page.getByLabel("Method")).toHaveValue("poisoned-wine");

  await page.goto("/vault");
  await expect(
    page.getByRole("link", { name: /resume report/i }),
  ).toHaveAttribute("href", "/cases/hollow-bishop#draft-report");

  await Promise.all([
    page.waitForURL("**/cases/hollow-bishop#draft-report"),
    page.getByRole("link", { name: /resume report/i }).click(),
  ]);
  await expect(page.getByLabel("Field Notes")).toHaveValue(/receipts/i);
  await expect(page.getByLabel("Suspect")).toHaveValue("bookkeeper");
  await expect(
    page.getByText(/ashfall restored your saved progress/i),
  ).toBeVisible();

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
