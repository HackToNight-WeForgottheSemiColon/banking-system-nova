import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { Pool } from 'pg'

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://postgres:2007@localhost:5432/htn26db'

export const pool = new Pool({
  connectionString,
  max: 3
})

let booted = false

const schema = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'customer',
  full_name TEXT NOT NULL,
  nic TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS accounts (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  account_number TEXT UNIQUE NOT NULL,
  account_name TEXT NOT NULL,
  balance NUMERIC(14, 2) NOT NULL DEFAULT 0,
  pin TEXT NOT NULL DEFAULT '0000'
);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  from_account TEXT NOT NULL,
  to_account TEXT NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'SUCCESS',
  created_by INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  event TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
`

// ── Parameterized query (SAFE — use this for all user input) ───────
export async function runQuery(sql: string, params: unknown[] = []) {
  await ensureDatabase()
  return pool.query(sql, params)
}

// ── Legacy raw-statement runner (only for static SQL — schema/seed) ─
/** @deprecated Use runQuery with parameterized values instead */
export async function runStatement(sql: string) {
  await ensureDatabase()
  console.log('[bank-sql]', sql)
  return pool.query(sql)
}

export async function ensureDatabase() {
  if (booted) return
  await pool.query(schema)

  // Hash seed passwords with bcrypt before inserting
  const SALT_ROUNDS = 12
  const hash1 = await bcrypt.hash('password123', SALT_ROUNDS)
  const hash2 = await bcrypt.hash('kasun', SALT_ROUNDS)
  const hash3 = await bcrypt.hash('admin', SALT_ROUNDS)

  await pool.query(
    `INSERT INTO users (id, username, password, role, full_name, nic, email) VALUES
      (1, 'dilara', $1, 'customer', 'Dilara Perera', '200112345678', 'dilara@example.test'),
      (2, 'kasun', $2, 'customer', 'Kasun Wickramanayake', '199812345678', 'kasun@example.test'),
      (3, 'admin', $3, 'admin', 'Platform Administrator', '000000000000', 'root@example.test')
    ON CONFLICT (id) DO NOTHING`,
    [hash1, hash2, hash3]
  )

  await pool.query(
    `INSERT INTO accounts (user_id, account_number, account_name, balance, pin) VALUES
      (1, '1000003423', 'Dilara Savings', 100000.00, '1234'),
      (1, '1000004876', 'Dilara Expenses', 42000.00, '1234'),
      (2, '2000006754', 'Kasun Current', 9870.00, '0000'),
      (3, '9999999999', 'Admin Vault', 9999999.99, '9999')
    ON CONFLICT (account_number) DO NOTHING`
  )

  await pool.query(
    `INSERT INTO transactions (from_account, to_account, amount, description, created_by) VALUES
      ('1000003423', '2000006754', 4500.00, 'Lunch money', 1),
      ('1000004876', '9999999999', 10000.00, 'Totally normal fee', 1),
      ('2000006754', '1000003423', 9870.00, 'Refund maybe', 2)
    ON CONFLICT DO NOTHING`
  )

  booted = true
}

export function asText(value: unknown) {
  if (value === undefined || value === null) return ''
  return String(value)
}

// ── Safe error handler (no leaks) ──────────────────────────────────
export function serviceFailure(reason: unknown) {
  const requestId = crypto.randomUUID()
  const issue = reason as {
    message?: string
    code?: string
    detail?: string
    stack?: string
  }

  // Log full details server-side only
  console.error(`[service-error][${requestId}]`, {
    message: issue.message,
    code: issue.code,
    detail: issue.detail,
    stack: issue.stack
  })

  // Return generic message to client — never leak internals
  return Response.json(
    {
      ok: false,
      message: 'An internal error occurred. Please try again later.',
      requestId
    },
    { status: 500 }
  )
}
