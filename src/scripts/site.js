/* =============================================================
   site.js — progressive-enhancement client script (Task 18a)
   Ported from the frozen Variant A design. No framework.
   Works without JS; enhances with it.

   KEEPS:  `js` class · theme persistence (ih-theme, light-first) ·
           ⌘K command palette toggle · mobile menu toggle ·
           reveal-on-scroll · resource filter (#resgrid) with URL state.
   DROPS:  language toggle (server-rendered per URL in Astro) ·
           newsletter mock submit (real Buttondown form handles submit).
   ============================================================= */
(function () {
  var root = document.documentElement;
  root.classList.add('js');

  /* ---- Persisted theme --------------------------------------
     Light-first by intent: default light regardless of OS pref;
     only honor an explicit user choice persisted from before.
     The pre-paint inline <head> script already sets data-theme to
     avoid FOUC; this line keeps the attribute correct if that script
     did not run. */
  var savedTheme = localStorage.getItem('ih-theme');
  root.setAttribute('data-theme', savedTheme === 'dark' ? 'dark' : 'light');

  /** Reflect current theme onto every [data-act="theme"] toggle. */
  function syncToggles() {
    var dark = root.getAttribute('data-theme') === 'dark';
    document.querySelectorAll("[data-act='theme']").forEach(function (b) {
      b.setAttribute('aria-pressed', String(dark));
    });
  }

  document.addEventListener('click', function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.dataset.act;
    if (act === 'theme') {
      var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      localStorage.setItem('ih-theme', next);
      syncToggles();
    } else if (act === 'palette') {
      togglePalette();
    } else if (act === 'menu') {
      document.body.classList.toggle('nav-open');
    }
  });
  syncToggles();

  /* ---- Command palette (⌘K / Ctrl+K) ------------------------
     If a #palette dialog exists, toggle it. Otherwise be honest and
     send the user to the search page (en mirror aware). The search
     button links to the same destination. */
  function searchPath() {
    return root.getAttribute('data-lang') === 'en' ? '/en/search/' : '/search/';
  }
  function togglePalette() {
    var p = document.getElementById('palette');
    if (!p) {
      location.href = searchPath();
      return;
    }
    var open = p.classList.toggle('open');
    if (open) {
      var i = p.querySelector('input');
      if (i) i.focus();
    }
  }
  document.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      togglePalette();
    }
    if (e.key === 'Escape') {
      var p = document.getElementById('palette');
      if (p) p.classList.remove('open');
    }
  });

  /* ---- Reveal on scroll -------------------------------------
     `.js .reveal` is hidden-initial (base.css); add `.in` to animate.
     Reduced-motion / no-IO fallback reveals everything immediately. */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(
      function (ents) {
        ents.forEach(function (en) {
          if (en.isIntersecting) {
            en.target.classList.add('in');
            io.unobserve(en.target);
          }
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );
    reveals.forEach(function (el, i) {
      el.style.transitionDelay = (i % 6) * 45 + 'ms';
      io.observe(el);
    });
  } else {
    reveals.forEach(function (el) {
      el.classList.add('in');
    });
  }

  /* ---- Resource filtering (phase pages) with URL state ------
     Server-rendered .rcard cards inside #resgrid carry
     data-phase / data-cat / data-price / data-tags.
     URL keys: phase / cat / price / q (history.replaceState). */
  var grid = document.getElementById('resgrid');
  if (grid) {
    var DIMS = ['phase', 'cat', 'price'];
    var params = new URLSearchParams(location.search);
    var state = {
      phase: params.get('phase') || grid.getAttribute('data-default-phase') || 'all',
      cat: params.get('cat') || 'all',
      price: params.get('price') || 'all',
      q: params.get('q') || ''
    };
    var cards = Array.prototype.slice.call(grid.querySelectorAll('.rcard'));
    var countEl = document.getElementById('rescount');
    var qi = document.getElementById('resq');
    if (qi && state.q) qi.value = state.q;

    function writeURL() {
      var p = new URLSearchParams();
      DIMS.forEach(function (d) {
        if (state[d] && state[d] !== 'all') p.set(d, state[d]);
      });
      if (state.q) p.set('q', state.q);
      var qs = p.toString();
      history.replaceState(null, '', qs ? '?' + qs : location.pathname);
    }

    function syncChips() {
      document.querySelectorAll('[data-filter]').forEach(function (b) {
        var on = state[b.dataset.filter] === b.dataset.value;
        b.setAttribute('aria-pressed', String(on));
      });
    }

    /** Write the visible-count label. Pages render one language
        server-side, so write plain text in the active lang. */
    function writeCount(shown) {
      if (!countEl) return;
      var lang = root.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
      var label = lang === 'zh'
        ? shown + ' 个工具'
        : shown + (shown === 1 ? ' tool' : ' tools');
      countEl.textContent = label;
    }

    function apply() {
      var shown = 0;
      cards.forEach(function (c) {
        var okPhase = state.phase === 'all' || c.dataset.phase === state.phase;
        var okCat = state.cat === 'all' || c.dataset.cat === state.cat;
        var okPrice = state.price === 'all' || c.dataset.price === state.price;
        var hay = ((c.dataset.tags || '') + ' ' + c.textContent).toLowerCase();
        var okQ = !state.q || hay.indexOf(state.q.toLowerCase()) >= 0;
        var vis = okPhase && okCat && okPrice && okQ;
        c.style.display = vis ? '' : 'none';
        if (vis) shown++;
      });
      writeCount(shown);
      var empty = document.getElementById('resempty');
      if (empty) empty.style.display = shown ? 'none' : '';
    }

    document.querySelectorAll('[data-filter]').forEach(function (b) {
      b.addEventListener('click', function () {
        var dim = b.dataset.filter;
        state[dim] = b.dataset.value;
        syncChips();
        apply();
        writeURL();
      });
    });
    if (qi) {
      qi.addEventListener('input', function () {
        state.q = qi.value.trim();
        apply();
        writeURL();
      });
    }

    syncChips();
    apply();
  }
})();
