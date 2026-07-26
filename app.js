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
  CLIENT:  'jm_client',    // sesión de cliente logueado (nombre + código)
};

// Contraseña del panel admin — cámbiala aquí cuando quieras
const ADMIN_PASSWORD = 'jm2026';

// Sesión válida durante 8 horas (en ms)
const SESSION_DURATION = 8 * 60 * 60 * 1000;


/* ============================================================
   1. STATE
   ============================================================ */
const state = {

  client:         null,  // { id, nombre, rutina_id, sesiones_objetivo } si hay cliente logueado
  clientCheckins: [],    // check-ins de la semana actual del cliente logueado
  clientes:       [],    // caché de clientes para el panel admin

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
      visible: false,
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
      visible: false,
      addedAt: Date.parse('2026-06-01'),
    },
    {
      id: 'pdf-movilidad-articular',
      name: 'Guía de Movilidad Articular',
      desc: 'Rutina de 15 minutos diarios para mejorar el rango de movimiento y prevenir lesiones.',
      cat: 'Entrenamiento',
      pages: '?',
      url: '',
      visible: false,
    },
    {
      id: 'pdf-entrena-viajas',
      name: 'Entrena Mientras Viajas',
      desc: 'Protocolo de entrenamiento completo para mantener el progreso cuando no tienes acceso a un gimnasio.',
      cat: 'Entrenamiento',
      pages: '?',
      url: '',
      visible: false,
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
      visible: false,
      addedAt: Date.parse('2026-06-01'),
    },
  ],

  activeTab: 'wod',
};


/* ============================================================
   2. SUPABASE — Cliente y configuración
   ============================================================ */
const SUPABASE_URL = 'https://wuifruvuuymqccpzafju.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind1aWZydXZ1dXltcWNjcHphZmp1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE3Nzg5ODYsImV4cCI6MjA5NzM1NDk4Nn0.9cg51kb_bJF7pNHHWgN1Y-ww6KFq1u3N7GbIoejioDM';

const sb = {
  /** Llamada genérica a la API REST de Supabase */
  async _req(method, table, body = null, params = '') {
    const url = `${SUPABASE_URL}/rest/v1/${table}${params}`;
    const headers = {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      'Prefer':        method === 'POST' ? 'return=representation' : 'return=minimal',
    };
    const res = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) {
      const err = await res.text();
      throw new Error(`Supabase ${method} ${table}: ${res.status} — ${err}`);
    }
    // DELETE y PATCH vacíos no devuelven JSON
    if (res.status === 204 || res.headers.get('content-length') === '0') return null;
    return res.json();
  },

  select: (table, params = '')       => sb._req('GET',    table, null,  `?${params}`),
  insert: (table, body)              => sb._req('POST',   table, body,  ''),
  update: (table, body, params)      => sb._req('PATCH',  table, body,  `?${params}`),
  upsert: (table, body)              => sb._req('POST',   table, body,  '').then(() => null)
                                          .catch(() => sb._req('PATCH', table, body, `?id=eq.${body.id}`)),
  delete: (table, params)            => sb._req('DELETE', table, null,  `?${params}`),
};


/* ============================================================
   3. PERSIST — localStorage como caché offline + auth
   Solo WOD/archive se cachean localmente para funcionar
   sin conexión. Rutinas y PDFs van directo a Supabase.
   ============================================================ */
const persist = {

  save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn('localStorage write error:', e); }
  },

  load(key) {
    try {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },

  /** Carga WOD y archivo desde caché local (fallback offline) */
  hydrateWodFromCache() {
    const savedWod     = persist.load(STORAGE_KEYS.WOD);
    const savedArchive = persist.load(STORAGE_KEYS.ARCHIVE);

    if (
      savedWod !== null &&
      typeof savedWod === 'object' &&
      typeof savedWod.week === 'string' &&
      Array.isArray(savedWod.exercises)
    ) {
      state.wod = {
        ...state.wod,
        ...savedWod,
        subtitle: savedWod.subtitle ?? '',
        month:    savedWod.month    ?? '',
        note:     savedWod.note     ?? '',
        diff:     savedWod.diff     ?? '★★★☆☆',
        format:   savedWod.format   ?? '',
      };
    }

    if (savedArchive !== null && Array.isArray(savedArchive)) {
      state.archive = savedArchive;
    }
  },

  saveWod() {
    persist.save(STORAGE_KEYS.WOD,     state.wod);
    persist.save(STORAGE_KEYS.ARCHIVE, state.archive);
  },
};


/* ============================================================
   4. DATA LAYER — Rutinas & PDFs via Supabase
   Para migrar a otro backend: solo cambia el cuerpo
   de estas funciones. El resto de la app no se toca.
   ============================================================ */
const dataStore = {

  // ── Estado local (caché en memoria) ──
  _ready: false,

  /** Carga inicial desde Supabase al arrancar la app */
  async init() {
    try {
      const [rutinas, pdfs, wodRows, archiveRows] = await Promise.all([
        sb.select('rutinas', 'order=sort_order.asc'),
        sb.select('pdfs',    'order=sort_order.asc'),
        sb.select('wod',     'id=eq.1'),
        sb.select('wod_archive', 'order=id.asc'),
      ]);

      if (Array.isArray(rutinas)) state.rutinas = rutinas.map(dataStore._normalizeRutina);
      if (Array.isArray(pdfs))    state.pdfs    = pdfs.map(dataStore._normalizePdf);

      if (Array.isArray(wodRows) && wodRows.length > 0) {
        const w = wodRows[0];
        state.wod = {
          week:      w.week      || '',
          title:     w.title     || '',
          format:    w.format    || '',
          diff:      w.diff      || '★★★☆☆',
          subtitle:  w.subtitle  || '',
          month:     w.month     || '',
          note:      w.note      || '',
          exercises: Array.isArray(w.exercises) ? w.exercises : [],
        };
        persist.saveWod(); // actualiza caché local
      }

      if (Array.isArray(archiveRows)) {
        state.archive = archiveRows.map(r => ({
          week:  r.week  || '',
          title: r.title || '',
          meta:  r.meta  || '',
        }));
        persist.save(STORAGE_KEYS.ARCHIVE, state.archive);
      }

      dataStore._ready = true;
    } catch (e) {
      console.warn('Supabase no disponible, usando caché local:', e.message);
      persist.hydrateWodFromCache();
      // Rutinas y PDFs se quedan con los seeds del state
    }
  },

  _normalizeRutina(r) {
    return {
      id:      r.id      || '',
      name:    r.name    || '',
      desc:    r.desc    || '',
      days:    r.days    || '',
      level:   r.level   || '',
      goal:    r.goal    || '',
      url:     r.url     || '',
      visible: r.visible !== false,
    };
  },

  _normalizePdf(p) {
    return {
      id:      p.id       || '',
      name:    p.name     || '',
      desc:    p.desc     || '',
      cat:     p.cat      || 'Otros',
      pages:   p.pages    || '?',
      url:     p.url      || '',
      visible: p.visible  !== false,
      addedAt: p.added_at || 0,
    };
  },

  // ───────── RUTINAS ─────────

  getRutinas(includeHidden = false) {
    return includeHidden
      ? state.rutinas
      : state.rutinas.filter(r => r.visible !== false);
  },

  getRutinaById(id) {
    return state.rutinas.find(r => r.id === id) || null;
  },

  async saveRutina(data) {
    const entry = {
      id:         'rutina-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name:       data.name  || '',
      desc:       data.desc  || '',
      days:       data.days  || '',
      level:      data.level || '',
      goal:       data.goal  || '',
      url:        data.url   || '',
      visible:    data.visible !== false,
      sort_order: state.rutinas.length + 1,
    };
    await sb.insert('rutinas', entry);
    state.rutinas.push(dataStore._normalizeRutina(entry));
    return entry;
  },

  async updateRutina(id, data) {
    const idx = state.rutinas.findIndex(r => r.id === id);
    if (idx === -1) return null;
    const updated = { ...state.rutinas[idx], ...data, id };
    await sb.update('rutinas', {
      name: updated.name, desc: updated.desc, days: updated.days,
      level: updated.level, goal: updated.goal, url: updated.url,
      visible: updated.visible,
    }, `id=eq.${id}`);
    state.rutinas[idx] = dataStore._normalizeRutina(updated);
    return state.rutinas[idx];
  },

  async toggleRutinaVisibility(id) {
    const r = dataStore.getRutinaById(id);
    if (!r) return null;
    return dataStore.updateRutina(id, { visible: !r.visible });
  },

  async deleteRutina(id) {
    await sb.delete('rutinas', `id=eq.${id}`);
    state.rutinas = state.rutinas.filter(r => r.id !== id);
    return true;
  },

  // ───────── CLIENTES ─────────

  _normalizeCliente(c) {
    return {
      id:                c.id,
      nombre:            c.nombre || '',
      codigo:            c.codigo || '',
      rutina_id:         c.rutina_id || '',
      sesiones_objetivo: c.sesiones_objetivo || 4,
      activo:            c.activo !== false,
    };
  },

  getClienteById(id) {
    return state.clientes.find(c => String(c.id) === String(id)) || null;
  },

  /** Carga la lista de clientes (solo panel admin) */
  async loadClientes() {
    const rows = await sb.select('clientes', 'order=nombre.asc');
    state.clientes = Array.isArray(rows) ? rows.map(dataStore._normalizeCliente) : [];
    return state.clientes;
  },

  async saveCliente(data) {
    const entry = {
      nombre:            data.nombre || '',
      codigo:            (data.codigo || '').trim().toUpperCase(),
      rutina_id:         data.rutina_id || null,
      sesiones_objetivo: Number(data.sesiones_objetivo) || 4,
      activo:            true,
    };
    const created = await sb.insert('clientes', entry);
    const row = Array.isArray(created) ? created[0] : created;
    state.clientes.push(dataStore._normalizeCliente(row));
    return row;
  },

  async updateCliente(id, data) {
    const idx = state.clientes.findIndex(c => String(c.id) === String(id));
    if (idx === -1) return null;
    const updated = { ...state.clientes[idx], ...data };
    await sb.update('clientes', {
      nombre:            updated.nombre,
      codigo:            (updated.codigo || '').trim().toUpperCase(),
      rutina_id:         updated.rutina_id || null,
      sesiones_objetivo: Number(updated.sesiones_objetivo) || 4,
      activo:            updated.activo,
    }, `id=eq.${id}`);
    state.clientes[idx] = dataStore._normalizeCliente(updated);
    return state.clientes[idx];
  },

  async toggleClienteActivo(id) {
    const c = dataStore.getClienteById(id);
    if (!c) return null;
    return dataStore.updateCliente(id, { activo: !c.activo });
  },

  async deleteCliente(id) {
    await sb.delete('clientes', `id=eq.${id}`);
    state.clientes = state.clientes.filter(c => String(c.id) !== String(id));
    return true;
  },

  // ───────── CHECK-INS (sesiones completadas por el cliente) ─────────

  /** Check-ins del cliente en la semana actual (lunes → hoy) */
  async getCheckinsSemana(clienteId) {
    const monday = utils.mondayISO();
    const rows = await sb.select('checkins', `cliente_id=eq.${clienteId}&fecha=gte.${monday}&order=fecha.asc`);
    return Array.isArray(rows) ? rows : [];
  },

  async marcarSesionHoy(clienteId) {
    const today = utils.todayISO();
    try {
      await sb.insert('checkins', { cliente_id: clienteId, fecha: today });
    } catch (e) {
      // Si ya existe un check-in hoy (constraint unique), lo ignoramos sin romper la UI
      if (!/duplicate|unique/i.test(e.message || '')) throw e;
    }
  },

  // ───────── PDFs ─────────

  getPdfs(includeHidden = false) {
    return includeHidden
      ? state.pdfs
      : state.pdfs.filter(p => p.visible !== false);
  },

  getPdfById(id) {
    return state.pdfs.find(p => p.id === id) || null;
  },

  async savePdf(data) {
    const entry = {
      id:         'pdf-' + Date.now() + '-' + Math.random().toString(36).slice(2, 7),
      name:       data.name  || '',
      desc:       data.desc  || '',
      cat:        data.cat   || 'Otros',
      pages:      data.pages || '?',
      url:        data.url   || '',
      visible:    data.visible !== false,
      added_at:   Date.now(),
      sort_order: state.pdfs.length + 1,
    };
    await sb.insert('pdfs', entry);
    state.pdfs.push(dataStore._normalizePdf(entry));
    return entry;
  },

  async updatePdf(id, data) {
    const idx = state.pdfs.findIndex(p => p.id === id);
    if (idx === -1) return null;
    const updated = { ...state.pdfs[idx], ...data, id };
    await sb.update('pdfs', {
      name: updated.name, desc: updated.desc, cat: updated.cat,
      pages: updated.pages, url: updated.url, visible: updated.visible,
    }, `id=eq.${id}`);
    state.pdfs[idx] = dataStore._normalizePdf(updated);
    return state.pdfs[idx];
  },

  async togglePdfVisibility(id) {
    const p = dataStore.getPdfById(id);
    if (!p) return null;
    return dataStore.updatePdf(id, { visible: !p.visible });
  },

  async deletePdf(id) {
    await sb.delete('pdfs', `id=eq.${id}`);
    state.pdfs = state.pdfs.filter(p => p.id !== id);
    return true;
  },

  getCategorias() {
    const base = ['Salud General', 'Nutrición', 'Entrenamiento', 'Descanso', 'Mujer & Hormonas', 'Suplementación', 'Otros'];
    const fromData = state.pdfs.map(p => p.cat);
    return Array.from(new Set([...base, ...fromData]));
  },

  // ───────── WOD via Supabase ─────────

  async saveWod(wodData) {
    // Upsert la fila única id=1
    await sb.update('wod', {
      week:      wodData.week,
      title:     wodData.title,
      format:    wodData.format,
      diff:      wodData.diff,
      subtitle:  wodData.subtitle,
      month:     wodData.month,
      note:      wodData.note,
      exercises: wodData.exercises,
    }, 'id=eq.1');
    state.wod = { ...state.wod, ...wodData };
    persist.saveWod(); // actualiza caché local
  },

  async pushToArchive(entry) {
    await sb.insert('wod_archive', {
      week:  entry.week,
      title: entry.title,
      meta:  entry.meta,
    });
    state.archive.unshift(entry);
    persist.save(STORAGE_KEYS.ARCHIVE, state.archive);
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
   3b. CLIENT AUTH — acceso de clientes (nombre + código)
   ============================================================ */
const clientAuth = {

  isLoggedIn() {
    return !!persist.load(STORAGE_KEYS.CLIENT);
  },

  getClient() {
    return persist.load(STORAGE_KEYS.CLIENT);
  },

  logout() {
    localStorage.removeItem(STORAGE_KEYS.CLIENT);
    state.client = null;
    state.clientCheckins = [];
    render.clientPanel();
    render.rutinas();
  },

  requestAccess() {
    if (clientAuth.isLoggedIn()) return;
    clientAuth._showOverlay();
  },

  _showOverlay() {
    if (document.getElementById('client-login-overlay')) {
      document.getElementById('client-login-overlay').classList.add('open');
      document.getElementById('cl-name').value = '';
      document.getElementById('cl-code').value = '';
      document.getElementById('cl-error').hidden = true;
      setTimeout(() => document.getElementById('cl-name').focus(), 100);
      return;
    }

    const overlay = document.createElement('div');
    overlay.id = 'client-login-overlay';
    overlay.className = 'overlay open';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Acceso de cliente');

    overlay.innerHTML = `
      <div class="modal" style="max-width:360px">
        <div class="modal-head">
          <div class="modal-title">Acceso de cliente</div>
          <button class="modal-close" id="cl-close" aria-label="Cerrar">✕</button>
        </div>
        <div class="modal-body" style="padding:28px 24px 32px">
          <p style="color:var(--muted);font-size:13px;margin-bottom:20px;line-height:1.5">
            Introduce tu nombre y el código que te ha dado Javier para ver tu rutina asignada.
          </p>
          <div class="form-group">
            <label class="form-label" for="cl-name">Nombre</label>
            <input class="form-input" id="cl-name" type="text" placeholder="Tu nombre">
          </div>
          <div class="form-group">
            <label class="form-label" for="cl-code">Código</label>
            <input class="form-input" id="cl-code" type="text" placeholder="Ej. MARIA24"
              style="letter-spacing:2px;text-transform:uppercase">
          </div>
          <p id="cl-error" hidden
            style="color:#c0392b;font-size:12px;margin-top:8px;margin-bottom:0">
            No hemos encontrado ese nombre y código. Revisa con Javier.
          </p>
          <div class="modal-actions" style="margin-top:24px">
            <button class="btn btn-gold" id="cl-submit" type="button">Entrar →</button>
            <button class="btn btn-ghost" id="cl-cancel" type="button">Cancelar</button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(overlay);

    document.getElementById('cl-submit').addEventListener('click', clientAuth._handleLogin);
    document.getElementById('cl-cancel').addEventListener('click', clientAuth._close);
    document.getElementById('cl-close').addEventListener('click', clientAuth._close);
    ['cl-name', 'cl-code'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') clientAuth._handleLogin();
      });
    });
    overlay.addEventListener('click', e => {
      if (e.target === overlay) clientAuth._close();
    });

    setTimeout(() => document.getElementById('cl-name').focus(), 100);
  },

  async _handleLogin() {
    const nameInput = document.getElementById('cl-name');
    const codeInput = document.getElementById('cl-code');
    const error     = document.getElementById('cl-error');
    const btn       = document.getElementById('cl-submit');

    const nombre = nameInput.value.trim();
    const codigo = codeInput.value.trim().toUpperCase();

    if (!nombre || !codigo) {
      error.textContent = 'Introduce tu nombre y tu código.';
      error.hidden = false;
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Comprobando...';

    try {
      const rows  = await sb.select('clientes', `codigo=eq.${encodeURIComponent(codigo)}&activo=eq.true`);
      const match = Array.isArray(rows) && rows.find(
        c => (c.nombre || '').trim().toLowerCase() === nombre.toLowerCase()
      );

      if (!match) {
        error.textContent = 'No hemos encontrado ese nombre y código. Revisa con Javier.';
        error.hidden = false;
        codeInput.style.borderColor = '#c0392b';
        setTimeout(() => { codeInput.style.borderColor = ''; }, 1500);
        return;
      }

      const client = {
        id:                match.id,
        nombre:            match.nombre,
        rutina_id:         match.rutina_id || '',
        sesiones_objetivo: match.sesiones_objetivo || 4,
      };
      persist.save(STORAGE_KEYS.CLIENT, client);
      state.client = client;

      clientAuth._close();
      await clientAuth.refreshCheckins();
      render.clientPanel();
      render.rutinas();
    } catch (e) {
      console.error('Error en login de cliente:', e);
      error.textContent = 'No se ha podido comprobar el acceso. Inténtalo de nuevo.';
      error.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = 'Entrar →';
    }
  },

  _close() {
    const overlay = document.getElementById('client-login-overlay');
    if (overlay) overlay.classList.remove('open');
  },

  /** Carga los check-ins de la semana actual del cliente logueado */
  async refreshCheckins() {
    if (!state.client) return;
    try {
      state.clientCheckins = await dataStore.getCheckinsSemana(state.client.id);
    } catch (e) {
      console.warn('No se han podido cargar los check-ins:', e.message);
      state.clientCheckins = [];
    }
  },

  async marcarHoy() {
    if (!state.client) return;
    const today = utils.todayISO();
    if (state.clientCheckins.some(c => c.fecha === today)) return; // ya marcada hoy
    try {
      await dataStore.marcarSesionHoy(state.client.id);
      state.clientCheckins.push({ fecha: today });
      render.clientPanel();
    } catch (e) {
      console.error('Error al marcar la sesión:', e);
      alert('No se ha podido registrar la sesión. Inténtalo de nuevo.');
    }
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

  /** Fecha de hoy en formato ISO (YYYY-MM-DD), zona horaria local */
  todayISO() {
    const d = new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  },

  /** Fecha del lunes de la semana actual, en formato ISO */
  mondayISO() {
    const d = new Date();
    const day = (d.getDay() + 6) % 7; // 0 = lunes
    d.setDate(d.getDate() - day);
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
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

    let visibles = dataStore.getRutinas(false);

    if (visibles.length === 0) {
      container.appendChild(utils.el('p', 'empty-state', 'No hay rutinas disponibles por el momento.'));
      return;
    }

    // Si hay un cliente logueado con rutina asignada, la ponemos primero
    const asignadaId = state.client?.rutina_id || null;
    if (asignadaId) {
      visibles = [
        ...visibles.filter(r => r.id === asignadaId),
        ...visibles.filter(r => r.id !== asignadaId),
      ];
    }

    visibles.forEach(r => {
      const esAsignada = r.id === asignadaId;
      const card      = utils.el('div', 'rutina-card' + (esAsignada ? ' rutina-card--tuya' : ''));
      card.dataset.id = r.id;

      const info = utils.el('div', 'rc-info');
      const tagsLine = [r.level, r.goal].filter(Boolean).join(' · ');
      info.append(
        utils.el('div', 'rc-days', r.days),
      );
      if (esAsignada) info.appendChild(utils.el('span', 'rc-badge-tuya', 'Tu rutina'));
      info.append(
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

  /** Panel personalizado del cliente logueado (o CTA de acceso si no lo está) */
  clientPanel() {
    const wrap = document.getElementById('client-panel');
    if (!wrap) return;
    utils.empty(wrap);

    if (!state.client) {
      const cta = document.createElement('div');
      cta.className = 'client-cta';
      cta.innerHTML = `
        <span>¿Ya eres cliente de Javier?</span>
        <button class="btn btn-outline" id="btn-client-login" type="button">Accede aquí →</button>
      `;
      wrap.appendChild(cta);
      return;
    }

    const rutina = state.client.rutina_id ? dataStore.getRutinaById(state.client.rutina_id) : null;
    const objetivo = state.client.sesiones_objetivo || 4;
    const hechas = state.clientCheckins.length;
    const pct = Math.min(100, Math.round((hechas / objetivo) * 100));
    const today = utils.todayISO();
    const marcadaHoy = state.clientCheckins.some(c => c.fecha === today);

    // Puntos de la semana (L a D)
    const monday = new Date(utils.mondayISO() + 'T00:00:00');
    const dias = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
    const dots = dias.map((label, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const iso = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
      const done = state.clientCheckins.some(c => c.fecha === iso);
      const isToday = iso === today;
      return `<span class="week-dot${done ? ' week-dot--done' : ''}${isToday ? ' week-dot--today' : ''}" title="${label}">${label}</span>`;
    }).join('');

    const panel = document.createElement('div');
    panel.className = 'client-panel';
    panel.innerHTML = `
      <div class="client-panel-head">
        <div>
          <div class="client-panel-greeting">Hola, ${state.client.nombre.split(' ')[0]} 👋</div>
          <div class="client-panel-rutina">${rutina ? 'Tu rutina: ' + rutina.name : 'Aún no tienes una rutina asignada'}</div>
        </div>
        <button class="client-logout" id="btn-client-logout" type="button">Cerrar sesión</button>
      </div>
      <div class="client-progress">
        <div class="client-progress-row">
          <span class="client-progress-label">Sesiones esta semana</span>
          <span class="client-progress-count">${hechas}/${objetivo}</span>
        </div>
        <div class="client-progress-bar"><div class="client-progress-fill" style="width:${pct}%"></div></div>
        <div class="week-dots">${dots}</div>
      </div>
      <button class="btn ${marcadaHoy ? 'btn-outline' : 'btn-gold'}" id="btn-marcar-hoy" type="button" ${marcadaHoy ? 'disabled' : ''}>
        ${marcadaHoy ? '✓ Sesión de hoy registrada' : 'Marcar sesión de hoy →'}
      </button>
    `;
    wrap.appendChild(panel);
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

  /** Panel admin — lista de gestión de clientes */
  adminClientes() {
    const list = document.getElementById('admin-clientes-list');
    if (!list) return;
    utils.empty(list);

    const all = state.clientes;

    const counter = document.getElementById('cm-clientes-count');
    if (counter) {
      const activos = all.filter(c => c.activo).length;
      counter.textContent = `${activos} activo${activos !== 1 ? 's' : ''} · ${all.length - activos} inactivo${all.length - activos !== 1 ? 's' : ''}`;
    }

    if (all.length === 0) {
      list.appendChild(utils.el('p', 'empty-state', 'No hay clientes todavía. Añade el primero desde el formulario de arriba.'));
      return;
    }

    all.forEach(c => {
      const rutina = c.rutina_id ? dataStore.getRutinaById(c.rutina_id) : null;
      const item = document.createElement('div');
      item.className = 'cm-item' + (c.activo ? '' : ' cm-item--hidden');
      item.id = 'cm-cliente-' + c.id;
      item.innerHTML = `
        <div class="cm-info">
          <div class="cm-name">${c.nombre} <span class="cm-codigo">${c.codigo}</span></div>
          <div class="cm-meta">${rutina ? rutina.name : 'Sin rutina asignada'} · ${c.sesiones_objetivo} sesiones/semana</div>
        </div>
        <div class="cm-badge ${c.activo ? 'cm-badge--visible' : 'cm-badge--hidden'}">
          ${c.activo ? 'Activo' : 'Inactivo'}
        </div>
        <div class="cm-actions">
          <button class="cm-btn cm-btn--edit"   data-action="edit-cliente"   data-id="${c.id}">Editar</button>
          <button class="cm-btn cm-btn--toggle" data-action="toggle-cliente" data-id="${c.id}">${c.activo ? 'Desactivar' : 'Activar'}</button>
          <button class="cm-btn cm-btn--delete" data-action="delete-cliente" data-id="${c.id}">Eliminar</button>
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
    ['wod', 'pdf', 'gestionar', 'clientes'].forEach(t => {
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
    if (tab === 'clientes') {
      ui._populateClienteRutinaSelect();
      dataStore.loadClientes()
        .then(render.adminClientes)
        .catch(e => console.error('Error al cargar clientes:', e));
    }
  },

  /** Rellena el <select> de rutinas del formulario "Nuevo cliente" */
  _populateClienteRutinaSelect() {
    const select = document.getElementById('c-rutina');
    if (!select) return;
    const current = select.value;
    select.innerHTML = '<option value="">Sin asignar</option>' +
      dataStore.getRutinas(true).map(r => `<option value="${r.id}">${r.name}</option>`).join('');
    select.value = current;
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
      : type === 'cliente'
      ? dataStore.getClienteById(id)
      : dataStore.getPdfById(id);
    if (!data) return;

    const wrap = document.createElement('div');
    wrap.id = 'edit-form-container';
    wrap.className = 'edit-form-container';

    if (type === 'cliente') {
      const rutinasOpts = dataStore.getRutinas(true)
        .map(r => `<option value="${r.id}"${r.id === data.rutina_id ? ' selected' : ''}>${r.name}</option>`)
        .join('');
      wrap.innerHTML = `
        <div class="edit-form-title">Editar cliente</div>
        <div class="form-group">
          <label class="form-label">Nombre</label>
          <input class="form-input" id="ef-c-nombre" type="text" value="${_esc(data.nombre)}">
        </div>
        <div class="form-group">
          <label class="form-label">Código de acceso</label>
          <input class="form-input" id="ef-c-codigo" type="text" value="${_esc(data.codigo)}" style="letter-spacing:2px;text-transform:uppercase">
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Rutina asignada</label>
            <select class="form-select" id="ef-c-rutina">
              <option value="">Sin asignar</option>
              ${rutinasOpts}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Sesiones / semana</label>
            <input class="form-input" id="ef-c-objetivo" type="number" min="1" max="7" value="${data.sesiones_objetivo}">
          </div>
        </div>
        <div class="modal-actions">
          <button class="btn btn-gold"  id="ef-save"   data-ef-type="cliente" data-ef-id="${id}">Guardar cambios →</button>
          <button class="btn btn-ghost" id="ef-cancel">Cancelar</button>
        </div>
      `;
    } else if (type === 'rutina') {
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

  async publishPDF() {
    const name  = document.getElementById('p-name').value.trim();
    const desc  = document.getElementById('p-desc-input').value.trim();
    const cat   = document.getElementById('p-cat').value;
    const pages = document.getElementById('p-pages').value.trim();
    const url   = document.getElementById('p-url').value.trim();

    if (!utils.notEmpty(name)) { alert('Introduce el nombre del documento.'); return; }
    if (!utils.notEmpty(url) || !/^https?:\/\/.+/.test(url)) {
      alert('Introduce un enlace válido (https://...)'); return;
    }

    const btn = document.getElementById('btn-publish-pdf');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
      await dataStore.savePdf({ name, desc, cat, pages: pages || '?', url });

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
    } catch (err) {
      console.error('Error al guardar el PDF:', err);
      alert('No se ha podido guardar el documento.\n\n' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Añadir a la biblioteca →'; }
    }
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

  async addRutina() {
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

    const btn = document.getElementById('btn-add-rutina');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
      await dataStore.saveRutina({ name, days: days || 'A definir', desc, level, goal, url });

      ['r-name','r-days','r-desc','r-goal','r-url'].forEach(id => {
        document.getElementById(id).value = '';
      });
      document.getElementById('r-level').selectedIndex = 0;
      const preview = document.getElementById('r-url-preview');
      if (preview) preview.hidden = true;

      render.rutinas();
      render.adminRutinas();
      utils.showToast('toast-rutina');
    } catch (err) {
      console.error('Error al guardar la rutina:', err);
      alert('No se ha podido guardar la rutina.\n\n' + err.message);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Añadir rutina →'; }
    }
  },

  // ── Clientes — Nuevo ──

  async addCliente() {
    const nombre    = document.getElementById('c-nombre').value.trim();
    const codigo    = document.getElementById('c-codigo').value.trim();
    const rutina_id = document.getElementById('c-rutina').value || null;
    const objetivo  = document.getElementById('c-objetivo').value || 4;

    if (!utils.notEmpty(nombre)) { alert('Introduce el nombre del cliente.'); return; }
    if (!utils.notEmpty(codigo)) { alert('Introduce un código de acceso.'); return; }

    const btn = document.getElementById('btn-add-cliente');
    if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }

    try {
      await dataStore.saveCliente({ nombre, codigo, rutina_id, sesiones_objetivo: objetivo });

      ['c-nombre', 'c-codigo'].forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('c-rutina').selectedIndex = 0;
      document.getElementById('c-objetivo').value = 4;

      render.adminClientes();
      utils.showToast('toast-clientes');
    } catch (err) {
      console.error('Error al guardar el cliente:', err);
      const msg = /duplicate|unique/i.test(err.message || '')
        ? 'Ese código ya está en uso. Elige otro.'
        : err.message;
      alert('No se ha podido guardar el cliente.\n\n' + msg);
    } finally {
      if (btn) { btn.disabled = false; btn.textContent = 'Añadir cliente →'; }
    }
  },

  /** Genera un código sugerido a partir del nombre (editable después) */
  sugerirCodigoCliente() {
    const nombre = document.getElementById('c-nombre').value.trim();
    const codigoInput = document.getElementById('c-codigo');
    if (!nombre || codigoInput.value) return;
    const base = nombre.split(' ')[0].toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const suf  = Math.floor(10 + Math.random() * 90);
    codigoInput.value = base + suf;
  },

  // ── Gestión de contenidos (Editar / Toggle / Eliminar) ──

  async saveEdit(type, id) {
    if (type === 'cliente') {
      const nombre    = document.getElementById('ef-c-nombre')?.value.trim();
      const codigo    = document.getElementById('ef-c-codigo')?.value.trim();
      const rutina_id = document.getElementById('ef-c-rutina')?.value || null;
      const objetivo  = document.getElementById('ef-c-objetivo')?.value;

      if (!utils.notEmpty(nombre)) { alert('El nombre no puede estar vacío.'); return; }
      if (!utils.notEmpty(codigo)) { alert('El código no puede estar vacío.'); return; }

      try {
        await dataStore.updateCliente(id, { nombre, codigo, rutina_id, sesiones_objetivo: objetivo });
        render.adminClientes();
        ui._closeEditForm();
        utils.showToast('toast-gestionar');
      } catch (err) {
        console.error('Error al guardar el cliente:', err);
        alert('No se han podido guardar los cambios.\n\n' + err.message);
      }
      return;
    }

    const name = document.getElementById('ef-name')?.value.trim();
    const desc = document.getElementById('ef-desc')?.value.trim();
    const url  = document.getElementById('ef-url')?.value.trim();

    if (!utils.notEmpty(name)) { alert('El nombre no puede estar vacío.'); return; }
    if (url && !/^https?:\/\/.+/.test(url)) {
      alert('El enlace debe empezar por https://'); return;
    }

    try {
      if (type === 'rutina') {
        const days  = document.getElementById('ef-days')?.value.trim();
        const level = document.getElementById('ef-level')?.value;
        const goal  = document.getElementById('ef-goal')?.value.trim();
        await dataStore.updateRutina(id, { name, desc, days, level, goal, url: url || '' });
        render.rutinas();
        render.adminRutinas();
      } else {
        const cat   = document.getElementById('ef-cat')?.value;
        const pages = document.getElementById('ef-pages')?.value.trim();
        await dataStore.updatePdf(id, { name, desc, cat, pages: pages || '?', url: url || '' });
        render.pdfs();
        render.adminPdfs();
      }

      ui._closeEditForm();
      utils.showToast('toast-gestionar');
    } catch (err) {
      console.error('Error al guardar los cambios:', err);
      alert('No se han podido guardar los cambios.\n\n' + err.message);
    }
  },

  async toggleVisibility(type, id) {
    try {
      if (type === 'rutina') {
        await dataStore.toggleRutinaVisibility(id);
        render.rutinas();
        render.adminRutinas();
      } else if (type === 'cliente') {
        await dataStore.toggleClienteActivo(id);
        render.adminClientes();
      } else {
        await dataStore.togglePdfVisibility(id);
        render.pdfs();
        render.adminPdfs();
      }
    } catch (err) {
      console.error('Error al cambiar la visibilidad:', err);
      alert('No se ha podido actualizar el estado.\n\n' + err.message);
    }
  },

  async deleteItem(type, id, name) {
    if (!confirm(`¿Eliminar "${name}"? Esta acción no se puede deshacer.`)) return;
    try {
      if (type === 'rutina') {
        await dataStore.deleteRutina(id);
        render.rutinas();
        render.adminRutinas();
      } else if (type === 'cliente') {
        await dataStore.deleteCliente(id);
        render.adminClientes();
      } else {
        await dataStore.deletePdf(id);
        render.pdfs();
        render.adminPdfs();
      }
      ui._closeEditForm();
    } catch (err) {
      console.error('Error al eliminar:', err);
      alert('No se ha podido eliminar el elemento.\n\n' + err.message);
    }
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
          model: 'claude-sonnet-4-6',
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

      /* Guardar en localStorage (caché local para WodAI) */
      const wodEntry = { week, url, wod, ts: Date.now() };
      persist.save(WodAI.STORAGE_KEY, wodEntry);

      /* Guardar en Supabase */
      try {
        await dataStore.saveWod({
          week,
          title:    wod.titulo    || 'WOD de la Semana',
          format:   wod.subtitulo || '',
          diff:     wod.dificultad || '★★★☆☆',
          subtitle: wod.subtitulo || '',
          month:    week,
          note:     wod.nota_general || '',
          exercises: (wod.bloques || []).flatMap(b =>
            (b.ejercicios || []).map(ej => [
              ej.nombre,
              [ej.series, ej.reps, ej.rir ? 'RIR ' + ej.rir : ''].filter(Boolean).join(' · ')
            ])
          ),
        });

        /* Archivar WOD anterior si era distinto */
        const prev = persist.load(WodAI.STORAGE_KEY + '_prev');
        if (prev && prev.week !== week) {
          await dataStore.pushToArchive({
            week:  prev.week,
            title: prev.wod?.titulo || 'WOD',
            meta:  prev.wod?.subtitulo || '',
          });
          render.archive();
        }
      } catch(supaErr) {
        console.warn('Supabase no disponible, WOD guardado solo en local:', supaErr.message);
      }

      persist.save(WodAI.STORAGE_KEY + '_prev', wodEntry);

      /* Renderizar en la app */
      WodAI.renderContent(wodEntry);

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
async function init() {

  // 1. Render inmediato con seeds locales + caché
  //    (la app se ve al instante mientras carga Supabase)
  persist.hydrateWodFromCache();
  WodAI.hydrate();
  render.wod();
  render.archive();
  render.rutinas();
  render.pdfs();
  render.clientPanel();

  // 2. Splash
  document.getElementById('sp-line').classList.add('grow');
  setTimeout(() => document.getElementById('splash').classList.add('out'), 1500);

  // 3. Carga real desde Supabase — re-render cuando lleguen los datos
  dataStore.init().then(async () => {
    WodAI.hydrate();
    render.wod();
    render.archive();
    render.rutinas();
    render.pdfs();

    // Sesión de cliente ya guardada en este navegador
    if (clientAuth.isLoggedIn()) {
      state.client = clientAuth.getClient();
      await clientAuth.refreshCheckins();
      render.rutinas(); // re-render con la rutina asignada destacada
    }
    render.clientPanel();
  });

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
      if (e.target.id === 'mt-clientes')  { ui.switchModalTab('clientes');  return; }

      // ── Acciones estáticas del modal ──
      if (e.target.id === 'btn-publish-wod')  { WodAI.publish();        return; }
      if (e.target.id === 'btn-publish-pdf')  { handlers.publishPDF();  return; }
      if (e.target.id === 'btn-add-rutina')   { handlers.addRutina();   return; }
      if (e.target.id === 'btn-add-cliente')  { handlers.addCliente();  return; }
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
      const type = action.includes('rutina')  ? 'rutina'
                 : action.includes('cliente')  ? 'cliente'
                 : 'pdf';

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
        const data = type === 'rutina'  ? dataStore.getRutinaById(id)
                   : type === 'cliente' ? dataStore.getClienteById(id)
                   : dataStore.getPdfById(id);
        handlers.deleteItem(type, id, data?.nombre || data?.name || id); return;
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

  // 8b. Acceso de cliente — abrir modal / cerrar sesión / marcar sesión de hoy
  document.addEventListener('click', e => {
    if (e.target.closest('#btn-client-login'))  { clientAuth.requestAccess(); return; }
    if (e.target.closest('#btn-client-logout')) { clientAuth.logout();        return; }
    if (e.target.closest('#btn-marcar-hoy'))    { clientAuth.marcarHoy();     return; }
  });

  // 8c. Sugerir código al escribir el nombre del nuevo cliente
  const cNombre = document.getElementById('c-nombre');
  if (cNombre) cNombre.addEventListener('blur', () => handlers.sugerirCodigoCliente());

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
    console.log('client:', structuredClone(state.client));
    console.log('clientCheckins:', structuredClone(state.clientCheckins));
  },
  logout() {
    auth.logout();
    console.info('JM App: sesión admin cerrada.');
  },
};
