# Leave Request System — Implementation Design

**Date:** 2026-03-23
**Status:** Approved
**Source spec:** `REQUIREMENTS-SDD.md`

---

## 1. Scope & Decisions

This document captures the implementation design for the Leave Request System, a web-based internal leave management application. It is derived from `REQUIREMENTS-SDD.md` and records decisions made during the design session.

| Decision | Choice | Rationale |
|---|---|---|
| Project location | `superpowers-claude/leave-request-system/` | Co-located with the requirements spec |
| Implementation fidelity | Pragmatic — follow spec, fill in reasonable details where silent | Training system, not production |
| Database setup | Full from-scratch via docker-compose + Flyway | Self-contained, reproducible |
| Session handling | Signed cookie via Nuxt/h3 `useSession()` | No extra infrastructure, idiomatic Nuxt, simplified auth fits training goals |

---

## 2. Architecture Overview

A monorepo with three independent sub-packages sharing only the root Makefile and Docker Compose.

```
leave-request-system/
├── Makefile
├── docker-compose.yml        # PostgreSQL on port 5432
├── .env.example              # DATABASE_URL, SESSION_SECRET
├── frontend/                 # React + Vite (port 5173 in dev)
├── backend/                  # Nuxt 3 API-only (port 3000 in dev)
└── db/
    └── migrations/           # Flyway SQL files
```

### Environment Variables (`.env.example`)

```bash
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=leave_management
POSTGRES_USER=postgres
POSTGRES_PASSWORD=postgres
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/leave_management
SESSION_SECRET=change-me-in-production
NODE_ENV=development
```

### Runtime Topology (dev)

```
Browser
  └─→ Vite dev server :5173
        └─→ /api/* proxied to :3000
              └─→ Nuxt/Nitro API server :3000
                    └─→ PostgreSQL :5432 (Docker)
```

The Vite proxy means the browser never makes cross-origin requests — no CORS configuration needed on the backend.

Vite proxy config in `frontend/vite.config.js`:
```js
server: {
  proxy: {
    '/api': 'http://localhost:3000'
  }
}
```

### Session

Nuxt's `useSession()` with a `SESSION_SECRET` env var. The signed cookie holds `{ id, name, email, role }`. An auth middleware on every `/api/*` route (except `/api/auth/login`) reads and validates the session, attaching the user to `event.context.user`. Logout clears the cookie.

---

## 3. Database & Migrations

Flyway runs against `DATABASE_URL` from `.env`, via Docker (`flyway/flyway` image — no local Java required).

| Migration | Contents |
|---|---|
| `V1__create_users_table.sql` | `users` table with bcrypt password column |
| `V2__create_leave_balances_table.sql` | `leave_balances` with UNIQUE on `(user_id, leave_type, year)` |
| `V3__create_leave_requests_table.sql` | `leave_requests` with all CHECK constraints and date validation |
| `V99__seed_data.sql` | 3 users (Alice manager, Bob/Carol employees) + 6 balance rows for 2025 |

Seed passwords: bcrypt hash of `password123` pre-computed and hardcoded in `V99`. No runtime generation.

`make seed` is an alias for `make migrate` — Flyway skips already-applied versions. `make db:reset` runs `docker-compose down -v` then `make migrate`.

Flyway connection params are read from `db/flyway.conf` which references env vars — no credentials in source:

```properties
# db/flyway.conf
flyway.url=jdbc:postgresql://${POSTGRES_HOST:localhost}:${POSTGRES_PORT:5432}/${POSTGRES_DB}
flyway.user=${POSTGRES_USER}
flyway.password=${POSTGRES_PASSWORD}
flyway.locations=filesystem:./migrations
```

---

## 4. Backend (Nuxt 3 API-only)

Nuxt 3 with `ssr: false` — no Vue app layer, pure Nitro server routes.

### File Structure

```
backend/server/
├── middleware/
│   └── auth.ts              # Session guard; skips /api/auth/login; attaches user to event.context
├── utils/
│   ├── db.ts                # Single pg.Pool, reads DATABASE_URL from env
│   ├── session.ts           # Thin wrappers around useSession()
│   └── businessDays.ts      # countBusinessDays(start, end): Mon–Fri inclusive, no holiday exclusion
└── routes/api/
    ├── auth/
    │   ├── login.post.ts    # bcrypt.compare → useSession → set cookie
    │   ├── logout.post.ts   # Clear session cookie
    │   └── me.get.ts        # Return session user or 401
    ├── leave-balances/
    │   └── index.get.ts     # Current user, current year
    └── leave-requests/
        ├── index.get.ts     # Employee: own; Manager: all; supports ?status= ?userId=
        ├── index.post.ts    # Submit; validates in order; auto-approves SICK
        ├── [id].approve.patch.ts
        └── [id].reject.patch.ts
```

### Manager Scope

The spec mentions managers see requests "in their team." The DB schema defines no team affiliation — this is a deliberate pragmatic simplification for the training system. Managers see **all employees' requests** globally. No team-based filtering is implemented.

### Submit Leave Validation Order (`index.post.ts`)

1. Date validity (parseable dates)
2. `endDate >= startDate`
3. `startDate` not in the past
4. `leaveType` in `ANNUAL | SICK | PERSONAL`
5. Sufficient balance (`remainingDays >= requestedDays`)
6. No overlapping PENDING or APPROVED request for this user

### HTTP Status Codes

| Scenario | Code |
|---|---|
| Login invalid credentials | 401 |
| Insufficient leave balance | 422 |
| Manager-only route accessed by employee | 403 |
| Request not found | 404 |
| Approve/reject a non-PENDING request | 409 |

### Business Day Calculation

`countBusinessDays(start, end)`: counts Mon–Fri days inclusive between two dates. Same day = 1. No public holiday exclusion.

### Balance Mutations

`used_days` increments run in a **single transaction** with the status update:
- SICK submit: insert as APPROVED + increment `used_days` in one transaction
- Manager approve: update status to APPROVED + increment `used_days` in one transaction
- Manager reject: update status to REJECTED only — no balance change

### Pure Logic Helpers (extracted for testability)

All live in `backend/server/utils/`:

- `businessDays.ts` — exports `countBusinessDays(start: Date, end: Date): number`
- `validation.ts` — exports:
  - `validateBalance(requested: number, remaining: number): string | null` — returns error message or null
  - `hasOverlap(newStart: Date, newEnd: Date, existing: {start_date: string, end_date: string, status: string}[]): boolean`

### Fail-fast Validation

POST /api/leave-requests uses **fail-fast** validation — returns the first error encountered. Response body is always `{ "error": "message" }` matching spec Section 6.3.

### Date / Timezone Handling

"startDate not in past" is evaluated by comparing `startDate` (date-only, no time) against today's date in **UTC**. This keeps behaviour consistent regardless of server timezone and matches what the E2E tests will assert.

---

## 5. Frontend (React + Vite)

### File Structure

```
frontend/src/
├── App.jsx                  # React Router; fetches /api/auth/me on load; redirects accordingly
├── api/
│   ├── auth.js              # login(), logout(), me()
│   ├── leaveBalances.js     # getBalances()
│   └── leaveRequests.js     # getRequests(), submitRequest(), approve(), reject()
├── pages/
│   ├── LoginPage.jsx        # Controlled form, inline error state
│   ├── DashboardPage.jsx    # Owns modal open/close state; parallel fetches balances + requests
│   └── ManagerPage.jsx      # Route-guarded (redirects non-managers); requests with status filter
└── components/
    ├── NavBar.jsx            # Manager link visible only for role=manager
    ├── LeaveBalanceCard.jsx  # Pure display; props: { leaveType, totalDays, usedDays, remainingDays }
    ├── LeaveRequestTable.jsx # Shared; action buttons rendered only when manager prop is true
    └── SubmitLeaveModal.jsx  # Computes business days client-side on date change for preview
```

### State Management

Plain `useState` + `useEffect` — no Redux, Zustand, or React Query. After submit/approve/reject, re-fetch the relevant data to refresh the UI.

### API Client

Simple `fetch` wrappers in `src/api/` — no axios. All calls go to `/api/*` (same-origin via Vite proxy).

On success (2xx): returns parsed JSON.
On error: reads `{ "error": "..." }` from response body and throws `new Error(message)`.
Callers distinguish error types by HTTP status code (e.g., 401 → redirect to login, 422/409/403 → show inline error message).

### Routing & Auth Guard

- `/` → redirect to `/dashboard` (or `/login` if not authenticated)
- `/login` → LoginPage (redirect to `/dashboard` if already authenticated)
- `/dashboard` → DashboardPage (requires auth)
- `/manager` → ManagerPage (requires auth + role=manager; employees redirected to `/dashboard`)

---

## 6. Testing Strategy

### Unit Tests (Vitest) — `backend/test/unit/`

| File | Scenarios |
|---|---|
| `businessDays.test.js` | Same day = 1; spans weekend; Mon–Fri only; multi-week range |
| `validateBalance.test.js` | Exact balance; over balance returns correct error string; zero remaining |
| `hasOverlap.test.js` | Adjacent ranges (no overlap); overlapping PENDING; overlapping APPROVED; ignores REJECTED |

### Integration Tests (Vitest + real DB) — `backend/test/integration/`

`beforeEach` resets state with:
```sql
DELETE FROM leave_requests;
UPDATE leave_balances SET used_days = 0;
```
Keeps seed users and leave_balances rows intact. No full DB recreation per test — too slow.

| File | Scenarios |
|---|---|
| `leaveRequest.post.test.js` | ANNUAL valid → 201, balance unchanged; SICK valid → 201, balance decremented; insufficient balance → 422 with message |
| `managerApprove.test.js` | Approve → 200, used_days incremented; Employee tries approve → 403; Reject → 200, used_days unchanged; Approve already-approved → 409 |

### E2E Tests (Playwright) — `frontend/e2e/`

Target: `http://localhost:5173` (requires both servers running). Each spec file logs in fresh.

| File | Scenarios |
|---|---|
| `login.spec.js` | Valid credentials → redirect to /dashboard; invalid → inline error |
| `submit-leave.spec.js` | Valid annual → modal closes, balance card updates; insufficient balance → inline error |
| `manager-approve.spec.js` | Approve → badge changes to APPROVED; reject → badge changes to REJECTED; employee cannot access /manager |

---

## 7. Dev Workflow (Makefile)

```makefile
make dev        # docker-compose up -d + concurrently starts frontend + backend dev servers
make migrate    # flyway migrate (all pending V*.sql via Docker)
make seed       # alias for make migrate
make test       # vitest run in backend/ (unit + integration)
make test:e2e   # playwright test in frontend/e2e/ (requires servers running)
make db:reset   # docker-compose down -v + docker-compose up -d + make migrate
make build      # vite build in frontend/
```

`make dev` uses `concurrently` to run frontend and backend in one terminal with color-coded output. One `.env` at project root is sourced by both Nuxt and the Makefile.

---

## 8. Acceptance Criteria (from spec)

- [ ] All Flyway migrations run cleanly from scratch via `make migrate`
- [ ] Seed data loads via `make seed`
- [ ] All unit tests pass via `make test`
- [ ] All integration tests pass with a real Postgres DB (Docker)
- [ ] All Playwright E2E tests pass via `make test:e2e`
- [ ] Leave balance is always accurate after every action (submit sick / approve annual)
- [ ] Manager-only routes return 403 for employee role
- [ ] No hardcoded credentials or connection strings in source code (use `.env`)
