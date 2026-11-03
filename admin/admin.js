/* =========================================================
   Панель управления с постоянным сохранением данных
   ========================================================= */
(function () {
  'use strict';

  var STORAGE_KEY = 'OSOBYI_MARSHRUT_CONTENT_V5';
  var data = null;
  var dirty = false;
  var active = 'site';

  var $side = document.getElementById('side');
  var $work = document.getElementById('work');
  var $save = document.getElementById('save-btn');
  var $state = document.getElementById('save-state');
  var $toast = document.getElementById('toast');
  var $exportJson = document.getElementById('export-json');
  var $importJson = document.getElementById('import-json');

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function get(path) {
    if (!path) return data;
    return String(path).split('.').reduce(function (o, k) {
      return (o == null) ? o : o[k];
    }, data);
  }

  function set(path, value) {
    var keys = String(path).split('.');
    var last = keys.pop();
    var target = keys.reduce(function (o, k) {
      if (o[k] == null) o[k] = {};
      return o[k];
    }, data);
    target[last] = value;
    markDirty();
  }

  var autoSaveTimer = null;
  function markDirty() {
    dirty = true;
    $save.disabled = false;
    $state.textContent = 'Есть несохраненные изменения';
    $state.className = 'save-state is-dirty';
    // Автосохранение в LocalStorage для защиты от случайной перезагрузки
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem('SITE_CONTENT', JSON.stringify(data));
    } catch (e) {}

    // Автоматическое сохранение на сервер с дебаунсом 1.5 сек
    clearTimeout(autoSaveTimer);
    autoSaveTimer = setTimeout(function () {
      if (!dirty) return;
      api('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function () {
        dirty = false;
        $state.textContent = 'Все изменения сохранены';
        $state.className = 'save-state';
        $save.disabled = false;
      }).catch(function () {});
    }, 1500);
  }

  var toastTimer = null;
  function toast(message, isError) {
    $toast.textContent = message;
    $toast.className = 'toast' + (isError ? ' toast--error' : '');
    $toast.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { $toast.hidden = true; }, isError ? 5000 : 3000);
  }

  function api(url, options) {
    return fetch(url, options).then(function (r) {
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.json();
    });
  }

  var SECTIONS = [
    {
      id: 'site', label: 'Общее', icon: '⚙️', group: 'Сайт',
      title: 'Общие настройки', lead: 'Название сайта, шапка и девиз.',
      blocks: [{
        title: 'Название и заголовки', path: 'site',
        fields: [
          { key: 'title', label: 'Название сайта', type: 'text' },
          { key: 'subtitle', label: 'Подзаголовок в шапке', type: 'text' },
          { key: 'heroEyebrow', label: 'Надпись над главным заголовком', type: 'text' },
          { key: 'heroTitle', label: 'Главный заголовок страницы', type: 'textarea' },
          { key: 'mottoLabel', label: 'Подпись к девизу', type: 'text' },
          { key: 'motto', label: 'Девиз', type: 'textarea' }
        ]
      }]
    },
    {
      id: 'home', label: 'Главная', icon: '🏠', group: 'Страницы',
      title: 'Главная страница', lead: 'Фото обучающихся, блок «О чем сайт» и памятка.',
      blocks: [
        {
          title: 'Главное фото в шапке', path: 'home.heroPhoto',
          fields: [
            { key: 'file', label: 'Фотография', type: 'image' },
            { key: 'alt', label: 'Описание фото', type: 'text' }
          ]
        },
        {
          title: 'Блок обучающихся', path: 'home.students',
          fields: [
            { key: 'eyebrow', label: 'Надпись над заголовком', type: 'text' },
            { key: 'title', label: 'Заголовок блока', type: 'text' },
            { key: 'text', label: 'Текст об обучающихся', type: 'textarea', cls: 'textarea--tall' },
            {
              key: 'photos', label: 'Фотографии обучающихся', type: 'list', itemLabel: 'Фотография',
              newItem: { file: '', title: '' },
              fields: [
                { key: 'file', label: 'Файл снимка', type: 'image' },
                { key: 'title', label: 'Подпись к снимку', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'О чем сайт', path: 'home.about',
          fields: [
            { key: 'eyebrow', label: 'Надпись над заголовком', type: 'text' },
            { key: 'title', label: 'Заголовок', type: 'text' },
            { key: 'text', label: 'Текст описания', type: 'textarea', cls: 'textarea--tall' }
          ]
        },
        {
          title: 'Памятка для родителей', path: 'home.memo',
          fields: [
            { key: 'eyebrow', label: 'Надпись над заголовком', type: 'text' },
            { key: 'title', label: 'Заголовок памятки', type: 'text' },
            { key: 'intro', label: 'Вводное слово', type: 'textarea' },
            {
              key: 'items', label: 'Пункты памятки', type: 'list', itemLabel: 'Пункт',
              newItem: { emoji: '⭐', title: '', text: '' },
              fields: [
                { key: 'emoji', label: 'Значок', type: 'text' },
                { key: 'title', label: 'Заголовок пункта', type: 'text' },
                { key: 'text', label: 'Текст совета', type: 'textarea' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'methods', label: 'Методы', icon: '🧠', group: 'Страницы',
      title: 'Методы и подходы', lead: 'Методики и технологии коррекционной работы.',
      blocks: [
        {
          title: 'Основные подходы', path: 'methods.approaches',
          fields: [
            { key: 'tab', label: 'Название вкладки', type: 'text' },
            {
              key: 'items', label: 'Карточки подходов', type: 'list', itemLabel: 'Подход',
              newItem: { icon: '🧠', name: '', desc: '', example: '' },
              fields: [
                { key: 'icon', label: 'Значок', type: 'text' },
                { key: 'name', label: 'Название', type: 'text' },
                { key: 'desc', label: 'Описание', type: 'textarea' },
                { key: 'example', label: 'Пример', type: 'textarea' }
              ]
            }
          ]
        },
        {
          title: 'Эффективные методики', path: 'methods.effective',
          fields: [
            { key: 'tab', label: 'Название вкладки', type: 'text' },
            {
              key: 'items', label: 'Карточки методик', type: 'list', itemLabel: 'Методика',
              newItem: { icon: '🗣️', name: '', desc: '', example: '' },
              fields: [
                { key: 'icon', label: 'Значок', type: 'text' },
                { key: 'name', label: 'Название', type: 'text' },
                { key: 'desc', label: 'Описание', type: 'textarea' },
                { key: 'example', label: 'Пример', type: 'textarea' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'resources', label: 'Ресурсы', icon: '🧭', group: 'Страницы',
      title: 'Полезные ресурсы', lead: 'Ссылки на образовательные порталы и центры.',
      blocks: [
        {
          title: 'Заголовки раздела', path: 'resources',
          fields: [
            { key: 'title', label: 'Заголовок', type: 'text' },
            { key: 'lead', label: 'Подзаголовок', type: 'textarea' }
          ]
        },
        {
          title: 'Список ссылок', path: 'resources',
          fields: [
            {
              key: 'items', label: 'Ссылки', type: 'list', itemLabel: 'Ресурс',
              newItem: { icon: '🔗', title: '', url: '', kind: 'gov' },
              fields: [
                { key: 'icon', label: 'Значок', type: 'text' },
                { key: 'title', label: 'Название', type: 'text' },
                { key: 'url', label: 'Адрес сайта (URL)', type: 'text' }
              ]
            }
          ]
        }
      ]
    },
    /* =========================================================
       СПЕЦИАЛИСТЫ СОПРОВОЖДЕНИЯ (Психолог, Логопед, Дефектолог)
       ========================================================= */
    {
      id: 'specialists_psiholog', label: 'Психолог', icon: '🧠', group: 'Специалисты',
      title: 'Педагог-психолог', lead: 'Фотографии детей, видеоматериалы, презентации в PDF, статьи и обращение психолога.',
      blocks: [
        {
          title: 'Психолог: фото детей и занятий', path: 'specialists.psiholog',
          fields: [
            {
              key: 'photos', label: 'Фотографии детей и занятий', type: 'list', itemLabel: 'Фото',
              newItem: { file: '', title: '' },
              itemIcon: '📸',
              itemDesc: 'Фотографии появятся на странице психолога в фотогалерее занятий.',
              fields: [
                { key: 'file', label: 'Фотография', type: 'image' },
                { key: 'title', label: 'Подпись к фото (например: Сенсорные упражнения)', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'Психолог: видеоматериалы занятий', path: 'specialists.psiholog',
          fields: [
            {
              key: 'videos', label: 'Видеозаписи занятий и упражнений', type: 'list', itemLabel: 'Видео',
              newItem: { file: '', title: '' },
              itemIcon: '🎬',
              itemDesc: 'Видеоролики практических занятий (MP4, WebM, MOV) для родителей.',
              fields: [
                { key: 'title', label: 'Название видео', type: 'text' },
                { key: 'file', label: 'Видеофайл (MP4, WebM, MOV)', type: 'video' }
              ]
            }
          ]
        },
        {
          title: 'Психолог: презентации в PDF и документы', path: 'specialists.psiholog',
          fields: [
            {
              key: 'pdfs', label: 'Презентации / документы', type: 'list', itemLabel: 'Презентация (PDF)',
              newItem: { title: '', file: '' },
              itemIcon: '📊',
              itemDesc: 'Презентации и методические материалы, доступные для скачивания родителями.',
              fields: [
                { key: 'title', label: 'Название презентации', type: 'text' },
                { key: 'file', label: 'Файл презентации (PDF или документ)', type: 'file' }
              ]
            }
          ]
        },
        {
          title: 'Психолог: полезные советы (с файлами памятки)', path: 'specialists.psiholog',
          fields: [
            {
              key: 'blog', label: 'Полезные советы и статьи', type: 'list', itemLabel: 'Совет',
              newItem: { title: '', text: '', file: '', fileTitle: '' },
              itemIcon: '💡',
              fields: [
                { key: 'title', label: 'Заголовок совета', type: 'text' },
                { key: 'text', label: 'Текст совета / рекомендации', type: 'textarea' },
                { key: 'fileTitle', label: 'Название прикрепляемого файла (памятки)', type: 'text' },
                { key: 'file', label: 'Файл к совету (PDF, памятка)', type: 'file' }
              ]
            }
          ]
        },
        {
          title: 'Психолог: профиль специалиста', path: 'specialists.psiholog.teacher',
          fields: [
            { key: 'photo', label: 'Фото психолога', type: 'image' },
            { key: 'name', label: 'ФИО специалиста (например: Одинаева Галина Васильевна)', type: 'text' },
            { key: 'role', label: 'Должность / звание (например: Педагог-психолог высшей категории)', type: 'text' },
            { key: 'desc', label: 'Кратко о специалисте (опыт, образование)', type: 'textarea' }
          ]
        },
        {
          title: 'Психолог: обращение к родителям', path: 'specialists.psiholog',
          fields: [
            { key: 'title', label: 'Заголовок страницы', type: 'text' },
            { key: 'lead', label: 'Подзаголовок', type: 'textarea' },
            { key: 'letterTitle', label: 'Заголовок письма', type: 'text' },
            { key: 'letter', label: 'Текст письма родителям', type: 'textarea', cls: 'textarea--tall' }
          ]
        }
      ]
    },
    {
      id: 'specialists_logoped', label: 'Логопед', icon: '🗣️', group: 'Специалисты',
      title: 'Учитель-логопед', lead: 'Фотографии детей, видеоматериалы, презентации в PDF, статьи и обращение логопеда.',
      blocks: [
        {
          title: 'Логопед: фото детей и занятий', path: 'specialists.logoped',
          fields: [
            {
              key: 'photos', label: 'Фотографии детей и занятий', type: 'list', itemLabel: 'Фото',
              newItem: { file: '', title: '' },
              itemIcon: '📸',
              itemDesc: 'Фотографии появятся на странице логопеда в фотогалерее занятий.',
              fields: [
                { key: 'file', label: 'Фотография', type: 'image' },
                { key: 'title', label: 'Подпись к фото (например: Артикуляционная гимнастика)', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'Логопед: видеоматериалы занятий', path: 'specialists.logoped',
          fields: [
            {
              key: 'videos', label: 'Видеозаписи логопедических занятий', type: 'list', itemLabel: 'Видео',
              newItem: { file: '', title: '' },
              itemIcon: '🎬',
              itemDesc: 'Видеоролики артикуляционных упражнений и занятий (MP4, WebM, MOV).',
              fields: [
                { key: 'title', label: 'Название видео', type: 'text' },
                { key: 'file', label: 'Видеофайл (MP4, WebM, MOV)', type: 'video' }
              ]
            }
          ]
        },
        {
          title: 'Логопед: презентации в PDF и документы', path: 'specialists.logoped',
          fields: [
            {
              key: 'pdfs', label: 'Презентации / документы', type: 'list', itemLabel: 'Презентация (PDF)',
              newItem: { title: '', file: '' },
              itemIcon: '📊',
              itemDesc: 'Презентации и логопедические материалы, доступные для скачивания родителями.',
              fields: [
                { key: 'title', label: 'Название презентации', type: 'text' },
                { key: 'file', label: 'Файл презентации (PDF или документ)', type: 'file' }
              ]
            }
          ]
        },
        {
          title: 'Логопед: полезные советы (с файлами памятки)', path: 'specialists.logoped',
          fields: [
            {
              key: 'blog', label: 'Полезные советы и статьи', type: 'list', itemLabel: 'Совет',
              newItem: { title: '', text: '', file: '', fileTitle: '' },
              itemIcon: '💡',
              fields: [
                { key: 'title', label: 'Заголовок совета', type: 'text' },
                { key: 'text', label: 'Текст совета / рекомендации', type: 'textarea' },
                { key: 'fileTitle', label: 'Название прикрепляемого файла (памятки)', type: 'text' },
                { key: 'file', label: 'Файл к совету (PDF, памятка)', type: 'file' }
              ]
            }
          ]
        },
        {
          title: 'Логопед: профиль специалиста', path: 'specialists.logoped.teacher',
          fields: [
            { key: 'photo', label: 'Фото логопеда', type: 'image' },
            { key: 'name', label: 'ФИО логопеда', type: 'text' },
            { key: 'role', label: 'Должность / звание (например: Учитель-логопед)', type: 'text' },
            { key: 'desc', label: 'Кратко о специалисте (опыт, образование)', type: 'textarea' }
          ]
        },
        {
          title: 'Логопед: обращение к родителям', path: 'specialists.logoped',
          fields: [
            { key: 'title', label: 'Заголовок страницы', type: 'text' },
            { key: 'lead', label: 'Подзаголовок', type: 'textarea' },
            { key: 'letterTitle', label: 'Заголовок письма', type: 'text' },
            { key: 'letter', label: 'Текст письма родителям', type: 'textarea', cls: 'textarea--tall' }
          ]
        }
      ]
    },
    {
      id: 'specialists_defektolog', label: 'Дефектолог', icon: '🧩', group: 'Специалисты',
      title: 'Учитель-дефектолог', lead: 'Фотографии детей, видеоматериалы, презентации в PDF, статьи и обращение дефектолога.',
      blocks: [
        {
          title: 'Дефектолог: фото детей и занятий', path: 'specialists.defektolog',
          fields: [
            {
              key: 'photos', label: 'Фотографии детей и занятий', type: 'list', itemLabel: 'Фото',
              newItem: { file: '', title: '' },
              itemIcon: '📸',
              itemDesc: 'Фотографии появятся на странице дефектолога в фотогалерее занятий.',
              fields: [
                { key: 'file', label: 'Фотография', type: 'image' },
                { key: 'title', label: 'Подпись к фото (например: Развитие пространственного восприятия)', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'Дефектолог: видеоматериалы занятий', path: 'specialists.defektolog',
          fields: [
            {
              key: 'videos', label: 'Видеозаписи занятий и упражнений', type: 'list', itemLabel: 'Видео',
              newItem: { file: '', title: '' },
              itemIcon: '🎬',
              itemDesc: 'Видеоролики коррекционно-развивающих занятий (MP4, WebM, MOV).',
              fields: [
                { key: 'title', label: 'Название видео', type: 'text' },
                { key: 'file', label: 'Видеофайл (MP4, WebM, MOV)', type: 'video' }
              ]
            }
          ]
        },
        {
          title: 'Дефектолог: презентации в PDF и документы', path: 'specialists.defektolog',
          fields: [
            {
              key: 'pdfs', label: 'Презентации / документы', type: 'list', itemLabel: 'Презентация (PDF)',
              newItem: { title: '', file: '' },
              itemIcon: '📊',
              itemDesc: 'Презентации и методические документы, доступные для скачивания родителями.',
              fields: [
                { key: 'title', label: 'Название презентации', type: 'text' },
                { key: 'file', label: 'Файл презентации (PDF или документ)', type: 'file' }
              ]
            }
          ]
        },
        {
          title: 'Дефектолог: полезные советы (с файлами памятки)', path: 'specialists.defektolog',
          fields: [
            {
              key: 'blog', label: 'Полезные советы и статьи', type: 'list', itemLabel: 'Совет',
              newItem: { title: '', text: '', file: '', fileTitle: '' },
              itemIcon: '💡',
              fields: [
                { key: 'title', label: 'Заголовок совета', type: 'text' },
                { key: 'text', label: 'Текст совета / рекомендации', type: 'textarea' },
                { key: 'fileTitle', label: 'Название прикрепляемого файла (памятки)', type: 'text' },
                { key: 'file', label: 'Файл к совету (PDF, памятка)', type: 'file' }
              ]
            }
          ]
        },
        {
          title: 'Дефектолог: профиль специалиста', path: 'specialists.defektolog.teacher',
          fields: [
            { key: 'photo', label: 'Фото дефектолога', type: 'image' },
            { key: 'name', label: 'ФИО дефектолога', type: 'text' },
            { key: 'role', label: 'Должность / звание (например: Учитель-дефектолог)', type: 'text' },
            { key: 'desc', label: 'Кратко о специалисте (опыт, образование)', type: 'textarea' }
          ]
        },
        {
          title: 'Дефектолог: обращение к родителям', path: 'specialists.defektolog',
          fields: [
            { key: 'title', label: 'Заголовок страницы', type: 'text' },
            { key: 'lead', label: 'Подзаголовок', type: 'textarea' },
            { key: 'letterTitle', label: 'Заголовок письма', type: 'text' },
            { key: 'letter', label: 'Текст письма родителям', type: 'textarea', cls: 'textarea--tall' }
          ]
        }
      ]
    },
    {
      id: 'specialists', label: 'Все специалисты', icon: '💬', group: 'Специалисты',
      title: 'Все специалисты сопровождения', lead: 'Психолог, логопед и дефектолог. Добавляйте фотографии, видеозаписи и презентации.',
      blocks: [
        /* Психолог */
        {
          title: 'Психолог: фото детей и занятий', path: 'specialists.psiholog',
          fields: [
            {
              key: 'photos', label: 'Фотографии детей и занятий (Психолог)', type: 'list', itemLabel: 'Фото',
              newItem: { file: '', title: '' },
              itemIcon: '📸',
              itemDesc: 'Фотографии появятся на странице психолога в фотогалерее занятий.',
              fields: [
                { key: 'file', label: 'Фотография', type: 'image' },
                { key: 'title', label: 'Подпись к фото', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'Психолог: видеоматериалы занятий', path: 'specialists.psiholog',
          fields: [
            {
              key: 'videos', label: 'Видеозаписи занятий и упражнений (Психолог)', type: 'list', itemLabel: 'Видео',
              newItem: { file: '', title: '' },
              itemIcon: '🎬',
              fields: [
                { key: 'title', label: 'Название видео', type: 'text' },
                { key: 'file', label: 'Видеофайл (MP4, WebM)', type: 'video' }
              ]
            }
          ]
        },
        {
          title: 'Психолог: презентации в PDF и документы', path: 'specialists.psiholog',
          fields: [
            {
              key: 'pdfs', label: 'Презентации / документы (Психолог)', type: 'list', itemLabel: 'Презентация (PDF)',
              newItem: { title: '', file: '' },
              itemIcon: '📊',
              fields: [
                { key: 'title', label: 'Название презентации', type: 'text' },
                { key: 'file', label: 'Файл презентации (PDF)', type: 'file' }
              ]
            }
          ]
        },
        /* Логопед */
        {
          title: 'Логопед: фото детей и занятий', path: 'specialists.logoped',
          fields: [
            {
              key: 'photos', label: 'Фотографии детей и занятий (Логопед)', type: 'list', itemLabel: 'Фото',
              newItem: { file: '', title: '' },
              itemIcon: '📸',
              itemDesc: 'Фотографии появятся на странице логопеда в фотогалерее занятий.',
              fields: [
                { key: 'file', label: 'Фотография', type: 'image' },
                { key: 'title', label: 'Подпись к фото', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'Логопед: видеоматериалы занятий', path: 'specialists.logoped',
          fields: [
            {
              key: 'videos', label: 'Видеозаписи занятий (Логопед)', type: 'list', itemLabel: 'Видео',
              newItem: { file: '', title: '' },
              itemIcon: '🎬',
              fields: [
                { key: 'title', label: 'Название видео', type: 'text' },
                { key: 'file', label: 'Видеофайл (MP4, WebM)', type: 'video' }
              ]
            }
          ]
        },
        {
          title: 'Логопед: презентации в PDF и документы', path: 'specialists.logoped',
          fields: [
            {
              key: 'pdfs', label: 'Презентации / документы (Логопед)', type: 'list', itemLabel: 'Презентация (PDF)',
              newItem: { title: '', file: '' },
              itemIcon: '📊',
              fields: [
                { key: 'title', label: 'Название презентации', type: 'text' },
                { key: 'file', label: 'Файл презентации (PDF)', type: 'file' }
              ]
            }
          ]
        },
        /* Дефектолог */
        {
          title: 'Дефектолог: фото детей и занятий', path: 'specialists.defektolog',
          fields: [
            {
              key: 'photos', label: 'Фотографии детей и занятий (Дефектолог)', type: 'list', itemLabel: 'Фото',
              newItem: { file: '', title: '' },
              itemIcon: '📸',
              itemDesc: 'Фотографии появятся на странице дефектолога в фотогалерее занятий.',
              fields: [
                { key: 'file', label: 'Фотография', type: 'image' },
                { key: 'title', label: 'Подпись к фото', type: 'text' }
              ]
            }
          ]
        },
        {
          title: 'Дефектолог: видеоматериалы занятий', path: 'specialists.defektolog',
          fields: [
            {
              key: 'videos', label: 'Видеозаписи занятий (Дефектолог)', type: 'list', itemLabel: 'Видео',
              newItem: { file: '', title: '' },
              itemIcon: '🎬',
              fields: [
                { key: 'title', label: 'Название видео', type: 'text' },
                { key: 'file', label: 'Видеофайл (MP4, WebM)', type: 'video' }
              ]
            }
          ]
        },
        {
          title: 'Дефектолог: презентации в PDF и документы', path: 'specialists.defektolog',
          fields: [
            {
              key: 'pdfs', label: 'Презентации / документы (Дефектолог)', type: 'list', itemLabel: 'Презентация (PDF)',
              newItem: { title: '', file: '' },
              itemIcon: '📊',
              fields: [
                { key: 'title', label: 'Название презентации', type: 'text' },
                { key: 'file', label: 'Файл презентации (PDF)', type: 'file' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'workbooks', label: 'Тетради', icon: '📗', group: 'Страницы',
      title: 'Рабочие тетради', lead: 'Электронные сборники заданий по предметам.',
      blocks: [
        {
          title: 'Заголовки страницы', path: 'workbooks',
          fields: [
            { key: 'title', label: 'Заголовок раздела', type: 'text' },
            { key: 'lead', label: 'Подзаголовок', type: 'textarea' }
          ]
        },
        {
          title: 'Предметы и тетради', path: 'workbooks',
          fields: [
            {
              key: 'subjects', label: 'Предметы', type: 'list', itemLabel: 'Предмет',
              newItem: { icon: '📗', title: '', books: [] },
              fields: [
                { key: 'icon', label: 'Значок', type: 'text' },
                { key: 'title', label: 'Название предмета', type: 'text' },
                {
                  key: 'books', label: 'Тетради', type: 'list', itemLabel: 'Тетрадь',
                  newItem: { title: '', file: '' },
                  fields: [
                    { key: 'title', label: 'Название пособия (класс / тема)', type: 'text' },
                    { key: 'file', label: 'Файл тетради (PDF или документ)', type: 'file' }
                  ]
                }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'gallery', label: 'Интересные моменты', icon: '📸', group: 'Страницы',
      title: 'Интересные моменты', lead: 'Фотографии и видеозаписи школьной жизни.',
      blocks: [
        {
          title: 'Заголовки страницы', path: 'gallery',
          fields: [
            { key: 'title', label: 'Заголовок раздела', type: 'text' },
            { key: 'lead', label: 'Подзаголовок', type: 'textarea' }
          ]
        },
        {
          title: 'Фотографии и видео', path: 'gallery',
          fields: [
            {
              key: 'items', label: 'Материалы', type: 'list', itemLabel: 'Снимок/видео',
              newItem: { file: '', title: '' },
              fields: [
                { key: 'file', label: 'Файл снимка или видео', type: 'media' },
                { key: 'title', label: 'Подпись', type: 'text' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'reviews', label: 'Отзывы', icon: '⭐', group: 'Страницы',
      title: 'Отзывы родителей', lead: 'Отзывы о работе специалистов.',
      blocks: [
        {
          title: 'Отзывы', path: 'reviews',
          fields: [
            { key: 'title', label: 'Заголовок страницы', type: 'text' },
            {
              key: 'items', label: 'Список отзывов', type: 'list', itemLabel: 'Отзыв',
              newItem: { name: '', date: '2026-09-27', text: '', rating: 5 },
              fields: [
                { key: 'name', label: 'Имя родителя', type: 'text' },
                { key: 'date', label: 'Дата (ГГГГ-ММ-ДД)', type: 'text' },
                { key: 'rating', label: 'Оценка (1-5)', type: 'number' },
                { key: 'text', label: 'Текст отзыва', type: 'textarea' }
              ]
            }
          ]
        }
      ]
    },
    {
      id: 'footer', label: 'Подвал и контакты', icon: '📮', group: 'Сайт',
      title: 'Подвал и форма консультаций', lead: 'Форма записи, специалисты и ссылки на соцсети.',
      blocks: [
        {
          title: 'Запись на консультацию', path: 'footer',
          fields: [
            { key: 'formTitle', label: 'Заголовок формы', type: 'text' },
            { key: 'formNote', label: 'Пояснение под заголовком', type: 'textarea' }
          ]
        },
        {
          title: 'Контакты «Мы на связи»', path: 'footer',
          fields: [
            { key: 'contactsTitle', label: 'Заголовок блока', type: 'text' },
            {
              key: 'links', label: 'Ссылки на группы и контакты', type: 'list', itemLabel: 'Контакт',
              newItem: { icon: 'ВК', label: '', url: '', note: '' },
              fields: [
                { key: 'icon', label: 'Значок (эмодзи или ВК)', type: 'text' },
                { key: 'label', label: 'Название организации / контакта', type: 'text' },
                { key: 'url', label: 'Ссылка (URL)', type: 'text' },
                { key: 'note', label: 'Пояснение', type: 'text' }
              ]
            },
            { key: 'bottomNote', label: 'Подпись в самом низу сайта', type: 'text' }
          ]
        }
      ]
    }
  ];

  function renderSide() {
    $side.innerHTML = '';
    var groups = {};
    SECTIONS.forEach(function (s) {
      if (!groups[s.group]) groups[s.group] = [];
      groups[s.group].push(s);
    });

    Object.keys(groups).forEach(function (grp) {
      $side.appendChild(el('div', 'side__group-title', grp));
      groups[grp].forEach(function (s) {
        var btn = el('button', 'side__link' + (s.id === active ? ' is-active' : ''));
        btn.innerHTML = '<span>' + s.icon + '</span> <span>' + s.label + '</span>';
        btn.onclick = function () {
          if (dirty) { save(); }
          active = s.id;
          renderSide();
          renderWork();
        };
        $side.appendChild(btn);
      });
    });
  }

  function compressImage(file, maxDimension, quality, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
      var img = new Image();
      img.onload = function () {
        var w = img.width;
        var h = img.height;
        if (w > maxDimension || h > maxDimension) {
          if (w > h) {
            h = Math.round((h * maxDimension) / w);
            w = maxDimension;
          } else {
            w = Math.round((w * maxDimension) / h);
            h = maxDimension;
          }
        }
        var canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        var ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        canvas.toBlob(function (blob) {
          var dataUrl = canvas.toDataURL('image/jpeg', quality);
          callback(blob, dataUrl);
        }, 'image/jpeg', quality);
      };
      img.onerror = function () {
        callback(file, e.target.result);
      };
      img.src = e.target.result;
    };
    reader.onerror = function () {
      callback(null, null);
    };
    reader.readAsDataURL(file);
  }

  
  function openMediaPicker(filterKind, onSelect) {
    var modalBackdrop = el('div', 'media-modal-backdrop');
    var modal = el('div', 'media-modal');

    // Header
    var header = el('div', 'media-modal__header');
    var title = el('div', 'media-modal__title', '📁 Библиотека файлов сайта');
    var closeBtn = el('button', 'media-modal__close', '✕');
    closeBtn.type = 'button';
    closeBtn.onclick = function () {
      if (modalBackdrop.parentNode) modalBackdrop.parentNode.removeChild(modalBackdrop);
    };
    header.appendChild(title);
    header.appendChild(closeBtn);
    modal.appendChild(header);

    // Toolbar with filters
    var toolbar = el('div', 'media-modal__toolbar');
    var filters = el('div', 'media-modal__filters');
    var kinds = [
      { id: 'all', label: 'Все файлы' },
      { id: 'image', label: '📸 Фото' },
      { id: 'video', label: '🎬 Видео' },
      { id: 'doc', label: '📊 Документы' }
    ];
    var activeFilter = filterKind || 'all';

    var body = el('div', 'media-modal__body');
    var statusLoading = el('p', '', 'Загрузка библиотеки файлов…');
    body.appendChild(statusLoading);

    function loadGrid() {
      api('/api/media').then(function (res) {
        body.innerHTML = '';
        var items = (res && res.items) || [];
        var filtered = items.filter(function (it) {
          if (activeFilter === 'image') return it.isImage;
          if (activeFilter === 'video') return it.isVideo;
          if (activeFilter === 'doc') return it.isDoc;
          return true;
        });

        if (!filtered.length) {
          body.innerHTML = '<div style="text-align:center;padding:40px;color:var(--c-text-muted)">' +
            '<p style="font-size:1.1rem;font-weight:700">В этой категории пока нет загруженных файлов</p>' +
            '<p style="margin-top:8px;font-size:0.9rem">Вы можете загрузить новый файл прямо сейчас с вашего устройства.</p>' +
          '</div>';
          return;
        }

        var grid = el('div', 'media-grid');
        filtered.forEach(function (it) {
          var card = el('div', 'media-grid-card');
          var thumb = el('div', 'media-grid-card__thumb');
          if (it.isImage) {
            var img = el('img');
            img.src = it.url;
            img.loading = 'lazy';
            img.onerror = function () { img.style.opacity = 0.3; };
            thumb.appendChild(img);
          } else if (it.isVideo) {
            thumb.innerHTML = '<span style="font-size:2.8rem">🎬</span>';
          } else {
            thumb.innerHTML = '<span style="font-size:2.8rem">📊</span>';
          }
          card.appendChild(thumb);

          var meta = el('div', 'media-grid-card__meta');
          var name = el('span', 'media-grid-card__name', it.displayName || it.name);
          name.title = it.displayName || it.name;
          meta.appendChild(name);
          var sz = Math.round(it.size / 1024) + ' КБ';
          meta.appendChild(el('span', 'media-grid-card__size', sz));
          card.appendChild(meta);

          card.onclick = function () {
            onSelect(it.file, it.displayName || it.name);
            if (modalBackdrop.parentNode) modalBackdrop.parentNode.removeChild(modalBackdrop);
          };
          grid.appendChild(card);
        });
        body.appendChild(grid);
      }).catch(function (err) {
        body.innerHTML = '<p style="color:var(--c-danger)">Ошибка загрузки файлов: ' + err.message + '</p>';
      });
    }

    kinds.forEach(function (k) {
      var btn = el('button', 'media-filter-btn' + (k.id === activeFilter ? ' is-active' : ''), k.label);
      btn.type = 'button';
      btn.onclick = function () {
        activeFilter = k.id;
        toolbar.querySelectorAll('.media-filter-btn').forEach(function (b) { b.classList.remove('is-active'); });
        btn.classList.add('is-active');
        loadGrid();
      };
      filters.appendChild(btn);
    });
    toolbar.appendChild(filters);

    modal.appendChild(toolbar);
    modal.appendChild(body);
    modalBackdrop.appendChild(modal);

    modalBackdrop.addEventListener('click', function (e) {
      if (e.target === modalBackdrop) {
        modalBackdrop.parentNode.removeChild(modalBackdrop);
      }
    });

    document.body.appendChild(modalBackdrop);
    loadGrid();
  }

  function renderField(container, f, basePath) {
    var fieldPath = basePath ? basePath + '.' + f.key : f.key;
    var val = get(fieldPath);

    var wrap = el('div', 'field');
    wrap.appendChild(el('label', 'field__label', f.label));

    if (f.type === 'text') {
      var inp = el('input', 'input');
      inp.type = 'text';
      inp.value = val == null ? '' : val;
      inp.oninput = function () { set(fieldPath, inp.value); };
      wrap.appendChild(inp);
    } else if (f.type === 'number') {
      var numInp = el('input', 'input');
      numInp.type = 'number';
      numInp.value = val == null ? '' : val;
      numInp.oninput = function () { set(fieldPath, parseFloat(numInp.value) || 0); };
      wrap.appendChild(numInp);
    } else if (f.type === 'textarea') {
      var ta = el('textarea', 'textarea' + (f.cls ? ' ' + f.cls : ''));
      ta.value = val == null ? '' : val;
      ta.oninput = function () { set(fieldPath, ta.value); };
      wrap.appendChild(ta);
    } else if (f.type === 'image' || f.type === 'media') {
      var box = el('div', 'upload-card');
      var hiddenFile = el('input');
      hiddenFile.type = 'file';
      hiddenFile.accept = 'image/*,video/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.jfif,.heic,.HEIC,.JPG,.JPEG,.PNG,.mp4,.webm,.mov,.ogg';
      hiddenFile.style.display = 'none';

      var btnRow = el('div', 'upload-card__actions');
      var pickBtn = el('button', 'btn btn--outline btn--sm', f.type === 'media' ? '📁 Загрузить файл с устройства' : '🖼️ Загрузить фото с устройства');
      pickBtn.type = 'button';
      pickBtn.onclick = function () { hiddenFile.click(); };

      var libBtn = el('button', 'btn btn--ghost btn--sm', '🗂️ Выбрать из библиотеки');
      libBtn.type = 'button';
      libBtn.onclick = function () {
        openMediaPicker(f.type === 'image' ? 'image' : 'all', function (selectedFile, selectedName) {
          set(fieldPath, selectedFile);
          updatePreview(selectedFile);
          var titlePath = fieldPath.replace(/\.(file|photo)$/, '.title');
          var curTitle = get(titlePath);
          if (!curTitle) {
            var baseTitle = selectedName.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
            if (baseTitle) set(titlePath, baseTitle);
          }
          save();
        });
      };

      var clearBtn = el('button', 'btn btn--danger btn--sm', '✕ Очистить');
      clearBtn.type = 'button';
      clearBtn.style.display = val ? 'inline-flex' : 'none';

      var statusSpan = el('div', 'field__hint', '');
      var preview = el('div', 'img-preview');

      function updatePreview(url) {
        if (!url) {
          preview.innerHTML = '<span style="color:#999;font-size:0.88rem;display:block;padding:8px">Файл не выбран</span>';
          clearBtn.style.display = 'none';
          return;
        }
        var src = (url.startsWith('/') || url.startsWith('data:') || url.startsWith('http')) ? url : '/' + url;
        var isVid = /\.(mp4|webm|mov|ogg)$/i.test(url);
        var mediaHtml = isVid
          ? '<video src="' + src + '" controls playsinline style="width:100%;max-height:180px;display:block;border-radius:4px;background:#000"></video>'
          : '<img src="' + src + '" alt="Превью" style="width:100%;max-height:200px;object-fit:cover;display:block;border-radius:4px" onerror="this.style.opacity=0.4">';

        preview.innerHTML = mediaHtml +
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;gap:8px">' +
            '<span style="font-size:0.82rem;font-weight:700;color:var(--c-text-muted);word-break:break-all">' + (isVid ? '🎬 ' : '📸 ') + url.split('/').pop() + '</span>' +
            '<a href="' + src + '" target="_blank" class="btn btn--ghost btn--sm" style="font-size:0.75rem;padding:2px 8px">👁️ Открыть</a>' +
          '</div>';
        clearBtn.style.display = 'inline-flex';
      }
      updatePreview(val);

      clearBtn.onclick = function () {
        set(fieldPath, '');
        updatePreview('');
        hiddenFile.value = '';
        statusSpan.textContent = 'Файл удален';
        statusSpan.style.color = '#64748B';
        save();
      };

      hiddenFile.onchange = function () {
        var file = hiddenFile.files[0];
        if (!file) return;
        statusSpan.textContent = '⏳ Загрузка ' + file.name + ' на сайт…';
        statusSpan.style.color = '#F59E0B';
        $save.disabled = true;

        var isVid = /\.(mp4|webm|mov|ogg)$/i.test(file.name);
        var uploadKind = isVid ? 'video' : 'image';

        fetch('/api/upload?kind=' + uploadKind, {
          method: 'POST',
          headers: { 'X-Filename': encodeURIComponent(file.name) },
          body: file
        }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }).then(function (res) {
          if (res && res.file) {
            set(fieldPath, res.file);
            updatePreview(res.file);
            statusSpan.textContent = '✓ Файл успешно сохранен на сайте!';
            statusSpan.style.color = '#10B981';
            var titlePath = fieldPath.replace(/\.(file|photo)$/, '.title');
            var curTitle = get(titlePath);
            if (!curTitle) {
              var baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
              if (baseTitle) set(titlePath, baseTitle);
            }
            save();
          }
        }).catch(function (err) {
          $save.disabled = false;
          statusSpan.textContent = 'Ошибка загрузки: ' + err.message;
          statusSpan.style.color = '#EF4444';
          toast('Ошибка загрузки: ' + err.message, true);
        });
      };

      btnRow.appendChild(pickBtn);
      btnRow.appendChild(libBtn);
      btnRow.appendChild(clearBtn);
      box.appendChild(btnRow);
      box.appendChild(hiddenFile);
      box.appendChild(statusSpan);
      box.appendChild(preview);
      wrap.appendChild(box);
    } else if (f.type === 'video') {
      var videoBox = el('div', 'upload-card');
      var hiddenVideo = el('input');
      hiddenVideo.type = 'file';
      hiddenVideo.accept = 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov';
      hiddenVideo.style.display = 'none';

      var vBtnRow = el('div', 'upload-card__actions');
      var pickVideoBtn = el('button', 'btn btn--outline btn--sm', '🎬 Загрузить видео (MP4, WebM, MOV)');
      pickVideoBtn.type = 'button';
      pickVideoBtn.onclick = function () { hiddenVideo.click(); };

      var libVideoBtn = el('button', 'btn btn--ghost btn--sm', '🗂️ Выбрать из библиотеки');
      libVideoBtn.type = 'button';
      libVideoBtn.onclick = function () {
        openMediaPicker('video', function (selectedFile, selectedName) {
          set(fieldPath, selectedFile);
          updateVideoPreview(selectedFile);
          var titlePath = fieldPath.replace(/\.file$/, '.title');
          var curTitle = get(titlePath);
          if (!curTitle) {
            var baseTitle = selectedName.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
            if (baseTitle) set(titlePath, baseTitle);
          }
          save();
        });
      };

      var clearVideoBtn = el('button', 'btn btn--danger btn--sm', '✕ Очистить');
      clearVideoBtn.type = 'button';
      clearVideoBtn.style.display = val ? 'inline-flex' : 'none';

      var videoStatus = el('div', 'field__hint', '');
      var videoPreview = el('div', '', '');

      function updateVideoPreview(link) {
        if (link) {
          var src = (link.startsWith('/') || link.startsWith('http')) ? link : '/' + link;
          videoPreview.innerHTML = '<div style="margin-top:8px">' +
            '<video src="' + src + '" controls playsinline style="max-width:100%;max-height:180px;border-radius:8px;display:block;background:#000"></video>' +
            '<div style="display:flex;align-items:center;justify-content:space-between;margin-top:6px;gap:8px">' +
              '<span style="font-size:0.82rem;font-weight:700;color:var(--c-text-muted);word-break:break-all">🎬 ' + link.split('/').pop() + '</span>' +
              '<a href="' + src + '" target="_blank" class="btn btn--ghost btn--sm" style="font-size:0.75rem;padding:2px 8px">👁️ Открыть</a>' +
            '</div>' +
          '</div>';
          clearVideoBtn.style.display = 'inline-flex';
        } else {
          videoPreview.innerHTML = '<p style="margin-top:6px;font-size:0.85rem;color:#888">Видео пока не выбрано</p>';
          clearVideoBtn.style.display = 'none';
        }
      }
      updateVideoPreview(val);

      clearVideoBtn.onclick = function () {
        set(fieldPath, '');
        updateVideoPreview('');
        hiddenVideo.value = '';
        videoStatus.textContent = 'Видео удалено';
        videoStatus.style.color = '#64748B';
        save();
      };

      hiddenVideo.onchange = function () {
        var file = hiddenVideo.files[0];
        if (!file) return;
        videoStatus.textContent = '⏳ Загрузка видео ' + file.name + ' на сайт…';
        videoStatus.style.color = '#F59E0B';
        $save.disabled = true;

        fetch('/api/upload?kind=video', {
          method: 'POST',
          headers: { 'X-Filename': encodeURIComponent(file.name) },
          body: file
        }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }).then(function (res) {
          if (res && res.file) {
            set(fieldPath, res.file);
            updateVideoPreview(res.file);
            videoStatus.textContent = '✓ Видео успешно сохранено на сайте!';
            videoStatus.style.color = '#10B981';
            var titlePath = fieldPath.replace(/\.file$/, '.title');
            var curTitle = get(titlePath);
            if (!curTitle) {
              var baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
              if (baseTitle) set(titlePath, baseTitle);
            }
            save();
          }
        }).catch(function (err) {
          $save.disabled = false;
          videoStatus.textContent = 'Ошибка загрузки видео: ' + err.message;
          videoStatus.style.color = '#EF4444';
          toast('Ошибка загрузки видео: ' + err.message, true);
        });
      };

      vBtnRow.appendChild(pickVideoBtn);
      vBtnRow.appendChild(libVideoBtn);
      vBtnRow.appendChild(clearVideoBtn);
      videoBox.appendChild(vBtnRow);
      videoBox.appendChild(hiddenVideo);
      videoBox.appendChild(videoStatus);
      videoBox.appendChild(videoPreview);
      wrap.appendChild(videoBox);
    } else if (f.type === 'file') {
      var fileBox = el('div', 'upload-card');
      var hiddenDoc = el('input');
      hiddenDoc.type = 'file';
      hiddenDoc.accept = '.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.zip,.rar,.txt';
      hiddenDoc.style.display = 'none';

      var fBtnRow = el('div', 'upload-card__actions');
      var pickDocBtn = el('button', 'btn btn--outline btn--sm', '📊 Загрузить документ (PDF, презентацию)');
      pickDocBtn.type = 'button';
      pickDocBtn.onclick = function () { hiddenDoc.click(); };

      var libDocBtn = el('button', 'btn btn--ghost btn--sm', '🗂️ Выбрать из библиотеки');
      libDocBtn.type = 'button';
      libDocBtn.onclick = function () {
        openMediaPicker('doc', function (selectedFile, selectedName) {
          set(fieldPath, selectedFile);
          updateCurrentFile(selectedFile);
          var titlePath = fieldPath.replace(/\.file$/, '.title');
          var curTitle = get(titlePath);
          if (!curTitle) {
            var baseTitle = selectedName.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
            if (baseTitle) set(titlePath, baseTitle);
          }
          save();
        });
      };

      var clearDocBtn = el('button', 'btn btn--danger btn--sm', '✕ Очистить');
      clearDocBtn.type = 'button';
      clearDocBtn.style.display = val ? 'inline-flex' : 'none';

      var fileStatus = el('div', 'field__hint', '');
      var currentLink = el('div', '', '');

      function updateCurrentFile(link) {
        if (link) {
          var href = (link.startsWith('/') || link.startsWith('http')) ? link : '/' + link;
          currentLink.innerHTML = '<div style="margin-top:8px;padding:8px 12px;background:#fff;border-radius:6px;border:1px solid var(--c-border);display:flex;align-items:center;justify-content:space-between;gap:12px">' +
            '<span style="font-weight:700;color:var(--c-brand);word-break:break-all">📄 ' + link.split('/').pop() + '</span>' +
            '<a href="' + href + '" target="_blank" download class="btn btn--ghost btn--sm" style="white-space:nowrap">Проверить файл</a>' +
          '</div>';
          clearDocBtn.style.display = 'inline-flex';
        } else {
          currentLink.innerHTML = '<p style="margin-top:6px;font-size:0.85rem;color:#888">Файл пока не прикреплен</p>';
          clearDocBtn.style.display = 'none';
        }
      }
      updateCurrentFile(val);

      clearDocBtn.onclick = function () {
        set(fieldPath, '');
        updateCurrentFile('');
        hiddenDoc.value = '';
        fileStatus.textContent = 'Файл удален';
        fileStatus.style.color = '#64748B';
        save();
      };

      hiddenDoc.onchange = function () {
        var file = hiddenDoc.files[0];
        if (!file) return;
        fileStatus.textContent = '⏳ Загрузка файла ' + file.name + ' на сервер…';
        fileStatus.style.color = '#F59E0B';

        fetch('/api/upload?kind=doc', {
          method: 'POST',
          headers: { 'X-Filename': encodeURIComponent(file.name) },
          body: file
        }).then(function (r) {
          if (!r.ok) throw new Error('HTTP ' + r.status);
          return r.json();
        }).then(function (res) {
          if (res && res.file) {
            set(fieldPath, res.file);
            updateCurrentFile(res.file);
            fileStatus.textContent = '✓ Файл успешно сохранен на сервере!';
            fileStatus.style.color = '#10B981';
            var titlePath = fieldPath.replace(/\.file$/, '.title');
            var curTitle = get(titlePath);
            if (!curTitle) {
              var baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
              if (baseTitle) set(titlePath, baseTitle);
            }
            save();
          }
        }).catch(function (err) {
          fileStatus.textContent = 'Ошибка загрузки файла на сервер: ' + err.message;
          fileStatus.style.color = '#EF4444';
        });
      };

      fBtnRow.appendChild(pickDocBtn);
      fBtnRow.appendChild(libDocBtn);
      fBtnRow.appendChild(clearDocBtn);
      fileBox.appendChild(fBtnRow);
      fileBox.appendChild(hiddenDoc);
      fileBox.appendChild(fileStatus);
      fileBox.appendChild(currentLink);
      wrap.appendChild(fileBox);
    } else if (f.type === 'list') {
      var listItems = Array.isArray(val) ? val : [];
      var listWrap = el('div', 'list-container');
      var actionArea = el('div', '');

      function buildList() {
        listWrap.innerHTML = '';
        actionArea.innerHTML = '';

        var isMediaList = f.key === 'photos' || f.key === 'videos' || f.key === 'items';

        if (!listItems.length) {
          var emptyState = el('div', 'list-empty');
          var icon = f.itemIcon || (f.key === 'photos' ? '📸' : (f.key === 'videos' ? '🎬' : (f.key === 'pdfs' ? '📊' : (f.key === 'blog' ? '💡' : '📋'))));
          emptyState.appendChild(el('div', 'list-empty__icon', icon));
          emptyState.appendChild(el('div', 'list-empty__title', (f.label || 'Материалы') + ' пока не добавлены'));
          var descText = f.itemDesc || ('Нажмите кнопку ниже, чтобы добавить ' + (f.itemLabel || 'элемент') + '.');
          emptyState.appendChild(el('p', 'list-empty__desc', descText));

          var actRow = el('div', 'list-empty__actions');
          var mainAddBtn = el('button', 'btn btn--primary btn--add-lg', '＋ Добавить ' + (f.itemLabel || 'элемент'));
          mainAddBtn.type = 'button';
          mainAddBtn.onclick = function () {
            var newItem = JSON.parse(JSON.stringify(f.newItem || {}));
            listItems.push(newItem);
            set(fieldPath, listItems);
            buildList();
          };
          actRow.appendChild(mainAddBtn);

          // Batch upload options
          if (f.key === 'photos' || f.key === 'items') {
            var batchPhotosBtn = el('label', 'btn btn--outline btn--add-lg');
            batchPhotosBtn.innerHTML = '<span>📁</span> Загрузить сразу несколько фото';
            batchPhotosBtn.style.cursor = 'pointer';
            var batchInp = el('input');
            batchInp.type = 'file';
            batchInp.multiple = true;
            batchInp.accept = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.jfif,.heic,.HEIC,.JPG,.JPEG,.PNG';
            batchInp.style.display = 'none';
            batchInp.onchange = function () {
              if (!batchInp.files || !batchInp.files.length) return;
              handleBatchUpload(batchInp.files, 'image');
            };
            batchPhotosBtn.appendChild(batchInp);
            actRow.appendChild(batchPhotosBtn);
          }
          if (f.key === 'videos' || f.key === 'items') {
            var batchVideoBtn = el('label', 'btn btn--outline btn--add-lg');
            batchVideoBtn.innerHTML = '<span>🎬</span> Загрузить сразу несколько видео';
            batchVideoBtn.style.cursor = 'pointer';
            var batchVideoInp = el('input');
            batchVideoInp.type = 'file';
            batchVideoInp.multiple = true;
            batchVideoInp.accept = 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov';
            batchVideoInp.style.display = 'none';
            batchVideoInp.onchange = function () {
              if (!batchVideoInp.files || !batchVideoInp.files.length) return;
              handleBatchUpload(batchVideoInp.files, 'video');
            };
            batchVideoBtn.appendChild(batchVideoInp);
            actRow.appendChild(batchVideoBtn);
          }
          if (f.key === 'pdfs') {
            var batchPdfBtn = el('label', 'btn btn--outline btn--add-lg');
            batchPdfBtn.innerHTML = '<span>📑</span> Загрузить сразу несколько PDF';
            batchPdfBtn.style.cursor = 'pointer';
            var batchPdfInp = el('input');
            batchPdfInp.type = 'file';
            batchPdfInp.multiple = true;
            batchPdfInp.accept = '.pdf,.doc,.docx,.ppt,.pptx';
            batchPdfInp.style.display = 'none';
            batchPdfInp.onchange = function () {
              if (!batchPdfInp.files || !batchPdfInp.files.length) return;
              handleBatchUpload(batchPdfInp.files, 'doc');
            };
            batchPdfBtn.appendChild(batchPdfInp);
            actRow.appendChild(batchPdfBtn);
          }

          emptyState.appendChild(actRow);
          listWrap.appendChild(emptyState);
        } else {
          // Render Items
          listItems.forEach(function (item, idx) {
            var itemBox = el('div', 'list-item');
            var head = el('div', 'list-item__head');
            var itemTitle = (f.itemLabel || 'Элемент') + ' #' + (idx + 1);
            if (item && item.title) itemTitle += ': ' + item.title;

            var titleSpan = el('span', '', itemTitle);
            head.appendChild(titleSpan);

            var delBtn = el('button', 'btn btn--danger btn--sm', '🗑️ Удалить');
            delBtn.type = 'button';
            delBtn.onclick = function () {
              listItems.splice(idx, 1);
              set(fieldPath, listItems);
              save();
              buildList();
            };
            head.appendChild(delBtn);
            itemBox.appendChild(head);

            f.fields.forEach(function (subF) {
              renderField(itemBox, subF, fieldPath + '.' + idx);
            });
            listWrap.appendChild(itemBox);
          });

          // Action bar below items
          var actionsBar = el('div', 'list-actions-bar');
          var addAnotherBtn = el('button', 'btn btn--add', '＋ Добавить ' + (f.itemLabel || 'элемент'));
          addAnotherBtn.type = 'button';
          addAnotherBtn.onclick = function () {
            var newItem = JSON.parse(JSON.stringify(f.newItem || {}));
            listItems.push(newItem);
            set(fieldPath, listItems);
            buildList();
          };
          actionsBar.appendChild(addAnotherBtn);

          // Batch upload options
          if (f.key === 'photos' || f.key === 'items') {
            var batchPhotosBtn2 = el('label', 'btn btn--outline btn--sm');
            batchPhotosBtn2.innerHTML = '<span>📁</span> Добавить сразу несколько фото';
            batchPhotosBtn2.style.cursor = 'pointer';
            var batchInp2 = el('input');
            batchInp2.type = 'file';
            batchInp2.multiple = true;
            batchInp2.accept = 'image/*,.jpg,.jpeg,.png,.webp,.gif,.bmp,.avif,.jfif,.heic,.HEIC,.JPG,.JPEG,.PNG';
            batchInp2.style.display = 'none';
            batchInp2.onchange = function () {
              if (!batchInp2.files || !batchInp2.files.length) return;
              handleBatchUpload(batchInp2.files, 'image');
            };
            batchPhotosBtn2.appendChild(batchInp2);
            actionsBar.appendChild(batchPhotosBtn2);
          }
          if (f.key === 'videos' || f.key === 'items') {
            var batchVideoBtn2 = el('label', 'btn btn--outline btn--sm');
            batchVideoBtn2.innerHTML = '<span>🎬</span> Добавить ещё видео';
            batchVideoBtn2.style.cursor = 'pointer';
            var batchVideoInp2 = el('input');
            batchVideoInp2.type = 'file';
            batchVideoInp2.multiple = true;
            batchVideoInp2.accept = 'video/mp4,video/webm,video/ogg,video/quicktime,.mp4,.webm,.mov';
            batchVideoInp2.style.display = 'none';
            batchVideoInp2.onchange = function () {
              if (!batchVideoInp2.files || !batchVideoInp2.files.length) return;
              handleBatchUpload(batchVideoInp2.files, 'video');
            };
            batchVideoBtn2.appendChild(batchVideoInp2);
            actionsBar.appendChild(batchVideoBtn2);
          }
          if (f.key === 'pdfs') {
            var batchPdfBtn2 = el('label', 'btn btn--outline btn--sm');
            batchPdfBtn2.innerHTML = '<span>📑</span> Добавить несколько PDF';
            batchPdfBtn2.style.cursor = 'pointer';
            var batchPdfInp2 = el('input');
            batchPdfInp2.type = 'file';
            batchPdfInp2.multiple = true;
            batchPdfInp2.accept = '.pdf,.doc,.docx,.ppt,.pptx';
            batchPdfInp2.style.display = 'none';
            batchPdfInp2.onchange = function () {
              if (!batchPdfInp2.files || !batchPdfInp2.files.length) return;
              handleBatchUpload(batchPdfInp2.files, 'doc');
            };
            batchPdfBtn2.appendChild(batchPdfInp2);
            actionsBar.appendChild(batchPdfBtn2);
          }

          if (isMediaList) {
            var addFromLibBtn = el('button', 'btn btn--ghost btn--sm', '🗂️ Добавить из библиотеки');
            addFromLibBtn.type = 'button';
            addFromLibBtn.onclick = function () {
              openMediaPicker(f.key === 'videos' ? 'video' : (f.key === 'photos' ? 'image' : 'all'), function (selectedFile, selectedName) {
                var newItem = JSON.parse(JSON.stringify(f.newItem || {}));
                newItem.file = selectedFile;
                var baseTitle = selectedName.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
                if ('title' in newItem) newItem.title = baseTitle;
                listItems.push(newItem);
                set(fieldPath, listItems);
                save();
                buildList();
              });
            };
            actionsBar.appendChild(addFromLibBtn);
          }

          actionArea.appendChild(actionsBar);
        }
      }

      function handleBatchUpload(files, kind) {
        var total = files.length;
        var loaded = 0;
        toast('Загружаем ' + total + ' файлов…');
        Array.from(files).forEach(function (file) {
          var isVid = kind === 'video' || /\.(mp4|webm|mov|ogg)$/i.test(file.name);
          var uploadKind = isVid ? 'video' : (kind === 'doc' ? 'doc' : 'image');

          fetch('/api/upload?kind=' + uploadKind, {
            method: 'POST',
            headers: { 'X-Filename': encodeURIComponent(file.name) },
            body: file
          }).then(function (r) {
            if (!r.ok) throw new Error('HTTP ' + r.status);
            return r.json();
          }).then(function (res) {
            var filePath = (res && res.file) ? res.file : '';
            if (filePath) {
              var baseTitle = file.name.replace(/\.[^/.]+$/, '').replace(/^[0-9_-]+/, '').replace(/[_-]/g, ' ').trim();
              var newItem = JSON.parse(JSON.stringify(f.newItem || {}));
              newItem.file = filePath;
              if ('title' in newItem) newItem.title = baseTitle || (uploadKind === 'video' ? 'Видео ' + (listItems.length + 1) : 'Фото ' + (listItems.length + 1));
              listItems.push(newItem);
              set(fieldPath, listItems);
            }
            loaded++;
            if (loaded === total) {
              toast('✓ Все ' + total + ' файлов успешно загружены и сохранены на сайте!');
              save();
              buildList();
            }
          }).catch(function (err) {
            loaded++;
            toast('Ошибка загрузки ' + file.name + ': ' + err.message, true);
            if (loaded === total) {
              save();
              buildList();
            }
          });
        });
      }

      buildList();
      wrap.appendChild(listWrap);
      wrap.appendChild(actionArea);
    }
    container.appendChild(wrap);
  }

  function renderWork() {
    $work.innerHTML = '';
    var sec = SECTIONS.filter(function (s) { return s.id === active; })[0];
    if (!sec) return;

    var head = el('div', 'work__head');
    head.appendChild(el('h1', '', sec.title));
    if (sec.lead) head.appendChild(el('p', '', sec.lead));
    $work.appendChild(head);

    // Sub-navigation tabs for Specialists
    if (sec.group === 'Специалисты' || sec.id.startsWith('specialists')) {
      var subnav = el('div', 'spec-subnav');
      var specTabs = [
        { id: 'specialists_psiholog', label: '🧠 Педагог-психолог' },
        { id: 'specialists_logoped', label: '🗣️ Учитель-логопед' },
        { id: 'specialists_defektolog', label: '🧩 Учитель-дефектолог' },
        { id: 'specialists', label: '💬 Все специалисты' }
      ];
      specTabs.forEach(function (tab) {
        var tabBtn = el('button', 'spec-subnav__btn' + (tab.id === active ? ' is-active' : ''), tab.label);
        tabBtn.type = 'button';
        tabBtn.onclick = function () {
          if (dirty) { save(); }
          active = tab.id;
          renderSide();
          renderWork();
        };
        subnav.appendChild(tabBtn);
      });
      $work.appendChild(subnav);
    }

    sec.blocks.forEach(function (b) {
      var box = el('div', 'block');
      box.appendChild(el('h2', 'block__title', b.title));
      b.fields.forEach(function (f) {
        renderField(box, f, b.path);
      });
      $work.appendChild(box);
    });
  }

  function save() {
    $save.disabled = true;
    $state.textContent = "Сохраняем…";
    $state.className = "save-state";

    // Всегда синхронизируем с локальной памятью браузера
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      localStorage.setItem("SITE_CONTENT", JSON.stringify(data));
    } catch (e) {}

    // Отправляем на сервер для пересборки страниц
    api("/api/content", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    }).then(function (res) {
      dirty = false;
      $state.textContent = "Все изменения сохранены на сайте";
      $state.className = "save-state";
      $save.disabled = false;
      window.SITE_CONTENT = data;
      toast("✓ Все изменения и файлы успешно сохранены на сайте!");
    }).catch(function (e) {
      dirty = false;
      $state.textContent = "Сохранено локально в браузере";
      $state.className = "save-state";
      $save.disabled = false;
      toast("Сохранено в браузере: " + (e.message || ""), true);
    });
  }

  $save.onclick = save;

  // Экспорт JSON резервной копии
  $exportJson.onclick = function () {
    var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = 'osobyi-marshrut-backup.json';
    a.click();
    URL.revokeObjectURL(url);
    toast('Файл резервной копии скачан!');
  };

  // Импорт JSON
  $importJson.onchange = function (e) {
    var file = e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function (ev) {
      try {
        var parsed = JSON.parse(ev.target.result);
        if (parsed && typeof parsed === 'object') {
          data = parsed;
          save();
          renderWork();
          toast('Данные успешно импортированы!');
        }
      } catch (err) {
        toast('Ошибка чтения файла: ' + err.message, true);
      }
    };
    reader.readAsText(file);
  };

  // СТАРТ: Первичная загрузка из window.SITE_CONTENT и актуализация с сервера
  data = window.SITE_CONTENT || {};

  // Очищаем старые версии локального хранилища во избежание подмены фото
  try {
    localStorage.removeItem('OSOBYI_MARSHRUT_CONTENT_V4');
  } catch (e) {}

  // Всегда синхронизируем с сервером при открытии админки
  api('/api/content').then(function (res) {
    if (res && res.content) {
      data = res.content;
      window.SITE_CONTENT = data;
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem('SITE_CONTENT', JSON.stringify(data));
      } catch (e) {}
      renderWork();
    }
  }).catch(function () {});

  renderSide();
  renderWork();
})();
