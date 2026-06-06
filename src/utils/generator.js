export function formatRupiah(value) {
  const number = Number(value) || 0;
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(number);
}

export function splitStrengths(value) {
  return String(value || "")
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 6);
}

export function getMargin(product) {
  const price = Number(product.price) || 0;
  const cost = Number(product.cost) || 0;
  const extraCost = Number(product.extraCost) || 0;
  const totalCost = cost + extraCost;
  const profit = Math.max(price - totalCost, 0);
  const percent = price > 0 ? Math.round((profit / price) * 100) : 0;

  return {
    totalCost,
    profit,
    percent,
    recommendedMin: Math.ceil((totalCost * 1.75) / 500) * 500,
    recommendedMax: Math.ceil((totalCost * 2.05) / 500) * 500,
  };
}

export function getScore(product) {
  const strengths = splitStrengths(product.strengths);
  const margin = getMargin(product);
  const nameScore = Math.min(88, 52 + String(product.productName).length * 2);
  const valueScore = Math.min(92, 58 + strengths.length * 8);
  const marketScore = product.buyer.length > 18 ? 88 : 68;
  const marginScore = Math.max(45, Math.min(92, margin.percent + 32));
  const promoScore = product.category.length > 5 ? 82 : 62;
  const score = Math.round(
    (nameScore + valueScore + marketScore + marginScore + promoScore) / 5
  );

  return {
    score,
    status: score >= 80 ? "Siap Jual" : score >= 65 ? "Perlu Dipoles" : "Perlu Riset",
    rows: [
      ["Daya Tarik Produk", nameScore],
      ["Kejelasan Nilai", valueScore],
      ["Harga & Margin", marginScore],
      ["Kesesuaian Pasar", marketScore],
      ["Potensi Promosi", promoScore],
    ],
    suggestion:
      score >= 80
        ? "Tambahkan variasi ukuran kemasan untuk menjangkau lebih banyak segmen."
        : "Perjelas target pembeli dan tambahkan minimal tiga alasan kuat untuk membeli.",
  };
}

function firstBuyer(product) {
  return String(product.buyer || "pelanggan")
    .split(",")[0]
    .trim()
    .toLowerCase();
}

function primaryStrength(product) {
  return splitStrengths(product.strengths)[0] || "punya kualitas yang konsisten";
}

export function generatePackage(product) {
  const strengths = splitStrengths(product.strengths);
  const margin = getMargin(product);
  const buyer = firstBuyer(product);
  const name = product.productName.trim() || "Produk UMKM";
  const category = product.category.trim() || "produk lokal";
  const city = product.city.trim() || "Indonesia";
  const price = formatRupiah(product.price);
  const optimalPrice = `${formatRupiah(margin.recommendedMin)} - ${formatRupiah(
    margin.recommendedMax
  )}`;
  const titleBase = name.replace(/\s+/g, " ").trim();
  const keywords = [
    ...titleBase.toLowerCase().split(" ").filter((item) => item.length > 3),
    category.toLowerCase(),
    "umkm",
    "siap kirim",
    "produk lokal",
  ]
    .filter((item, index, arr) => arr.indexOf(item) === index)
    .slice(0, 8);

  return {
    marketplace: `${titleBase} adalah ${category.toLowerCase()} dari ${city} yang cocok untuk ${buyer}. Produk ini ${primaryStrength(
      product
    ).toLowerCase()} dan dibuat untuk pembeli yang ingin pilihan praktis, enak, dan mudah dipesan.\n\nKeunggulan:\n${strengths
      .map((item) => `- ${item}`)
      .join("\n")}\n\nHarga: ${price}\nBerat bersih: ${product.weight}\nKemasan: ${product.packaging}\nDaya tahan: ${product.shelfLife}`,
    instagram: `Lagi cari ${category.toLowerCase()} yang beda dari biasanya?\n\n${titleBase} punya rasa yang pas untuk menemani aktivitas harian. ${primaryStrength(
      product
    )} dan dikemas praktis agar mudah dibawa.\n\nHarga mulai ${price}. Pesan hari ini, stok produksi terbatas.\n\n#${keywords
      .slice(0, 5)
      .map((item) => item.replace(/\s/g, ""))
      .join(" #")}`,
    whatsapp: `Halo Kak, kami punya ${titleBase} ready stok.\n\nHarga: ${price}\nIsi: ${product.weight}\nCocok untuk: ${buyer}\n\nKeunggulan utama:\n${strengths
      .slice(0, 3)
      .map((item) => `- ${item}`)
      .join("\n")}\n\nMau kami bantu siapkan pesanan untuk hari ini?`,
    chat: `Halo Kak, pedasnya masih nyaman untuk camilan harian karena rasa pedas dan manisnya dibuat seimbang. Untuk pengiriman hari ini bisa kami bantu cek sesuai area tujuan. Jika Kakak pesan sekarang, kami siapkan produk dengan kemasan ${product.packaging.toLowerCase()}.`,
    titles: [
      `${titleBase} ${product.weight} - ${primaryStrength(product)}`,
      `${titleBase} Premium, Cocok untuk ${buyer}`,
      `${titleBase} dari ${city}, Praktis untuk Stok Camilan`,
    ],
    keywords,
    specs: [
      ["Berat Bersih", product.weight],
      ["Kategori", category],
      ["Kemasan", product.packaging],
      ["Daya Tahan", product.shelfLife],
      ["Harga Optimal", optimalPrice],
    ],
    plan: [
      ["Senin", "Kenalkan masalah pelanggan dan tawarkan produk sebagai solusi praktis."],
      ["Selasa", "Tampilkan bahan, proses, atau standar kualitas produk."],
      ["Rabu", "Bagikan testimoni singkat atau cerita pembeli pertama."],
      ["Kamis", "Buat promo bundling untuk pembelian dua produk."],
      ["Jumat", "Dorong pembelian untuk stok akhir pekan."],
      ["Sabtu", "Posting video pendek cara menikmati produk."],
      ["Minggu", "Rekap stok dan buka pre-order minggu depan."],
    ],
  };
}
