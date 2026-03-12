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
  await primaryPage.getByLabel("Suspect").selectOption("bookkeeper");
  await primaryPage.getByLabel("Motive").selectOption("embezzlement");
  await primaryPage.getByLabel("Method").selectOption("poisoned-wine");
  await Promise.all([
    primaryPage.waitForLoadState("networkidle"),
    primaryPage.getByRole("button", { name: /save draft/i }).click(),
  ]);
  await expect(primaryPage.getByLabel("Suspect")).toHaveValue("bookkeeper");
  await expect(primaryPage.getByLabel("Motive")).toHaveValue("embezzlement");
  await expect(primaryPage.getByLabel("Method")).toHaveValue("poisoned-wine");

  const secondaryContext = await browser.newContext({
    storageState: await primaryContext.storageState(),
  });
  const secondaryPage = await secondaryContext.newPage();

  await secondaryPage.goto("/cases/hollow-bishop");
  await expect(secondaryPage.getByLabel("Field Notes")).toHaveValue(
    /cross-device proof/i,
  );
  await expect(secondaryPage.getByLabel("Suspect")).toHaveValue("bookkeeper");
  await expect(secondaryPage.getByLabel("Motive")).toHaveValue("embezzlement");
  await expect(secondaryPage.getByLabel("Method")).toHaveValue("poisoned-wine");

  await secondaryContext.close();
  await primaryContext.close();
});
