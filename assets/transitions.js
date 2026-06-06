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

  /* ── Organic blob shape (array of {a, r} precomputed offsets) ── */
  function genShape(nPts, irreg) {
    var pts = [];
    for (var i = 0; i < nPts; i++) {
      pts.push({
        a: (i / nPts) * Math.PI * 2 + rnd(-0.28, 0.28),
        r: 1 + rnd(-irreg, irreg)
      });
    }
    return pts;
  }

  /* Draw blob as smooth quadratic-bezier closed curve */
  function drawBlob(ctx, x, y, size, shape) {
    if (size < 1) return;
    var n = shape.length;
    var pts = [];
    for (var i = 0; i < n; i++) {
      pts.push({
        x: x + Math.cos(shape[i].a) * size * shape[i].r,
        y: y + Math.sin(shape[i].a) * size * shape[i].r
      });
    }
    ctx.beginPath();
    ctx.moveTo((pts[n-1].x + pts[0].x)/2, (pts[n-1].y + pts[0].y)/2);
    for (var j = 0; j < n; j++) {
      var cur = pts[j], nxt = pts[(j+1) % n];
      ctx.quadraticCurveTo(cur.x, cur.y, (cur.x+nxt.x)/2, (cur.y+nxt.y)/2);
    }
    ctx.closePath();
  }

  /* ── Splash fingers — highly variable lengths ── */
  function genFingers(n) {
    var fingers = [], offset = rnd(0, Math.PI*2/n);
    for (var i = 0; i < n; i++) {
      fingers.push({
        angle:  offset + (i/n)*Math.PI*2 + rnd(-0.38, 0.38),
        height: rnd(0.03, 0.42),   /* huge range: short stub to very long */
        width:  rnd(0.006, 0.024),
        delay:  rnd(0, 0.14),
        dur:    rnd(0.28, 0.62)
      });
    }
    return fingers;
  }

  /* ══════════════════════════════════════════
     EXIT — blob organique grossit depuis le clic
     (inverse du splashIn : remplit au lieu de percer)
     ══════════════════════════════════════════ */
  function splashOut(cx, cy, onNav) {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var R   = coverR(cx, cy);
    var w   = c.width, h = c.height;

    var shape   = genShape(Math.round(rnd(14, 20)), rnd(0.12, 0.24));
    var fingers = genFingers(Math.round(rnd(9, 16)));
    var DUR     = 720;
    var t0 = null, navDone = false;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = mkGrad(ctx, cx, cy, R * 1.4);

      /* Blob principal : grossit depuis le clic jusqu'à couvrir l'écran */
      drawBlob(ctx, cx, cy, R * 1.05 * eo3(t), shape);
      ctx.fill();

      /* Doigts : jaillissent pendant les premiers 40% */
      if (t < 0.40) {
        var fp = t / 0.40;
        for (var j = 0; j < fingers.length; j++) {
          var f  = fingers[j];
          var ft = (fp - f.delay) / f.dur;
          if (ft <= 0 || ft >= 1) continue;
          var fh = R * f.height * Math.sin(ft * Math.PI);
          var fw = R * f.width;
          if (fh < 1) continue;
          ctx.save();
          ctx.translate(cx + Math.cos(f.angle)*fh*0.5, cy + Math.sin(f.angle)*fh*0.5);
          ctx.rotate(f.angle + Math.PI/2);
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(1, fw), Math.max(1, fh*0.52), 0, 0, Math.PI*2);
          ctx.fill();
          ctx.restore();
        }
      }

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
