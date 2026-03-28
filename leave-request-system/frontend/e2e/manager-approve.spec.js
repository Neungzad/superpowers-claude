import { test, expect } from "@playwright/test";
import { execSync } from "node:child_process";

async function loginAs(page, email) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill("password123");
  await page.getByTestId("login-button").click();
  await page.waitForURL(/\/dashboard|\/manager/);
}

test.beforeEach(async () => {
  execSync(
    `docker exec leave_postgres psql -U postgres -d leave_management -c "` +
      `DELETE FROM leave_requests; UPDATE leave_balances SET used_days = 0; ` +
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, status) ` +
      `VALUES (2, 'ANNUAL', '2026-09-01', '2026-09-03', 3, 'PENDING');"`,
    { stdio: "pipe" },
  );
});

test("manager approves pending request → row removed from pending tab", async ({
  page,
}) => {
  await loginAs(page, "alice@company.com");
  await page.goto("/manager");
  await expect(page.locator("text=Bob Employee")).toBeVisible();

  await page.locator('button:has-text("Approve")').first().click();
  await expect(page.locator("text=Bob Employee")).not.toBeVisible();
});

test("manager rejects pending request → row removed from pending tab", async ({
  page,
}) => {
  await loginAs(page, "alice@company.com");
  await page.goto("/manager");
  await expect(page.locator("text=Bob Employee")).toBeVisible();

  await page.locator('button:has-text("Reject")').first().click();
  await expect(page.locator("text=Bob Employee")).not.toBeVisible();
});

test("employee cannot access /manager → redirected to /dashboard", async ({
  page,
}) => {
  await loginAs(page, "bob@company.com");
  await page.goto("/manager");
  await expect(page).toHaveURL(/\/dashboard/);
});
