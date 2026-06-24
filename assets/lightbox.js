(function () {
  'use strict';

  var lb     = document.getElementById('lightbox');
  var lbBody = document.getElementById('lightboxContent');
  var lbX    = document.getElementById('lightboxClose');
  if (!lb || !lbBody) return;

  var items   = [];  /* [{src, type:'image'|'video'}] in DOM order */
  var current = 0;
  var lbVid   = null;

  /* ── Collect gallery items in DOM order ── */
  document.querySelectorAll('.galerie-grid > *').forEach(function (el) {
    var isVideo = el.classList.contains('video-horizontale') && el.dataset.video;
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

  /* ── Arrow buttons (created dynamically) ── */
  var lbPrev = document.createElement('button');
  lbPrev.className = 'lb-arrow lb-prev';
  lbPrev.setAttribute('aria-label', 'Précédent');
  lbPrev.innerHTML = '&#8249;';
  lb.appendChild(lbPrev);

  var lbNext = document.createElement('button');
  lbNext.className = 'lb-arrow lb-next';
  lbNext.setAttribute('aria-label', 'Suivant');
  lbNext.innerHTML = '&#8250;';
  lb.appendChild(lbNext);

  /* ── Render item at index ── */
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

    lbPrev.style.opacity = idx > 0                  ? '1' : '0.2';
    lbNext.style.opacity = idx < items.length - 1   ? '1' : '0.2';
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
    var next = current + dir;
    if (next >= 0 && next < items.length) { current = next; lbRender(current); }
  }

  /* ── Controls ── */
  lbPrev.addEventListener('click', function (e) { e.stopPropagation(); lbGo(-1); });
  lbNext.addEventListener('click', function (e) { e.stopPropagation(); lbGo(+1); });
  lbX.addEventListener('click', lbClose);
  lb.addEventListener('click', function (e) { if (e.target === lb) lbClose(); });

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
