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
