-- Password for all users: password123
-- Hash generated with: node -e "const b = require('bcryptjs'); console.log(b.hashSync('password123', 10))"

INSERT INTO users (name, email, role, password) VALUES
  ('Alice Manager',  'alice@company.com',  'manager',  '$2b$10$1bPy5S/5d0Q.iSp/sqctSe6W7USw2S3Jyo2Y9ZuU.xBhXMLhnNH3y'),
  ('Bob Employee',   'bob@company.com',    'employee', '$2b$10$1bPy5S/5d0Q.iSp/sqctSe6W7USw2S3Jyo2Y9ZuU.xBhXMLhnNH3y'),
  ('Carol Employee', 'carol@company.com',  'employee', '$2b$10$1bPy5S/5d0Q.iSp/sqctSe6W7USw2S3Jyo2Y9ZuU.xBhXMLhnNH3y');

INSERT INTO leave_balances (user_id, leave_type, year, total_days) VALUES
  (2, 'ANNUAL',   2025, 10),
  (2, 'SICK',     2025, 30),
  (2, 'PERSONAL', 2025, 3),
  (3, 'ANNUAL',   2025, 10),
  (3, 'SICK',     2025, 30),
  (3, 'PERSONAL', 2025, 3);
