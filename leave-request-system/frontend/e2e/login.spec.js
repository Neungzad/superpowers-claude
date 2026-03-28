import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

test("valid credentials → redirect to /dashboard", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("email-input").fill("bob@company.com");
  await page.getByTestId("password-input").fill("password123");
  await page.getByTestId("login-button").click();
  await expect(page).toHaveURL(/\/dashboard/);
});

test("invalid credentials → inline error displayed", async ({ page }) => {
  await page.goto("/login");
  await page.getByTestId("email-input").fill("bob@company.com");
  await page.getByTestId("password-input").fill("wrongpassword");
  await page.getByTestId("login-button").click();
  await expect(page.getByTestId("login-error")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});
