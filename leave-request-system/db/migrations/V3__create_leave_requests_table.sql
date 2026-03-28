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
