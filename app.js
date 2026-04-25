/* ============================================================
   JM FITNESS APP — app.js
   Autor: Javier Manzano Fitness
   Arquitectura: State → Persist → Render → UI → Handlers → Init
   Sin frameworks. Vanilla JS modular.
   ============================================================ */

'use strict';


/* ============================================================
   0. CONSTANTES
   ============================================================ */
const STORAGE_KEYS = {
  WOD:     'jm_wod',
  ARCHIVE: 'jm_archive',
  PDFS:    'jm_pdfs',
  AUTH:    'jm_auth_ts',   // timestamp del último login correcto
};

// Contraseña del panel admin — cámbiala aquí cuando quieras
const ADMIN_PASSWORD = 'jm2026';

// Sesión válida durante 8 horas (en ms)
const SESSION_DURATION = 8 * 60 * 60 * 1000;


/* ============================================================
   1. STATE
   ============================================================ */
const state = {

  wod: {
    week:      'Semana 17 · 21 abr 2026',
    title:     'Full Body — Fuerza Base',
    format:    "AMRAP 20'",
    diff:      '★★★☆☆',
    subtitle:  "AMRAP 20' · Material mínimo · Todas las fichas",
    month:     'Abril 2026 — Fuerza Base',
    note:      'Ajusta el peso para mantener el RIR indicado en cada serie. No sacrifiques técnica por carga. Si tienes dudas, mándame un mensaje.',
    exercises: [
      ['Sentadilla búlgara',   '10 reps c/p · RIR 2'],
      ['Press banca o fondos', '8 reps · RIR 1'],
      ['Peso muerto rumano',   '10 reps · RIR 2'],
      ['Remo con mancuerna',   '10 reps c/p · RIR 2'],
      ['Plancha isométrica',   '45 seg'],
    ],
  },

  archive: [
    { week: 'Sem 16 · 14 abr', title: 'Tren inferior · Hipertrofia', meta: '5×10 · RIR progresivo'    },
    { week: 'Sem 15 · 7 abr',  title: 'Empuje & Core',               meta: "EMOM 16' · Alta densidad" },
    { week: 'Sem 14 · 31 mar', title: 'Full Body · Hipertrofia',     meta: "AMRAP 20' · DropSets"    },
    { week: 'Sem 12 · 17 mar', title: 'Circuito Metabólico',         meta: 'Tabata modificado'        },
    { week: 'Sem 10 · 3 mar',  title: 'Jalones & Tirón',             meta: '4×8 · Control excéntrico' },
    { week: 'Sem 8 · 18 feb',  title: 'Pierna completa',             meta: 'Búlgara + RDL + Hip Thrust' },
  ],

  rutinas: [
    {
      id:     'patrones-movimiento',
      days:   '5 días / semana',
      name:   'Entrenamiento por Patrones de Movimiento',
      desc:   'Recomendada · Gimnasio · Empuje, tirón, bisagra, sentadilla y core',
      urlPdf: '#',
      urlVer: '#',
    },
    {
      id:     'entrenamiento-casa',
      days:   'Poco material',
      name:   'Entrenamiento en Casa',
      desc:   'Todos los niveles · Mancuernas o bandas · Sin excusas',
      urlPdf: '#',
      urlVer: '#',
    },
    {
      id:     'hiit',
      days:   'Variable',
      name:   'Entrenamiento HIIT',
      desc:   'Cardio + fuerza · Alta intensidad · Quema grasa eficiente',
      urlPdf: '#',
      urlVer: '#',
    },
    {
      id:     'gluteo',
      days:   '2 días / semana',
      name:   'Entrenamiento de Glúteo',
      desc:   'Específico · Hipertrofia glútea · Progresión por fases',
      urlPdf: '#',
      urlVer: '#',
    },
  ],

  dynamicPdfs: [],
  activeTab: 'wod',
};


/* ============================================================
   2. PERSIST
   ============================================================ */
const persist = {

  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('JM App: no se pudo guardar en localStorage.', e);
    }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('JM App: error al leer localStorage.', e);
      return null;
    }
  },

  hydrate() {
    const savedWod     = persist.load(STORAGE_KEYS.WOD);
    const savedArchive = persist.load(STORAGE_KEYS.ARCHIVE);
    const savedPdfs    = persist.load(STORAGE_KEYS.PDFS);

    if (
      savedWod !== null &&
      typeof savedWod === 'object' &&
      typeof savedWod.week === 'string' &&
      typeof savedWod.title === 'string' &&
      Array.isArray(savedWod.exercises) &&
      savedWod.exercises.every(e =>
        Array.isArray(e) && e.length >= 2 &&
        typeof e[0] === 'string' && typeof e[1] === 'string'
      )
    ) {
      state.wod = savedWod;
      state.wod.subtitle = state.wod.subtitle ?? '';
      state.wod.month    = state.wod.month    ?? '';
      state.wod.note     = state.wod.note     ?? '';
      state.wod.diff     = state.wod.diff     ?? '★★★☆☆';
      state.wod.format   = state.wod.format   ?? '';
    }

    if (
      savedArchive !== null &&
      Array.isArray(savedArchive) &&
      savedArchive.every(
        e => e && typeof e.week === 'string' &&
                  typeof e.title === 'string' &&
                  typeof e.meta === 'string'
      )
    ) {
      state.archive = savedArchive;
    }

    if (
      savedPdfs !== null &&
      Array.isArray(savedPdfs) &&
      savedPdfs.every(
        p => p && typeof p.name === 'string' && typeof p.cat === 'string'
      )
    ) {
      state.dynamicPdfs = savedPdfs;
    }
  },

  saveWod() {
    persist.save(STORAGE_KEYS.WOD,     state.wod);
    persist.save(STORAGE_KEYS.ARCHIVE, state.archive);
  },

  savePdfs() {
    persist.save(STORAGE_KEYS.PDFS, state.dynamicPdfs);
  },
};


/* ============================================================
   3. AUTH — Protección del Panel Admin
   ============================================================ */
const auth = {

  /** true si hay sesión activa y no ha expirado */
  isLoggedIn() {
    const ts = persist.load(STORAGE_KEYS.AUTH);
    if (!ts || typeof ts !== 'number') return false;
    return (Date.now() - ts) < SESSION_DURATION;
  },

  /** Guarda el timestamp de login */
  login() {
    persist.save(STORAGE_KEYS.AUTH, Date.now());
  },

  /** Borra la sesión */
  logout() {
    localStorage.removeItem(STORAGE_KEYS.AUTH);
  },

  /**
   * Muestra el modal de contraseña en lugar del panel admin.
   * Si ya hay sesión válida, abre directamente el panel.
   */
  requestAccess() {
    if (auth.isLoggedIn()) {
      ui.openModal();
      return;
    }
    auth._showLoginOverlay();
  },

  _showLoginOverlay() {
    // Crear overlay de login si no existe
    if (document.getElementById('login-overlay')) {
      document.getElementById('login-overlay').classList.add('open');
      document.getElementById('login-input').value = '';
      document.getElementById('login-error').hidden = true;
      setTimeout(() => document.getElementById('login-input').focus(), 100);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'login-overlay';
    overlay.className = 'overlay open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Acceso al panel');

    overlay.innerHTML = `
      <div class="modal" style="max-width:360px">
        <div class="modal-head">
          <div class="modal-title">Acceso restringido</div>
          <button class="modal-close" id="login-close" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-body" style="padding:28px 24px 32px">
          <p style="color:var(--muted);font-size:13px;margin-bottom:20px;line-height:1.5">
            El panel de administración es solo para Javier.<br>Introduce la contraseña para continuar.
          </p>
          <div class="form-group">
            <label class="form-label" for="login-input">Contraseña</label>
            <input class="form-input" id="login-input" type="password"
              placeholder="••••••••" autocomplete="current-password"
              style="letter-spacing:3px">
          </div>
          <p id="login-error" hidden
            style="color:#c0392b;font-size:12px;margin-top:8px;margin-bottom:0">
            Contraseña incorrecta. Inténtalo de nuevo.
          </p>
          <div class="modal-actions" style="margin-top:24px">
            <button class="btn btn-gold" id="login-submit" type="button">Entrar →</button>
            <button class="btn btn-ghost" id="login-cancel" type="button">Cancelar</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    // Listeners del login
    document.getElementById('login-submit').addEventListener('click', auth._handleLogin);
    document.getElementById('login-cancel').addEventListener('click', auth._closeLogin);
    document.getElementById('login-close').addEventListener('click', auth._closeLogin);
    document.getElementById('login-input').addEventListener('keydown', e => {
      if (e.key === 'Enter') auth._handleLogin();
    });

    // Cerrar al clic fuera del modal
    overlay.addEventListener('click', e => {
      if (e.target === overlay) auth._closeLogin();
    });

    setTimeout(() => document.getElementById('login-input').focus(), 100);
  },

  _handleLogin() {
    const input = document.getElementById('login-input');
    const error = document.getElementById('login-error');

    if (input.value === ADMIN_PASSWORD) {
      auth.login();
      auth._closeLogin();
      ui.openModal();
    } else {
      input.value = '';
      error.hidden = false;
      input.focus();
      // Shake visual
      input.style.borderColor = '#c0392b';
      setTimeout(() => { input.style.borderColor = ''; }, 1500);
    }
  },

  _closeLogin() {
    const overlay = document.getElementById('login-overlay');
    if (overlay) overlay.classList.remove('open');
  },
};


/* ============================================================
   4. UTILS
   ============================================================ */
const utils = {

  el(tag, classes, text) {
    const node = document.createElement(tag);
    const cls  = Array.isArray(classes) ? classes : [classes];
    cls.forEach(c => { if (c) node.classList.add(c); });
    if (text !== undefined) node.textContent = text;
    return node;
  },

  empty(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  },

  showToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;
    toast.classList.add('toast--visible');
    setTimeout(() => {
      toast.classList.remove('toast--visible');
      ui.closeModal();
    }, 2200);
  },

  notEmpty(val) {
    return typeof val === 'string' && val.trim().length > 0;
  },

  linkOrButton(url, label, className) {
    if (url && url !== '#') {
      const a       = document.createElement('a');
      a.href        = url;
      a.target      = '_blank';
      a.rel         = 'noopener noreferrer';
      a.className   = className;
      a.textContent = label;
      return a;
    }
    const btn       = document.createElement('button');
    btn.className   = className + ' btn--pending';
    btn.textContent = label;
    btn.disabled    = true;
    btn.title       = 'Próximamente';
    return btn;
  },
};


/* ============================================================
   5. RENDER
   ============================================================ */
const render = {

  wod() {
    const w = state.wod;
    document.getElementById('current-month-label').textContent = w.month;
    document.getElementById('wd-week').textContent             = w.week;
    document.getElementById('wd-title').textContent            = w.title;
    document.getElementById('wd-format').textContent           = w.format;
    document.getElementById('wd-diff').textContent             = w.diff;
    document.getElementById('wd-subtitle').textContent         = w.subtitle;
    document.getElementById('wd-note').textContent             = w.note;

    const container = document.getElementById('wd-exercises');
    utils.empty(container);
    w.exercises.forEach(([name, spec], i) => {
      const row = utils.el('div', 'wod-ex-row');
      row.append(
        utils.el('span', 'wod-ex-num',  String(i + 1).padStart(2, '0')),
        utils.el('span', 'wod-ex-name', name),
        utils.el('span', 'wod-ex-spec', spec),
      );
      container.appendChild(row);
    });
  },

  archive() {
    const grid = document.getElementById('wod-archive');
    utils.empty(grid);
    state.archive.forEach(({ week, title, meta }) => {
      const card = utils.el('div', 'archive-card');
      card.append(
        utils.el('div', 'ac-week',  week),
        utils.el('div', 'ac-title', title),
        utils.el('div', 'ac-meta',  meta),
      );
      grid.appendChild(card);
    });
    document.getElementById('archive-count').textContent =
      `${state.archive.length} sesiones anteriores`;
  },

  rutinas() {
    const container = document.getElementById('rutinas-list');
    if (!container) return;
    utils.empty(container);

    state.rutinas.forEach(rutina => {
      const card      = utils.el('div', 'rutina-card');
      card.dataset.id = rutina.id;

      const info = utils.el('div', 'rc-info');
      info.append(
        utils.el('div', 'rc-days', rutina.days),
        utils.el('div', 'rc-name', rutina.name),
        utils.el('div', 'rc-desc', rutina.desc),
      );

      const actions = utils.el('div', 'rc-actions');
      actions.append(
        utils.linkOrButton(rutina.urlVer, 'Ver',   'btn btn-ghost'),
        utils.linkOrButton(rutina.urlPdf, 'PDF ↓', 'btn btn-gold'),
      );

      card.append(info, actions);
      container.appendChild(card);
    });
  },

  dynamicPdfs() {
    document.querySelectorAll('.pdf-row--dynamic, .pdf-block--dynamic')
      .forEach(el => el.remove());

    state.dynamicPdfs.forEach(({ name, cat, pages, url }) => {
      render._addPdfRow(name, cat, pages, url, true);
    });
  },

  _addPdfRow(name, cat, pages, url, isDynamic = false) {
    const catId = `pdf-cat-${cat}`;
    let block   = document.getElementById(catId);

    if (!block) {
      block    = utils.el('div', ['pdf-block', 'pdf-block--dynamic']);
      block.id = catId;
      block.appendChild(utils.el('div', 'pdf-block-title', cat));
      document.getElementById('pdf-library').appendChild(block);
    }

    const rowClasses = isDynamic ? ['pdf-row', 'pdf-row--dynamic'] : ['pdf-row'];
    const row  = utils.el('div', rowClasses);
    const info = utils.el('div', 'pdf-info');
    info.append(
      utils.el('div', 'pdf-name', name),
      utils.el('div', 'pdf-meta', `${pages} páginas · ${cat}`),
    );

    row.append(
      utils.el('div', 'pdf-icon', 'PDF'),
      info,
      utils.linkOrButton(url, '↓', 'btn btn-gold'),
    );
    block.appendChild(row);
  },

  addExRow() {
    const list = document.getElementById('ex-list');
    const row  = utils.el('div', 'ex-row');

    const n       = document.createElement('input');
    n.type        = 'text';
    n.className   = 'form-input';
    n.placeholder = 'Ejercicio';

    const s       = document.createElement('input');
    s.type        = 'text';
    s.className   = 'form-input ex-spec';
    s.placeholder = 'Series · Reps · RIR';

    row.append(n, s);
    list.appendChild(row);
  },
};


/* ============================================================
   6. UI
   ============================================================ */
const ui = {

  showTab(tabId, navEl) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    const target = document.getElementById(`tab-${tabId}`);
    if (target) target.classList.add('active');

    document.querySelectorAll('.sb-item').forEach(i => i.classList.remove('active'));
    if (navEl) navEl.classList.add('active');

    document.getElementById('main').scrollTop = 0;
    if (window.innerWidth < 720) ui.closeSidebar();
    state.activeTab = tabId;
  },

  openModal()  { document.getElementById('overlay').classList.add('open');    },
  closeModal() { document.getElementById('overlay').classList.remove('open'); },

  switchModalTab(tab) {
    document.getElementById('mf-wod').hidden = (tab !== 'wod');
    document.getElementById('mf-pdf').hidden = (tab !== 'pdf');
    document.getElementById('mt-wod').classList.toggle('active', tab === 'wod');
    document.getElementById('mt-pdf').classList.toggle('active', tab === 'pdf');
  },

  toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); },
  closeSidebar()  { document.getElementById('sidebar').classList.remove('open'); },
};


/* ============================================================
   7. HANDLERS
   ============================================================ */
const handlers = {

  publishWOD() {
    const week   = document.getElementById('f-week').value.trim();
    const title  = document.getElementById('f-title').value.trim();
    const format = document.getElementById('f-format').value;
    const diff   = document.getElementById('f-diff').value;
    const desc   = document.getElementById('f-desc').value.trim();
    const month  = document.getElementById('f-month').value.trim();
    const note   = document.getElementById('f-note').value.trim();

    const exercises = [];
    document.querySelectorAll('#ex-list .ex-row').forEach(row => {
      const [nameInput, specInput] = row.querySelectorAll('input');
      const name = nameInput.value.trim();
      if (name) exercises.push([name, specInput.value.trim()]);
    });

    if (!utils.notEmpty(week) || !utils.notEmpty(title) || exercises.length === 0) {
      alert('Rellena al menos la semana, el título y un ejercicio.');
      return;
    }

    const currentWeekNorm = state.wod.week.trim().toLowerCase();
    const newWeekNorm     = week.toLowerCase();

    if (state.wod.week && currentWeekNorm !== newWeekNorm) {
      state.archive.unshift({
        week:  state.wod.week.split('·')[0].trim(),
        title: state.wod.title,
        meta:  state.wod.format,
      });
    }

    state.wod = {
      week, title, format, diff,
      subtitle: format + (desc ? ` · ${desc}` : ''),
      month:    month || state.wod.month,
      note, exercises,
    };

    persist.saveWod();
    render.wod();
    render.archive();
    utils.showToast('toast-wod');
    handlers._resetWodForm();
  },

  publishPDF() {
    const name  = document.getElementById('p-name').value.trim();
    const cat   = document.getElementById('p-cat').value;
    const pages = document.getElementById('p-pages').value.trim();
    const url   = document.getElementById('p-url').value.trim();

    if (!utils.notEmpty(name)) {
      alert('Introduce el nombre del documento.');
      return;
    }

    if (!utils.notEmpty(url) || !/^https?:\/\/.+/.test(url)) {
      alert('Introduce un enlace válido (https://...)');
      return;
    }

    const normalizedPages = pages || '?';
    const entry = { name, cat, pages: normalizedPages, url };

    // Guardar en estado y localStorage
    state.dynamicPdfs.push(entry);
    persist.savePdfs();

    // Añadir fila a la biblioteca — buscar o crear el bloque de categoría
    try {
      const catId  = 'pdf-cat-dyn-' + cat.replace(/\s+/g, '-');
      let block    = document.getElementById(catId);

      if (!block) {
        block    = document.createElement('div');
        block.className = 'pdf-block pdf-block--dynamic';
        block.id = catId;
        const title = document.createElement('div');
        title.className = 'pdf-block-title';
        title.textContent = cat;
        block.appendChild(title);
        document.getElementById('pdf-library').appendChild(block);
      }

      const row  = document.createElement('div');
      row.className = 'pdf-row pdf-row--dynamic';

      const icon = document.createElement('div');
      icon.className = 'pdf-icon';
      icon.textContent = 'PDF';

      const info = document.createElement('div');
      info.className = 'pdf-info';
      info.innerHTML = `<div class="pdf-name">${name}</div><div class="pdf-meta">${normalizedPages} páginas · ${cat}</div>`;

      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.className = 'btn btn-gold';
      link.textContent = '↓';

      row.append(icon, info, link);
      block.appendChild(row);

    } catch(e) {
      console.error('Error añadiendo PDF a la biblioteca:', e);
    }

    // Reset formulario
    document.getElementById('p-name').value  = '';
    document.getElementById('p-pages').value = '';
    document.getElementById('p-url').value   = '';
    document.getElementById('p-cat').selectedIndex = 0;
    const preview = document.getElementById('p-url-preview');
    if (preview) preview.hidden = true;

    // Cerrar modal y mostrar confirmación
    ui.closeModal();
    setTimeout(() => alert('✓ PDF "' + name + '" añadido a la biblioteca correctamente.'), 200);
  },

  /** Muestra preview del enlace en tiempo real */
  previewPdfUrl(value) {
    const preview = document.getElementById('p-url-preview');
    const text    = document.getElementById('p-url-preview-text');
    const link    = document.getElementById('p-url-preview-link');

    if (value && /^https?:\/\/.+/.test(value)) {
      try {
        const domain = new URL(value).hostname.replace('www.', '');
        text.textContent = domain;
        link.href = value;
        preview.hidden = false;
      } catch {
        preview.hidden = true;
      }
    } else {
      preview.hidden = true;
    }
  },

  _resetWodForm() {
    document.getElementById('f-week').value  = '';
    document.getElementById('f-title').value = '';
    document.getElementById('f-desc').value  = '';
    document.getElementById('f-month').value = '';
    document.getElementById('f-note').value  = '';
    document.getElementById('f-format').selectedIndex = 0;
    document.getElementById('f-diff').selectedIndex   = 2;

    const list = document.getElementById('ex-list');
    const rows = Array.from(list.querySelectorAll('.ex-row'));

    rows.forEach((row, i) => {
      if (i < 3) {
        row.querySelectorAll('input').forEach(input => { input.value = ''; });
      } else {
        list.removeChild(row);
      }
    });
  },

  _resetPdfForm() {
    document.getElementById('p-name').value  = '';
    document.getElementById('p-pages').value = '';
    document.getElementById('p-url').value   = '';
    document.getElementById('p-cat').selectedIndex = 0;
    const preview = document.getElementById('p-url-preview');
    if (preview) preview.hidden = true;
  },
};



/* ============================================================
   WOD AI — Lee el PDF del WOD con Claude y lo renderiza
   ============================================================ */
const WodAI = {

  STORAGE_KEY: 'jmf_wod_ai',

  /* Preview del enlace en tiempo real */
  previewUrl(value) {
    const preview = document.getElementById('wod-url-preview');
    const text    = document.getElementById('wod-url-preview-text');
    const link    = document.getElementById('wod-url-preview-link');
    if (value && /^https?:\/\/.+/.test(value)) {
      try {
        const domain = new URL(value).hostname.replace('www.', '');
        text.textContent = domain;
        link.href = value;
        preview.hidden = false;
      } catch { preview.hidden = true; }
    } else {
      preview.hidden = true;
    }
  },

  /* Convierte link de Drive a URL de descarga directa */
  _driveDirectUrl(url) {
    const m = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (m) return `https://drive.google.com/uc?export=download&id=${m[1]}`;
    return url;
  },

  /* Publica el WOD leyendo el PDF con IA */
  async publish() {
    const week = document.getElementById('f-wod-week').value.trim();
    const url  = document.getElementById('f-wod-url').value.trim();

    if (!week) { alert('Indica la semana o fecha del WOD.'); return; }
    if (!url || !/^https?:\/\/.+/.test(url)) {
      alert('Pega el enlace de Google Drive del PDF.');
      return;
    }

    const btn    = document.getElementById('btn-publish-wod');
    const status = document.getElementById('wod-ai-status');
    const stTxt  = document.getElementById('wod-ai-status-text');

    btn.disabled = true;
    btn.textContent = 'Procesando...';
    status.hidden = false;
    stTxt.textContent = 'Conectando con la IA...';

    try {
      stTxt.textContent = 'Descargando el PDF...';

      /* Fetch del PDF como base64 */
      const directUrl = this._driveDirectUrl(url);
      const pdfResp   = await fetch(directUrl);
      if (!pdfResp.ok) throw new Error('No se pudo descargar el PDF. Comprueba que el enlace es público.');
      const buffer    = await pdfResp.arrayBuffer();
      const base64    = btoa(String.fromCharCode(...new Uint8Array(buffer)));

      stTxt.textContent = 'La IA está leyendo el entrenamiento...';

      /* Llamada a Claude con el PDF */
      const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: `Eres el asistente de la app JM Fitness de Javier Manzano.
Tu tarea es leer un PDF de entrenamiento y devolver SOLO un objeto JSON válido, sin texto adicional, sin bloques de código, sin backticks.

El JSON debe tener esta estructura exacta:
{
  "titulo": "título principal del entrenamiento",
  "subtitulo": "descripción breve o formato",
  "dificultad": "★★★☆☆",
  "bloques": [
    {
      "nombre": "nombre del bloque (ej: Bloque A - Superserie, Tabata, Calentamiento...)",
      "tipo": "superserie|tabata|circuito|fuerza|cardio|movilidad|otro",
      "duracion": "duración si la hay, o null",
      "ejercicios": [
        {
          "nombre": "nombre del ejercicio",
          "series": "series o rondas",
          "reps": "repeticiones o tiempo",
          "rir": "RIR o intensidad si se indica",
          "nota": "nota específica del ejercicio si la hay"
        }
      ],
      "nota": "nota del bloque si la hay"
    }
  ],
  "nota_general": "nota general del entrenador si la hay"
}

Extrae TODA la información del PDF fielmente. No inventes nada que no esté en el PDF.`,
          messages: [{
            role: 'user',
            content: [{
              type: 'document',
              source: { type: 'base64', media_type: 'application/pdf', data: base64 }
            }, {
              type: 'text',
              text: 'Lee este PDF de entrenamiento y devuelve el JSON con toda la información tal cual aparece.'
            }]
          }]
        })
      });

      if (!aiResp.ok) {
        const err = await aiResp.json().catch(() => ({}));
        throw new Error(err.error?.message || `Error IA: ${aiResp.status}`);
      }

      const aiData = await aiResp.json();
      const rawText = aiData.content?.map(b => b.text || '').join('') || '';
      const clean   = rawText.replace(/```json|```/g, '').trim();
      const wod     = JSON.parse(clean);

      stTxt.textContent = 'Guardando...';

      /* Guardar en localStorage */
      const wodEntry = { week, url, wod, ts: Date.now() };
      persist.save(WodAI.STORAGE_KEY, wodEntry);

      /* Renderizar en la app */
      WodAI.renderContent(wodEntry);

      /* Archivar WOD anterior si había uno distinto */
      const prev = persist.load(WodAI.STORAGE_KEY + '_prev');
      if (prev && prev.week !== week) {
        const archive = persist.load(STORAGE_KEYS.ARCHIVE) || [];
        archive.unshift({ week: prev.week, title: prev.wod?.titulo || 'WOD', meta: prev.wod?.subtitulo || '' });
        persist.save(STORAGE_KEYS.ARCHIVE, archive);
        render.archive();
      }
      persist.save(WodAI.STORAGE_KEY + '_prev', wodEntry);

      utils.showToast('toast-wod');
      document.getElementById('f-wod-week').value = '';
      document.getElementById('f-wod-url').value  = '';
      document.getElementById('wod-url-preview').hidden = true;

    } catch (err) {
      stTxt.textContent = '❌ ' + err.message;
      console.error('WodAI error:', err);
    } finally {
      btn.disabled = false;
      btn.textContent = 'Leer PDF y publicar WOD →';
      setTimeout(() => { status.hidden = true; }, 4000);
    }
  },

  /* Renderiza el WOD extraído por IA en la vista del cliente */
  renderContent(entry) {
    if (!entry?.wod) return;
    const w   = entry.wod;
    const el  = document.getElementById('wod-ai-content');
    if (!el) return;

    const tipoIcon = { superserie: '🔁', tabata: '⏱', circuito: '🔄', fuerza: '💪', cardio: '🏃', movilidad: '🧘', otro: '▸' };

    el.innerHTML = `
      <div class="wod-hero-top">
        <div>
          <div class="wod-eyebrow">${entry.week || ''}</div>
          <div class="wod-title-display">${w.titulo || 'WOD de la Semana'}</div>
          <div class="wod-subtitle">${w.subtitulo || ''}</div>
        </div>
        <div class="wod-badges">
          <div class="wod-diff">${w.dificultad || '★★★☆☆'}</div>
          <div class="wod-diff-label">Dificultad</div>
        </div>
      </div>
      ${(w.bloques || []).map(b => `
        <div class="wod-block">
          <div class="wod-block-header">
            <span class="wod-block-icon">${tipoIcon[b.tipo] || '▸'}</span>
            <span class="wod-block-name">${b.nombre || ''}</span>
            ${b.duracion ? `<span class="wod-block-dur">${b.duracion}</span>` : ''}
          </div>
          <div class="wod-exercises">
            ${(b.ejercicios || []).map((ej, i) => `
              <div class="wod-ex-row">
                <span class="wod-ex-num">${String(i+1).padStart(2,'0')}</span>
                <span class="wod-ex-name">${ej.nombre}</span>
                <span class="wod-ex-spec">${[ej.series, ej.reps, ej.rir ? 'RIR '+ej.rir : ''].filter(Boolean).join(' · ')}</span>
                ${ej.nota ? `<span class="wod-ex-note">${ej.nota}</span>` : ''}
              </div>`).join('')}
          </div>
          ${b.nota ? `<div class="wod-block-note">${b.nota}</div>` : ''}
        </div>`).join('')}
      ${w.nota_general ? `<div class="wod-note-bar"><div class="wod-note-kw">Nota</div><div class="wod-note-txt">${w.nota_general}</div></div>` : ''}
    `;
  },

  /* Carga el WOD guardado al iniciar la app */
  hydrate() {
    const saved = persist.load(WodAI.STORAGE_KEY);
    if (saved?.wod) {
      WodAI.renderContent(saved);
    }
  },
};

/* ============================================================
   8. INIT
   ============================================================ */
function init() {

  // 1. Hidratar
  persist.hydrate();

  // 2. Renders iniciales
  WodAI.hydrate();          // WOD leído por IA (prevalece sobre el estático)
  render.wod();             // WOD estático de fallback
  render.archive();
  render.rutinas();
  render.dynamicPdfs();

  // 3. Splash
  document.getElementById('sp-line').classList.add('grow');
  setTimeout(() => document.getElementById('splash').classList.add('out'), 1500);

  // 4. Navegación
  document.querySelector('.sb-nav').addEventListener('click', e => {
    const item = e.target.closest('.sb-item');
    if (!item) return;
    const tab = item.dataset.tab;
    if (tab) ui.showTab(tab, item);
  });

  // 5. Hamburger
  document.getElementById('hamburger')
    .addEventListener('click', () => ui.toggleSidebar());

  // 6. Admin — abrir con autenticación
  document.querySelector('.admin-trigger')
    .addEventListener('click', () => auth.requestAccess());

  // 7. Admin — cerrar modal
  document.getElementById('overlay')
    .addEventListener('click', e => { if (e.target === e.currentTarget) ui.closeModal(); });
  document.querySelector('.modal-close')
    .addEventListener('click', () => ui.closeModal());
  document.querySelectorAll('.btn-cancel-modal')
    .forEach(btn => btn.addEventListener('click', () => ui.closeModal()));

  // 8. Admin — tabs del modal
  document.getElementById('mt-wod').addEventListener('click', () => ui.switchModalTab('wod'));
  document.getElementById('mt-pdf').addEventListener('click', () => ui.switchModalTab('pdf'));

  // 9. Admin — añadir ejercicio
  document.getElementById('btn-add-ex')
    .addEventListener('click', () => render.addExRow());

  // 10. Admin — publicar WOD (con IA)
  document.getElementById('btn-publish-wod')
    .addEventListener('click', () => WodAI.publish());

  // 11. Admin — publicar PDF
  document.getElementById('btn-publish-pdf')
    .addEventListener('click', () => handlers.publishPDF());

  // 12. CTA rutinas
  document.getElementById('cta-ir-contacto').addEventListener('click', () => {
    ui.showTab('contacto', document.querySelector('.sb-item[data-tab="contacto"]'));
  });
}

document.addEventListener('DOMContentLoaded', init);


/* ============================================================
   DEV TOOLS — Solo desarrollo local
   devTools.reset()   → limpia localStorage y recarga
   devTools.inspect() → muestra state en consola
   devTools.logout()  → cierra sesión admin
   ============================================================ */
const devTools = {
  reset() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    console.info('JM App: localStorage limpiado. Recargando...');
    window.location.reload();
  },
  inspect() {
    console.log('── JM App State ──');
    console.log('wod:',         structuredClone(state.wod));
    console.log('archive:',     structuredClone(state.archive));
    console.log('dynamicPdfs:', structuredClone(state.dynamicPdfs));
    console.log('adminLoggedIn:', auth.isLoggedIn());
  },
  logout() {
    auth.logout();
    console.info('JM App: sesión admin cerrada.');
  },
};
