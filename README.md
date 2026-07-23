# 📦 Pembukuan Omah Kandang

[![Tauri v2](https://img.shields.io/badge/Tauri-v2-blue?logo=tauri)](https://tauri.app/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)](https://www.typescriptlang.org/)
[![SQLite](https://img.shields.io/badge/SQLite-Offline--First-003B57?logo=sqlite)](https://www.sqlite.org/)
[![Platform](https://img.shields.io/badge/Platform-Android%20%7C%20Desktop-green)](#)

Aplikasi pembukuan offline-first yang dirancang khusus untuk penggunaan tablet Android dan desktop usaha UMKM Omah Kandang (UMKM Bu Yanti). Dibangun menggunakan **React**, **TypeScript**, **Tauri 2**, dan **SQLite**.

---

## 🌟 Fitur Utama

- 📊 **Ringkasan Finansial Real-time**: Menampilkan total kas masuk, pengeluaran, arus kas bersih, serta total sisa piutang secara langsung.
- 📝 **Manajemen Transaksi**: Form cepat untuk pencatatan pemasukan tunai, pengeluaran harian, pembentukan piutang baru, dan pembayaran piutang (parsial/lunas).
- 👤 **Master Pelanggan**: Pengelolaan daftar pelanggan dan pelacakan riwayat transaksi per pelanggan.
- 🔍 **Riwayat & Pencarian**: Pencarian cepat transaksi berdasarkan nama pelanggan, tipe transaksi, atau tanggal.
- 🧮 **Perhitungan Otomatis Sisa Piutang**: Menghitung sisa saldo piutang secara dinamis berdasarkan akumulasi pembayaran.
- 🗃️ **Migrasi Data Historis**: Dilengkapi data awal berisi **148 transaksi** dan **24 pelanggan** dari workbook tahap 1.
- 📴 **100% Offline-First**: Seluruh data tersimpan secara lokal di perangkat. Bebas biaya langganan dan tanpa ketergantungan koneksi internet.

---

## 🏗️ Teknologi & Arsitektur

| Komponen | Teknologi | Keterangan |
| :--- | :--- | :--- |
| **Frontend UI** | React 19 + TypeScript + Vite | Antarmuka pengguna interaktif dan responsif |
| **App Framework** | Tauri v2 | Shell runtime lintas platform (Android & Desktop) |
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

Detail arsitektur lebih lengkap dapat dilihat di [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## ⚠️ Catatan Data Historis

1. **Status Piutang Historis**: Data piutang dari migrasi awal belum memiliki riwayat pelunasan eksplisit, sehingga ditandai sebagai `unverified_receivable`. Angka sisa piutang awal perlu dikonfirmasi dengan kondisi nyata sebelum ditetapkan sebagai saldo operasional resmi.
2. **Transaksi Nominal Nol**: Terdapat 1 transaksi historis bernominal `0` yang sengaja dipertahankan untuk keperluan konfirmasi data Excel sumber.

---

## 🚀 Panduan Memulai & Pengembangan

### 1. Prasyarat Sistem (Desktop Linux / Arch / CachyOS)

Pasang dependensi sistem yang dibutuhkan oleh Tauri 2:

```bash
sudo pacman -Syu
sudo pacman -S --needed webkit2gtk-4.1 base-devel curl wget file openssl \
  appmenu-gtk-module libappindicator-gtk3 librsvg xdotool
```

Pasang toolchain Rust:

```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
```

### 2. Menjalankan Aplikasi di Mode Desktop

Jalankan perintah berikut pada terminal:

```bash
# Install dependensi frontend
npm install

# Jalankan dalam mode pengembangan Tauri Desktop
npm run tauri dev
```

---

## 📱 Pengembangan & Pengujian Android

### 1. Konfigurasi Android SDK & Environment

1. Instal **Android Studio**.
2. Buka **SDK Manager** di Android Studio dan pastikan komponen berikut terpasang:
   - Android SDK Platform
   - Android SDK Platform-Tools
   - NDK (Side by side)
   - Android SDK Build-Tools
   - Android SDK Command-line Tools
3. Tambahkan variabel lingkungan ke konfigurasi shell (contoh untuk Fish shell `~/.config/fish/config.fish`):

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

5. Inisialisasi konfigurasi Android Tauri:

```bash
npm run tauri android init
```

### 2. Uji Coba pada Perangkat Fisik (Tablet Android)

1. Aktifkan **USB Debugging** di pengaturan pengembang tablet Anda.
2. Hubungkan tablet via kabel USB, lalu periksa koneksi ADB:

```bash
adb devices
```

3. Jalankan aplikasi langsung ke tablet:

```bash
npm run tauri android dev
```

### 3. Uji Coba Menggunakan Waydroid (Emulator)

Jika menggunakan Waydroid sebagai emulator lokal di Linux:

```bash
# Jalankan UI Waydroid
waydroid show-full-ui

# Aktifkan ADB di Waydroid
waydroid prop set persist.waydroid.adb_enabled true

# Dapatkan IP Waydroid dan sambungkan
waydroid status
adb connect ALAMAT_IP_WAYDROID:5555

# Cek daftar perangkat & jalankan
adb devices
npm run tauri android dev
```

---

## 📦 Build Paket Produksi (APK / AAB)

Untuk menghasilkan berkas APK / AAB Android:

```bash
npm run tauri android build
```

> **Catatan Signing**: Untuk rilis publik di Google Play Store, APK/AAB harus ditandatangani menggunakan Keystore produksi (`key.properties`). Untuk penggunaan internal UMKM pada tablet lokal, APK debug/unsigned hasil build sudah dapat digunakan.

---

## 📁 Struktur Direktori

```text
omah-kandang-tauri/
├── docs/                      # Dokumentasi proyek & rencana iterasi
│   ├── ARCHITECTURE.md
│   └── NEXT_STEPS.md
├── src/                       # Source code Frontend React
│   ├── App.tsx                # Komponen UI Utama & Form
│   ├── db.ts                  # Integrasi & Query SQLite
│   ├── data/seed.json         # Data migrasi transaksi historis
│   ├── types.ts               # Definisi Tipe TypeScript
│   └── styles.css             # Styling Vanilla CSS
├── src-tauri/                 # Source code Backend Rust / Tauri 2
│   ├── capabilities/          # Izin & Kapabilitas Tauri
│   ├── migrations/            # Skema SQL database
│   ├── src/lib.rs             # Konfigurasi plugin SQL & app entry
│   └── tauri.conf.json        # Konfigurasi aplikasi Tauri
└── README.md
```

---

## 🎯 Rencana Iterasi Selanjutnya

Detail rencana pengembangan fitur dapat dilihat pada berkas [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md):
- [ ] Pengujian input & UI pada tablet Android.
- [ ] Fitur edit, pembatalan, dan audit trail transaksi.
- [ ] Ekspor data ke CSV & Fitur Cadangan (Backup/Restore) database.
- [ ] Pengingat tanggal jatuh tempo piutang.
- [ ] Keamanan akses (PIN / Biometrik).
