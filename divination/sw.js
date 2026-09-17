/* GhostLab: Divination service worker.
   Shell and data are precached so the bench opens offline. Card art is
   cached the first time it is seen. Bump VERSION with every deploy. */
const VERSION = "divination-20260917a";
const SHELL = [
  "./", "index.html", "app.css?v=20260916e", "engine.js?v=20260916e", "app.js?v=20260916e", "manifest.webmanifest",
  "data/fielddeck.json", "data/oracledecks.json",
  "cards/CardBack.webp", "cards/Instrument.webp",
  "icons/icon-192.png", "icons/icon-512.png", "icons/favicon.png",
  "audio/chamber_slosh.wav", "audio/chamber_settle.wav",
  // The store badges are images inside links: uncached, they leave the Toolkit
  // card holding two invisible anchors when the app opens offline. 17KB for both.
  "../assets/store/download-on-the-app-store.svg", "../assets/store/get-it-on-google-play.png",
];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  const isArt = /\/(cards|oracle|icons|audio)\//.test(url.pathname);
  if (isArt) {
    e.respondWith(caches.open(VERSION).then(async (c) => { const hit = await c.match(req); if (hit) return hit; const res = await fetch(req); if (res.ok) c.put(req, res.clone()); return res; }));
    return;
  }
  // Shell and data: network first so a deploy shows up, cache when offline.
  e.respondWith(fetch(req).then((res) => { if (res.ok) caches.open(VERSION).then((c) => c.put(req, res.clone())); return res; }).catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || (req.mode === "navigate" ? caches.match("index.html") : undefined))));
});
