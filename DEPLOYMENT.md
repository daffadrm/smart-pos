# Panduan Deploy Permanen — SmartPOS

Backend (FastAPI) di-deploy ke **Railway** (dengan Postgres), frontend (Next.js) di-deploy ke **Vercel**. Kode sudah disiapkan untuk ini (lihat bagian "Yang sudah disiapkan di kode" di bawah) — panduan ini fokus ke langkah-langkah yang harus kamu lakukan sendiri lewat browser (buat akun, connect repo, isi environment variable).

## Yang sudah disiapkan di kode

- `crud-phyton/database.py` — baca `DATABASE_URL` dari environment variable, default ke SQLite kalau tidak di-set (untuk dev lokal). Railway otomatis inject `DATABASE_URL` ke Postgres yang kamu tambahkan.
- `crud-phyton/main.py` — CORS origin bisa diatur lewat `CORS_ORIGINS` (comma-separated), port baca dari `PORT` (di-inject Railway otomatis).
- `crud-phyton/Procfile` — perintah start production: `uvicorn main:app --host 0.0.0.0 --port $PORT` (tanpa `--reload`, beda dari mode dev).
- `crud-phyton/requirements.txt` — sudah termasuk `psycopg2-binary` (driver Postgres).
- Query laporan di `crud.py` sudah pakai `cast(..., Date)` yang portable di SQLite maupun Postgres.
- Repo git sudah di-init dan commit pertama sudah dibuat secara lokal (belum di-push).

## Langkah 1 — Push ke GitHub

1. Buka [github.com/new](https://github.com/new), buat repository baru (misal nama `smartpos`), **jangan** centang "Add README" (biar tidak konflik dengan yang sudah ada). Public atau Private terserah kamu.
2. Setelah dibuat, GitHub kasih URL repo, contoh: `https://github.com/username/smartpos.git`
3. Di terminal, dari folder project (`c:\Daffa\projects\learning\inventory-system`):
   ```bash
   git remote add origin https://github.com/USERNAME/smartpos.git
   git branch -M main
   git push -u origin main
   ```
   (ganti `USERNAME` dan nama repo sesuai punyamu)

## Langkah 2 — Deploy Backend ke Railway

1. Buka [railway.app](https://railway.app), sign up/login (bisa pakai akun GitHub).
2. **New Project** → **Deploy from GitHub repo** → pilih repo `smartpos` yang barusan di-push.
3. Railway akan coba detect otomatis. Karena repo ini monorepo (backend di subfolder `crud-phyton`), buka **Settings** service tersebut → **Root Directory** → isi `crud-phyton`.
4. **Tambah database Postgres**: di project yang sama, klik **+ New** → **Database** → **PostgreSQL**. Railway otomatis membuatkan Postgres dan menyediakan variabel `DATABASE_URL`.
5. **Hubungkan `DATABASE_URL` ke service backend**: buka service backend → tab **Variables** → **New Variable** → **Add Reference** → pilih `DATABASE_URL` dari service Postgres yang baru dibuat. (Kalau Railway versi kamu tidak punya opsi "Add Reference", cukup copy value `DATABASE_URL` dari service Postgres lalu paste manual sebagai variable di service backend.)
6. Tambah environment variable lain di service backend (tab **Variables**):
   - `SECRET_KEY` — **wajib diganti**, jangan pakai default dev. Generate nilai acak dengan menjalankan ini di terminal lokal:
     ```bash
     python -c "import secrets; print(secrets.token_hex(32))"
     ```
     Copy hasilnya sebagai value `SECRET_KEY`.
   - `CORS_ORIGINS` — isi sementara dengan `http://localhost:3000` dulu, nanti di Langkah 4 kita update lagi setelah tahu URL Vercel.
7. Railway otomatis build & deploy pakai `Procfile`. Setelah selesai, buka tab **Settings** → **Networking** → **Generate Domain** untuk dapat URL publik, contoh: `https://smartpos-production.up.railway.app`
8. Cek backend jalan: buka `https://<url-railway-kamu>/docs` — harus muncul Swagger UI. Login pertama otomatis membuat admin default (`admin`/`admin123`) di database Postgres yang baru — **segera ganti password ini setelah bisa akses aplikasi**.

## Langkah 3 — Deploy Frontend ke Vercel

1. Buka [vercel.com](https://vercel.com), sign up/login pakai akun GitHub.
2. **Add New** → **Project** → pilih repo `smartpos` yang sama.
3. Di step konfigurasi, set **Root Directory** ke `frontend`.
4. Tambah environment variable:
   - `NEXT_PUBLIC_API_URL` = URL backend Railway dari Langkah 2 (contoh `https://smartpos-production.up.railway.app`, **tanpa trailing slash**)
5. Klik **Deploy**. Setelah selesai, Vercel kasih URL, contoh: `https://smartpos.vercel.app`

## Langkah 4 — Hubungkan balik: update CORS di Railway

Backend perlu tahu domain frontend supaya tidak diblok CORS:

1. Balik ke Railway → service backend → tab **Variables**.
2. Update `CORS_ORIGINS` jadi URL Vercel kamu, contoh:
   ```
   https://smartpos.vercel.app
   ```
   (kalau nanti pakai custom domain juga, tambahkan dipisah koma: `https://smartpos.vercel.app,https://tokokamu.com`)
3. Railway otomatis redeploy setelah env var diubah.

## Langkah 5 — Cek akhir

1. Buka URL Vercel kamu, login pakai `admin` / `admin123`.
2. **Segera ganti password admin** lewat menu Master → Pengguna.
3. Coba beberapa fitur inti: buat kategori/satuan/produk, transaksi penjualan, cek dashboard — pastikan semua connect ke backend Railway dengan benar (tidak ada error CORS/network di console browser).

## Update kode setelah deploy

Setiap kali push ke branch `main` di GitHub, Railway dan Vercel otomatis build & deploy ulang — tidak perlu langkah manual lagi setelah setup awal ini selesai.

## Catatan tambahan

- **Data lama di `test.db` tidak ikut pindah otomatis** — Postgres di Railway mulai dari kosong (cuma admin default). Kalau produk/data yang sudah kamu buat di lokal mau dipindah, opsi termudah: pakai fitur **Import Excel** di menu Produk (export dulu data lama, lalu import ke versi production) — tanya saya kalau butuh bantuan bikin file exportnya dari `test.db`.
- **Biaya**: Railway dan Vercel punya free tier, tapi Railway free tier ada limit jam pemakaian per bulan — cek dashboard masing-masing untuk detail limitnya.
- Kalau ada error setelah deploy, cek dulu **Deploy Logs** di Railway/Vercel — biasanya penyebabnya env var yang belum di-set atau salah ketik URL.
