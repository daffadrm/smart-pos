# SmartPOS

Aplikasi kasir (Point of Sale) dan manajemen stok sederhana untuk toko kelontong, minimarket, toko grosir, dan sejenisnya. Mendukung multi-satuan produk (PCS/PACK/DUS dst) dengan harga beli & jual berbeda per satuan, potong stok otomatis saat transaksi, laporan penjualan/laba/stok, dan import produk massal dari Excel.

Spesifikasi produk lengkap ada di [`PRD_SmartPOS.md`](PRD_SmartPOS.md).

## Tech Stack

| Bagian | Teknologi |
|---|---|
| Backend | Python, FastAPI, SQLAlchemy, SQLite, JWT (pyjwt), bcrypt |
| Frontend | Next.js (App Router), TypeScript, Tailwind CSS |
| Database | SQLite (file lokal, tanpa server terpisah) |

## Struktur Folder

```
inventory-system/
├── crud-phyton/        # Backend FastAPI
│   ├── main.py          # Entry point, daftar router, seed admin default
│   ├── models.py        # Model SQLAlchemy (tabel database)
│   ├── schemas.py       # Skema request/response Pydantic
│   ├── crud.py          # Logika bisnis & akses database
│   ├── imports.py       # Parsing import Excel produk
│   ├── routers/         # Satu file per grup menu (users, products, sales, dst)
│   └── test.db          # File database SQLite (dibuat otomatis)
├── frontend/            # Frontend Next.js
│   └── src/app/         # Halaman-halaman aplikasi
└── PRD_SmartPOS.md      # Spesifikasi produk
```

## Menjalankan Aplikasi

Butuh **Python 3.10+** dan **Node.js 20+** terpasang.

### 1. Backend

```bash
cd crud-phyton
python -m pip install -r requirements.txt
python main.py
```

- Server jalan di `http://127.0.0.1:8001`
- Dokumentasi API interaktif (Swagger): `http://127.0.0.1:8001/docs`
- Auto-reload aktif — perubahan kode Python langsung ke-apply tanpa restart manual.
- Saat pertama kali dijalankan (database masih kosong), otomatis dibuatkan akun admin:
  - **Username:** `admin`
  - **Password:** `admin123`

  ⚠️ Ganti password ini kalau aplikasi dipakai di luar lingkungan development lokal.

### 2. Frontend

Jalankan di terminal terpisah (backend harus sudah jalan lebih dulu):

```bash
cd frontend
npm install
npm run dev
```

- Buka `http://localhost:3000`
- Login pakai akun admin di atas.
- URL backend yang dipanggil frontend diatur di `frontend/.env.local` (default `http://127.0.0.1:8001`).

### 3. Database

Database-nya **SQLite**, satu file, tidak perlu instalasi server database terpisah:

```
crud-phyton/test.db
```

File ini **dibuat otomatis** oleh backend saat pertama kali dijalankan. Kalau mau reset semua data (kembali ke kosong), tinggal hapus file ini lalu jalankan ulang backend — nanti dibuat ulang beserta akun admin default.

#### Membuka database dengan DBeaver (atau tool SQLite lain)

1. New Database Connection → pilih **SQLite**.
2. Kalau diminta download driver SQLite, biarkan (otomatis).
3. Path → arahkan ke file `crud-phyton/test.db`.
4. Connect. Akan muncul 9 tabel: `users`, `categories`, `units`, `products`, `product_units`, `store_settings`, `stock_movements`, `sales`, `sale_items`.

⚠️ SQLite hanya mendukung satu proses penulis pada satu waktu. Kalau backend sedang jalan dan menerima request, hindari mengedit data langsung lewat DBeaver di saat bersamaan (bisa kena database lock). Aman dipakai untuk **melihat data** kapan saja.

## Fitur

Mengikuti struktur menu di PRD (§6):

- **Dashboard** — ringkasan penjualan hari ini, laba, jumlah produk, total stok, produk hampir habis, jumlah transaksi.
- **Master**
  - **Produk** — CRUD produk dengan multi-satuan & harga per satuan, pencarian, pagination, pilih banyak produk sekaligus (checkbox) untuk bulk tambah stok, dan **import massal dari Excel** (download template, upload, laporan sukses/gagal per baris).
  - **Kategori**, **Satuan** — data master pendukung produk.
  - **Pengguna** — kelola akun admin/kasir.
  - **Pengaturan Toko** — nama toko, alamat, format nomor nota, dsb.
- **Transaksi**
  - **Penjualan** — kasir cari produk, keranjang, hitung kembalian, cetak nota, potong stok otomatis sesuai konversi satuan.
  - **Tambah Stok** — catat stok masuk/keluar/penyesuaian (stock adjustment).
  - **Riwayat Transaksi** — lihat detail transaksi lewat modal, cetak ulang nota.
- **Laporan** *(khusus admin)* — Penjualan (tren harian + produk terlaris), Laba, Stok (stok menipis + nilai stok).

### Role

- **Admin** — akses penuh ke semua menu.
- **Kasir** — hanya Penjualan dan Riwayat Transaksi (mengikuti PRD §4).

## Troubleshooting

- **Server backend tidak merespons setelah edit kode**: di Windows, `uvicorn --reload` kadang meninggalkan proses worker "nyangkut" di port 8001 meski proses utamanya sudah dimatikan. Cek `netstat -ano | grep :8001`, kalau ada PID lain selain yang baru dijalankan, matikan paksa (`taskkill //PID <pid> //F`) lalu jalankan ulang `python main.py`.
- **Frontend tidak bisa connect ke backend / error CORS**: pastikan backend sudah jalan duluan di port 8001, dan frontend diakses lewat `http://localhost:3000` atau `http://127.0.0.1:3000` (origin lain diblok CORS).
- **Lupa reset data test**: hapus `crud-phyton/test.db`, jalankan ulang backend — database & akun admin default dibuat ulang otomatis.
