/* ============================================================
   JM FITNESS APP — app.js
   Autor: Javier Manzano Fitness
   Arquitectura: State → Persist → Render → UI → Handlers → Init
   Sin frameworks. Vanilla JS modular.
   ============================================================ */

'use strict';


/* ============================================================
   0. CONSTANTES
      Claves de localStorage centralizadas aquí.
      Cambiar una clave en este objeto la actualiza en toda la app.
   ============================================================ */
const STORAGE_KEYS = {
  WOD:     'jm_wod',
  ARCHIVE: 'jm_archive',
  PDFS:    'jm_pdfs',    // solo PDFs añadidos dinámicamente por admin
};


/* ============================================================
   1. STATE — Fuente única de verdad.
      Contiene los datos seed (por defecto).
      Al arrancar, persist.hydrate() los reemplaza con los de
      localStorage si existen datos guardados válidos.
   ============================================================ */
const state = {

  /* WOD de la semana activo */
  wod: {
    week:      'Semana 16 · 14 abr 2026',
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

  /* Histórico de WODs — el más reciente primero */
  archive: [
    { week: 'Sem 15 · 7 abr',  title: 'Tren inferior · Hipertrofia', meta: '5×10 · RIR progresivo'    },
    { week: 'Sem 14 · 31 mar', title: 'Empuje & Core',                meta: "EMOM 16' · Alta densidad" },
    { week: 'Sem 12 · 17 mar', title: 'Full Body · Hipertrofia',      meta: "AMRAP 20' · DropSets"    },
    { week: 'Sem 10 · 3 mar',  title: 'Circuito Metabólico',          meta: 'Tabata modificado'        },
    { week: 'Sem 8 · 18 feb',  title: 'Jalones & Tirón',              meta: '4×8 · Control excéntrico' },
    { week: 'Sem 6 · 4 feb',   title: 'Pierna completa',              meta: 'Búlgara + RDL + Hip Thrust' },
  ],

  /*
   * Rutinas genéricas.
   * Para añadir o editar una rutina: modifica este array.
   * urlPdf / urlVer: pon '#' si aún no tienes el enlace real.
   * Cuando tengas el PDF de Drive, reemplaza '#' por la URL.
   */
  rutinas: [
    {
      id:     'fullbody-ab',
      days:   '2 días / semana',
      name:   'Full Body A / B',
      desc:   'Principiantes · Sin material necesario · Progresión lineal',
      urlPdf: '#',   // 🔗 Reemplaza con tu enlace real cuando lo tengas
      urlVer: '#',
    },
    {
      id:     'torso-pierna-full',
      days:   '3 días / semana',
      name:   'Torso – Pierna – Full',
      desc:   'Nivel medio · Gimnasio o mancuernas · Hipertrofia base',
      urlPdf: '#',
      urlVer: '#',
    },
    {
      id:     'ppl-full',
      days:   '4 días / semana',
      name:   'Push / Pull / Legs / Full',
      desc:   'Avanzado · Hipertrofia y fuerza · Periodización ondulada',
      urlPdf: '#',
      urlVer: '#',
    },
    {
      id:     'calistenia-casa',
      days:   'Sin material',
      name:   'Calistenia & Casa',
      desc:   'Todos los niveles · Circuitos y calistenia · Progresión clara',
      urlPdf: '#',
      urlVer: '#',
    },
  ],

  /*
   * PDFs añadidos desde el panel admin en tiempo real.
   * Los PDFs del HTML estático (seed) NO se guardan aquí;
   * solo los nuevos que publique Javier desde el formulario.
   */
  dynamicPdfs: [],

  /* Tab activa en este momento */
  activeTab: 'wod',
};


/* ============================================================
   2. PERSIST — Capa de persistencia con localStorage.
      Contiene toda la lógica de lectura/escritura.
      El resto de la app no toca localStorage directamente.
   ============================================================ */
const persist = {

  /** Guarda datos en localStorage de forma segura. */
  save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (e) {
      console.warn('JM App: no se pudo guardar en localStorage.', e);
    }
  },

  /** Lee y parsea un valor. Devuelve null si no existe o falla el parse. */
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
   * Hidrata el state con los datos guardados.
   * Llamar UNA SOLA VEZ al inicio, antes de los renders.
   * Si no hay datos guardados, el state mantiene sus seeds.
   *
   * VALIDACIÓN DEFENSIVA: cada valor recuperado se verifica antes
   * de asignarlo. Si la estructura no es la esperada (datos corruptos,
   * versión antigua, localStorage manipulado), se ignora y se conserva
   * el seed. Esto evita errores silenciosos en runtime.
   */
  hydrate() {
    const savedWod     = persist.load(STORAGE_KEYS.WOD);
    const savedArchive = persist.load(STORAGE_KEYS.ARCHIVE);
    const savedPdfs    = persist.load(STORAGE_KEYS.PDFS);

    // WOD: debe ser un objeto con week y title strings, y exercises un array
    // donde cada item es a su vez un array de al menos 2 strings.
    // Esto evita que render.wod() explote al destructurar items corruptos.
    if (
      savedWod !== null &&
      typeof savedWod === 'object' &&
      typeof savedWod.week === 'string' &&
      typeof savedWod.title === 'string' &&
      Array.isArray(savedWod.exercises) &&
      savedWod.exercises.every(e =>
        Array.isArray(e) &&
        e.length >= 2 &&
        typeof e[0] === 'string' &&
        typeof e[1] === 'string'
      )
    ) {
      state.wod = savedWod;
      // Aplicar defaults a campos opcionales para evitar "undefined" en la UI
      // si el WOD fue guardado con una versión anterior de la app que no los tenía.
      state.wod.subtitle = state.wod.subtitle ?? '';
      state.wod.month    = state.wod.month    ?? '';
      state.wod.note     = state.wod.note     ?? '';
      state.wod.diff     = state.wod.diff     ?? '★★★☆☆';
      state.wod.format   = state.wod.format   ?? '';
    } else if (savedWod !== null) {
      console.warn('JM App: wod en localStorage tiene estructura inválida. Usando seed.');
    }

    // Archive: debe ser un array de objetos con week, title y meta
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
    } else if (savedArchive !== null) {
      console.warn('JM App: archive en localStorage tiene estructura inválida. Usando seed.');
    }

    // PDFs dinámicos: debe ser un array de objetos con name y cat
    if (
      savedPdfs !== null &&
      Array.isArray(savedPdfs) &&
      savedPdfs.every(
        p => p && typeof p.name === 'string' && typeof p.cat === 'string'
      )
    ) {
      state.dynamicPdfs = savedPdfs;
    } else if (savedPdfs !== null) {
      console.warn('JM App: pdfs en localStorage tiene estructura inválida. Usando array vacío.');
    }
  },

  /** Persiste WOD + archivo tras cada publicación. */
  saveWod() {
    persist.save(STORAGE_KEYS.WOD,     state.wod);
    persist.save(STORAGE_KEYS.ARCHIVE, state.archive);
  },

  /** Persiste la lista de PDFs dinámicos. */
  savePdfs() {
    persist.save(STORAGE_KEYS.PDFS, state.dynamicPdfs);
  },
};


/* ============================================================
   3. UTILS — Helpers puros reutilizables.
      Sin side-effects ni acceso a state.
   ============================================================ */
const utils = {

  /**
   * Crea un nodo DOM con clase(s) y texto opcional.
   * Nunca usa innerHTML → cero riesgo de XSS.
   */
  el(tag, classes, text) {
    const node = document.createElement(tag);
    const cls  = Array.isArray(classes) ? classes : [classes];
    cls.forEach(c => { if (c) node.classList.add(c); });
    if (text !== undefined) node.textContent = text;
    return node;
  },

  /** Elimina todos los nodos hijos de un elemento. */
  empty(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  },

  /**
   * Muestra el toast de confirmación y cierra el modal tras 2,2 s.
   * Usa la clase CSS .toast--visible en lugar de style.display
   * para mantener toda la lógica de visibilidad en styles.css.
   */
  showToast(id) {
    const toast = document.getElementById(id);
    if (!toast) return;

    toast.classList.add('toast--visible');

    setTimeout(() => {
      toast.classList.remove('toast--visible');
      ui.closeModal();
    }, 2200);
  },

  /** true si el string tiene al menos un carácter no vacío. */
  notEmpty(val) {
    return typeof val === 'string' && val.trim().length > 0;
  },

  /**
   * Devuelve un <a> externo si hay URL real, o un <button disabled>
   * si la URL es '#' o está vacía.
   * Centraliza la lógica para que render no repita if/else.
   */
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
   4. RENDER — Lee state y construye el DOM.
      Reglas: nunca modifica state, nunca usa innerHTML con
      datos de usuario, siempre lee de state (no del DOM).
   ============================================================ */
const render = {

  /** Pinta el hero del WOD activo. */
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

  /** Pinta el grid del archivo de WODs. */
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

  /**
   * Genera las tarjetas de rutinas desde state.rutinas.
   * Botones funcionales si hay URL real; desactivados si son '#'.
   */
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

  /**
   * Renderiza los PDFs dinámicos desde state.dynamicPdfs.
   * Limpia los anteriores para evitar duplicados al re-renderizar.
   */
  dynamicPdfs() {
    document.querySelectorAll('.pdf-row--dynamic, .pdf-block--dynamic')
      .forEach(el => el.remove());

    state.dynamicPdfs.forEach(({ name, cat, pages, url }) => {
      render._addPdfRow(name, cat, pages, url, true);
    });
  },

  /**
   * Añade UNA fila de PDF al bloque de su categoría.
   * Crea el bloque si no existe todavía.
   * @param {boolean} isDynamic — marca la fila para que dynamicPdfs()
   *   pueda identificarla y limpiarla en el siguiente render.
   */
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

  /** Añade una fila de inputs vacía al formulario de ejercicios del modal. */
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
   5. UI — Control de navegación e interfaz.
      Solo gestiona clases, visibilidad y scroll.
      No toca state ni datos.
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

  /** Alterna entre formularios WOD / PDF en el modal admin. */
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
   6. HANDLERS — Lógica de negocio.
      Flujo: leer formulario → validar → actualizar state →
      persistir → llamar a render → resetear formulario.
   ============================================================ */
const handlers = {

  /**
   * Publica un nuevo WOD.
   *
   * ANTI-DUPLICADO: antes de archivar el WOD activo, comprueba
   * que su semana (week) sea diferente a la del nuevo WOD que se
   * está publicando. Si coinciden, es una re-publicación del mismo
   * WOD (error del admin) y no se añade al archivo.
   *
   * RESET: limpia el formulario completo al terminar, incluyendo
   * las filas de ejercicios extra que pudiera haber añadido el admin.
   */
  publishWOD() {
    // — Leer formulario —
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

    // — Validación —
    if (!utils.notEmpty(week) || !utils.notEmpty(title) || exercises.length === 0) {
      alert('Rellena al menos la semana, el título y un ejercicio.');
      return;
    }

    // — Archivar el WOD activo solo si la semana es distinta —
    // Normalizar ambas semanas a minúsculas y sin espacios extra para comparar
    const currentWeekNorm = state.wod.week.trim().toLowerCase();
    const newWeekNorm     = week.toLowerCase();

    if (state.wod.week && currentWeekNorm !== newWeekNorm) {
      state.archive.unshift({
        week:  state.wod.week.split('·')[0].trim(),
        title: state.wod.title,
        meta:  state.wod.format,
      });
    }

    // — Actualizar state —
    state.wod = {
      week, title, format, diff,
      subtitle: format + (desc ? ` · ${desc}` : ''),
      month:    month || state.wod.month,
      note, exercises,
    };

    // — Persistir, renderizar, confirmar —
    persist.saveWod();
    render.wod();
    render.archive();
    utils.showToast('toast-wod');

    // — Resetear formulario —
    handlers._resetWodForm();
  },

  /**
   * Añade un nuevo PDF a la biblioteca.
   *
   * VALIDACIÓN MEJORADA: comprueba nombre, que las páginas (si se
   * indican) sean un número positivo, y que la URL (si se indica)
   * tenga un formato mínimamente válido.
   *
   * RESET: limpia todos los campos del formulario al terminar.
   */
  publishPDF() {
    const name  = document.getElementById('p-name').value.trim();
    const cat   = document.getElementById('p-cat').value;
    const pages = document.getElementById('p-pages').value.trim();
    const url   = document.getElementById('p-url').value.trim();

    // Nombre obligatorio
    if (!utils.notEmpty(name)) {
      alert('Introduce el nombre del documento.');
      return;
    }

    // Páginas: si se rellena, debe ser un número entero positivo
    if (pages !== '' && (isNaN(pages) || Number(pages) < 1 || !Number.isInteger(Number(pages)))) {
      alert('El número de páginas debe ser un entero positivo.');
      return;
    }

    // URL: si se rellena, debe empezar por http:// o https://
    if (url !== '' && !/^https?:\/\/.+/.test(url)) {
      alert('El enlace debe comenzar por https:// o http://');
      return;
    }

    const normalizedPages = pages || '?';

    // — Actualizar state y persistir —
    state.dynamicPdfs.push({ name, cat, pages: normalizedPages, url });
    persist.savePdfs();

    // — Renderizar la nueva fila y confirmar —
    render._addPdfRow(name, cat, normalizedPages, url, true);
    utils.showToast('toast-pdf');

    // — Resetear formulario —
    handlers._resetPdfForm();
  },

  /**
   * Limpia el formulario WOD al estado vacío inicial.
   * Elimina las filas de ejercicio extra dejando solo las 3 seed,
   * y vacía sus inputs.
   * PRIVADO — llamar solo desde publishWOD().
   */
  _resetWodForm() {
    document.getElementById('f-week').value  = '';
    document.getElementById('f-title').value = '';
    document.getElementById('f-desc').value  = '';
    document.getElementById('f-month').value = '';
    document.getElementById('f-note').value  = '';
    document.getElementById('f-format').selectedIndex = 0;
    document.getElementById('f-diff').selectedIndex   = 2; // ★★★☆☆ por defecto

    // Borrar filas extra y vaciar las 3 seed
    const list = document.getElementById('ex-list');
    const rows = Array.from(list.querySelectorAll('.ex-row'));

    rows.forEach((row, i) => {
      if (i < 3) {
        // Vaciar las 3 filas originales
        row.querySelectorAll('input').forEach(input => { input.value = ''; });
      } else {
        // Eliminar las filas adicionales que añadió el admin
        list.removeChild(row);
      }
    });
  },

  /**
   * Limpia el formulario PDF al estado vacío inicial.
   * PRIVADO — llamar solo desde publishPDF().
   */
  _resetPdfForm() {
    document.getElementById('p-name').value  = '';
    document.getElementById('p-pages').value = '';
    document.getElementById('p-url').value   = '';
    document.getElementById('p-cat').selectedIndex = 0;
  },
};


/* ============================================================
   7. INIT — Punto de entrada único.
      Orden estricto: hidratación → renders → listeners.
   ============================================================ */
function init() {

  // 1. Hidratar antes de cualquier render
  persist.hydrate();

  // 2. Renders iniciales
  render.wod();
  render.archive();
  render.rutinas();
  render.dynamicPdfs();

  // 3. Splash
  document.getElementById('sp-line').classList.add('grow');
  setTimeout(() => document.getElementById('splash').classList.add('out'), 1500);

  // 4. Navegación (delegación en .sb-nav — un listener para todos los items)
  document.querySelector('.sb-nav').addEventListener('click', e => {
    const item = e.target.closest('.sb-item');
    if (!item) return;
    const tab = item.dataset.tab;
    if (tab) ui.showTab(tab, item);
  });

  // 5. Hamburger
  document.getElementById('hamburger')
    .addEventListener('click', () => ui.toggleSidebar());

  // 6. Admin — abrir modal
  document.querySelector('.admin-trigger')
    .addEventListener('click', () => ui.openModal());

  // 7. Admin — cerrar modal (3 vías de cierre)
  document.getElementById('overlay')
    .addEventListener('click', e => { if (e.target === e.currentTarget) ui.closeModal(); });
  document.querySelector('.modal-close')
    .addEventListener('click', () => ui.closeModal());
  document.querySelectorAll('.btn-cancel-modal')
    .forEach(btn => btn.addEventListener('click', () => ui.closeModal()));

  // 8. Admin — tabs del modal
  document.getElementById('mt-wod').addEventListener('click', () => ui.switchModalTab('wod'));
  document.getElementById('mt-pdf').addEventListener('click', () => ui.switchModalTab('pdf'));

  // 9. Admin — añadir fila de ejercicio
  document.getElementById('btn-add-ex')
    .addEventListener('click', () => render.addExRow());

  // 10. Admin — publicar WOD
  document.getElementById('btn-publish-wod')
    .addEventListener('click', () => handlers.publishWOD());

  // 11. Admin — publicar PDF
  document.getElementById('btn-publish-pdf')
    .addEventListener('click', () => handlers.publishPDF());

  // 12. CTA rutinas → ir a contacto
  document.getElementById('cta-ir-contacto').addEventListener('click', () => {
    ui.showTab('contacto', document.querySelector('.sb-item[data-tab="contacto"]'));
  });
}

document.addEventListener('DOMContentLoaded', init);


/* ============================================================
   DEV TOOLS — Solo para desarrollo local.
   Uso desde la consola del navegador:
     devTools.reset()    → borra localStorage y recarga
     devTools.inspect()  → muestra el state actual en consola
   No llamar en producción.
   ============================================================ */
const devTools = {

  /** Limpia localStorage y recarga la app al estado seed. */
  reset() {
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
    console.info('JM App: localStorage limpiado. Recargando...');
    window.location.reload();
  },

  /** Imprime el state actual en consola. */
  inspect() {
    console.log('── JM App State ──');
    console.log('wod:',         structuredClone(state.wod));
    console.log('archive:',     structuredClone(state.archive));
    console.log('dynamicPdfs:', structuredClone(state.dynamicPdfs));
  },
};
