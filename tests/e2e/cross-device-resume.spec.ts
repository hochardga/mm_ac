import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("saved notes and drafts resume across browser contexts", async ({
  browser,
}) => {
  const primaryContext = await browser.newContext();
  const primaryPage = await primaryContext.newPage();
  const email = `agent-${randomUUID()}@example.com`;

  await primaryPage.goto("/apply");
  await primaryPage.getByLabel("Operative Alias").fill("Agent Ash");
  await primaryPage.getByLabel("Agency Email").fill(email);
  await primaryPage.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await primaryPage.getByRole("button", { name: /submit application/i }).click();
  await primaryPage.waitForURL("**/vault");

  await primaryPage.goto("/cases/hollow-bishop");
  await primaryPage.getByLabel("Field Notes").fill("Cross-device proof.");
  await primaryPage.getByRole("button", { name: /save notes/i }).click();
  await primaryPage.getByLabel("Response").selectOption("false");
  await primaryPage.getByRole("button", { name: /submit objective/i }).click();
  await expect(
    primaryPage.getByText(/who poisoned the sacramental wine to silence the bishop/i),
  ).toBeVisible();
  await primaryPage.getByLabel("Response").selectOption("bookkeeper");
  await Promise.all([
    primaryPage.waitForLoadState("networkidle"),
    primaryPage.getByRole("button", { name: /save draft/i }).click(),
  ]);
  await expect(primaryPage.getByLabel("Response")).toHaveValue("bookkeeper");

  const secondaryContext = await browser.newContext({
    storageState: await primaryContext.storageState(),
  });
  const secondaryPage = await secondaryContext.newPage();

  await secondaryPage.goto("/cases/hollow-bishop");
  await expect(secondaryPage.getByLabel("Field Notes")).toHaveValue(
    /cross-device proof/i,
  );
  await expect(
    secondaryPage.getByText(/who poisoned the sacramental wine to silence the bishop/i),
  ).toBeVisible();
  await expect(secondaryPage.getByLabel("Response")).toHaveValue("bookkeeper");

  await secondaryContext.close();
  await primaryContext.close();
});
