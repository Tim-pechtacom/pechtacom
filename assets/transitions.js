(function () {
  'use strict';

  var transitioning = false;

  function rnd(a, b) { return a + Math.random() * (b - a); }
  function eo2(t)    { return 1 - (1-t)*(1-t); }
  function eo3(t)    { return 1 - Math.pow(1-t, 3); }
  function eo4(t)    { return 1 - Math.pow(1-t, 4); }

  function coverR(cx, cy) {
    var w = window.innerWidth, h = window.innerHeight;
    return Math.max(Math.hypot(cx,cy), Math.hypot(w-cx,cy),
                    Math.hypot(cx,h-cy), Math.hypot(w-cx,h-cy));
  }

  function mkCanvas() {
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
    c.width = window.innerWidth; c.height = window.innerHeight;
    document.body.appendChild(c);
    return c;
  }

  function mkGrad(ctx, cx, cy, R) {
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R);
    g.addColorStop(0,    '#FFE040');
    g.addColorStop(0.38, '#FF6500');
    g.addColorStop(1,    '#FF003D');
    return g;
  }

  /* ══════════════════════════════════════════
     EXIT — inverse du splashIn :
     disque de gradient grandit depuis le clic
     ══════════════════════════════════════════ */
  function splashOut(cx, cy, onNav) {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var R   = coverR(cx, cy);
    var w   = c.width, h = c.height;
    var DUR = 680, t0 = null, navDone = false;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = mkGrad(ctx, cx, cy, R);
      ctx.beginPath();
      ctx.arc(cx, cy, R * eo3(t), 0, Math.PI * 2);
      ctx.fill();
      if (!navDone && t > 0.87) { navDone = true; onNav(); }
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════
     ENTER — gradient overlay recedes from centre
     ══════════════════════════════════════════ */
  function splashIn() {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var cx  = window.innerWidth/2, cy = window.innerHeight/2;
    var R   = coverR(cx, cy);
    var DUR = 680, t0 = null;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      var w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = mkGrad(ctx, cx, cy, R);
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, R * eo3(t), 0, Math.PI*2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
      if (t < 1) requestAnimationFrame(tick);
      else c.remove();
    }
    requestAnimationFrame(tick);
  }

  /* ── Click interception ── */
  document.addEventListener('click', function (e) {
    if (transitioning) return;
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0)==='#' || href.indexOf('://')!==-1 ||
        href.indexOf('mailto:')===0 || href.indexOf('tel:')===0 ||
        link.target==='_blank') return;
    e.preventDefault();
    transitioning = true;
    splashOut(e.clientX, e.clientY, function () { window.location.href = href; });
  });

  /* ── Reveal on load ── */
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', splashIn);
  else splashIn();

  /* ── bfcache restore (retour arrière) ── */
  window.addEventListener('pageshow', function (e) {
    if (!e.persisted) return;
    transitioning = false;
    document.querySelectorAll('canvas[aria-hidden]').forEach(function (c) { c.remove(); });
    splashIn();
  });

}());
