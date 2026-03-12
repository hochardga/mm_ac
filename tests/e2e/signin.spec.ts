import { randomUUID } from "node:crypto";

import { expect, test } from "@playwright/test";

test("newly created agents can sign back in from a fresh browser context", async ({
  browser,
}) => {
  const email = `agent-${randomUUID()}@example.com`;
  const password = "CaseFile123!";

  const onboardingContext = await browser.newContext();
  const onboardingPage = await onboardingContext.newPage();

  await onboardingPage.goto("/apply");
  await onboardingPage.getByLabel("Operative Alias").fill("Agent Ash");
  await onboardingPage.getByLabel("Agency Email").fill(email);
  await onboardingPage.getByLabel("Clearance Phrase").fill(password);
  await onboardingPage
    .getByRole("button", { name: /submit application/i })
    .click();
  await onboardingPage.waitForURL("**/vault");
  await onboardingContext.close();

  const signinContext = await browser.newContext();
  const signinPage = await signinContext.newPage();

  await signinPage.goto("/signin");
  await signinPage.getByPlaceholder("agent@ashfall.local").fill(email);
  await signinPage.getByPlaceholder("Clearance phrase").fill(password);
  await signinPage.getByRole("button", { name: /report in/i }).click();

  await signinPage.waitForURL("**/vault");
  await expect(
    signinPage.getByRole("heading", { name: /dossier vault/i }),
  ).toBeVisible();
});
