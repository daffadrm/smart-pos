# SmartPOS — Frontend

Frontend Next.js (App Router + TypeScript + Tailwind) untuk aplikasi SmartPOS. Lihat [README.md di root proyek](../README.md) untuk panduan lengkap menjalankan backend, frontend, dan database.

## Menjalankan

Backend (folder `../crud-phyton`) harus sudah jalan di `http://127.0.0.1:8001` sebelum menjalankan frontend.

```bash
npm install
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000). URL backend diatur lewat `NEXT_PUBLIC_API_URL` di `.env.local`.

## Struktur

- `src/app/` — halaman, mengikuti struktur menu PRD (`(app)/master/...`, `(app)/transaksi/...`, `(app)/laporan/...`)
- `src/components/` — komponen bersama (Sidebar, Topbar, Modal, form field, dsb)
- `src/lib/` — API client (`api.ts`), auth context, tipe data, util format

Detail arsitektur & konvensi kode ada di [`CLAUDE.md`](CLAUDE.md) (root proyek).
