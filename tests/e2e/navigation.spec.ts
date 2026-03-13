import { randomUUID } from "node:crypto";

import { expect, test, type Page } from "@playwright/test";

async function expectPrimaryNav(page: Page) {
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
  ).toHaveAttribute("href", "/vault");
}

test("shared primary navigation appears on all non-case shell routes", async ({
  page,
}) => {
  await page.goto("/");
  await expectPrimaryNav(page);

  await page.goto("/apply");
  await expectPrimaryNav(page);

  await page.goto("/signin");
  await expectPrimaryNav(page);

  const email = `agent-${randomUUID()}@example.com`;

  await page.goto("/apply");
  await page.getByLabel("Operative Alias").fill("Agent Ash");
  await page.getByLabel("Agency Email").fill(email);
  await page.getByLabel("Clearance Phrase").fill("CaseFile123!");
  await page.getByRole("button", { name: /submit application/i }).click();
  await page.waitForURL("**/vault");

  await expectPrimaryNav(page);
});

test("global primary nav is hidden on case routes after intake", async ({
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
  await expect(page.getByRole("navigation", { name: /primary/i })).toHaveCount(
    0,
  );
});
