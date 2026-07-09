# PRD - SmartPOS (Simple Point of Sales)

## 1. Informasi Proyek

**Nama Aplikasi:** SmartPOS

**Platform:** - Web - Responsive (Desktop & Tablet)

**Target Pengguna:** - Toko Kelontong - Minimarket - Toko Grosir - Toko
Elektronik - Toko Bangunan - Apotek Skala Kecil

## 2. Tujuan

Membangun aplikasi kasir yang mudah digunakan untuk mengelola produk,
stok, penjualan, keuntungan, serta mencetak nota. Sistem mendukung
beberapa satuan produk (PCS, PACK, BOX, DUS) dengan harga beli dan harga
jual yang berbeda untuk setiap satuan.

## 3. Modul

### Dashboard

-   Penjualan Hari Ini
-   Laba Hari Ini
-   Jumlah Produk
-   Total Stok
-   Produk Hampir Habis
-   Transaksi Hari Ini

### Master

#### Produk

Field: - Nama Produk - SKU - Barcode (Opsional) - Kategori - Satuan
Dasar - Minimum Stok - Status Aktif

##### Konversi Satuan

  Satuan     Konversi   Harga Beli   Harga Jual
  -------- ---------- ------------ ------------
  PCS               1        2.500        3.500
  PACK             24       60.000       75.000
  DUS             288      720.000      860.000

> Semua stok disimpan dalam satuan dasar (PCS).

#### Kategori

Field: - Nama Kategori - Deskripsi (Opsional)

Digunakan untuk mengelompokkan produk dan memudahkan pencarian /
laporan.

#### Satuan

Master daftar satuan yang tersedia untuk konversi produk (PCS, PACK,
BOX, DUS, dst).

Field: - Nama Satuan - Singkatan

#### Pengguna

Field: - Nama - Username - Password - Role (Admin / Kasir) - Status
Aktif

#### Pengaturan Toko

-   Nama Toko
-   Logo
-   Alamat
-   Telepon
-   Email
-   Ukuran Kertas Nota (58mm, 80mm, A4)
-   Footer Nota
-   Format Nomor Transaksi

Contoh format nomor transaksi:

`TRX-{YYYYMMDD}-{0001}`

### Transaksi

#### Penjualan

-   Cari Produk
-   Pilih Satuan
-   Input Qty
-   Diskon (Opsional)
-   Pajak (Opsional)
-   Metode Pembayaran
-   Hitung Kembalian
-   Simpan Transaksi
-   Cetak Nota

##### Cetak Nota

Informasi yang ditampilkan: - Logo Toko - Nama Toko - Alamat - Nomor
Nota - Tanggal & Waktu - Kasir - Detail Produk - Total - Bayar -
Kembalian - Footer

Contoh footer:

> Terima kasih telah berbelanja. Barang yang sudah dibeli tidak dapat
> dikembalikan.

#### Tambah Stok

-   Tambah Stok
-   Kurangi Stok
-   Stock Adjustment

Contoh: - Input: 10 PACK - Konversi: 10 × 24 - Hasil: 240 PCS

#### Riwayat Transaksi

-   Nomor Nota
-   Tanggal
-   Kasir
-   Total
-   Laba
-   Lihat Detail
-   Cetak Ulang Nota

### Laporan

#### Penjualan

-   Penjualan Harian
-   Penjualan Bulanan
-   Produk Terlaris

#### Laba

-   Laporan Laba Harian / Bulanan

#### Stok

-   Stok Menipis
-   Nilai Stok Saat Ini

## 4. Role

### Admin

-   Semua akses

### Kasir

-   Transaksi
-   Cetak Nota
-   Riwayat Penjualan

## 5. Business Rules

1.  Stok disimpan dalam satuan dasar.
2.  Produk dapat memiliki banyak satuan.
3.  Harga beli dan harga jual disimpan per satuan.
4.  Harga transaksi disimpan sebagai histori.
5.  Stok otomatis dikurangi sesuai konversi.
6.  Nota hanya dapat dicetak setelah transaksi berhasil.
7.  Nota dapat dicetak ulang.
8.  Transaksi ditolak jika stok tidak mencukupi.

## 6. Menu

> Login berada di luar menu utama sebagai halaman autentikasi awal.

-   Dashboard
-   Master
    -   Produk
    -   Kategori
    -   Satuan
    -   Pengguna
    -   Pengaturan Toko
-   Transaksi
    -   Penjualan
    -   Tambah Stok
    -   Riwayat Transaksi
-   Laporan
    -   Penjualan
    -   Laba
    -   Stok

## 7. Future Enhancement

-   Supplier
-   Pembelian Barang
-   Barcode Scanner
-   QRIS
-   Member
-   Promo
-   Retur
-   Multi Gudang
-   Multi Cabang
-   Export Excel/PDF
-   Dashboard AI
