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

  // Team PTT radio demo — peers speak aloud through device speakers
  var peers = document.querySelectorAll("#radioVisual .peer");
  var radioVisual = document.getElementById("radioVisual");
  var listenBtn = document.getElementById("radioListenBtn");
  var radioNote = document.getElementById("radioNote");

  if (peers.length && radioVisual) {
    var idx = 1;
    var radioLive = false;
    var peerVoices = [];
    var rotateTimer = null;
    var hasSpeech = "speechSynthesis" in window;

    // Distinct speaking styles per investigator (pitch/rate still differ if OS reuses a voice)
    var voiceStyle = [
      { rate: 1.06, pitch: 1.12 }, // Alex — brighter / quicker
      { rate: 0.94, pitch: 0.82 }, // Jack — lower / radio grit
      { rate: 1.0, pitch: 1.22 }   // Morgan — higher
    ];

    function loadPeerVoices() {
      if (!hasSpeech) return;
      var all = window.speechSynthesis.getVoices() || [];
      var en = all.filter(function (v) {
        return /^en(-|_|$)/i.test(v.lang || "") || /english/i.test(v.name || "");
      });
      var pool = en.length ? en : all.slice();
      if (!pool.length) {
        peerVoices = [];
        return;
      }
      // Prefer three different system voices when available
      var preferredNames = [
        /samantha|karen|moira|female|zira|siri.*female|google us english female/i,
        /daniel|alex|fred|david|male|aaron|google us english male|microsoft david/i,
        /moira|fiona|karen|tessa|victoria|siri|google uk|microsoft zira|neural/i
      ];
      peerVoices = [null, null, null];
      preferredNames.forEach(function (re, i) {
        var found = pool.find(function (v) { return re.test(v.name || ""); });
        if (found) peerVoices[i] = found;
      });
      // Fill gaps with distinct remaining voices
      var used = peerVoices.filter(Boolean).map(function (v) { return v.name; });
      pool.forEach(function (v) {
        for (var i = 0; i < 3; i++) {
          if (!peerVoices[i] && used.indexOf(v.name) === -1) {
            peerVoices[i] = v;
            used.push(v.name);
          }
        }
      });
      for (var j = 0; j < 3; j++) {
        if (!peerVoices[j]) peerVoices[j] = pool[j % pool.length];
      }
    }

    if (hasSpeech) {
      loadPeerVoices();
      if (typeof window.speechSynthesis.onvoiceschanged !== "undefined") {
        window.speechSynthesis.onvoiceschanged = loadPeerVoices;
      }
      // Chrome often loads voices async
      setTimeout(loadPeerVoices, 250);
      setTimeout(loadPeerVoices, 1000);
    }

    function speakLine(peerIndex, text) {
      if (!radioLive || !hasSpeech || !text) return;
      try {
        window.speechSynthesis.cancel();
        // Chrome bug: cancel can swallow the next speak — brief defer helps
        setTimeout(function () {
          if (!radioLive) return;
          loadPeerVoices();
          var u = new SpeechSynthesisUtterance(text);
          var style = voiceStyle[peerIndex % voiceStyle.length];
          u.rate = style.rate;
          u.pitch = style.pitch;
          u.volume = 1;
          u.lang = "en-US";
          if (peerVoices[peerIndex]) u.voice = peerVoices[peerIndex];
          window.speechSynthesis.speak(u);
        }, 40);
      } catch (e) { /* ignore */ }
    }

    function setTalking(peerIndex, forceSpeak) {
      peers.forEach(function (p) {
        p.classList.remove("talking");
      });
      var peer = peers[peerIndex];
      if (!peer) return;
      peer.classList.add("talking");
      if (forceSpeak || radioLive) {
        speakLine(peerIndex, peer.getAttribute("data-line") || "");
      }
    }

    function startRadio() {
      if (radioLive) return;
      radioLive = true;
      if (listenBtn) {
        listenBtn.classList.add("is-live");
        listenBtn.setAttribute("aria-pressed", "true");
        listenBtn.textContent = "● Team radio live — speakers on";
      }
      if (radioNote) {
        radioNote.textContent = "Alex, Jack, and Morgan are calling out mid-hunt. Unmute your device to hear them.";
      }
      // Speak immediately inside the user gesture (required by browsers)
      var talking = radioVisual.querySelector(".peer.talking");
      var tIdx = talking ? Array.prototype.indexOf.call(peers, talking) : idx;
      if (tIdx < 0) tIdx = idx;
      idx = tIdx;
      setTalking(idx, true);
      if (rotateTimer) clearInterval(rotateTimer);
      rotateTimer = setInterval(function () {
        idx = (idx + 1) % peers.length;
        setTalking(idx, true);
      }, 3800);
    }

    function stopRadio() {
      radioLive = false;
      if (rotateTimer) {
        clearInterval(rotateTimer);
        rotateTimer = null;
      }
      if (hasSpeech) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      }
      if (listenBtn) {
        listenBtn.classList.remove("is-live");
        listenBtn.setAttribute("aria-pressed", "false");
        listenBtn.textContent = "▶ Listen to team radio";
      }
      if (radioNote) {
        radioNote.textContent = "Tap Listen — each investigator speaks through your speakers with a different voice.";
      }
    }

    if (listenBtn) {
      listenBtn.addEventListener("click", function () {
        if (radioLive) stopRadio();
        else startRadio();
      });
    } else {
      // Fallback: first interaction unlocks if no button
      ["pointerdown", "keydown", "touchstart"].forEach(function (evt) {
        document.addEventListener(evt, function () {
          if (!radioLive) startRadio();
        }, { once: true, passive: true });
      });
    }

    // Visual rotation while muted (no speech until Listen)
    setInterval(function () {
      if (radioLive) return;
      idx = (idx + 1) % peers.length;
      peers.forEach(function (p) { p.classList.remove("talking"); });
      peers[idx].classList.add("talking");
    }, 3200);

    // Pause speech when tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && hasSpeech) {
        try { window.speechSynthesis.cancel(); } catch (e) { /* ignore */ }
      }
    });
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
