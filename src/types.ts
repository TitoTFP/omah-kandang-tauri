export type TransactionType =
  | "cash_income"
  | "expense"
  | "credit_sale"
  | "receivable_payment";

export type Tab = "dashboard" | "add" | "history" | "receivables";

export interface Category {
  id: string;
  transaction_type: TransactionType;
  name: string;
  active: number;
  notes: string | null;
}

export interface Customer {
  id: string;
  name: string;
  phone: string | null;
  address: string | null;
  active: number;
  notes: string | null;
}

export interface TransactionRecord {
  id: string;
  transaction_date: string;
  transaction_type: TransactionType;
  category_id: string;
  category_name: string;
  customer_id: string | null;
  customer_name: string | null;
  amount: number;
  payment_method: string | null;
  receivable_id: string | null;
  due_date: string | null;
  notes: string | null;
  verification_status: string;
  source: string;
  created_at: string;
}

export interface Receivable {
  id: string;
  transaction_date: string;
  due_date: string | null;
  customer_id: string;
  customer_name: string;
  amount: number;
  paid: number;
  outstanding: number;
  verification_status: string;
  notes: string | null;
}

export interface DashboardSummary {
  cashIncome: number;
  expenses: number;
  netCash: number;
  receivables: number;
  transactionCount: number;
  needsReview: number;
}

export interface NewTransaction {
  transaction_date: string;
  transaction_type: TransactionType;
  category_id: string;
  customer_id: string | null;
  amount: number;
  payment_method: string | null;
  receivable_id: string | null;
  due_date: string | null;
  notes: string | null;
}
