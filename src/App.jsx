import { useEffect, useMemo, useState } from "react";
import {
  BadgeDollarSign,
  Bell,
  Bot,
  Briefcase,
  CalendarCheck,
  CalendarDays,
  Check,
  ChevronDown,
  ClipboardList,
  Copy,
  Download,
  Gauge,
  Home,
  Instagram,
  LoaderCircle,
  Menu,
  MessageCircle,
  PackageCheck,
  Pencil,
  Plus,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Store,
  TrendingUp,
  Upload,
  WandSparkles,
  X,
  Zap,
} from "lucide-react";
import { defaultProduct, productIdeas } from "./data/defaultProduct";
import {
  formatRupiah,
  generatePackage,
  getMargin,
  getScore,
  splitStrengths,
} from "./utils/generator";
import productPhoto from "./assets/keripik-tempe-demo.png";

const STORAGE_KEY = "larismanis-ai-state-v2";
const DEFAULT_TITLE = "Paket Jualan Hari Ini";
const CREDIT_TOTAL = 2000;
const CREDIT_INITIAL = 1240;
const GENERATE_CREDIT_COST = 10;

const navItems = [
  { label: "Dashboard", icon: Home, target: "product-section", tab: "marketplace" },
  { label: "Audit Produk", icon: ClipboardList, target: "score-section" },
  { label: "Paket Jualan", icon: Briefcase, target: "output-section", tab: "marketplace" },
  { label: "Margin", icon: BadgeDollarSign, target: "margin-section" },
  { label: "Kalender", icon: CalendarDays, target: "output-section", tab: "calendar" },
  { label: "Chat Pelanggan", icon: MessageCircle, target: "output-section", tab: "chat" },
];

const tabs = [
  { key: "marketplace", label: "Marketplace", icon: Store },
  { key: "instagram", label: "Instagram", icon: Instagram },
  { key: "whatsapp", label: "WhatsApp", icon: Send },
  { key: "chat", label: "Balasan Chat", icon: MessageCircle },
  { key: "calendar", label: "Kalender 7 Hari", icon: CalendarCheck },
];

const notificationItems = [
  "Konten marketplace siap dipakai",
  "Margin produk berada di zona aman",
  "Kalender 7 hari sudah tersedia",
];

function asNumber(value) {
  return Number(String(value).replace(/[^\d]/g, "")) || 0;
}

function formatCredits(value) {
  return new Intl.NumberFormat("id-ID").format(Math.max(Number(value) || 0, 0));
}

function normalizeCredits(value, fallback = CREDIT_INITIAL) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.max(0, Math.min(CREDIT_TOTAL, Math.floor(number)));
}

function loadSavedState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveAsJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeText(value, fallback = "") {
  const text = String(value || "").trim();
  return text || fallback;
}

function normalizeTextList(value, fallback = [], limit = 10) {
  if (!Array.isArray(value)) return fallback;
  const items = value
    .map((item) => String(item || "").trim())
    .filter(Boolean)
    .filter((item, index, list) => list.indexOf(item) === index)
    .slice(0, limit);
  return items.length ? items : fallback;
}

function normalizePairList(value, fallback = [], limit = 7) {
  if (!Array.isArray(value)) return fallback;
  const pairs = value
    .map((item) => {
      if (Array.isArray(item)) {
        return [String(item[0] || "").trim(), String(item[1] || "").trim()];
      }
      if (item && typeof item === "object") {
        const label = item.label || item.key || item.day || item.name || item.title;
        const content = item.value || item.content || item.text || item.description;
        return [String(label || "").trim(), String(content || "").trim()];
      }
      return null;
    })
    .filter((item) => item?.[0] && item?.[1])
    .slice(0, limit);
  return pairs.length ? pairs : fallback;
}

function normalizeDraftShape(candidate, fallback) {
  return {
    marketplace: normalizeText(candidate?.marketplace, fallback.marketplace),
    instagram: normalizeText(candidate?.instagram, fallback.instagram),
    whatsapp: normalizeText(candidate?.whatsapp, fallback.whatsapp),
    chat: normalizeText(candidate?.chat, fallback.chat),
    titles: normalizeTextList(candidate?.titles, fallback.titles, 5),
    keywords: normalizeTextList(candidate?.keywords, fallback.keywords, 12),
    specs: normalizePairList(candidate?.specs, fallback.specs, 8),
    plan: normalizePairList(candidate?.plan, fallback.plan, 7),
  };
}

async function requestAiPackage(product) {
  if (import.meta.env.DEV && import.meta.env.VITE_USE_REMOTE_AI !== "true") {
    throw new Error("AI serverless tidak dipanggil di mode dev Vite");
  }

  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ product }),
  });

  if (!response.ok) {
    throw new Error("AI endpoint belum siap");
  }

  const payload = await response.json();
  if (!payload.ok || !payload.draft) {
    throw new Error(payload.message || "AI belum tersedia");
  }

  return payload.draft;
}

function revealOutputSection() {
  const target = document.getElementById("output-section");
  if (!target) return;

  const top = target.getBoundingClientRect().top + window.scrollY - 18;
  target.setAttribute("tabindex", "-1");
  target.focus({ preventScroll: false });
  if (window.location.hash !== "#output-section") {
    window.location.hash = "output-section";
  }
  window.scrollTo(0, top);
  document.documentElement.scrollTop = top;
  document.body.scrollTop = top;
}

function Sidebar({
  activeNav,
  creditCost,
  creditTotal,
  creditsRemaining,
  onNavigate,
  onProfileToggle,
  sidebarOpen,
}) {
  const quotaPercent = creditTotal > 0 ? Math.round((creditsRemaining / creditTotal) * 100) : 0;
  const quotaEmpty = creditsRemaining < creditCost;
  const quotaLow = !quotaEmpty && creditsRemaining <= creditTotal * 0.15;
  const quotaStatus = quotaEmpty ? "Habis" : quotaLow ? "Menipis" : "Aktif";

  return (
    <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
      <div className="brand">
        <div className="brand-mark">
          <Bot size={27} />
        </div>
        <div>
          <strong>LarisManis AI</strong>
          <span>Asisten UMKM Cerdas</span>
        </div>
      </div>

      <nav className="nav-list" aria-label="Navigasi utama">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              className={`nav-item ${activeNav === item.label ? "active" : ""}`}
              key={item.label}
              onClick={() => onNavigate(item)}
            >
              <Icon size={21} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className={`plan-card ${quotaEmpty ? "quota-empty" : quotaLow ? "quota-low" : ""}`}>
        <div className="plan-heading">
          <span className="crown">Pro</span>
          <span>{quotaStatus}</span>
        </div>
        <p>Sisa kuota bulanan</p>
        <div
          className="quota-bar"
          aria-label={`Sisa kuota ${formatCredits(creditsRemaining)} dari ${formatCredits(
            creditTotal
          )} kredit`}
        >
          <span style={{ width: `${quotaPercent}%` }} />
        </div>
        <strong>
          {formatCredits(creditsRemaining)} / {formatCredits(creditTotal)} kredit
        </strong>
        <small>{formatCredits(creditCost)} kredit / generate</small>
      </div>

      <button className="store-card" onClick={onProfileToggle}>
        <div className="store-avatar">
          <Store size={24} />
        </div>
        <div>
          <strong>Dapoer Nusa</strong>
          <span>Pemilik</span>
        </div>
        <ChevronDown size={18} />
      </button>
    </aside>
  );
}

function Topbar({
  generatedAt,
  hasUnread,
  canGenerate,
  creditCost,
  creditsRemaining,
  notificationsOpen,
  onExport,
  onGenerate,
  onMarkNotificationsRead,
  onMenuToggle,
  onProfileToggle,
  onReset,
  profileOpen,
  projectTitle,
  setNotificationsOpen,
  setProfileOpen,
  setProjectTitle,
  isGenerating,
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState(projectTitle);

  useEffect(() => {
    setTitleDraft(projectTitle);
  }, [projectTitle]);

  function saveTitle() {
    const nextTitle = titleDraft.trim() || DEFAULT_TITLE;
    setProjectTitle(nextTitle);
    setIsEditingTitle(false);
  }

  return (
    <header className="topbar">
      <div className="title-row">
        <button className="icon-button" aria-label="Buka menu" onClick={onMenuToggle}>
          <Menu size={25} />
        </button>
        <div className="divider" />
        <div className="page-title">
          <Briefcase size={26} />
          <div>
            {isEditingTitle ? (
              <input
                className="title-input"
                value={titleDraft}
                autoFocus
                onBlur={saveTitle}
                onChange={(event) => setTitleDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") saveTitle();
                  if (event.key === "Escape") {
                    setTitleDraft(projectTitle);
                    setIsEditingTitle(false);
                  }
                }}
              />
            ) : (
              <h1>{projectTitle}</h1>
            )}
            <span>Diperbarui {generatedAt}</span>
          </div>
          <button
            className="inline-icon-button"
            aria-label="Edit judul"
            onClick={() => setIsEditingTitle(true)}
          >
            <Pencil size={17} />
          </button>
        </div>
      </div>

      <div className="top-actions">
        <div className={`credit-pill ${!canGenerate ? "empty" : creditsRemaining <= creditCost * 3 ? "low" : ""}`}>
          <Zap size={19} />
          <span>{formatCredits(creditsRemaining)} kredit</span>
        </div>

        <div className="action-popover-wrap">
          <button
            className="icon-button notify"
            aria-label="Notifikasi"
            onClick={() => {
              setNotificationsOpen((current) => !current);
              setProfileOpen(false);
            }}
          >
            <Bell size={22} />
            {hasUnread && <span>3</span>}
          </button>
          {notificationsOpen && (
            <div className="popover notification-popover">
              <div className="popover-heading">
                <strong>Notifikasi</strong>
                <button onClick={() => setNotificationsOpen(false)} aria-label="Tutup notifikasi">
                  <X size={16} />
                </button>
              </div>
              <div className="notification-list">
                {notificationItems.map((item) => (
                  <div className="notification-item" key={item}>
                    <Check size={15} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
              <button className="outline-button full" onClick={onMarkNotificationsRead}>
                Tandai Dibaca
              </button>
            </div>
          )}
        </div>

        <div className="action-popover-wrap">
          <button className="profile" onClick={onProfileToggle}>
            <div className="profile-photo">SE</div>
            <span>Suyatno Eka</span>
            <ChevronDown size={17} />
          </button>
          {profileOpen && (
            <div className="popover profile-popover">
              <div className="popover-heading">
                <strong>Dapoer Nusa</strong>
                <button onClick={() => setProfileOpen(false)} aria-label="Tutup profil">
                  <X size={16} />
                </button>
              </div>
              <button onClick={onExport}>
                <Download size={17} />
                Ekspor Draft
              </button>
              <button onClick={onReset}>
                <RotateCcw size={17} />
                Reset Data
              </button>
            </div>
          )}
        </div>

        <button
          className="primary-button"
          onClick={onGenerate}
          disabled={isGenerating || !canGenerate}
          aria-busy={isGenerating}
          title={!canGenerate ? `Butuh ${formatCredits(creditCost)} kredit untuk Generate` : undefined}
        >
          {isGenerating ? <LoaderCircle className="spin" size={21} /> : <WandSparkles size={21} />}
          {isGenerating ? "Membuat..." : canGenerate ? "Generate Paket" : "Kuota Habis"}
        </button>
      </div>
    </header>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function ProductForm({
  onFileSelect,
  onRemovePhoto,
  onUseIdea,
  product,
  productImage,
  setProduct,
}) {
  const strengths = splitStrengths(product.strengths);

  function update(field, value) {
    setProduct((current) => ({ ...current, [field]: value }));
  }

  function handleDrop(event) {
    event.preventDefault();
    const file = event.dataTransfer.files?.[0];
    if (file) onFileSelect(file);
  }

  return (
    <section className="panel product-panel" id="product-section">
      <div className="panel-title">
        <ClipboardList size={22} />
        <h2>1. Informasi Produk</h2>
      </div>

      <div className="form-grid">
        <Field label="Nama Produk">
          <input
            value={product.productName}
            onChange={(event) => update("productName", event.target.value)}
          />
        </Field>
        <Field label="Harga Jual (Rp)">
          <input
            inputMode="numeric"
            value={product.price}
            onChange={(event) => update("price", asNumber(event.target.value))}
          />
        </Field>
        <Field label="Modal / HPP (Rp)">
          <input
            inputMode="numeric"
            value={product.cost}
            onChange={(event) => update("cost", asNumber(event.target.value))}
          />
        </Field>
        <Field label="Biaya Lain-lain (Rp)">
          <input
            inputMode="numeric"
            value={product.extraCost}
            onChange={(event) => update("extraCost", asNumber(event.target.value))}
          />
        </Field>
        <Field label="Target Pembeli">
          <input value={product.buyer} onChange={(event) => update("buyer", event.target.value)} />
        </Field>
        <Field label="Kategori">
          <input
            value={product.category}
            onChange={(event) => update("category", event.target.value)}
          />
        </Field>
      </div>

      <Field label="Keunggulan Produk">
        <textarea
          value={product.strengths}
          onChange={(event) => update("strengths", event.target.value)}
          rows={5}
        />
      </Field>

      <div className="product-media-row">
        <div className={`product-shot ${productImage ? "" : "empty"}`}>
          {productImage ? (
            <img src={productImage} alt="Foto produk aktif" />
          ) : (
            <div className="photo-empty">
              <Upload size={25} />
              <span>Belum ada foto</span>
            </div>
          )}
          {productImage && (
            <button className="floating-close" aria-label="Hapus foto" onClick={onRemovePhoto}>
              x
            </button>
          )}
        </div>
        <label
          className="upload-box"
          onDragOver={(event) => event.preventDefault()}
          onDrop={handleDrop}
        >
          <Upload size={25} />
          <strong>Klik atau seret file ke sini</strong>
          <span>PNG, JPG maks. 3MB</span>
          <input
            type="file"
            accept="image/png,image/jpeg,image/webp"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) onFileSelect(file);
              event.target.value = "";
            }}
          />
        </label>
      </div>

      <div className="idea-strip">
        {productIdeas.slice(0, 3).map((idea) => (
          <button key={idea} onClick={() => onUseIdea(idea)}>
            <Sparkles size={15} />
            {idea}
          </button>
        ))}
      </div>

      <div className="strength-tags" aria-label="Keunggulan produk aktif">
        {strengths.map((item) => (
          <span key={item}>
            <Check size={14} />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function ScorePanel({ score }) {
  return (
    <section className="panel score-panel" id="score-section">
      <div className="panel-title">
        <TrendingUp size={23} />
        <h2>2. Skor Kesiapan Jual</h2>
      </div>

      <div className="score-meter" style={{ "--score": `${score.score * 3.6}deg` }}>
        <div>
          <strong>{score.score}</strong>
          <span>/ 100</span>
        </div>
      </div>
      <h3>{score.status}</h3>
      <p className="muted">Produk siap dibandingkan dengan kebutuhan pasar UMKM.</p>

      <div className="score-list">
        {score.rows.map(([label, value]) => (
          <div className="score-row" key={label}>
            <ShieldCheck size={17} />
            <span>{label}</span>
            <strong>{value} / 100</strong>
          </div>
        ))}
      </div>

      <div className="insight-box">
        <Sparkles size={22} />
        <div>
          <strong>Saran Utama</strong>
          <p>{score.suggestion}</p>
        </div>
      </div>
    </section>
  );
}

function MarginPanel({ margin, onUseRecommendedPrice, product }) {
  const marginStatus = margin.percent >= 40 ? "Baik" : margin.percent >= 25 ? "Cukup" : "Tipis";

  return (
    <section className="panel margin-panel" id="margin-section">
      <div className="panel-title">
        <Gauge size={23} />
        <h2>3. Simulasi Margin</h2>
      </div>

      <div className="money-list">
        <div>
          <span>Modal / HPP</span>
          <strong>{formatRupiah(product.cost)}</strong>
        </div>
        <div>
          <span>Biaya Lain-lain</span>
          <strong>{formatRupiah(product.extraCost)}</strong>
        </div>
        <div className="total">
          <span>Total Modal</span>
          <strong>{formatRupiah(margin.totalCost)}</strong>
        </div>
        <div>
          <span>Harga Jual</span>
          <strong>{formatRupiah(product.price)}</strong>
        </div>
        <div>
          <span>Laba Kotor</span>
          <strong>{formatRupiah(margin.profit)}</strong>
        </div>
      </div>

      <div className="margin-number">
        <span>Margin Keuntungan</span>
        <strong>{margin.percent}%</strong>
      </div>
      <div className="margin-track" aria-label={`Margin ${margin.percent}%`}>
        <span style={{ width: `${Math.min(margin.percent, 70)}%` }} />
      </div>
      <div className="margin-scale">
        <span>0%</span>
        <span>20%</span>
        <span>40%</span>
        <span>60%</span>
      </div>

      <div className="insight-box price-box">
        <BadgeDollarSign size={23} />
        <div>
          <strong>Rekomendasi Harga</strong>
          <p>
            {formatRupiah(margin.recommendedMin)} - {formatRupiah(margin.recommendedMax)}
          </p>
          <button onClick={onUseRecommendedPrice}>Gunakan harga atas</button>
        </div>
        <em>{marginStatus}</em>
      </div>
    </section>
  );
}

function CopyButton({ copied, label, setCopied, value }) {
  async function copyText() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(""), 1400);
    } catch {
      setCopied("Gagal");
      window.setTimeout(() => setCopied(""), 1400);
    }
  }

  return (
    <button className="secondary-button" onClick={copyText}>
      {copied === label ? <Check size={17} /> : <Copy size={17} />}
      {copied === label ? "Tersalin" : "Salin"}
    </button>
  );
}

function TextWorkspace({ activeTab, copied, drafts, setCopied, setDrafts }) {
  const label = tabs.find((tab) => tab.key === activeTab)?.label || "Konten";

  return (
    <div className="text-workspace">
      <div className="workspace-toolbar">
        <strong>{label}</strong>
        <CopyButton value={drafts[activeTab]} copied={copied} setCopied={setCopied} label={activeTab} />
      </div>
      <textarea
        value={drafts[activeTab]}
        onChange={(event) =>
          setDrafts((current) => ({ ...current, [activeTab]: event.target.value }))
        }
        rows={12}
      />
    </div>
  );
}

function CalendarWorkspace({ drafts, setDrafts }) {
  function updatePlan(index, value) {
    setDrafts((current) => ({
      ...current,
      plan: current.plan.map((item, itemIndex) =>
        itemIndex === index ? [item[0], value] : item
      ),
    }));
  }

  return (
    <div className="calendar-list">
      {drafts.plan.map(([day, content], index) => (
        <label className="calendar-row" key={day}>
          <span>{day}</span>
          <input value={content} onChange={(event) => updatePlan(index, event.target.value)} />
        </label>
      ))}
    </div>
  );
}

function OutputPanel({
  activeTab,
  copied,
  drafts,
  keywordDraft,
  onAddKeyword,
  onRemoveKeyword,
  setActiveTab,
  setCopied,
  setDrafts,
  setKeywordDraft,
}) {
  return (
    <section className="panel output-panel" id="output-section">
      <div className="output-heading">
        <div className="panel-title">
          <PackageCheck size={23} />
          <h2>4. Hasil Paket Jualan</h2>
        </div>
        <span>Semua konten bisa diedit</span>
      </div>

      <div className="tab-list" role="tablist" aria-label="Jenis konten">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              className={activeTab === tab.key ? "active" : ""}
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              role="tab"
              aria-selected={activeTab === tab.key}
            >
              <Icon size={19} />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="workspace-grid">
        <div className="main-editor">
          {activeTab === "calendar" ? (
            <CalendarWorkspace drafts={drafts} setDrafts={setDrafts} />
          ) : (
            <TextWorkspace
              activeTab={activeTab}
              copied={copied}
              drafts={drafts}
              setCopied={setCopied}
              setDrafts={setDrafts}
            />
          )}
        </div>

        <div className="side-results">
          <section className="mini-panel">
            <h3>Spesifikasi Singkat</h3>
            {drafts.specs.map(([key, value]) => (
              <div className="spec-row" key={key}>
                <span>{key}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </section>

          <section className="mini-panel">
            <h3>Judul Produk</h3>
            <div className="title-stack">
              {drafts.titles.map((title) => (
                <div className="title-card" key={title}>
                  <span>{title}</span>
                  <CopyButton value={title} copied={copied} setCopied={setCopied} label={title} />
                </div>
              ))}
            </div>
          </section>

          <section className="mini-panel keyword-panel">
            <h3>Tag / Kata Kunci</h3>
            <div className="keyword-list">
              {drafts.keywords.map((keyword) => (
                <button
                  className="keyword-chip"
                  key={keyword}
                  onClick={() => onRemoveKeyword(keyword)}
                  aria-label={`Hapus ${keyword}`}
                >
                  {keyword}
                  <X size={13} />
                </button>
              ))}
            </div>
            <form className="keyword-form" onSubmit={onAddKeyword}>
              <input
                value={keywordDraft}
                placeholder="kata kunci baru"
                onChange={(event) => setKeywordDraft(event.target.value)}
              />
              <button className="outline-button">
                <Plus size={17} />
                Tambah
              </button>
            </form>
          </section>
        </div>
      </div>
    </section>
  );
}

function Toast({ message }) {
  if (!message) return null;
  return (
    <div className="toast" role="status">
      <Check size={17} />
      {message}
    </div>
  );
}

function App() {
  const savedState = loadSavedState();
  const [product, setProduct] = useState(savedState?.product || defaultProduct);
  const [activeTab, setActiveTab] = useState(savedState?.activeTab || "marketplace");
  const [activeNav, setActiveNav] = useState("Dashboard");
  const [drafts, setDrafts] = useState(
    savedState?.drafts || generatePackage(savedState?.product || defaultProduct)
  );
  const [copied, setCopied] = useState("");
  const [generatedAt, setGeneratedAt] = useState(savedState?.generatedAt || "06.54");
  const [hasUnread, setHasUnread] = useState(savedState?.hasUnread ?? true);
  const [keywordDraft, setKeywordDraft] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [productImage, setProductImage] = useState(savedState?.productImage ?? productPhoto);
  const [profileOpen, setProfileOpen] = useState(false);
  const [projectTitle, setProjectTitle] = useState(savedState?.projectTitle || DEFAULT_TITLE);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [pendingReveal, setPendingReveal] = useState(false);
  const [creditsRemaining, setCreditsRemaining] = useState(
    normalizeCredits(savedState?.creditsRemaining)
  );

  const score = useMemo(() => getScore(product), [product]);
  const margin = useMemo(() => getMargin(product), [product]);
  const canGenerate = creditsRemaining >= GENERATE_CREDIT_COST;

  useEffect(() => {
    const payload = {
      activeTab,
      drafts,
      generatedAt,
      hasUnread,
      product,
      productImage,
      projectTitle,
      creditsRemaining,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  }, [
    activeTab,
    creditsRemaining,
    drafts,
    generatedAt,
    hasUnread,
    product,
    productImage,
    projectTitle,
  ]);

  useEffect(() => {
    if (!pendingReveal || isGenerating) return undefined;

    const timeoutId = window.setTimeout(() => {
      revealOutputSection();
      setPendingReveal(false);
    }, 80);

    return () => window.clearTimeout(timeoutId);
  }, [activeTab, drafts, isGenerating, pendingReveal]);

  function showToast(message) {
    setToast(message);
    window.clearTimeout(showToast.timeoutId);
    showToast.timeoutId = window.setTimeout(() => setToast(""), 1800);
  }

  function scrollToSection(item) {
    setActiveNav(item.label);
    if (item.tab) setActiveTab(item.tab);
    if (window.matchMedia("(max-width: 980px)").matches) {
      setSidebarOpen(false);
    }
    window.requestAnimationFrame(() => {
      const target = document.getElementById(item.target);
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

  async function handleGenerate() {
    if (isGenerating) return;
    if (!canGenerate) {
      showToast("Kuota tidak cukup");
      return;
    }

    const fallbackDrafts = generatePackage(product);
    setIsGenerating(true);
    setGeneratedAt(
      new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
    setActiveNav("Paket Jualan");
    setActiveTab("marketplace");

    try {
      const aiDrafts = await requestAiPackage(product);
      setDrafts(normalizeDraftShape(aiDrafts, fallbackDrafts));
      setCreditsRemaining((current) => normalizeCredits(current - GENERATE_CREDIT_COST, 0));
      showToast(`Paket AI dibuat, ${formatCredits(GENERATE_CREDIT_COST)} kredit terpakai`);
    } catch {
      setDrafts(fallbackDrafts);
      setCreditsRemaining((current) => normalizeCredits(current - GENERATE_CREDIT_COST, 0));
      showToast(`Generator lokal dipakai, ${formatCredits(GENERATE_CREDIT_COST)} kredit terpakai`);
    } finally {
      setIsGenerating(false);
      setPendingReveal(true);
    }
  }

  function handleUseIdea(idea) {
    setProduct((current) => ({
      ...current,
      productName: idea,
      category: idea.includes("Kopi")
        ? "Minuman siap saji"
        : idea.includes("Sabun")
          ? "Perawatan tubuh"
          : "Produk UMKM",
    }));
    showToast("Ide produk diterapkan");
  }

  function handleFileSelect(file) {
    if (!file.type.startsWith("image/")) {
      showToast("File harus berupa gambar");
      return;
    }
    if (file.size > 3 * 1024 * 1024) {
      showToast("Ukuran foto maksimal 3MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setProductImage(String(reader.result));
      showToast("Foto produk diperbarui");
    };
    reader.readAsDataURL(file);
  }

  function handleAddKeyword(event) {
    event.preventDefault();
    const keyword = keywordDraft.trim().toLowerCase();
    if (!keyword) return;
    if (drafts.keywords.includes(keyword)) {
      showToast("Kata kunci sudah ada");
      return;
    }
    setDrafts((current) => ({
      ...current,
      keywords: [...current.keywords, keyword].slice(0, 12),
    }));
    setKeywordDraft("");
    showToast("Kata kunci ditambahkan");
  }

  function handleRemoveKeyword(keyword) {
    setDrafts((current) => ({
      ...current,
      keywords: current.keywords.filter((item) => item !== keyword),
    }));
    showToast("Kata kunci dihapus");
  }

  function handleUseRecommendedPrice() {
    setProduct((current) => ({ ...current, price: margin.recommendedMax }));
    showToast("Harga rekomendasi dipakai");
  }

  function handleExport() {
    saveAsJson("larismanis-ai-draft.json", {
      drafts,
      product,
      projectTitle,
      generatedAt,
      creditsRemaining,
      creditTotal: CREDIT_TOTAL,
      generateCreditCost: GENERATE_CREDIT_COST,
    });
    setProfileOpen(false);
    showToast("Draft diekspor");
  }

  function handleReset() {
    const nextDrafts = generatePackage(defaultProduct);
    setProduct(defaultProduct);
    setDrafts(nextDrafts);
    setActiveTab("marketplace");
    setActiveNav("Dashboard");
    setGeneratedAt("06.54");
    setHasUnread(true);
    setProductImage(productPhoto);
    setProjectTitle(DEFAULT_TITLE);
    setProfileOpen(false);
    localStorage.removeItem(STORAGE_KEY);
    showToast("Data dikembalikan");
  }

  return (
    <div className={`app-shell ${sidebarOpen ? "" : "sidebar-closed"}`}>
      <Sidebar
        activeNav={activeNav}
        creditCost={GENERATE_CREDIT_COST}
        creditTotal={CREDIT_TOTAL}
        creditsRemaining={creditsRemaining}
        onNavigate={scrollToSection}
        onProfileToggle={() => setProfileOpen((current) => !current)}
        sidebarOpen={sidebarOpen}
      />
      <main className="app-main">
        <Topbar
          generatedAt={generatedAt}
          hasUnread={hasUnread}
          canGenerate={canGenerate}
          creditCost={GENERATE_CREDIT_COST}
          creditsRemaining={creditsRemaining}
          notificationsOpen={notificationsOpen}
          onExport={handleExport}
          onGenerate={handleGenerate}
          onMarkNotificationsRead={() => {
            setHasUnread(false);
            setNotificationsOpen(false);
            showToast("Notifikasi ditandai dibaca");
          }}
          onMenuToggle={() => setSidebarOpen((current) => !current)}
          onProfileToggle={() => {
            setProfileOpen((current) => !current);
            setNotificationsOpen(false);
          }}
          onReset={handleReset}
          profileOpen={profileOpen}
          projectTitle={projectTitle}
          setNotificationsOpen={setNotificationsOpen}
          setProfileOpen={setProfileOpen}
          setProjectTitle={setProjectTitle}
          isGenerating={isGenerating}
        />
        <div className="content-wrap">
          <div className="top-grid">
            <ProductForm
              onFileSelect={handleFileSelect}
              onRemovePhoto={() => {
                setProductImage("");
                showToast("Foto produk dihapus");
              }}
              onUseIdea={handleUseIdea}
              product={product}
              productImage={productImage}
              setProduct={setProduct}
            />
            <ScorePanel score={score} />
            <MarginPanel
              margin={margin}
              onUseRecommendedPrice={handleUseRecommendedPrice}
              product={product}
            />
          </div>

          <OutputPanel
            activeTab={activeTab}
            copied={copied}
            drafts={drafts}
            keywordDraft={keywordDraft}
            onAddKeyword={handleAddKeyword}
            onRemoveKeyword={handleRemoveKeyword}
            setActiveTab={setActiveTab}
            setCopied={setCopied}
            setDrafts={setDrafts}
            setKeywordDraft={setKeywordDraft}
          />
        </div>
      </main>
      <Toast message={toast} />
    </div>
  );
}

export default App;
