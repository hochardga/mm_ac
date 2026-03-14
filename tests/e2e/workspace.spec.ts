import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("agent can review evidence, unlock the next objective, and save a staged draft", async ({
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
  await expect(
    page.getByRole("heading", { name: /active objectives/i }),
  ).toBeVisible();
  await expect(page.getByText(/stage 1 of 2/i)).toBeVisible();
  await expect(page.getByText(/ledger review/i)).toBeVisible();

  await page.getByLabel("Field Notes").fill("Check the receipts.");
  await page.getByRole("button", { name: /save notes/i }).click();
  await expect(page.getByLabel("Field Notes")).toHaveValue(/receipts/i);

  await page.getByLabel("Response").selectOption("false");
  await page.getByRole("button", { name: /submit objective/i }).click();
  await expect(page.getByText(/stage 2 of 2/i)).toBeVisible();
  await expect(page.getByText(/poison proof/i)).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /who poisoned the sacramental wine to silence the bishop/i,
    }),
  ).toBeVisible();

  await page.getByLabel("Response").selectOption("bookkeeper");
  await Promise.all([
    page.waitForURL("**/cases/hollow-bishop*"),
    page.getByRole("button", { name: /save draft/i }).click(),
  ]);
  await page.reload();

  await expect(page.getByLabel("Response")).toHaveValue("bookkeeper");
});

test("agent can switch evidence types and keep the notebook visible", async ({
  page,
}) => {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Harbor");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");

  await page.goto("/cases/red-harbor?evidence=dispatch-log");

  await expect(page.getByRole("heading", { name: /field notes/i })).toBeVisible();

  await Promise.all([
    page.waitForURL("**/cases/red-harbor?evidence=night-watch-thread"),
    page.getByRole("link", { name: /night watch exchange/i }).click(),
  ]);

  await expect(page.getByRole("heading", { name: /field notes/i })).toBeVisible();
  await expect(
    page.getByText(/active evidence: night watch exchange/i),
  ).toBeVisible();

  await page.getByLabel("Response").selectOption("dispatcher");

  await Promise.all([
    page.waitForURL("**/cases/red-harbor?evidence=night-watch-thread"),
    page.getByRole("button", { name: /save draft/i }).click(),
  ]);
  await page.reload();

  await expect(page.getByLabel("Response")).toHaveValue("dispatcher");
});

test("agent can open photo evidence and inspect a larger preview", async ({
  page,
}) => {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Lens");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");

  await page.goto("/cases/hollow-bishop?evidence=vestry-scene-photo");

  await expect(page.getByRole("heading", { name: /field notes/i })).toBeVisible();
  await expect(page.getByText(/date:\s*unknown/i)).toBeVisible();

  await page.getByRole("button", { name: /open larger preview/i }).click();
  await expect(
    page.getByRole("dialog", { name: /vestry scene photo/i }),
  ).toBeVisible();
  await page.getByRole("button", { name: /close preview/i }).click();
  await expect(
    page.getByRole("heading", { name: /active objectives/i }),
  ).toBeVisible();
});
