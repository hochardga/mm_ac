import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

async function expectSignedOutPrimaryNav(page: Page) {
  const navigation = page.getByRole("navigation", { name: /primary/i });
  await expect(navigation).toBeVisible();
  await expect(
    navigation.getByRole("link", { name: /^apply$/i }),
  ).toHaveAttribute("href", "/apply");
  await expect(
    navigation.getByRole("link", { name: /sign in/i }),
  ).toHaveAttribute("href", "/signin");
  await expect(
    navigation.getByRole("link", { name: /vault/i }),
  ).toHaveCount(0);
  await expect(page.getByRole("banner")).toHaveClass(/border-b/);
  await expect(page.getByRole("banner")).toHaveClass(/bg-stone-100\/95/);
}

async function completeIntake(page: Page) {
  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Ash");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");
}

test("navigation responds to signed-out and signed-in state changes", async ({
  page,
}) => {
  await page.goto("/");
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: /apply for field status/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /returning agent sign in/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /open vault/i })).toHaveCount(0);

  await page.goto("/apply");
  await expectSignedOutPrimaryNav(page);

  await page.goto("/signin");
  await expectSignedOutPrimaryNav(page);

  await completeIntake(page);

  await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /vault/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /sign out/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /sign in/i })).toHaveCount(0);

  await page.getByRole("button", { name: /sign out/i }).click();
  await page.waitForURL("**/");
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(
    0,
  );
  await expect(
    page.getByRole("link", { name: /apply for field status/i }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: /returning agent sign in/i }),
  ).toBeVisible();
  await expect(page.getByRole("link", { name: /open vault/i })).toHaveCount(0);
});

test("global primary nav is hidden on case routes after intake", async ({
  page,
}) => {
  await completeIntake(page);

  await page.goto("/cases/hollow-bishop");

  await expect(
    page.getByRole("heading", { name: /the hollow bishop/i }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(
    0,
  );
  const backToVault = page.getByRole("link", { name: /back to vault/i });
  await expect(backToVault).toBeVisible();

  await backToVault.click();
  await page.waitForURL("**/vault");
  await expect(page.getByRole("navigation", { name: /primary/i })).toBeVisible();

  await page.goto("/cases/hollow-bishop");
  await page.getByLabel("Suspect").selectOption("bookkeeper");
  await page.getByLabel("Motive").selectOption("embezzlement");
  await page.getByLabel("Method").selectOption("poisoned-wine");
  await page.getByRole("button", { name: /submit report/i }).click();
  await page.waitForURL("**/cases/hollow-bishop/debrief");

  await expect(
    page.getByRole("heading", { name: /debrief: the hollow bishop/i }),
  ).toBeVisible();
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: /back to vault/i })).toBeVisible();
});
