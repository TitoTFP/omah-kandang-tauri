import type { TransactionType } from "./types";

export const TYPE_LABELS: Record<TransactionType, string> = {
  cash_income: "Pemasukan",
  expense: "Pengeluaran",
  credit_sale: "Piutang Baru",
  receivable_payment: "Bayar Piutang",
};

export const TYPE_TONES: Record<TransactionType, string> = {
  cash_income: "positive",
  expense: "negative",
  credit_sale: "warning",
  receivable_payment: "info",
};

export function formatRupiah(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Intl.DateTimeFormat("id-ID", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(`${value}T00:00:00`));
}

export function todayIso(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 10);
}

export function createId(prefix: string): string {
  const random =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID().replaceAll("-", "").slice(0, 12)
      : `${Date.now()}${Math.random().toString(16).slice(2)}`.slice(0, 12);
  return `${prefix}-${random.toUpperCase()}`;
}
