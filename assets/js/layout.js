/* =========================================================
   Общий макет: шапка, меню, панель доступности, подвал
   ========================================================= */
(function () {
  'use strict';

  // Синхронизация активного пункта меню
  function syncActiveNav() {
    var cur = window.location.pathname.split('/').pop() || 'index.html';
    if (cur === '' || cur === '/') cur = 'index.html';
    var links = document.querySelectorAll('.nav__link, .footer__map a');
    links.forEach(function (a) {
      var href = a.getAttribute('href');
      if (href === cur || (cur === 'index.html' && (href === '/' || href === 'index.html'))) {
        a.setAttribute('aria-current', 'page');
      } else {
        a.removeAttribute('aria-current');
      }
    });
  }

  // Настройки доступности (Слабовидящие)
  function initA11y() {
    var toggle = document.getElementById('a11y-toggle');
    var panel = document.getElementById('a11y-panel');
    if (!toggle || !panel) return;

    toggle.addEventListener('click', function () {
      var isOpen = panel.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });

    // Размер шрифта
    var fsButtons = panel.querySelectorAll('[data-fs]');
    var savedFs = localStorage.getItem('A11Y_FS') || '1';
    document.documentElement.style.setProperty('--fs', savedFs);
    fsButtons.forEach(function (btn) {
      if (btn.getAttribute('data-fs') === savedFs) {
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }
      btn.addEventListener('click', function () {
        var fs = btn.getAttribute('data-fs');
        document.documentElement.style.setProperty('--fs', fs);
        localStorage.setItem('A11Y_FS', fs);
        fsButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
      });
    });

    // Контрастность
    var contrastButtons = panel.querySelectorAll('[data-scheme]');
    var savedScheme = localStorage.getItem('A11Y_SCHEME') || 'normal';
    if (savedScheme === 'contrast') document.body.classList.add('contrast');
    contrastButtons.forEach(function (btn) {
      if (btn.getAttribute('data-scheme') === savedScheme) {
        btn.setAttribute('aria-pressed', 'true');
      } else {
        btn.setAttribute('aria-pressed', 'false');
      }
      btn.addEventListener('click', function () {
        var scheme = btn.getAttribute('data-scheme');
        if (scheme === 'contrast') {
          document.body.classList.add('contrast');
        } else {
          document.body.classList.remove('contrast');
        }
        localStorage.setItem('A11Y_SCHEME', scheme);
        contrastButtons.forEach(function (b) { b.setAttribute('aria-pressed', 'false'); });
        btn.setAttribute('aria-pressed', 'true');
      });
    });

    // Сброс настроек доступности
    var resetBtn = panel.querySelector('[data-a11y-reset]');
    if (resetBtn) {
      resetBtn.addEventListener('click', function () {
        document.documentElement.style.setProperty('--fs', '1');
        document.body.classList.remove('contrast');
        localStorage.removeItem('A11Y_FS');
        localStorage.removeItem('A11Y_SCHEME');
        fsButtons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-fs') === '1' ? 'true' : 'false'); });
        contrastButtons.forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-scheme') === 'normal' ? 'true' : 'false'); });
      });
    }
  }

  // Мобильное меню
  function initMobileNav() {
    var toggle = document.getElementById('nav-toggle');
    var nav = document.getElementById('site-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Кнопка наверх
  function initToTop() {
    var btn = document.getElementById('to-top');
    if (!btn) return;
    window.addEventListener('scroll', function () {
      if (window.scrollY > 300) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }, { passive: true });
    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // Защита от битых картинок: никогда не подменять чужими фото с главной страницы
  function initImageFallbacks() {
    // Не подменяем фото специалистов и галереи фото с главной страницы!
    var images = document.querySelectorAll('img');
    images.forEach(function (img) {
      img.addEventListener('error', function () {
        // Убираем бесконечные перезагрузки и не заменяем фото
        img.classList.add('img--failed');
        img.style.opacity = '0.5';
      });
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    syncActiveNav();
    initA11y();
    initMobileNav();
    initToTop();
    initImageFallbacks();
  });
})();
