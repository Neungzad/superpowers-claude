import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { setup } from "@nuxt/test-utils/e2e";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  port: 3002,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function loginAs(email, password = "password123") {
  const res = await fetch("http://localhost:3002/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get("set-cookie")?.split(";")[0] || "";
}

async function apiFetch(method, path, body, cookie) {
  const res = await fetch(`http://localhost:3002${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: res.status, data: await res.json().catch(() => null) };
}

describe("PATCH /api/leave-requests/:id/approve and /reject", () => {
  let aliceCookie, bobCookie, requestId;

  beforeEach(async () => {
    await pool.query("DELETE FROM leave_requests");
    await pool.query("UPDATE leave_balances SET used_days = 0");

    aliceCookie = await loginAs("alice@company.com");
    bobCookie = await loginAs("bob@company.com");

    const result = await pool.query(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, status)
       VALUES (2, 'ANNUAL', '2026-09-01', '2026-09-03', 3, 'PENDING') RETURNING id`,
    );
    requestId = result.rows[0].id;
  });

  afterAll(() => pool.end());

  it("manager approve → 200, used_days incremented", async () => {
    const { status, data } = await apiFetch(
      "PATCH",
      `/api/leave-requests/${requestId}/approve`,
      null,
      aliceCookie,
    );

    expect(status).toBe(200);
    expect(data.ok).toBe(true);

    const bal = await pool.query(
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'ANNUAL' AND year = 2026",
    );
    expect(bal.rows[0].used_days).toBe(3);
  });

  it("employee tries to approve → 403", async () => {
    const { status } = await apiFetch(
      "PATCH",
      `/api/leave-requests/${requestId}/approve`,
      null,
      bobCookie,
    );
    expect(status).toBe(403);
  });

  it("manager reject → 200, used_days unchanged", async () => {
    const { status, data } = await apiFetch(
      "PATCH",
      `/api/leave-requests/${requestId}/reject`,
      null,
      aliceCookie,
    );

    expect(status).toBe(200);
    expect(data.ok).toBe(true);

    const bal = await pool.query(
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'ANNUAL' AND year = 2026",
    );
    expect(bal.rows[0].used_days).toBe(0);
  });

  it("approve already-approved request → 409", async () => {
    await apiFetch("PATCH", `/api/leave-requests/${requestId}/approve`, null, aliceCookie);
    const { status } = await apiFetch("PATCH", `/api/leave-requests/${requestId}/approve`, null, aliceCookie);
    expect(status).toBe(409);
  });
});
