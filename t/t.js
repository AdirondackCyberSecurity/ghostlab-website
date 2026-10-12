// GhostLab hunt tag fallback page. The tag rides in the URL fragment
// (https://ghostlab.icu/t/#v1.<payload>.<signature>), which browsers never send to the server.
// Everything here runs locally; the page makes no network requests unless the visitor taps
// "Show the map here". Text goes into the page through textContent only.
(function () {
  "use strict";

  var MAX_TOKEN = 1900;
  var MAX_TITLE = 60;
  var MAX_NOTE = 500;
  var MAX_BY = 40;
  var ICONS = {
    pin: "Spot", evp: "EVP", voice: "Voice", cold: "Cold spot", shadow: "Shadow",
    emf: "EMF spike", footsteps: "Footsteps", door: "Door or knock", meet: "Meet here"
  };

  function $(id) { return document.getElementById(id); }

  // A second tag link opened in the same tab only changes the fragment, which does not
  // reload the page. Reload so the new tag replaces the old one.
  window.addEventListener("hashchange", function () { location.reload(); });

  function b64urlToBytes(text) {
    if (!/^[A-Za-z0-9_-]*$/.test(text) || text.length % 4 === 1) return null;
    var base = text.replace(/-/g, "+").replace(/_/g, "/");
    while (base.length % 4) base += "=";
    try {
      var bin = atob(base);
      var out = new Uint8Array(bin.length);
      for (var i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
      return out;
    } catch (e) {
      return null;
    }
  }

  // Strips control and format characters (bidi overrides included), as the app does.
  function clean(text, max, keepNewlines) {
    if (typeof text !== "string") return "";
    var out = "";
    for (var i = 0; i < text.length; i++) {
      var ch = text[i];
      var code = ch.charCodeAt(0);
      if (ch === "\n" && keepNewlines) { out += ch; continue; }
      if (ch === "\n" || ch === "\r" || ch === "\t") { out += " "; continue; }
      if (code <= 0x1f || code === 0x7f) continue;
      if (/\p{Cf}/u.test(ch)) continue;
      out += ch;
    }
    out = out.trim();
    return out.length > max ? out.slice(0, max) : out;
  }

  function plausibleMs(ms) {
    return typeof ms === "number" && isFinite(ms) && ms >= 1e12 && ms <= 4e12;
  }

  function fmtDate(ms) {
    return new Date(ms).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
  }

  function hex2(bytes) {
    var s = "";
    for (var i = 0; i < 2; i++) s += ("0" + bytes[i].toString(16)).slice(-2);
    return s.toUpperCase();
  }

  function broken() {
    $("broken").hidden = false;
  }

  var hash = location.hash.replace(/^#/, "");
  try { hash = decodeURIComponent(hash); } catch (e) { /* keep raw */ }
  if (!hash || hash.length > MAX_TOKEN || hash.indexOf("v1.") !== 0) return broken();
  var parts = hash.split(".");
  if (parts.length !== 3) return broken();
  var payloadBytes = b64urlToBytes(parts[1]);
  var signature = b64urlToBytes(parts[2]);
  if (!payloadBytes || !signature || signature.length !== 64) return broken();

  var p;
  try {
    p = JSON.parse(new TextDecoder().decode(payloadBytes));
  } catch (e) {
    return broken();
  }
  if (!p || p.v !== 1 || typeof p.la !== "number" || typeof p.lo !== "number" ||
      !isFinite(p.la) || !isFinite(p.lo) || Math.abs(p.la) > 90 || Math.abs(p.lo) > 180 ||
      !plausibleMs(p.c) || !plausibleMs(p.u)) {
    return broken();
  }

  var iconTitle = ICONS[p.i] || ICONS.pin;
  var title = clean(p.t, MAX_TITLE, false) || iconTitle;
  var note = clean(p.d, MAX_NOTE, true);
  var by = clean(p.by, MAX_BY, false);
  var lat = p.la.toFixed(6);
  var lon = p.lo.toFixed(6);

  document.title = title + " · GhostLab";
  $("title").textContent = title;
  $("by").textContent = (by ? by : "A friend") + " tagged this spot on " + fmtDate(p.c) + ".";
  if (note) {
    $("note").textContent = note;
    $("note-card").hidden = false;
  }
  $("coords").textContent = lat + ", " + lon;
  $("accuracy").textContent = p.m ? "Pin placed by hand." : "GPS fix ±" + (p.ac | 0) + " m.";
  if (plausibleMs(p.x)) {
    $("expiry").textContent = (p.x <= Date.now() ? "This tag expired on " : "Leaves GhostLab maps on ") + fmtDate(p.x) + ".";
  }

  var state = null;
  if (p.del === true) state = "The sender deleted this tag.";
  else if (plausibleMs(p.x) && p.x <= Date.now()) state = "This tag has expired. GhostLab won't add it to a map any more.";
  if (state) {
    $("state").textContent = state;
    $("state-card").hidden = false;
  }

  var q = encodeURIComponent(title);
  $("apple-maps").href = "https://maps.apple.com/?ll=" + lat + "," + lon + "&q=" + q + "&z=18";
  $("google-maps").href = "https://www.google.com/maps/search/?api=1&query=" + lat + "," + lon;
  $("open-app").href = "ghostlab://t/#" + hash;

  $("show-map").addEventListener("click", function () {
    var la = parseFloat(lat), lo = parseFloat(lon), d = 0.003;
    var bbox = [lo - d, la - d, lo + d, la + d].map(function (n) { return n.toFixed(6); }).join(",");
    var map = $("map");
    map.src = "https://www.openstreetmap.org/export/embed.html?bbox=" + bbox +
      "&layer=mapnik&marker=" + lat + "," + lon;
    map.hidden = false;
    $("show-map").hidden = true;
    $("map-note").textContent = "Map data © OpenStreetMap contributors.";
  });

  $("tag").hidden = false;

  // Show who signed it when the browser can check an Ed25519 signature. Older browsers just
  // skip this; the app always verifies before adding a tag.
  var key = b64urlToBytes(typeof p.a === "string" ? p.a : "");
  if (!key || key.length !== 32 || !window.crypto || !crypto.subtle) return;
  crypto.subtle.digest("SHA-256", key).then(function (digest) {
    var label = by ? by : "Friend " + hex2(new Uint8Array(digest));
    $("by").textContent = label + " tagged this spot on " + fmtDate(p.c) + ".";
    return crypto.subtle.importKey("raw", key, { name: "Ed25519" }, false, ["verify"]).then(function (pub) {
      return crypto.subtle.verify({ name: "Ed25519" }, pub, signature, payloadBytes);
    }).then(function (ok) {
      if (!ok) {
        $("state").textContent = "This link was changed after it was made. GhostLab won't open it.";
        $("state-card").hidden = false;
        $("open-app").hidden = true;
      }
    });
  }).catch(function () { /* no Ed25519 in this browser */ });
})();
