# Continuous Integration

Repository ini menggunakan GitHub Actions melalui `.github/workflows/ci.yml`.

Workflow berjalan pada setiap push ke `main`, pull request, dan pemanggilan manual. Pemeriksaan yang dijalankan:

- instalasi dependensi Node.js dengan `npm ci`;
- build frontend React/TypeScript dengan `npm run build`;
- pemeriksaan format Rust dengan `cargo fmt --all --check`;
- pemeriksaan kompilasi backend Tauri dengan `cargo check --locked`.

Workflow menggunakan izin minimum `contents: read` dan membatalkan run lama pada branch yang sama ketika commit baru dikirim.
