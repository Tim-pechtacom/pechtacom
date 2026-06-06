(function () {
  'use strict';

  /* Inject the splash overlay into the page */
  var overlay = document.createElement('div');
  overlay.setAttribute('aria-hidden', 'true');
  overlay.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999',
    'pointer-events:none', 'overflow:hidden'
  ].join(';');

  var blob = document.createElement('div');
  blob.style.cssText = [
    'position:absolute',
    'width:60px', 'height:60px',
    'border-radius:50%',
    'background:linear-gradient(135deg,#FFDA00 0%,#FF5408 52%,#FF003D 100%)',
    'transform:scale(0)',
    'will-change:transform'
  ].join(';');

  overlay.appendChild(blob);
  document.body.appendChild(overlay);

  /* Calculate the scale needed to cover the screen from a given point */
  function coverScale(cx, cy) {
    var corners = [
      [0, 0], [window.innerWidth, 0],
      [0, window.innerHeight], [window.innerWidth, window.innerHeight]
    ];
    var maxDist = Math.max.apply(null, corners.map(function (c) {
      return Math.sqrt(Math.pow(c[0] - cx, 2) + Math.pow(c[1] - cy, 2));
    }));
    return Math.ceil(maxDist / 30) + 4; /* 30 = blob radius (60px / 2) */
  }

  /* Reveal: blob shrinks away to uncover the new page */
  function reveal() {
    var cx = window.innerWidth / 2;
    var cy = window.innerHeight / 2;
    var sc = coverScale(cx, cy);

    blob.style.transition = 'none';
    blob.style.borderRadius = '50%';
    blob.style.top  = (cy - 30) + 'px';
    blob.style.left = (cx - 30) + 'px';
    blob.style.transform = 'scale(' + sc + ')';

    /* Double rAF ensures the covered state is painted before animating */
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        blob.style.transition = 'transform 680ms cubic-bezier(0.22, 1, 0.36, 1)';
        blob.style.transform = 'scale(0)';
      });
    });
  }

  /* Cover: blob grows from the click point to cover the page */
  function cover(cx, cy, cb) {
    var sc = coverScale(cx, cy);

    blob.style.transition = 'none';
    blob.style.top  = (cy - 30) + 'px';
    blob.style.left = (cx - 30) + 'px';
    /* Start as an organic blob shape for the "splash" feel */
    blob.style.borderRadius = '60% 40% 55% 45% / 50% 60% 40% 50%';
    blob.style.transform = 'scale(0)';

    requestAnimationFrame(function () {
      blob.style.transition = [
        'transform 560ms cubic-bezier(0.77, 0, 0.18, 1)',
        'border-radius 420ms ease'
      ].join(',');
      blob.style.transform = 'scale(' + sc + ')';
      blob.style.borderRadius = '50%';
      setTimeout(cb, 560);
    });
  }

  /* Intercept internal link clicks */
  document.addEventListener('click', function (e) {
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
    var cx = e.clientX, cy = e.clientY;
    cover(cx, cy, function () {
      window.location.href = href;
    });
  });

  /* Run reveal when DOM is ready */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reveal);
  } else {
    reveal();
  }

}());
