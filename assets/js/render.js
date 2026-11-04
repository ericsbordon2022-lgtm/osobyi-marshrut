/* =========================================================
   Динамический рендеринг контента страниц
   ========================================================= */
(function () {
  'use strict';

  var C = window.SITE_CONTENT || {};
  var STORAGE_KEY = 'OSOBYI_MARSHRUT_CONTENT_V5';
  try {
    localStorage.removeItem('OSOBYI_MARSHRUT_CONTENT_V4');
    localStorage.removeItem('OSOBYI_MARSHRUT_CONTENT_V5');
    localStorage.removeItem('SITE_CONTENT');
    localStorage.removeItem('osobyi_marshrut_content');
  } catch (e) {}

  // Live background sync from /api/content
  if (typeof fetch === 'function') {
    fetch('/api/content?t=' + Date.now())
      .then(function (r) { return r.ok ? r.json() : null; })
      .then(function (res) {
        if (res && typeof res === 'object') {
          var serverContent = (res.content && typeof res.content === 'object') ? res.content : res;
          if (serverContent.specialists) {
            C.specialists = serverContent.specialists;
          }
          if (serverContent.gallery && Array.isArray(serverContent.gallery.items)) {
            C.gallery = serverContent.gallery;
          }
          if (serverContent.home) {
            C.home = serverContent.home;
          }
          Object.keys(serverContent).forEach(function (k) {
            C[k] = serverContent[k];
          });
          window.SITE_CONTENT = C;

          var page = document.body && document.body.dataset.page;
          if (page === 'gallery') {
            renderGallery();
          } else if (page === 'home') {
            renderHome();
          } else if (page === 'specialist') {
            renderSpecialist();
          } else if (page === 'workbooks') {
            renderWorkbooks();
          } else if (page === 'reviews') {
            renderReviews();
          }
          renderFooter();
        }
      })
      .catch(function () {});
  }

  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function paragraphs(text, cls) {
    var t = String(text || '').trim();
    if (!t) return '';
    return t.split(/\n\s*\n/).map(function (p) {
      return '<p' + (cls ? ' class="' + cls + '"' : '') + '>' +
        esc(p).replace(/\n/g, '<br>') + '</p>';
    }).join('');
  }

  function set(id, html) {
    var node = document.getElementById(id);
    if (!node) return;
    if (html != null && html !== '') node.innerHTML = html;
  }

  function setText(id, text) {
    var node = document.getElementById(id);
    if (!node) return;
    if (text != null && text !== '') node.textContent = text;
  }

  var TONES = ['tone-1', 'tone-2', 'tone-3', 'tone-4', 'tone-5', 'tone-6'];
  function tone(i) { return TONES[i % TONES.length]; }

  function renderHome() {
    var s = C.site || {}, h = C.home || {};
    setText('hero-eyebrow', s.heroEyebrow);
    setText('hero-title', s.heroTitle);
    setText('hero-subtitle', s.subtitle);
    setText('motto-label', s.mottoLabel);
    setText('motto-text', s.motto);

    var hp = h.heroPhoto || {};
    if (hp.file) {
      set('hero-art', '<div class="hero__photo"><img src="' + esc(hp.file) + '" alt="' + esc(hp.alt || '') + '"></div>');
    }

    var st = h.students || {};
    setText('students-eyebrow', st.eyebrow);
    setText('students-title', st.title);
    if (st.text) set('students-text', paragraphs(st.text, 'lead'));

    var photos = st.photos || [];
    var validPhotos = photos.filter(function (p) { return p && p.file && String(p.file).trim(); });
    if (validPhotos.length) {
      var grid = document.getElementById('students-photos');
      if (grid) {
        grid.className = 'gallery';
        grid.innerHTML = validPhotos.map(function (p, i) {
          var caption = p.title || '';
          return '<figure class="gallery__item" data-kind="foto">' +
            '<button type="button" class="gallery__btn" data-lightbox="Фото" data-src="' + esc(p.file) + '" data-title="' + esc(caption || ('Фото № ' + (i + 1))) + '">' +
              '<span class="gallery__frame gallery__frame--img"><img src="' + esc(p.file) + '" alt="' + esc(caption) + '" loading="lazy" onerror="this.onerror=null;this.style.opacity=0.4;"></span>' +
            '</button>' +
          '</figure>';
        }).join('');
      }
    }

    var ab = h.about || {};
    setText('about-eyebrow', ab.eyebrow);
    setText('about-title', ab.title);
    if (ab.text) set('about-text', '<div class="prose">' + paragraphs(ab.text, 'lead') + '</div>');

    var memo = h.memo || {};
    setText('memo-eyebrow', memo.eyebrow);
    setText('memo-title', memo.title);
    setText('memo-intro', memo.intro);

    var memoItems = memo.items || [];
    if (memoItems.length) {
      set('memo-acc', memoItems.map(function (it, i) {
        var id = 'memo-' + (i + 1);
        return '<div class="acc__item ' + tone(i) + '">' +
          '<h3 style="margin:0">' +
            '<button type="button" class="acc__btn" id="' + id + '" aria-expanded="' + (i === 0) + '" aria-controls="' + id + '-p">' +
              '<span class="acc__emoji" aria-hidden="true">' + esc(it.emoji || '•') + '</span>' +
              '<span>' + esc(it.title) + '</span>' +
              '<svg class="acc__chev" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
          '</h3>' +
          '<div class="acc__panel" id="' + id + '-p" role="region" aria-labelledby="' + id + '"' + (i === 0 ? '' : ' hidden') + '>' +
            paragraphs(it.text) +
          '</div>' +
        '</div>';
      }).join(''));
    }
  }

  function renderWorkbooks() {
    var w = C.workbooks || {};
    setText('page-title', w.title);
    var leadEl = document.querySelector('.section__head .lead');
    if (leadEl && w.lead) leadEl.textContent = w.lead;

    var grid = document.querySelector('.grid--3');
    var subjects = w.subjects || [];
    if (grid && subjects.length) {
      grid.innerHTML = subjects.map(function (s, i) {
        var books = s.books || [];
        var booksHtml = books.length ? books.map(function (b) {
          return '<div style="background:#fff;padding:12px 16px;border-radius:8px;margin-top:8px;display:flex;align-items:center;justify-content:space-between">' +
            '<span>📄 ' + esc(b.title || '') + '</span>' +
            (b.file ? '<a class="btn btn--ghost" href="' + esc(b.file) + '" target="_blank" download>Скачать PDF</a>' : '<span style="color:#888;font-size:0.9rem">Файл скоро появится</span>') +
          '</div>';
        }).join('') : '<p style="color:#666;font-size:0.92rem;margin-top:8px">Тетради добавляются в панели управления.</p>';

        return '<article class="card ' + tone(i) + '">' +
          '<span class="card__icon">' + esc(s.icon || '📗') + '</span>' +
          '<h3>' + esc(s.title || '') + '</h3>' +
          booksHtml +
        '</article>';
      }).join('');
    }
  }

  function renderReviews() {
    var rv = C.reviews || {};
    setText('page-title', rv.title || 'Отзывы родителей');

    var grid = document.querySelector('.grid--reviews');
    var items = rv.items || [];
    if (grid && items.length) {
      grid.innerHTML = items.map(function (it, i) {
        var stars = parseInt(it.rating, 10) || 5;
        var nameParts = (it.name || 'А').trim().split(/\s+/);
        var initials = (nameParts[0][0] + (nameParts[1] ? nameParts[1][0] : '')).toUpperCase();
        var starsHtml = '★★★★★'.slice(0, stars);

        return '<article class="card review ' + tone(i) + '" data-date="' + esc(it.date || '') + '">' +
          '<div class="review__head">' +
            '<span class="review__avatar" aria-hidden="true">' + esc(initials) + '</span>' +
            '<div><span class="review__who">' + esc(it.name || '') + '</span><br><span class="review__date">' + esc(it.date || '') + '</span></div>' +
          '</div>' +
          '<div class="review__stars">' + starsHtml + '</div>' +
          '<div class="card__text">' + paragraphs(it.text || '') + '</div>' +
        '</article>';
      }).join('');
    }

    // Interactive Review Form Toggle & Submission
    var toggleBtn = document.getElementById('toggle-review-form');
    var formCard = document.getElementById('review-form-box');
    var form = document.getElementById('add-review-form');
    var status = document.getElementById('review-form-status');
    var cancelBtn = document.getElementById('cancel-review-btn');

    if (toggleBtn && formCard) {
      toggleBtn.addEventListener('click', function () {
        var isHidden = formCard.hidden;
        formCard.hidden = !isHidden;
        if (isHidden) {
          formCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          var nameInput = document.getElementById('r-name');
          if (nameInput) nameInput.focus();
        }
      });
    }

    if (cancelBtn && formCard) {
      cancelBtn.addEventListener('click', function () {
        formCard.hidden = true;
      });
    }

    if (form && !form.dataset.bound) {
      form.dataset.bound = 'true';
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var name = (form.querySelector('[name="name"]').value || '').trim();
        var text = (form.querySelector('[name="text"]').value || '').trim();
        var rating = parseInt(form.querySelector('[name="rating"]').value, 10) || 5;

        if (!name || !text) {
          if (status) {
            status.style.color = '#EF4444';
            status.textContent = 'Пожалуйста, укажите имя и текст отзыва.';
          }
          return;
        }

        var submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        if (status) {
          status.style.color = '#0284C7';
          status.textContent = 'Отправка отзыва…';
        }

        var newReview = {
          name: name,
          text: text,
          rating: rating,
          date: new Date().toISOString().split('T')[0]
        };

        fetch('/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(newReview)
        }).then(function (r) {
          return r.json().catch(function () { return { ok: true }; });
        }).then(function (res) {
          if (submitBtn) submitBtn.disabled = false;
          form.reset();
          if (status) {
            status.style.color = '#047857';
            status.innerHTML = '<strong>✓ Благодарим за отзыв!</strong> После проверки отзыв будет напечатан.';
          }
          // Do NOT publish immediately. Keep existing reviews unchanged.
          setTimeout(function () {
            if (formCard) formCard.hidden = true;
            if (status) status.innerHTML = '';
          }, 6000);
        }).catch(function (err) {
          if (submitBtn) submitBtn.disabled = false;
          form.reset();
          if (status) {
            status.style.color = '#047857';
            status.innerHTML = '<strong>✓ Благодарим за отзыв!</strong> После проверки отзыв будет напечатан.';
          }
          // Do NOT publish immediately. Keep existing reviews unchanged.
          setTimeout(function () {
            if (formCard) formCard.hidden = true;
            if (status) status.innerHTML = '';
          }, 6000);
        });
      });
    }
  }

  function renderSpecialist() {
    var specKey = document.body.dataset.spec;
    if (!specKey) return;
    var sp = (C.specialists && C.specialists[specKey]) || (window.SITE_CONTENT && window.SITE_CONTENT.specialists && window.SITE_CONTENT.specialists[specKey]) || {};
    if (sp.title) setText('page-title', sp.title);
    var leadEl = document.querySelector('.section__head .lead');
    if (leadEl && sp.lead) leadEl.textContent = sp.lead;

    // Teacher Profile Card
    var teacherBox = document.getElementById('spec-teacher-box');
    var teacher = sp.teacher || {};
    if (teacherBox) {
      if (teacher.photo || teacher.name) {
        var tPhoto = teacher.photo ? ((teacher.photo.startsWith('/') || teacher.photo.startsWith('http') || teacher.photo.startsWith('data:')) ? teacher.photo : '/' + teacher.photo) : '';
        var photoInner = tPhoto
               photoInner = '<img src="media/my-teacher-final.jpg" alt="Пермякова Светлана Валерьевна" class="teacher-profile__photo" style="display: block !important; width: 100%; height: auto;">';
          : '<span class="teacher-profile__placeholder" aria-hidden="true">👩‍🏫</span>';
        teacherBox.innerHTML = '<div class="teacher-profile">' +
          '<div class="teacher-profile__photo-wrap">' + photoInner + '</div>' +
          '<div class="teacher-profile__info">' +
            (teacher.role ? '<span class="teacher-profile__role">' + esc(teacher.role) + '</span>' : '') +
            '<h2 class="teacher-profile__name">' + esc(teacher.name || '') + '</h2>' +
            (teacher.desc ? '<p class="teacher-profile__desc">' + esc(teacher.desc) + '</p>' : '') +
          '</div>' +
        '</div>';
      } else if (teacherBox.children.length === 0) {
        teacherBox.innerHTML = '';
      }
    }

    // Photos (children and activities)
    var photoGrid = document.getElementById('spec-photos');
    var photoBox = document.getElementById('spec-photos-box');
    var photos = sp.photos || [];
    if (photoGrid) {
      var validPhotos = photos.filter(function (p) { return p && p.file && String(p.file).trim(); });
      if (validPhotos.length) {
        photoGrid.innerHTML = validPhotos.map(function (p, i) {
          var pUrl = (p.file.startsWith('/') || p.file.startsWith('http') || p.file.startsWith('data:')) ? p.file : '/' + p.file;
          return '<div class="gallery__item">' +
            '<button type="button" class="gallery__btn" data-lightbox="Фото" data-src="' + esc(pUrl) + '" data-title="' + esc(p.title || '') + '">' +
              '<span class="gallery__frame">' +
                '<img src="' + esc(pUrl) + '" alt="' + esc(p.title || 'Фото') + '" loading="lazy" onerror="this.onerror=null;this.style.opacity=0.4;">' +
              '</span>' +
            '</button>' +
            (p.title ? '<div class="gallery__cap">' + esc(p.title) + '</div>' : '') +
          '</div>';
        }).join('');
        if (photoBox) photoBox.style.display = '';
      } else {
        if (photoGrid.querySelectorAll('.gallery__item').length === 0) {
          if (photoBox) photoBox.style.display = 'none';
        } else {
          if (photoBox) photoBox.style.display = '';
        }
      }
    }

    // Videos
    var videoGrid = document.getElementById('spec-videos');
    var videoBox = document.getElementById('spec-videos-box');
    var videos = sp.videos || [];
    if (videoGrid) {
      var validVideos = videos.filter(function (v) { return v && v.file && String(v.file).trim(); });
      if (validVideos.length) {
        videoGrid.innerHTML = validVideos.map(function (v) {
          var vUrl = (v.file.startsWith('/') || v.file.startsWith('http') || v.file.startsWith('data:')) ? v.file : '/' + v.file;
          return '<div class="video-card">' +
            '<video class="video-card__player" src="' + esc(vUrl) + '" controls playsinline preload="metadata"></video>' +
            (v.title ? '<div class="video-card__cap">' + esc(v.title) + '</div>' : '') +
          '</div>';
        }).join('');
        if (videoBox) videoBox.style.display = '';
      } else {
        if (videoGrid.querySelectorAll('.video-card').length === 0) {
          if (videoBox) videoBox.style.display = 'none';
        } else {
          if (videoBox) videoBox.style.display = '';
        }
      }
    }

    // PDFs & Documents
    var pdfGrid = document.getElementById('spec-pdfs');
    var pdfBox = document.getElementById('spec-pdfs-box');
    var pdfs = sp.pdfs || [];
    if (pdfGrid) {
      var validPdfs = pdfs.filter(function (pdf) { return pdf && (pdf.file || pdf.title); });
      if (validPdfs.length) {
        pdfGrid.innerHTML = validPdfs.map(function (pdf) {
          var pFile = pdf.file ? ((pdf.file.startsWith('/') || pdf.file.startsWith('http')) ? pdf.file : '/' + pdf.file) : '';
          var ext = pFile.split('.').pop().toLowerCase();
          var btnTxt = ext === 'pdf' ? 'Скачать PDF' : ((ext === 'ppt' || ext === 'pptx') ? 'Скачать презентацию' : 'Скачать документ');
          var icon = ext === 'pdf' ? '📑' : ((ext === 'ppt' || ext === 'pptx') ? '📊' : '📄');
          return '<div style="background:#fff;padding:14px 18px;border-radius:10px;border:1px solid var(--c-border);display:flex;align-items:center;justify-content:space-between;gap:16px;box-shadow:var(--sh-sm)">' +
            '<div style="display:flex;align-items:center;gap:12px">' +
              '<span style="font-size:1.6rem">' + icon + '</span>' +
              '<div>' +
                '<strong style="font-size:1.05rem;display:block">' + esc(pdf.title || 'Материал') + '</strong>' +
                '<span style="font-size:0.85rem;color:var(--c-text-muted)">Материал специалиста (' + ext.toUpperCase() + ')</span>' +
              '</div>' +
            '</div>' +
            (pFile ? '<a class="btn btn--brand" href="' + esc(pFile) + '" target="_blank" download style="white-space:nowrap">' + btnTxt + '</a>' : '<span style="color:#888;font-size:0.9rem">Файл готовится</span>') +
          '</div>';
        }).join('');
        if (pdfBox) pdfBox.style.display = '';
      } else {
        if (pdfGrid.children.length === 0) {
          if (pdfBox) pdfBox.style.display = 'none';
        } else {
          if (pdfBox) pdfBox.style.display = '';
        }
      }
    }

    // Blog / Tips
    var blogBox = document.getElementById('spec-blog');
    var blogWrap = document.getElementById('spec-blog-box');
    var blog = sp.blog || [];
    if (blogBox) {
      var validBlog = blog.filter(function (b) { return b && (b.title || b.text); });
      if (validBlog.length) {
        blogBox.innerHTML = validBlog.map(function (b) {
          var fileHtml = '';
          if (b.file) {
            var bUrl = (b.file.startsWith('/') || b.file.startsWith('http')) ? b.file : '/' + b.file;
            fileHtml = '<div class="tip-files">' +
              '<a href="' + esc(bUrl) + '" target="_blank" download class="tip-file-link">' +
                '<span>📎 ' + esc(b.fileTitle || 'Скачать памятку / материал к совету (PDF)') + '</span>' +
              '</a>' +
            '</div>';
          }
          return '<article class="card tone-1" style="margin-bottom:16px">' +
            '<h3 style="margin-bottom:8px">💡 ' + esc(b.title || 'Совет') + '</h3>' +
            '<div class="prose" style="font-size:1.05rem">' + paragraphs(b.text || '') + '</div>' +
            fileHtml +
          '</article>';
        }).join('');
        if (blogWrap) blogWrap.style.display = '';
      } else {
        if (blogBox.children.length === 0) {
          if (blogWrap) blogWrap.style.display = 'none';
        } else {
          if (blogWrap) blogWrap.style.display = '';
        }
      }
    }
  }

  function renderGallery() {
    var g = (C && C.gallery) || (window.SITE_CONTENT && window.SITE_CONTENT.gallery) || {};
    setText('page-title', g.title || 'Интересные моменты');
    var leadEl = document.querySelector('#main .lead');
    if (leadEl && g.lead) leadEl.textContent = g.lead;

    var container = document.querySelector('#main .gallery');
    if (!container) return;

    var items = g.items;
    if (!Array.isArray(items) || !items.length) {
      if (window.SITE_CONTENT && window.SITE_CONTENT.gallery && Array.isArray(window.SITE_CONTENT.gallery.items) && window.SITE_CONTENT.gallery.items.length) {
        items = window.SITE_CONTENT.gallery.items;
      }
    }

    var valid = (items || []).filter(function (it) { return it && it.file && String(it.file).trim(); });
    if (!valid.length) {
      container.innerHTML = '<div class="empty">' +
        '<span class="empty__art" aria-hidden="true">📸</span>' +
        '<p class="empty__title">Галерея наполняется</p>' +
        '<p class="empty__hint">Фото и видео добавляются в панели управления.</p>' +
      '</div>';
      return;
    }

    container.innerHTML = valid.map(function (it, i) {
      var file = it.file || '';
      var caption = it.title || '';
      var isV = /\.(mp4|webm|mov|ogg)$/i.test(file);
      var srcUrl = (file.startsWith('/') || file.startsWith('http') || file.startsWith('data:')) ? file : '/' + file;
      return '<figure class="gallery__item" data-kind="' + (isV ? 'video' : 'foto') + '">' +
        '<button type="button" class="gallery__btn" data-lightbox="' + (isV ? 'Видео' : 'Фото') + '" data-src="' + esc(srcUrl) + '" data-title="' + esc(caption) + '">' +
          '<span class="gallery__frame">' +
            (isV ? '🎬' : '<img src="' + esc(srcUrl) + '" alt="' + esc(caption || 'Фото ' + (i + 1)) + '" loading="lazy" onerror="this.onerror=null;this.style.opacity=0.4;">') +
          '</span>' +
        '</button>' +
        (caption ? '<figcaption class="gallery__cap">' + esc(caption) + '</figcaption>' : '') +
      '</figure>';
    }).join('');
  }

  function renderFooter() {
    var c = C || window.SITE_CONTENT || {};
    var footer = c.footer || {};
    var links = footer.links || [];
    var socialList = document.querySelector('ul.social');
    if (socialList && links.length) {
      socialList.innerHTML = links.map(function (l) {
        return '<li><a class="social__link" href="' + esc(l.url || '#') + '" target="_blank" rel="noopener noreferrer">' +
          '<span class="social__ico" aria-hidden="true">' + esc(l.icon || '🔗') + '</span>' +
          '<span class="social__meta">' + esc(l.label || '') + (l.note ? '<span>' + esc(l.note) + '</span>' : '') + '</span>' +
        '</a></li>';
      }).join('');
    }
  }

  function init() {
    var page = document.body.dataset.page;
    if (page === 'home') renderHome();
    if (page === 'workbooks') renderWorkbooks();
    if (page === 'reviews') renderReviews();
    if (page === 'specialist') renderSpecialist();
    if (page === 'gallery') renderGallery();
    renderFooter();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
