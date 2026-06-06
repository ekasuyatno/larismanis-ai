# LarisManis AI

LarisManis AI adalah aplikasi web untuk membantu UMKM menyiapkan paket jualan harian dengan bantuan Generative AI. Aplikasi ini dibuat untuk IDCamp Developer Challenge #2: Digitalization & Acceleration of MSMEs with Generative AI.

## Fitur Utama

- Audit kesiapan produk berdasarkan nama produk, target pembeli, keunggulan, harga, dan margin.
- Generator AI untuk paket jualan marketplace, Instagram, WhatsApp, balasan chat pelanggan, dan kalender konten 7 hari.
- Simulasi modal, laba kotor, margin keuntungan, dan rekomendasi harga.
- Konten hasil generator dapat diedit dan disalin.
- Kuota kredit bulanan yang berkurang setiap kali paket jualan dibuat.
- Fallback generator lokal agar aplikasi tetap bisa dipakai ketika API key belum aktif.
- Tampilan responsif untuk desktop dan mobile.

## Teknologi

- React
- Vite
- Lucide React
- OpenAI Responses API
- Vercel Serverless Function
- CSS native

## Menjalankan Lokal

```bash
npm install
npm run dev
```

Mode lokal Vite akan tetap berjalan cepat dengan fallback generator lokal. Untuk menguji endpoint AI serverless secara penuh, jalankan melalui Vercel dev atau deploy ke Vercel dengan environment variable berikut:

```bash
OPENAI_API_KEY=sk-proj-isi_dengan_api_key_anda
OPENAI_MODEL=gpt-4o-mini
OPENAI_REASONING_EFFORT=low
OPENAI_VERBOSITY=medium
VITE_USE_REMOTE_AI=true
```

`OPENAI_API_KEY` wajib disimpan sebagai environment variable server, bukan di source code React.

## Build

```bash
npm run build
```

## Deploy Vercel

1. Push project ke GitHub.
2. Import repository ke Vercel.
3. Isi environment variable `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_REASONING_EFFORT`, `OPENAI_VERBOSITY`, dan `VITE_USE_REMOTE_AI` di Project Settings > Environment Variables.
4. Deploy. Vercel akan membangun frontend dari `dist` dan menjalankan endpoint AI di `api/generate.js`.
5. Uji tombol Generate Paket dari URL publik untuk memastikan output berasal dari endpoint AI.

## Catatan Submission

- Nama aplikasi: LarisManis AI
- Tipe aplikasi: Web app
- Fokus pengguna: UMKM Indonesia
- Link aplikasi: https://larismanisai.vercel.app
- Repository: https://github.com/ekasuyatno/larismanis-ai
- Project brief: https://github.com/ekasuyatno/larismanis-ai/blob/main/PROJECT_BRIEF.md

Endpoint AI utama berada di `api/generate.js`. Jika model utama belum tersedia di akun, endpoint akan mencoba model cadangan `gpt-4o-mini`. Jika API key belum tersedia atau panggilan AI gagal, aplikasi otomatis memakai generator lokal dari `src/utils/generator.js` supaya demo tetap berjalan.
