(function () {
  'use strict';

  var N_SPIKES  = 8;   // crown spikes
  var N_DROPS   = N_SPIKES;
  var transitioning = false;

  /* Pech'tacom gradient */
  function mkGrad(ctx, w, h) {
    var g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0,    '#FFDA00');
    g.addColorStop(0.52, '#FF5408');
    g.addColorStop(1,    '#FF003D');
    return g;
  }

  /* Radius needed to cover screen from (cx, cy) */
  function coverR(cx, cy) {
    var w = window.innerWidth, h = window.innerHeight;
    return Math.max(
      Math.hypot(cx, cy),
      Math.hypot(w - cx, cy),
      Math.hypot(cx, h - cy),
      Math.hypot(w - cx, h - cy)
    );
  }

  function eo2(t) { return 1 - (1-t)*(1-t); }
  function eo3(t) { return 1 - Math.pow(1-t, 3); }
  function ei3(t) { return t * t * t; }

  function mkCanvas() {
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
    c.width  = window.innerWidth;
    c.height = window.innerHeight;
    document.body.appendChild(c);
    return c;
  }

  /* ─────────────────────────────────────────────
     EXIT — splash crown growing from click point,
     then rapid fill to cover screen
     ───────────────────────────────────────────── */
  function splashOut(cx, cy, onNav) {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var R   = coverR(cx, cy);
    var DUR = 700;
    var t0  = null;
    var navDone = false;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      var w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = mkGrad(ctx, w, h);

      if (t < 0.60) {
        /* ── Phase 1: splash crown ── */
        var p  = eo2(t / 0.60);
        var br = R * 0.12 * p;                               /* base circle radius */
        var sh = R * 0.28 * Math.sin(t / 0.60 * Math.PI);   /* spike height, 0→max→0 */

        /* Crown polygon */
        ctx.beginPath();
        for (var i = 0; i <= N_SPIKES * 2; i++) {
          var a = (i / (N_SPIKES * 2)) * Math.PI * 2 - Math.PI / 2;
          var r = (i % 2 === 0) ? br + sh : br * 0.68;
          if (i === 0) ctx.moveTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
          else          ctx.lineTo(cx + Math.cos(a)*r, cy + Math.sin(a)*r);
        }
        ctx.closePath();
        ctx.fill();

        /* Droplets flying off spike tips */
        if (p > 0.38) {
          var dp = Math.min((p - 0.38) / 0.62, 1);
          ctx.beginPath();
          for (var j = 0; j < N_DROPS; j++) {
            var da   = (j / N_DROPS) * Math.PI * 2 - Math.PI / 2 + (Math.PI / N_DROPS);
            var dist = (br + sh) * (1.06 + dp * 0.70);
            var dr   = Math.max(0, br * 0.16 * (1 - dp * 1.05));
            if (dr < 0.5) continue;
            var ddx = cx + Math.cos(da) * dist;
            var ddy = cy + Math.sin(da) * dist;
            ctx.moveTo(ddx + dr, ddy);
            ctx.arc(ddx, ddy, dr, 0, Math.PI * 2);
          }
          ctx.fill();
        }

      } else {
        /* ── Phase 2: fast radial fill ── */
        var p2    = ei3((t - 0.60) / 0.40);
        var baseR = R * 0.12;                       /* pick up where crown left off */
        ctx.beginPath();
        ctx.arc(cx, cy, baseR + (R - baseR) * p2, 0, Math.PI * 2);
        ctx.fill();

        if (!navDone && p2 > 0.90) {
          navDone = true;
          onNav();
        }
      }

      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ─────────────────────────────────────────────
     ENTER — full gradient cover shrinks away
     from center to reveal the new page
     ───────────────────────────────────────────── */
  function splashIn() {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var cx  = window.innerWidth  / 2;
    var cy  = window.innerHeight / 2;
    var R   = coverR(cx, cy);
    var DUR = 680;
    var t0  = null;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      var w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);

      /* Draw the full gradient */
      ctx.fillStyle = mkGrad(ctx, w, h);
      ctx.fillRect(0, 0, w, h);

      /* Punch a growing hole to reveal the page */
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(cx, cy, R * eo3(t), 0, Math.PI * 2);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      if (t < 1) requestAnimationFrame(tick);
      else        c.remove();
    }
    requestAnimationFrame(tick);
  }

  /* ── Intercept internal link clicks ── */
  document.addEventListener('click', function (e) {
    if (transitioning) return;
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href
      || href.charAt(0) === '#'
      || href.indexOf('://') !== -1
      || href.indexOf('mailto:') === 0
      || href.indexOf('tel:') === 0
      || link.target === '_blank') return;

    e.preventDefault();
    transitioning = true;
    splashOut(e.clientX, e.clientY, function () {
      window.location.href = href;
    });
  });

  /* ── Reveal animation on every page load ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', splashIn);
  } else {
    splashIn();
  }

}());
