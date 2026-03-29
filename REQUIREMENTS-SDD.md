# Leave Request System — Requirements Specification

> **Purpose:** This document is the single source of truth for building the Leave Request System.
> It is written to be used as a Claude / Superpowers context file.
> Every implementation decision (DB schema, API contract, UI behavior) must align with this spec.

---

## 1. Project Overview

A web-based internal leave management system that allows employees to submit leave requests
and managers to approve or reject them. The system tracks each employee's leave balance
per leave type and provides a clear audit trail of all requests.

### Goals
- Replace manual leave tracking (spreadsheet / email)
- Provide a single dashboard for employees and managers
- Maintain leave balance accuracy at all times
- Generate a realistic codebase for SDD (Spec-Driven Development) training

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| E2E Test | Playwright |
| Backend | Nuxt.js (server routes / API mode) |
| DB Migration | Flyway |
| Database | PostgreSQL |
| Local Infra | Docker + Docker Compose |
| Task Runner | Makefile |
| Unit / Integration Test | Vitest (backend) |

---

## 3. User Roles

| Role | Description |
|---|---|
| `employee` | Can submit leave requests, view own history, view own balance |
| `manager` | All employee permissions + can approve/reject any request in their team |

> **Scope:** Authentication is simplified — no OAuth, no JWT refresh. Use a static seed of users
> with a basic session cookie. The goal is to demonstrate SDD, not to build a production auth system.

---

## 4. Domain Model

### 4.1 Leave Types

| Code | Name | Annual Quota | Notes |
|---|---|---|---|
| `ANNUAL` | Annual Leave | 10 days/year | Standard paid leave |
| `SICK` | Sick Leave | 30 days/year | No approval needed — auto-approved |
| `PERSONAL` | Personal Leave | 3 days/year | Requires manager approval |

### 4.2 Request Status Flow

```
PENDING → APPROVED
        → REJECTED
```

Sick leave skips the PENDING state and is created directly as APPROVED.

---

## 5. Database Schema

### Migration naming convention (Flyway)
```
V{version}__{description}.sql
Example: V1__create_users_table.sql
```

### 5.1 Table: `users`

```sql
CREATE TABLE users (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    email       VARCHAR(150) NOT NULL UNIQUE,
    role        VARCHAR(20)  NOT NULL CHECK (role IN ('employee', 'manager')),
    password    VARCHAR(255) NOT NULL,  -- bcrypt hashed
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
```

### 5.2 Table: `leave_balances`

```sql
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

-- Computed: remaining_days = total_days - used_days
```

### 5.3 Table: `leave_requests`

```sql
CREATE TABLE leave_requests (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER      NOT NULL REFERENCES users(id),
    leave_type      VARCHAR(20)  NOT NULL CHECK (leave_type IN ('ANNUAL', 'SICK', 'PERSONAL')),
    start_date      DATE         NOT NULL,
    end_date        DATE         NOT NULL,
    total_days      INTEGER      NOT NULL,  -- calculated: business days between start and end (inclusive)
    reason          TEXT,
    status          VARCHAR(20)  NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by     INTEGER      REFERENCES users(id),  -- manager who acted
    reviewed_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_dates CHECK (end_date >= start_date)
);
```

### 5.4 Seed Data (V99__seed_data.sql)

```sql
-- Users
INSERT INTO users (name, email, role, password) VALUES
  ('Alice Manager',  'alice@company.com',  'manager',  '<bcrypt_hash_of_password123>'),
  ('Bob Employee',   'bob@company.com',    'employee', '<bcrypt_hash_of_password123>'),
  ('Carol Employee', 'carol@company.com',  'employee', '<bcrypt_hash_of_password123>');

-- Leave balances for current year
INSERT INTO leave_balances (user_id, leave_type, year, total_days) VALUES
  (2, 'ANNUAL',   2025, 10),
  (2, 'SICK',     2025, 30),
  (2, 'PERSONAL', 2025, 3),
  (3, 'ANNUAL',   2025, 10),
  (3, 'SICK',     2025, 30),
  (3, 'PERSONAL', 2025, 3);
```

---

## 6. API Specification

Base path: `/api`
Content-Type: `application/json`

### 6.1 Auth

#### POST /api/auth/login
**Request:**
```json
{ "email": "bob@company.com", "password": "password123" }
```
**Response 200:**
```json
{
  "user": {
    "id": 2,
    "name": "Bob Employee",
    "email": "bob@company.com",
    "role": "employee"
  }
}
```
**Response 401:** `{ "error": "Invalid credentials" }`

Session is stored as a server-side cookie named `session_id`.

#### POST /api/auth/logout
Clears session. Returns `{ "ok": true }`.

#### GET /api/auth/me
Returns current session user or `401`.

---

### 6.2 Leave Balances

#### GET /api/leave-balances
Returns balances for the **current authenticated user** for the current year.

**Response 200:**
```json
[
  { "leaveType": "ANNUAL",   "totalDays": 10, "usedDays": 3, "remainingDays": 7 },
  { "leaveType": "SICK",     "totalDays": 30, "usedDays": 0, "remainingDays": 30 },
  { "leaveType": "PERSONAL", "totalDays": 3,  "usedDays": 0, "remainingDays": 3 }
]
```

---

### 6.3 Leave Requests

#### GET /api/leave-requests
Returns leave requests.
- If role = `employee`: returns own requests only.
- If role = `manager`: returns all requests (all employees).

Query params (optional):
- `status` — filter by `PENDING | APPROVED | REJECTED`
- `userId` — (manager only) filter by specific user

**Response 200:**
```json
[
  {
    "id": 1,
    "userId": 2,
    "userName": "Bob Employee",
    "leaveType": "ANNUAL",
    "startDate": "2025-06-01",
    "endDate": "2025-06-03",
    "totalDays": 3,
    "reason": "Family trip",
    "status": "PENDING",
    "reviewedBy": null,
    "reviewedAt": null,
    "createdAt": "2025-05-20T10:00:00Z"
  }
]
```

#### POST /api/leave-requests
Submit a new leave request.

**Request:**
```json
{
  "leaveType": "ANNUAL",
  "startDate": "2025-06-01",
  "endDate": "2025-06-03",
  "reason": "Family trip"
}
```

**Validation rules:**
- `startDate` and `endDate` must be valid dates
- `endDate` >= `startDate`
- `startDate` must not be in the past
- `leaveType` must be one of `ANNUAL | SICK | PERSONAL`
- `totalDays` (calculated server-side) must not exceed `remainingDays` for that leave type
- Employee must not have an overlapping approved/pending request

**Business rule — Sick Leave:**
- Sick leave is automatically set to `APPROVED` on creation
- `leave_balances.used_days` is incremented immediately

**Response 201:**
```json
{ "id": 5, "status": "APPROVED", "totalDays": 2 }
```

**Response 422:**
```json
{ "error": "Insufficient leave balance. Remaining: 1 day(s), Requested: 3 day(s)" }
```

#### PATCH /api/leave-requests/:id/approve
Manager only. Sets status to `APPROVED`.
- Increments `leave_balances.used_days` by `leave_requests.total_days`

**Response 200:** `{ "ok": true }`
**Response 403:** Employee tries to approve → `{ "error": "Forbidden" }`
**Response 404:** Request not found.
**Response 409:** Request is not in PENDING status.

#### PATCH /api/leave-requests/:id/reject
Manager only. Sets status to `REJECTED`.
- Does NOT change `leave_balances.used_days`

**Response 200:** `{ "ok": true }`
**Response 403 / 404 / 409:** Same as approve.

---

## 7. Frontend — Screen Specifications

### 7.1 Login Page `/login`
- Email + password form
- Submit → calls POST /api/auth/login
- On success → redirect to `/dashboard`
- On failure → show inline error message

### 7.2 Dashboard `/dashboard`
Visible to all authenticated users.

**Sections:**
1. **Leave Balance Cards** — one card per leave type showing `remaining / total` days
2. **My Recent Requests** — last 5 requests with status badge (color-coded: yellow=PENDING, green=APPROVED, red=REJECTED)
3. **Submit Leave Request button** → opens modal

### 7.3 Submit Leave Request Modal
- Fields: Leave Type (dropdown), Start Date (date picker), End Date (date picker), Reason (textarea, optional)
- Real-time calculation: shows "X business day(s) will be deducted"
- Submit button → calls POST /api/leave-requests
- On success: closes modal, refreshes balance cards and request list
- On error: shows validation message inline

### 7.4 Manager View `/manager`
Only accessible to users with role = `manager`.

**Sections:**
1. **Pending Requests table** — shows all PENDING requests across all employees
   - Columns: Employee Name, Leave Type, Dates, Days, Reason, Actions (Approve / Reject buttons)
2. **All Requests table** — full history with status filter

### 7.5 Navigation Bar
- Shows logged-in user name and role
- Links: Dashboard | Manager (manager only) | Logout

---

## 8. Business Rules Summary

| Rule | Detail |
|---|---|
| Business day calculation | Monday–Friday only, no public holiday exclusion (keep it simple) |
| Balance update timing | Only on APPROVED status — either auto (sick) or manager action |
| Overlapping requests | System rejects if date range overlaps any existing PENDING or APPROVED request |
| Past dates | Employees cannot submit requests with a start date in the past |
| Sick leave approval | Auto-approved — no manager action needed |
| Balance scope | Per user, per leave type, per calendar year |

---

## 9. Project Structure

```
leave-request-system/
├── Makefile                   # Commands: make dev, make test, make migrate, make seed
├── docker-compose.yml         # PostgreSQL service
├── frontend/                  # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── DashboardPage.jsx
│   │   │   └── ManagerPage.jsx
│   │   ├── components/
│   │   │   ├── LeaveBalanceCard.jsx
│   │   │   ├── LeaveRequestTable.jsx
│   │   │   ├── SubmitLeaveModal.jsx
│   │   │   └── NavBar.jsx
│   │   ├── api/               # API client functions (fetch wrappers)
│   │   └── App.jsx
│   ├── e2e/                   # Playwright tests
│   │   ├── login.spec.js
│   │   ├── submit-leave.spec.js
│   │   └── manager-approve.spec.js
│   └── vite.config.js
├── backend/                   # Nuxt.js
│   ├── server/
│   │   ├── routes/
│   │   │   ├── auth/
│   │   │   │   ├── login.post.js
│   │   │   │   ├── logout.post.js
│   │   │   │   └── me.get.js
│   │   │   ├── leave-balances/
│   │   │   │   └── index.get.js
│   │   │   └── leave-requests/
│   │   │       ├── index.get.js
│   │   │       ├── index.post.js
│   │   │       ├── [id].approve.patch.js
│   │   │       └── [id].reject.patch.js
│   │   ├── utils/
│   │   │   ├── db.js           # PostgreSQL connection pool
│   │   │   ├── session.js      # Session helpers
│   │   │   └── businessDays.js # Date calculation utility
│   │   └── middleware/
│   │       └── auth.js         # Session guard middleware
│   ├── test/                  # Vitest
│   │   ├── unit/
│   │   │   └── businessDays.test.js
│   │   └── integration/
│   │       ├── leaveRequest.post.test.js
│   │       └── managerApprove.test.js
│   └── nuxt.config.ts
└── db/
    └── migrations/
        ├── V1__create_users_table.sql
        ├── V2__create_leave_balances_table.sql
        ├── V3__create_leave_requests_table.sql
        └── V99__seed_data.sql
```

---

## 10. Makefile Commands

```makefile
make dev          # Start Docker DB + frontend + backend in dev mode
make migrate      # Run Flyway migrations
make seed         # Run seed data migration
make test         # Run all backend unit + integration tests
make test:e2e     # Run Playwright E2E tests
make db:reset     # Drop and recreate DB, re-run all migrations
make build        # Build frontend for production
```

---

## 11. Test Coverage Expectations

### Unit Tests (Vitest)
| Module | What to test |
|---|---|
| `businessDays.js` | Correct day count, handles weekends, same-day = 1 day |
| Balance validation | Insufficient balance returns correct error message |
| Overlap detection | Overlapping date ranges are detected correctly |

### Integration Tests (Vitest + real DB)
| Scenario | Expected |
|---|---|
| POST /api/leave-requests (ANNUAL, valid) | 201, balance not yet changed (pending) |
| POST /api/leave-requests (SICK, valid) | 201, balance immediately decremented |
| POST /api/leave-requests (insufficient balance) | 422 with error message |
| PATCH /api/leave-requests/:id/approve | 200, used_days incremented |
| PATCH /api/leave-requests/:id/approve (employee role) | 403 |
| PATCH /api/leave-requests/:id/reject | 200, used_days unchanged |
| PATCH /api/leave-requests/:id/approve (already approved) | 409 |

### E2E Tests (Playwright)
| Scenario | Expected |
|---|---|
| Login with valid credentials | Redirect to /dashboard |
| Login with invalid credentials | Error message displayed |
| Submit annual leave (valid) | Modal closes, balance card updates |
| Submit leave with insufficient balance | Inline error shown |
| Manager approves pending request | Status badge changes to APPROVED |
| Manager rejects pending request | Status badge changes to REJECTED |
| Employee cannot access /manager | Redirect or 403 |

---

## 12. Acceptance Criteria — Definition of Done

- [ ] All Flyway migrations run cleanly from scratch via `make migrate`
- [ ] Seed data loads via `make seed`
- [ ] All unit tests pass via `make test`
- [ ] All integration tests pass with a real Postgres DB (Docker)
- [ ] All Playwright E2E tests pass via `make test:e2e`
- [ ] Leave balance is always accurate after every action (submit sick / approve annual)
- [ ] Manager-only routes return 403 for employee role
- [ ] No hardcoded credentials or connection strings in source code (use `.env`)

---

*End of Requirements Specification*
