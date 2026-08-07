(function () {
  var APP_STORE_URL = "https://apps.apple.com/us/app/ghostlab-paranormal-toolkit/id6791637317";

  var y = document.getElementById("year");
  if (y) y.textContent = String(new Date().getFullYear());

  var nav = document.getElementById("nav");
  function onScroll() {
    if (!nav) return;
    nav.classList.toggle("scrolled", window.scrollY > 12);
  }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var btn = document.getElementById("menuBtn");
  var links = document.getElementById("navLinks");
  if (btn && links) {
    btn.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
    });
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        btn.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll reveal — keep hero CTAs usable even if this fails
  var els = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.08, rootMargin: "0px 0px -20px 0px" });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add("in"); });
  }
  // Safety: after 1.2s force-show all reveals (prevents invisible stuck state)
  setTimeout(function () {
    document.querySelectorAll(".reveal:not(.in)").forEach(function (el) {
      el.classList.add("in");
    });
  }, 1200);

  var ptt = document.getElementById("pttDemo");
  var chip = document.getElementById("pttChip");
  if (ptt && chip) {
    var live = false;
    setInterval(function () {
      live = !live;
      ptt.classList.toggle("live", live);
      var label = ptt.querySelector(".stack");
      if (label) {
        label.innerHTML = live
          ? '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>ON AIR'
          : '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>TALK';
      }
      chip.textContent = live ? "TRANSMITTING" : "HOLD TO TALK";
    }, 2600);
  }

  // Team PTT radio demo — rotate peers and speak investigation callouts
  var peers = document.querySelectorAll("#radioVisual .peer");
  var radioVisual = document.getElementById("radioVisual");
  if (peers.length && radioVisual && "speechSynthesis" in window) {
    var idx = 1;
    var radioInView = false;
    var speechUnlocked = false;
    var peerVoices = [];
    // Slight per-peer voice character so three investigators feel distinct
    var voiceStyle = [
      { rate: 1.02, pitch: 1.05 },
      { rate: 0.96, pitch: 0.85 },
      { rate: 1.0, pitch: 1.15 }
    ];

    function loadPeerVoices() {
      var all = window.speechSynthesis.getVoices() || [];
      var en = all.filter(function (v) {
        return /^en/i.test(v.lang || "");
      });
      var pool = en.length ? en : all;
      if (!pool.length) {
        peerVoices = [];
        return;
      }
      // Prefer distinct voices; fall back to cycling the pool
      var preferred = pool.filter(function (v) {
        var n = (v.name || "").toLowerCase();
        return /samantha|alex|daniel|karen|moira|rishi|aaron|fred|siri|google|microsoft|enhanced|premium|neural/i.test(n);
      });
      var source = preferred.length >= 2 ? preferred : pool;
      peerVoices = [
        source[0] || pool[0],
        source[1] || pool[Math.min(1, pool.length - 1)],
        source[2] || pool[Math.min(2, pool.length - 1)]
      ];
    }
    loadPeerVoices();
    if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
      window.speechSynthesis.onvoiceschanged = loadPeerVoices;
    }

    function speakLine(peerIndex, text) {
      if (!speechUnlocked || !radioInView || !text) return;
      try {
        window.speechSynthesis.cancel();
        var u = new SpeechSynthesisUtterance(text);
        var style = voiceStyle[peerIndex % voiceStyle.length];
        u.rate = style.rate;
        u.pitch = style.pitch;
        u.volume = 1;
        if (peerVoices[peerIndex]) u.voice = peerVoices[peerIndex];
        // Keep default English when the voice list is empty
        if (!u.voice) u.lang = "en-US";
        window.speechSynthesis.speak(u);
      } catch (e) { /* ignore */ }
    }

    function unlockSpeech() {
      if (speechUnlocked) return;
      speechUnlocked = true;
      var note = document.getElementById("radioNote");
      if (note) {
        note.textContent = "Live team radio — each investigator calls out what they’re seeing mid-hunt.";
      }
      // If IO hasn't fired yet, check visibility directly inside the gesture
      if (!radioInView) {
        var rect = radioVisual.getBoundingClientRect();
        radioInView = rect.top < window.innerHeight && rect.bottom > 0;
      }
      // Speak inside the user gesture so browsers allow audio
      if (radioInView) {
        var talking = radioVisual.querySelector(".peer.talking");
        var tIdx = talking ? Array.prototype.indexOf.call(peers, talking) : idx;
        if (tIdx < 0) tIdx = idx;
        speakLine(tIdx, peers[tIdx].getAttribute("data-line"));
      }
    }
    ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
      document.addEventListener(evt, unlockSpeech, { once: true, passive: true });
    });

    function setTalking(peerIndex) {
      peers.forEach(function (p) {
        p.classList.remove("talking");
      });
      var peer = peers[peerIndex];
      peer.classList.add("talking");
      // Audio-only callouts — no under-name caption text
      speakLine(peerIndex, peer.getAttribute("data-line") || "");
    }

    // Speak initial talking peer once speech is allowed and card is visible
    if ("IntersectionObserver" in window) {
      var radioIo = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          radioInView = e.isIntersecting;
          if (!radioInView) {
            try { window.speechSynthesis.cancel(); } catch (err) { /* ignore */ }
          } else if (speechUnlocked) {
            var talking = radioVisual.querySelector(".peer.talking");
            var tIdx = talking ? Array.prototype.indexOf.call(peers, talking) : idx;
            if (tIdx < 0) tIdx = idx;
            var line = peers[tIdx].getAttribute("data-line");
            speakLine(tIdx, line);
          }
        });
      }, { threshold: 0.35 });
      radioIo.observe(radioVisual);
    } else {
      radioInView = true;
    }

    setInterval(function () {
      idx = (idx + 1) % peers.length;
      setTalking(idx);
    }, 3200);
  } else if (peers.length) {
    // No speech API — keep visual rotation only (names only, no caption lines)
    var idxFallback = 1;
    setInterval(function () {
      peers.forEach(function (p) {
        p.classList.remove("talking");
      });
      idxFallback = (idxFallback + 1) % peers.length;
      peers[idxFallback].classList.add("talking");
    }, 2800);
  }

  // Normalize every App Store CTA (works even if markup drifts)
  var storeUrl = window.GHOSTLAB_APP_STORE_URL || APP_STORE_URL;
  document.querySelectorAll("a.btn-apple, a#appStoreBtn, a[href*='apps.apple.com']").forEach(function (a) {
    a.setAttribute("href", storeUrl);
    a.setAttribute("target", "_blank");
    a.setAttribute("rel", "noopener noreferrer");
  });
  document.querySelectorAll("a.btn-primary").forEach(function (a) {
    var t = (a.textContent || "").toLowerCase();
    if (t.indexOf("app store") !== -1 || t.indexOf("unlock") !== -1) {
      a.setAttribute("href", storeUrl);
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    }
  });
})();
