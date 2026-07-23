# Arsitektur MVP

## Sasaran

Aplikasi pembukuan harian yang nyaman digunakan pada tablet Android, tidak memerlukan langganan, dan tetap dapat bekerja tanpa internet.

## Komponen

- React + TypeScript: antarmuka pengguna.
- Tauri 2: shell Android dan desktop.
- SQLite melalui plugin SQL resmi Tauri: penyimpanan lokal.
- Migrasi SQL: struktur database dapat dikembangkan secara bertahap.
- Seed JSON: data demo sintetis untuk pengujian aplikasi publik.

## Aliran data

```text
Form React
   ↓
Repository TypeScript
   ↓
Tauri SQL Plugin
   ↓
SQLite lokal pada perangkat
```

## Model transaksi

Satu tabel transaksi menyimpan empat jenis aktivitas:

- `cash_income`: pemasukan tunai.
- `expense`: pengeluaran.
- `credit_sale`: pembentukan piutang.
- `receivable_payment`: pembayaran sebagian atau penuh atas piutang.

Pembayaran piutang menunjuk transaksi `credit_sale` melalui `receivable_id`. Sisa piutang dihitung, bukan disimpan:

```text
sisa = nilai piutang - total pembayaran yang mereferensikan piutang
```

## Keputusan MVP

- Offline-first dan satu perangkat.
- Tidak ada akun pengguna.
- Tidak ada server atau sinkronisasi cloud.
- Repository publik hanya memuat data demo sintetis.
- Data operasional disimpan secara lokal dan tidak disertakan dalam source code.
- Ekspor/cadangan berkas ditambahkan pada iterasi berikutnya.
