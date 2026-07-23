(function () {
  'use strict';

  var lb     = document.getElementById('lightbox');
  var lbBody = document.getElementById('lightboxContent');
  var lbX    = document.getElementById('lightboxClose');
  if (!lb || !lbBody) return;

  var items   = [];
  var current = 0;
  var lbVid   = null;

  /* ── Collect gallery items in DOM order ── */
  document.querySelectorAll('.galerie-grid > *').forEach(function (el) {
    var isVideo = !!el.dataset.video;
    var img     = el.querySelector('img');
    if (isVideo) {
      var idx = items.length;
      items.push({ src: el.dataset.video, type: 'video' });
      el.addEventListener('click', function () { lbOpen(idx); });
    } else if (img) {
      var idx = items.length;
      items.push({ src: img.src, type: 'image' });
      img.style.cursor = 'zoom-in';
      img.addEventListener('click', function () { lbOpen(idx); });
    }
  });

  /* ── Structure : [prev] [content] [next] côte à côte ── */
  var lbInner = document.createElement('div');
  lbInner.className = 'lb-inner';
  lb.insertBefore(lbInner, lbBody);

  var lbPrev = document.createElement('button');
  lbPrev.className = 'lb-arrow lb-prev';
  lbPrev.setAttribute('aria-label', 'Précédent');
  lbPrev.innerHTML = '&#8249;';

  var lbNext = document.createElement('button');
  lbNext.className = 'lb-arrow lb-next';
  lbNext.setAttribute('aria-label', 'Suivant');
  lbNext.innerHTML = '&#8250;';

  lbInner.appendChild(lbBody);
  lbInner.appendChild(lbPrev);
  lbInner.appendChild(lbNext);

  /* ── Render ── */
  function lbRender(idx) {
    var item = items[idx];
    if (lbVid) { lbVid.pause(); lbVid = null; }
    lbBody.innerHTML = '';

    if (item.type === 'video') {
      var v = document.createElement('video');
      v.src = item.src; v.controls = true; v.autoplay = true; v.playsinline = true;
      lbBody.appendChild(v); lbVid = v;
    } else {
      var img = document.createElement('img');
      img.src = item.src;
      lbBody.appendChild(img);
    }

    lbPrev.style.opacity      = idx > 0                ? '1'    : '0.25';
    lbNext.style.opacity      = idx < items.length - 1 ? '1'    : '0.25';
    lbPrev.style.pointerEvents = idx > 0                ? 'auto' : 'none';
    lbNext.style.pointerEvents = idx < items.length - 1 ? 'auto' : 'none';
  }

  /* ── Open / close ── */
  function lbOpen(idx) {
    current = idx;
    lbRender(idx);
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false');
    document.body.style.overflow = 'hidden';
  }

  function lbClose() {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true');
    document.body.style.overflow = '';
    if (lbVid) { lbVid.pause(); lbVid = null; }
    setTimeout(function () { lbBody.innerHTML = ''; }, 280);
  }

  function lbGo(dir) {
    var n = current + dir;
    if (n >= 0 && n < items.length) { current = n; lbRender(current); }
  }

  /* ── Controls ── */
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbGo(-1); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbGo(+1); });
  lbX.addEventListener('click', lbClose);
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target === lbInner) lbClose(); });

  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape')     lbClose();
    if (e.key === 'ArrowLeft')  lbGo(-1);
    if (e.key === 'ArrowRight') lbGo(+1);
  });

  /* ── Swipe (touch) ── */
  var touchX = 0;
  lb.addEventListener('touchstart', function (e) {
    touchX = e.touches[0].clientX;
  }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 48) lbGo(dx < 0 ? +1 : -1);
  }, { passive: true });

}());
