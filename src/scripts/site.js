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

  /* ---- Live search: ⌘K palette + /search/ page --------------
     Both query a build-time JSON index (/search-index.json) so results
     are fine-grained — every article AND every tool is its own hit,
     not just the page that contains it. Pure client-side, no backend. */
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  var T = {
    zh: { tool: '工具', article: '文章', none: '没有匹配的结果', err: '搜索暂不可用' },
    en: { tool: 'Tool', article: 'Article', none: 'No results', err: 'Search unavailable' }
  };
  var SEARCH_INDEX = null;
  function loadIndex() {
    if (SEARCH_INDEX) return Promise.resolve(SEARCH_INDEX);
    return fetch('/search-index.json')
      .then(function (r) { return r.json(); })
      .then(function (d) { SEARCH_INDEX = d; return d; })
      .catch(function () { SEARCH_INDEX = 'err'; return 'err'; });
  }
  /** Score + filter index items for a query in the active language.
     Matches across title / tags / category / description (AND over
     whitespace tokens); ranks title and tag/category hits highest. */
  function searchItems(items, q, lang) {
    var tokens = q.toLowerCase().split(/\s+/).filter(Boolean);
    if (!tokens.length) return [];
    var out = [];
    items.forEach(function (it) {
      if (it.lang !== lang) return;
      var title = (it.title || '').toLowerCase();
      var meta = ((it.tags || []).join(' ') + ' ' + (it.cat || '')).toLowerCase();
      var desc = (it.desc || '').toLowerCase();
      var hay = title + '' + meta + '' + desc;
      var ok = tokens.every(function (t) { return hay.indexOf(t) >= 0; });
      if (!ok) return;
      var score = 0;
      tokens.forEach(function (t) {
        if (title.indexOf(t) === 0) score += 12;
        else if (title.indexOf(t) >= 0) score += 8;
        if (meta.indexOf(t) >= 0) score += 5;
        if (desc.indexOf(t) >= 0) score += 2;
      });
      out.push({ it: it, score: score });
    });
    out.sort(function (a, b) { return b.score - a.score || a.it.title.length - b.it.title.length; });
    return out.map(function (s) { return s.it; });
  }
  /** Compact row for the ⌘K palette. */
  function paletteRow(it, lang) {
    var label = T[lang][it.type];
    var ext = it.type === 'tool' ? ' target="_blank" rel="noopener noreferrer"' : '';
    var title = it.type === 'tool' && it.cat ? it.title + ' · ' + it.cat : it.title;
    return '<a href="' + it.url + '"' + ext + '>' + esc(title) +
      '<span class="chip" data-phase="' + it.phase + '"><span class="dot"></span>' + label + '</span></a>';
  }
  /** Richer card for the /search/ results page. */
  function resultCard(it, lang) {
    var label = T[lang][it.type];
    var ext = it.type === 'tool' ? ' target="_blank" rel="noopener noreferrer"' : '';
    var sub = it.type === 'tool' && it.cat ? '<span class="sresult__cat">' + esc(it.cat) + '</span>' : '';
    return '<a class="sresult" href="' + it.url + '"' + ext + ' data-phase="' + it.phase + '">' +
      '<div class="sresult__head"><span class="sresult__title">' + esc(it.title) + '</span>' +
      '<span class="chip" data-phase="' + it.phase + '"><span class="dot"></span>' + label + '</span></div>' +
      (it.desc ? '<p class="sresult__desc">' + esc(it.desc) + '</p>' : '') + sub + '</a>';
  }
  /** Wire an input + list pair to the live index. */
  function wireSearch(input, list, opts) {
    var lang = (opts.lang === 'en') ? 'en' : 'zh';
    var limit = opts.limit || 8;
    var render = opts.render;
    var onEmpty = opts.onEmpty || function () { list.innerHTML = ''; };
    var debounce;
    function run(q) {
      loadIndex().then(function (items) {
        if (input.value.trim() !== q) return; // stale
        if (items === 'err') { list.innerHTML = '<div class="palette__empty">' + T[lang].err + '</div>'; return; }
        var res = searchItems(items, q, lang).slice(0, limit);
        if (!res.length) { list.innerHTML = '<div class="palette__empty">' + T[lang].none + '</div>'; return; }
        list.innerHTML = res.map(function (it) { return render(it, lang); }).join('');
      });
    }
    input.addEventListener('input', function () {
      var q = input.value.trim();
      clearTimeout(debounce);
      if (!q) { onEmpty(); return; }
      debounce = setTimeout(function () { run(q); }, 120);
    });
  }

  // ⌘K palette
  var palInput = document.getElementById('palette-input');
  var palList = document.getElementById('palette-list');
  if (palInput && palList) {
    var palLang = palList.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
    var palDefault = palList.innerHTML;
    wireSearch(palInput, palList, {
      lang: palLang, limit: 7, render: paletteRow,
      onEmpty: function () { palList.innerHTML = palDefault; }
    });
    // Warm the index as soon as the palette opens.
    palInput.addEventListener('focus', loadIndex, { once: true });
  }

  // /search/ results page
  var siteInput = document.getElementById('site-search-input');
  var siteList = document.getElementById('site-search-list');
  if (siteInput && siteList) {
    var siteLang = siteList.getAttribute('data-lang') === 'en' ? 'en' : 'zh';
    var siteDefault = siteList.innerHTML;
    wireSearch(siteInput, siteList, {
      lang: siteLang, limit: 30, render: resultCard,
      onEmpty: function () { siteList.innerHTML = siteDefault; }
    });
    // Support ?q= deep links and the nav search box landing here.
    var q0 = new URLSearchParams(location.search).get('q');
    if (q0) { siteInput.value = q0; siteInput.dispatchEvent(new Event('input')); }
    siteInput.focus();
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
