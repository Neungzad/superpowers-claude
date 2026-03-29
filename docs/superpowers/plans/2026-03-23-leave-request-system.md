# Leave Request System — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the full Leave Request System — React + Vite frontend, Nuxt 3 API backend, PostgreSQL database, with unit, integration, and E2E test coverage.

**Architecture:** Monorepo at `superpowers-claude/leave-request-system/`. React frontend (port 5173) proxies `/api/*` to Nuxt 3 API server (port 3000). PostgreSQL runs in Docker. Flyway handles DB migrations. Sessions use Nuxt/h3 `useSession()` with signed cookie. Integration tests use `@nuxt/test-utils/e2e` to spin up the server against a real DB.

**Tech Stack:** React 18, React Router 6, Vite 5, Nuxt 3 (Nitro/h3), node-postgres (pg), bcryptjs, Flyway (Docker image), Vitest 1, @nuxt/test-utils, Playwright, concurrently

---

## File Map

**Root**

- `leave-request-system/Makefile`
- `leave-request-system/docker-compose.yml`
- `leave-request-system/.env.example`
- `leave-request-system/.gitignore`

**Database**

- `leave-request-system/db/migrations/V1__create_users_table.sql`
- `leave-request-system/db/migrations/V2__create_leave_balances_table.sql`
- `leave-request-system/db/migrations/V3__create_leave_requests_table.sql`
- `leave-request-system/db/migrations/V99__seed_data.sql`

**Backend**

- `leave-request-system/backend/package.json`
- `leave-request-system/backend/nuxt.config.ts`
- `leave-request-system/backend/vitest.config.ts`
- `leave-request-system/backend/server/utils/db.ts`
- `leave-request-system/backend/server/utils/session.ts`
- `leave-request-system/backend/server/utils/businessDays.ts`
- `leave-request-system/backend/server/utils/validation.ts`
- `leave-request-system/backend/server/middleware/auth.ts`
- `leave-request-system/backend/server/routes/api/auth/login.post.ts`
- `leave-request-system/backend/server/routes/api/auth/logout.post.ts`
- `leave-request-system/backend/server/routes/api/auth/me.get.ts`
- `leave-request-system/backend/server/routes/api/leave-balances/index.get.ts`
- `leave-request-system/backend/server/routes/api/leave-requests/index.get.ts`
- `leave-request-system/backend/server/routes/api/leave-requests/index.post.ts`
- `leave-request-system/backend/server/routes/api/leave-requests/[id].approve.patch.ts`
- `leave-request-system/backend/server/routes/api/leave-requests/[id].reject.patch.ts`
- `leave-request-system/backend/test/unit/businessDays.test.js`
- `leave-request-system/backend/test/unit/validateBalance.test.js`
- `leave-request-system/backend/test/unit/hasOverlap.test.js`
- `leave-request-system/backend/test/integration/leaveRequest.post.test.js`
- `leave-request-system/backend/test/integration/managerApprove.test.js`

**Frontend**

- `leave-request-system/frontend/package.json`
- `leave-request-system/frontend/vite.config.js`
- `leave-request-system/frontend/index.html`
- `leave-request-system/frontend/src/main.jsx`
- `leave-request-system/frontend/src/App.jsx`
- `leave-request-system/frontend/src/api/auth.js`
- `leave-request-system/frontend/src/api/leaveBalances.js`
- `leave-request-system/frontend/src/api/leaveRequests.js`
- `leave-request-system/frontend/src/components/NavBar.jsx`
- `leave-request-system/frontend/src/components/LeaveBalanceCard.jsx`
- `leave-request-system/frontend/src/components/LeaveRequestTable.jsx`
- `leave-request-system/frontend/src/components/SubmitLeaveModal.jsx`
- `leave-request-system/frontend/src/pages/LoginPage.jsx`
- `leave-request-system/frontend/src/pages/DashboardPage.jsx`
- `leave-request-system/frontend/src/pages/ManagerPage.jsx`
- `leave-request-system/frontend/playwright.config.js`
- `leave-request-system/frontend/e2e/login.spec.js`
- `leave-request-system/frontend/e2e/submit-leave.spec.js`
- `leave-request-system/frontend/e2e/manager-approve.spec.js`

---

## Task 1: Project Scaffolding

**Files:**

- Create: `leave-request-system/docker-compose.yml`
- Create: `leave-request-system/.env.example`
- Create: `leave-request-system/.gitignore`
- Create: `leave-request-system/Makefile` (skeleton — completed in Task 12)

- [ ] **Step 1: Create directory structure**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
mkdir -p leave-request-system/db/migrations
mkdir -p leave-request-system/backend
mkdir -p leave-request-system/frontend
```

- [ ] **Step 2: Write docker-compose.yml**

```yaml
# leave-request-system/docker-compose.yml
services:
  postgres:
    image: postgres:15-alpine
    container_name: leave_postgres # fixed name so E2E tests can find it reliably
    environment:
      POSTGRES_DB: leave_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

- [ ] **Step 3: Write .env.example**

```bash
# leave-request-system/.env.example
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=leave_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management
SESSION_SECRET=change-me-in-production
NODE_ENV=development
```

Copy to `.env`:

```bash
cp leave-request-system/.env.example leave-request-system/.env
```

- [ ] **Step 4: Write .gitignore**

```gitignore
# leave-request-system/.gitignore
.env
node_modules/
.nuxt/
.output/
dist/
*.local
.DS_Store
```

- [ ] **Step 5: Write skeleton Makefile**

```makefile
# leave-request-system/Makefile
-include .env
export

.PHONY: dev migrate seed test test-e2e db-reset build

dev:
	@echo "TODO: implement in Task 12"

migrate:
	@echo "TODO: implement in Task 12"

seed: migrate

test:
	@echo "TODO: implement in Task 12"

test-e2e:
	@echo "TODO: implement in Task 12"

db-reset:
	@echo "TODO: implement in Task 12"

build:
	@echo "TODO: implement in Task 12"
```

- [ ] **Step 6: Start Docker DB and verify**

```bash
cd leave-request-system
docker-compose up -d
docker-compose ps
```

Expected: postgres container is `running` on port 5432.

- [ ] **Step 7: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/
git commit -m "feat: scaffold leave-request-system project structure"
```

---

## Task 2: Database Migrations

**Files:**

- Create: `leave-request-system/db/migrations/V1__create_users_table.sql`
- Create: `leave-request-system/db/migrations/V2__create_leave_balances_table.sql`
- Create: `leave-request-system/db/migrations/V3__create_leave_requests_table.sql`
- Create: `leave-request-system/db/migrations/V99__seed_data.sql`

- [ ] **Step 1: Write V1 — users table**

```sql
-- leave-request-system/db/migrations/V1__create_users_table.sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('employee', 'manager')),
    password    VARCHAR(255) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

- [ ] **Step 2: Write V2 — leave_balances table**

```sql
-- leave-request-system/db/migrations/V2__create_leave_balances_table.sql
CREATE TABLE leave_balances (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id),
    leave_type      VARCHAR(20)  NOT NULL CHECK (leave_type IN ('ANNUAL', 'SICK', 'PERSONAL')),
    year            INTEGER      NOT NULL,
    total_days      INTEGER      NOT NULL,
    used_days       INTEGER      NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    UNIQUE (user_id, leave_type, year)
);
```

- [ ] **Step 3: Write V3 — leave_requests table**

```sql
-- leave-request-system/db/migrations/V3__create_leave_requests_table.sql
CREATE TABLE leave_requests (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id),
    leave_type      VARCHAR(20)  NOT NULL CHECK (leave_type IN ('ANNUAL', 'SICK', 'PERSONAL')),
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    total_days      INTEGER      NOT NULL,
    reason          TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by     INTEGER      REFERENCES users(id),
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);
```

- [ ] **Step 4: Generate bcrypt hash and write V99 seed migration**

> ⚠️ **Do NOT run `make migrate` until this step is complete.** Flyway will run V99 with a literal placeholder string if you migrate too early, making all logins fail silently.

Install bcryptjs temporarily to generate the hash:

```bash
cd leave-request-system
npm init -y
npm install --no-save bcryptjs
node -e "const b = require('bcryptjs'); console.log(b.hashSync('password123', 10))"
```

Copy the output (starts with `$2b$10$...`). Then write V99, replacing `BCRYPT_HASH_HERE` with the actual hash:

```sql
-- leave-request-system/db/migrations/V99__seed_data.sql
-- Password for all users: password123
-- Hash generated with: node -e "const b = require('bcryptjs'); console.log(b.hashSync('password123', 10))"

INSERT INTO users (name, email, role, password) VALUES
  ('Alice Manager',  'alice@company.com',  'manager',  'BCRYPT_HASH_HERE'),
  ('Bob Employee',   'bob@company.com',    'employee', 'BCRYPT_HASH_HERE'),
  ('Carol Employee', 'carol@company.com',  'employee', 'BCRYPT_HASH_HERE');

INSERT INTO leave_balances (user_id, leave_type, year, total_days) VALUES
  (2, 'ANNUAL',   2025, 10),
  (2, 'SICK',     2025, 30),
  (2, 'PERSONAL', 2025, 3),
  (3, 'ANNUAL',   2025, 10),
  (3, 'SICK',     2025, 30),
  (3, 'PERSONAL', 2025, 3);
```

- [ ] **Step 5: Commit migrations (without running yet — wait until Task 3 Step 9)**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/db/
git commit -m "feat: add flyway database migrations"
```

---

## Task 3: Backend Foundation

**Files:**

- Create: `leave-request-system/backend/package.json`
- Create: `leave-request-system/backend/nuxt.config.ts`
- Create: `leave-request-system/backend/server/utils/db.ts`
- Create: `leave-request-system/backend/server/utils/session.ts`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "leave-request-backend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "nuxt dev --port 3000",
    "build": "nuxt build",
    "start": "node .output/server/index.mjs",
    "test": "vitest run",
    "test:watch": "vitest"
  },
  "dependencies": {
    "nuxt": "^3.13.0",
    "pg": "^8.12.0",
    "bcryptjs": "^2.4.3"
  },
  "devDependencies": {
    "@nuxt/test-utils": "^3.14.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/pg": "^8.11.6",
    "vitest": "^1.6.0",
    "playwright-core": "^1.44.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd leave-request-system/backend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 3: Write nuxt.config.ts**

```typescript
// leave-request-system/backend/nuxt.config.ts
export default defineNuxtConfig({
  ssr: false,
  compatibilityDate: "2024-11-01",
});
```

- [ ] **Step 4: Write vitest.config.ts**

```typescript
// leave-request-system/backend/vitest.config.ts
import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    testTimeout: 30_000,
    hookTimeout: 60_000,
    include: ["test/**/*.test.{js,ts}"],
    fileParallelism: false, // integration tests share a Nuxt server on port 3001 — must run serially
  },
});
```

- [ ] **Step 5: Write server/utils/db.ts**

```typescript
// leave-request-system/backend/server/utils/db.ts
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

- [ ] **Step 6: Write server/utils/session.ts**

```typescript
// leave-request-system/backend/server/utils/session.ts
import type { H3Event } from "h3";
import { useSession } from "h3";

export interface SessionUser {
  id: number;
  name: string;
  email: string;
  role: string;
}

export async function getSession(event: H3Event) {
  return useSession<SessionUser>(event, {
    password:
      process.env.SESSION_SECRET || "insecure-default-change-in-production",
    name: "session",
    maxAge: 60 * 60 * 24, // 24 hours
  });
}
```

- [ ] **Step 7: Verify Nuxt starts**

```bash
cd leave-request-system/backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management \
SESSION_SECRET=test-secret \
npm run dev
```

Expected: Server starts on port 3000 with no errors. Press Ctrl+C to stop.

- [ ] **Step 8: Generate bcrypt hash and update V99**

```bash
cd leave-request-system/backend
node -e "const b = require('bcryptjs'); console.log(b.hashSync('password123', 10))"
```

Copy the output hash (starts with `$2b$10$...`) and replace `BCRYPT_HASH_PLACEHOLDER` in `db/migrations/V99__seed_data.sql`.

- [ ] **Step 9: Run Flyway migrations**

```bash
cd leave-request-system

# Makefile not complete yet — run manually:
docker run --rm \
  --network host \
  -e FLYWAY_URL=jdbc:postgresql://localhost:5432/leave_management \
  -e FLYWAY_USER=postgres \
  -e FLYWAY_PASSWORD=postgres \
  -v $(pwd)/db/migrations:/flyway/sql \
  flyway/flyway migrate
```

Expected output: `Successfully applied 4 migrations`.

- [ ] **Step 10: Verify seed data**

```bash
docker exec -it $(docker-compose -f leave-request-system/docker-compose.yml ps -q postgres) \
  psql -U postgres -d leave_management -c "SELECT id, name, role FROM users;"
```

Expected: 3 rows (Alice, Bob, Carol).

- [ ] **Step 11: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/backend/ leave-request-system/db/
git commit -m "feat: add backend foundation and run migrations"
```

---

## Task 4: Business Logic Utilities (TDD)

**Files:**

- Create: `leave-request-system/backend/server/utils/businessDays.ts`
- Create: `leave-request-system/backend/server/utils/validation.ts`
- Create: `leave-request-system/backend/test/unit/businessDays.test.js`
- Create: `leave-request-system/backend/test/unit/validateBalance.test.js`
- Create: `leave-request-system/backend/test/unit/hasOverlap.test.js`

- [ ] **Step 1: Write businessDays.test.js (failing)**

```javascript
// leave-request-system/backend/test/unit/businessDays.test.js
import { describe, it, expect } from "vitest";
import { countBusinessDays } from "../../server/utils/businessDays.ts";

describe("countBusinessDays", () => {
  it("same day (Monday) = 1", () => {
    expect(
      countBusinessDays(new Date("2025-06-02"), new Date("2025-06-02")),
    ).toBe(1);
  });

  it("Mon to Fri = 5", () => {
    expect(
      countBusinessDays(new Date("2025-06-02"), new Date("2025-06-06")),
    ).toBe(5);
  });

  it("skips weekend: Fri to Mon = 2", () => {
    expect(
      countBusinessDays(new Date("2025-06-06"), new Date("2025-06-09")),
    ).toBe(2);
  });

  it("Mon to Mon spanning two weekends = 8", () => {
    expect(
      countBusinessDays(new Date("2025-06-02"), new Date("2025-06-16")),
    ).toBe(11);
  });

  it("weekend-only range (Sat to Sun) = 0", () => {
    expect(
      countBusinessDays(new Date("2025-06-07"), new Date("2025-06-08")),
    ).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd leave-request-system/backend
npx vitest run test/unit/businessDays.test.js
```

Expected: FAIL — `countBusinessDays is not a function` or similar.

- [ ] **Step 3: Implement businessDays.ts**

```typescript
// leave-request-system/backend/server/utils/businessDays.ts
export function countBusinessDays(start: Date, end: Date): number {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endNorm = new Date(end);
  endNorm.setHours(0, 0, 0, 0);

  while (current <= endNorm) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
cd leave-request-system/backend
npx vitest run test/unit/businessDays.test.js
```

Expected: 5 tests PASS.

- [ ] **Step 5: Write validateBalance.test.js (failing)**

```javascript
// leave-request-system/backend/test/unit/validateBalance.test.js
import { describe, it, expect } from "vitest";
import { validateBalance } from "../../server/utils/validation.ts";

describe("validateBalance", () => {
  it("returns null when requested equals remaining", () => {
    expect(validateBalance(5, 5)).toBeNull();
  });

  it("returns null when requested is less than remaining", () => {
    expect(validateBalance(3, 10)).toBeNull();
  });

  it("returns error string when requested exceeds remaining", () => {
    const result = validateBalance(5, 3);
    expect(result).toMatch(/Insufficient leave balance/);
    expect(result).toMatch(/Remaining: 3/);
    expect(result).toMatch(/Requested: 5/);
  });

  it("returns error when remaining is zero", () => {
    const result = validateBalance(1, 0);
    expect(result).toMatch(/Insufficient leave balance/);
  });
});
```

- [ ] **Step 6: Write hasOverlap.test.js (failing)**

```javascript
// leave-request-system/backend/test/unit/hasOverlap.test.js
import { describe, it, expect } from "vitest";
import { hasOverlap } from "../../server/utils/validation.ts";

const existing = [
  { start_date: "2025-06-10", end_date: "2025-06-12", status: "PENDING" },
  { start_date: "2025-06-20", end_date: "2025-06-22", status: "APPROVED" },
  { start_date: "2025-06-25", end_date: "2025-06-26", status: "REJECTED" },
];

describe("hasOverlap", () => {
  it("returns false for range before all existing", () => {
    expect(
      hasOverlap(new Date("2025-06-01"), new Date("2025-06-05"), existing),
    ).toBe(false);
  });

  it("returns false for range after all existing", () => {
    expect(
      hasOverlap(new Date("2025-07-01"), new Date("2025-07-05"), existing),
    ).toBe(false);
  });

  it("returns false for adjacent range (no overlap)", () => {
    // Ends day before PENDING request starts
    expect(
      hasOverlap(new Date("2025-06-01"), new Date("2025-06-09"), existing),
    ).toBe(false);
  });

  it("returns true when overlapping a PENDING request", () => {
    expect(
      hasOverlap(new Date("2025-06-11"), new Date("2025-06-15"), existing),
    ).toBe(true);
  });

  it("returns true when overlapping an APPROVED request", () => {
    expect(
      hasOverlap(new Date("2025-06-18"), new Date("2025-06-21"), existing),
    ).toBe(true);
  });

  it("returns false for overlap with REJECTED only (ignored)", () => {
    expect(
      hasOverlap(new Date("2025-06-25"), new Date("2025-06-26"), existing),
    ).toBe(false);
  });

  it("returns false for empty existing list", () => {
    expect(hasOverlap(new Date("2025-06-10"), new Date("2025-06-12"), [])).toBe(
      false,
    );
  });
});
```

- [ ] **Step 7: Run both tests to verify they fail**

```bash
cd leave-request-system/backend
npx vitest run test/unit/validateBalance.test.js test/unit/hasOverlap.test.js
```

Expected: FAIL — `validateBalance is not a function`.

- [ ] **Step 8: Implement validation.ts**

```typescript
// leave-request-system/backend/server/utils/validation.ts
export function validateBalance(
  requested: number,
  remaining: number,
): string | null {
  if (requested > remaining) {
    return `Insufficient leave balance. Remaining: ${remaining} day(s), Requested: ${requested} day(s)`;
  }
  return null;
}

export function hasOverlap(
  newStart: Date,
  newEnd: Date,
  existing: { start_date: string; end_date: string; status: string }[],
): boolean {
  return existing
    .filter((r) => r.status === "PENDING" || r.status === "APPROVED")
    .some((r) => {
      const s = new Date(r.start_date);
      const e = new Date(r.end_date);
      return newStart <= e && newEnd >= s;
    });
}
```

- [ ] **Step 9: Run all unit tests**

```bash
cd leave-request-system/backend
npx vitest run test/unit/
```

Expected: 16 tests PASS across 3 files.

- [ ] **Step 10: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/backend/
git commit -m "feat: add business logic utilities with full unit test coverage (TDD)"
```

---

## Task 5: Auth Middleware + Auth Routes

**Files:**

- Create: `leave-request-system/backend/server/middleware/auth.ts`
- Create: `leave-request-system/backend/server/routes/api/auth/login.post.ts`
- Create: `leave-request-system/backend/server/routes/api/auth/logout.post.ts`
- Create: `leave-request-system/backend/server/routes/api/auth/me.get.ts`

- [ ] **Step 1: Write auth middleware**

The middleware runs on every request. It skips login and logout (both need to be accessible unauthenticated). For all other `/api/*` routes, it validates the session and attaches the user to `event.context.user`.

```typescript
// leave-request-system/backend/server/middleware/auth.ts
export default defineEventHandler(async (event) => {
  const skipPaths = ["/api/auth/login", "/api/auth/logout"];
  if (skipPaths.some((p) => event.path?.startsWith(p))) return;

  const session = await getSession(event);
  if (!session.data?.id) {
    throw createError({ statusCode: 401, statusMessage: "Unauthorized" });
  }
  event.context.user = session.data;
});
```

> Note: `defineEventHandler`, `createError`, and `getSession` (from `server/utils/session.ts`) are all auto-imported by Nuxt.

- [ ] **Step 2: Write login route**

```typescript
// leave-request-system/backend/server/routes/api/auth/login.post.ts
import bcrypt from "bcryptjs";

export default defineEventHandler(async (event) => {
  const { email, password } = await readBody(event);

  const result = await pool.query(
    "SELECT id, name, email, role, password FROM users WHERE email = $1",
    [email],
  );
  const user = result.rows[0];

  if (!user || !(await bcrypt.compare(password, user.password))) {
    throw createError({
      statusCode: 401,
      statusMessage: "Invalid credentials",
    });
  }

  const session = await getSession(event);
  await session.update({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });

  return {
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
});
```

> Note: `pool` (from `server/utils/db.ts`) and `getSession` are auto-imported by Nuxt.

- [ ] **Step 3: Write logout route**

```typescript
// leave-request-system/backend/server/routes/api/auth/logout.post.ts
export default defineEventHandler(async (event) => {
  const session = await getSession(event);
  await session.clear();
  return { ok: true };
});
```

- [ ] **Step 4: Write me route**

```typescript
// leave-request-system/backend/server/routes/api/auth/me.get.ts
export default defineEventHandler((event) => {
  return { user: event.context.user };
});
```

- [ ] **Step 5: Smoke test auth routes with curl**

Start the backend dev server:

```bash
cd leave-request-system/backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management \
SESSION_SECRET=test-secret \
npm run dev &
```

Test login:

```bash
curl -s -c /tmp/cookies.txt -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"bob@company.com","password":"password123"}' | jq .
```

Expected: `{"user":{"id":2,"name":"Bob Employee","email":"bob@company.com","role":"employee"}}`

Test me (authenticated):

```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/auth/me | jq .
```

Expected: `{"user":{"id":2,...}}`

Test me (unauthenticated):

```bash
curl -s http://localhost:3000/api/auth/me | jq .
```

Expected: 401 response.

- [ ] **Step 6: Stop dev server and commit**

```bash
kill %1  # stops the background dev server
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/backend/
git commit -m "feat: add auth middleware and auth API routes"
```

---

## Task 6: Leave Balances API

**Files:**

- Create: `leave-request-system/backend/server/routes/api/leave-balances/index.get.ts`

- [ ] **Step 1: Write index.get.ts**

```typescript
// leave-request-system/backend/server/routes/api/leave-balances/index.get.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const year = new Date().getUTCFullYear();

  const result = await pool.query(
    `SELECT leave_type, total_days, used_days, (total_days - used_days) AS remaining_days
     FROM leave_balances
     WHERE user_id = $1 AND year = $2
     ORDER BY leave_type`,
    [user.id, year],
  );

  return result.rows.map((r) => ({
    leaveType: r.leave_type,
    totalDays: r.total_days,
    usedDays: r.used_days,
    remainingDays: r.remaining_days,
  }));
});
```

- [ ] **Step 2: Smoke test**

Start the backend, login, then:

```bash
curl -s -b /tmp/cookies.txt http://localhost:3000/api/leave-balances | jq .
```

Expected: Array of 3 balance objects (ANNUAL, PERSONAL, SICK).

- [ ] **Step 3: Commit**

```bash
git add leave-request-system/backend/
git commit -m "feat: add leave-balances GET endpoint"
```

---

## Task 7: Leave Requests API + Integration Tests (TDD)

**Files:**

- Create: `leave-request-system/backend/server/routes/api/leave-requests/index.get.ts`
- Create: `leave-request-system/backend/server/routes/api/leave-requests/index.post.ts`
- Create: `leave-request-system/backend/server/routes/api/leave-requests/[id].approve.patch.ts`
- Create: `leave-request-system/backend/server/routes/api/leave-requests/[id].reject.patch.ts`
- Create: `leave-request-system/backend/test/integration/leaveRequest.post.test.js`
- Create: `leave-request-system/backend/test/integration/managerApprove.test.js`

- [ ] **Step 1: Write leaveRequest.post.test.js (failing)**

```javascript
// leave-request-system/backend/test/integration/leaveRequest.post.test.js
import { describe, it, expect, beforeEach, afterAll } from "vitest";
import { setup, $fetch } from "@nuxt/test-utils/e2e";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";

await setup({
  rootDir: fileURLToPath(new URL("../..", import.meta.url)),
  server: true,
  port: 3001,
});

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Login helper — returns session cookie string
async function loginAs(email, password = "password123") {
  const res = await fetch("http://localhost:3001/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  return res.headers.get("set-cookie")?.split(";")[0] || "";
}

// Authenticated fetch helper
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
        startDate: "2025-09-01",
        endDate: "2025-09-03",
        reason: "Vacation",
      },
      bobCookie,
    );

    expect(status).toBe(201);
    expect(data.status).toBe("PENDING");
    expect(data.totalDays).toBe(3);

    const bal = await pool.query(
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'ANNUAL' AND year = 2025",
    );
    expect(bal.rows[0].used_days).toBe(0);
  });

  it("SICK valid → 201, status APPROVED, balance immediately decremented", async () => {
    const { status, data } = await apiFetch(
      "POST",
      "/api/leave-requests",
      {
        leaveType: "SICK",
        startDate: "2025-09-01",
        endDate: "2025-09-01",
      },
      bobCookie,
    );

    expect(status).toBe(201);
    expect(data.status).toBe("APPROVED");
    expect(data.totalDays).toBe(1);

    const bal = await pool.query(
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'SICK' AND year = 2025",
    );
    expect(bal.rows[0].used_days).toBe(1);
  });

  it("insufficient balance → 422 with error message", async () => {
    const { status, data } = await apiFetch(
      "POST",
      "/api/leave-requests",
      {
        leaveType: "ANNUAL",
        startDate: "2025-09-01",
        endDate: "2025-09-30", // ~22 business days, exceeds 10-day limit
      },
      bobCookie,
    );

    expect(status).toBe(422);
    expect(data.error).toMatch(/Insufficient leave balance/);
    expect(data.error).toMatch(/Remaining: 10/);
  });
});
```

- [ ] **Step 2: Write managerApprove.test.js (failing)**

```javascript
// leave-request-system/backend/test/integration/managerApprove.test.js
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

describe("PATCH /api/leave-requests/:id/approve and /reject", () => {
  let aliceCookie, bobCookie, requestId;

  beforeEach(async () => {
    await pool.query("DELETE FROM leave_requests");
    await pool.query("UPDATE leave_balances SET used_days = 0");

    aliceCookie = await loginAs("alice@company.com");
    bobCookie = await loginAs("bob@company.com");

    // Create a PENDING ANNUAL request for Bob
    const result = await pool.query(
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, status)
       VALUES (2, 'ANNUAL', '2025-09-01', '2025-09-03', 3, 'PENDING') RETURNING id`,
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
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'ANNUAL' AND year = 2025",
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
      "SELECT used_days FROM leave_balances WHERE user_id = 2 AND leave_type = 'ANNUAL' AND year = 2025",
    );
    expect(bal.rows[0].used_days).toBe(0);
  });

  it("approve already-approved request → 409", async () => {
    // First approve
    await apiFetch(
      "PATCH",
      `/api/leave-requests/${requestId}/approve`,
      null,
      aliceCookie,
    );
    // Second approve
    const { status } = await apiFetch(
      "PATCH",
      `/api/leave-requests/${requestId}/approve`,
      null,
      aliceCookie,
    );
    expect(status).toBe(409);
  });
});
```

- [ ] **Step 3: Run integration tests to verify they fail**

```bash
cd leave-request-system/backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management \
SESSION_SECRET=test-secret \
npx vitest run test/integration/
```

Expected: FAIL — routes don't exist yet.

- [ ] **Step 4: Write index.get.ts (leave requests GET)**

```typescript
// leave-request-system/backend/server/routes/api/leave-requests/index.get.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const query = getQuery(event);

  let sql = `
    SELECT lr.id, lr.user_id, u.name AS user_name, lr.leave_type,
           lr.start_date, lr.end_date, lr.total_days, lr.reason,
           lr.status, lr.reviewed_by, lr.reviewed_at, lr.created_at
    FROM leave_requests lr
    JOIN users u ON lr.user_id = u.id
    WHERE 1=1
  `;
  const params: unknown[] = [];

  if (user.role === "employee") {
    params.push(user.id);
    sql += ` AND lr.user_id = $${params.length}`;
  }

  if (query.status) {
    params.push(query.status);
    sql += ` AND lr.status = $${params.length}`;
  }

  if (query.userId && user.role === "manager") {
    params.push(Number(query.userId));
    sql += ` AND lr.user_id = $${params.length}`;
  }

  sql += " ORDER BY lr.created_at DESC";

  const result = await pool.query(sql, params);

  return result.rows.map((r) => ({
    id: r.id,
    userId: r.user_id,
    userName: r.user_name,
    leaveType: r.leave_type,
    startDate: r.start_date,
    endDate: r.end_date,
    totalDays: r.total_days,
    reason: r.reason,
    status: r.status,
    reviewedBy: r.reviewed_by,
    reviewedAt: r.reviewed_at,
    createdAt: r.created_at,
  }));
});
```

- [ ] **Step 5: Write index.post.ts (leave requests POST)**

```typescript
// leave-request-system/backend/server/routes/api/leave-requests/index.post.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  const { leaveType, startDate, endDate, reason } = await readBody(event);

  // 1. Parse dates
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw createError({ statusCode: 422, statusMessage: "Invalid dates" });
  }

  // 2. endDate >= startDate
  if (end < start) {
    throw createError({
      statusCode: 422,
      statusMessage: "End date must be on or after start date",
    });
  }

  // 3. startDate not in the past (UTC comparison)
  const todayUTC = new Date();
  todayUTC.setUTCHours(0, 0, 0, 0);
  const startUTC = new Date(startDate);
  startUTC.setUTCHours(0, 0, 0, 0);
  if (startUTC < todayUTC) {
    throw createError({
      statusCode: 422,
      statusMessage: "Start date cannot be in the past",
    });
  }

  // 4. leaveType valid
  if (!["ANNUAL", "SICK", "PERSONAL"].includes(leaveType)) {
    throw createError({ statusCode: 422, statusMessage: "Invalid leave type" });
  }

  const totalDays = countBusinessDays(start, end);
  const year = new Date().getUTCFullYear();

  // 5. Sufficient balance
  const balResult = await pool.query(
    "SELECT total_days, used_days FROM leave_balances WHERE user_id = $1 AND leave_type = $2 AND year = $3",
    [user.id, leaveType, year],
  );
  const balance = balResult.rows[0];
  const remainingDays = balance ? balance.total_days - balance.used_days : 0;
  const balError = validateBalance(totalDays, remainingDays);
  if (balError) {
    throw createError({ statusCode: 422, statusMessage: balError });
  }

  // 6. No overlap
  const existingResult = await pool.query(
    "SELECT start_date, end_date, status FROM leave_requests WHERE user_id = $1",
    [user.id],
  );
  if (hasOverlap(start, end, existingResult.rows)) {
    throw createError({
      statusCode: 422,
      statusMessage:
        "Request overlaps with an existing pending or approved request",
    });
  }

  // Insert — SICK is auto-approved with balance deduction in a transaction
  if (leaveType === "SICK") {
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      const insertResult = await client.query(
        `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'APPROVED') RETURNING id`,
        [user.id, leaveType, startDate, endDate, totalDays, reason || null],
      );
      await client.query(
        "UPDATE leave_balances SET used_days = used_days + $1 WHERE user_id = $2 AND leave_type = $3 AND year = $4",
        [totalDays, user.id, leaveType, year],
      );
      await client.query("COMMIT");
      setResponseStatus(event, 201);
      return { id: insertResult.rows[0].id, status: "APPROVED", totalDays };
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  }

  // ANNUAL / PERSONAL — insert as PENDING, no balance change
  const insertResult = await pool.query(
    `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, reason, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'PENDING') RETURNING id`,
    [user.id, leaveType, startDate, endDate, totalDays, reason || null],
  );
  setResponseStatus(event, 201);
  return { id: insertResult.rows[0].id, status: "PENDING", totalDays };
});
```

> Note: `countBusinessDays`, `validateBalance`, `hasOverlap`, `pool`, `createError`, `readBody`, `setResponseStatus` are all auto-imported by Nuxt.

- [ ] **Step 6: Write [id].approve.patch.ts**

```typescript
// leave-request-system/backend/server/routes/api/leave-requests/[id].approve.patch.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (user.role !== "manager") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const id = getRouterParam(event, "id");
  const result = await pool.query(
    "SELECT * FROM leave_requests WHERE id = $1",
    [id],
  );
  const request = result.rows[0];

  if (!request)
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  if (request.status !== "PENDING")
    throw createError({
      statusCode: 409,
      statusMessage: "Request is not pending",
    });

  const year = new Date(request.start_date).getUTCFullYear();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(
      "UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3",
      ["APPROVED", user.id, id],
    );
    await client.query(
      "UPDATE leave_balances SET used_days = used_days + $1 WHERE user_id = $2 AND leave_type = $3 AND year = $4",
      [request.total_days, request.user_id, request.leave_type, year],
    );
    await client.query("COMMIT");
    return { ok: true };
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
});
```

- [ ] **Step 7: Write [id].reject.patch.ts**

```typescript
// leave-request-system/backend/server/routes/api/leave-requests/[id].reject.patch.ts
export default defineEventHandler(async (event) => {
  const user = event.context.user;
  if (user.role !== "manager") {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const id = getRouterParam(event, "id");
  const result = await pool.query(
    "SELECT status FROM leave_requests WHERE id = $1",
    [id],
  );
  const request = result.rows[0];

  if (!request)
    throw createError({ statusCode: 404, statusMessage: "Not found" });
  if (request.status !== "PENDING")
    throw createError({
      statusCode: 409,
      statusMessage: "Request is not pending",
    });

  await pool.query(
    "UPDATE leave_requests SET status = $1, reviewed_by = $2, reviewed_at = NOW() WHERE id = $3",
    ["REJECTED", user.id, id],
  );
  return { ok: true };
});
```

- [ ] **Step 8: Run integration tests and verify they pass**

```bash
cd leave-request-system/backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management \
SESSION_SECRET=test-secret \
npx vitest run test/integration/
```

Expected: 7 integration tests PASS.

- [ ] **Step 9: Run full test suite**

```bash
cd leave-request-system/backend
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management \
SESSION_SECRET=test-secret \
npx vitest run
```

Expected: 16 unit + 7 integration = 23 tests PASS.

- [ ] **Step 10: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/backend/
git commit -m "feat: add leave-requests API with integration tests (TDD)"
```

---

## Task 8: Frontend Setup + API Client

**Files:**

- Create: `leave-request-system/frontend/package.json`
- Create: `leave-request-system/frontend/vite.config.js`
- Create: `leave-request-system/frontend/index.html`
- Create: `leave-request-system/frontend/src/main.jsx`
- Create: `leave-request-system/frontend/src/App.jsx`
- Create: `leave-request-system/frontend/src/api/auth.js`
- Create: `leave-request-system/frontend/src/api/leaveBalances.js`
- Create: `leave-request-system/frontend/src/api/leaveRequests.js`

- [ ] **Step 1: Write package.json**

```json
{
  "name": "leave-request-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "vite --port 5173",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.3.1",
    "react-dom": "^18.3.1",
    "react-router-dom": "^6.26.1"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.3.1",
    "vite": "^5.4.0"
  }
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd leave-request-system/frontend
npm install
```

- [ ] **Step 3: Write vite.config.js**

```javascript
// leave-request-system/frontend/vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});
```

- [ ] **Step 4: Write index.html**

```html
<!-- leave-request-system/frontend/index.html -->
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Leave Management</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Write src/main.jsx**

```jsx
// leave-request-system/frontend/src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

- [ ] **Step 6: Write src/api/auth.js**

```javascript
// leave-request-system/frontend/src/api/auth.js
async function request(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || body.statusMessage || "Request failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function login(email, password) {
  return request("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export function logout() {
  return request("/api/auth/logout", { method: "POST" });
}

export function me() {
  return request("/api/auth/me").then((r) => r.user);
}
```

- [ ] **Step 7: Write src/api/leaveBalances.js**

```javascript
// leave-request-system/frontend/src/api/leaveBalances.js
export function getBalances() {
  return fetch("/api/leave-balances", { credentials: "include" }).then(
    async (r) => {
      if (!r.ok) throw new Error("Failed to load balances");
      return r.json();
    },
  );
}
```

- [ ] **Step 8: Write src/api/leaveRequests.js**

```javascript
// leave-request-system/frontend/src/api/leaveRequests.js
async function request(url, options = {}) {
  const res = await fetch(url, { credentials: "include", ...options });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || body.statusMessage || "Request failed");
    err.status = res.status;
    throw err;
  }
  return res.json();
}

export function getRequests(params = {}) {
  const qs = new URLSearchParams(params).toString();
  return request(`/api/leave-requests${qs ? "?" + qs : ""}`);
}

export function submitRequest(data) {
  return request("/api/leave-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
}

export function approveRequest(id) {
  return request(`/api/leave-requests/${id}/approve`, { method: "PATCH" });
}

export function rejectRequest(id) {
  return request(`/api/leave-requests/${id}/reject`, { method: "PATCH" });
}
```

- [ ] **Step 9: Write stub App.jsx**

```jsx
// leave-request-system/frontend/src/App.jsx
import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { me } from "./api/auth.js";
import LoginPage from "./pages/LoginPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import ManagerPage from "./pages/ManagerPage.jsx";

export default function App() {
  const [user, setUser] = useState(undefined); // undefined = still loading

  useEffect(() => {
    me()
      .then(setUser)
      .catch(() => setUser(null));
  }, []);

  if (user === undefined) return null; // loading — renders nothing until auth is known

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage onLogin={setUser} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            user ? (
              <DashboardPage user={user} onLogout={() => setUser(null)} />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route
          path="/manager"
          element={
            user?.role === "manager" ? (
              <ManagerPage user={user} onLogout={() => setUser(null)} />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 10: Verify Vite starts**

Start the backend dev server first (in a separate terminal):

```bash
cd leave-request-system/backend && DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management SESSION_SECRET=test-secret npm run dev
```

Then start the frontend:

```bash
cd leave-request-system/frontend
npm run dev
```

Expected: Vite server starts at http://localhost:5173. Opening it shows nothing (pages not yet built) but no console errors.

- [ ] **Step 11: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/frontend/
git commit -m "feat: add frontend project setup, API clients, and App routing"
```

---

## Task 9: Frontend Components

**Files:**

- Create: `leave-request-system/frontend/src/components/NavBar.jsx`
- Create: `leave-request-system/frontend/src/components/LeaveBalanceCard.jsx`
- Create: `leave-request-system/frontend/src/components/LeaveRequestTable.jsx`
- Create: `leave-request-system/frontend/src/components/SubmitLeaveModal.jsx`

- [ ] **Step 1: Write NavBar.jsx**

```jsx
// leave-request-system/frontend/src/components/NavBar.jsx
import { Link, useNavigate } from "react-router-dom";
import { logout } from "../api/auth.js";

export default function NavBar({ user, onLogout }) {
  const navigate = useNavigate();

  async function handleLogout() {
    await logout().catch(() => {});
    onLogout();
    navigate("/login", { replace: true });
  }

  return (
    <nav
      style={{
        display: "flex",
        alignItems: "center",
        padding: "0 24px",
        height: 56,
        background: "#1A1814",
        gap: 8,
      }}
    >
      <span
        style={{
          color: "white",
          fontWeight: 700,
          marginRight: "auto",
          fontSize: 18,
        }}
      >
        Leave<span style={{ color: "#C8721A" }}>.</span>
      </span>
      <Link
        to="/dashboard"
        style={{
          color: "rgba(255,255,255,0.7)",
          textDecoration: "none",
          padding: "0 12px",
          fontSize: 13,
          fontWeight: 600,
        }}
      >
        Dashboard
      </Link>
      {user.role === "manager" && (
        <Link
          to="/manager"
          style={{
            color: "rgba(255,255,255,0.7)",
            textDecoration: "none",
            padding: "0 12px",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Manager
        </Link>
      )}
      <span
        style={{
          color: "rgba(255,255,255,0.5)",
          fontSize: 12,
          paddingLeft: 16,
          borderLeft: "1px solid rgba(255,255,255,0.15)",
          marginLeft: 8,
        }}
      >
        {user.name} · {user.role}
      </span>
      <button
        onClick={handleLogout}
        style={{
          marginLeft: 12,
          padding: "6px 14px",
          background: "transparent",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "rgba(255,255,255,0.6)",
          borderRadius: 6,
          cursor: "pointer",
          fontSize: 12,
        }}
      >
        Logout
      </button>
    </nav>
  );
}
```

- [ ] **Step 2: Write LeaveBalanceCard.jsx**

```jsx
// leave-request-system/frontend/src/components/LeaveBalanceCard.jsx
const TYPE_COLORS = {
  ANNUAL: "#1E4D7B",
  SICK: "#2A6B4A",
  PERSONAL: "#C8721A",
};

export default function LeaveBalanceCard({
  leaveType,
  totalDays,
  usedDays,
  remainingDays,
}) {
  const color = TYPE_COLORS[leaveType] || "#555";
  const pct = totalDays > 0 ? Math.round((remainingDays / totalDays) * 100) : 0;

  return (
    <div
      style={{
        background: "#F7F4EF",
        border: "1.5px solid #EDE9E2",
        borderRadius: 14,
        padding: "20px 18px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.1em",
          textTransform: "uppercase",
          color,
          marginBottom: 10,
        }}
      >
        {leaveType.charAt(0) + leaveType.slice(1).toLowerCase()}
      </div>
      <div
        style={{
          fontSize: 36,
          fontWeight: 700,
          lineHeight: 1,
          color: "#1A1814",
          marginBottom: 4,
        }}
      >
        {remainingDays}
      </div>
      <div style={{ fontSize: 12, color: "#9A948C" }}>
        of {totalDays} days remaining
      </div>
      <div
        style={{
          marginTop: 14,
          height: 4,
          background: "#EDE9E2",
          borderRadius: 2,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: 2,
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Write LeaveRequestTable.jsx**

```jsx
// leave-request-system/frontend/src/components/LeaveRequestTable.jsx
import { approveRequest, rejectRequest } from "../api/leaveRequests.js";

const STATUS_STYLE = {
  PENDING: { background: "#FEF9C3", color: "#854D0E" },
  APPROVED: { background: "#DCFCE7", color: "#166534" },
  REJECTED: { background: "#FEE2E2", color: "#991B1B" },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLE[status] || {};
  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 700,
        padding: "4px 10px",
        borderRadius: 100,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
        ...s,
      }}
    >
      {status}
    </span>
  );
}

export default function LeaveRequestTable({
  requests,
  isManager = false,
  onAction,
}) {
  async function handleApprove(id) {
    await approveRequest(id);
    onAction?.();
  }

  async function handleReject(id) {
    await rejectRequest(id);
    onAction?.();
  }

  if (requests.length === 0) {
    return (
      <p style={{ color: "#9A948C", fontSize: 13, padding: "16px 0" }}>
        No requests found.
      </p>
    );
  }

  return (
    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
      <thead>
        <tr>
          {isManager && <th style={thStyle}>Employee</th>}
          <th style={thStyle}>Type</th>
          <th style={thStyle}>Dates</th>
          <th style={thStyle}>Days</th>
          <th style={thStyle}>Reason</th>
          <th style={thStyle}>Status</th>
          {isManager && <th style={thStyle}>Actions</th>}
        </tr>
      </thead>
      <tbody>
        {requests.map((r) => (
          <tr key={r.id} style={{ borderBottom: "1px solid #EDE9E2" }}>
            {isManager && (
              <td style={tdStyle}>
                <strong>{r.userName}</strong>
              </td>
            )}
            <td style={tdStyle}>{r.leaveType}</td>
            <td style={tdStyle}>
              {formatDate(r.startDate)} – {formatDate(r.endDate)}
            </td>
            <td style={tdStyle}>{r.totalDays}</td>
            <td style={{ ...tdStyle, color: "#9A948C", maxWidth: 160 }}>
              {r.reason || "—"}
            </td>
            <td style={tdStyle}>
              <StatusBadge status={r.status} />
            </td>
            {isManager && r.status === "PENDING" && (
              <td style={tdStyle}>
                <button
                  onClick={() => handleApprove(r.id)}
                  style={approveBtnStyle}
                >
                  ✓ Approve
                </button>
                <button
                  onClick={() => handleReject(r.id)}
                  style={rejectBtnStyle}
                >
                  ✕ Reject
                </button>
              </td>
            )}
            {isManager && r.status !== "PENDING" && <td style={tdStyle} />}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const thStyle = {
  padding: "8px 12px",
  textAlign: "left",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.1em",
  textTransform: "uppercase",
  color: "#9A948C",
};
const tdStyle = { padding: "12px 12px" };
const approveBtnStyle = {
  padding: "5px 12px",
  background: "#DCFCE7",
  color: "#166534",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
  marginRight: 6,
};
const rejectBtnStyle = {
  padding: "5px 12px",
  background: "#FEE2E2",
  color: "#991B1B",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 12,
};
```

- [ ] **Step 4: Write SubmitLeaveModal.jsx**

Business days are calculated client-side for the preview. The client-side `countBusinessDays` mirrors the server-side logic (Mon–Fri, inclusive).

```jsx
// leave-request-system/frontend/src/components/SubmitLeaveModal.jsx
import { useState } from "react";
import { submitRequest } from "../api/leaveRequests.js";

function countBusinessDays(start, end) {
  let count = 0;
  const current = new Date(start);
  current.setHours(0, 0, 0, 0);
  const endDate = new Date(end);
  endDate.setHours(0, 0, 0, 0);
  while (current <= endDate) {
    const day = current.getDay();
    if (day !== 0 && day !== 6) count++;
    current.setDate(current.getDate() + 1);
  }
  return count;
}

export default function SubmitLeaveModal({ onClose, onSuccess }) {
  const [leaveType, setLeaveType] = useState("ANNUAL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const businessDays =
    startDate && endDate && endDate >= startDate
      ? countBusinessDays(new Date(startDate), new Date(endDate))
      : 0;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await submitRequest({
        leaveType,
        startDate,
        endDate,
        reason: reason || undefined,
      });
      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(26,24,20,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: 32,
          width: "100%",
          maxWidth: 440,
          boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            marginBottom: 24,
          }}
        >
          <h2 style={{ fontSize: 24, fontWeight: 700 }}>Request Time Off</h2>
          <button
            onClick={onClose}
            style={{
              background: "#F7F4EF",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              cursor: "pointer",
              fontSize: 16,
            }}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={fieldStyle}>
            <label style={labelStyle}>Leave Type</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              style={inputStyle}
            >
              <option value="ANNUAL">Annual Leave</option>
              <option value="SICK">Sick Leave</option>
              <option value="PERSONAL">Personal Leave</option>
            </select>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 12,
              marginBottom: 14,
            }}
          >
            <div>
              <label style={labelStyle}>Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                style={inputStyle}
              />
            </div>
          </div>

          <div style={fieldStyle}>
            <label style={labelStyle}>
              Reason{" "}
              <span style={{ fontWeight: 400, color: "#9A948C" }}>
                (optional)
              </span>
            </label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Briefly describe your reason…"
              style={{
                ...inputStyle,
                height: 72,
                resize: "none",
                paddingTop: 10,
              }}
            />
          </div>

          {businessDays > 0 && (
            <div
              style={{
                background: "#F7F4EF",
                border: "1.5px solid #F5E4CC",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 16,
                fontSize: 13,
                color: "#C8721A",
                fontWeight: 600,
              }}
            >
              {businessDays} business day(s) will be deducted
            </div>
          )}

          {error && (
            <div
              style={{
                background: "#FDF1F1",
                border: "1.5px solid #FEE2E2",
                borderRadius: 10,
                padding: "12px 16px",
                marginBottom: 16,
                fontSize: 13,
                color: "#991B1B",
                fontWeight: 600,
              }}
            >
              ✕ {error}
            </div>
          )}

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}
          >
            <button
              type="button"
              onClick={onClose}
              style={{
                height: 48,
                border: "1.5px solid #EDE9E2",
                background: "transparent",
                borderRadius: 10,
                cursor: "pointer",
                fontWeight: 600,
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              style={{
                height: 48,
                background: "#1A1814",
                color: "white",
                border: "none",
                borderRadius: 10,
                cursor: loading ? "not-allowed" : "pointer",
                fontWeight: 700,
                fontSize: 14,
              }}
            >
              {loading ? "Submitting…" : "Submit Request →"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const fieldStyle = { marginBottom: 14 };
const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#4A4540",
  marginBottom: 6,
};
const inputStyle = {
  width: "100%",
  height: 46,
  border: "1.5px solid rgba(26,24,20,0.1)",
  borderRadius: 10,
  padding: "0 14px",
  fontSize: 14,
  background: "#F7F4EF",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
```

- [ ] **Step 5: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/frontend/src/components/
git commit -m "feat: add frontend components (NavBar, LeaveBalanceCard, LeaveRequestTable, SubmitLeaveModal)"
```

---

## Task 10: Frontend Pages

**Files:**

- Create: `leave-request-system/frontend/src/pages/LoginPage.jsx`
- Create: `leave-request-system/frontend/src/pages/DashboardPage.jsx`
- Create: `leave-request-system/frontend/src/pages/ManagerPage.jsx`

- [ ] **Step 1: Write LoginPage.jsx**

```jsx
// leave-request-system/frontend/src/pages/LoginPage.jsx
import { useState } from "react";
import { login } from "../api/auth.js";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { user } = await login(email, password);
      onLogin(user);
    } catch (err) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#F7F4EF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 20,
          padding: "48px 40px",
          width: 380,
          boxShadow: "0 8px 40px rgba(0,0,0,0.1)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            fontSize: 28,
            fontWeight: 700,
            marginBottom: 4,
          }}
        >
          Leave<span style={{ color: "#C8721A" }}>.</span>
        </h1>
        <p
          style={{
            textAlign: "center",
            fontSize: 12,
            color: "#9A948C",
            fontWeight: 600,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 36,
          }}
        >
          Internal Time-Off Portal
        </p>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={labelStyle}>Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
              required
              style={inputStyle}
              data-testid="email-input"
            />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={inputStyle}
              data-testid="password-input"
            />
          </div>

          {error && (
            <div
              data-testid="login-error"
              style={{
                fontSize: 13,
                color: "#991B1B",
                textAlign: "center",
                marginBottom: 16,
                fontWeight: 600,
              }}
            >
              ✕ {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            data-testid="login-button"
            style={{
              width: "100%",
              height: 48,
              background: "#1A1814",
              color: "white",
              border: "none",
              borderRadius: 10,
              fontWeight: 700,
              fontSize: 14,
              cursor: loading ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Signing in…" : "Sign In →"}
          </button>
        </form>
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.08em",
  textTransform: "uppercase",
  color: "#4A4540",
  marginBottom: 6,
};
const inputStyle = {
  width: "100%",
  height: 46,
  border: "1.5px solid rgba(26,24,20,0.1)",
  borderRadius: 10,
  padding: "0 14px",
  fontSize: 14,
  background: "#F7F4EF",
  fontFamily: "inherit",
  outline: "none",
  boxSizing: "border-box",
};
```

- [ ] **Step 2: Write DashboardPage.jsx**

```jsx
// leave-request-system/frontend/src/pages/DashboardPage.jsx
import { useState, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar.jsx";
import LeaveBalanceCard from "../components/LeaveBalanceCard.jsx";
import LeaveRequestTable from "../components/LeaveRequestTable.jsx";
import SubmitLeaveModal from "../components/SubmitLeaveModal.jsx";
import { getBalances } from "../api/leaveBalances.js";
import { getRequests } from "../api/leaveRequests.js";

export default function DashboardPage({ user, onLogout }) {
  const [balances, setBalances] = useState([]);
  const [requests, setRequests] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const loadData = useCallback(async () => {
    const [bal, req] = await Promise.all([getBalances(), getRequests()]);
    setBalances(bal);
    setRequests(req);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function handleModalSuccess() {
    setShowModal(false);
    loadData();
  }

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF" }}>
      <NavBar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "32px 24px" }}>
        <h2
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            color: "#9A948C",
            marginBottom: 16,
          }}
        >
          Leave Balances — {new Date().getFullYear()}
        </h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 40,
          }}
        >
          {balances.map((b) => (
            <LeaveBalanceCard key={b.leaveType} {...b} />
          ))}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 16,
          }}
        >
          <h2
            style={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              color: "#9A948C",
              margin: 0,
            }}
          >
            My Recent Requests
          </h2>
          <button
            onClick={() => setShowModal(true)}
            data-testid="submit-leave-btn"
            style={{
              padding: "8px 18px",
              background: "#C8721A",
              color: "white",
              border: "none",
              borderRadius: 8,
              cursor: "pointer",
              fontWeight: 700,
              fontSize: 13,
            }}
          >
            + Submit Leave
          </button>
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "8px 16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <LeaveRequestTable
            requests={requests.slice(0, 5)}
            isManager={false}
            onAction={loadData}
          />
        </div>
      </div>

      {showModal && (
        <SubmitLeaveModal
          onClose={() => setShowModal(false)}
          onSuccess={handleModalSuccess}
        />
      )}
    </div>
  );
}
```

- [ ] **Step 3: Write ManagerPage.jsx**

```jsx
// leave-request-system/frontend/src/pages/ManagerPage.jsx
import { useState, useEffect, useCallback } from "react";
import NavBar from "../components/NavBar.jsx";
import LeaveRequestTable from "../components/LeaveRequestTable.jsx";
import { getRequests } from "../api/leaveRequests.js";

export default function ManagerPage({ user, onLogout }) {
  const [requests, setRequests] = useState([]);
  const [tab, setTab] = useState("pending"); // 'pending' | 'all'

  const loadData = useCallback(async () => {
    const params = tab === "pending" ? { status: "PENDING" } : {};
    const data = await getRequests(params);
    setRequests(data);
  }, [tab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div style={{ minHeight: "100vh", background: "#F7F4EF" }}>
      <NavBar user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        <div
          style={{
            display: "flex",
            borderBottom: "2px solid #EDE9E2",
            marginBottom: 24,
          }}
        >
          {["pending", "all"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              data-testid={`tab-${t}`}
              style={{
                padding: "0 0 14px",
                marginRight: 28,
                background: "none",
                border: "none",
                borderBottom:
                  tab === t ? "2px solid #1A1814" : "2px solid transparent",
                marginBottom: -2,
                cursor: "pointer",
                fontWeight: 700,
                fontSize: 12,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: tab === t ? "#1A1814" : "#9A948C",
              }}
            >
              {t === "pending" ? "Pending" : "All Requests"}
            </button>
          ))}
        </div>

        <div
          style={{
            background: "white",
            borderRadius: 16,
            padding: "8px 16px",
            boxShadow: "0 2px 16px rgba(0,0,0,0.06)",
          }}
        >
          <LeaveRequestTable
            requests={requests}
            isManager={true}
            onAction={loadData}
          />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Smoke test the full app**

With both backend and frontend running:

1. Open http://localhost:5173
2. Should redirect to /login
3. Login as `bob@company.com` / `password123`
4. Should redirect to /dashboard showing leave balance cards
5. Click "Submit Leave" and submit an ANNUAL request
6. Verify balance card does NOT change (PENDING status)
7. Logout, login as `alice@company.com` / `password123`
8. Navigate to /manager — should see Bob's pending request
9. Approve it — verify it disappears from Pending tab

- [ ] **Step 5: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/frontend/src/pages/
git commit -m "feat: add frontend pages (Login, Dashboard, Manager)"
```

---

## Task 11: E2E Tests (Playwright)

**Files:**

- Create: `leave-request-system/frontend/playwright.config.js`
- Create: `leave-request-system/frontend/e2e/login.spec.js`
- Create: `leave-request-system/frontend/e2e/submit-leave.spec.js`
- Create: `leave-request-system/frontend/e2e/manager-approve.spec.js`

**Prerequisite:** Both dev servers running and DB migrated with seed data.

- [ ] **Step 1: Install Playwright**

```bash
cd leave-request-system/frontend
npm install --save-dev @playwright/test
npx playwright install chromium
```

- [ ] **Step 2: Write playwright.config.js**

```javascript
// leave-request-system/frontend/playwright.config.js
import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  use: {
    baseURL: "http://localhost:5173",
    headless: true,
  },
  workers: 1, // serial to avoid session conflicts
});
```

- [ ] **Step 3: Write login.spec.js**

```javascript
// leave-request-system/frontend/e2e/login.spec.js
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  // Start fresh — clear cookies
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
```

- [ ] **Step 4: Write submit-leave.spec.js**

```javascript
// leave-request-system/frontend/e2e/submit-leave.spec.js
import { test, expect } from "@playwright/test";

// Reset DB state before each test
// This requires a direct DB query — use the test endpoint or run psql.
// Simplest: use a helper that hits the backend reset endpoint (see note below).
// For this training system, we reset via psql in beforeEach.

async function loginAs(page, email) {
  await page.context().clearCookies();
  await page.goto("/login");
  await page.getByTestId("email-input").fill(email);
  await page.getByTestId("password-input").fill("password123");
  await page.getByTestId("login-button").click();
  await page.waitForURL(/\/dashboard/);
}

test.beforeEach(async ({ page }) => {
  // Reset leave requests and balances via psql
  // Requires psql installed locally or Docker psql
  const { execSync } = await import("node:child_process");
  execSync(
    `docker exec $(docker ps -qf "name=postgres") psql -U postgres -d leave_management -c "DELETE FROM leave_requests; UPDATE leave_balances SET used_days = 0;"`,
    { stdio: "pipe" },
  );
  await loginAs(page, "bob@company.com");
});

test("submit valid annual leave → modal closes, status PENDING", async ({
  page,
}) => {
  await page.getByTestId("submit-leave-btn").click();

  // Fill modal
  await page.locator("select").selectOption("ANNUAL");

  // Use a future date to avoid "past date" validation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dateStr = tomorrow.toISOString().split("T")[0];

  await page.locator('input[type="date"]').first().fill(dateStr);
  await page.locator('input[type="date"]').last().fill(dateStr);
  await page.locator('button[type="submit"]').click();

  // Modal should close
  await expect(page.locator('button[type="submit"]')).not.toBeVisible();
});

test("submit leave with insufficient balance → inline error shown", async ({
  page,
}) => {
  await page.getByTestId("submit-leave-btn").click();

  await page.locator("select").selectOption("ANNUAL");

  // Request 15 days (over 10-day limit)
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
```

- [ ] **Step 5: Write manager-approve.spec.js**

```javascript
// leave-request-system/frontend/e2e/manager-approve.spec.js
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
  // Reset DB and add a pending ANNUAL request for Bob
  execSync(
    `docker exec $(docker ps -qf "name=postgres") psql -U postgres -d leave_management -c "` +
      `DELETE FROM leave_requests; UPDATE leave_balances SET used_days = 0; ` +
      `INSERT INTO leave_requests (user_id, leave_type, start_date, end_date, total_days, status) ` +
      `VALUES (2, 'ANNUAL', '2025-09-01', '2025-09-03', 3, 'PENDING');"`,
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
```

- [ ] **Step 6: Run E2E tests (requires both servers running)**

```bash
cd leave-request-system/frontend
npx playwright test
```

Expected: 7 tests PASS.

- [ ] **Step 7: Commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/frontend/
git commit -m "feat: add Playwright E2E tests for login, submit-leave, and manager-approve"
```

---

## Task 12: Complete Makefile + Acceptance Criteria Verification

**Files:**

- Modify: `leave-request-system/Makefile`

- [ ] **Step 1: Write the complete Makefile**

```makefile
# leave-request-system/Makefile
-include .env
export

.PHONY: dev migrate seed test test-e2e db-reset build

# Start Docker DB + frontend + backend dev servers concurrently
dev:
	docker-compose up -d
	npx --yes concurrently \
		--names "backend,frontend" \
		--prefix-colors "blue,green" \
		"cd backend && DATABASE_URL=$(DATABASE_URL) SESSION_SECRET=$(SESSION_SECRET) npm run dev" \
		"cd frontend && npm run dev"

# Run Flyway migrations via Docker (no local Java needed)
migrate:
	docker run --rm \
		--network host \
		-e FLYWAY_URL=jdbc:postgresql://$(POSTGRES_HOST):$(POSTGRES_PORT)/$(POSTGRES_DB) \
		-e FLYWAY_USER=$(POSTGRES_USER) \
		-e FLYWAY_PASSWORD=$(POSTGRES_PASSWORD) \
		-v $(PWD)/db/migrations:/flyway/sql \
		flyway/flyway migrate

# Seed is just migrate (V99 is a migration; Flyway skips if already applied)
seed: migrate

# Run all backend unit + integration tests
test:
	docker-compose up -d
	cd backend && \
		DATABASE_URL=$(DATABASE_URL) \
		SESSION_SECRET=$(SESSION_SECRET) \
		npx vitest run

# Run Playwright E2E tests (requires dev servers running)
test-e2e:
	cd frontend && npx playwright test

# Drop and recreate DB, then re-run all migrations
db-reset:
	docker-compose down -v
	docker-compose up -d
	sleep 2
	$(MAKE) migrate

# Build frontend for production
build:
	cd frontend && npm run build
```

- [ ] **Step 2: Verify `make db-reset`**

```bash
cd leave-request-system
make db-reset
```

Expected: DB dropped and recreated, 4 migrations applied, seed data loaded.

- [ ] **Step 3: Verify `make migrate`**

```bash
cd leave-request-system
make migrate
```

Expected: "No migration necessary. All migrations have been applied." (already ran above).

- [ ] **Step 4: Verify `make test`**

```bash
cd leave-request-system
make test
```

Expected: 23 tests PASS (16 unit + 7 integration).

- [ ] **Step 5: Verify `make dev`**

```bash
cd leave-request-system
make dev
```

Expected: Backend starts on :3000 and frontend on :5173 in one terminal with color output.

- [ ] **Step 6: Verify `make test-e2e` (with servers running from step 5)**

In a second terminal:

```bash
cd leave-request-system
make test-e2e
```

Expected: 7 E2E tests PASS.

- [ ] **Step 7: Check all 8 acceptance criteria**

```
[ ] All Flyway migrations run cleanly from scratch via make migrate  ← verified step 2
[ ] Seed data loads via make seed                                     ← verified step 2
[ ] All unit tests pass via make test                                 ← verified step 4
[ ] All integration tests pass with real Postgres DB                  ← verified step 4
[ ] All Playwright E2E tests pass via make test-e2e                  ← verified step 6
[ ] Leave balance accurate after every action                         ← integration tests cover this
[ ] Manager-only routes return 403 for employee role                  ← integration tests cover this
[ ] No hardcoded credentials in source code                           ← all creds in .env (gitignored)
```

- [ ] **Step 8: Final commit**

```bash
cd /Users/neungviriyadamrongkij/workspace/superpowers-claude
git add leave-request-system/Makefile
git commit -m "feat: complete Makefile — leave-request-system implementation done"
```

---

## Quick Reference

| Command         | What it does                                      |
| --------------- | ------------------------------------------------- |
| `make dev`      | Start everything (Docker DB + backend + frontend) |
| `make migrate`  | Run pending Flyway migrations                     |
| `make seed`     | Alias for migrate (seed is V99)                   |
| `make test`     | Run all backend unit + integration tests          |
| `make test-e2e` | Run Playwright E2E tests                          |
| `make db-reset` | Drop + recreate DB + re-migrate                   |
| `make build`    | Build frontend for production                     |

**Default credentials (seed data):**

| User  | Email             | Password    | Role     |
| ----- | ----------------- | ----------- | -------- |
| Alice | alice@company.com | password123 | manager  |
| Bob   | bob@company.com   | password123 | employee |
| Carol | carol@company.com | password123 | employee |
