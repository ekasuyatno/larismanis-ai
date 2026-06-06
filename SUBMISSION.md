# Data Submission Dicoding

## Nama Aplikasi

LarisManis AI

## Deskripsi Singkat

LarisManis AI adalah asisten kerja UMKM untuk mengubah data produk sederhana menjadi paket jualan siap pakai dengan bantuan Generative AI. Aplikasi membantu pelaku usaha melakukan audit kesiapan produk, membuat deskripsi marketplace, caption Instagram, pesan WhatsApp, balasan chat pelanggan, kalender konten 7 hari, serta menghitung margin dan rekomendasi harga.

## Kesesuaian Tema

Aplikasi ini mendukung digitalisasi UMKM dengan menghadirkan workflow berbasis generative AI untuk promosi, komunikasi pelanggan, dan pengambilan keputusan harga. Fokusnya bukan hanya membuat teks promosi, tetapi menyatukan audit produk, margin, dan rencana konten dalam satu ruang kerja.

Implementasi AI menggunakan endpoint serverless `api/generate.js` yang memanggil OpenAI Responses API dari sisi server. API key tidak disimpan di frontend. Jika API key belum aktif saat demo lokal, aplikasi memakai fallback generator lokal agar alur tetap bisa digunakan.

## Fitur

- Audit kesiapan jual produk.
- Generator AI konten marketplace, Instagram, WhatsApp, dan balasan chat.
- Kalender konten promosi 7 hari.
- Simulasi modal, laba kotor, margin, dan rekomendasi harga.
- Konten dapat diedit dan disalin.
- Kuota kredit bulanan yang berkurang saat Generate digunakan.
- Upload dan hapus foto produk.
- Ekspor draft ke JSON.
- Penyimpanan otomatis di browser.
- Responsif untuk desktop dan mobile.

## Link Aplikasi

https://larismanisai.vercel.app

## Repository

https://github.com/ekasuyatno/larismanis-ai

## Checklist Sebelum Submit

- `npm run build` berhasil tanpa error.
- Aplikasi publik Vercel dapat dibuka tanpa login.
- Tombol Generate Paket berhasil memakai endpoint `api/generate.js`.
- Environment variable `OPENAI_API_KEY` tersimpan di Vercel, bukan di source code.
- Link aplikasi dan repository sudah diisi pada dokumen ini.
