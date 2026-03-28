import { test, expect } from "@playwright/test";

async function loginAs(page, email) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill("password123");
  await page.getByTestId("login-button").click();
  await page.waitForURL(/\/dashboard/);
}

test.beforeEach(async ({ page }) => {
  const { execSync } = await import("node:child_process");
  execSync(
    `docker exec leave_postgres psql -U postgres -d leave_management -c "DELETE FROM leave_requests; UPDATE leave_balances SET used_days = 0;"`,
    { stdio: "pipe" },
  );
  await loginAs(page, "bob@company.com");
});

test("submit valid annual leave → modal closes, status PENDING", async ({
  page,
}) => {
  await page.getByTestId("submit-leave-btn").click();

  await page.locator("select").selectOption("ANNUAL");

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  await page.locator('input[type="date"]').first().fill(dateStr);
  await page.locator('input[type="date"]').last().fill(dateStr);
  await page.locator('button[type="submit"]').click();

  await expect(page.locator('button[type="submit"]')).not.toBeVisible();
});

test("submit leave with insufficient balance → inline error shown", async ({
  page,
}) => {
  await page.getByTestId("submit-leave-btn").click();

  await page.locator("select").selectOption("ANNUAL");

  const start = new Date();
  start.setDate(start.getDate() + 1);
  const end = new Date(start);
  end.setDate(end.getDate() + 20);

  await page
    .locator('input[type="date"]')
    .first()
    .fill(start.toISOString().split("T")[0]);
  await page
    .locator('input[type="date"]')
    .last()
    .fill(end.toISOString().split("T")[0]);
  await page.locator('button[type="submit"]').click();

  await expect(page.locator("text=Insufficient leave balance")).toBeVisible();
});
