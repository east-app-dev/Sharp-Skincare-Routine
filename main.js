// Sharp landing — nav state, reveal on scroll, hero screen cycling, scan sync, progress bars
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var nav = document.getElementById('nav');
  if (nav) {
    var onNav = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onNav();
    window.addEventListener('scroll', onNav, { passive: true });
  }

  // reveal on scroll
  var revs = Array.prototype.slice.call(document.querySelectorAll('.rev'));
  if (reduce || !('IntersectionObserver' in window)) {
    revs.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('in');
        if (e.target.hasAttribute('data-stagger')) {
          var kids = e.target.querySelectorAll('.note');
          Array.prototype.forEach.call(kids, function (k, i) {
            k.style.transitionDelay = (140 + i * 130) + 'ms';
            k.classList.add('in');
          });
        }
        io.unobserve(e.target);
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
    revs.forEach(function (el) { io.observe(el); });
  }

  // hero screens
  var shots = document.querySelectorAll('.phone.hero-phone img');
  if (shots.length > 1 && !reduce) {
    var i = 0;
    setInterval(function () {
      shots[i].classList.remove('on');
      i = (i + 1) % shots.length;
      shots[i].classList.add('on');
    }, 5200);
  }

  // scan section: step + screen follow scroll progress
  var scan = document.getElementById('scan');
  var steps = document.querySelectorAll('#scan .step');
  var scanShots = document.querySelectorAll('#scan .phone img');
  var progress = document.getElementById('progress');
  var chartBars = document.querySelectorAll('#progress .cb i');
  var raf = null;

  function frac(el, span) {
    if (!el) return 0;
    var r = el.getBoundingClientRect();
    var vh = window.innerHeight;
    return Math.max(0, Math.min(1, (vh * span - r.top) / (r.height + vh * (span - 0.4))));
  }

  function tick() {
    raf = null;
    var p = frac(scan, 0.85);
    var idx = p < 0.36 ? 0 : (p < 0.68 ? 1 : 2);
    Array.prototype.forEach.call(steps, function (s, n) { s.classList.toggle('on', n === idx); });
    Array.prototype.forEach.call(scanShots, function (s, n) { s.classList.toggle('on', n === idx); });

    var pg = reduce ? 1 : frac(progress, 0.8);
    Array.prototype.forEach.call(chartBars, function (b) {
      var base = parseFloat(b.getAttribute('data-h')) || 100;
      b.style.height = Math.round(base * (0.12 + 0.88 * pg)) + '%';
    });
  }

  var onScroll = function () { if (!raf) raf = requestAnimationFrame(tick); };
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  tick();

  // tiktok in-app browser overlay: only for the bio link (?tt) and only inside an in-app webview,
  // so "Open in browser" (same URL, now in Safari) never shows it again
  var tt = document.getElementById('ttOverlay');
  if (tt) {
    var store = function (op, key, val) {
      try { return op === 'get' ? sessionStorage.getItem(key) : sessionStorage.setItem(key, val); } catch (e) { return null; }
    };
    var qs = window.location.search;
    var param = function (name) {
      try { return new URLSearchParams(qs).has(name); } catch (e) { return new RegExp('[?&]' + name + '(=|&|$)').test(qs); }
    };
    var ua = navigator.userAgent || '';
    var isTikTok = /musical_ly|BytedanceWebview|TikTok|trill_/i.test(ua);
    var isIOS = /iPhone|iPad|iPod/.test(ua);
    var isWebView = (isIOS && !/Safari\//.test(ua)) || /; wv\)/.test(ua);
    var debug = param('ttdebug');
    var fromBio = param('tt') || /[?&]src=tiktok/i.test(qs);
    if (fromBio) store('set', 'sharp_tt', '1');
    var active = debug || ((fromBio || store('get', 'sharp_tt')) && (isTikTok || isWebView));

    if (active) {
      var skip = document.getElementById('ttSkip');
      var lock = function (on) {
        document.documentElement.style.overflow = on ? 'hidden' : '';
        document.body.style.overflow = on ? 'hidden' : '';
      };
      var openTT = function () {
        tt.hidden = false;
        lock(true);
        void tt.offsetWidth; // commit display before fading in (rAF can stall in backgrounded webviews)
        tt.classList.add('show');
        if (skip) skip.focus({ preventScroll: true });
      };
      var closeTT = function () {
        tt.classList.remove('show');
        lock(false);
        store('set', 'sharp_tt_seen', '1');
        setTimeout(function () { tt.hidden = true; }, 250);
      };

      if (skip) skip.addEventListener('click', closeTT);
      tt.addEventListener('click', function (e) { if (e.target === tt) closeTT(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tt.hidden) closeTT(); });
      // App Store links are dead inside TikTok: bring the hint back instead
      document.addEventListener('click', function (e) {
        var a = e.target.closest && e.target.closest('a[href*="apps.apple.com"]');
        if (!a) return;
        e.preventDefault();
        openTT();
      }, true);

      if (debug || !store('get', 'sharp_tt_seen')) openTT();
    }
  }
})();
