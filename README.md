# 📦 Pembukuan Omah Kandang

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Offline--First-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Desktop-green)](#)

Aplikasi pembukuan offline-first yang dirancang khusus untuk penggunaan tablet Android dan desktop usaha UMKM Omah Kandang. Dibangun menggunakan **React**, **TypeScript**, **Tauri 2**, dan **SQLite**.

---

## 🌟 Fitur Utama

- 📊 **Ringkasan Finansial Real-time**: Menampilkan total kas masuk, pengeluaran, arus kas bersih, serta total sisa piutang secara langsung.
- 📝 **Manajemen Transaksi**: Form cepat untuk pencatatan pemasukan tunai, pengeluaran harian, pembentukan piutang baru, dan pembayaran piutang parsial atau penuh.
- 👤 **Master Pelanggan**: Pengelolaan daftar pelanggan dan pelacakan riwayat transaksi per pelanggan.
- 🔍 **Riwayat & Pencarian**: Pencarian transaksi berdasarkan nama pelanggan, tipe transaksi, atau tanggal.
- 🧮 **Perhitungan Otomatis Sisa Piutang**: Menghitung sisa saldo piutang berdasarkan akumulasi pembayaran.
- 🧪 **Data Demo Anonim**: Repository publik hanya memuat data sintetis untuk menguji alur aplikasi.
- 📴 **100% Offline-First**: Seluruh data operasional tersimpan secara lokal pada perangkat, tanpa biaya langganan dan tanpa ketergantungan internet.

---

## 🏗️ Teknologi & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript + Vite | Antarmuka pengguna interaktif dan responsif |
| **App Framework** | Tauri v2 | Shell runtime lintas platform Android dan desktop |
| **Database** | SQLite (`@tauri-apps/plugin-sql`) | Database relasional lokal pada perangkat |
| **Skema & Migrasi** | SQL Migrations | Pengelolaan versi skema database secara bertahap |

```text
  [ Form React UI ]
          │
          ▼
[ Repository TypeScript ]
          │
          ▼
[ Plugin Tauri SQL ]
          │
          ▼
[ SQLite Database Lokal ]
```

Detail arsitektur tersedia di [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 🔐 Privasi Data

Repository publik ini **tidak menyimpan data pelanggan atau transaksi operasional**. Berkas `src/data/seed.json` hanya berisi data demo sintetis dengan nama, tanggal, dan nominal contoh.

Database nyata tetap berada di perangkat pengguna. Berkas database, hasil ekspor, cadangan, nomor telepon, alamat, keystore, serta konfigurasi lokal tidak boleh dimasukkan ke repository.

---

## 🚀 Panduan Memulai & Pengembangan

### 1. Prasyarat Sistem — Arch Linux/CachyOS

Pasang dependensi sistem Tauri 2:

```bash
sudo pacman -Syu
sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl \
  appmenu-gtk-module libappindicator-gtk3 librsvg xdotool
```

Pasang toolchain Rust:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

### 2. Menjalankan Aplikasi Desktop

```bash
npm install
npm run tauri dev
```

---

## 📱 Pengembangan dan Pengujian Android

### 1. Konfigurasi Android SDK

1. Instal **Android Studio**.
2. Melalui SDK Manager, pasang:
   - Android SDK Platform
   - Android SDK Platform-Tools
   - NDK (Side by side)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
3. Tambahkan variabel lingkungan, misalnya pada Fish shell:

```fish
set -gx JAVA_HOME /usr/lib/jvm/java-17-openjdk
set -gx ANDROID_HOME $HOME/Android/sdk
set -gx NDK_HOME $ANDROID_HOME/ndk/27.0.12077973
fish_add_path $ANDROID_HOME/platform-tools
fish_add_path $ANDROID_HOME/cmdline-tools/latest/bin
```

4. Tambahkan target kompilasi Android pada Rust:

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi \
  i686-linux-android x86_64-linux-android
```

5. Inisialisasi proyek Android:

```bash
npm run tauri android init
```

### 2. Perangkat Fisik

Aktifkan USB debugging pada tablet, lalu jalankan:

```bash
adb devices
npm run tauri android dev
```

### 3. Waydroid

```bash
waydroid show-full-ui
waydroid prop set persist.waydroid.adb_enabled true
waydroid status
adb connect ALAMAT_IP_WAYDROID:5555
adb devices
npm run tauri android dev
```

---

## 📦 Build APK/AAB

```bash
npm run tauri android build
```

Untuk rilis publik, APK/AAB harus ditandatangani menggunakan keystore produksi. Jangan pernah memasukkan keystore atau kata sandinya ke Git.

---

## 📁 Struktur Direktori

```text
omah-kandang-tauri/
├── docs/
│   ├── ARCHITECTURE.md
│   └── NEXT_STEPS.md
├── src/
│   ├── App.tsx
│   ├── db.ts
│   ├── data/seed.json         # Data demo sintetis dan anonim
│   ├── types.ts
│   └── styles.css
├── src-tauri/
│   ├── capabilities/
│   ├── migrations/
│   ├── src/lib.rs
│   └── tauri.conf.json
└── README.md
```

---

## 🎯 Rencana Iterasi Selanjutnya

Detail roadmap tersedia di [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md):

- [ ] Fitur edit, pembatalan, dan audit trail transaksi.
- [ ] Ekspor CSV serta backup/restore database.
- [ ] Pengingat tanggal jatuh tempo piutang.
- [ ] Keamanan akses dengan PIN atau biometrik.
