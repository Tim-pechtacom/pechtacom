(function () {
  'use strict';

  var transitioning = false;

  /* ── Helpers ── */
  function rnd(a, b)  { return a + Math.random() * (b - a); }
  function eo3(t)     { return 1 - Math.pow(1 - t, 3); }
  function eo4(t)     { return 1 - Math.pow(1 - t, 4); }

  function coverR(cx, cy) {
    var w = window.innerWidth, h = window.innerHeight;
    return Math.max(Math.hypot(cx, cy), Math.hypot(w-cx, cy),
                    Math.hypot(cx, h-cy), Math.hypot(w-cx, h-cy));
  }

  function mkCanvas() {
    var c = document.createElement('canvas');
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;z-index:9999;pointer-events:none;';
    c.width = window.innerWidth; c.height = window.innerHeight;
    document.body.appendChild(c);
    return c;
  }

  /* Radial gradient — warm at click point, rose at edges */
  function mkGrad(ctx, cx, cy, R) {
    var g = ctx.createRadialGradient(cx, cy, 0, cx, cy, R * 1.4);
    g.addColorStop(0,    '#FFEF5E');
    g.addColorStop(0.35, '#FF8C00');
    g.addColorStop(0.75, '#FF3D00');
    g.addColorStop(1,    '#FF003D');
    return g;
  }

  /* ── Spike config (randomised per click) ── */
  function genSpikes(nSpikes, baseR, maxH) {
    var spikes = [];
    var rotOffset = rnd(0, (Math.PI * 2) / nSpikes);
    for (var i = 0; i < nSpikes; i++) {
      var baseAngle = rotOffset + (i / nSpikes) * Math.PI * 2;
      spikes.push({
        angle:     baseAngle + rnd(-0.25, 0.25),
        maxH:      rnd(0.55, 1.0) * maxH,
        width:     rnd(0.055, 0.13) * baseR,
        phase0:    rnd(0, 0.18),       /* launch delay (fraction of splash phase) */
        phaseLen:  rnd(0.55, 0.88)     /* how long the spike lasts */
      });
    }
    return spikes;
  }

  /* ── Droplet config (randomised per click) ── */
  function genDroplets(n, baseR, maxH) {
    var drops = [];
    for (var i = 0; i < n; i++) {
      drops.push({
        angle:   rnd(0, Math.PI * 2),
        initR:   (baseR + maxH) * rnd(0.65, 1.15),
        vel:     rnd(0.18, 0.55),      /* outward speed (fraction of R per unit time) */
        grav:    rnd(0.15, 0.55),      /* downward acceleration */
        size:    rnd(2.5, 9),
        delay:   rnd(0.15, 0.45),      /* when it appears (fraction of splash phase) */
        life:    rnd(0.35, 0.70)       /* how long it lives (fraction of splash phase) */
      });
    }
    return drops;
  }

  /* ══════════════════════════════════════════
     EXIT — organic splash from click point
     ══════════════════════════════════════════ */
  function splashOut(cx, cy, onNav) {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var R   = coverR(cx, cy);
    var w   = c.width, h = c.height;

    var nSpikes  = Math.round(rnd(6, 11));
    var maxH     = R * rnd(0.22, 0.32);
    var spikes   = genSpikes(nSpikes, R * 0.12, maxH);
    var drops    = genDroplets(Math.round(rnd(10, 20)), R * 0.12, maxH);
    var DUR      = rnd(680, 820);
    var SPLASH   = 0.58;    /* fraction of DUR spent on splash phase */
    var t0 = null, navDone = false;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = mkGrad(ctx, cx, cy, R);

      if (t < SPLASH) {
        var p     = t / SPLASH;            /* 0→1 through splash phase */
        var baseR = R * 0.10 * Math.min(p * 4, 1);   /* base circle: grows fast */

        /* ── Base circle ── */
        ctx.beginPath();
        ctx.arc(cx, cy, Math.max(baseR, 1), 0, Math.PI * 2);
        ctx.fill();

        /* ── Spikes (elongated ellipses pointing outward) ── */
        for (var i = 0; i < spikes.length; i++) {
          var sp  = spikes[i];
          var sp_p = (p - sp.phase0) / sp.phaseLen;
          if (sp_p <= 0 || sp_p >= 1) continue;

          /* spike height follows a sine arch (rises then falls) */
          var sH = sp.maxH * Math.sin(sp_p * Math.PI);
          var sW = sp.width * Math.pow(Math.sin(sp_p * Math.PI), 0.4);
          if (sH < 1) continue;

          var dist = baseR + sH * 0.5;
          ctx.save();
          ctx.translate(cx + Math.cos(sp.angle) * dist,
                        cy + Math.sin(sp.angle) * dist);
          ctx.rotate(sp.angle + Math.PI / 2);
          ctx.beginPath();
          ctx.ellipse(0, 0, Math.max(1, sW), Math.max(1, sH * 0.52 + baseR * 0.08),
                      0, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }

        /* ── Droplets with gravity ── */
        for (var j = 0; j < drops.length; j++) {
          var dr = drops[j];
          if (p < dr.delay) continue;
          var dt = (p - dr.delay);
          if (dt > dr.life) continue;

          var frac  = dt / dr.life;
          var alpha = 1 - Math.pow(frac, 1.5);
          var dist2 = dr.initR + dr.vel * R * dt * 2.2;
          var gravY = 0.5 * dr.grav * dt * dt * R * 3.5;
          var dSize = dr.size * (1 - frac * 0.6);

          ctx.globalAlpha = Math.max(0, alpha);
          ctx.beginPath();
          ctx.arc(cx + Math.cos(dr.angle) * dist2,
                  cy + Math.sin(dr.angle) * dist2 + gravY,
                  Math.max(0.5, dSize), 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

      } else {
        /* ── Rapid radial fill ── */
        var p2 = eo4((t - SPLASH) / (1 - SPLASH));
        ctx.beginPath();
        ctx.arc(cx, cy, R * 0.10 + (R * 0.92) * p2, 0, Math.PI * 2);
        ctx.fill();

        if (!navDone && p2 > 0.88) { navDone = true; onNav(); }
      }

      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }

  /* ══════════════════════════════════════════
     ENTER — full overlay recedes from centre
     ══════════════════════════════════════════ */
  function splashIn() {
    var c   = mkCanvas();
    var ctx = c.getContext('2d');
    var cx  = window.innerWidth  / 2;
    var cy  = window.innerHeight / 2;
    var R   = coverR(cx, cy);
    var DUR = 700;
    var t0  = null;

    function tick(now) {
      if (!t0) t0 = now;
      var t = Math.min((now - t0) / DUR, 1);
      var w = c.width, h = c.height;
      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = mkGrad(ctx, cx, cy, R);
      ctx.fillRect(0, 0, w, h);

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

  /* ── Intercept internal navigation ── */
  document.addEventListener('click', function (e) {
    if (transitioning) return;
    var link = e.target.closest('a[href]');
    if (!link) return;
    var href = link.getAttribute('href');
    if (!href || href.charAt(0) === '#' || href.indexOf('://') !== -1 ||
        href.indexOf('mailto:') === 0 || href.indexOf('tel:') === 0 ||
        link.target === '_blank') return;

    e.preventDefault();
    transitioning = true;
    splashOut(e.clientX, e.clientY, function () {
      window.location.href = href;
    });
  });

  /* ── Reveal on page load ── */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', splashIn);
  } else {
    splashIn();
  }

}());
