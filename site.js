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
    function closeMenu() {
      if (!links.classList.contains("open")) return;
      links.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
    }
    document.addEventListener("pointerdown", function (e) {
      if (!links.contains(e.target) && !btn.contains(e.target)) closeMenu();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeMenu();
    });
    window.addEventListener("scroll", closeMenu, { passive: true });
  }

  // Scroll reveal - keep hero CTAs / video usable even if this fails
  var els = document.querySelectorAll(".reveal");
  // Critical above-the-fold media: never wait on the observer
  document.querySelectorAll(".page-hero.reveal, .video-frame.reveal, .video-facade.reveal, .final-cta.reveal, .workflow-step.reveal, .workflow-section .reveal").forEach(function (el) {
    el.classList.add("in");
  });
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

  // Team PTT radio demo - pre-recorded investigator calls with radio FX
  var peers = document.querySelectorAll("#radioVisual .peer");
  var radioVisual = document.getElementById("radioVisual");
  var listenBtn = document.getElementById("radioListenBtn");
  var radioNote = document.getElementById("radioNote");

  if (peers.length && radioVisual) {
    var idx = 1;
    var radioLive = false;
    var rotateTimer = null;
    var nextTimer = null;
    var clips = {};       // "0-1" -> Audio
    var variantFor = [1, 1, 1]; // next variant per peer (alternates 1/2)
    var staticBed = null;
    var currentClip = null;

    function clipSrc(peerIndex, variant) {
      var peer = peers[peerIndex];
      var base = peer ? peer.getAttribute("data-audio") : null;
      return base ? base + "-" + variant + ".mp3" : null;
    }

    function getClip(peerIndex, variant) {
      var key = peerIndex + "-" + variant;
      if (!clips[key]) {
        var src = clipSrc(peerIndex, variant);
        if (!src) return null;
        var a = new Audio(src);
        a.preload = "auto";
        clips[key] = a;
      }
      return clips[key];
    }

    function preloadAll() {
      for (var p = 0; p < peers.length; p++) {
        getClip(p, 1);
        getClip(p, 2);
      }
      if (!staticBed) {
        staticBed = new Audio("assets/radio/static-bed.mp3");
        staticBed.loop = true;
        staticBed.volume = 0.18;
        staticBed.preload = "auto";
      }
    }

    function stopCurrentClip() {
      if (currentClip) {
        try { currentClip.pause(); currentClip.currentTime = 0; } catch (e) { /* ignore */ }
        currentClip.onended = null;
        currentClip = null;
      }
      if (nextTimer) { clearTimeout(nextTimer); nextTimer = null; }
    }

    function playPeer(peerIndex) {
      if (!radioLive) return;
      stopCurrentClip();
      peers.forEach(function (p) { p.classList.remove("talking"); });
      var peer = peers[peerIndex];
      if (!peer) return;
      peer.classList.add("talking");

      var variant = variantFor[peerIndex] || 1;
      variantFor[peerIndex] = variant === 1 ? 2 : 1;
      var clip = getClip(peerIndex, variant);
      if (!clip) return;
      currentClip = clip;
      clip.currentTime = 0;
      clip.onended = function () {
        if (!radioLive) return;
        // brief dead air between transmissions, like a real net
        nextTimer = setTimeout(function () {
          if (!radioLive) return;
          idx = (idx + 1) % peers.length;
          playPeer(idx);
        }, 700 + Math.floor(Math.random() * 700));
      };
      var pr = clip.play();
      if (pr && pr.catch) {
        pr.catch(function () {
          // Autoplay/network hiccup - keep the visual rotation alive
          if (!radioLive) return;
          nextTimer = setTimeout(function () {
            if (!radioLive) return;
            idx = (idx + 1) % peers.length;
            playPeer(idx);
          }, 3200);
        });
      }
    }

    function startRadio() {
      if (radioLive) return;
      radioLive = true;
      preloadAll();
      if (listenBtn) {
        listenBtn.classList.add("is-live");
        listenBtn.setAttribute("aria-pressed", "true");
        listenBtn.textContent = "● Team radio live - speakers on";
      }
      if (radioNote) {
        radioNote.textContent = "Live from the field - Alex, Jack, and Morgan mid-hunt. Unmute your device.";
      }
      if (staticBed) {
        var sp = staticBed.play();
        if (sp && sp.catch) sp.catch(function () { /* ignore */ });
      }
      // Start playback inside the user gesture (required by browsers)
      var talking = radioVisual.querySelector(".peer.talking");
      var tIdx = talking ? Array.prototype.indexOf.call(peers, talking) : idx;
      if (tIdx < 0) tIdx = idx;
      idx = tIdx;
      playPeer(idx);
    }

    function stopRadio() {
      radioLive = false;
      stopCurrentClip();
      if (staticBed) {
        try { staticBed.pause(); staticBed.currentTime = 0; } catch (e) { /* ignore */ }
      }
      if (listenBtn) {
        listenBtn.classList.remove("is-live");
        listenBtn.setAttribute("aria-pressed", "false");
        listenBtn.textContent = "▶ Listen to team radio";
      }
      if (radioNote) {
        radioNote.textContent = "Tap Listen - hear the team call out over the radio, each with their own voice. (Simulation)";
      }
    }

    if (listenBtn) {
      // Warm the cache so the first tap is instant
      listenBtn.addEventListener("pointerenter", preloadAll, { once: true });
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

    // Visual rotation while muted (no audio until Listen)
    setInterval(function () {
      if (radioLive) return;
      idx = (idx + 1) % peers.length;
      peers.forEach(function (p) { p.classList.remove("talking"); });
      peers[idx].classList.add("talking");
    }, 3200);

    // Stop audio when tab is hidden
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && radioLive) stopRadio();
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

  // Click-to-load YouTube facade (privacy: no embed until user activates)
  try {
    document.querySelectorAll(".video-facade").forEach(function (frame) {
      var btn = frame.querySelector(".video-facade-btn");
      var poster = frame.querySelector(".video-facade-poster");
      if (!btn) return;

      // Ensure facade is visible even if reveal observer never fires
      frame.classList.add("in");

      if (poster) {
        poster.addEventListener("error", function onPosterError() {
          poster.removeEventListener("error", onPosterError);
          var fallback = poster.getAttribute("data-fallback");
          if (fallback && poster.src !== fallback) poster.src = fallback;
        });
      }

      function loadVideo() {
        if (frame.classList.contains("is-playing")) return;
        var id = frame.getAttribute("data-youtube-id");
        if (!id) return;
        var title = frame.getAttribute("data-title") || "YouTube video";
        var iframe = document.createElement("iframe");
        iframe.src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1";
        iframe.title = title;
        iframe.setAttribute("loading", "lazy");
        iframe.setAttribute(
          "allow",
          "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        );
        iframe.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
        iframe.setAttribute("allowfullscreen", "");
        frame.classList.add("is-playing");
        frame.appendChild(iframe);
        btn.setAttribute("aria-hidden", "true");
        btn.tabIndex = -1;
        try { iframe.focus(); } catch (e) { /* ignore */ }
      }

      btn.addEventListener("click", loadVideo);
    });
  } catch (e) { /* never block the rest of the page */ }
})();
