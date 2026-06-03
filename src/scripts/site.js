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

  function uiLang() {
    return root.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
  }

  /** Keep the embedded Giscus comment thread in sync with the site theme
     (spec: dark mode must follow the toggle, not just the OS pref). */
  function setGiscusTheme(theme) {
    var f = document.querySelector('iframe.giscus-frame');
    if (!f || !f.contentWindow) return;
    f.contentWindow.postMessage(
      { giscus: { setConfig: { theme: theme } } },
      'https://giscus.app'
    );
  }
  // Push the current theme once Giscus signals it is ready.
  window.addEventListener('message', function (e) {
    if (e.origin === 'https://giscus.app' && e.data && e.data.giscus) {
      setGiscusTheme(root.getAttribute('data-theme'));
    }
  });

  /** Brief inline confirmation on an action button, then restore. */
  function flash(btn, msg) {
    if (btn.dataset.flashing) return;
    btn.dataset.flashing = '1';
    var prev = btn.innerHTML;
    btn.innerHTML = msg;
    setTimeout(function () {
      btn.innerHTML = prev;
      delete btn.dataset.flashing;
    }, 1600);
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
      setGiscusTheme(next);
    } else if (act === 'palette') {
      // When the popup palette exists, intercept the link so we open the
      // overlay instead of navigating to the /search/ fallback page.
      if (document.getElementById('palette')) e.preventDefault();
      togglePalette();
    } else if (act === 'menu') {
      document.body.classList.toggle('nav-open');
    } else if (act === 'share') {
      e.preventDefault();
      var url = location.href;
      var data = { title: document.title, url: url };
      if (navigator.share) {
        navigator.share(data).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).then(function () {
          flash(t, uiLang() === 'zh' ? '✓ 已复制' : '✓ Copied');
        });
      }
    } else if (act === 'save') {
      e.preventDefault();
      toggleSaved(t);
    }
  });
  syncToggles();

  /* ---- Save / bookmark (localStorage, no backend) ----------- */
  var SAVE_KEY = 'ih-saved';
  function savedList() {
    try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]'); } catch (e) { return []; }
  }
  function saveLabel(btn, on) {
    var zh = uiLang() === 'zh';
    btn.innerHTML = on ? (zh ? '★ 已收藏' : '★ Saved') : (zh ? '☆ 收藏' : '☆ Save');
    btn.setAttribute('aria-pressed', String(on));
  }
  function toggleSaved(btn) {
    var key = location.pathname;
    var list = savedList();
    var i = list.indexOf(key);
    if (i >= 0) list.splice(i, 1); else list.push(key);
    localStorage.setItem(SAVE_KEY, JSON.stringify(list));
    saveLabel(btn, i < 0);
  }
  document.querySelectorAll('[data-act="save"]').forEach(function (btn) {
    saveLabel(btn, savedList().indexOf(location.pathname) >= 0);
  });

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

  /* ---- Command palette: live Pagefind search ----------------
     Restores the design's ⌘K popup. Typing queries the Pagefind
     index (generated at build) and renders results inline; empty
     query restores the default "browse phases" list. Pagefind auto-
     selects the index for the page's language. Degrades gracefully
     when the index is absent (e.g. astro dev). */
  var palInput = document.getElementById('palette-input');
  var palList = document.getElementById('palette-list');
  if (palInput && palList) {
    var PHASE_LABEL = {
      zh: { discover: '需求挖掘', design: '设计', build: '开发', market: '营销', business: '商业分析' },
      en: { discover: 'Discover', design: 'Design', build: 'Build', market: 'Market', business: 'Business' }
    };
    var palLang = palList.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
    var defaultHTML = palList.innerHTML;
    var pf = null; // lazily-imported Pagefind module (or 'err')
    var debounce;

    function esc(s) {
      return String(s).replace(/[&<>"]/g, function (c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
      });
    }
    function note(text) {
      palList.innerHTML = '<div class="palette__empty">' + esc(text) + '</div>';
    }
    function ensurePF() {
      if (pf) return Promise.resolve(pf);
      // Variable path keeps Rollup from statically resolving this build-time
      // -absent module; Pagefind is generated into /pagefind/ at build.
      var PF_URL = '/pagefind/pagefind.js';
      return import(/* @vite-ignore */ PF_URL)
        .then(function (m) { pf = m; return m; })
        .catch(function () { pf = 'err'; return 'err'; });
    }
    function row(d) {
      var phase = d.meta && d.meta.phase;
      var title = (d.meta && d.meta.title) || d.url;
      var chip = phase
        ? '<span class="chip" data-phase="' + phase + '"><span class="dot"></span>' +
          ((PHASE_LABEL[palLang] && PHASE_LABEL[palLang][phase]) || phase) + '</span>'
        : '';
      return '<a href="' + d.url + '">' + esc(title) + chip + '</a>';
    }
    function runSearch(q) {
      ensurePF().then(function (lib) {
        if (lib === 'err') { note(palLang === 'zh' ? '搜索暂不可用' : 'Search unavailable'); return; }
        lib.search(q).then(function (res) {
          if (palInput.value.trim() !== q) return; // stale
          var top = res.results.slice(0, 6);
          if (!top.length) { note(palLang === 'zh' ? '没有匹配的结果' : 'No results'); return; }
          Promise.all(top.map(function (r) { return r.data(); })).then(function (datas) {
            if (palInput.value.trim() !== q) return;
            palList.innerHTML = datas.map(row).join('');
          });
        });
      });
    }
    palInput.addEventListener('input', function () {
      var q = palInput.value.trim();
      clearTimeout(debounce);
      if (!q) { palList.innerHTML = defaultHTML; return; }
      debounce = setTimeout(function () { runSearch(q); }, 160);
    });
  }

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
