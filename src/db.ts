import Database from "@tauri-apps/plugin-sql";
import seed from "./data/seed.json";
import type {
  Category,
  Customer,
  DashboardSummary,
  NewTransaction,
  Receivable,
  TransactionRecord,
} from "./types";
import { createId } from "./utils";

const DATABASE_URL = "sqlite:omah-kandang.db";
let databasePromise: Promise<Database> | null = null;

function getDatabase(): Promise<Database> {
  if (!databasePromise) {
    databasePromise = Database.load(DATABASE_URL);
  }
  return databasePromise;
}

interface MetadataRow {
  value: string;
}

export async function initializeDatabase(): Promise<void> {
  const db = await getDatabase();
  const rows = await db.select<MetadataRow[]>(
    "SELECT value FROM app_metadata WHERE key = $1",
    ["historical_seed_version"],
  );

  if (rows[0]?.value === String(seed.version)) return;

  await db.execute("BEGIN TRANSACTION");
  try {
    for (const category of seed.categories) {
      await db.execute(
        `INSERT OR IGNORE INTO categories
          (id, transaction_type, name, active, notes)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          category.id,
          category.transaction_type,
          category.name,
          category.active,
          category.notes,
        ],
      );
    }

    for (const customer of seed.customers) {
      await db.execute(
        `INSERT OR IGNORE INTO customers
          (id, name, phone, address, active, notes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          customer.id,
          customer.name,
          customer.phone,
          customer.address,
          customer.active,
          customer.notes,
        ],
      );
    }

    for (const transaction of seed.transactions) {
      await db.execute(
        `INSERT OR IGNORE INTO transactions
          (
            id, transaction_date, transaction_type, category_id, customer_id,
            amount, payment_method, receivable_id, due_date, notes,
            verification_status, source, created_at, updated_at
          )
         VALUES
          ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13)`,
        [
          transaction.id,
          transaction.transaction_date,
          transaction.transaction_type,
          transaction.category_id,
          transaction.customer_id,
          transaction.amount,
          transaction.payment_method,
          transaction.receivable_id,
          transaction.due_date,
          transaction.notes,
          transaction.verification_status,
          transaction.source,
          transaction.created_at,
        ],
      );
    }

    await db.execute(
      `INSERT INTO app_metadata (key, value)
       VALUES ($1, $2)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
      ["historical_seed_version", String(seed.version)],
    );
    await db.execute("COMMIT");
  } catch (error) {
    await db.execute("ROLLBACK");
    throw error;
  }
}

export async function getCategories(): Promise<Category[]> {
  const db = await getDatabase();
  return db.select<Category[]>(
    `SELECT id, transaction_type, name, active, notes
     FROM categories
     WHERE active = 1
     ORDER BY transaction_type, name`,
  );
}

export async function getCustomers(): Promise<Customer[]> {
  const db = await getDatabase();
  return db.select<Customer[]>(
    `SELECT id, name, phone, address, active, notes
     FROM customers
     WHERE active = 1
     ORDER BY name COLLATE NOCASE`,
  );
}

export async function getRecentTransactions(
  limit = 20,
  search = "",
): Promise<TransactionRecord[]> {
  const db = await getDatabase();
  const pattern = `%${search.trim()}%`;
  return db.select<TransactionRecord[]>(
    `SELECT
       t.id,
       t.transaction_date,
       t.transaction_type,
       t.category_id,
       c.name AS category_name,
       t.customer_id,
       p.name AS customer_name,
       t.amount,
       t.payment_method,
       t.receivable_id,
       t.due_date,
       t.notes,
       t.verification_status,
       t.source,
       t.created_at
     FROM transactions t
     JOIN categories c ON c.id = t.category_id
     LEFT JOIN customers p ON p.id = t.customer_id
     WHERE
       $1 = '%%'
       OR c.name LIKE $1
       OR COALESCE(p.name, '') LIKE $1
       OR COALESCE(t.notes, '') LIKE $1
     ORDER BY t.transaction_date DESC, t.created_at DESC, t.id DESC
     LIMIT $2`,
    [pattern, limit],
  );
}

export async function getReceivables(): Promise<Receivable[]> {
  const db = await getDatabase();
  return db.select<Receivable[]>(
    `SELECT
       r.id,
       r.transaction_date,
       r.due_date,
       r.customer_id,
       c.name AS customer_name,
       r.amount,
       COALESCE(SUM(p.amount), 0) AS paid,
       r.amount - COALESCE(SUM(p.amount), 0) AS outstanding,
       r.verification_status,
       r.notes
     FROM transactions r
     JOIN customers c ON c.id = r.customer_id
     LEFT JOIN transactions p
       ON p.receivable_id = r.id
       AND p.transaction_type = 'receivable_payment'
     WHERE r.transaction_type = 'credit_sale'
     GROUP BY
       r.id, r.transaction_date, r.due_date, r.customer_id, c.name,
       r.amount, r.verification_status, r.notes
     HAVING r.amount - COALESCE(SUM(p.amount), 0) > 0
     ORDER BY
       CASE WHEN r.due_date IS NULL THEN 1 ELSE 0 END,
       r.due_date ASC,
       r.transaction_date ASC`,
  );
}

export async function getDashboardSummary(): Promise<DashboardSummary> {
  const db = await getDatabase();
  const rows = await db.select<
    Array<{
      cash_income: number;
      expenses: number;
      receivables: number;
      transaction_count: number;
      needs_review: number;
    }>
  >(
    `SELECT
       COALESCE(SUM(CASE
         WHEN transaction_type IN ('cash_income', 'receivable_payment')
         THEN amount ELSE 0 END), 0) AS cash_income,
       COALESCE(SUM(CASE
         WHEN transaction_type = 'expense'
         THEN amount ELSE 0 END), 0) AS expenses,
       (
         COALESCE(SUM(CASE
           WHEN transaction_type = 'credit_sale'
           THEN amount ELSE 0 END), 0)
         -
         COALESCE(SUM(CASE
           WHEN transaction_type = 'receivable_payment'
           THEN amount ELSE 0 END), 0)
       ) AS receivables,
       COUNT(*) AS transaction_count,
       SUM(CASE
         WHEN verification_status IN ('needs_review', 'unverified_receivable')
         THEN 1 ELSE 0 END) AS needs_review
     FROM transactions`,
  );

  const row = rows[0];
  const cashIncome = Number(row?.cash_income ?? 0);
  const expenses = Number(row?.expenses ?? 0);

  return {
    cashIncome,
    expenses,
    netCash: cashIncome - expenses,
    receivables: Number(row?.receivables ?? 0),
    transactionCount: Number(row?.transaction_count ?? 0),
    needsReview: Number(row?.needs_review ?? 0),
  };
}

export async function createTransaction(
  input: NewTransaction,
): Promise<string> {
  const db = await getDatabase();
  const id = createId("TRX");
  const now = new Date().toISOString();

  await db.execute(
    `INSERT INTO transactions
      (
        id, transaction_date, transaction_type, category_id, customer_id,
        amount, payment_method, receivable_id, due_date, notes,
        verification_status, source, created_at, updated_at
      )
     VALUES
      ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'verified', 'app', $11, $11)`,
    [
      id,
      input.transaction_date,
      input.transaction_type,
      input.category_id,
      input.customer_id,
      input.amount,
      input.payment_method,
      input.receivable_id,
      input.due_date,
      input.notes,
      now,
    ],
  );

  return id;
}

export async function createCustomer(name: string): Promise<Customer> {
  const db = await getDatabase();
  const cleanName = name.trim();
  const existing = await db.select<Customer[]>(
    `SELECT id, name, phone, address, active, notes
     FROM customers
     WHERE LOWER(name) = LOWER($1)
     LIMIT 1`,
    [cleanName],
  );

  if (existing[0]) return existing[0];

  const customer: Customer = {
    id: createId("PLG"),
    name: cleanName,
    phone: null,
    address: null,
    active: 1,
    notes: null,
  };

  await db.execute(
    `INSERT INTO customers (id, name, phone, address, active, notes)
     VALUES ($1, $2, NULL, NULL, 1, NULL)`,
    [customer.id, customer.name],
  );

  return customer;
}
