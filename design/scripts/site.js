/* =============================================================
   site.js — theme + language persistence, reveals, filters, forms
   No framework. Progressive: works without JS, enhances with it.
   ============================================================= */
(function () {
  var root = document.documentElement;
  root.classList.add("js");

  /* ---- Persisted theme ---- */
  /* Light-first by intent: default light regardless of OS pref;
     only honor an explicit user choice persisted from before. */
  var savedTheme = localStorage.getItem("ih-theme");
  root.setAttribute("data-theme", savedTheme === "dark" ? "dark" : "light");
  /* ---- Persisted language ---- */
  root.setAttribute("data-lang", localStorage.getItem("ih-lang") || "zh");
  /* ---- Persisted display font ---- */
  var df = localStorage.getItem("ih-display");
  if (df) root.setAttribute("data-display", df);

  function syncToggles() {
    var dark = root.getAttribute("data-theme") === "dark";
    document.querySelectorAll("[data-act='theme']").forEach(function (b) {
      b.setAttribute("aria-pressed", String(dark));
    });
    var lang = root.getAttribute("data-lang");
    document.querySelectorAll(".langtog button").forEach(function (b) {
      b.setAttribute("aria-pressed", String(b.dataset.lang === lang));
    });
  }

  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!t) return;
    var act = t.dataset.act;
    if (act === "theme") {
      var next = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      root.setAttribute("data-theme", next);
      localStorage.setItem("ih-theme", next);
      syncToggles();
    } else if (act === "lang") {
      var l = t.dataset.lang;
      root.setAttribute("data-lang", l);
      localStorage.setItem("ih-lang", l);
      syncToggles();
    } else if (act === "palette") {
      togglePalette();
    } else if (act === "menu") {
      document.body.classList.toggle("nav-open");
    }
  });
  syncToggles();

  /* ---- Command palette (search) ---- */
  function togglePalette() {
    var p = document.getElementById("palette");
    if (!p) return;
    var open = p.classList.toggle("open");
    if (open) { var i = p.querySelector("input"); if (i) i.focus(); }
  }
  document.addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); togglePalette(); }
    if (e.key === "Escape") { var p = document.getElementById("palette"); if (p) p.classList.remove("open"); }
  });

  /* ---- Reveal on scroll ---- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && reveals.length) {
    var io = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    reveals.forEach(function (el, i) { el.style.transitionDelay = (i % 6) * 45 + "ms"; io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---- Newsletter mock ---- */
  document.querySelectorAll(".subform").forEach(function (f) {
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var inp = f.querySelector("input");
      if (!inp.value || inp.value.indexOf("@") < 0) { inp.focus(); return; }
      f.classList.add("ok");
      var note = f.parentElement.querySelector(".subform__note");
      if (note) { note.dataset.zh = note.querySelector("[data-l='zh']") ? "" : ""; }
      f.innerHTML = '<div class="subform__done mono">✓ ' +
        (root.getAttribute("data-lang") === "zh" ? "已订阅 · 查收确认邮件" : "Subscribed · check your inbox") +
        "</div>";
    });
  });

  /* ---- Resource filtering (phase pages) with URL state ---- */
  var grid = document.getElementById("resgrid");
  if (grid) {
    var DIMS = ["phase", "cat", "price"];
    var params = new URLSearchParams(location.search);
    var state = {
      phase: params.get("phase") || grid.getAttribute("data-default-phase") || "all",
      cat: params.get("cat") || "all",
      price: params.get("price") || "all",
      q: params.get("q") || ""
    };
    var cards = Array.prototype.slice.call(grid.querySelectorAll(".rcard"));
    var countEl = document.getElementById("rescount");
    var qi = document.getElementById("resq");
    if (qi && state.q) qi.value = state.q;

    function writeURL() {
      var p = new URLSearchParams();
      DIMS.forEach(function (d) { if (state[d] && state[d] !== "all") p.set(d, state[d]); });
      if (state.q) p.set("q", state.q);
      var qs = p.toString();
      history.replaceState(null, "", qs ? "?" + qs : location.pathname);
    }

    function syncChips() {
      document.querySelectorAll("[data-filter]").forEach(function (b) {
        var on = state[b.dataset.filter] === b.dataset.value;
        b.setAttribute("aria-pressed", String(on));
      });
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var okPhase = state.phase === "all" || c.dataset.phase === state.phase;
        var okCat = state.cat === "all" || c.dataset.cat === state.cat;
        var okPrice = state.price === "all" || c.dataset.price === state.price;
        var hay = ((c.dataset.tags || "") + " " + c.textContent).toLowerCase();
        var okQ = !state.q || hay.indexOf(state.q.toLowerCase()) >= 0;
        var vis = okPhase && okCat && okPrice && okQ;
        c.style.display = vis ? "" : "none";
        if (vis) shown++;
      });
      if (countEl) {
        var z = countEl.querySelector("[data-l='zh']"), e = countEl.querySelector("[data-l='en']");
        if (z) z.textContent = shown + " 个工具";
        if (e) e.textContent = shown + (shown === 1 ? " tool" : " tools");
      }
      var empty = document.getElementById("resempty");
      if (empty) empty.style.display = shown ? "none" : "";
    }

    document.querySelectorAll("[data-filter]").forEach(function (b) {
      b.addEventListener("click", function () {
        var dim = b.dataset.filter;
        state[dim] = b.dataset.value;
        syncChips(); apply(); writeURL();
      });
    });
    if (qi) qi.addEventListener("input", function () { state.q = qi.value.trim(); apply(); writeURL(); });

    syncChips(); apply();
  }
})();
