PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS app_metadata (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS customers (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL COLLATE NOCASE UNIQUE,
  phone TEXT,
  address TEXT,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY NOT NULL,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'cash_income',
      'expense',
      'credit_sale',
      'receivable_payment'
    )
  ),
  name TEXT NOT NULL,
  active INTEGER NOT NULL DEFAULT 1 CHECK (active IN (0, 1)),
  notes TEXT,
  UNIQUE(transaction_type, name)
);

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY NOT NULL,
  transaction_date TEXT NOT NULL,
  transaction_type TEXT NOT NULL CHECK (
    transaction_type IN (
      'cash_income',
      'expense',
      'credit_sale',
      'receivable_payment'
    )
  ),
  category_id TEXT NOT NULL,
  customer_id TEXT,
  amount INTEGER NOT NULL CHECK (amount >= 0),
  payment_method TEXT,
  receivable_id TEXT,
  due_date TEXT,
  notes TEXT,
  verification_status TEXT NOT NULL DEFAULT 'verified' CHECK (
    verification_status IN (
      'verified',
      'needs_review',
      'unverified_receivable'
    )
  ),
  source TEXT NOT NULL DEFAULT 'app',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (category_id) REFERENCES categories(id),
  FOREIGN KEY (customer_id) REFERENCES customers(id),
  FOREIGN KEY (receivable_id) REFERENCES transactions(id)
);

CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(transaction_date DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON transactions(transaction_type);

CREATE INDEX IF NOT EXISTS idx_transactions_customer
  ON transactions(customer_id);

CREATE INDEX IF NOT EXISTS idx_transactions_receivable
  ON transactions(receivable_id);
