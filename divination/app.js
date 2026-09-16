/* GhostLab: Divination web app. Screens, storage, routing.
   Everything stays in this browser: localStorage only, no account, no server. */
(function () {
  "use strict";
  const GL = window.GL;
  const { Deck, Oracle, EightBall, RC, VR, SPREADS } = GL;
  const $ = (sel, root) => (root || document).querySelector(sel);
  const el = (tag, attrs, ...children) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") n.className = v; else if (k === "html") n.innerHTML = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
      else if (k === "dataset") Object.assign(n.dataset, v); else if (v === false || v == null) continue; else n.setAttribute(k, v === true ? "" : v);
    }
    for (const c of children.flat()) { if (c == null || c === false) continue; n.append(c.nodeType ? c : document.createTextNode(String(c))); }
    return n;
  };
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "id-" + Date.now() + "-" + Math.random().toString(16).slice(2));
  const fmtDate = (iso) => new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  const fmtTime = (iso) => new Date(iso).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });

  // ---------- Icons ----------
  const I = {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/></svg>',
    tarot: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="3" width="10" height="16" rx="2" transform="rotate(-8 12 11)"/><rect x="9" y="6" width="10" height="16" rx="2" transform="rotate(8 14 14)"/></svg>',
    oracle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/><circle cx="12" cy="12" r="3.2"/></svg>',
    ball: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><text x="12" y="14.6" font-size="7" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none">8</text></svg>',
    more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><circle cx="8" cy="12" r="0.6" fill="currentColor"/><circle cx="12" cy="12" r="0.6" fill="currentColor"/><circle cx="16" cy="12" r="0.6" fill="currentColor"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 6 6 6-6 6"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 6-6 6 6 6"/></svg>',
    close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg>',
    flask: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 3h6M10 3v6L4.5 19a1.5 1.5 0 0 0 1.3 2.2h12.4a1.5 1.5 0 0 0 1.3-2.2L14 9V3"/></svg>',
    wave: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M3 12h2l2-6 3 12 3-9 2 6 2-3h4"/></svg>',
    shuffle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 0 1 15.5-6.3L21 8M21 3v5h-5M21 12a9 9 0 0 1-15.5 6.3L3 16M3 21v-5h5"/></svg>',
    book: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h6a3 3 0 0 1 3 3v13a2 2 0 0 0-2-2H4zM20 4h-6a3 3 0 0 0-3 3v13a2 2 0 0 1 2-2h7z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3 4 6v6c0 5 3.5 8 8 9 4.5-1 8-4 8-9V6z"/><path d="m9 12 2 2 4-4"/></svg>',
    lens: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3"/><circle cx="12" cy="12" r="3.5"/></svg>',
    cap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m2 9 10-5 10 5-10 5z"/><path d="M6 11.5V16c0 1.5 3 3 6 3s6-1.5 6-3v-4.5"/></svg>',
    gear: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>',
    plus: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>',
    share: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12M8 7l4-4 4 4M5 13v6a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-6"/></svg>',
    trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
    sparkle: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l1.8 6.2L20 10l-6.2 1.8L12 18l-1.8-6.2L4 10l6.2-1.8z"/></svg>',
  };
  const svg = (name) => { const t = document.createElement("template"); t.innerHTML = I[name]; const n = t.content.firstChild; n.setAttribute("aria-hidden", "true"); n.setAttribute("focusable", "false"); return n; };

  // ---------- Storage ----------
  const KEY = "ghostlab.divination.v1";

  // ---------- Monetization ----------
  // AdSense uses the same publisher as AdMob. `slot` is a display unit's
  // data-ad-slot from AdSense > Ads > By ad unit. While it is empty no ad
  // markup is rendered and the AdSense script is never loaded.
  const ADS = { client: "ca-pub-7306834109695370", slot: "" };
  // Lemon Squeezy one-time unlock. `checkout` is the product's checkout URL;
  // `productId` pins a validated key to this product. Empty checkout hides the
  // buy button and leaves only the key field.
  const PRO = { price: "$4.99", checkout: "", productId: null, validateUrl: "https://api.lemonsqueezy.com/v1/licenses/validate", revalidateDays: 7 };
  const TOOLKIT = { appStore: "https://apps.apple.com/us/app/ghostlab-paranormal-toolkit/id6791637317", play: "https://play.google.com/store/apps/details?id=com.adkcyber.ghostlab" };
  const DEFAULTS = {
    settings: { reversalsOn: true, voice: "clinical", instrumentOn: false, showShuffleReceipt: true, sound: true, acceptedDisclaimerVersion: 0, didPickVoice: false, ballFinish: "classic", oracleDeck: "field" },
    dailies: {}, experiments: [], sittings: [], ball: { lastIndex: null, count: 0 },
    pro: { key: null, validatedAt: null },
  };
  let state;
  function load() {
    try { const raw = localStorage.getItem(KEY); state = raw ? JSON.parse(raw) : structuredClone(DEFAULTS); } catch (e) { state = structuredClone(DEFAULTS); }
    state.settings = Object.assign({}, DEFAULTS.settings, state.settings || {});
    for (const k of ["dailies", "experiments", "sittings", "ball", "pro"]) if (state[k] == null) state[k] = structuredClone(DEFAULTS[k]);
  }
  const isPro = () => !!(state.pro && state.pro.key);
  const adsWanted = () => !isPro() && !!ADS.slot;
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* private mode: keep going in memory */ } }
  const S = () => state.settings;

  // ---------- Router ----------
  const app = $("#app");
  let route = { tab: "home", sub: null, params: {} };
  const tabs = [["home", "Home", "home"], ["tarot", "Tarot", "tarot"], ["oracle", "Oracle", "oracle"], ["ball", "Eight Ball", "ball"], ["more", "More", "more"]];
  let ui = { tarotSection: "daily", codexFilter: "all", codexQuery: "", notesQuery: "", oracleView: "home", sittingDraft: null, experimentDraft: null, oracleDraft: null, moreView: "menu", learnChapter: null };
  function go(tab, sub, params) {
    route = { tab, sub: sub || null, params: params || {} };
    const hash = "#/" + tab + (sub ? "/" + sub : "");
    if (location.hash !== hash) history.pushState(null, "", hash);
    render();
    window.scrollTo({ top: 0 });
  }
  function fromHash() {
    const parts = (location.hash.replace(/^#\/?/, "") || "home").split("/");
    const tab = tabs.some((t) => t[0] === parts[0]) ? parts[0] : "home";
    route = { tab, sub: parts[1] || null, params: {} };
    if (tab === "tarot" && ["daily", "spreads", "codex", "notes"].includes(parts[1])) ui.tarotSection = parts[1];
    if (tab === "more" && parts[1]) ui.moreView = parts[1];
    render();
  }
  window.addEventListener("popstate", fromHash);

  // ---------- Shell ----------
  function render() {
    app.innerHTML = "";
    const screen = el("div", { class: "screen" });
    switch (route.tab) {
      case "home": screen.append(HomeScreen()); break;
      case "tarot": screen.append(TarotScreen()); break;
      case "oracle": screen.append(OracleScreen()); break;
      case "ball": screen.append(BallScreen()); break;
      case "more": screen.append(MoreScreen()); break;
    }
    app.append(screen, TabBar());
    syncAdSlot();
  }
  let adScriptLoaded = false;
  function ensureAdScript() {
    if (adScriptLoaded) return; adScriptLoaded = true;
    window.adsbygoogle = window.adsbygoogle || []; window.adsbygoogle.requestNonPersonalizedAds = 1;
    const s = document.createElement("script"); s.async = true; s.crossOrigin = "anonymous";
    s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}`; document.head.append(s);
  }
  // The banner is fixed to the bottom of the viewport, so it lives on the body
  // rather than inside #app and survives every re-render. render() wipes #app on
  // each tap, and a fresh ins there would mean a fresh ad request for picking a
  // voice or dealing again: one request per session is what Google expects.
  let adNode = null;
  function syncAdSlot() {
    if (!adsWanted()) { if (adNode) { adNode.remove(); adNode = null; } showAd(false); return; }
    if (adNode) return;
    ensureAdScript();
    const ins = el("ins", { class: "adsbygoogle", style: "display:block", "data-ad-client": ADS.client, "data-ad-slot": ADS.slot, "data-ad-format": "horizontal", "data-full-width-responsive": "false" });
    adNode = el("div", { class: "adslot empty", role: "complementary", "aria-label": "Advertisement" }, el("span", { class: "adlabel" }, "Ad"), ins);
    document.body.append(adNode);
    // The banner stays hidden until Google says it filled the slot. Added to the
    // Home Screen the app opens offline as often as not, and an empty labelled
    // box pinned over the tab bar — with the screen padded to clear it — is the
    // one thing an installed app must never show.
    new MutationObserver(() => showAd(ins.getAttribute("data-ad-status") === "filled"))
      .observe(ins, { attributes: true, attributeFilter: ["data-ad-status"] });
    requestAnimationFrame(() => { try { (window.adsbygoogle = window.adsbygoogle || []).push({}); } catch (e) { /* blocked or not yet approved */ } });
  }
  function showAd(on) {
    if (adNode) adNode.classList.toggle("empty", !on);
    document.body.classList.toggle("ads-on", !!on && !!adNode);
  }

  // ---------- Pro unlock (Lemon Squeezy license keys) ----------
  async function validateKey(key) {
    const res = await fetch(PRO.validateUrl, { method: "POST", headers: { Accept: "application/json" }, body: new URLSearchParams({ license_key: key }) });
    const j = await res.json();
    if (!j.valid) throw Object.assign(new Error(j.error || "That key is not valid."), { definitive: true });
    if (PRO.productId && j.meta && String(j.meta.product_id) !== String(PRO.productId)) throw Object.assign(new Error("That key belongs to a different product."), { definitive: true });
    if (j.license_key && ["disabled", "expired"].includes(j.license_key.status)) throw Object.assign(new Error("That key is no longer active."), { definitive: true });
    return j;
  }
  async function revalidateIfDue() {
    if (!isPro() || !navigator.onLine) return;
    const age = Date.now() - new Date(state.pro.validatedAt || 0).getTime();
    if (age < PRO.revalidateDays * 86400000) return;
    try { await validateKey(state.pro.key); state.pro.validatedAt = new Date().toISOString(); save(); }
    catch (e) { if (e.definitive) { state.pro = { key: null, validatedAt: null }; save(); render(); } }
  }
  function ProCard() {
    const box = el("div", { class: "panel pro-card" });
    const draw = () => {
      box.innerHTML = "";
      if (isPro()) {
        const k = state.pro.key; const masked = k.length > 8 ? k.slice(0, 4) + "\u2026" + k.slice(-4) : k;
        box.append(el("div", { class: "panel-head" }, el("div", { class: "glyph magenta" }, svg("shield")), el("div", {}, el("div", { class: "eyebrow magenta" }, "Pro"), el("h3", {}, "Pro is unlocked in this browser."))),
          el("p", { class: "muted small" }, "The ads are gone. Everything in the app was already yours. Keep your key: it unlocks Pro again on another device or after clearing site data."),
          el("div", { class: "row", style: "margin-top:12px" }, el("code", { class: "mono small grow" }, masked), el("button", { class: "btn btn-ghost btn-sm", onclick: () => { if (!confirm("Remove the key from this browser? You can enter it again any time.")) return; state.pro = { key: null, validatedAt: null }; save(); render(); } }, "Remove key")));
        return;
      }
      const input = el("input", { class: "input grow", type: "text", placeholder: "Paste your license key", autocomplete: "off", spellcheck: "false", "aria-label": "License key" });
      const status = el("p", { class: "small", style: "margin-top:8px;min-height:1.2em" });
      const unlock = el("button", { class: "btn btn-magenta btn-sm", onclick: async () => {
        const key = input.value.trim(); if (!key) { status.textContent = "Paste the key from your receipt first."; return; }
        unlock.disabled = true; status.style.color = ""; status.textContent = "Checking the key.";
        try { await validateKey(key); state.pro = { key, validatedAt: new Date().toISOString() }; save(); toast("Pro is unlocked."); render(); }
        catch (e) { status.style.color = "var(--danger)"; status.textContent = e.definitive ? e.message : "Could not reach the key server. Check your connection and try again."; unlock.disabled = false; }
      } }, "Unlock");
      box.append(el("div", { class: "panel-head" }, el("div", { class: "glyph magenta" }, svg("shield")), el("div", {}, el("div", { class: "eyebrow magenta" }, "Pro"), el("h3", {}, "Remove the ads"))),
        el("div", { class: "price" }, PRO.price, el("small", {}, "one time. Yours forever.")),
        el("p", { class: "muted small", style: "margin:6px 0 12px" }, "Every spread, every oracle set and the eight ball stay free with ads. Pro only takes the ads away. No subscription, no account."),
        PRO.checkout ? el("a", { class: "btn btn-primary btn-block", href: PRO.checkout, target: "_blank", rel: "noopener" }, "Remove the ads") : el("p", { class: "faint tiny" }, "Checkout opens soon. If you already have a key, enter it below."),
        el("div", { class: "label", style: "margin-top:14px" }, "Already have a key?"), el("div", { class: "key-row" }, input, unlock), status);
    };
    draw(); return box;
  }
  function ToolkitCard() {
    return el("div", { class: "panel toolkit-card" }, el("img", { src: "../assets/sphere/toolkit.png", alt: "", loading: "lazy" }),
      el("div", { class: "grow" }, el("div", { class: "eyebrow" }, "From GhostLab"), el("h3", {}, "Paranormal Toolkit"), el("p", { class: "muted small", style: "margin-top:3px" }, "The field kit for night hunts: EMF, EVP, spirit box, Spirit Speak, and SLS. Free on the App Store and Google Play."),
        el("div", { class: "badges" }, el("a", { class: "btn btn-outline btn-sm", href: TOOLKIT.appStore, target: "_blank", rel: "noopener" }, "App Store"), el("a", { class: "btn btn-outline btn-sm", href: TOOLKIT.play, target: "_blank", rel: "noopener" }, "Google Play"))));
  }
  function TabBar() {
    return el("nav", { class: "tabbar", "aria-label": "Sections" }, el("div", { class: "tabbar-inner" },
      tabs.map(([id, title, icon]) => el("button", { class: "tab" + (route.tab === id ? " on" : ""), "aria-current": route.tab === id ? "page" : null, onclick: () => go(id) }, svg(icon), title))));
  }
  let toastTimer;
  function toast(msg) { $(".toast")?.remove(); const t = el("div", { class: "toast", role: "status" }, msg); document.body.append(t); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.remove(), 2200); }
  function sheet(build) {
    const back = el("div", { class: "sheet-backdrop", onclick: (e) => { if (e.target === back) close(); } });
    const box = el("div", { class: "sheet", role: "dialog", "aria-modal": "true" }, el("div", { class: "grab" }));
    const close = () => { back.remove(); document.body.style.overflow = ""; };
    box.append(build(close)); back.append(box); document.body.append(back); document.body.style.overflow = "hidden";
    return close;
  }
  const pageHead = (eyebrow, title, lede, cls) => el("header", { class: "page-head" }, el("div", { class: "eyebrow " + (cls || "") }, eyebrow), el("h1", {}, title), lede ? el("p", { class: "lede" }, lede) : null);
  const backRow = (label, fn) => el("button", { class: "btn btn-ghost btn-sm", style: "margin-bottom:16px", onclick: fn }, svg("back"), label);

  // ---------- Card views ----------
  const cardImg = (card, thumb) => `cards/${thumb ? "t/" : ""}${card.imageAsset}`;
  function CardPlate(card, reversed, opts) {
    opts = opts || {};
    const p = el("div", { class: "card-plate" + (reversed && !card.isInstrument ? " reversed" : "") + (card.isInstrument ? " instrument" : "") + (opts.class ? " " + opts.class : "") },
      el("img", { src: cardImg(card, opts.thumb), alt: card.name + (reversed && !card.isInstrument ? ", reversed" : ""), loading: opts.eager ? "eager" : "lazy", decoding: "async" }));
    if (opts.badge) p.append(el("span", { class: "badge" }, opts.badge));
    return p;
  }
  const CardBack = (cls) => el("div", { class: "card-plate card-back " + (cls || "") }, el("img", { src: "cards/CardBack.webp", alt: "Card back", loading: "eager" }));
  function polarityText(card, reversed) { return VR.polarityLabel(card, reversed); }
  function openCardDetail(card, reversedInitial) {
    sheet((close) => {
      let reversed = !!reversedInitial && !card.isInstrument; let lens = "general";
      const box = el("div");
      const draw = () => {
        box.innerHTML = "";
        const suitCls = card.suit !== "none" ? "suit-" + card.suit : "";
        box.append(
          el("div", { class: "sheet-head" }, el("div", {}, el("div", { class: "eyebrow " + (card.isInstrument ? "magenta" : "") }, card.isInstrument ? "Lab arcana" : card.arcana === "major" ? `Major arcana · ${card.rankLabel || ""}` : `${GL.SUITS[card.suit].title} · ${card.rankLabel}`), el("h2", {}, card.name)),
            el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Close", onclick: close }, svg("close"))),
          el("div", { class: "detail-art" }, CardPlate(card, reversed, { eager: true })),
          el("div", { class: "stack" },
            !card.isInstrument ? el("div", { class: "seg" }, ["Upright", "Reversed"].map((t, i) => el("button", { class: (i === 1) === reversed ? "on" : "", onclick: () => { reversed = i === 1; draw(); } }, t))) : null,
            el("div", { class: "chips" }, [["general", "General"], ["love", "Love"], ["career", "Career"]].map(([id, t]) => el("button", { class: "chip" + (lens === id ? " on" : ""), onclick: () => { lens = id; draw(); } }, t))),
            el("div", { class: "panel" }, el("div", { class: "eyebrow" }, polarityText(card, reversed)), el("p", { class: "reading", style: "margin-top:8px" }, card.meaning(lens, reversed))),
            el("div", { class: "panel tight" }, el("div", { class: "label" }, "Keywords"), el("div", { class: "kw" }, card.keywords(reversed).map((k) => el("span", {}, k)))),
            card.core ? el("div", { class: "panel tight" }, el("div", { class: "label" }, "Essence"), el("p", { class: "muted small" }, card.core)) : null,
            el("div", { class: "panel tight" }, el("div", { class: "label" }, "On the plate"), el("p", { class: "muted small" }, card.imageDescription), el("p", { class: "faint tiny", style: "margin-top:8px" }, card.credit)),
            el("div", { class: "panel tight" }, el("div", { class: "label" }, "Lab note"), el("p", { class: ("muted small " + suitCls).trim() }, card.labNote)),
          ));
      };
      draw(); return box;
    });
  }
  function VoicePicker(current, onPick, tint) {
    const glyphFor = { mystic: "eye", clinical: "flask", skeptical: "wave" };
    return el("div", { class: "voices" }, GL.VOICES.map((v) => el("button", { class: "voice" + (current === v.id ? " on" : ""), onclick: () => onPick(v.id) },
      el("div", { class: "glyph" + (tint ? " " + tint : "") }, svg(glyphFor[v.id])), el("strong", {}, v.title), el("span", {}, v.blurb))));
  }
  function ReadingView(reading, opts) {
    opts = opts || {};
    const box = el("div", { class: "stack" });
    if (reading.leanLine) box.append(el("div", { class: "reading" }, el("div", { class: "lean" + (reading.leanLine.startsWith("Inconclusive") ? " magenta" : "") }, reading.leanLine)));
    box.append(el("div", { class: "reading" }, reading.narrativeParagraphs.map((p) => el("p", {}, p))));
    if (!opts.hidePlates && reading.plates.length) {
      box.append(el("div", { class: "hairline" }), el("div", { class: "plates" }, reading.plates.map((p) => {
        const card = Deck.card(p.cardId);
        return el("div", { class: "plate" }, card ? CardPlate(card, p.reversed, { thumb: true }) : el("div"),
          el("div", {}, el("div", { class: "pos" }, p.positionName), el("div", { class: "nm" }, p.cardName, el("small", {}, p.polarity)), el("div", { class: "tx" }, p.reading)));
      })));
    }
    box.append(el("div", { class: "footer-line" }, reading.footer));
    return box;
  }
  const Receipt = (code) => (code && S().showShuffleReceipt ? el("div", { class: "receipt" }, el("span", { class: "lbl" }, "RECEIPT"), el("b", {}, code.toUpperCase())) : null);
  function Energy(value, onPick) {
    return el("div", { class: "energy" }, GL.MOODS.map(([n, t]) => el("button", { class: value === n ? "on" : "", onclick: () => onPick(value === n ? null : n) }, t)));
  }
  async function shareText(title, text) {
    try { if (navigator.share) { await navigator.share({ title, text }); return; } } catch (e) { if (e && e.name === "AbortError") return; }
    try { await navigator.clipboard.writeText(text); toast("Copied to the clipboard."); } catch (e) { toast("Could not share on this device."); }
  }

  // ---------- Home ----------
  function HomeScreen() {
    const today = state.dailies[GL.dailyKey()];
    const fanIds = ["fool", "wheel-of-fortune", "world"].map((id) => Deck.card(id)).filter(Boolean);
    const oracleCard = Oracle.deck("field")?.cards[0];
    const f = EightBall.finish(S().ballFinish);
    return el("div", {},
      el("div", { class: "masthead" }, el("div", { class: "eyebrow", style: "letter-spacing:0.55em" }, "GhostLab"), el("div", { class: "wordmark" }, "Divination"), el("p", { class: "tag" }, "Three instruments for reflection.")),
      el("div", { class: "stack" },
        el("button", { class: "instrument", onclick: () => { ui.tarotSection = "daily"; go("tarot", "daily"); } },
          el("div", { class: "art" }, el("div", { class: "mini-fan" }, fanIds.map((c) => el("img", { src: cardImg(c, true), alt: "" })))),
          el("div", { class: "grow" }, el("h3", {}, "Tarot"), el("p", {}, "One daily pull, four spreads, and a codex of every card."), el("div", { class: "status" }, today ? "Pulled today" : "Today's pull is waiting")),
          el("span", { class: "chev" }, svg("chev"))),
        el("button", { class: "instrument oracle", onclick: () => go("oracle") },
          el("div", { class: "art" }, oracleCard ? el("img", { class: "oracle-mini", src: "oracle/" + oracleCard.imageAsset, alt: "" }) : null),
          el("div", { class: "grow" }, el("h3", {}, "Oracle"), el("p", {}, "Five field sets of thirty-six plates, read in the voice you choose.")),
          el("span", { class: "chev" }, svg("chev"))),
        el("button", { class: "instrument ball", onclick: () => go("ball") },
          el("div", { class: "art" }, el("div", { class: "ball-mini", style: `background: radial-gradient(circle at 32% 28%, ${f.shellLit}, ${f.shellMid} 55%, ${f.shellDeep})` }, el("span", {}, "8"))),
          el("div", { class: "grow" }, el("h3", {}, "Eight Ball"), el("p", {}, "Ask yes or no, then shake.")),
          el("span", { class: "chev" }, svg("chev")))),
      el("p", { class: "footer-line", style: "margin-top:26px" }, adsWanted() ? "Entertainment only. Everything here is free with ads." : "Entertainment only. Everything here is free."),
      InstallHint());
  }
  function InstallHint() {
    if (window.matchMedia("(display-mode: standalone)").matches || navigator.standalone) return null;
    const isIOS = /iP(hone|ad|od)/.test(navigator.userAgent);
    return el("div", { class: "install", style: "margin-top:18px" }, el("div", { class: "glyph" }, svg("plus")),
      el("div", {}, el("b", {}, "Put it on your Home Screen"), isIOS ? "Tap Share, then Add to Home Screen. It opens full screen and works offline." : "Use your browser's Install or Add to Home Screen option. It opens full screen and works offline."));
  }

  // ---------- Tarot ----------
  function TarotScreen() {
    const sections = [["daily", "Daily"], ["spreads", "Spreads"], ["codex", "Codex"], ["notes", "Notes"]];
    const box = el("div", {});
    box.append(el("div", { class: "section-row" }, sections.map(([id, t]) => el("button", { class: ui.tarotSection === id ? "on" : "", onclick: () => { ui.tarotSection = id; ui.experimentDraft = null; go("tarot", id); } }, t))));
    switch (ui.tarotSection) {
      case "daily": box.append(DailyView()); break;
      case "spreads": box.append(ui.experimentDraft ? ExperimentView() : SpreadsView()); break;
      case "codex": box.append(CodexView()); break;
      case "notes": box.append(NotesView()); break;
    }
    return box;
  }

  // Daily
  function DailyView() {
    const key = GL.dailyKey(); const record = state.dailies[key];
    const box = el("div", { class: "stack" });
    box.append(pageHead("Daily", "Today's pull", "One official pull per local calendar day."));
    if (!record) {
      let question = ""; let shuffled = null;
      const qField = el("textarea", { class: "input", placeholder: GL.DEFAULT_DAILY_Q, rows: 2, oninput: (e) => (question = e.target.value) });
      const status = el("p", { class: "muted small center" }, `Deck ready. ${S().instrumentOn ? 79 : 78} cards. Deal from the top.`);
      const back = el("div", { class: "hero-card card-flip" }, CardBack());
      const shuffleBtn = el("button", { class: "btn btn-outline btn-mono", onclick: () => { shuffled = GL.shuffle(Deck.bag(S().instrumentOn)); status.textContent = "Shuffled. Fisher-Yates over the browser's secure random source."; back.firstChild.style.transform = "rotateY(360deg)"; setTimeout(() => (back.firstChild.style.transform = ""), 700); pullBtn.disabled = false; } }, svg("shuffle"), "Shuffle");
      const pullBtn = el("button", { class: "btn btn-primary btn-mono", disabled: true, onclick: async () => {
        const bag = shuffled || GL.shuffle(Deck.bag(S().instrumentOn)); const cardId = bag[0]; const card = Deck.card(cardId);
        const reversed = S().reversalsOn && !card.isInstrument && GL.randomBit(); const now = new Date();
        const rec = { dailyKey: key, cardId, cardName: card.name, reversed, isCalibration: card.isInstrument, isInstrument: card.isInstrument, voice: S().voice,
          oneLiner: VR.oneLiner(card, reversed, S().voice), shuffleReceipt: await GL.receipt([cardId], [reversed], now), pulledAt: now.toISOString(), journalNote: "", mood: null,
          journalPrompt: GL.dailyPrompt(card, reversed), hypothesis: question.trim() || null };
        state.dailies[key] = rec; save(); render();
      } }, "Pull");
      box.append(
        el("div", { class: "panel" }, el("div", { class: "field" }, el("label", {}, "Question"), qField, el("div", { class: "hint" }, "Open questions work better than a forced yes or no. You keep the choice."))),
        back, status,
        el("div", { class: "row", style: "justify-content:center" }, shuffleBtn, pullBtn),
        el("p", { class: "footer-line" }, "One official daily per local calendar day. Extra sessions live on the Spreads tab."),
        StripView());
      return box;
    }
    const card = Deck.card(record.cardId) || Deck.instrument();
    let voice = record.voice || S().voice;
    const readingBox = el("div", { class: "panel" });
    const drawReading = () => { readingBox.innerHTML = ""; readingBox.append(el("div", { class: "panel-head" }, el("div", { class: "glyph" }, svg("eye")), el("h3", {}, "The reading")), ReadingView(RC.composeDaily(record, voice), { hidePlates: true })); };
    drawReading();
    const noteField = el("textarea", { class: "input", placeholder: "What landed.", rows: 3, oninput: (e) => { record.journalNote = e.target.value; save(); } }, record.journalNote || "");
    const energy = el("div"); const drawEnergy = () => { energy.innerHTML = ""; energy.append(Energy(record.mood, (m) => { record.mood = m; save(); drawEnergy(); })); }; drawEnergy();
    box.append(
      el("div", { class: "hero-card" }, CardPlate(card, record.reversed, { eager: true, badge: record.isCalibration ? "Calibration" : null })),
      el("div", { class: "center" }, el("div", { class: "eyebrow" }, polarityText(card, record.reversed)), el("h2", { style: "margin-top:4px" }, card.name), el("p", { class: "muted small", style: "margin-top:6px" }, record.oneLiner)),
      el("div", { class: "row wrap", style: "justify-content:center" }, Receipt(record.shuffleReceipt), el("button", { class: "btn btn-ghost btn-sm", onclick: () => openCardDetail(card, record.reversed) }, "Open in Codex")),
      el("div", { class: "panel tight" }, el("div", { class: "label" }, "Reader"), VoicePicker(voice, (v) => { voice = v; record.voice = v; save(); drawReading(); })),
      readingBox,
      el("div", { class: "panel" }, el("div", { class: "label" }, "Your note"), el("p", { class: "muted small", style: "margin-bottom:8px" }, record.journalPrompt), noteField, el("div", { class: "label", style: "margin-top:14px" }, "Energy"), energy),
      el("button", { class: "btn btn-ghost btn-block", onclick: () => shareText("GhostLab: Divination", `${card.name} (${polarityText(card, record.reversed)})\n\n${RC.composeDaily(record, voice).fullText}`) }, svg("share"), "Share the reading"),
      StripView());
    return box;
  }
  function StripView() {
    const days = []; const now = new Date();
    for (let i = 27; i >= 0; i--) { const d = new Date(now); d.setDate(now.getDate() - i); days.push(GL.dailyKey(d)); }
    return el("div", { class: "panel" }, el("div", { class: "panel-head" }, el("div", { class: "glyph" }, svg("wave")), el("div", {}, el("div", { class: "eyebrow" }, "Spectral"), el("h3", {}, "Last 28 days"))),
      el("p", { class: "muted small", style: "margin-bottom:10px" }, "Your own pulls, exactly as they fell."),
      el("div", { class: "strip" }, days.map((k) => { const r = state.dailies[k]; const c = r && Deck.card(r.cardId); let cls = ""; if (c) cls = c.isInstrument ? "lab" : c.arcana === "major" ? "major" : c.suit; return el("i", { class: cls + (r && r.reversed ? " rev" : ""), title: r ? `${k}: ${r.cardName}${r.reversed ? ", reversed" : ""}` : k }); })),
      el("div", { class: "legend" }, [["major", "Majors"], ["wands", "Wands"], ["cups", "Cups"], ["swords", "Swords"], ["pentacles", "Pentacles"], ["lab", "Instrument"]].map(([c, t]) => el("span", {}, el("i", { class: c, style: `background: var(--${c === "major" ? "accent" : c === "lab" ? "magenta" : c})` }), t))));
  }

  // Spreads
  function SpreadsView() {
    const box = el("div", { class: "stack" });
    box.append(pageHead("Protocols", "Spreads", "Four protocols: A or B, Yes or No, Relationship, and Career. Hypothesis, observation, interpretation, outcome."));
    for (const id of GL.VISIBLE_SPREADS) {
      const t = SPREADS[id];
      box.append(el("button", { class: "link-row", onclick: () => { ui.experimentDraft = { protocolId: id, question: "", voice: S().voice, dealt: null }; render(); } },
        el("div", { class: "glyph" }, el("b", { class: "mono" }, t.positions.length)), el("div", { class: "grow" }, el("div", { class: "t" }, t.name), el("div", { class: "s" }, t.subtitle)), el("span", { class: "chev" }, svg("chev"))));
    }
    return box;
  }
  function ExperimentView() {
    const d = ui.experimentDraft; const t = SPREADS[d.protocolId];
    const box = el("div", { class: "stack" });
    box.append(backRow("Spreads", () => { ui.experimentDraft = null; render(); }), pageHead("Experiment", t.name, t.subtitle));
    if (!d.dealt) {
      let shuffled = null;
      const qField = el("textarea", { class: "input", placeholder: "What do I need to understand about this?", rows: 2, oninput: (e) => (d.question = e.target.value) }, d.question);
      const status = el("p", { class: "muted small center" }, `Deck ready. ${S().instrumentOn ? 79 : 78} cards. ${t.positions.length} seats.`);
      const dealBtn = el("button", { class: "btn btn-primary btn-mono", disabled: true, onclick: async () => {
        const bag = shuffled || GL.shuffle(Deck.bag(S().instrumentOn)); const now = new Date();
        const draws = t.positions.map((p, i) => { const card = Deck.card(bag[i]); return { positionIndex: p.index, positionName: p.name, cardId: card.id, reversed: S().reversalsOn && !card.isInstrument && GL.randomBit() }; });
        d.dealt = { draws, receipt: await GL.receipt(draws.map((x) => x.cardId), draws.map((x) => x.reversed), now), at: now.toISOString(), note: "", mood: null, saved: false };
        render();
      } }, "Deal");
      const shuffleBtn = el("button", { class: "btn btn-outline btn-mono", onclick: () => { shuffled = GL.shuffle(Deck.bag(S().instrumentOn)); status.textContent = "Shuffled. Deal when you are ready."; dealBtn.disabled = false; } }, svg("shuffle"), "Shuffle");
      box.append(
        el("div", { class: "panel" }, el("div", { class: "eyebrow faint", style: "margin-bottom:10px" }, "Hypothesis · Protocol · Observation · Interpretation · Outcome"),
          el("div", { class: "field" }, el("label", {}, "Hypothesis"), qField, el("div", { class: "hint" }, "Open questions work better than a forced yes or no. You keep the choice.")),
          el("div", { class: "label", style: "margin-top:14px" }, "Reader"), VoicePicker(d.voice, (v) => { d.voice = v; render(); })),
        el("div", { class: "panel tight" }, el("div", { class: "label" }, "Seats"), el("div", { class: "stack-sm" }, t.positions.map((p) => el("div", { class: "row" }, el("span", { class: "mono tiny", style: "color:var(--accent);width:22px" }, String(p.index + 1).padStart(2, "0")), el("div", {}, el("b", { class: "small" }, p.name), el("span", { class: "muted tiny" }, " " + p.prompt)))))),
        el("div", { class: "table cols-" + t.positions.length }, t.positions.map((p, i) => el("div", { class: "seat", style: `animation-delay:${i * 60}ms` }, CardBack(), el("div", { class: "name" }, p.name)))),
        status, el("div", { class: "row", style: "justify-content:center" }, shuffleBtn, dealBtn));
      return box;
    }
    const exp = { question: d.question, protocolId: d.protocolId, protocolName: t.name, draws: d.dealt.draws, voice: d.voice };
    const readingBox = el("div", { class: "panel" });
    const drawReading = () => { readingBox.innerHTML = ""; readingBox.append(el("div", { class: "panel-head" }, el("div", { class: "glyph" }, svg("eye")), el("h3", {}, "The reading")), ReadingView(RC.compose({ ...exp, voice: d.voice }))); };
    drawReading();
    const saveBtn = el("button", { class: "btn btn-primary btn-block", onclick: () => {
      if (d.dealt.saved) return;
      const reading = RC.compose({ ...exp, voice: d.voice });
      state.experiments.unshift({ id: uuid(), createdAt: d.dealt.at, dailyKey: null, hypothesis: d.question.trim(), protocolId: d.protocolId, protocolName: t.name, voice: d.voice, reversalsOn: S().reversalsOn, instrumentOn: S().instrumentOn,
        draws: d.dealt.draws, userInterpretation: d.dealt.note, composedReading: reading.fullText, tags: [], mood: d.dealt.mood, shuffleReceipt: d.dealt.receipt });
      d.dealt.saved = true; save(); toast("Saved to Notes."); saveBtn.textContent = "Saved"; saveBtn.disabled = true;
    } }, d.dealt.saved ? "Saved" : "Save to Notes");
    if (d.dealt.saved) saveBtn.disabled = true;
    const energy = el("div"); const drawEnergy = () => { energy.innerHTML = ""; energy.append(Energy(d.dealt.mood, (m) => { d.dealt.mood = m; drawEnergy(); })); }; drawEnergy();
    box.append(
      el("div", { class: "table cols-" + t.positions.length }, d.dealt.draws.map((dr, i) => { const c = Deck.card(dr.cardId); return el("div", { class: "seat", style: `animation-delay:${i * 90}ms` }, el("button", { class: "codex-item", onclick: () => openCardDetail(c, dr.reversed) }, CardPlate(c, dr.reversed, { thumb: t.positions.length > 3 })), el("div", { class: "name" }, dr.positionName), el("div", { class: "card-name" }, c.name, " ", el("small", {}, polarityText(c, dr.reversed)))); })),
      el("div", { class: "row wrap", style: "justify-content:center" }, Receipt(d.dealt.receipt)),
      el("div", { class: "panel tight" }, el("div", { class: "label" }, "Reader"), VoicePicker(d.voice, (v) => { d.voice = v; drawReading(); })),
      readingBox,
      el("div", { class: "panel" }, el("div", { class: "label" }, "Your note"), el("p", { class: "muted small", style: "margin-bottom:8px" }, "Optional. Your private note under the reading."), el("textarea", { class: "input", rows: 3, placeholder: "What landed.", oninput: (e) => (d.dealt.note = e.target.value) }, d.dealt.note), el("div", { class: "label", style: "margin-top:14px" }, "Energy"), energy),
      saveBtn,
      el("div", { class: "row" }, el("button", { class: "btn btn-ghost grow", onclick: () => shareText("GhostLab: Divination", RC.compose({ ...exp, voice: d.voice }).fullText) }, svg("share"), "Share"), el("button", { class: "btn btn-ghost grow", onclick: () => { d.dealt = null; render(); } }, "Deal again")));
    return box;
  }

  // Codex
  function CodexView() {
    const box = el("div", { class: "stack" });
    box.append(pageHead("Field deck", "Codex", `${Deck.all.length} cards. Every meaning, three lenses, and the plate itself.`));
    const grid = el("div", { class: "codex-grid" });
    const drawGrid = () => {
      grid.innerHTML = "";
      const cards = Deck.cards(ui.codexFilter, ui.codexQuery);
      if (!cards.length) grid.append(el("div", { class: "empty", style: "grid-column:1/-1" }, "No card matches that."));
      for (const c of cards) grid.append(el("button", { class: "codex-item", onclick: () => openCardDetail(c, false) }, CardPlate(c, false, { thumb: true }), el("div", { class: "nm" }, el("b", {}, c.name), c.isInstrument ? "Lab" : c.arcana === "major" ? c.rankLabel : GL.SUITS[c.suit].title)));
    };
    const filters = [["all", "All"], ["majors", "Majors"], ["wands", "Wands"], ["cups", "Cups"], ["swords", "Swords"], ["pentacles", "Pentacles"], ["lab", "Lab"]];
    const chips = el("div", { class: "chips" });
    const drawChips = () => { chips.innerHTML = ""; for (const [id, t] of filters) chips.append(el("button", { class: "chip" + (ui.codexFilter === id ? " on" : ""), onclick: () => { ui.codexFilter = id; drawChips(); drawGrid(); } }, t)); };
    drawChips(); drawGrid();
    box.append(el("div", { class: "search" }, svg("search"), el("input", { class: "input", type: "search", placeholder: "Search cards, keywords, meanings", value: ui.codexQuery, oninput: (e) => { ui.codexQuery = e.target.value; drawGrid(); } })), chips, grid,
      el("p", { class: "footer-line" }, GL.SMITH_CREDIT));
    return box;
  }

  // Notes
  function NotesView() {
    const box = el("div", { class: "stack" });
    box.append(pageHead("Journal", "Notes", "Session notes stay on this device. No account. No cloud."));
    const list = el("div", { class: "stack-sm" });
    const drawList = () => {
      list.innerHTML = "";
      const q = ui.notesQuery.trim().toLowerCase();
      const items = [
        ...Object.values(state.dailies).map((r) => ({ kind: "daily", at: r.pulledAt, rec: r })),
        ...state.experiments.map((e) => ({ kind: "exp", at: e.createdAt, rec: e })),
      ].sort((a, b) => new Date(b.at) - new Date(a.at)).filter((it) => {
        if (!q) return true; const r = it.rec; const names = (it.kind === "daily" ? [r.cardName] : r.draws.map((d) => Deck.card(d.cardId)?.name)).join(" ");
        return [r.hypothesis, r.protocolName, r.journalNote, r.userInterpretation, r.composedReading, names].filter(Boolean).join(" ").toLowerCase().includes(q);
      });
      if (!items.length) { list.append(el("div", { class: "empty" }, "No experiments yet. Pull a daily or run a protocol.")); return; }
      for (const it of items) {
        const r = it.rec; const draws = it.kind === "daily" ? [{ cardId: r.cardId, reversed: r.reversed }] : r.draws;
        list.append(el("button", { class: "note-item", onclick: () => openNote(it) },
          el("div", { class: "thumbs" }, draws.slice(0, 3).map((d) => { const c = Deck.card(d.cardId); return c ? CardPlate(c, d.reversed, { thumb: true }) : null; })),
          el("div", { class: "grow" }, el("div", { class: "k" }, it.kind === "daily" ? (r.isCalibration ? "Calibration" : "Daily") : r.protocolName), el("div", { class: "t" }, it.kind === "daily" ? r.cardName + (r.reversed ? ", reversed" : "") : (r.hypothesis || "No question set")), el("div", { class: "s" }, fmtDate(it.at) + " · " + fmtTime(it.at) + (r.mood ? " · " + GL.MOODS.find((m) => m[0] === r.mood)[1] : ""))),
          el("span", { class: "chev" }, svg("chev"))));
      }
    };
    drawList();
    box.append(el("div", { class: "search" }, svg("search"), el("input", { class: "input", type: "search", placeholder: "Search notes, cards, questions", value: ui.notesQuery, oninput: (e) => { ui.notesQuery = e.target.value; drawList(); } })), list);
    return box;
  }
  function openNote(it) {
    sheet((close) => {
      const r = it.rec; const isDaily = it.kind === "daily";
      const reading = isDaily ? RC.composeDaily(r) : RC.compose({ question: r.hypothesis, protocolId: r.protocolId, protocolName: r.protocolName, draws: r.draws, voice: r.voice });
      const draws = isDaily ? [{ cardId: r.cardId, reversed: r.reversed, positionName: "The Observation" }] : r.draws;
      const noteText = isDaily ? r.journalNote : r.userInterpretation;
      return el("div", { class: "stack" },
        el("div", { class: "sheet-head" }, el("div", {}, el("div", { class: "eyebrow" }, isDaily ? (r.isCalibration ? "Calibration" : "Daily pull") : r.protocolName), el("h2", {}, isDaily ? r.cardName : (r.hypothesis || "No question set")), el("p", { class: "muted small" }, fmtDate(it.at) + " · " + fmtTime(it.at) + " · " + GL.voice(r.voice).title)), el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Close", onclick: close }, svg("close"))),
        el("div", { class: "table cols-" + Math.min(draws.length, 7) + (draws.length === 1 ? "" : "") }, draws.map((d) => { const c = Deck.card(d.cardId); return el("div", { class: "seat" }, el("button", { class: "codex-item", onclick: () => openCardDetail(c, d.reversed) }, CardPlate(c, d.reversed, { thumb: draws.length > 1 })), el("div", { class: "name" }, d.positionName), el("div", { class: "card-name" }, c.name, " ", el("small", {}, polarityText(c, d.reversed)))); })),
        el("div", { class: "row wrap", style: "justify-content:center" }, Receipt(r.shuffleReceipt)),
        noteText ? el("div", { class: "panel tight" }, el("div", { class: "label" }, "Your note"), el("p", { class: "muted" }, noteText)) : null,
        el("div", { class: "panel" }, ReadingView(reading)),
        el("div", { class: "row" }, el("button", { class: "btn btn-ghost grow", onclick: () => shareText("GhostLab: Divination", reading.fullText) }, svg("share"), "Share"),
          el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Delete", onclick: () => { if (!confirm("Delete this note? It only exists on this device.")) return; if (isDaily) delete state.dailies[r.dailyKey]; else state.experiments = state.experiments.filter((e) => e.id !== r.id); save(); close(); render(); } }, svg("trash"))));
    });
  }

  // ---------- Oracle ----------
  const plateImg = (c) => "oracle/" + c.imageAsset;
  function OraclePlate(c, opts) {
    opts = opts || {};
    return el("div", { class: "oracle-plate" + (opts.class ? " " + opts.class : "") }, el("img", { src: plateImg(c), alt: c.name, loading: opts.eager ? "eager" : "lazy", decoding: "async" }), opts.caption !== false ? el("div", { class: "cap" }, c.name, el("small", {}, c.keyword)) : null);
  }
  const OracleBack = () => el("div", { class: "oracle-plate back" }, svg("oracle"));
  function openPlateDetail(c) {
    sheet((close) => el("div", { class: "stack" },
      el("div", { class: "sheet-head" }, el("div", {}, el("div", { class: "eyebrow violet" }, Oracle.deck(c.deckId).name + " · " + c.keyword), el("h2", {}, c.name)), el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Close", onclick: close }, svg("close"))),
      el("div", { class: "detail-art" }, OraclePlate(c, { eager: true, caption: false })),
      el("div", { class: "panel" }, el("p", { class: "reading" }, c.meaningCore)),
      c.meaningReversed ? el("div", { class: "panel tight" }, el("div", { class: "label" }, "When it lands the other way"), el("p", { class: "muted small" }, c.meaningReversed)) : null,
      el("div", { class: "panel tight" }, el("div", { class: "label" }, "Lab note"), el("p", { class: "muted small" }, c.labNote))));
  }
  function OracleScreen() {
    if (ui.oracleDraft) return OracleSession();
    if (ui.oracleView === "catalog") return OracleCatalog();
    if (ui.oracleView === "notes") return OracleNotes();
    const box = el("div", { class: "stack" });
    box.append(pageHead("GhostLab", "Oracle", Oracle.copy.tagline, "violet"));
    const featured = Oracle.deck("field");
    box.append(el("div", { class: "eyebrow violet" }, "Start here"));
    for (const d of Oracle.decks) {
      const on = S().oracleDeck === d.id;
      box.append(el("button", { class: "deck-card" + (on ? " on" : ""), onclick: () => { S().oracleDeck = d.id; save(); ui.oracleDraft = { deckId: d.id, three: true, question: "", voice: S().voice, dealt: null }; render(); } },
        el("div", { class: "fan" }, d.cards.slice(0, 3).map((c) => el("img", { src: plateImg(c), alt: "", loading: "lazy" }))),
        el("div", { class: "grow" }, el("h3", {}, d.name), el("p", {}, d.tagline), el("div", { class: "n" }, `${d.cards.length} plates` + (d === featured ? " · the method set" : ""))),
        el("span", { class: "chev", style: "color:var(--faint)" }, svg("chev"))));
    }
    box.append(el("p", { class: "muted small" }, Oracle.copy.catalogBlurb),
      el("button", { class: "link-row", onclick: () => { ui.oracleView = "catalog"; render(); } }, el("div", { class: "glyph magenta" }, svg("book")), el("div", { class: "grow" }, el("div", { class: "t" }, "The catalog"), el("div", { class: "s" }, "Every plate in every set, with its meaning.")), el("span", { class: "chev" }, svg("chev"))),
      el("button", { class: "link-row", onclick: () => { ui.oracleView = "notes"; render(); } }, el("div", { class: "glyph magenta" }, svg("book")), el("div", { class: "grow" }, el("div", { class: "t" }, "Notes"), el("div", { class: "s" }, "Saved readings, on this device.")), el("span", { class: "chev" }, svg("chev"))),
      el("p", { class: "footer-line" }, Oracle.copy.footer));
    return box;
  }
  function OracleCatalog() {
    const box = el("div", { class: "stack" });
    let deckId = S().oracleDeck; let q = "";
    box.append(backRow("Oracle", () => { ui.oracleView = "home"; render(); }), pageHead("Catalog", "The plates", "Tap any plate to read it on its own.", "violet"));
    const chips = el("div", { class: "chips" }); const grid = el("div", { class: "plate-grid" }); const blurb = el("p", { class: "muted small" });
    const draw = () => {
      chips.innerHTML = ""; for (const d of Oracle.decks) chips.append(el("button", { class: "chip" + (deckId === d.id ? " on magenta" : ""), onclick: () => { deckId = d.id; draw(); } }, d.name));
      const d = Oracle.deck(deckId); blurb.textContent = d.notes.join(" ");
      grid.innerHTML = ""; const cards = d.cards.filter((c) => c.matches(q));
      if (!cards.length) grid.append(el("div", { class: "empty", style: "grid-column:1/-1" }, "No plate matches that."));
      for (const c of cards) grid.append(el("button", { class: "codex-item", onclick: () => openPlateDetail(c) }, OraclePlate(c)));
    };
    draw();
    box.append(chips, blurb, el("div", { class: "search" }, svg("search"), el("input", { class: "input", type: "search", placeholder: "Search plates", oninput: (e) => { q = e.target.value; draw(); } })), grid);
    return box;
  }
  function OracleSession() {
    const d = ui.oracleDraft; const deck = Oracle.deck(d.deckId);
    const box = el("div", { class: "stack" });
    box.append(backRow("Oracle", () => { ui.oracleDraft = null; render(); }), pageHead(deck.name, d.dealt ? "Your reading" : "A reading", deck.tagline, "violet"));
    if (!d.dealt) {
      let shuffled = null;
      const positions = () => Oracle.positions(d.three);
      const status = el("p", { class: "muted small center" }, `${deck.cards.length} plates in the set.`);
      const table = el("div", { class: "table cols-" + (d.three ? 3 : 1) }); const drawTable = () => { table.innerHTML = ""; positions().forEach(([i, name]) => table.append(el("div", { class: "seat", style: `animation-delay:${i * 60}ms` }, OracleBack(), el("div", { class: "name" }, name)))); };
      drawTable();
      const dealBtn = el("button", { class: "btn btn-primary btn-mono", disabled: true, onclick: async () => {
        const bag = shuffled || GL.shuffle(Oracle.bag(d.deckId)); const now = new Date();
        const draws = positions().map(([i, name]) => { const c = Oracle.card(bag[i]); return { positionIndex: i, positionName: name, cardId: c.id, reversed: S().reversalsOn && c.allowsReversal && GL.randomBit() }; });
        d.dealt = { draws, receipt: await GL.receipt(draws.map((x) => x.cardId), draws.map((x) => x.reversed), now), at: now.toISOString(), note: "", saved: false }; render();
      } }, "Deal");
      const shuffleBtn = el("button", { class: "btn btn-outline btn-mono", onclick: () => { shuffled = GL.shuffle(Oracle.bag(d.deckId)); status.textContent = "Shuffled. Deal when you are ready."; dealBtn.disabled = false; } }, svg("shuffle"), "Shuffle");
      box.append(
        el("div", { class: "panel" },
          el("div", { class: "field" }, el("label", {}, "Your question"), el("textarea", { class: "input", rows: 2, placeholder: Oracle.copy.defaultHypothesis, oninput: (e) => (d.question = e.target.value) }, d.question), el("div", { class: "hint" }, Oracle.copy.hypothesisHint)),
          el("div", { class: "label", style: "margin-top:14px" }, "How many"), el("div", { class: "seg" }, [[false, "1 plate"], [true, "3 plates"]].map(([three, t]) => el("button", { class: d.three === three ? "on" : "", onclick: () => { d.three = three; shuffled = null; dealBtn.disabled = true; drawTable(); table.className = "table cols-" + (three ? 3 : 1); $$seg(); } }, t))),
          el("div", { class: "label", style: "margin-top:14px" }, "Reader"), el("p", { class: "muted tiny", style: "margin-bottom:8px" }, "Three ways of saying the same plates."), VoicePicker(d.voice, (v) => { d.voice = v; render(); }, "magenta")),
        table, status, el("div", { class: "row", style: "justify-content:center" }, shuffleBtn, dealBtn));
      const $$seg = () => { box.querySelectorAll(".seg button").forEach((b, i) => b.classList.toggle("on", (i === 1) === d.three)); };
      return box;
    }
    const sitting = { hypothesis: d.question, deckId: d.deckId, voice: d.voice, draws: d.dealt.draws };
    const readingBox = el("div", { class: "panel" });
    const drawReading = () => {
      readingBox.innerHTML = ""; const blocks = Oracle.compose(sitting, d.voice);
      readingBox.append(el("div", { class: "panel-head" }, el("div", { class: "glyph magenta" }, svg("eye")), el("h3", {}, "Your reading")),
        el("div", { class: "oracle-reading" }, blocks.map((b) => b.type === "seat" ? el("p", {}, el("span", { class: "seat-lead" }, b.lead), el("br"), b.body) : el("p", { class: b.type === "asked" ? "asked" : "" }, b.text))),
        el("div", { class: "footer-line" }, Oracle.copy.entertainmentLine));
    };
    drawReading();
    const saveBtn = el("button", { class: "btn btn-primary btn-block", disabled: d.dealt.saved, onclick: () => {
      if (d.dealt.saved) return;
      state.sittings.unshift({ id: uuid(), createdAt: d.dealt.at, hypothesis: d.question.trim(), deckId: d.deckId, protocolId: d.three ? "three" : "observation", protocolName: d.three ? "3 plates" : "1 plate", voice: d.voice, reversalsOn: S().reversalsOn, draws: d.dealt.draws, userNote: d.dealt.note, composedReading: Oracle.blocksToText(Oracle.compose(sitting, d.voice)), shuffleReceipt: d.dealt.receipt });
      d.dealt.saved = true; save(); toast("Saved to Notes."); saveBtn.textContent = "Saved"; saveBtn.disabled = true;
    } }, d.dealt.saved ? "Saved" : "Save");
    box.append(
      el("div", { class: "table cols-" + (d.three ? 3 : 1) }, d.dealt.draws.map((dr, i) => { const c = Oracle.card(dr.cardId); return el("div", { class: "seat", style: `animation-delay:${i * 90}ms` }, el("button", { class: "codex-item", onclick: () => openPlateDetail(c) }, OraclePlate(c, { eager: true })), el("div", { class: "name" }, dr.positionName)); })),
      el("div", { class: "row wrap", style: "justify-content:center" }, Receipt(d.dealt.receipt)),
      el("div", { class: "panel tight" }, el("div", { class: "label" }, "Reader"), VoicePicker(d.voice, (v) => { d.voice = v; drawReading(); }, "magenta")),
      readingBox,
      el("div", { class: "panel" }, el("div", { class: "label" }, "Your note"), el("textarea", { class: "input", rows: 3, placeholder: "What landed.", oninput: (e) => (d.dealt.note = e.target.value) }, d.dealt.note)),
      saveBtn,
      el("div", { class: "row" }, el("button", { class: "btn btn-ghost grow", onclick: () => shareText("GhostLab: Divination", Oracle.blocksToText(Oracle.compose(sitting, d.voice))) }, svg("share"), "Share"), el("button", { class: "btn btn-ghost grow", onclick: () => { d.dealt = null; render(); } }, "Deal again")));
    return box;
  }
  function OracleNotes() {
    const box = el("div", { class: "stack" });
    box.append(backRow("Oracle", () => { ui.oracleView = "home"; render(); }), pageHead("Journal", "Notes", Oracle.copy.notesEmpty, "violet"));
    if (!state.sittings.length) { box.append(el("div", { class: "empty" }, "No readings saved yet.")); return box; }
    for (const s of state.sittings) {
      box.append(el("button", { class: "note-item", onclick: () => sheet((close) => {
        const blocks = Oracle.compose(s);
        return el("div", { class: "stack" },
          el("div", { class: "sheet-head" }, el("div", {}, el("div", { class: "eyebrow violet" }, Oracle.deck(s.deckId)?.name + " · " + s.protocolName), el("h2", {}, s.hypothesis || "No question set"), el("p", { class: "muted small" }, fmtDate(s.createdAt) + " · " + fmtTime(s.createdAt))), el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Close", onclick: close }, svg("close"))),
          el("div", { class: "table cols-" + s.draws.length }, s.draws.map((dr) => { const c = Oracle.card(dr.cardId); return el("div", { class: "seat" }, el("button", { class: "codex-item", onclick: () => openPlateDetail(c) }, OraclePlate(c)), el("div", { class: "name" }, dr.positionName)); })),
          s.userNote ? el("div", { class: "panel tight" }, el("div", { class: "label" }, "Your note"), el("p", { class: "muted" }, s.userNote)) : null,
          el("div", { class: "panel" }, el("div", { class: "oracle-reading" }, blocks.map((b) => b.type === "seat" ? el("p", {}, el("span", { class: "seat-lead" }, b.lead), el("br"), b.body) : el("p", { class: b.type === "asked" ? "asked" : "" }, b.text)))),
          el("div", { class: "row" }, el("button", { class: "btn btn-ghost grow", onclick: () => shareText("GhostLab: Divination", Oracle.blocksToText(blocks)) }, svg("share"), "Share"),
            el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Delete", onclick: () => { if (!confirm("Delete this reading? It only exists on this device.")) return; state.sittings = state.sittings.filter((x) => x.id !== s.id); save(); close(); render(); } }, svg("trash"))));
      }) },
        el("div", { class: "thumbs" }, s.draws.slice(0, 3).map((dr) => { const c = Oracle.card(dr.cardId); return c ? el("div", { class: "card-plate" }, el("img", { src: plateImg(c), alt: "", loading: "lazy" })) : null; })),
        el("div", { class: "grow" }, el("div", { class: "k", style: "color:var(--violet)" }, Oracle.deck(s.deckId)?.name), el("div", { class: "t" }, s.hypothesis || "No question set"), el("div", { class: "s" }, fmtDate(s.createdAt) + " · " + s.protocolName)),
        el("span", { class: "chev" }, svg("chev"))));
    }
    return box;
  }

  // ---------- Eight Ball ----------
  let audioCtx = null; const audioBuf = {};
  async function playSound(name) {
    if (!S().sound) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      if (audioCtx.state === "suspended") await audioCtx.resume();
      if (!audioBuf[name]) { const r = await fetch(`audio/${name}.wav`); audioBuf[name] = await audioCtx.decodeAudioData(await r.arrayBuffer()); }
      const src = audioCtx.createBufferSource(); src.buffer = audioBuf[name]; src.connect(audioCtx.destination); src.start();
    } catch (e) { /* no sound is fine */ }
  }
  let shakeArmed = false; let lastShake = 0; let ballBusy = false;
  function BallScreen() {
    const f = EightBall.finish(S().ballFinish);
    const box = el("div", { class: "stack" });
    box.append(pageHead("GhostLab", "Eight Ball", EightBall.copy.tagline));
    const ball = el("div", { class: "eightball", role: "button", tabindex: "0", "aria-label": "Eight ball. " + EightBall.copy.ballHint });
    const applyFinish = (fin) => { ball.style.setProperty("--shell-lit", fin.shellLit); ball.style.setProperty("--shell-mid", fin.shellMid); ball.style.setProperty("--shell-deep", fin.shellDeep); ball.style.setProperty("--rim-line", fin.rim); ball.style.setProperty("--rim-glow", fin.rim.replace("rgb(", "rgba(").replace(")", ", 0.18").replace("#3dffa8", "rgba(61,255,168,0.18)").replace("#c759f2", "rgba(199,89,242,0.18)")); ball.style.setProperty("--liquid-glow", fin.liquidGlow); ball.style.setProperty("--liquid-mid", fin.liquidMid); ball.style.setProperty("--liquid-deep", fin.liquidDeep); };
    applyFinish(f);
    const eight = el("div", { class: "eight" }, el("span", {}, "8"));
    const die = el("div", { class: "die" });
    const win = el("div", { class: "window" }, eight, die);
    ball.append(win);
    const answerBox = el("div", { class: "face-reads" }, el("div", { class: "eyebrow faint" }, "Ask, then shake"), el("p", { class: "muted small" }, EightBall.copy.holdTheQuestion));
    const drawDie = (text, fin) => {
      const lines = EightBall.lines(text); const n = lines.length; const fs = n === 1 ? 11 : n === 2 ? 9.5 : 8.5; const start = 58 - (n - 1) * 5.5;
      die.innerHTML = `<svg viewBox="0 0 100 92"><defs><linearGradient id="dg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${fin.dieLit}"/><stop offset="0.55" stop-color="${fin.die}"/><stop offset="1" stop-color="${fin.dieDeep}"/></linearGradient></defs><polygon points="50,4 96,86 4,86" fill="url(#dg)" stroke="rgba(255,255,255,0.18)" stroke-width="1"/>${lines.map((l, i) => `<text x="50" y="${start + i * 11}" font-size="${fs}">${esc(l)}</text>`).join("")}</svg>`;
    };
    if (state.ball.lastIndex != null && state.ball.lastText) { drawDie(state.ball.lastText, f); eight.classList.add("off"); die.classList.add("up"); answerBox.innerHTML = ""; answerBox.append(el("div", { class: "eyebrow" }, EightBall.copy.faceReads), el("p", { class: "ans" }, state.ball.lastText), el("p", { class: "muted tiny", style: "margin-top:6px" }, EightBall.copy.settledHint)); }
    const shake = async () => {
      if (ballBusy) return; ballBusy = true;
      const fin = EightBall.finish(S().ballFinish);
      ball.classList.remove("shaking"); void ball.offsetWidth; ball.classList.add("shaking"); playSound("chamber_slosh");
      die.classList.remove("up"); eight.classList.add("off");
      answerBox.innerHTML = ""; answerBox.append(el("div", { class: "eyebrow faint" }, EightBall.copy.turning));
      if (navigator.vibrate) navigator.vibrate([20, 40, 20]);
      await new Promise((r) => setTimeout(r, 900));
      const pick = EightBall.pick(state.ball.lastIndex, fin.id);
      drawDie(pick.text, fin); void die.offsetWidth; die.classList.add("up");
      answerBox.innerHTML = ""; answerBox.append(el("div", { class: "eyebrow faint" }, EightBall.copy.rising));
      await new Promise((r) => setTimeout(r, 900)); playSound("chamber_settle");
      state.ball.lastIndex = pick.index; state.ball.lastText = pick.text; state.ball.count = (state.ball.count || 0) + 1; save();
      answerBox.innerHTML = ""; answerBox.append(el("div", { class: "eyebrow" }, EightBall.copy.faceReads), el("p", { class: "ans" }, pick.text), el("p", { class: "muted tiny", style: "margin-top:6px" }, EightBall.copy.settledHint));
      ballBusy = false;
    };
    ball.addEventListener("click", shake); ball.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); shake(); } });
    // Shake detection
    const onMotion = (e) => { const a = e.accelerationIncludingGravity; if (!a) return; const mag = Math.sqrt(a.x * a.x + a.y * a.y + a.z * a.z); const now = Date.now(); if (mag > 22 && now - lastShake > 1600 && route.tab === "ball") { lastShake = now; shake(); } };
    const armShake = async () => {
      try { if (typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function") { const res = await DeviceMotionEvent.requestPermission(); if (res !== "granted") { toast("Shake is off. Tap the ball instead."); return; } } } catch (e) { toast("Shake is off. Tap the ball instead."); return; }
      if (!shakeArmed) { window.addEventListener("devicemotion", onMotion); shakeArmed = true; } shakeBtn.hidden = true; toast("Shake is on.");
    };
    const needsPermission = typeof DeviceMotionEvent !== "undefined" && typeof DeviceMotionEvent.requestPermission === "function";
    const shakeBtn = el("button", { class: "btn btn-ghost btn-sm", onclick: armShake, hidden: shakeArmed || !("DeviceMotionEvent" in window) }, "Turn on shake");
    if (!needsPermission && "DeviceMotionEvent" in window && !shakeArmed) { window.addEventListener("devicemotion", onMotion); shakeArmed = true; shakeBtn.hidden = true; }
    const finishes = el("div", { class: "finishes" });
    const drawFinishes = () => { finishes.innerHTML = ""; for (const fin of EightBall.FINISHES) finishes.append(el("button", { class: "finish" + (S().ballFinish === fin.id ? " on" : ""), style: `color:${fin.rim}`, onclick: () => { S().ballFinish = fin.id; state.ball.lastIndex = null; state.ball.lastText = null; save(); applyFinish(fin); drawFinishes(); die.classList.remove("up"); eight.classList.remove("off"); answerBox.innerHTML = ""; answerBox.append(el("div", { class: "eyebrow faint" }, "Ask, then shake"), el("p", { class: "muted small" }, EightBall.copy.holdTheQuestion)); } }, el("i", { style: `background: radial-gradient(circle at 35% 30%, ${fin.dieLit}, ${fin.die} 55%, ${fin.dieDeep})` }), fin.name)); };
    drawFinishes();
    box.append(el("div", { class: "ball-stage" }, ball), answerBox,
      el("div", { class: "row", style: "justify-content:center" }, el("button", { class: "btn btn-primary btn-mono", onclick: shake }, "Shake"), shakeBtn, state.ball.lastText ? el("button", { class: "btn btn-ghost btn-icon", "aria-label": "Share the face", onclick: () => shareText("GhostLab Eight Ball", `The face reads: ${state.ball.lastText}\n\nGhostLab Eight Ball. A toy die that lands at random. Entertainment only.`) }, svg("share")) : null),
      el("div", { class: "panel" }, el("div", { class: "panel-head" }, el("div", { class: "glyph" }, svg("sparkle")), el("div", {}, el("div", { class: "eyebrow" }, "Finishes"), el("h3", {}, "Chamber"))), el("p", { class: "muted small", style: "margin-bottom:12px" }, EightBall.copy.finishHint), finishes,
        el("div", { class: "toggle-row", style: "margin-top:10px;border:0" }, el("div", {}, el("div", { class: "t" }, "Chamber sound"), el("div", { class: "s" }, "Liquid on the shake, a knock as the die lands.")), Switch(S().sound, (v) => { S().sound = v; save(); }))),
      el("p", { class: "footer-line" }, EightBall.copy.entertainment));
    return box;
  }
  function Switch(value, onChange) {
    const b = el("button", { class: "switch", role: "switch", "aria-checked": value ? "true" : "false", onclick: () => { value = !value; b.setAttribute("aria-checked", value ? "true" : "false"); onChange(value); } });
    return b;
  }

  // ---------- More ----------
  function MoreScreen() {
    switch (ui.moreView) {
      case "settings": return SettingsView();
      case "guide": return GuideView();
      case "learning": return LearningView();
      case "about": return AboutView();
      default: return MoreMenu();
    }
  }
  const moreRow = (icon, t, s, view) => el("button", { class: "link-row", onclick: () => { ui.moreView = view; ui.learnChapter = null; go("more", view); } }, el("div", { class: "glyph" }, svg(icon)), el("div", { class: "grow" }, el("div", { class: "t" }, t), el("div", { class: "s" }, s)), el("span", { class: "chev" }, svg("chev")));
  function MoreMenu() {
    return el("div", { class: "stack" }, pageHead("GhostLab", "More", "Settings, the guide, and where the cards come from."),
      moreRow("gear", "Settings", "Reader, reversals, The Instrument, receipts.", "settings"),
      moreRow("lens", "How the reading works", "The shuffle, the voices, The Instrument, and the rules.", "guide"),
      moreRow("cap", "Learning", "Fool's Journey, suits, and how to ask a question.", "learning"),
      moreRow("info", "About", "What this is, and what it is not.", "about"),
      ProCard(),
      ToolkitCard(),
      InstallHint(),
      el("p", { class: "footer-line" }, "Entertainment only. Adirondack Cyber Security."));
  }
  function SettingsView() {
    const box = el("div", { class: "stack" });
    const row = (t, s, key) => el("div", { class: "toggle-row" }, el("div", {}, el("div", { class: "t" }, t), el("div", { class: "s" }, s)), Switch(S()[key], (v) => { S()[key] = v; save(); }));
    box.append(backRow("More", () => { ui.moreView = "menu"; go("more"); }), pageHead("GhostLab", "Settings", "Same cards. Three registers."),
      el("div", { class: "panel" }, el("div", { class: "label" }, "Reader"), VoicePicker(S().voice, (v) => { S().voice = v; S().didPickVoice = true; save(); render(); })),
      ProCard(),
      el("div", { class: "panel" },
        row("Reversals", "One extra random bit at deal time. Never on The Instrument.", "reversalsOn"),
        row("Include The Instrument", "A 79th card about the method, the observer, or contamination.", "instrumentOn"),
        row("Show shuffle receipt", "First 8 hex characters of SHA-256 over the deal.", "showShuffleReceipt"),
        row("Chamber sound", "Eight ball liquid and the knock as the die lands.", "sound")),
      el("div", { class: "panel" }, el("div", { class: "label" }, "Your data"), el("p", { class: "muted small", style: "margin-bottom:12px" }, "Every note and setting lives in this browser only. Clearing site data removes it."),
        el("div", { class: "row" }, el("button", { class: "btn btn-ghost btn-sm grow", onclick: exportData }, "Export notes"), el("button", { class: "btn btn-ghost btn-sm grow", style: "color:var(--danger)", onclick: () => { if (!confirm("Erase every note, pull and setting on this device?")) return; state = structuredClone(DEFAULTS); state.settings.acceptedDisclaimerVersion = 1; save(); toast("Erased."); render(); } }, "Erase everything"))),
      el("button", { class: "btn btn-ghost btn-block", onclick: () => showGate("review") }, "Read the disclaimer again"));
    return box;
  }
  function exportData() {
    const text = JSON.stringify({ exportedAt: new Date().toISOString(), app: "GhostLab: Divination (web)", dailies: state.dailies, experiments: state.experiments, sittings: state.sittings }, null, 2);
    shareText("GhostLab: Divination notes", text);
  }
  function GuideView() {
    const step = (i, t, b) => el("div", { class: "step" }, el("div", { class: "i" }, i), el("div", {}, el("div", { class: "t" }, t), el("div", { class: "b" }, b)));
    const plateSection = (eyebrow, title, icon, ...content) => el("div", { class: "panel" }, el("div", { class: "panel-head" }, el("div", { class: "glyph" }, svg(icon)), el("div", {}, el("div", { class: "eyebrow" }, eyebrow), el("h3", {}, title))), el("div", { class: "hairline" }), ...content);
    return el("div", { class: "stack" }, backRow("More", () => { ui.moreView = "menu"; go("more"); }), pageHead("Guide", "How the reading works"),
      plateSection("Protocol", "How we shuffle", "shuffle", el("div", { class: "steps" },
        step("01", "Bag", "78 cards, or 79 if The Instrument is on."),
        step("02", "Shuffle", "Fisher-Yates. Every index comes from the browser's cryptographic random source, with rejection sampling so no card is favored."),
        step("03", "Deal", "From the top into the protocol. Animation follows the deal."),
        step("04", "Reversal", "One extra random bit at deal time. Never pre-assigned. Never on The Instrument."),
        step("05", "Receipt", "First 8 hex chars of SHA-256 over dealt IDs, reversal bits, and a UTC timestamp. We do not preselect a card of the day.")),
        el("div", { class: "receipt", style: "margin-top:14px" }, el("span", { class: "lbl" }, "RECEIPT"), el("b", {}, "A3F1C90B"), el("span", { class: "lbl" }, "SAMPLE"))),
      plateSection("Register", "Voices", "wave", el("p", { class: "muted small", style: "margin-bottom:10px" }, "One meaning core. Three tones. They do not ship three contradictory fact decks."), el("div", { class: "steps" },
        step("", "Mystic", "Atmospheric. Traditional tarot diction. Still entertainment-framed."),
        step("", "Clinical", "The lab notebook. Seats are labelled, lines are short, nothing is dressed up."),
        step("", "Skeptical", "Talks the way a blunt friend would. It names cold reading, confirmation bias, and the Barnum effect, and still teaches the card."))),
      plateSection("79th", "The Instrument", "lens", el("div", { class: "steps" },
        step("01", "", "Lab arcana. The 79th card. No suit, no number, no reversal."), step("02", "", "About the method, the observer, or contamination."), step("03", "", "Never a spirit. Never the app speaking."), step("04", "", "On a daily it labels the day Calibration."), step("05", "", "On A or B and Yes or No it makes the result inconclusive."))),
      plateSection("Rules", "Ethics", "shield", el("div", { class: "steps" },
        step("01", "", "Empower. Do not dictate. These cards reflect patterns and possibilities. They do not issue orders."), step("02", "", "Tarot is not medical, legal, or financial advice. Suggest professional help when the question belongs there."), step("03", "", "We do not predict death, severe illness, or irreversible disaster."), step("04", "", "Language of possibility: this energy suggests. Not: this will happen."), step("05", "", "Consent first. Notes stay on this device. Entertainment and experimental investigation only."))),
      plateSection("Credit", "Plates", "book", el("div", { class: "stack-sm muted small" }, el("p", {}, "The 78 plates are public-domain illustrations by Pamela Colman Smith, 1909."), el("p", {}, "Reversed is a 180 degree rotation of the same file."), el("p", {}, "The Instrument, the card back, and every oracle plate are original GhostLab art."), el("p", { class: "mono", style: "color:var(--accent);font-size:12px" }, GL.SMITH_CREDIT))),
      moreRow("cap", "Learning", "Fool's Journey, suits, and how to ask a question.", "learning"));
  }
  function LearningView() {
    const chapters = [["journey", "The Fool's Journey", "The 22 big cards, told as one simple story.", ["fool", "wheel-of-fortune", "world"]], ["suits", "The four suits", "What each group of cards is about.", ["ace-wands", "ace-cups", "ace-swords"]], ["question", "How to ask a question", "How to ask a question that actually helps.", ["high-priestess"]]];
    if (!ui.learnChapter) {
      return el("div", { class: "stack" }, backRow("More", () => { ui.moreView = "menu"; go("more"); }), pageHead("Learn", "Learning", "New to tarot? Start here. Short reads, everyday words."),
        chapters.map(([id, t, b, ids]) => el("button", { class: "instrument", onclick: () => { ui.learnChapter = id; render(); window.scrollTo(0, 0); } }, el("div", { class: "grow" }, el("h3", {}, t), el("p", {}, b), el("div", { class: "status" }, "Read")), el("div", { class: "art" }, el("div", { class: "mini-fan" }, ids.map((cid) => Deck.card(cid)).filter(Boolean).map((c) => el("img", { src: cardImg(c, true), alt: "" })))))));
    }
    const box = el("div", { class: "stack" }); const ch = chapters.find((c) => c[0] === ui.learnChapter);
    box.append(backRow("Learning", () => { ui.learnChapter = null; render(); }), pageHead("Learn", ch[1], ch[2]));
    if (ch[0] === "journey") {
      box.append(el("div", { class: "reading" }, ["The 22 big cards tell one story. It starts with the Fool, someone at the very beginning of something new.", "Along the way they learn skills, meet teachers, make choices, hit setbacks, lose things, and get back up. The later cards are about hope, doubt, joy, and honest looks back. The last card, the World, means a chapter finished.", "Every card below is one stop on that road. Tap any of them to learn more."].map((p) => el("p", {}, p))),
        el("div", { class: "journey" }, Deck.majors().map((c) => el("button", { class: "stop", onclick: () => openCardDetail(c, false) }, CardPlate(c, false, { thumb: true }), el("div", { class: "grow" }, el("div", {}, el("span", { class: "r" }, c.roman || c.rank), el("span", { class: "nm" }, c.name)), el("div", { class: "c" }, c.core || c.meaningCoreUpright)), el("span", { class: "chev", style: "color:var(--faint)" }, svg("chev"))))));
    } else if (ch[0] === "suits") {
      const suit = (id, aceId, element, domain) => { const c = Deck.card(aceId); return el("div", { class: "plate", style: `border-color: color-mix(in srgb, var(--${id}) 35%, transparent)` }, CardPlate(c, false, { thumb: true }), el("div", {}, el("div", { class: "nm", style: "font-size:18px" }, GL.SUITS[id].title), el("span", { class: "eyebrow", style: `color:var(--${id});font-size:10px` }, element), el("div", { class: "tx" }, domain))); };
      box.append(el("div", { class: "reading" }, ["Most of the deck is split into four groups called suits. Each suit covers one part of everyday life.", "Face cards, like kings and queens, can stand for a person you know or a way of acting."].map((p) => el("p", {}, p))),
        el("div", { class: "plates" }, suit("wands", "ace-wands", "Fire", "Action, will, creativity, passion."), suit("cups", "ace-cups", "Water", "Emotion, relationships, intuition."), suit("swords", "ace-swords", "Air", "Mind, communication, conflict, clarity."), suit("pentacles", "ace-pentacles", "Earth", "Work, body, money, the solid world.")),
        el("div", { class: "panel tight" }, el("h3", {}, "The Instrument"), el("div", { class: "eyebrow magenta", style: "font-size:10px;margin:4px 0 6px" }, "Extra card, off by default"), el("p", { class: "muted small" }, "A 79th card about the app itself rather than your life. Turn it on in Settings if you are curious.")));
    } else {
      const plate = (kind, h, b) => el("div", { class: "try-care " + kind }, el("i"), el("div", {}, el("div", {}, el("span", { class: "b" }, kind === "care" ? "CARE" : "TRY"), el("span", { class: "t" }, h)), el("p", {}, b)));
      box.append(plate("try", "Ask open questions", "\"What do I need to understand about this situation?\" works better than \"What will happen to me?\""),
        plate("try", "Slow down while you shuffle", "Take a breath and think about your question. The cards are a way to slow down and reflect."),
        plate("try", "Keep every choice yours", "The cards never give orders. They offer a way to look at things."),
        plate("care", "Skip the heavy stuff", "Do not use the cards for medical, legal, money, or emergency decisions. And do not ask about people you have lost."),
        plate("try", "Treat Yes or No as a lean", "It gives you a lean one way or the other. Treat it like a friend's opinion."),
        plate("try", "Check back later", "Write down what you asked and look again in a few days. Seeing what actually happened is half the fun."));
    }
    return box;
  }
  function AboutView() {
    return el("div", { class: "stack" }, backRow("More", () => { ui.moreView = "menu"; go("more"); }), pageHead("GhostLab", "About"),
      el("div", { class: "panel" }, el("div", { class: "reading" }, el("p", {}, "GhostLab: Divination is three instruments on one bench: tarot, oracle plates, and an eight ball. Bring a question, pull a card, deal a plate, or shake for yes or no."), el("p", {}, "Everything runs in your browser. Your readings and notes never leave this device. There is no account and no server of ours. The free version shows ads; a one-time Pro key removes them."))),
      ToolkitCard(),
      el("div", { class: "panel tight" }, el("div", { class: "label" }, "Web app"), el("p", { class: "muted small" }, "Add it to your Home Screen and it opens full screen, works offline, and keeps your notes between visits."), InstallHint()),
      el("div", { class: "panel tight" }, el("div", { class: "label" }, "Links"), el("div", { class: "stack-sm small" }, el("a", { href: "../privacy-tarot.html" }, "Privacy policy"), el("br"), el("a", { href: "../support.html" }, "Support"), el("br"), el("a", { href: "../apps.html" }, "The GhostLab apps"))),
      el("p", { class: "footer-line" }, "Entertainment and experimental investigation only. Adirondack Cyber Security."));
  }

  // ---------- Disclaimer gate ----------
  function showGate(mode) {
    const gate = el("div", { class: "gate", role: "dialog", "aria-modal": "true" });
    const line = (t) => el("p", {}, t);
    gate.append(el("div", { class: "inner" },
      el("div", { class: "eyebrow", style: "letter-spacing:0.5em" }, "GhostLab"), el("div", { class: "wordmark" }, "Divination"), el("p", { class: "muted", style: "margin-top:4px;font-size:17px" }, "Three instruments for reflection."),
      line("Entertainment and experimental investigation only. Never sold as scientific proof."),
      line("These instruments are for reflection. Draws are a shuffle plus your interpretation. They are not contact with the dead and they are not a prediction you should act on."),
      line("Do not use it to ask after people you have lost. Do not use it for medical, legal, financial, or crisis decisions."),
      line("Empower. Do not dictate. These cards reflect patterns and possibilities. They do not issue orders."),
      line("We do not predict death, severe illness, or irreversible disaster. Language of possibility: this energy suggests. Not: this will happen."),
      el("p", { class: "muted small" }, "12+  ·  infrequent occult and fear themes  ·  notes stay in this browser"),
      el("button", { class: "btn btn-primary btn-block", style: "margin-top:22px", onclick: () => { S().acceptedDisclaimerVersion = 1; save(); gate.remove(); document.body.style.overflow = ""; } }, mode === "review" ? "Close" : "I understand")));
    document.body.append(gate); document.body.style.overflow = "hidden";
  }

  // ---------- Boot ----------
  async function boot() {
    load();
    const [deck, oracle] = await Promise.all([fetch("data/fielddeck.json").then((r) => r.json()), fetch("data/oracledecks.json").then((r) => r.json())]);
    Deck.load(deck); Oracle.load(oracle);
    fromHash();
    if (S().acceptedDisclaimerVersion < 1) showGate("gate");
    revalidateIfDue();
    if ("serviceWorker" in navigator && location.protocol === "https:") navigator.serviceWorker.register("sw.js").catch(() => {});
  }
  boot().catch((e) => { app.innerHTML = ""; app.append(el("div", { class: "screen" }, el("div", { class: "empty" }, "The deck could not load. Check your connection and reload."))); console.error(e); });
})();
