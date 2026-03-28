import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  port: 3001,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function loginAs(email, password = "password123") {
  const res = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get("set-cookie")?.split(";")[0] || "";
}

async function apiFetch(method, path, body, cookie) {
  const res = await fetch(`http://localhost:3001${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

describe("POST /api/leave-requests", () => {
  let bobCookie;

  beforeEach(async () => {
    await pool.query("DELETE FROM leave_requests");
    await pool.query("UPDATE leave_balances SET used_days = 0");
    bobCookie = await loginAs("bob@company.com");
  });

  afterAll(() => pool.end());

  it("ANNUAL valid → 201, status PENDING, balance unchanged", async () => {
    const { status, data } = await apiFetch(
      "POST",
      "/api/leave-requests",
      {
        leaveType: "ANNUAL",
        startDate: "2026-09-01",
        endDate: "2026-09-03",
        reason: "Vacation",
      },
      bobCookie,
    );

    expect(status).toBe(201);
    expect(data.status).toBe("PENDING");
    expect(data.totalDays).toBe(3);

    const bal = await pool.query(
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'ANNUAL' AND year = 2026",
    );
    expect(bal.rows[0].used_days).toBe(0);
  });

  it("SICK valid → 201, status APPROVED, balance immediately decremented", async () => {
    const { status, data } = await apiFetch(
      "POST",
      "/api/leave-requests",
      {
        leaveType: "SICK",
        startDate: "2026-09-01",
        endDate: "2026-09-01",
      },
      bobCookie,
    );

    expect(status).toBe(201);
    expect(data.status).toBe("APPROVED");
    expect(data.totalDays).toBe(1);

    const bal = await pool.query(
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'SICK' AND year = 2026",
    );
    expect(bal.rows[0].used_days).toBe(1);
  });

  it("insufficient balance → 422 with error message", async () => {
    const { status, data } = await apiFetch(
      "POST",
      "/api/leave-requests",
      {
        leaveType: "ANNUAL",
        startDate: "2026-09-01",
        endDate: "2026-09-30",
      },
      bobCookie,
    );

    expect(status).toBe(422);
    expect(data.message || data.statusMessage || data.error).toMatch(/Insufficient leave balance/);
  });
});
