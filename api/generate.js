import OpenAI from "openai";
import { defaultProduct } from "../src/data/defaultProduct.js";
import { generatePackage } from "../src/utils/generator.js";

const draftSchema = {
  type: "object",
  additionalProperties: false,
  required: ["marketplace", "instagram", "whatsapp", "chat", "titles", "keywords", "specs", "plan"],
  properties: {
    marketplace: { type: "string" },
    instagram: { type: "string" },
    whatsapp: { type: "string" },
    chat: { type: "string" },
    titles: {
      type: "array",
      items: { type: "string" },
    },
    keywords: {
      type: "array",
      items: { type: "string" },
    },
    specs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["label", "value"],
        properties: {
          label: { type: "string" },
          value: { type: "string" },
        },
      },
    },
    plan: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "content"],
        properties: {
          day: { type: "string" },
          content: { type: "string" },
        },
      },
    },
  },
};

const stringFields = [
  "productName",
  "buyer",
  "category",
  "weight",
  "packaging",
  "shelfLife",
  "city",
  "strengths",
  "customerQuestion",
];

const DEFAULT_MODEL = "gpt-4o-mini";
const FALLBACK_MODELS = ["gpt-4o-mini"];

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

async function readBody(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") return JSON.parse(req.body || "{}");

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}

function cleanString(value, fallback = "") {
  return String(value || fallback).trim().slice(0, 1200);
}

function cleanNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeProduct(product = {}) {
  const normalized = { ...defaultProduct };

  stringFields.forEach((field) => {
    normalized[field] = cleanString(product[field], defaultProduct[field]);
  });

  normalized.price = cleanNumber(product.price, defaultProduct.price);
  normalized.cost = cleanNumber(product.cost, defaultProduct.cost);
  normalized.extraCost = cleanNumber(product.extraCost, defaultProduct.extraCost);

  return normalized;
}

function normalizeList(value, fallback, limit) {
  if (!Array.isArray(value)) return fallback;
  const list = value
    .map((item) => cleanString(item))
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index)
    .slice(0, limit);
  return list.length ? list : fallback;
}

function normalizeSpecs(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const specs = value
    .map((item) => [cleanString(item?.label), cleanString(item?.value)])
    .filter(([label, content]) => label && content)
    .slice(0, 8);
  return specs.length ? specs : fallback;
}

function normalizePlan(value, fallback) {
  if (!Array.isArray(value)) return fallback;
  const plan = value
    .map((item) => [cleanString(item?.day), cleanString(item?.content)])
    .filter(([day, content]) => day && content)
    .slice(0, 7);
  return plan.length === 7 ? plan : fallback;
}

function normalizeDraft(draft, fallback) {
  return {
    marketplace: cleanString(draft?.marketplace, fallback.marketplace),
    instagram: cleanString(draft?.instagram, fallback.instagram),
    whatsapp: cleanString(draft?.whatsapp, fallback.whatsapp),
    chat: cleanString(draft?.chat, fallback.chat),
    titles: normalizeList(draft?.titles, fallback.titles, 5),
    keywords: normalizeList(draft?.keywords, fallback.keywords, 12).map((item) => item.toLowerCase()),
    specs: normalizeSpecs(draft?.specs, fallback.specs),
    plan: normalizePlan(draft?.plan, fallback.plan),
  };
}

function buildRequest(product) {
  const instructions = [
    "Anda adalah asisten generative AI untuk UMKM Indonesia.",
    "Buat paket jualan yang siap dipakai, jujur, spesifik, dan sesuai data produk.",
    "Jangan membuat klaim medis, klaim sertifikasi, stok, diskon, atau testimoni yang tidak ada di data.",
    "Gunakan bahasa Indonesia yang hangat, jelas, dan cocok untuk marketplace, Instagram, WhatsApp, serta chat pelanggan.",
    "Kembalikan output mengikuti JSON schema yang diminta.",
  ].join(" ");

  const input = [
    {
      role: "developer",
      content:
        "Buat deskripsi marketplace, caption Instagram, pesan WhatsApp, jawaban chat, judul produk, kata kunci, spesifikasi singkat, dan kalender konten 7 hari untuk pelaku UMKM.",
    },
    {
      role: "user",
      content: JSON.stringify({
        product,
        successCriteria: [
          "Semua teks bisa langsung ditempel oleh pemilik UMKM.",
          "Bahasa promosi tetap natural dan tidak berlebihan.",
          "Kalender 7 hari berisi aksi promosi konkret per hari.",
          "Kata kunci relevan untuk pencarian marketplace.",
        ],
      }),
    },
  ];

  return { instructions, input };
}

function getModelCandidates() {
  const configuredModel = cleanString(process.env.OPENAI_MODEL, DEFAULT_MODEL);
  return [configuredModel, ...FALLBACK_MODELS].filter(
    (model, index, models) => model && models.indexOf(model) === index
  );
}

function classifyAiError(error) {
  if (error?.status === 401) return "api_key_invalid_or_revoked";
  if (error?.status === 429) return "quota_or_rate_limit";
  if (error?.status === 404) return "model_unavailable";
  if (error?.status === 400) return "request_not_supported";
  return "ai_request_failed";
}

async function createAiDraft(client, model, instructions, input, fallback) {
  const request = {
    model,
    instructions,
    input,
    text: {
      format: {
        type: "json_schema",
        name: "larismanis_sales_package",
        strict: true,
        schema: draftSchema,
      },
    },
  };

  if (model.startsWith("gpt-5")) {
    request.reasoning = { effort: process.env.OPENAI_REASONING_EFFORT || "low" };
    request.text.verbosity = process.env.OPENAI_VERBOSITY || "medium";
  }

  const response = await client.responses.create(request);
  const rawDraft = JSON.parse(response.output_text || "{}");
  return normalizeDraft(rawDraft, fallback);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    sendJson(res, 405, { ok: false, message: "Gunakan method POST." });
    return;
  }

  if (!process.env.OPENAI_API_KEY) {
    sendJson(res, 200, {
      ok: false,
      fallback: true,
      message: "OPENAI_API_KEY belum diset. Generator lokal akan dipakai.",
    });
    return;
  }

  try {
    const body = await readBody(req);
    const product = normalizeProduct(body.product);
    const fallback = generatePackage(product);
    const { instructions, input } = buildRequest(product);
    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const attempts = [];

    for (const model of getModelCandidates()) {
      try {
        const draft = await createAiDraft(client, model, instructions, input, fallback);
        sendJson(res, 200, {
          ok: true,
          model,
          draft,
        });
        return;
      } catch (error) {
        attempts.push({
          model,
          status: error?.status,
          code: error?.code,
          type: error?.type,
          reason: classifyAiError(error),
        });
      }
    }

    console.error("Generate package failed", attempts);
    const lastAttempt = attempts.at(-1) || {};
    sendJson(res, 200, {
      ok: false,
      fallback: true,
      reason: lastAttempt.reason || "ai_request_failed",
      model: lastAttempt.model || null,
      message: "AI belum berhasil membuat paket. Generator lokal akan dipakai.",
    });
  } catch (error) {
    console.error("Generate package failed", error);
    sendJson(res, 200, {
      ok: false,
      fallback: true,
      reason: classifyAiError(error),
      message: "AI belum berhasil membuat paket. Generator lokal akan dipakai.",
    });
  }
}
