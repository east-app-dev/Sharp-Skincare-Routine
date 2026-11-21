/* Sharp · motion + attribution */
(function () {
  'use strict';
  var d = document, w = window;
  var reduce = w.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var de = (d.documentElement.lang || '').indexOf('de') === 0;

  // page-load choreography
  requestAnimationFrame(function () { requestAnimationFrame(function () { d.documentElement.classList.add('ready'); }); });

  // hero chips appear one after another
  var chips = $$('.chip');
  chips.forEach(function (c, i) {
    setTimeout(function () { c.classList.add('on'); }, reduce ? 0 : 1300 + i * 420);
  });

  // nav state
  var nav = d.getElementById('nav');
  var onNav = function () { if (nav) nav.classList.toggle('scrolled', w.scrollY > 10); };
  onNav();

  // count-up helper
  function count(el, to, ms) {
    if (reduce) { el.textContent = to; return; }
    var t0 = null;
    function f(t) {
      if (!t0) t0 = t;
      var p = Math.min(1, (t - t0) / ms), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e);
      if (p < 1) requestAnimationFrame(f);
    }
    requestAnimationFrame(f);
  }

  // reveal + one-shot effects
  function activate(el) {
    el.classList.add('in');
    $$('[data-w]', el).forEach(function (b) { b.style.width = b.getAttribute('data-w') + '%'; });
    $$('[data-h]', el).forEach(function (b) { b.style.height = b.getAttribute('data-h') + '%'; });
    $$('[data-count]', el).forEach(function (o) { count(o, parseInt(o.getAttribute('data-count'), 10), 1600); });
  }
  var targets = $$('.r, [data-fx]');
  if (reduce || !('IntersectionObserver' in w)) {
    targets.forEach(activate);
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { activate(e.target); io.unobserve(e.target); } });
    }, { threshold: 0.18, rootMargin: '0px 0px -8% 0px' });
    targets.forEach(function (t) { io.observe(t); });
  }

  // sticky steps: active step drives the phone screen
  var steps = $$('.step'), shots = $$('.phone[data-steps] img');
  function stepTick() {
    if (!steps.length) return;
    var mid = w.innerHeight * 0.5, idx = 0, best = Infinity;
    steps.forEach(function (s, i) {
      var r = s.getBoundingClientRect(), dist = Math.abs(r.top + r.height / 2 - mid);
      if (dist < best) { best = dist; idx = i; }
    });
    steps.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
    shots.forEach(function (s, i) { s.classList.toggle('on', i === idx); });
  }

  // parallax for floating illustrations
  var floats = $$('[data-speed]');
  function para() {
    if (reduce) return;
    var y = w.scrollY;
    floats.forEach(function (f) { f.style.transform = 'translate3d(0,' + (y * parseFloat(f.getAttribute('data-speed'))).toFixed(1) + 'px,0)'; });
  }

  var ticking = false;
  function onScroll() {
    if (ticking) return; ticking = true;
    requestAnimationFrame(function () { ticking = false; onNav(); stepTick(); para(); });
  }
  w.addEventListener('scroll', onScroll, { passive: true });
  w.addEventListener('resize', onScroll);
  stepTick();

  // creator attribution: ?c=<code> routes App Store taps through the tracking function
  var TRACK = 'https://fjiyphiqmtworjezjrzm.supabase.co/functions/v1/track?c=';
  var code = '';
  try { code = new URLSearchParams(w.location.search).get('c') || sessionStorage.getItem('sharp_c') || ''; } catch (e) {}
  code = String(code).toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 32);
  if (code) {
    try { sessionStorage.setItem('sharp_c', code); } catch (e) {}
    $$('a[href*="apps.apple.com"]').forEach(function (a) { a.setAttribute('data-store', '1'); a.href = TRACK + encodeURIComponent(code); });
  }

  // TikTok in-app browser hint (?tt), built only when needed so crawlers never see it
  var store = function (op, k, v) { try { return op === 'get' ? sessionStorage.getItem(k) : sessionStorage.setItem(k, v); } catch (e) { return null; } };
  var qs = w.location.search;
  var has = function (n) { try { return new URLSearchParams(qs).has(n); } catch (e) { return new RegExp('[?&]' + n + '(=|&|$)').test(qs); } };
  var ua = navigator.userAgent || '';
  var isTikTok = /musical_ly|BytedanceWebview|TikTok|trill_/i.test(ua);
  var isIOS = /iPhone|iPad|iPod/.test(ua);
  var isWebView = (isIOS && !/Safari\//.test(ua)) || /; wv\)/.test(ua);
  var debug = has('ttdebug');
  var fromBio = has('tt') || /[?&]src=tiktok/i.test(qs);
  if (fromBio) store('set', 'sharp_tt', '1');
  if (debug || ((fromBio || store('get', 'sharp_tt')) && (isTikTok || isWebView))) {
    var T = de
      ? { h: 'Sharp im Browser öffnen', s1: 'Tippe oben rechts auf <b>•••</b>', s2: 'Tippe auf <b>Im Browser öffnen</b>', n: 'TikTok blockiert App-Store-Links. Safari öffnet sie direkt.', b: 'Weiter zur Seite' }
      : { h: 'Open Sharp in your browser', s1: 'Tap <b>•••</b> in the top right', s2: 'Tap <b>Open in browser</b>', n: 'TikTok blocks App Store links. Safari opens them directly.', b: 'Continue to site' };
    var tt = d.createElement('div');
    tt.className = 'tt-overlay'; tt.setAttribute('role', 'dialog'); tt.setAttribute('aria-modal', 'true'); tt.hidden = true;
    tt.innerHTML = '<svg class="tt-arrow" viewBox="0 0 150 200" fill="none" aria-hidden="true"><path d="M20 196C22 112 70 40 134 13"/><path d="M114.5 8.8L134 13L123.3 29.9"/></svg>' +
      '<div class="tt-card"><h2>' + T.h + '</h2><div class="tt-step"><span class="tt-badge">1</span><span>' + T.s1 + '</span></div>' +
      '<div class="tt-step"><span class="tt-badge">2</span><span>' + T.s2 + '</span></div><p class="tt-note">' + T.n + '</p>' +
      '<button type="button" class="tt-skip">' + T.b + '</button></div>';
    d.body.appendChild(tt);
    var skip = tt.querySelector('.tt-skip');
    var lock = function (on) { d.documentElement.style.overflow = on ? 'hidden' : ''; d.body.style.overflow = on ? 'hidden' : ''; };
    var openTT = function () { tt.hidden = false; lock(true); void tt.offsetWidth; tt.classList.add('show'); skip.focus({ preventScroll: true }); };
    var closeTT = function () { tt.classList.remove('show'); lock(false); store('set', 'sharp_tt_seen', '1'); setTimeout(function () { tt.hidden = true; }, 250); };
    skip.addEventListener('click', closeTT);
    tt.addEventListener('click', function (e) { if (e.target === tt) closeTT(); });
    d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !tt.hidden) closeTT(); });
    d.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="apps.apple.com"], a[data-store]');
      if (!a) return; e.preventDefault(); openTT();
    }, true);
    if (debug || !store('get', 'sharp_tt_seen')) openTT();
  }
})();
