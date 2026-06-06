# Project Brief: LarisManis AI

## Ringkasan

LarisManis AI adalah asisten kerja berbasis Generative AI untuk membantu pelaku UMKM Indonesia mengubah data produk sederhana menjadi paket jualan siap pakai. Aplikasi ini membantu pemilik usaha membuat deskripsi marketplace, caption Instagram, pesan WhatsApp, balasan chat pelanggan, judul produk, kata kunci, spesifikasi singkat, kalender konten 7 hari, serta simulasi margin dan rekomendasi harga.

## Latar Belakang

UMKM adalah fondasi ekonomi Indonesia, tetapi banyak pelaku usaha kecil masih menghadapi hambatan dalam pemasaran digital, pencatatan sederhana, respons pelanggan, dan persaingan harga di marketplace. Solusi digital yang ada sering terasa terlalu rumit, mahal, atau tidak sesuai dengan cara kerja pelaku UMKM yang membutuhkan alat praktis, cepat, berbahasa Indonesia, dan mudah dipakai dari perangkat sehari-hari.

## Masalah yang Diselesaikan

- Pelaku UMKM kesulitan membuat konten promosi yang menarik dan konsisten.
- Produk lokal berkualitas sering kurang terlihat karena deskripsi, kata kunci, dan judul produk belum optimal.
- Komunikasi pelanggan melalui WhatsApp atau chat marketplace membutuhkan respons cepat.
- Keputusan harga masih sering berbasis intuisi, bukan perhitungan margin sederhana.
- Pelaku usaha non-teknis membutuhkan workflow yang jelas tanpa harus memahami prompt engineering.

## Solusi

LarisManis AI menyediakan satu ruang kerja terpadu untuk audit produk dan pembuatan paket jualan. Pengguna cukup mengisi data produk seperti nama produk, target pembeli, kategori, harga, biaya produksi, kemasan, kota, dan keunggulan produk. Setelah itu AI menghasilkan materi yang bisa langsung dipakai untuk kanal digital utama UMKM.

## Implementasi Generative AI

Aplikasi menggunakan endpoint serverless `api/generate.js` yang memanggil OpenAI Responses API dari sisi server. API key disimpan sebagai environment variable di Vercel sehingga tidak terekspos di frontend. Output AI dinormalisasi agar selalu berbentuk data terstruktur berisi:

- deskripsi marketplace,
- caption Instagram,
- pesan WhatsApp,
- balasan chat pelanggan,
- alternatif judul produk,
- kata kunci marketplace,
- spesifikasi singkat,
- kalender konten 7 hari.

Jika panggilan AI gagal, aplikasi memiliki fallback generator lokal agar demo tetap berjalan, tetapi deployment production sudah diuji berhasil menghasilkan draft dari AI.

## Fitur Utama

- Audit kesiapan jual produk.
- Generator paket jualan berbasis AI.
- Konten marketplace, Instagram, WhatsApp, dan balasan chat.
- Kalender konten promosi 7 hari.
- Simulasi modal, laba kotor, margin, dan rekomendasi harga.
- Upload dan hapus foto produk.
- Edit, salin, dan ekspor draft ke JSON.
- Kuota kredit bulanan yang berkurang saat Generate digunakan.
- Penyimpanan otomatis di browser.
- Antarmuka responsif untuk desktop dan mobile.

## Kebaruan dan Nilai Tambah

LarisManis AI tidak hanya membuat teks promosi seperti generator caption biasa. Aplikasi ini menggabungkan audit produk, perhitungan margin, rekomendasi harga, respons pelanggan, dan kalender promosi dalam satu workflow yang sederhana. Pendekatan ini lebih dekat dengan kebutuhan nyata UMKM yang perlu bergerak cepat tanpa tim marketing, copywriter, atau analis bisnis khusus.

## Manfaat untuk Masyarakat Indonesia

LarisManis AI memberi manfaat ekonomi dengan membantu pelaku UMKM meningkatkan kualitas promosi, mempercepat respons pelanggan, dan mengambil keputusan harga yang lebih terukur. Dengan bahasa Indonesia dan alur kerja sederhana, aplikasi ini dapat membantu pelaku usaha kecil yang belum terbiasa memakai teknologi digital agar lebih percaya diri masuk ke marketplace dan kanal sosial.

## Target Pengguna

- Pemilik usaha makanan ringan rumahan.
- Penjual produk lokal di marketplace.
- Pelaku UMKM yang memakai WhatsApp dan Instagram untuk penjualan.
- Usaha kecil yang belum memiliki staf pemasaran digital.

## Link Aplikasi

https://larismanisai.vercel.app

## Repository

https://github.com/ekasuyatno/larismanis-ai

## Status MVP

MVP sudah dapat diakses publik, sudah menggunakan AI melalui endpoint serverless, dan sudah diuji pada deployment production. Fitur real-time yang tersedia adalah generasi konten AI berdasarkan input pengguna. Pengembangan lanjutan dapat menambahkan integrasi data penjualan, stok, WhatsApp Business, atau data tren marketplace.
