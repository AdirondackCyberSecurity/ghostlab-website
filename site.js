(function () {
      // Year
      var y = document.getElementById("year");
      if (y) y.textContent = String(new Date().getFullYear());

      // Sticky nav
      var nav = document.getElementById("nav");
      var onScroll = function () {
        if (!nav) return;
        nav.classList.toggle("scrolled", window.scrollY > 12);
      };
      onScroll();
      window.addEventListener("scroll", onScroll, { passive: true });

      // Mobile menu
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

      // Reveal on scroll
      var els = document.querySelectorAll(".reveal");
      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) {
              e.target.classList.add("in");
              io.unobserve(e.target);
            }
          });
        }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
        els.forEach(function (el) { io.observe(el); });
      } else {
        els.forEach(function (el) { el.classList.add("in"); });
      }

      // Hero PTT demo pulse
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
              ? '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>ON AIR'
              : '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 14a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v5a3 3 0 0 0 3 3zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-3.08A7 7 0 0 0 19 11h-2z"/></svg>TALK';
          }
          chip.textContent = live ? "TRANSMITTING" : "HOLD TO TALK";
        }, 2600);
      }

      // Radio peer rotation
      var peers = document.querySelectorAll("#radioVisual .peer");
      if (peers.length) {
        var idx = 1;
        setInterval(function () {
          peers.forEach(function (p) {
            p.classList.remove("talking");
            var name = p.querySelector("span");
            if (name && name.dataset.base) name.textContent = name.dataset.base;
          });
          idx = (idx + 1) % peers.length;
          peers[idx].classList.add("talking");
          var s = peers[idx].querySelector("span");
          if (s) {
            if (!s.dataset.base) s.dataset.base = s.textContent;
            s.textContent = "ON AIR";
          }
        }, 2800);
      }

      // Optional: set APP_STORE_URL when you have the final listing ID
      // window.GHOSTLAB_APP_STORE_URL = "https://apps.apple.com/app/idXXXXXXXX";
      if (window.GHOSTLAB_APP_STORE_URL) {
        document.querySelectorAll('a[href*="apps.apple.com"], #appStoreBtn').forEach(function (a) {
          a.href = window.GHOSTLAB_APP_STORE_URL;
        });
      }
    })();
