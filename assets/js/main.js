/* =========================================================
   Интерактивные компоненты сайта
   ========================================================= */
(function () {
  'use strict';

  function initAccordion() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('.acc__btn');
      if (!btn) return;
      var expanded = btn.getAttribute('aria-expanded') === 'true';
      var panel = document.getElementById(btn.getAttribute('aria-controls'));
      if (!panel) return;

      btn.setAttribute('aria-expanded', !expanded);
      panel.hidden = expanded;
    });

    var allBtn = document.querySelector('[data-acc-all]');
    if (allBtn) {
      allBtn.addEventListener('click', function () {
        var open = allBtn.dataset.state === 'open';
        var container = document.getElementById(allBtn.dataset.accAll);
        if (!container) return;
        var btns = container.querySelectorAll('.acc__btn');
        btns.forEach(function (b) {
          b.setAttribute('aria-expanded', open ? 'false' : 'true');
          var p = document.getElementById(b.getAttribute('aria-controls'));
          if (p) p.hidden = open;
        });
        allBtn.dataset.state = open ? 'closed' : 'open';
        allBtn.textContent = open ? 'Развернуть все' : 'Свернуть все';
      });
    }
  }

  function initTabs() {
    document.addEventListener('click', function (e) {
      var tab = e.target.closest('.tabs__tab');
      if (!tab) return;
      var list = tab.closest('.tabs__list');
      if (!list) return;

      list.querySelectorAll('.tabs__tab').forEach(function (t) {
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = t !== tab;
      });
    });
  }

  function initFilters() {
    document.addEventListener('click', function (e) {
      var chip = e.target.closest('.chip');
      if (!chip) return;
      var filters = chip.closest('.filters');
      if (!filters) return;

      filters.querySelectorAll('.chip').forEach(function (c) {
        c.setAttribute('aria-pressed', c === chip ? 'true' : 'false');
      });

      var filter = chip.dataset.filter;
      var grid = document.getElementById('resources-grid');
      if (!grid) return;

      var items = grid.querySelectorAll('[data-kind]');
      items.forEach(function (it) {
        if (filter === 'all' || it.dataset.kind === filter) {
          it.style.display = '';
        } else {
          it.style.display = 'none';
        }
      });
    });
  }

  function initLightbox() {
    document.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-lightbox]');
      if (!btn) return;
      var src = btn.dataset.src;
      if (!src) return;

      var srcUrl = (src.startsWith('/') || src.startsWith('http') || src.startsWith('data:')) ? src : '/' + src;
      var isVideo = /\.(mp4|webm|mov|ogg)$/i.test(srcUrl);
      var overlay = document.createElement('div');
      overlay.className = 'lightbox';
      overlay.innerHTML = '<div class="lightbox__content">' +
        '<button type="button" class="lightbox__close" aria-label="Закрыть">✕</button>' +
        (isVideo
          ? '<video src="' + srcUrl + '" controls autoplay style="max-height:80vh"></video>'
          : '<img src="' + srcUrl + '" alt="' + (btn.dataset.title || '') + '" onerror="this.onerror=null;this.src=\'/media/student_photo_1.jpg\';">') +
        (btn.dataset.title ? '<p style="color:#fff;text-align:center;margin-top:12px;font-weight:700">' + btn.dataset.title + '</p>' : '') +
        '</div>';
      document.body.appendChild(overlay);

      function close() {
        if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
        document.removeEventListener('keydown', onKey);
      }

      function onKey(ev) { if (ev.key === 'Escape') close(); }
      overlay.querySelector('.lightbox__close').addEventListener('click', close);
      overlay.addEventListener('click', function (ev) { if (ev.target === overlay) close(); });
      document.addEventListener('keydown', onKey);
    });
  }

  function start() {
    initAccordion();
    initTabs();
    initFilters();
    initLightbox();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
