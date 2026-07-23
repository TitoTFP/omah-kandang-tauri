import { useCallback, useEffect, useMemo, useState } from "react";
import {
  createCustomer,
  createTransaction,
  getCategories,
  getCustomers,
  getDashboardSummary,
  getReceivables,
  getRecentTransactions,
  initializeDatabase,
} from "./db";
import type {
  Category,
  Customer,
  DashboardSummary,
  NewTransaction,
  Receivable,
  Tab,
  TransactionRecord,
  TransactionType,
} from "./types";
import {
  formatDate,
  formatRupiah,
  todayIso,
  TYPE_LABELS,
  TYPE_TONES,
} from "./utils";

const EMPTY_SUMMARY: DashboardSummary = {
  cashIncome: 0,
  expenses: 0,
  netCash: 0,
  receivables: 0,
  transactionCount: 0,
  needsReview: 0,
};

function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");

  const refresh = useCallback(async (query = "") => {
    const [nextSummary, nextTransactions, nextReceivables, nextCategories, nextCustomers] =
      await Promise.all([
        getDashboardSummary(),
        getRecentTransactions(100, query),
        getReceivables(),
        getCategories(),
        getCustomers(),
      ]);
    setSummary(nextSummary);
    setTransactions(nextTransactions);
    setReceivables(nextReceivables);
    setCategories(nextCategories);
    setCustomers(nextCustomers);
  }, []);

  useEffect(() => {
    void (async () => {
      try {
        await initializeDatabase();
        await refresh("");
      } catch (cause) {
        console.error(cause);
        setError(
          "Database lokal tidak dapat dibuka. Jalankan aplikasi melalui Tauri, bukan hanya Vite di browser.",
        );
      } finally {
        setLoading(false);
      }
    })();
  }, [refresh]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      if (!loading) {
        void getRecentTransactions(100, search)
          .then(setTransactions)
          .catch(console.error);
      }
    }, 250);
    return () => window.clearTimeout(handle);
  }, [search, loading]);

  async function handleSave(input: NewTransaction) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await createTransaction(input);
      await refresh("");
      setNotice("Transaksi berhasil disimpan.");
      setTab("dashboard");
    } catch (cause) {
      console.error(cause);
      setError("Transaksi gagal disimpan. Periksa data lalu coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCreateCustomer(name: string) {
    const customer = await createCustomer(name);
    setCustomers(await getCustomers());
    return customer;
  }

  if (loading) {
    return (
      <main className="center-page">
        <div className="loader" aria-label="Memuat aplikasi" />
        <p>Menyiapkan pembukuan lokal…</p>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <header className="app-header">
        <div>
          <p className="eyebrow">Pembukuan harian</p>
          <h1>Omah Kandang</h1>
        </div>
        <span className="offline-badge">● Offline</span>
      </header>

      {error && <div className="alert alert-error">{error}</div>}
      {notice && <div className="alert alert-success">{notice}</div>}

      <main className="main-content">
        {tab === "dashboard" && (
          <Dashboard
            summary={summary}
            transactions={transactions.slice(0, 8)}
            receivables={receivables.slice(0, 5)}
            onAdd={() => setTab("add")}
            onSeeReceivables={() => setTab("receivables")}
          />
        )}

        {tab === "add" && (
          <TransactionForm
            categories={categories}
            customers={customers}
            receivables={receivables}
            busy={busy}
            onSave={handleSave}
            onCreateCustomer={handleCreateCustomer}
          />
        )}

        {tab === "history" && (
          <History
            transactions={transactions}
            search={search}
            onSearch={setSearch}
          />
        )}

        {tab === "receivables" && (
          <Receivables
            receivables={receivables}
            onPay={() => setTab("add")}
          />
        )}
      </main>

      <nav className="bottom-nav" aria-label="Navigasi utama">
        <NavButton active={tab === "dashboard"} label="Ringkasan" icon="⌂" onClick={() => setTab("dashboard")} />
        <NavButton active={tab === "add"} label="Tambah" icon="＋" onClick={() => setTab("add")} />
        <NavButton active={tab === "history"} label="Riwayat" icon="≡" onClick={() => setTab("history")} />
        <NavButton active={tab === "receivables"} label="Piutang" icon="Rp" onClick={() => setTab("receivables")} />
      </nav>
    </div>
  );
}

function Dashboard({
  summary,
  transactions,
  receivables,
  onAdd,
  onSeeReceivables,
}: {
  summary: DashboardSummary;
  transactions: TransactionRecord[];
  receivables: Receivable[];
  onAdd: () => void;
  onSeeReceivables: () => void;
}) {
  return (
    <section className="stack">
      <div className="hero-panel">
        <div>
          <p className="eyebrow">Posisi kas tercatat</p>
          <p className={`hero-value ${summary.netCash < 0 ? "negative-text" : ""}`}>
            {formatRupiah(summary.netCash)}
          </p>
          <p className="muted">
            Pemasukan kas dikurangi seluruh pengeluaran.
          </p>
        </div>
        <button className="primary-button" type="button" onClick={onAdd}>
          ＋ Catat transaksi
        </button>
      </div>

      <div className="metrics-grid">
        <Metric label="Kas masuk" value={summary.cashIncome} tone="positive" />
        <Metric label="Pengeluaran" value={summary.expenses} tone="negative" />
        <Metric label="Sisa piutang" value={summary.receivables} tone="warning" />
        <Metric
          label="Perlu diperiksa"
          value={summary.needsReview}
          tone="neutral"
          count
        />
      </div>

      {summary.needsReview > 0 && (
        <div className="alert alert-warning">
          Data historis masih memiliki {summary.needsReview} transaksi yang belum
          diverifikasi, terutama saldo piutang lama.
        </div>
      )}

      <div className="dashboard-grid">
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Aktivitas</p>
              <h2>Transaksi terbaru</h2>
            </div>
          </div>
          <TransactionList transactions={transactions} compact />
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Penagihan</p>
              <h2>Piutang terbesar</h2>
            </div>
            <button className="text-button" type="button" onClick={onSeeReceivables}>
              Lihat semua
            </button>
          </div>
          <ReceivableList receivables={receivables} />
        </section>
      </div>
    </section>
  );
}

function Metric({
  label,
  value,
  tone,
  count = false,
}: {
  label: string;
  value: number;
  tone: string;
  count?: boolean;
}) {
  return (
    <div className={`metric-card metric-${tone}`}>
      <span>{label}</span>
      <strong>{count ? value.toLocaleString("id-ID") : formatRupiah(value)}</strong>
    </div>
  );
}

function TransactionForm({
  categories,
  customers,
  receivables,
  busy,
  onSave,
  onCreateCustomer,
}: {
  categories: Category[];
  customers: Customer[];
  receivables: Receivable[];
  busy: boolean;
  onSave: (input: NewTransaction) => Promise<void>;
  onCreateCustomer: (name: string) => Promise<Customer>;
}) {
  const [type, setType] = useState<TransactionType>("cash_income");
  const [date, setDate] = useState(todayIso());
  const [categoryId, setCategoryId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [amountText, setAmountText] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Tunai");
  const [receivableId, setReceivableId] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [newCustomer, setNewCustomer] = useState("");
  const [localError, setLocalError] = useState("");

  const filteredCategories = useMemo(
    () => categories.filter((category) => category.transaction_type === type),
    [categories, type],
  );

  const filteredReceivables = useMemo(
    () =>
      receivables.filter(
        (receivable) => !customerId || receivable.customer_id === customerId,
      ),
    [receivables, customerId],
  );

  useEffect(() => {
    setCategoryId(filteredCategories[0]?.id ?? "");
    if (type !== "credit_sale" && type !== "receivable_payment") {
      setCustomerId("");
    }
    if (type !== "receivable_payment") setReceivableId("");
    if (type !== "credit_sale") setDueDate("");
  }, [type, filteredCategories]);

  const amount = Number(amountText.replaceAll(/[^\d]/g, ""));
  const selectedReceivable = receivables.find((item) => item.id === receivableId);

  async function submit() {
    setLocalError("");
    if (!date || !categoryId || !amount || amount <= 0) {
      setLocalError("Tanggal, kategori, dan nominal wajib diisi.");
      return;
    }
    if ((type === "credit_sale" || type === "receivable_payment") && !customerId) {
      setLocalError("Pelanggan wajib dipilih untuk transaksi piutang.");
      return;
    }
    if (type === "receivable_payment" && !receivableId) {
      setLocalError("Pilih piutang yang sedang dibayar.");
      return;
    }
    if (
      type === "receivable_payment" &&
      selectedReceivable &&
      amount > selectedReceivable.outstanding
    ) {
      setLocalError("Nominal pembayaran melebihi sisa piutang.");
      return;
    }

    await onSave({
      transaction_date: date,
      transaction_type: type,
      category_id: categoryId,
      customer_id: customerId || null,
      amount,
      payment_method:
        type === "credit_sale" ? null : paymentMethod || null,
      receivable_id: type === "receivable_payment" ? receivableId : null,
      due_date: type === "credit_sale" ? dueDate || null : null,
      notes: notes.trim() || null,
    });

    setAmountText("");
    setNotes("");
    setReceivableId("");
  }

  async function addCustomer() {
    if (!newCustomer.trim()) return;
    const customer = await onCreateCustomer(newCustomer);
    setCustomerId(customer.id);
    setNewCustomer("");
  }

  return (
    <section className="form-page stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Input harian</p>
          <h2>Tambah transaksi</h2>
        </div>
      </div>

      <div className="type-picker">
        {(Object.keys(TYPE_LABELS) as TransactionType[]).map((item) => (
          <button
            type="button"
            key={item}
            className={type === item ? "type-button active" : "type-button"}
            onClick={() => setType(item)}
          >
            {TYPE_LABELS[item]}
          </button>
        ))}
      </div>

      {localError && <div className="alert alert-error">{localError}</div>}

      <div className="panel form-grid">
        <label>
          <span>Tanggal</span>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
        </label>

        <label>
          <span>Kategori</span>
          <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            {filteredCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>

        {(type === "credit_sale" || type === "receivable_payment") && (
          <label>
            <span>Pelanggan</span>
            <select value={customerId} onChange={(event) => setCustomerId(event.target.value)}>
              <option value="">Pilih pelanggan</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.name}
                </option>
              ))}
            </select>
          </label>
        )}

        {(type === "credit_sale" || type === "receivable_payment") && (
          <div className="inline-add">
            <label>
              <span>Nama pelanggan baru</span>
              <input
                value={newCustomer}
                onChange={(event) => setNewCustomer(event.target.value)}
                placeholder="Ketik jika belum ada"
              />
            </label>
            <button type="button" className="secondary-button" onClick={addCustomer}>
              Tambah
            </button>
          </div>
        )}

        {type === "receivable_payment" && (
          <label className="full-field">
            <span>Piutang yang dibayar</span>
            <select value={receivableId} onChange={(event) => setReceivableId(event.target.value)}>
              <option value="">Pilih transaksi piutang</option>
              {filteredReceivables.map((receivable) => (
                <option key={receivable.id} value={receivable.id}>
                  {receivable.customer_name} · {formatDate(receivable.transaction_date)} · sisa{" "}
                  {formatRupiah(receivable.outstanding)}
                </option>
              ))}
            </select>
          </label>
        )}

        <label>
          <span>Nominal</span>
          <input
            inputMode="numeric"
            value={amountText}
            onChange={(event) => setAmountText(event.target.value.replaceAll(/[^\d]/g, ""))}
            placeholder="Contoh: 500000"
          />
          {amount > 0 && <small>{formatRupiah(amount)}</small>}
        </label>

        {type !== "credit_sale" && (
          <label>
            <span>Metode pembayaran</span>
            <select value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value)}>
              <option>Tunai</option>
              <option>Transfer</option>
              <option>Lainnya</option>
            </select>
          </label>
        )}

        {type === "credit_sale" && (
          <label>
            <span>Jatuh tempo</span>
            <input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} />
          </label>
        )}

        <label className="full-field">
          <span>Keterangan</span>
          <textarea
            rows={3}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
            placeholder="Opsional"
          />
        </label>
      </div>

      <button className="primary-button save-button" type="button" disabled={busy} onClick={submit}>
        {busy ? "Menyimpan…" : "Simpan transaksi"}
      </button>
    </section>
  );
}

function History({
  transactions,
  search,
  onSearch,
}: {
  transactions: TransactionRecord[];
  search: string;
  onSearch: (value: string) => void;
}) {
  return (
    <section className="stack">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Arsip lokal</p>
          <h2>Riwayat transaksi</h2>
        </div>
        <span className="count-badge">{transactions.length} data</span>
      </div>

      <input
        className="search-input"
        type="search"
        value={search}
        onChange={(event) => onSearch(event.target.value)}
        placeholder="Cari kategori, pelanggan, atau catatan"
      />

      <section className="panel">
        <TransactionList transactions={transactions} />
      </section>
    </section>
  );
}

function TransactionList({
  transactions,
  compact = false,
}: {
  transactions: TransactionRecord[];
  compact?: boolean;
}) {
  if (!transactions.length) {
    return <p className="empty-state">Belum ada transaksi.</p>;
  }

  return (
    <div className="transaction-list">
      {transactions.map((transaction) => (
        <article className="transaction-row" key={transaction.id}>
          <div className={`transaction-icon ${TYPE_TONES[transaction.transaction_type]}`}>
            {transaction.transaction_type === "expense" ? "−" : "+"}
          </div>
          <div className="transaction-copy">
            <strong>{transaction.category_name}</strong>
            <span>
              {formatDate(transaction.transaction_date)}
              {transaction.customer_name ? ` · ${transaction.customer_name}` : ""}
            </span>
            {!compact && transaction.notes && <small>{transaction.notes}</small>}
          </div>
          <div className="transaction-amount">
            <strong className={transaction.transaction_type === "expense" ? "negative-text" : ""}>
              {transaction.transaction_type === "expense" ? "−" : ""}
              {formatRupiah(transaction.amount)}
            </strong>
            {transaction.verification_status !== "verified" && (
              <span className="review-badge">Periksa</span>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function Receivables({
  receivables,
  onPay,
}: {
  receivables: Receivable[];
  onPay: () => void;
}) {
  const total = receivables.reduce((sum, item) => sum + Number(item.outstanding), 0);

  return (
    <section className="stack">
      <div className="hero-panel receivable-hero">
        <div>
          <p className="eyebrow">Belum diterima</p>
          <p className="hero-value">{formatRupiah(total)}</p>
          <p className="muted">{receivables.length} transaksi piutang aktif</p>
        </div>
        <button className="primary-button" type="button" onClick={onPay}>
          Catat pembayaran
        </button>
      </div>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Daftar tagihan</p>
            <h2>Piutang aktif</h2>
          </div>
        </div>
        <ReceivableList receivables={receivables} detailed />
      </section>
    </section>
  );
}

function ReceivableList({
  receivables,
  detailed = false,
}: {
  receivables: Receivable[];
  detailed?: boolean;
}) {
  if (!receivables.length) {
    return <p className="empty-state">Tidak ada piutang aktif.</p>;
  }

  return (
    <div className="receivable-list">
      {receivables.map((item) => {
        const paidPercent = item.amount > 0 ? Math.min(100, (item.paid / item.amount) * 100) : 0;
        return (
          <article className="receivable-row" key={item.id}>
            <div className="receivable-heading">
              <div>
                <strong>{item.customer_name}</strong>
                <span>
                  {formatDate(item.transaction_date)}
                  {item.due_date ? ` · jatuh tempo ${formatDate(item.due_date)}` : ""}
                </span>
              </div>
              <strong>{formatRupiah(item.outstanding)}</strong>
            </div>
            {detailed && (
              <>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${paidPercent}%` }} />
                </div>
                <div className="receivable-meta">
                  <span>Awal {formatRupiah(item.amount)}</span>
                  <span>Terbayar {formatRupiah(item.paid)}</span>
                </div>
              </>
            )}
          </article>
        );
      })}
    </div>
  );
}

function NavButton({
  active,
  label,
  icon,
  onClick,
}: {
  active: boolean;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={active ? "nav-button active" : "nav-button"}
      onClick={onClick}
    >
      <span className="nav-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

export default App;
