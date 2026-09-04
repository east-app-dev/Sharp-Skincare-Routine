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
})();
