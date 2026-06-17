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
  RUTINAS: 'jm_rutinas',
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
    week:      'Semana de ejemplo',
    title:     'Full Body · Fuerza & Acondicionamiento',
    format:    '4 bloques · 50 min',
    diff:      '★★★☆☆',
    subtitle:  'Entrenamiento de referencia mientras se publica el de este mes',
    month:     'Junio 2026',
    note:      'Cada mes se publica un entrenamiento de referencia que puedes usar si no tienes tu rutina personalizada a mano. Ajusta los pesos a tu RIR objetivo. Cualquier duda, escríbeme por WhatsApp.',
    exercises: [
      ['Sentadilla con barra', '4×8 · RIR 2'],
      ['Press banca', '4×8 · RIR 2'],
      ['Remo con barra', '3×10 · RIR 2'],
      ['Zancadas con mancuernas', '3×12 · RIR 2'],
      ['Plancha frontal', '3×40s'],
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
      level:  'Intermedio',
      goal:   'Fuerza & Hipertrofia',
      url:    'https://drive.google.com/file/d/1_m22Zju4VKNDLi2w6CvVbBklhpC9PlMO/view?usp=sharing',
      visible: true,
    },
    {
      id:     'entrenamiento-casa',
      days:   'Sin material',
      name:   'Entrenamiento en Casa — Full Body',
      desc:   'Sin material · Metabólico + Core · RPE 7–8',
      level:  'Principiante',
      goal:   'Acondicionamiento',
      url:    'https://drive.google.com/file/d/1gV9gtkSQT3lhLKucCv1sLipVnxk5Oh0v/view?usp=sharing',
      visible: true,
    },
    {
      id:     'hiit',
      days:   '2 días / semana',
      name:   'Entrenamiento HIIT — Quema Grasa',
      desc:   'Sin material · Alta intensidad · RPE 8–9 · 30–40 min',
      level:  'Intermedio / Avanzado',
      goal:   'Definición',
      url:    'https://drive.google.com/file/d/1Y3v38NhIL39cG052Gt9Xrm4eniuJ90-v/view?usp=sharing',
      visible: true,
    },
    {
      id:     'gluteo',
      days:   '2 días / semana',
      name:   'Entrenamiento de Glúteo',
      desc:   'Sin material · Fuerza · Hipertrofia · Activación · RPE 7–9',
      level:  'Todos los niveles',
      goal:   'Hipertrofia',
      url:    'https://drive.google.com/file/d/1mtpY4p7los060O04Pmq2huPo0nDP7cEz/view?usp=sharing',
      visible: true,
    },
    {
      id:     'movilidad',
      days:   '7 días / semana · 15 min',
      name:   'Movilidad & Recuperación Activa',
      desc:   'Sin material · Movilidad articular diaria · Prevención de lesiones',
      level:  'Todos los niveles',
      goal:   'Recuperación',
      url:    '',
      visible: true,
    },
  ],

  pdfs: [
    {
      id: 'pdf-guia-salud',
      name: 'Guía para la Salud',
      desc: 'Fundamentos del método JM: los 4 pilares de la salud integral explicados con claridad.',
      cat: 'Salud General',
      pages: '?',
      url: 'https://canva.link/i3kttora2ysf71v',
      visible: true,
    },
    {
      id: 'pdf-sanacion-natural',
      name: 'Sanación del Cuerpo de Manera Natural',
      desc: 'Cómo apoyar los procesos naturales de recuperación y regeneración del organismo.',
      cat: 'Salud General',
      pages: '?',
      url: 'https://drive.google.com/file/d/1WtPbZHwUuMF1H-xjBC3r23WDLpnC4yfP/view?usp=sharing',
      visible: true,
    },
    {
      id: 'pdf-dieta-antiinflamatoria',
      name: 'Dieta Antiinflamatoria',
      desc: 'Protocolo alimentario para reducir la inflamación crónica y mejorar el rendimiento y la recuperación.',
      cat: 'Nutrición',
      pages: '?',
      url: 'https://drive.google.com/file/d/1diOXLQ8ERK3Rgf3_gqn21qITvwyTCa-9/view?usp=sharing',
      visible: true,
    },
    {
      id: 'pdf-aprende-comer',
      name: 'Aprende a Comer a tu Manera',
      desc: 'Una guía práctica para construir una relación sana con la comida, sin contar calorías ni prohibiciones.',
      cat: 'Nutrición',
      pages: '?',
      url: '',
      visible: true,
      addedAt: Date.parse('2026-06-01'),
    },
    {
      id: 'pdf-movilidad-articular',
      name: 'Guía de Movilidad Articular',
      desc: 'Rutina de 15 minutos diarios para mejorar el rango de movimiento y prevenir lesiones.',
      cat: 'Entrenamiento',
      pages: '?',
      url: '',
      visible: true,
    },
    {
      id: 'pdf-entrena-viajas',
      name: 'Entrena Mientras Viajas',
      desc: 'Protocolo de entrenamiento completo para mantener el progreso cuando no tienes acceso a un gimnasio.',
      cat: 'Entrenamiento',
      pages: '?',
      url: '',
      visible: true,
    },
    {
      id: 'pdf-mujer-hormonas',
      name: 'Mujer: Comprende Tu Cuerpo y Hormonas',
      desc: 'Guía completa sobre el sistema hormonal femenino y cómo influye en el entrenamiento y la nutrición.',
      cat: 'Mujer & Hormonas',
      pages: '?',
      url: 'https://drive.google.com/file/d/1hS7n2P9sXByVDHaAQ-BEOUuxLnM5_aYq/view?usp=sharing',
      visible: true,
    },
    {
      id: 'pdf-ciclo-menstrual',
      name: 'Comprendiendo el Ciclo Menstrual',
      desc: 'Cómo adaptar el entrenamiento y la alimentación a cada fase del ciclo para maximizar los resultados.',
      cat: 'Mujer & Hormonas',
      pages: '?',
      url: 'https://drive.google.com/file/d/1hekqCvAcxSAmBt5aLRW2dEHeuzuGZxu7/view?usp=sharing',
      visible: true,
    },
    {
      id: 'pdf-protocolo-sueno',
      name: 'Protocolo para Conciliar el Sueño',
      desc: 'Rutina nocturna paso a paso para mejorar la calidad y la profundidad del sueño de forma natural.',
      cat: 'Descanso',
      pages: '?',
      url: 'https://canva.link/bm6pz52pqqvkohh',
      visible: true,
    },
    {
      id: 'pdf-suplementacion-basica',
      name: 'Guía de Suplementación Básica JM',
      desc: 'Qué suplementos funcionan realmente, para qué sirven y en qué dosis. Sin humo, solo evidencia.',
      cat: 'Suplementación',
      pages: '?',
      url: '',
      visible: true,
      addedAt: Date.parse('2026-06-01'),
    },
  ],

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

  /**
   * Migra una entrada antigua al nuevo formato:
   * - añade visible: true si no existe
   * - normaliza urlPdf/urlVer (rutinas antiguas) → url único
   */
  _migrateRutina(r) {
    if (!r || typeof r !== 'object') return null;
    const migrated = { ...r };
    if (typeof migrated.visible !== 'boolean') migrated.visible = true;
    if (migrated.url === undefined) {
      // Compatibilidad con el formato antiguo urlPdf/urlVer
      const candidate = migrated.urlPdf || migrated.urlVer || '';
      migrated.url = (candidate && candidate !== '#') ? candidate : '';
    }
    if (migrated.url === '#') migrated.url = '';
    delete migrated.urlPdf;
    delete migrated.urlVer;
    delete migrated.dynamic; // ya no se distingue estático/dinámico
    if (!migrated.id) migrated.id = 'rutina-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    migrated.level = migrated.level || '';
    migrated.goal  = migrated.goal  || '';
    migrated.desc  = migrated.desc  || '';
    migrated.days  = migrated.days  || '';
    return migrated;
  },

  _migratePdf(p) {
    if (!p || typeof p !== 'object') return null;
    const migrated = { ...p };
    if (typeof migrated.visible !== 'boolean') migrated.visible = true;
    if (migrated.url === '#') migrated.url = '';
    if (!migrated.id) migrated.id = 'pdf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7);
    migrated.desc  = migrated.desc  || '';
    migrated.pages = migrated.pages || '?';
    return migrated;
  },

  hydrate() {
    const savedWod     = persist.load(STORAGE_KEYS.WOD);
    const savedArchive = persist.load(STORAGE_KEYS.ARCHIVE);
    const savedPdfs    = persist.load(STORAGE_KEYS.PDFS);
    const savedRutinas = persist.load(STORAGE_KEYS.RUTINAS);

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

    // ── Migración de PDFs ──
    if (savedPdfs !== null && Array.isArray(savedPdfs)) {
      const migrated = savedPdfs
        .map(persist._migratePdf)
        .filter(p => p && typeof p.name === 'string' && typeof p.cat === 'string');
      if (migrated.length) state.pdfs = migrated;
    }
    // Migrar también los seeds en memoria (por si faltase 'visible' en código antiguo)
    state.pdfs = state.pdfs.map(persist._migratePdf);

    // ── Migración de Rutinas ──
    if (savedRutinas !== null && Array.isArray(savedRutinas)) {
      const migrated = savedRutinas
        .map(persist._migrateRutina)
        .filter(r => r && typeof r.name === 'string' && typeof r.id === 'string');
      if (migrated.length) state.rutinas = migrated;
    }
    state.rutinas = state.rutinas.map(persist._migrateRutina);
  },

  saveWod() {
    persist.save(STORAGE_KEYS.WOD,     state.wod);
    persist.save(STORAGE_KEYS.ARCHIVE, state.archive);
  },

  savePdfs() {
    persist.save(STORAGE_KEYS.PDFS, state.pdfs);
  },

  saveRutinas() {
    persist.save(STORAGE_KEYS.RUTINAS, state.rutinas);
  },
};


/* ============================================================
   2B. DATA LAYER — Rutinas & PDFs
   Capa de acceso a datos. Hoy usa localStorage (via persist +
   state). Pensada para que mañana solo haya que reemplazar el
   cuerpo de estas funciones por llamadas a Supabase, sin tocar
   el resto de la app (render/handlers usan solo estas funciones).
   ============================================================ */
const dataStore = {

  // ───────── RUTINAS ─────────

  /** Devuelve todas las rutinas (admin) o solo visibles (público) */
  getRutinas(includeHidden = false) {
    const all = state.rutinas;
    return includeHidden ? all : all.filter(r => r.visible !== false);
  },

  getRutinaById(id) {
    return state.rutinas.find(r => r.id === id) || null;
  },

  /** Crea una nueva rutina */
  saveRutina(data) {
    const entry = {
      id:      'rutina-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name:    data.name  || '',
      desc:    data.desc  || '',
      days:    data.days  || '',
      level:   data.level || '',
      goal:    data.goal  || '',
      url:     data.url   || '',
      visible: data.visible !== false,
    };
    state.rutinas.push(entry);
    persist.saveRutinas();
    return entry;
  },

  /** Actualiza una rutina existente por id */
  updateRutina(id, data) {
    const idx = state.rutinas.findIndex(r => r.id === id);
    if (idx === -1) return null;
    state.rutinas[idx] = { ...state.rutinas[idx], ...data, id };
    persist.saveRutinas();
    return state.rutinas[idx];
  },

  /** Cambia la visibilidad de una rutina */
  toggleRutinaVisibility(id) {
    const r = dataStore.getRutinaById(id);
    if (!r) return null;
    return dataStore.updateRutina(id, { visible: !r.visible });
  },

  /** Elimina una rutina */
  deleteRutina(id) {
    const before = state.rutinas.length;
    state.rutinas = state.rutinas.filter(r => r.id !== id);
    persist.saveRutinas();
    return state.rutinas.length < before;
  },

  // ───────── PDFs ─────────

  /** Devuelve todos los PDFs (admin) o solo visibles (público) */
  getPdfs(includeHidden = false) {
    const all = state.pdfs;
    return includeHidden ? all : all.filter(p => p.visible !== false);
  },

  getPdfById(id) {
    return state.pdfs.find(p => p.id === id) || null;
  },

  /** Crea un nuevo PDF */
  savePdf(data) {
    const entry = {
      id:      'pdf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name:    data.name  || '',
      desc:    data.desc  || '',
      cat:     data.cat   || 'Otros',
      pages:   data.pages || '?',
      url:     data.url   || '',
      visible: data.visible !== false,
      addedAt: Date.now(),
    };
    state.pdfs.push(entry);
    persist.savePdfs();
    return entry;
  },

  /** Actualiza un PDF existente por id */
  updatePdf(id, data) {
    const idx = state.pdfs.findIndex(p => p.id === id);
    if (idx === -1) return null;
    state.pdfs[idx] = { ...state.pdfs[idx], ...data, id };
    persist.savePdfs();
    return state.pdfs[idx];
  },

  /** Cambia la visibilidad de un PDF */
  togglePdfVisibility(id) {
    const p = dataStore.getPdfById(id);
    if (!p) return null;
    return dataStore.updatePdf(id, { visible: !p.visible });
  },

  /** Elimina un PDF */
  deletePdf(id) {
    const before = state.pdfs.length;
    state.pdfs = state.pdfs.filter(p => p.id !== id);
    persist.savePdfs();
    return state.pdfs.length < before;
  },

  /** Lista de categorías existentes (para selects y filtros) */
  getCategorias() {
    const base = ['Salud General', 'Nutrición', 'Entrenamiento', 'Descanso', 'Mujer & Hormonas', 'Suplementación', 'Otros'];
    const fromData = state.pdfs.map(p => p.cat);
    return Array.from(new Set([...base, ...fromData]));
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

  /** Vista pública de rutinas — solo visibles */
  rutinas() {
    const container = document.getElementById('rutinas-list');
    if (!container) return;
    utils.empty(container);

    const visibles = dataStore.getRutinas(false);

    if (visibles.length === 0) {
      container.appendChild(utils.el('p', 'empty-state', 'No hay rutinas disponibles por el momento.'));
      return;
    }

    visibles.forEach(r => {
      const card      = utils.el('div', 'rutina-card');
      card.dataset.id = r.id;

      const info = utils.el('div', 'rc-info');
      const tagsLine = [r.level, r.goal].filter(Boolean).join(' · ');
      info.append(
        utils.el('div', 'rc-days', r.days),
        utils.el('div', 'rc-name', r.name),
        utils.el('div', 'rc-desc', r.desc),
      );
      if (tagsLine) info.appendChild(utils.el('div', 'pdf-meta', tagsLine));

      const actions = utils.el('div', 'rc-actions');
      actions.appendChild(utils.linkOrButton(r.url, 'PDF ↓', 'btn btn-gold'));

      card.append(info, actions);
      container.appendChild(card);
    });
  },

  /** Vista pública de PDFs — solo visibles, agrupados por categoría */
  pdfs() {
    const library = document.getElementById('pdf-library');
    if (!library) return;
    utils.empty(library);

    const visibles = dataStore.getPdfs(false);
    const TWO_WEEKS = 14 * 24 * 60 * 60 * 1000;

    // Agrupar por categoría
    const byCat = {};
    visibles.forEach(p => {
      if (!byCat[p.cat]) byCat[p.cat] = [];
      byCat[p.cat].push(p);
    });

    const catOrder = ['Salud General', 'Nutrición', 'Entrenamiento', 'Descanso', 'Mujer & Hormonas', 'Suplementación', 'Otros'];
    const orderedCats = [
      ...catOrder.filter(c => byCat[c]),
      ...Object.keys(byCat).filter(c => !catOrder.includes(c)),
    ];

    orderedCats.forEach(cat => {
      const block = document.createElement('div');
      block.className = 'pdf-block';
      block.dataset.category = cat;

      const title = document.createElement('div');
      title.className = 'pdf-block-title';
      title.textContent = cat;
      block.appendChild(title);

      byCat[cat].forEach(p => {
        const isNew = typeof p.addedAt === 'number' && (Date.now() - p.addedAt) < TWO_WEEKS;
        const row = document.createElement('div');
        row.className = 'pdf-row';
        row.id = 'pdf-row-' + p.id;

        const icon = document.createElement('div');
        icon.className = 'pdf-icon';
        icon.textContent = 'PDF';

        const info = document.createElement('div');
        info.className = 'pdf-info';
        info.innerHTML = `
          <div class="pdf-name-wrap">
            <div class="pdf-name">${p.name}</div>
            ${isNew ? '<span class="pdf-badge-new">Nuevo</span>' : ''}
          </div>
          <div class="pdf-meta">${p.pages !== '?' ? p.pages + ' páginas · ' : ''}${cat}</div>
          ${p.desc ? `<div class="pdf-desc">${p.desc}</div>` : ''}
        `;

        row.append(icon, info, utils.linkOrButton(p.url, '↓', 'btn btn-gold'));
        block.appendChild(row);
      });

      library.appendChild(block);
    });
  },

  /** Panel admin — lista de gestión de rutinas */
  adminRutinas() {
    const list = document.getElementById('admin-rutinas-list');
    if (!list) return;
    utils.empty(list);

    const all = dataStore.getRutinas(true);

    const counter = document.getElementById('cm-rutinas-count');
    if (counter) {
      const visible = all.filter(r => r.visible).length;
      counter.textContent = `${visible} visible${visible !== 1 ? 's' : ''} · ${all.length - visible} oculta${all.length - visible !== 1 ? 's' : ''}`;
    }

    if (all.length === 0) {
      list.appendChild(utils.el('p', 'empty-state', 'No hay rutinas. Añade una nueva desde "Añadir".'));
      return;
    }

    all.forEach(r => {
      const item = document.createElement('div');
      item.className = 'cm-item' + (r.visible ? '' : ' cm-item--hidden');
      item.id = 'cm-rutina-' + r.id;
      item.innerHTML = `
        <div class="cm-info">
          <div class="cm-name">${r.name}</div>
          <div class="cm-meta">${[r.days, r.level, r.goal].filter(Boolean).join(' · ')}</div>
          ${r.url ? `<div class="cm-url-indicator">🔗 PDF enlazado</div>` : '<div class="cm-url-indicator cm-url-missing">⚠ Sin enlace</div>'}
        </div>
        <div class="cm-badge ${r.visible ? 'cm-badge--visible' : 'cm-badge--hidden'}">
          ${r.visible ? 'Visible' : 'Oculto'}
        </div>
        <div class="cm-actions">
          <button class="cm-btn cm-btn--edit"   data-action="edit-rutina"   data-id="${r.id}">Editar</button>
          <button class="cm-btn cm-btn--toggle" data-action="toggle-rutina" data-id="${r.id}">${r.visible ? 'Ocultar' : 'Mostrar'}</button>
          <button class="cm-btn cm-btn--delete" data-action="delete-rutina" data-id="${r.id}">Eliminar</button>
        </div>
      `;
      list.appendChild(item);
    });
  },

  /** Panel admin — lista de gestión de PDFs */
  adminPdfs() {
    const list = document.getElementById('admin-pdfs-list');
    if (!list) return;
    utils.empty(list);

    const all = dataStore.getPdfs(true);

    const counter = document.getElementById('cm-pdfs-count');
    if (counter) {
      const visible = all.filter(p => p.visible).length;
      counter.textContent = `${visible} visible${visible !== 1 ? 's' : ''} · ${all.length - visible} oculto${all.length - visible !== 1 ? 's' : ''}`;
    }

    if (all.length === 0) {
      list.appendChild(utils.el('p', 'empty-state', 'No hay PDFs. Añade uno desde "Añadir".'));
      return;
    }

    all.forEach(p => {
      const item = document.createElement('div');
      item.className = 'cm-item' + (p.visible ? '' : ' cm-item--hidden');
      item.id = 'cm-pdf-' + p.id;
      item.innerHTML = `
        <div class="cm-info">
          <div class="cm-name">${p.name}</div>
          <div class="cm-meta">${p.cat}${p.pages && p.pages !== '?' ? ' · ' + p.pages + ' pág.' : ''}</div>
          ${p.url ? `<div class="cm-url-indicator">🔗 PDF enlazado</div>` : '<div class="cm-url-indicator cm-url-missing">⚠ Sin enlace</div>'}
        </div>
        <div class="cm-badge ${p.visible ? 'cm-badge--visible' : 'cm-badge--hidden'}">
          ${p.visible ? 'Visible' : 'Oculto'}
        </div>
        <div class="cm-actions">
          <button class="cm-btn cm-btn--edit"   data-action="edit-pdf"   data-id="${p.id}">Editar</button>
          <button class="cm-btn cm-btn--toggle" data-action="toggle-pdf" data-id="${p.id}">${p.visible ? 'Ocultar' : 'Mostrar'}</button>
          <button class="cm-btn cm-btn--delete" data-action="delete-pdf" data-id="${p.id}">Eliminar</button>
        </div>
      `;
      list.appendChild(item);
    });
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

  openModal()  { document.getElementById('overlay').classList.add('open'); },
  closeModal() {
    document.getElementById('overlay').classList.remove('open');
    ui._closeEditForm();
  },

  /** Cambia entre tabs del panel admin */
  switchModalTab(tab) {
    ['wod', 'pdf', 'gestionar'].forEach(t => {
      const form = document.getElementById('mf-' + t);
      const btn  = document.getElementById('mt-' + t);
      if (form) form.hidden = (t !== tab);
      if (btn)  btn.classList.toggle('active', t === tab);
    });
    // Render listas de gestión al abrir esa pestaña
    if (tab === 'gestionar') {
      render.adminRutinas();
      render.adminPdfs();
    }
  },

  toggleSidebar() { document.getElementById('sidebar').classList.toggle('open'); },
  closeSidebar()  { document.getElementById('sidebar').classList.remove('open'); },

  /** Filtra la biblioteca de PDFs por categoría */
  filterPdfs(category) {
    document.querySelectorAll('.pdf-filter-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.filter === category);
    });
    document.querySelectorAll('#pdf-library .pdf-block').forEach(block => {
      const cat = block.dataset.category;
      block.style.display = (category === 'todos' || cat === category) ? '' : 'none';
    });
  },

  adminLogout() {
    auth.logout();
    ui.closeModal();
  },

  // ── Formulario de edición inline ──

  /** Abre el formulario de edición dentro del panel, prefijado por tipo */
  openEditForm(type, id) {
    const existing = document.getElementById('edit-form-container');
    if (existing) existing.remove();

    const data = type === 'rutina'
      ? dataStore.getRutinaById(id)
      : dataStore.getPdfById(id);
    if (!data) return;

    const wrap = document.createElement('div');
    wrap.id = 'edit-form-container';
    wrap.className = 'edit-form-container';

    if (type === 'rutina') {
      wrap.innerHTML = `
        <div class="edit-form-title">Editar rutina</div>
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" id="ef-name" type="text" value="${_esc(data.name)}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <input class="form-input" id="ef-desc" type="text" value="${_esc(data.desc)}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Frecuencia</label>
            <input class="form-input" id="ef-days" type="text" value="${_esc(data.days)}">
          </div>
          <div class="form-group">
            <label class="form-label">Nivel</label>
            <select class="form-select" id="ef-level">
              ${['Principiante','Intermedio','Intermedio / Avanzado','Avanzado','Todos los niveles']
                .map(l => `<option${l === data.level ? ' selected' : ''}>${l}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Objetivo</label>
          <input class="form-input" id="ef-goal" type="text" value="${_esc(data.goal)}">
        </div>
        <div class="form-group">
          <label class="form-label">Enlace PDF</label>
          <input class="form-input" id="ef-url" type="url" value="${_esc(data.url)}" placeholder="https://drive.google.com/...">
        </div>
        <div class="modal-actions">
          <button class="btn btn-gold"   id="ef-save"   data-ef-type="rutina" data-ef-id="${id}">Guardar cambios →</button>
          <button class="btn btn-ghost"  id="ef-cancel">Cancelar</button>
        </div>
      `;
    } else {
      const cats = dataStore.getCategorias();
      wrap.innerHTML = `
        <div class="edit-form-title">Editar guía PDF</div>
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" id="ef-name" type="text" value="${_esc(data.name)}">
        </div>
        <div class="form-group">
          <label class="form-label">Descripción</label>
          <input class="form-input" id="ef-desc" type="text" value="${_esc(data.desc)}">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Categoría</label>
            <select class="form-select" id="ef-cat">
              ${cats.map(c => `<option${c === data.cat ? ' selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Nº páginas</label>
            <input class="form-input" id="ef-pages" type="text" value="${_esc(data.pages === '?' ? '' : data.pages)}" placeholder="8">
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">Enlace PDF</label>
          <input class="form-input" id="ef-url" type="url" value="${_esc(data.url)}" placeholder="https://drive.google.com/...">
        </div>
        <div class="modal-actions">
          <button class="btn btn-gold"  id="ef-save"   data-ef-type="pdf" data-ef-id="${id}">Guardar cambios →</button>
          <button class="btn btn-ghost" id="ef-cancel">Cancelar</button>
        </div>
      `;
    }

    // Insertar tras el item correspondiente
    const itemEl = document.getElementById(`cm-${type}-${id}`);
    if (itemEl) {
      itemEl.after(wrap);
      wrap.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  },

  _closeEditForm() {
    const f = document.getElementById('edit-form-container');
    if (f) f.remove();
  },
};

// Helper: escapa HTML para atributos value=""
function _esc(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}


/* ============================================================
   7. HANDLERS
   ============================================================ */
const handlers = {

  // ── WOD ──

  // (publicación a través de WodAI.publish())

  // ── PDFs — Nuevo ──

  publishPDF() {
    const name  = document.getElementById('p-name').value.trim();
    const desc  = document.getElementById('p-desc-input').value.trim();
    const cat   = document.getElementById('p-cat').value;
    const pages = document.getElementById('p-pages').value.trim();
    const url   = document.getElementById('p-url').value.trim();

    if (!utils.notEmpty(name)) { alert('Introduce el nombre del documento.'); return; }
    if (!utils.notEmpty(url) || !/^https?:\/\/.+/.test(url)) {
      alert('Introduce un enlace válido (https://...)'); return;
    }

    dataStore.savePdf({ name, desc, cat, pages: pages || '?', url });

    // Reset form
    ['p-name','p-desc-input','p-pages','p-url'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('p-cat').selectedIndex = 0;
    const preview = document.getElementById('p-url-preview');
    if (preview) preview.hidden = true;

    render.pdfs();
    render.adminPdfs();
    utils.showToast('toast-pdf');
  },

  previewPdfUrl(value) {
    handlers._previewUrl(value, 'p-url-preview', 'p-url-preview-text', 'p-url-preview-link');
  },

  previewRutinaUrl(value) {
    handlers._previewUrl(value, 'r-url-preview', 'r-url-preview-text', 'r-url-preview-link');
  },

  _previewUrl(value, previewId, textId, linkId) {
    const preview = document.getElementById(previewId);
    const text    = document.getElementById(textId);
    const link    = document.getElementById(linkId);
    if (!preview) return;
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

  // ── Rutinas — Nueva ──

  addRutina() {
    const name  = document.getElementById('r-name').value.trim();
    const days  = document.getElementById('r-days').value.trim();
    const desc  = document.getElementById('r-desc').value.trim();
    const level = document.getElementById('r-level').value;
    const goal  = document.getElementById('r-goal').value.trim();
    const url   = document.getElementById('r-url').value.trim();

    if (!utils.notEmpty(name)) { alert('Introduce el nombre de la rutina.'); return; }
    if (url && !/^https?:\/\/.+/.test(url)) {
      alert('El enlace debe empezar por https://'); return;
    }

    dataStore.saveRutina({ name, days: days || 'A definir', desc, level, goal, url });

    ['r-name','r-days','r-desc','r-goal','r-url'].forEach(id => {
      document.getElementById(id).value = '';
    });
    document.getElementById('r-level').selectedIndex = 0;
    const preview = document.getElementById('r-url-preview');
    if (preview) preview.hidden = true;

    render.rutinas();
    render.adminRutinas();
    utils.showToast('toast-rutina');
  },

  // ── Gestión de contenidos (Editar / Toggle / Eliminar) ──

  saveEdit(type, id) {
    const name = document.getElementById('ef-name')?.value.trim();
    const desc = document.getElementById('ef-desc')?.value.trim();
    const url  = document.getElementById('ef-url')?.value.trim();

    if (!utils.notEmpty(name)) { alert('El nombre no puede estar vacío.'); return; }
    if (url && !/^https?:\/\/.+/.test(url)) {
      alert('El enlace debe empezar por https://'); return;
    }

    if (type === 'rutina') {
      const days  = document.getElementById('ef-days')?.value.trim();
      const level = document.getElementById('ef-level')?.value;
      const goal  = document.getElementById('ef-goal')?.value.trim();
      dataStore.updateRutina(id, { name, desc, days, level, goal, url: url || '' });
      render.rutinas();
      render.adminRutinas();
    } else {
      const cat   = document.getElementById('ef-cat')?.value;
      const pages = document.getElementById('ef-pages')?.value.trim();
      dataStore.updatePdf(id, { name, desc, cat, pages: pages || '?', url: url || '' });
      render.pdfs();
      render.adminPdfs();
    }

    ui._closeEditForm();
    utils.showToast('toast-gestionar');
  },

  toggleVisibility(type, id) {
    if (type === 'rutina') {
      dataStore.toggleRutinaVisibility(id);
      render.rutinas();
      render.adminRutinas();
    } else {
      dataStore.togglePdfVisibility(id);
      render.pdfs();
      render.adminPdfs();
    }
  },

  deleteItem(type, id, name) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    if (type === 'rutina') {
      dataStore.deleteRutina(id);
      render.rutinas();
      render.adminRutinas();
    } else {
      dataStore.deletePdf(id);
      render.pdfs();
      render.adminPdfs();
    }
    ui._closeEditForm();
  },
};


/* ============================================================
   8. WOD AI — Lee el PDF del WOD con Claude y lo renderiza
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
      stTxt.textContent = 'La IA está leyendo el entrenamiento...';

      /* Llamada a Claude pasando la URL directamente para que la lea con web_fetch */
      const aiResp = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1500,
          system: `Eres el asistente de la app JM Fitness de Javier Manzano.
Tu tarea es leer un PDF de entrenamiento desde una URL y devolver SOLO un objeto JSON válido, sin texto adicional, sin bloques de código, sin backticks.

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

Extrae TODA la información fielmente. No inventes nada que no esté en el documento.`,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Eres el asistente de la app JM Fitness. Tienes acceso a este PDF de entrenamiento de Google Drive: ${url}

Por favor accede a ese enlace, lee el contenido del PDF de entrenamiento y devuelve SOLO el siguiente JSON sin texto adicional ni backticks:

{
  "titulo": "título del entrenamiento",
  "subtitulo": "formato o descripción breve",
  "dificultad": "★★★☆☆",
  "bloques": [
    {
      "nombre": "nombre del bloque",
      "tipo": "superserie|tabata|circuito|fuerza|cardio|movilidad|otro",
      "duracion": "duración o null",
      "ejercicios": [
        {
          "nombre": "ejercicio",
          "series": "series",
          "reps": "repeticiones",
          "rir": "RIR si hay",
          "nota": "nota si hay"
        }
      ],
      "nota": "nota del bloque"
    }
  ],
  "nota_general": "nota general del entrenador"
}`
              }
            ]
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
   9. INIT
   ============================================================ */
function init() {

  // 1. Hidratar estado desde localStorage
  persist.hydrate();

  // 2. Renders iniciales
  WodAI.hydrate();
  render.wod();
  render.archive();
  render.rutinas();
  render.pdfs();

  // 3. Splash
  document.getElementById('sp-line').classList.add('grow');
  setTimeout(() => document.getElementById('splash').classList.add('out'), 1500);

  // 4. Navegación sidebar
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

  // 7. Admin — delegación de eventos en el overlay
  const overlay = document.getElementById('overlay');
  if (overlay) {
    overlay.addEventListener('click', e => {
      if (e.target === overlay) { ui.closeModal(); return; }

      // ── Tabs del modal ──
      if (e.target.id === 'mt-wod')       { ui.switchModalTab('wod');       return; }
      if (e.target.id === 'mt-pdf')       { ui.switchModalTab('pdf');       return; }
      if (e.target.id === 'mt-gestionar') { ui.switchModalTab('gestionar'); return; }

      // ── Acciones estáticas del modal ──
      if (e.target.id === 'btn-publish-wod')  { WodAI.publish();        return; }
      if (e.target.id === 'btn-publish-pdf')  { handlers.publishPDF();  return; }
      if (e.target.id === 'btn-add-rutina')   { handlers.addRutina();   return; }
      if (e.target.id === 'btn-admin-logout') { ui.adminLogout();       return; }

      // ── Cerrar modal ──
      if (e.target.classList.contains('modal-close') ||
          e.target.classList.contains('btn-cancel-modal')) {
        ui.closeModal(); return;
      }

      // ── Formulario de edición ──
      if (e.target.id === 'ef-save') {
        const type = e.target.dataset.efType;
        const id   = e.target.dataset.efId;
        handlers.saveEdit(type, id); return;
      }
      if (e.target.id === 'ef-cancel') {
        ui._closeEditForm(); return;
      }

      // ── Acciones de gestión de contenidos (delegación por data-action) ──
      const btn = e.target.closest('[data-action]');
      if (!btn) return;
      const { action, id } = btn.dataset;
      const type = action.includes('rutina') ? 'rutina' : 'pdf';

      if (action.startsWith('edit')) {
        // Si ya hay un form abierto para este mismo item, cerrarlo
        const existing = document.getElementById('edit-form-container');
        if (existing && existing.previousElementSibling?.id === `cm-${type}-${id}`) {
          ui._closeEditForm(); return;
        }
        ui.openEditForm(type, id);
        return;
      }
      if (action.startsWith('toggle')) {
        handlers.toggleVisibility(type, id); return;
      }
      if (action.startsWith('delete')) {
        const data = type === 'rutina'
          ? dataStore.getRutinaById(id)
          : dataStore.getPdfById(id);
        handlers.deleteItem(type, id, data?.name || id); return;
      }
    });
  }

  // 8. Login
  document.addEventListener('click', e => {
    const t = e.target.closest('#login-submit, #login-cancel, #login-close');
    if (!t) return;
    if (t.id === 'login-submit') auth._handleLogin();
    else auth._closeLogin();
  });

  // 9. CTA rutinas → contacto
  const ctaContacto = document.getElementById('cta-ir-contacto');
  if (ctaContacto) ctaContacto.addEventListener('click', () => {
    ui.showTab('contacto', document.querySelector('.sb-item[data-tab="contacto"]'));
  });

  // 10. Filtro categorías PDF
  const pdfFilterBar = document.getElementById('pdf-filter-bar');
  if (pdfFilterBar) {
    pdfFilterBar.addEventListener('click', e => {
      const btn = e.target.closest('.pdf-filter-btn');
      if (!btn) return;
      ui.filterPdfs(btn.dataset.filter);
    });
  }

  // 11. Sub-tabs dentro del panel "Añadir"
  const mfPdf = document.getElementById('mf-pdf');
  if (mfPdf) {
    mfPdf.addEventListener('click', e => {
      const btn = e.target.closest('.add-subtab');
      if (!btn) return;
      const subtab = btn.dataset.subtab;
      mfPdf.querySelectorAll('.add-subtab').forEach(b => b.classList.toggle('active', b === btn));
      document.getElementById('add-pdf-form').hidden    = (subtab !== 'pdf');
      document.getElementById('add-rutina-form').hidden = (subtab !== 'rutina');
    });
  }
}

document.addEventListener('DOMContentLoaded', init);


/* ============================================================
   DEV TOOLS
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
    console.log('wod:',     structuredClone(state.wod));
    console.log('archive:', structuredClone(state.archive));
    console.log('pdfs:',    structuredClone(state.pdfs));
    console.log('rutinas:', structuredClone(state.rutinas));
    console.log('adminLoggedIn:', auth.isLoggedIn());
  },
  logout() {
    auth.logout();
    console.info('JM App: sesión admin cerrada.');
  },
};
