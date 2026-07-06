// OneX Academy — shared site behaviour.
// Handles: base-path resolution (works at domain root AND GitHub Pages /repo/),
// header/footer includes, nav, FAQ accordion, scroll reveal, counters, progress bar.
(function () {
  // On *.github.io project sites the site lives under /<repo>/ — everything
  // root-relative must be prefixed. Locally (or on a custom domain) base is '/'.
  var BASE = '/';
  if (/\.github\.io$/i.test(window.location.hostname)) {
    var seg = window.location.pathname.split('/')[1];
    if (seg) BASE = '/' + seg + '/';
  }

  function rebaseRootLinks(scope) {
    if (BASE === '/') return;
    (scope || document).querySelectorAll('a[href^="/"]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (href.indexOf(BASE) !== 0) a.setAttribute('href', BASE + href.replace(/^\//, ''));
    });
  }

  async function includePartials() {
    var slots = document.querySelectorAll('[data-include]');
    await Promise.all(
      Array.prototype.map.call(slots, async function (slot) {
        var name = slot.getAttribute('data-include');
        try {
          var res = await fetch(BASE + 'partials/' + name + '.html');
          slot.innerHTML = await res.text();
          rebaseRootLinks(slot);
        } catch (e) {
          console.error('Failed to include partial:', name, e);
        }
      })
    );
  }

  function markActiveNav() {
    var path = window.location.pathname.replace(/index\.html$/, '');
    if (BASE !== '/') path = '/' + path.slice(BASE.length);
    document.querySelectorAll('.nav-links a').forEach(function (a) {
      var href = a.getAttribute('href');
      if (BASE !== '/' && href.indexOf(BASE) === 0) href = '/' + href.slice(BASE.length);
      if (href === path || (href !== '/' && path.indexOf(href) === 0)) {
        a.setAttribute('aria-current', 'page');
      }
    });
  }

  function initNavToggle() {
    var toggle = document.querySelector('.nav-toggle');
    var links = document.querySelector('.nav-links');
    if (!toggle || !links) return;
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    links.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { links.classList.remove('is-open'); });
    });
  }

  function initFaq() {
    document.querySelectorAll('.faq-item').forEach(function (item) {
      var btn = item.querySelector('.faq-q');
      var panel = item.querySelector('.faq-a');
      if (!btn || !panel) return;
      btn.addEventListener('click', function () {
        var isOpen = item.getAttribute('data-open') === 'true';
        document.querySelectorAll('.faq-item').forEach(function (other) {
          other.setAttribute('data-open', 'false');
          other.querySelector('.faq-a').style.maxHeight = null;
        });
        if (!isOpen) {
          item.setAttribute('data-open', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  }

  function initReveal() {
    var els = document.querySelectorAll('.reveal, .reveal-stagger');
    if (!('IntersectionObserver' in window) || !els.length) {
      els.forEach(function (el) { el.classList.add('is-visible'); });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    els.forEach(function (el) { io.observe(el); });
  }

  // Animated count-up for elements like <span data-count="1500" data-suffix="+">
  function initCounters() {
    var counters = document.querySelectorAll('[data-count]');
    if (!counters.length) return;
    function animate(el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var duration = 1800;
      var start = null;
      function tick(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / duration, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.innerHTML = Math.round(target * eased) + '<span class="suffix">' + suffix + '</span>';
        if (p < 1) requestAnimationFrame(tick);
      }
      requestAnimationFrame(tick);
    }
    if (!('IntersectionObserver' in window)) {
      counters.forEach(function (el) {
        el.innerHTML = el.getAttribute('data-count') + '<span class="suffix">' + (el.getAttribute('data-suffix') || '') + '</span>';
      });
      return;
    }
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            animate(entry.target);
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { io.observe(el); });
  }

  // 3D tilt-on-hover for cards — pointer position drives rotateX/rotateY plus a
  // moving light sheen, so depth reacts to the cursor instead of a static effect.
  function initTiltCards() {
    var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion || !window.matchMedia || !window.matchMedia('(hover: hover)').matches) return;
    var cards = document.querySelectorAll('.tilt');
    cards.forEach(function (card) {
      var max = 9;
      function onMove(e) {
        var rect = card.getBoundingClientRect();
        var px = (e.clientX - rect.left) / rect.width;
        var py = (e.clientY - rect.top) / rect.height;
        var rx = (0.5 - py) * max * 2;
        var ry = (px - 0.5) * max * 2;
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateZ(6px)';
        card.style.setProperty('--mx', (px * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (py * 100).toFixed(1) + '%');
      }
      function onLeave() {
        card.style.transform = '';
      }
      card.addEventListener('mousemove', onMove);
      card.addEventListener('mouseleave', onLeave);
    });
  }

  // path-tabs — homepage career-path showcase. Click a tab, show its panel,
  // hide the rest. Plain click handlers + ARIA state, no framework needed.
  function initPathTabs() {
    var tabs = document.querySelectorAll('.path-tab');
    if (!tabs.length) return;
    tabs.forEach(function (tab) {
      tab.addEventListener('click', function () {
        var targetId = tab.getAttribute('aria-controls');
        tabs.forEach(function (t) { t.setAttribute('aria-selected', 'false'); });
        document.querySelectorAll('.path-panel').forEach(function (p) { p.classList.remove('is-active'); });
        tab.setAttribute('aria-selected', 'true');
        var panel = document.getElementById(targetId);
        if (panel) panel.classList.add('is-active');
      });
    });
  }

  function initProgressBar() {
    var bar = document.createElement('div');
    bar.className = 'scroll-progress';
    document.body.appendChild(bar);
    function update() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + '%';
    }
    document.addEventListener('scroll', update, { passive: true });
    update();
  }

  document.addEventListener('DOMContentLoaded', async function () {
    rebaseRootLinks(document);
    await includePartials();
    markActiveNav();
    initNavToggle();
    initFaq();
    initReveal();
    initCounters();
    initProgressBar();
    initTiltCards();
    initPathTabs();
  });
})();
