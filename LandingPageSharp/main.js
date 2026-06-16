// Sharp landing — nav state, reveal-on-scroll, score animations, FAQ
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Sticky nav border
  var nav = document.getElementById('nav');
  if (nav) {
    var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 8); };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  // Reveal on scroll
  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  if (reduce || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -8% 0px' });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  // Score gauge (open ring) + bars + counter — animate when in view
  var media = document.querySelector('.gauge');
  var C = 2 * Math.PI * 93, ARC = 0.78; // r=93, 22% bottom gap
  function runScore() {
    var fg = document.querySelector('.g-fg');
    var num = document.querySelector('.ring-num');
    var target = num ? (parseInt(num.getAttribute('data-count'), 10) || 66) : 66;
    // sub-score bars
    document.querySelectorAll('.sb-fill').forEach(function (f) {
      f.style.width = (f.getAttribute('data-w') || 0) + '%';
    });
    var setGauge = function (v) {
      if (fg) fg.style.strokeDasharray = (C * ARC * (v / 100)).toFixed(1) + ' ' + C.toFixed(1);
    };
    if (reduce) { if (num) num.textContent = target; setGauge(target); return; }
    var start = null, dur = 1300;
    var step = function (ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = target * eased;
      if (num) num.textContent = Math.round(v);
      setGauge(v);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  if (media) {
    if (reduce || !('IntersectionObserver' in window)) { runScore(); }
    else {
      var io2 = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { runScore(); io2.disconnect(); }
        });
      }, { threshold: 0.4 });
      io2.observe(media);
    }
  }

  // FAQ — single open at a time
  var qs = Array.prototype.slice.call(document.querySelectorAll('.faq .q'));
  qs.forEach(function (d) {
    d.addEventListener('toggle', function () {
      if (d.open) qs.forEach(function (o) { if (o !== d) o.open = false; });
    });
  });
})();
