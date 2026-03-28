-- Add 2026 leave balance records for existing employees
INSERT INTO leave_balances (user_id, leave_type, year, total_days)
VALUES
  (2, 'ANNUAL',   2026, 10),
  (2, 'SICK',     2026, 30),
  (2, 'PERSONAL', 2026, 3),
  (3, 'ANNUAL',   2026, 10),
  (3, 'SICK',     2026, 30),
  (3, 'PERSONAL', 2026, 3)
ON CONFLICT (user_id, leave_type, year) DO NOTHING;
