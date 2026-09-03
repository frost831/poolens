// SplashLens app.js — field intelligence UI logic

// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
const S = {
  tab: 'errors',
  brand: null,
  category: null,
  shape: null,
  slamType: null,
  clType: 'opening',
  checklists: { opening: {}, closing: {}, weekly: {}, monthly: {} },
  filterType: 'sand',
  pool: null,
  poolView: 'list',
};

const LANGUAGE_STORAGE_KEY = 'splashlens_language_profile';
const LANGUAGE_MODE_SESSION_KEY = 'splashlens-language-mode-tracked';
const MARKET_INTEREST_SESSION_KEY = 'splashlens-market-interest-tracked';
const LANGUAGE_OPTIONS = ['en', 'es'];
const LANGUAGE_LABELS = { en: 'English', es: 'Español' };
const LOCALIZED_HEAD = {
  en: {
    title: 'SplashLens - Pool Service Field Reference and PartSnap',
    description: 'SplashLens is a free-to-start field reference app for pool, spa, hot tub, and swim spa service techs with PartSnap part identification assistance, Connected Pool Network troubleshooting, robot cleaner references, Balboa, Gecko, Waterway NEO, swim current, GFCI, sanitizer, pool equipment codes, dosing calculators, voice notes, checklists, and route tools.',
  },
  es: {
    title: 'SplashLens - Referencia de campo para piscinas y PartSnap',
    description: 'SplashLens es una app gratuita para empezar, para técnicos de piscinas, spas y swim spas con PartSnap, asistencia para identificar piezas, rutas de prueba, códigos de equipo, calculadoras de dosis, notas de voz, Facility Assist e historial de trabajo guardado.',
  },
};
const LOCALIZED_TEXT = {
  es: {
    'Preferred language': 'Idioma preferido',
    'Choose your front door': 'Elige tu entrada',
    'Who are you today?': '¿Qué rol tienes hoy?',
    'SplashLens keeps every tool available. This just chooses the first workflow you see.': 'SplashLens mantiene todas las herramientas disponibles. Esto solo decide el primer flujo que ves.',
    'Language': 'Idioma',
    'First result style': 'Estilo del primer resultado',
    'Numbered steps': 'Pasos numerados',
    'Visual proof': 'Prueba visual',
    'Compact': 'Compacto',
    'Service Tech': 'Técnico de servicio',
    'PartSnap, codes, route notes, dosing, and proof packets first.': 'PartSnap, códigos, notas de ruta, dosis y paquetes de prueba primero.',
    'Facility / CPO': 'Instalación / CPO',
    'Daily checks, contamination response, basic proof, and support packets.': 'Revisiones diarias, respuesta a contaminación, prueba básica y paquetes de soporte.',
    'Counter / Distributor': 'Mostrador / Distribuidor',
    'Part, model, and vendor packet workflows without CRM clutter.': 'Flujos para pieza, modelo y proveedor sin ruido de CRM.',
    'Trainer': 'Instructor',
    'Apprentice prompts, CPO scenarios, and proof-first field lessons.': 'Guías para aprendices, escenarios CPO y lecciones de campo con prueba primero.',
    'Homeowner': 'Propietario',
    'Plain-language notes, volume, dosing basics, and when to call a pro.': 'Notas simples, volumen, dosis básicas y cuándo llamar a un profesional.',
    'Facility Assist': 'Asistente de instalaciones',
    'What is going on?': '¿Qué está pasando?',
    'Pick the situation, gather proof, and end with either Resolved - logged or Escalate - send packet.': 'Elige la situación, junta la prueba y termina con Resuelto - registrado o Escalar - enviar paquete.',
    'All tools': 'Todas las herramientas',
    'Switch mode': 'Cambiar modo',
    'QR stickers': 'Etiquetas QR',
    'Daily pool check': 'Revisión diaria de piscina',
    'Readings, clarity, equipment sound, and required log proof.': 'Lecturas, claridad, sonido del equipo y prueba del registro requerido.',
    'Dose the pool': 'Dosificar la piscina',
    'Volume, current reading, target, product label, and retest note.': 'Volumen, lectura actual, objetivo, etiqueta del producto y nota de nueva prueba.',
    'Contamination event': 'Evento de contaminación',
    'Close access, document time/type, follow approved standard, reopen checklist.': 'Cerrar acceso, documentar hora/tipo, seguir el estándar aprobado y lista para reabrir.',
    'Equipment acting up': 'Equipo con problema',
    'Safe visible checks only: water level, baskets, breaker state, alarms, labels.': 'Solo revisiones visibles y seguras: nivel de agua, canastas, breaker/GFCI, alarmas y etiquetas.',
    'Find manual / what is this?': 'Buscar manual / ¿qué es esto?',
    'Capture brand, model, code, label, and equipment proof before calling.': 'Captura marca, modelo, código, etiqueta y prueba del equipo antes de llamar.',
    'I need help now': 'Necesito ayuda ahora',
    'Build the support packet, then call/share using the configured route.': 'Crea el paquete de soporte y luego llama o comparte por la ruta configurada.',
    'Proof-first pool work.': 'Trabajo de piscina con prueba primero.',
    'Identify the part, capture the stop, build the packet, and get back to the next job without rewriting everything after dinner.': 'Identifica la pieza, documenta la visita, crea el paquete y vuelve al siguiente trabajo sin reescribir todo al final del día.',
    'Try PartSnap': 'Probar PartSnap',
    'Open Field Tools': 'Abrir herramientas',
    'Look Up Codes': 'Buscar códigos',
    'ID part': 'ID pieza',
    'Save proof': 'Guardar prueba',
    'Smart pad': 'Sistema inteligente',
    'Voice note': 'Nota de voz',
    'photo + proof': 'foto + prueba',
    'photo + label': 'foto + etiqueta',
    'passport': 'pasaporte',
    'CPO path': 'ruta CPO',
    'robots + controls': 'robots + controles',
    'talk + save': 'hablar + guardar',
    'display / plate': 'pantalla / placa',
    'brand / symptom': 'marca / síntoma',
    'pool math': 'cálculo piscina',
    'Possible part families, missing proof, repeat issue watch, and clean send-out.': 'Familias posibles de pieza, prueba faltante, aviso de problema repetido y envio limpio.',
    'Photos, readings, notes, summaries, and saved stop history.': 'Fotos, lecturas, notas, resúmenes e historial guardado de la visita.',
    'Bigger taps, shorter paths, voice notes, and fewer after-hours rewrites.': 'Botones grandes, rutas cortas, notas de voz y menos reescritura fuera de horario.',
    'PartSnap result packet': 'Paquete de resultado PartSnap',
    'Review ready': 'Listo para revisar',
    'Possible part family': 'Familia posible de pieza',
    'Pump lid / basket / O-ring path. Needs model plate and molded number before ordering.': 'Ruta de tapa / canasta / O-ring de bomba. Necesita placa de modelo y número moldeado antes de ordenar.',
    'Visible proof': 'Prueba visible',
    'Part photo, housing shape, label close-up.': 'Foto de pieza, forma de carcasa y acercamiento de etiqueta.',
    'Missing proof': 'Prueba faltante',
    'Model plate, size, vendor cross-check.': 'Placa de modelo, tamaño y verificación con proveedor.',
    'Senior-tech packet': 'Paquete para técnico senior',
    'Copy one clean handoff with symptoms, proof, missing evidence, and what to verify before selling or replacing.': 'Copia un traspaso limpio con síntomas, prueba, evidencia faltante y qué verificar antes de vender o reemplazar.',
    'Saved Job History': 'Historial de trabajo guardado',
    'Save the stop so next visit has the equipment context, not a mystery photo buried in texts.': 'Guarda la visita para que la próxima tenga contexto del equipo, no una foto perdida en mensajes.',
    'Identify the part.': 'Identifica la pieza.',
    'Use PartSnap for seals, lids, grids, cells, valves, robot parts, lights, boards, sensors, and the stuff nobody wants to guess at.': 'Usa PartSnap para sellos, tapas, grids, celdas, válvulas, piezas de robot, luces, tarjetas, sensores y lo que nadie quiere adivinar.',
    'Verify the proof.': 'Verifica la prueba.',
    'SplashLens keeps the language cautious: possible matches, missing proof, and manual/vendor/manufacturer verification before ordering.': 'SplashLens mantiene lenguaje cuidadoso: coincidencias posibles, prueba faltante y verificación con manual, proveedor o fabricante antes de ordenar.',
    'Finish the stop.': 'Termina la visita.',
    'Use dosing math, notes, Route Brain, training cards, and customer-safe summaries to leave cleaner and faster.': 'Usa cálculo de dosis, notas, ruta, tarjetas de entrenamiento y resúmenes seguros para el cliente para salir más limpio y más rápido.',
    'PartSnap first - proof before ordering': 'PartSnap primero - prueba antes de ordenar',
    'Find the part. Prove the path.': 'Encuentra la pieza. Prueba el camino.',
    'Photo it, verify it, packet it, then move.': 'Fotografía, verifica, crea el paquete y sigue.',
    'ID Part': 'ID pieza',
    'Scan Code': 'Escanear código',
    'Search': 'Buscar',
    'Dose': 'Dosis',
    'Note': 'Nota',
    'Manual lookup': 'Búsqueda manual',
    'Save Packet': 'Guardar paquete',
    'Report': 'Reporte',
    'Offline:': 'Sin señal:',
    'Online:': 'Con conexión:',
    'manual lookup, calculators, guides.': 'búsqueda manual, calculadoras y guías.',
    'AI scan, PartSnap, voice.': 'escaneo IA, PartSnap y voz.',
    'PartSnap flow': 'Flujo PartSnap',
    '1. Part': '1. Pieza',
    '2. Label': '2. Etiqueta',
    '3. Proof': '3. Prueba',
    '4. Risk': '4. Riesgo',
    '5. Packet': '5. Paquete',
    'close + lit': 'cerca + luz',
    'model plate': 'placa modelo',
    'marking / size': 'marca / tamaño',
    'callback flag': 'riesgo regreso',
    'senior / vendor': 'senior / proveedor',
    'PartSnap + Connected Pool Network': 'PartSnap + Red de piscina conectada',
    'Photo, label, proof checklist, senior/vendor packet.': 'Foto, etiqueta, lista de prueba y paquete para senior/proveedor.',
    'Job proof tools': 'Herramientas de prueba de trabajo',
    'Turn this stop into saved job history.': 'Convierte esta visita en historial de trabajo guardado.',
    'ERRORS': 'CODIGOS',
    'STRIP': 'TIRA',
    'LOOKUP': 'BUSCAR',
    'CHEM': 'QUIM',
    'AI SCANNER READY': 'ESCANER IA LISTO',
    'AIM AT ERROR CODE DISPLAY - TAP CAPTURE': 'APUNTA AL CODIGO - TOCA CAPTURAR',
    'LIGHT': 'LUZ',
    'Type error code (e.g. E05, ERR 3, LO, FLO)': 'Escribe codigo (ej. E05, ERR 3, LO, FLO)',
    'Search chemical (e.g. baking soda, cal-hypo, pH up...)': 'Buscar quimico (ej. bicarbonato, cal-hypo, subir pH...)',
    'Codes': 'Códigos',
    'Dosing': 'Dosis',
    'Volume': 'Volumen',
    'Filters': 'Filtros',
    'Guide': 'Guía',
    'Pools': 'Piscinas',
    'Route': 'Ruta',
    'Scan': 'Escanear',
    'Did this help?': '¿Te ayudó?',
    'Yes': 'Sí',
    'Close': 'Cerrar',
    'Wrong': 'Incorrecto',
    'Missing info': 'Falta info',
    'Share Packet': 'Compartir paquete',
    'Save Proof': 'Guardar prueba',
    'Apprentice Mode': 'Modo aprendiz',
    'Copy Text': 'Copiar texto',
    'Second Proof Photo': 'Segunda foto de prueba',
    'Scan Another Part or Label': 'Escanear otra pieza o etiqueta',
    'Use Now': 'Usar ahora',
    'Save Proof Passport': 'Guardar pasaporte de prueba',
    'Show Answer Key': 'Mostrar respuestas',
    'Add Proof': 'Agregar prueba',
    'Your email': 'Tu email',
    'What do you know?': '¿Qué sabes?',
    'Submit Review Ticket': 'Enviar ticket de revisión',
    'Calculate Doses →': 'Calcular dosis →',
    'Scan Again': 'Escanear otra vez',
    'Open App': 'Abrir app',
  },
};
const LOCALIZED_ATTRS = {
  es: {
    'Preferred language': 'Idioma preferido',
    'Choose SplashLens mode': 'Elige modo de SplashLens',
    'SplashLens introduction': 'Introducción a SplashLens',
    'Choose a SplashLens workflow': 'Elige un flujo de SplashLens',
    'SplashLens product preview': 'Vista del producto SplashLens',
    'Fast field workflow': 'Flujo rápido de campo',
    'PartSnap parts identification': 'Identificación de piezas PartSnap',
    'New Tech Radar and Connected Pool Network': 'Radar de tecnología nueva y red de piscina conectada',
    'Type error code (e.g. E05, ERR 3, LO, FLO)': 'Escribe codigo (ej. E05, ERR 3, LO, FLO)',
    'Search chemical (e.g. baking soda, cal-hypo, pH up...)': 'Buscar quimico (ej. bicarbonato, cal-hypo, subir pH...)',
  },
};
let localizationObserver = null;
let localizationApplying = false;
const localizationTextSources = new WeakMap();
const FIELD_FEEDBACK_KEY = 'splashlens-field-feedback-state';
const FIELD_FEEDBACK_COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000;
const FIELD_FEEDBACK_AFTER_SUBMIT_MS = 30 * 24 * 60 * 60 * 1000;
const STORE_REVIEW_KEY = 'splashlens-store-review-state';
const STORE_REVIEW_COOLDOWN_MS = 45 * 24 * 60 * 60 * 1000;
const SPLASHLENS_IOS_REVIEW_URL = 'https://apps.apple.com/us/app/splashlens/id6763644905?action=write-review';
const SPLASHLENS_PLAY_REVIEW_URL = 'https://play.google.com/store/apps/details?id=com.splashlens.fieldtools';
const SPLASHLENS_ROLE_KEY = 'sl_role';
const WORKFLOW_STYLE_KEY = 'splashlens-workflow-style';
const FACILITY_PACKET_KEY = 'splashlens-facility-packets';
const ACTIVATION_COMPLETED_KEY = 'splashlens-activation-completed-v1';
const FIELD_CHALLENGE_CONTEXT_KEY = 'splashlens-field-challenge-context-v1';
const FIELD_CHALLENGE_STARTED_KEY = 'splashlens-field-challenge-started-v1';
const FIELD_CHALLENGE_COMPLETED_KEY = 'splashlens-field-challenge-completed-v1';
const FIELD_REFERRAL_PROMPT_KEY = 'splashlens-field-referral-prompt-v1';
const FIELD_IDENTITY_PROMPT_KEY = 'splashlens-field-identity-prompt-v1';
const FIELD_SAVE_ACCOUNT_KEY = 'splashlens-free-save-profile-v1';
const FREE_PROFILE_TOKEN_KEY = 'splashlens-free-profile-token-v1';
const SPLASHLENS_ROLES = ['tech', 'facility', 'counter', 'trainer'];
let facilitySessionMode = '';
let facilityForcedMode = false;
let activeFacilityConfig = null;
let activeFacilityId = '';
let activeFacilityEquipmentId = '';
const FIELD_FEEDBACK_ACTIONS = new Set([
  'ai_scan_started',
  'manual_code_search',
  'partsnap_result',
  'partsnap_packet_copied',
  'partsnap_share_used',
  'partsnap_saved_to_pool',
  'partsnap_mystery_submitted',
  'partsnap_apprentice_started',
  'partsnap_second_proof_requested',
  'route_brain_saved_to_pool',
  'service_report_saved',
  'proof_ready_report_saved',
  'manual_equipment_saved',
  'pool_crm_packet_copied',
  'pool_crm_packet_shared',
  'pool_csv_downloaded',
  'pool_packet_printed',
]);
const STORE_REVIEW_SUCCESS_EVENTS = new Set([
  'partsnap_saved_to_pool',
  'partsnap_packet_copied',
  'partsnap_share_used',
  'route_brain_saved_to_pool',
  'service_report_saved',
  'proof_ready_report_saved',
  'pool_crm_packet_copied',
  'pool_crm_packet_shared',
  'pool_csv_downloaded',
  'pool_packet_printed',
]);
const ACTIVATION_EVENT_TYPES = new Map([
  ['manual_code_search', 'manual_lookup'],
  ['partsnap_result', 'partsnap_result'],
  ['partsnap_packet_copied', 'partsnap_copy'],
  ['partsnap_share_used', 'partsnap_share'],
  ['partsnap_saved_to_pool', 'partsnap_save'],
  ['service_report_saved', 'proof_report_save'],
  ['proof_ready_report_saved', 'proof_report_save'],
  ['facility_workflow_action_selected', 'facility_assist_action'],
  ['facility_workflow_completed', 'facility_assist_completed'],
]);

function normalizeLanguage(value) {
  const code = String(value || 'en');
  return LANGUAGE_OPTIONS.find((lang) => code === lang || code.toLowerCase().startsWith(lang.toLowerCase())) || 'en';
}

function getLanguageProfile() {
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (stored) return { preferredLanguage: 'en', locale: 'en', nativeLanguage: 'en', autoTranslate: false, ...JSON.parse(stored) };
  } catch {}
  const preferredLanguage = normalizeLanguage((navigator.languages && navigator.languages[0]) || navigator.language || 'en');
  return {
    nativeLanguage: preferredLanguage,
    preferredLanguage,
    locale: preferredLanguage,
    autoTranslate: preferredLanguage !== 'en',
    productKey: 'splashlens',
  };
}

function setPreferredLanguage(language) {
  const preferredLanguage = normalizeLanguage(language);
  const profile = {
    ...getLanguageProfile(),
    nativeLanguage: preferredLanguage,
    preferredLanguage,
    locale: preferredLanguage,
    autoTranslate: preferredLanguage !== 'en',
    productKey: 'splashlens',
    updatedAt: new Date().toISOString(),
  };
  localStorage.setItem(LANGUAGE_STORAGE_KEY, JSON.stringify(profile));
  return profile;
}

function withLanguageMetadata(payload = {}) {
  const profile = getLanguageProfile();
  return {
    ...payload,
    source_language: payload.source_language || profile.preferredLanguage,
    preferred_language: payload.preferred_language || profile.preferredLanguage,
    locale: payload.locale || profile.locale,
    language_profile: payload.language_profile || profile,
  };
}

function getLanguageHeaders() {
  const profile = getLanguageProfile();
  return {
    'X-BZM-Language': profile.preferredLanguage,
    'X-BZM-Locale': profile.locale,
    'X-BZM-Auto-Translate': profile.autoTranslate ? 'true' : 'false',
  };
}

function initLanguageLayer() {
  const params = new URLSearchParams(window.location.search);
  if (params.has('lang')) setPreferredLanguage(params.get('lang'));
  const select = document.getElementById('language-select');
  if (select) {
    select.value = getLanguageProfile().preferredLanguage;
    select.addEventListener('change', () => {
      const profile = setPreferredLanguage(select.value);
      applySplashLensLocalization();
      trackSplashLensEvent('language_preference_set', { preferred_language: profile.preferredLanguage, locale: profile.locale });
    });
  }
  refreshFirstUsePreferenceButtons();
  applySplashLensLocalization();
  initLocalizationObserver();
  trackLanguageModeOpen(params);
  trackMarketInterestOpen(params);
}

function trackLanguageModeOpen(params = new URLSearchParams(window.location.search)) {
  const profile = getLanguageProfile();
  const language = profile.preferredLanguage || 'en';
  const key = `${language}:${params.get('lang') || ''}:${window.location.pathname}`;
  try {
    if (sessionStorage.getItem(LANGUAGE_MODE_SESSION_KEY) === key) return;
    sessionStorage.setItem(LANGUAGE_MODE_SESSION_KEY, key);
  } catch {}
  trackSplashLensEvent('language_mode_open', {
    preferred_language: language,
    locale: profile.locale || language,
    requested_language: params.get('lang') || '',
    source: params.get('utm_source') || params.get('source') || 'app',
    spanish_field_mode: language === 'es',
  });
}

function trackMarketInterestOpen(params = new URLSearchParams(window.location.search)) {
  const market = String(params.get('market') || params.get('country') || '').trim().toLowerCase();
  if (!market) return;
  const normalizedMarket = market === 'canada' ? 'ca' : market;
  const key = `${normalizedMarket}:${window.location.pathname}`;
  try {
    if (sessionStorage.getItem(MARKET_INTEREST_SESSION_KEY) === key) return;
    sessionStorage.setItem(MARKET_INTEREST_SESSION_KEY, key);
  } catch {}
  trackSplashLensEvent('market_interest_open', {
    market: normalizedMarket.slice(0, 24),
    requested_language: params.get('lang') || '',
    source: params.get('utm_source') || params.get('source') || 'app',
  });
}

function initLocalizationObserver() {
  if (localizationObserver || !document.body) return;
  let timer = 0;
  localizationObserver = new MutationObserver((mutations) => {
    if (localizationApplying) return;
    if (!mutations.some((m) => m.addedNodes && m.addedNodes.length)) return;
    clearTimeout(timer);
    timer = setTimeout(() => applySplashLensLocalization(), 40);
  });
  localizationObserver.observe(document.body, { childList: true, subtree: true });
}

function translateUiText(value, language = getLanguageProfile().preferredLanguage) {
  if (!value || language === 'en') return value || '';
  const dictionary = LOCALIZED_TEXT[language] || {};
  const compact = String(value).replace(/\s+/g, ' ').trim();
  return dictionary[compact] || value;
}

function translateUiAttr(value, language = getLanguageProfile().preferredLanguage) {
  if (!value || language === 'en') return value || '';
  const dictionary = LOCALIZED_ATTRS[language] || {};
  const compact = String(value).replace(/\s+/g, ' ').trim();
  return dictionary[compact] || translateUiText(compact, language) || value;
}

function walkTextNodes(root, callback) {
  if (!root) return;
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
      const parent = node.parentElement;
      if (!parent || ['SCRIPT', 'STYLE', 'TEXTAREA', 'OPTION'].includes(parent.tagName)) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(callback);
}

function applySplashLensLocalization() {
  const profile = getLanguageProfile();
  const language = profile.preferredLanguage || 'en';
  localizationApplying = true;
  try {
    document.documentElement.lang = language === 'es' ? 'es' : 'en';
    const spanishStrip = document.getElementById('spanish-field-strip');
    if (spanishStrip) {
      const active = language === 'es';
      spanishStrip.classList.toggle('active', active);
      spanishStrip.setAttribute('aria-hidden', active ? 'false' : 'true');
    }
    const head = LOCALIZED_HEAD[language] || LOCALIZED_HEAD.en;
    if (head?.title) document.title = head.title;
    const description = document.querySelector('meta[name="description"]');
    if (description && head?.description) description.setAttribute('content', head.description);
    walkTextNodes(document.body, (node) => {
      if (!localizationTextSources.has(node)) localizationTextSources.set(node, node.nodeValue);
      const sourceValue = localizationTextSources.get(node);
      if (language === 'en') {
        node.nodeValue = sourceValue;
        return;
      }
      const original = sourceValue.replace(/\s+/g, ' ').trim();
      const translated = translateUiText(original, language);
      if (translated && translated !== original) node.nodeValue = sourceValue.replace(original, translated);
    });
    document.querySelectorAll('[placeholder]').forEach((el) => {
      if (!el.dataset.slI18nPlaceholder) el.dataset.slI18nPlaceholder = el.getAttribute('placeholder') || '';
      const sourceValue = el.dataset.slI18nPlaceholder;
      const translated = language === 'en' ? sourceValue : translateUiAttr(sourceValue, language);
      if (translated) el.setAttribute('placeholder', translated);
    });
    document.querySelectorAll('[aria-label]').forEach((el) => {
      if (!el.dataset.slI18nAriaLabel) el.dataset.slI18nAriaLabel = el.getAttribute('aria-label') || '';
      const sourceValue = el.dataset.slI18nAriaLabel;
      const translated = language === 'en' ? sourceValue : translateUiAttr(sourceValue, language);
      if (translated) el.setAttribute('aria-label', translated);
    });
    document.querySelectorAll('[title]').forEach((el) => {
      if (!el.dataset.slI18nTitle) el.dataset.slI18nTitle = el.getAttribute('title') || '';
      const sourceValue = el.dataset.slI18nTitle;
      const translated = language === 'en' ? sourceValue : translateUiAttr(sourceValue, language);
      if (translated) el.setAttribute('title', translated);
    });
    document.querySelectorAll('[data-pref-language]').forEach((btn) => {
      const label = LANGUAGE_LABELS[btn.dataset.prefLanguage];
      if (label) btn.textContent = label;
    });
  } finally {
    localizationApplying = false;
  }
}

function getWorkflowStyle() {
  try { return localStorage.getItem(WORKFLOW_STYLE_KEY) || 'steps'; }
  catch { return 'steps'; }
}

function setWorkflowStyle(style) {
  const clean = ['steps', 'visual', 'compact'].includes(String(style || '')) ? style : 'steps';
  try { localStorage.setItem(WORKFLOW_STYLE_KEY, clean); } catch {}
  refreshFirstUsePreferenceButtons();
  trackSplashLensEvent('workflow_style_selected', { style: clean, role: getSplashLensRole() });
}

function chooseRoleLanguage(language) {
  const profile = setPreferredLanguage(language);
  const select = document.getElementById('language-select');
  if (select) select.value = profile.preferredLanguage;
  refreshFirstUsePreferenceButtons();
  applySplashLensLocalization();
  trackSplashLensEvent('language_preference_set', { preferred_language: profile.preferredLanguage, locale: profile.locale, source: 'first_use_role_picker' });
}

function refreshFirstUsePreferenceButtons() {
  const language = getLanguageProfile().preferredLanguage;
  const style = getWorkflowStyle();
  document.querySelectorAll('[data-pref-language]').forEach((btn) => btn.classList.toggle('active', btn.dataset.prefLanguage === language));
  document.querySelectorAll('[data-pref-style]').forEach((btn) => btn.classList.toggle('active', btn.dataset.prefStyle === style));
}

const CL_MAP = {
  opening: { data: () => window.OPENING_CHECKLIST, key: 'poolens-cl-opening', label: 'Opening Checklist', freq: 'Season Progress' },
  closing: { data: () => window.CLOSING_CHECKLIST, key: 'poolens-cl-closing', label: 'Closing Checklist', freq: 'Season Progress' },
  weekly:  { data: () => window.WEEKLY_CHECKLIST,  key: 'poolens-cl-weekly',  label: 'Weekly Checklist',  freq: 'This Week'       },
  monthly: { data: () => window.MONTHLY_CHECKLIST, key: 'poolens-cl-monthly', label: 'Monthly Checklist', freq: 'This Month'      },
};

const PRODUCT_LINE_HELPER = {
  generic: {
    label: 'Generic / active ingredient',
    notes: {
      fc: ['Liquid chlorine 10-12.5% is the cleanest default; cal-hypo is fine when calcium can rise.', 'Generic equivalent: sodium hypochlorite or calcium hypochlorite.'],
      ph_lower: ['Use muriatic acid 31.45% or dry acid. Verify strength before dosing.', 'Generic equivalent: hydrochloric acid or sodium bisulfate.'],
      ph_raise: ['Use soda ash for pH up. Do not confuse it with baking soda.', 'Generic equivalent: sodium carbonate.'],
      ta: ['Use alkalinity increaser or baking soda.', 'Generic equivalent: sodium bicarbonate.'],
      ch: ['Use calcium hardness increaser. Pre-dissolve carefully because it gets hot.', 'Generic equivalent: calcium chloride.'],
      cya: ['Use stabilizer/conditioner in a sock or feeder path.', 'Generic equivalent: cyanuric acid.']
    }
  },
  hasa: {
    label: 'HASA',
    notes: {
      fc: ['Likely truck match: HASA liquid chlorine / Sani-Clor. Verify % on the label.', 'Generic equivalent: sodium hypochlorite.'],
      ph_lower: ['Likely truck match: HASA muriatic acid if stocked. Verify strength.', 'Generic equivalent: hydrochloric acid.'],
      default: ['HASA is strongest for sanitizer/acid basics. Use the generic active ingredient for balance products if that line is not on the truck.']
    }
  },
  orenda: {
    label: 'Orenda',
    notes: {
      fc: ['Orenda is not the primary chlorine line. Use your sanitizer, then use Orenda for LSI and specialty support.', 'Support products may include enzyme, phosphate, scale, and metal programs.'],
      ph_lower: ['Use your acid product, then check LSI/CSI impact. Orenda guidance is very LSI-driven.', 'Generic equivalent: muriatic acid or dry acid.'],
      default: ['Orenda is best treated as a water-balance/specialty layer, not a full primary chemical shelf. Use generic equivalents for the actual dose.']
    }
  },
  bioguard: {
    label: 'BioGuard',
    notes: {
      fc: ['Likely matches: Smart Shock, Burnout, or liquid/solid sanitizer depending on dealer line.', 'Check active ingredient because CYA and calcium side effects change.'],
      ph_lower: ['Likely match: Lo N Slo or acid product.', 'Generic equivalent: sodium bisulfate or muriatic acid.'],
      ph_raise: ['Likely match: Balance Pak 200.', 'Generic equivalent: sodium carbonate.'],
      ta: ['Likely match: Balance Pak 100.', 'Generic equivalent: sodium bicarbonate.'],
      ch: ['Likely match: Balance Pak 300.', 'Generic equivalent: calcium chloride.'],
      cya: ['Likely match: Stabilizer 100.', 'Generic equivalent: cyanuric acid.']
    }
  },
  natural: {
    label: 'Natural Chemistry',
    notes: {
      default: ['Natural Chemistry is usually enzymes, phosphate, metal, and scale support. Use generic equivalents for primary balance dosing.', 'Do not substitute specialty products for sanitizer, alkalinity, calcium, or stabilizer unless the label says so.']
    }
  },
  leslie: {
    label: "Leslie's / private label",
    notes: {
      fc: ['Likely matches: liquid chlorine, Power Powder/cal-hypo, or Chlor Brite/dichlor.', 'Check active ingredient to avoid unexpected CYA or calcium rise.'],
      ph_lower: ['Likely matches: muriatic acid or dry acid.', 'Generic equivalent: hydrochloric acid or sodium bisulfate.'],
      ph_raise: ['Likely match: Soda Ash / pH Up.', 'Generic equivalent: sodium carbonate.'],
      ta: ['Likely match: Alkalinity Up.', 'Generic equivalent: sodium bicarbonate.'],
      ch: ['Likely match: Hardness Plus.', 'Generic equivalent: calcium chloride.'],
      cya: ['Likely match: Conditioner/Stabilizer.', 'Generic equivalent: cyanuric acid.']
    }
  },
  poolife: {
    label: 'Poolife',
    notes: {
      fc: ['Likely matches: TurboShock/cal-hypo or NST/trichlor depending on pool need.', 'Check side effects: cal-hypo raises CH; stabilized chlorine raises CYA.'],
      ph_lower: ['Likely match: pH Minus.', 'Generic equivalent: sodium bisulfate or acid.'],
      ph_raise: ['Likely match: pH Plus.', 'Generic equivalent: sodium carbonate.'],
      ta: ['Likely match: Alkalinity Plus.', 'Generic equivalent: sodium bicarbonate.'],
      ch: ['Likely match: Calcium Plus.', 'Generic equivalent: calcium chloride.'],
      cya: ['Likely match: Stabilizer.', 'Generic equivalent: cyanuric acid.']
    }
  },
  jacks: {
    label: "Jack's Magic",
    notes: {
      default: ["Jack's Magic is a stain/metal specialty line. Use it for stain and metal context, not as the primary dose line.", 'Use generic active ingredients for sanitizer, pH, TA, CH, and CYA.']
    }
  }
};

const DOSE_NEED_LABELS = {
  fc: 'Raise free chlorine',
  ph_lower: 'Lower pH',
  ph_raise: 'Raise pH',
  ta: 'Raise alkalinity',
  ch: 'Raise calcium hardness',
  cya: 'Raise stabilizer'
};

// ═══════════════════════════════════════════
// BOOT
// ═══════════════════════════════════════════
document.addEventListener('DOMContentLoaded', () => {
  initLanguageLayer();
  initMarketingGate();
  initSplashLensPersonaMode();
  captureScanEntitlementFromUrl();
  initSplashLensAttribution();
  initInstallTracking();
  trackStoreShellOpen();
  initErrors();
  initDosing();
  initVolume();
  initSandFilter();
  initGuide();
  initReport();
  loadPersistedVolume();
  initPools();
  initRoute();
  checkOfflineStatus();
  initDeepLink();
  initProductIntelligenceTracking();
  trackReferralLandingOpen();
  trackSplashLensAppOpen();
});

// ═══════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════
function showTab(name) {
  trackProductTabChange(name);
  if (PRODUCT_INTELLIGENCE.startedAt) {
    localStorage.setItem('splashlens-last-field-tab', name);
    localStorage.setItem('splashlens-last-field-tab-at', new Date().toISOString());
  }
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  const panel = document.getElementById(`tab-${name}`);
  const btn   = document.getElementById(`nav-${name}`);
  if (panel) panel.classList.add('active');
  if (btn)   btn.classList.add('active');
  if (S.tab === 'scan' && name !== 'scan') stopCamera();
  S.tab = name;
  window.scrollTo(0, 0);
  if (name === 'route')  renderRoute();
  if (name === 'scan')   initScanTab();
  if (name === 'dosing') renderSlamBanner();
  window.SplashLensFieldSignals?.onTabShown(name);
}

function initMarketingGate() {
  const params = new URLSearchParams(window.location.search);
  const hasToolIntent = params.has('tab') || params.has('activate_scan') || params.has('token') || params.has('session_id');
  if (hasToolIntent || window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    revealSplashLensApp();
  }
}

function revealSplashLensApp() {
  const gate = document.getElementById('marketing-gate');
  const shell = document.getElementById('app-shell');
  if (gate) gate.classList.add('hidden');
  if (shell) shell.classList.remove('marketing-active');
}

function enterSplashLensApp(tab = 'errors', mode) {
  revealSplashLensApp();
  trackSplashLensEvent('marketing_gate_entered', { target_tab: tab, target_mode: mode || '' });
  if (tab === 'facility' || mode === 'facility') {
    setSplashLensRole('facility', { persist: false, forced: true });
    return;
  }
  showTab(tab);
  if (tab === 'scan' && mode) {
    setTimeout(() => setScanMode(mode), 80);
  }
  if (tab === 'errors' && mode === 'search') {
    setTimeout(() => {
      const el = document.getElementById('error-search');
      if (el) {
        el.focus();
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 120);
  }
}

function initDeepLink() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get('tab');
  const mode = params.get('mode');
  const workflow = params.get('workflow');
  const checklist = params.get('checklist');
  const allowed = new Set(['errors', 'dosing', 'report', 'guide', 'pools', 'scan', 'volume', 'sand', 'route']);
  if (mode === 'facility') {
    setSplashLensRole('facility', { persist: false, forced: true });
    return;
  }
  if (mode === 'tech') {
    setSplashLensRole('tech', { persist: false, forced: true });
  }
  if (tab && allowed.has(tab)) {
    showTab(tab);
    if (tab === 'scan' && mode) setTimeout(() => setScanMode(mode), 120);
    if (tab === 'errors' && params.has('search')) {
      setTimeout(() => focusErrorSearch(params.get('search') || ''), 120);
    }
    if (tab === 'report' && workflow === 'closing') {
      setTimeout(() => startServiceProofWorkflow('closing'), 120);
    }
    if (tab === 'guide' && checklist === 'closing') {
      setTimeout(() => switchClType('closing'), 120);
    }
  }
}

function getFacilityDeepLinkParts() {
  const match = window.location.pathname.match(/^\/f\/([^/]+)(?:\/([^/]+))?/);
  if (!match) return null;
  return {
    facilityId: decodeURIComponent(match[1] || ''),
    equipmentId: decodeURIComponent(match[2] || ''),
  };
}

function initSplashLensPersonaMode() {
  const params = new URLSearchParams(window.location.search);
  const qr = getFacilityDeepLinkParts();
  if (qr?.facilityId) {
    activeFacilityId = qr.facilityId;
    activeFacilityEquipmentId = qr.equipmentId || '';
    loadFacilityConfig(activeFacilityId, activeFacilityEquipmentId);
    setSplashLensRole('facility', { persist: false, forced: true });
    return;
  }

  const mode = params.get('mode');
  const cleanMode = normalizeSplashLensRole(mode);
  if (cleanMode) {
    setSplashLensRole(cleanMode, { persist: false, forced: true });
    return;
  }

  if (params.get('tab') === 'scan' && (params.get('mode') === 'parts' || params.get('activate_scan') === 'parts')) {
    revealSplashLensApp();
    showTab('scan');
    setTimeout(() => {
      setScanMode('parts');
      showRoleNudge('partsnap_direct');
    }, 120);
    trackSplashLensEvent('partsnap_direct_entry', { role: '', nonblocking_role_prompt: true });
    return;
  }

  const hasDirectToolIntent = (
    params.has('tab') ||
    params.has('activate_scan') ||
    params.has('token') ||
    params.has('session_id') ||
    params.has('workflow') ||
    params.has('checklist')
  );
  if (hasDirectToolIntent) {
    revealSplashLensApp();
    hideRoleNudge();
    hideRolePicker();
    return;
  }

  const storedRole = localStorage.getItem(SPLASHLENS_ROLE_KEY);
  if (SPLASHLENS_ROLES.includes(storedRole)) {
    setSplashLensRole(storedRole, { persist: false });
    return;
  }
  revealSplashLensApp();
  showTab('errors');
  trackSplashLensEvent('field_home_opened_without_role_gate', {
    default_role: 'tech',
    role_picker_deferred: true,
  });
}

function showRolePicker(manual = false) {
  revealSplashLensApp();
  hideRoleNudge();
  const picker = document.getElementById('role-picker');
  if (!picker) return;
  picker.classList.add('active');
  trackSplashLensEvent(manual ? 'role_picker_opened' : 'role_picker_first_open', {
    current_role: getSplashLensRole(),
    manual: Boolean(manual),
  });
}

function hideRolePicker() {
  const picker = document.getElementById('role-picker');
  if (picker) picker.classList.remove('active');
}

function showRoleNudge(source = 'usage') {
  const nudge = document.getElementById('role-nudge');
  if (!nudge || getSplashLensRole()) return;
  nudge.classList.add('active');
  trackSplashLensEvent('role_nudge_shown', { source });
}

function hideRoleNudge() {
  document.getElementById('role-nudge')?.classList.remove('active');
}

function getSplashLensRole() {
  return facilitySessionMode || localStorage.getItem(SPLASHLENS_ROLE_KEY) || '';
}

function normalizeSplashLensRole(role) {
  const value = String(role || '').toLowerCase().trim();
  if (!value) return '';
  if (value === 'apprentice' || value === 'education' || value === 'teacher') return 'trainer';
  if (value === 'operator' || value === 'cpo') return 'facility';
  if (value === 'distributor' || value === 'vendor' || value === 'counter') return 'counter';
  if (value === 'owner') return 'tech';
  return SPLASHLENS_ROLES.includes(value) ? value : '';
}

function setSplashLensRole(role, options = {}) {
  const cleanRole = normalizeSplashLensRole(role) || 'tech';
  if (options.persist) localStorage.setItem(SPLASHLENS_ROLE_KEY, cleanRole);
  facilitySessionMode = options.persist ? '' : cleanRole;
  facilityForcedMode = Boolean(options.forced);
  hideRolePicker();
  hideRoleNudge();
  revealSplashLensApp();
  document.body.classList.toggle('facility-mode', cleanRole === 'facility');
  document.body.classList.toggle('facility-tools-hidden', cleanRole === 'facility');
  document.body.classList.toggle('trainer-mode', cleanRole === 'trainer');
  document.body.classList.toggle('counter-mode', cleanRole === 'counter');
  if (cleanRole === 'facility') {
    renderFacilityHome();
    trackFacilityEvent('wizard_open', { lane: '', role: cleanRole, forced: facilityForcedMode });
  } else {
    showFacilityTools();
    renderRoleNextAction(cleanRole);
    if (cleanRole === 'trainer') {
      showTab('report');
      setTimeout(() => {
        renderFieldLearningOS('partsnap');
      }, 120);
      trackSplashLensEvent('partsnap_apprentice_started', { source: 'role_picker', role: cleanRole });
    } else if (cleanRole === 'counter') {
      showTab('scan');
      setTimeout(() => {
        setScanMode('parts');
        renderCounterSamplePacket();
      }, 120);
    } else {
      showTab('errors');
    }
  }
  trackSplashLensEvent('role_selected', {
    role: cleanRole,
    persisted: Boolean(options.persist),
    session_override: !options.persist,
    forced: Boolean(options.forced),
    source: options.source || 'role_picker',
    workflow_style: getWorkflowStyle(),
  });
}

const ROLE_NEXT_ACTIONS = {
  tech: {
    kicker: 'Service Tech mode',
    title: 'Start with the thing slowing the stop down.',
    body: 'Pick code lookup or PartSnap first, then turn the result into proof you can send or save.',
    payoff: 'Goal: verified next step in under a minute.',
    actions: [
      ['Look up a code', 'primary', "focusErrorSearch()"],
      ['Identify a part', '', "openLivePartSnap()"],
      ['Save service proof', '', "showTab('report')"],
      ['Calculate dose', '', "showTab('dosing')"],
    ],
  },
  counter: {
    kicker: 'Counter / distributor mode',
    title: 'Prevent the wrong part sale.',
    body: 'Preview the vendor packet, collect missing proof, then hand off cleaner questions to the tech or vendor.',
    payoff: 'Goal: fewer callbacks from incomplete proof.',
    actions: [
      ['Preview packet', 'primary', "showTab('scan');setTimeout(()=>{setScanMode('parts');renderCounterSamplePacket();},80)"],
      ['Identify walk-in part', '', "openLivePartSnap()"],
      ['Copy vendor text', '', "renderCounterSamplePacket()"],
      ['Search family', '', "focusErrorSearch('pump lid')"],
    ],
  },
  trainer: {
    kicker: 'Field Learning OS',
    title: 'Turn real stops into five-minute lessons.',
    body: 'Use PartSnap misses, proof packets, facility incidents, and support questions to teach what to observe, prove, decide, and explain.',
    payoff: 'Goal: coach from the field without pretending to certify or diagnose.',
    actions: [
      ['PartSnap lesson', 'primary', "renderFieldLearningOS('partsnap')"],
      ['Use real part', '', "openLivePartSnap()"],
      ['Facility scenario', '', "renderFieldLearningOS('facility')"],
      ['Proof review', '', "renderFieldLearningOS('proof')"],
    ],
  },
};

function renderRoleNextAction(role = getSplashLensRole()) {
  const panel = document.getElementById('role-next-action');
  if (!panel) return;
  const cfg = ROLE_NEXT_ACTIONS[normalizeSplashLensRole(role || '')];
  if (!cfg) {
    panel.classList.remove('active');
    panel.innerHTML = '';
    return;
  }
  panel.classList.add('active');
  panel.innerHTML = `
    <div class="role-next-grid">
      <div>
        <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">${escHtml(cfg.kicker)}</p>
        <h2>${escHtml(cfg.title)}</h2>
        <p>${escHtml(cfg.body)}</p>
        <div class="role-next-actions">
          ${cfg.actions.map(([label, variant, action]) => `<button type="button" class="${variant}" onclick="trackFirstActionStarted('${escAttr(role)}','${escAttr(label)}');${action}">${escHtml(label)}</button>`).join('')}
        </div>
      </div>
      <div class="role-next-payoff">
        <strong>Time-back payoff</strong>
        <span>${escHtml(cfg.payoff)}</span>
      </div>
    </div>`;
}

function trackFirstActionStarted(role, action) {
  trackSplashLensEvent('first_action_started', {
    role: normalizeSplashLensRole(role) || getSplashLensRole() || '',
    action,
    workflow_style: getWorkflowStyle(),
  });
}

function showFacilityTools() {
  document.body.classList.remove('facility-tools-hidden');
  const result = document.getElementById('facility-result');
  if (result) result.style.display = result.innerHTML.trim() ? 'block' : 'none';
  if (!S.tab) showTab('errors');
}

async function loadFacilityConfig(facilityId, equipmentId = '') {
  try {
    const response = await fetch(`/facilities/${encodeURIComponent(facilityId)}.json`, { cache: 'no-store' });
    if (!response.ok) throw new Error(`config ${response.status}`);
    activeFacilityConfig = await response.json();
    activeFacilityId = facilityId;
    activeFacilityEquipmentId = equipmentId || '';
    renderFacilityHome();
  } catch {
    activeFacilityConfig = {
      id: facilityId,
      name: `Facility ${facilityId}`,
      supportPhone: '',
      supportEmail: '',
      equipment: equipmentId ? [{ id: equipmentId, label: equipmentId, knownIssues: ['Capture equipment label, code display, and symptom before calling.'] }] : [],
      knownIssues: [],
    };
    renderFacilityHome();
  }
}

function renderFacilityHome() {
  const context = document.getElementById('facility-context');
  const known = document.getElementById('facility-known-issues');
  if (context) {
    const name = activeFacilityConfig?.name || 'Facility Assist';
    const eq = getActiveFacilityEquipment();
    context.textContent = eq
      ? `${name}: ${eq.label || eq.id}. Pick the situation, gather proof, then resolve or escalate.`
      : 'Pick the situation, gather proof, and end with either Resolved - logged or Escalate - send packet.';
  }
  if (known) {
    const issues = getFacilityKnownIssues();
    known.innerHTML = issues.length ? `
      <div class="facility-result" style="display:block;border-left:4px solid #b45309;">
        <p style="color:#92400e;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:6px;">Known issue prompts</p>
        ${issues.map((issue) => `<div class="facility-step"><b>!</b><span>${escHtml(issue)}</span></div>`).join('')}
      </div>` : '';
  }
}

function getActiveFacilityEquipment() {
  const equipment = Array.isArray(activeFacilityConfig?.equipment) ? activeFacilityConfig.equipment : [];
  return equipment.find((item) => String(item.id || '') === activeFacilityEquipmentId) || null;
}

function getFacilityKnownIssues() {
  const eq = getActiveFacilityEquipment();
  const issues = [
    ...(Array.isArray(eq?.knownIssues) ? eq.knownIssues : []),
    ...(Array.isArray(activeFacilityConfig?.knownIssues) ? activeFacilityConfig.knownIssues : []),
  ];
  return issues.filter(Boolean).slice(0, 4);
}

const FACILITY_LANES = {
  daily: {
    title: 'Daily pool check',
    event: 'daily_check_logged',
    steps: ['Record FC, pH, clarity, temperature, and required facility readings.', 'Check water level, circulation sound, visible leaks, alarms, and gates/signage.', 'Add staff initials/time and save the log before reopening or shift handoff.'],
    resolve: 'Resolved - logged',
    escalate: 'Escalate - send packet',
    nextTab: 'report',
  },
  dose: {
    title: 'Dose the pool',
    event: 'lane_complete',
    steps: ['Confirm pool volume and product label strength.', 'Enter current and target reading in dosing tools.', 'Retest after circulation time and save the adjustment note.'],
    resolve: 'Resolved - logged',
    escalate: 'Escalate - send packet',
    nextTab: 'dosing',
  },
  contamination: {
    title: 'Contamination event',
    event: 'lane_complete',
    steps: ['Close access and document time, location, event type, and who responded.', 'Remove visible material using facility-approved PPE and procedure.', 'Follow current local health code, facility policy, and CPO/trainer-approved reopening standard before reopening.'],
    resolve: 'Resolved - logged',
    escalate: 'Escalate - send packet',
    nextTab: 'report',
    reopen: ['Required contact time/meters satisfied', 'FC/pH retested and documented', 'Supervisor/CPO signoff recorded', 'Facility policy followed before reopening'],
  },
  equipment: {
    title: 'Equipment acting up',
    event: 'lane_complete',
    steps: ['Do not open energized equipment. Use visible checks only.', 'Check water level, baskets, valves, breaker/GFCI state, and visible alarm/code.', 'Photo equipment face, label, and code display before calling service.'],
    resolve: 'Resolved - logged',
    escalate: 'Escalate - send packet',
    nextTab: 'scan',
  },
  manual: {
    title: 'Find manual / what is this equipment',
    event: 'lane_complete',
    steps: ['Capture brand, model, serial, equipment face, and any QR or data plate.', 'Use PartSnap or lookup to identify the equipment family and missing proof.', 'Save or share the packet before ordering parts or asking for support.'],
    resolve: 'Resolved - logged',
    escalate: 'Escalate - send packet',
    nextTab: 'scan',
  },
  help: {
    title: 'I need help now',
    event: 'packet_created',
    steps: ['Capture what changed, current readings, symptoms, photos, and equipment proof.', 'Build the support packet so the expert is not starting cold.', 'Call or share with the configured support route.'],
    resolve: 'Resolved - logged',
    escalate: 'Escalate - send packet',
    nextTab: 'report',
  },
};

function startFacilityLane(laneId) {
  const lane = FACILITY_LANES[laneId] || FACILITY_LANES.daily;
  document.body.classList.add('facility-tools-hidden');
  const result = document.getElementById('facility-result');
  if (!result) return;
  const reopen = Array.isArray(lane.reopen) ? `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:9px;padding:10px;margin:8px 0;">
      <p style="color:#92400e;font-size:11px;font-weight:950;margin-bottom:6px;">Reopen checklist</p>
      ${lane.reopen.map((item) => `<label class="cl-item" style="padding:6px 0;"><input type="checkbox"><span class="cl-text" style="font-size:12px;">${escHtml(item)}</span></label>`).join('')}
    </div>` : '';
  result.style.display = 'block';
  result.innerHTML = `
    <p style="color:#0284c7;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">Facility lane</p>
    <h2 style="color:#0f172a;font-size:20px;font-weight:950;line-height:1.1;margin-bottom:10px;">${escHtml(lane.title)}</h2>
    ${lane.steps.map((step, index) => `<div class="facility-step"><b>${index + 1}</b><span>${escHtml(step)}</span></div>`).join('')}
    ${reopen}
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin:10px 0;">
      <p style="color:#0f766e;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;">Evidence before packet</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:7px;">
        <input id="facility-reading-fc" type="text" placeholder="FC / sanitizer" aria-label="Facility FC reading" style="font-size:13px;padding:10px;">
        <input id="facility-reading-ph" type="text" placeholder="pH" aria-label="Facility pH reading" style="font-size:13px;padding:10px;">
      </div>
      <input id="facility-symptoms" type="text" placeholder="Symptoms or code on display" aria-label="Facility symptoms" style="font-size:13px;padding:10px;margin-bottom:7px;">
      <input id="facility-recent-changes" type="text" placeholder="Recent changes: pump speed, filter clean, storm, bather load" aria-label="Facility recent changes" style="font-size:13px;padding:10px;margin-bottom:7px;">
      <input id="facility-photo-refs" type="text" placeholder="Photo refs: label, equipment face, water, reading screenshot" aria-label="Facility photo references" style="font-size:13px;padding:10px;">
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
      <button type="button" class="facility-action-btn secondary" onclick="completeFacilityLane('${laneId}', 'resolved')">${escHtml(lane.resolve)}</button>
      <button type="button" class="facility-action-btn" onclick="completeFacilityLane('${laneId}', 'escalate')">${escHtml(lane.escalate)}</button>
    </div>
    <button type="button" class="facility-action-btn secondary" style="width:100%;margin-top:8px;" onclick="showTab('${lane.nextTab}');showFacilityTools();${lane.nextTab === 'scan' ? "setTimeout(()=>setScanMode('parts'),80);" : ''}">Use related SplashLens tool</button>
  `;
  trackFacilityEvent('lane_start', { lane: laneId, title: lane.title });
}

function completeFacilityLane(laneId, outcome) {
  const packet = buildFacilityPacket(laneId, outcome);
  saveFacilityPacket(packet);
  renderFacilityPacket(packet);
  trackFacilityEvent('facility_workflow_completed', {
    lane: laneId,
    outcome,
    packet_id: packet.id,
  });
  trackSplashLensEvent('first_value_completed', {
    role: getSplashLensRole() || 'facility',
    workflow: 'facility_assist_packet',
    lane: laneId,
    outcome,
    packet_id: packet.id,
    time_back_message: 'Facility path ended with resolve or escalation packet.',
  });
  trackFacilityEvent(outcome === 'resolved' ? (FACILITY_LANES[laneId]?.event || 'lane_complete') : 'packet_created', {
    lane: laneId,
    outcome,
    packet_id: packet.id,
  });
}

function buildFacilityPacket(laneId, outcome) {
  const lane = FACILITY_LANES[laneId] || FACILITY_LANES.daily;
  const eq = getActiveFacilityEquipment();
  const now = new Date().toISOString();
  const fc = document.getElementById('facility-reading-fc')?.value?.trim() || '';
  const ph = document.getElementById('facility-reading-ph')?.value?.trim() || '';
  const symptoms = (document.getElementById('facility-symptoms')?.value || '').split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  const recentChanges = (document.getElementById('facility-recent-changes')?.value || '').split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  const photoRefs = (document.getElementById('facility-photo-refs')?.value || '').split(/[,;|]/).map((item) => item.trim()).filter(Boolean);
  return {
    id: `sl-fac-${Date.now().toString(36)}`,
    facility: {
      id: activeFacilityId || activeFacilityConfig?.id || '',
      name: activeFacilityConfig?.name || '',
    },
    pool: activeFacilityConfig?.pool || activeFacilityConfig?.poolName || '',
    timestamp: now,
    lane: laneId,
    laneTitle: lane.title,
    readings: { fc, ph },
    symptoms,
    recentChanges,
    photoRefs,
    equipment: {
      id: activeFacilityEquipmentId || eq?.id || '',
      label: eq?.label || '',
      brand: eq?.brand || '',
      model: eq?.model || '',
      code: '',
    },
    steps: lane.steps,
    outcome,
    role: getSplashLensRole() || 'facility',
    next: outcome === 'resolved' ? 'Resolved - logged' : 'Escalate - send packet',
    support: {
      phone: activeFacilityConfig?.supportPhone || '',
      email: activeFacilityConfig?.supportEmail || '',
    },
  };
}

function formatFacilityPacket(packet) {
  return [
    `SplashLens Facility Packet: ${packet.next}`,
    `ID: ${packet.id}`,
    `Facility: ${packet.facility.name || packet.facility.id || 'Unspecified'}`,
    `Pool: ${packet.pool || 'Unspecified'}`,
    `Time: ${packet.timestamp}`,
    `Lane: ${packet.laneTitle}`,
    `Role: ${packet.role}`,
    '',
    'Equipment',
    `- ID: ${packet.equipment.id || ''}`,
    `- Label: ${packet.equipment.label || ''}`,
    `- Brand/model/code: ${[packet.equipment.brand, packet.equipment.model, packet.equipment.code].filter(Boolean).join(' / ') || 'Needs proof'}`,
    '',
    'Evidence captured',
    `- Readings: ${Object.entries(packet.readings || {}).filter(([, value]) => value).map(([key, value]) => `${key.toUpperCase()} ${value}`).join(' / ') || 'Needs reading proof'}`,
    `- Symptoms/code: ${(packet.symptoms || []).join(' / ') || 'Needs symptom detail'}`,
    `- Recent changes: ${(packet.recentChanges || []).join(' / ') || 'None recorded'}`,
    `- Photo refs: ${(packet.photoRefs || []).join(' / ') || 'Needs photo references'}`,
    '',
    'Steps checked',
    ...packet.steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    'Need before repair/order',
    '- Confirm local code, facility policy, manufacturer manual, and qualified tech judgment.',
    '- Add readings, photos, labels, recent changes, and symptom detail before escalation.',
  ].join('\n');
}

function saveFacilityPacket(packet) {
  try {
    const packets = JSON.parse(localStorage.getItem(FACILITY_PACKET_KEY) || '[]');
    packets.push(packet);
    localStorage.setItem(FACILITY_PACKET_KEY, JSON.stringify(packets.slice(-30)));
  } catch {}
}

function getSavedFacilityPackets() {
  try { return JSON.parse(localStorage.getItem(FACILITY_PACKET_KEY) || '[]'); }
  catch { return []; }
}

function seedReportFromFacilityPacket(packetId) {
  const packet = getSavedFacilityPackets().find((item) => item.id === packetId);
  if (!packet) {
    alert('Facility packet was not found on this device.');
    return;
  }
  document.body.classList.remove('facility-tools-hidden');
  showTab('report');
  setReportValueAndNotify('rpt-customer', packet.facility?.name || packet.facility?.id || 'Facility pool', { force: false });
  setReportValueAndNotify('rpt-date', new Date(packet.timestamp || Date.now()).toISOString().split('T')[0], { force: true });
  setReportValueAndNotify('rpt-type', packet.lane === 'daily' ? 'Inspection' : packet.lane === 'dose' ? 'Chemical Treatment' : 'Repair', { force: true });
  setReportValueAndNotify('rpt-priority', packet.outcome === 'resolved' ? 'today' : 'senior-review', { force: true });
  setReportValueAndNotify('rpt-review-to', packet.outcome === 'resolved' ? 'Facility log' : 'Senior tech / support route', { force: false });
  setReportValueAndNotify('rpt-fc', packet.readings?.fc || '', { force: false });
  setReportValueAndNotify('rpt-ph', packet.readings?.ph || '', { force: false });
  setReportValueAndNotify('rpt-photo-proof', (packet.photoRefs || []).join(', '), { force: false });
  setReportValueAndNotify('rpt-issue-note', [
    `${packet.laneTitle || 'Facility lane'}: ${packet.next || packet.outcome || 'logged'}.`,
    (packet.symptoms || []).length ? `Symptoms/code: ${(packet.symptoms || []).join(', ')}.` : '',
    (packet.recentChanges || []).length ? `Recent changes: ${(packet.recentChanges || []).join(', ')}.` : '',
  ].filter(Boolean).join(' '), { force: false });
  setReportValueAndNotify('rpt-equip', [
    packet.equipment?.label ? `Equipment: ${packet.equipment.label}.` : '',
    packet.equipment?.brand || packet.equipment?.model ? `Brand/model: ${[packet.equipment?.brand, packet.equipment?.model].filter(Boolean).join(' / ')}.` : '',
    `Facility packet ID: ${packet.id}.`,
  ].filter(Boolean).join(' '), { force: false });
  setReportValueAndNotify('rpt-work', `Facility Assist workflow completed: ${packet.laneTitle || packet.lane}. Outcome: ${packet.next || packet.outcome}.`, { force: false });
  setReportValueAndNotify('rpt-rec', packet.outcome === 'resolved'
    ? 'Keep this in the facility log and verify against local code, policy, and CPO guidance.'
    : 'Escalate with the packet before repair, part order, or reopening decision.', { force: false });
  setReportValueAndNotify('rpt-customer-summary', `A facility workflow was documented for ${packet.laneTitle || 'this pool'}. The record includes readings, visible proof, symptoms, recent changes, and next action. Local code, facility policy, and qualified judgment still control reopening or repair decisions.`, { force: false });
  setReportCheck('rpt-proof-water', Boolean(packet.readings?.fc || packet.readings?.ph));
  setReportCheck('rpt-proof-equipment', Boolean((packet.photoRefs || []).length || packet.equipment?.label || packet.equipment?.model));
  setReportCheck('rpt-proof-summary', true);
  validateReportProof({ quiet: true });
  saveReportDraft();
  renderProofWorkflowOutput(
    'Facility packet moved into saved job history',
    'This packet is now a local draft passport. Review the proof, add any missing readings/photos, then save it to pool history or share a senior-tech packet.',
    '<div class="brain-grid"><button type="button" class="brain-action green" onclick="saveReportToPoolHistory()">Save Passport</button><button type="button" class="brain-action secondary" onclick="createServiceProofShareLink()">Share packet</button></div>'
  );
  trackSplashLensEvent('facility_packet_seeded_service_passport', {
    packet_id: packet.id,
    lane: packet.lane,
    outcome: packet.outcome,
    proof_ready: validateReportProof({ quiet: true }).complete,
  });
}

function renderFacilityPacket(packet) {
  const result = document.getElementById('facility-result');
  if (!result) return;
  const text = formatFacilityPacket(packet);
  const call = packet.support.phone ? `<button type="button" class="facility-action-btn" onclick="callFacilitySupport('${escAttr(packet.support.phone)}','${escAttr(packet.id)}')">Call support</button>` : '';
  const columns = call ? 4 : 3;
  result.style.display = 'block';
  result.innerHTML = `
    <div class="facility-packet">
      <p style="color:#0284c7;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">${escHtml(packet.next)}</p>
      <h2 style="color:#0f172a;font-size:20px;font-weight:950;line-height:1.1;margin-bottom:8px;">${escHtml(packet.laneTitle)} packet</h2>
      <pre id="facility-packet-text">${escHtml(text)}</pre>
      <div style="display:grid;grid-template-columns:repeat(${columns},1fr);gap:8px;">
        <button type="button" class="facility-action-btn secondary" onclick="copyFacilityPacket()">Copy</button>
        <button type="button" class="facility-action-btn secondary" onclick="shareFacilityPacket()">Share</button>
        <button type="button" class="facility-action-btn secondary" onclick="seedReportFromFacilityPacket('${escAttr(packet.id)}')">Save Passport</button>
        ${call}
      </div>
    </div>`;
}

function copyFacilityPacket() {
  const text = document.getElementById('facility-packet-text')?.textContent || '';
  navigator.clipboard?.writeText(text);
  trackFacilityEvent('packet_created', { action: 'copy' });
}

function shareFacilityPacket() {
  const text = document.getElementById('facility-packet-text')?.textContent || '';
  if (navigator.share) {
    navigator.share({ title: 'SplashLens Facility Packet', text }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text);
  }
  trackFacilityEvent('packet_created', { action: 'share' });
}

function callFacilitySupport(phone, packetId) {
  trackFacilityEvent('call_placed', { packet_id: packetId, support_configured: true });
  window.location.href = `tel:${phone}`;
}

function openFacilityQrSheet() {
  const url = activeFacilityId ? `/facility-qr.html?facility=${encodeURIComponent(activeFacilityId)}` : '/facility-qr.html';
  window.open(url, '_blank', 'noopener');
}

function trackFacilityEvent(event, extra = {}) {
  trackSplashLensEvent(event, {
    facilityId: activeFacilityId || activeFacilityConfig?.id || '',
    equipmentId: activeFacilityEquipmentId || '',
    lane: extra.lane || '',
    anon_device_id: getScanClientId(),
    role: getSplashLensRole() || 'facility',
    ...extra,
  });
}

// ═══════════════════════════════════════════
// PERSISTENT POOL VOLUME
// ═══════════════════════════════════════════
function readFieldFeedbackState() {
  try {
    return {
      opens: 0,
      meaningfulActions: 0,
      signals: [],
      promptShown: 0,
      quickPromptShown: 0,
      quickSnoozedUntil: 0,
      snoozedUntil: 0,
      submittedAt: 0,
      ...JSON.parse(localStorage.getItem(FIELD_FEEDBACK_KEY) || '{}'),
    };
  } catch {
    return { opens: 0, meaningfulActions: 0, signals: [], promptShown: 0, quickPromptShown: 0, quickSnoozedUntil: 0, snoozedUntil: 0, submittedAt: 0 };
  }
}

function writeFieldFeedbackState(state) {
  try { localStorage.setItem(FIELD_FEEDBACK_KEY, JSON.stringify(state)); } catch {}
}

function shouldShowFieldFeedback(state) {
  const now = Date.now();
  if (document.getElementById('field-feedback-overlay')) return false;
  if (state.snoozedUntil && now < Number(state.snoozedUntil)) return false;
  if (state.submittedAt && now - Number(state.submittedAt) < FIELD_FEEDBACK_AFTER_SUBMIT_MS) return false;
  if (state.promptShown && now - Number(state.promptShown) < FIELD_FEEDBACK_COOLDOWN_MS) return false;
  return state.meaningfulActions >= 2 || state.opens >= 3;
}

function recordFieldFeedbackSignal(eventName) {
  if (eventName === 'field_feedback_submitted' || eventName === 'field_feedback_prompt_shown') return;
  const state = readFieldFeedbackState();
  if (eventName === 'app_open') state.opens = Number(state.opens || 0) + 1;
  if (FIELD_FEEDBACK_ACTIONS.has(eventName)) {
    state.meaningfulActions = Number(state.meaningfulActions || 0) + 1;
    state.lastValueAt = Date.now();
    if (!state.firstValueAt) state.firstValueAt = state.lastValueAt;
    state.signals = [...(state.signals || []), { event: eventName, tab: S.tab, at: new Date().toISOString() }].slice(-8);
  }
  writeFieldFeedbackState(state);
  if (['partsnap_result', 'ai_scan_started', 'manual_code_search', 'service_report_saved', 'proof_ready_report_saved'].includes(eventName)) {
    setTimeout(() => showQuickFeedbackPrompt(eventName), 8500);
  }
  else if (shouldShowFieldFeedback(state)) setTimeout(() => showFieldFeedbackPrompt(eventName), 900);
}

function shouldShowQuickFeedback(state, eventName = '') {
  const now = Date.now();
  if (!['partsnap_result', 'ai_scan_started', 'manual_code_search', 'service_report_saved', 'proof_ready_report_saved'].includes(eventName)) return false;
  if (document.getElementById('field-feedback-overlay') || document.getElementById('field-quick-feedback')) return false;
  if (state.quickSnoozedUntil && now < Number(state.quickSnoozedUntil)) return false;
  if (state.submittedAt && now - Number(state.submittedAt) < FIELD_FEEDBACK_AFTER_SUBMIT_MS) return false;
  if (state.quickPromptShown && now - Number(state.quickPromptShown) < 18 * 60 * 60 * 1000) return false;
  return Number(state.meaningfulActions || 0) >= 2 || (state.firstValueAt && now - Number(state.firstValueAt) >= 8000);
}

function showQuickFeedbackPrompt(trigger = 'usage') {
  const state = readFieldFeedbackState();
  if (!shouldShowQuickFeedback(state, trigger)) return;
  state.quickPromptShown = Date.now();
  writeFieldFeedbackState(state);
  trackSplashLensEvent('field_feedback_quick_shown', { trigger, meaningful_actions: state.meaningfulActions, current_tab: S.tab });

  const label = trigger === 'partsnap_result'
    ? 'Did PartSnap help?'
    : trigger === 'ai_scan_started'
      ? 'Did the scan help?'
      : 'Did this help?';
  const toast = document.createElement('div');
  toast.id = 'field-quick-feedback';
  toast.setAttribute('role', 'dialog');
  toast.setAttribute('aria-live', 'polite');
  toast.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:9998;display:flex;justify-content:center;pointer-events:none;';
  toast.innerHTML = `
    <div style="width:min(520px,100%);background:#ffffff;border:1px solid #bae6fd;border-radius:14px;box-shadow:0 18px 46px rgba(15,23,42,.24);padding:12px;pointer-events:auto;">
      <p style="color:#0f172a;font-size:15px;font-weight:950;margin-bottom:9px;">${label}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:8px;">
        <button type="button" onclick="answerQuickFeedback('helped','${escAttr(trigger)}')" style="background:#0f766e;color:#fff;border:0;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:950;cursor:pointer;">Yes</button>
        <button type="button" onclick="answerQuickFeedback('wrong','${escAttr(trigger)}')" style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:950;cursor:pointer;">Wrong</button>
        <button type="button" onclick="answerQuickFeedback('missing','${escAttr(trigger)}')" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:950;cursor:pointer;">Missing info</button>
        <button type="button" onclick="answerQuickFeedback('close','${escAttr(trigger)}')" aria-label="Close feedback" style="background:#f8fafc;color:#64748b;border:1px solid #cbd5e1;border-radius:10px;padding:0 12px;font-size:16px;font-weight:950;cursor:pointer;">x</button>
      </div>
    </div>`;
  document.body.appendChild(toast);
}

function closeQuickFeedbackPrompt() {
  document.getElementById('field-quick-feedback')?.remove();
}

function answerQuickFeedback(answer, trigger = 'usage') {
  const state = readFieldFeedbackState();
  const needsDetail = answer === 'wrong' || answer === 'missing' || answer === 'missed';
  state.quickSnoozedUntil = Date.now() + (needsDetail ? 60 * 1000 : 7 * 24 * 60 * 60 * 1000);
  writeFieldFeedbackState(state);
  trackSplashLensEvent('field_feedback_quick_answered', {
    answer,
    trigger,
    meaningful_actions: state.meaningfulActions || 0,
    current_tab: S.tab,
    role: getSplashLensRole(),
    context: getFieldFeedbackContext(trigger),
  });
  closeQuickFeedbackPrompt();
  if (needsDetail) {
    state.promptShown = 0;
    state.snoozedUntil = 0;
    writeFieldFeedbackState(state);
    showFieldFeedbackPrompt(trigger, {
      feedback: answer === 'wrong'
        ? 'Wrong result: '
        : trigger === 'partsnap_result'
          ? 'PartSnap was missing: '
          : trigger === 'ai_scan_started'
            ? 'The scan was missing: '
            : 'This workflow was missing: ',
      rating: '2',
      issueType: answer === 'wrong' ? 'wrong' : 'missing',
      force: true,
    });
  }
}

function getFieldFeedbackContext(trigger = '') {
  const part = typeof _lastPartSnapResult !== 'undefined' ? (_lastPartSnapResult || {}) : {};
  const manualQuery = (document.getElementById('error-search')?.value || document.getElementById('scan-lookup-input')?.value || '').trim();
  return {
    trigger,
    role: getSplashLensRole(),
    tab: S.tab || '',
    code: manualQuery || part.code || '',
    brand: part.manufacturer || part.brand || '',
    component: part.component || part.category || '',
    model: part.model || part.partNumber || '',
    confidence: part.confidence || '',
    photo_type: trigger === 'partsnap_result' ? 'part/photo/label' : trigger === 'ai_scan_started' ? 'scanner/photo' : '',
  };
}

function showFieldFeedbackPrompt(trigger = 'usage', prefill = {}) {
  const state = readFieldFeedbackState();
  if (!prefill.force && !shouldShowFieldFeedback(state)) return;
  const context = getFieldFeedbackContext(trigger);
  state.promptShown = Date.now();
  writeFieldFeedbackState(state);
  trackSplashLensEvent('field_feedback_prompt_shown', { trigger, meaningful_actions: state.meaningfulActions, opens: state.opens });

  const overlay = document.createElement('div');
  overlay.id = 'field-feedback-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.62);display:flex;align-items:flex-end;justify-content:center;padding:14px;';
  overlay.innerHTML = `
    <div style="width:min(520px,100%);background:#ffffff;border:1px solid #cbd5e1;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:16px;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:10px;">
        <div>
          <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.09em;text-transform:uppercase;margin-bottom:4px;">Field tester feedback</p>
          <h2 style="color:#0f172a;font-size:20px;line-height:1.08;font-weight:950;margin:0;">What slowed you down today?</h2>
        </div>
        <button type="button" onclick="snoozeFieldFeedback(7)" aria-label="Close feedback" style="border:1px solid #e2e8f0;background:#f8fafc;color:#64748b;border-radius:999px;width:34px;height:34px;font-size:18px;font-weight:900;cursor:pointer;">x</button>
      </div>
      <p style="color:#64748b;font-size:13px;line-height:1.45;margin-bottom:12px;">One honest note helps shape SplashLens around real pool tech work. Email is optional unless you want Joshua to follow up.</p>
      <label class="field-label" for="field-feedback-text">Feedback</label>
      <textarea id="field-feedback-text" rows="4" placeholder="Example: PartSnap needed a better label prompt, this code was missing, or this saved me time..." style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:11px;font-size:14px;line-height:1.35;resize:vertical;margin-bottom:10px;">${escHtml(prefill.feedback || '')}</textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:10px;">
        <div>
          <label class="field-label" for="field-feedback-code">Code / part clue</label>
          <input id="field-feedback-code" type="text" value="${escAttr(context.code || context.model || '')}" placeholder="E05, TruClear, impeller..." style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:14px;">
        </div>
        <div>
          <label class="field-label" for="field-feedback-brand">Brand</label>
          <input id="field-feedback-brand" type="text" value="${escAttr(context.brand || '')}" placeholder="Pentair, Jandy..." style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:14px;">
        </div>
        <div>
          <label class="field-label" for="field-feedback-photo-type">Photo type</label>
          <select id="field-feedback-photo-type" style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:14px;background:#fff;">
            ${['', 'part close-up', 'model plate', 'control display', 'wide equipment pad', 'water test', 'other'].map(item => `<option value="${escAttr(item)}" ${item === (context.photo_type || '') ? 'selected' : ''}>${item || 'Pick one'}</option>`).join('')}
          </select>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div>
          <label class="field-label" for="field-feedback-rating">How useful was this stop?</label>
          <select id="field-feedback-rating" style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:14px;background:#fff;">
            <option value="" ${prefill.rating ? '' : 'selected'}>Pick one</option>
            <option value="5" ${prefill.rating === '5' ? 'selected' : ''}>5 - saved real time</option>
            <option value="4" ${prefill.rating === '4' ? 'selected' : ''}>4 - useful</option>
            <option value="3" ${prefill.rating === '3' ? 'selected' : ''}>3 - okay</option>
            <option value="2" ${prefill.rating === '2' ? 'selected' : ''}>2 - rough</option>
            <option value="1" ${prefill.rating === '1' ? 'selected' : ''}>1 - missed it</option>
          </select>
        </div>
        <div>
          <label class="field-label" for="field-feedback-email">Email optional</label>
          <input id="field-feedback-email" type="email" inputmode="email" placeholder="you@example.com" style="width:100%;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:14px;">
        </div>
      </div>
      <label style="display:flex;align-items:flex-start;gap:8px;color:#334155;font-size:12px;line-height:1.35;font-weight:800;margin-bottom:12px;">
        <input id="field-feedback-tester" type="checkbox" style="margin-top:2px;">
        <span>I am open to being a founding field tester. Joshua may email me about this feedback if I entered an email.</span>
      </label>
      <div id="field-feedback-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:8px;font-size:12px;font-weight:800;margin-bottom:10px;"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" onclick="submitFieldFeedback()" style="background:#0369a1;color:#fff;border:0;border-radius:10px;padding:12px 10px;font-size:13px;font-weight:950;cursor:pointer;">Send Feedback</button>
        <button type="button" onclick="snoozeFieldFeedback(7)" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;border-radius:10px;padding:12px 10px;font-size:13px;font-weight:900;cursor:pointer;">Not Now</button>
      </div>
      <button type="button" onclick="snoozeFieldFeedback(30)" style="margin-top:9px;width:100%;background:transparent;border:0;color:#94a3b8;font-size:12px;font-weight:800;cursor:pointer;">Hide for a while</button>
    </div>`;
  document.body.appendChild(overlay);
  setTimeout(() => document.getElementById('field-feedback-text')?.focus(), 80);
}

function closeFieldFeedbackPrompt() {
  document.getElementById('field-feedback-overlay')?.remove();
}

function snoozeFieldFeedback(days = 7) {
  const state = readFieldFeedbackState();
  state.snoozedUntil = Date.now() + Math.max(1, Number(days) || 7) * 24 * 60 * 60 * 1000;
  writeFieldFeedbackState(state);
  closeFieldFeedbackPrompt();
}

function validOptionalEmail(email) {
  if (!email) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function submitFieldFeedback() {
  const text = (document.getElementById('field-feedback-text')?.value || '').trim();
  const rating = (document.getElementById('field-feedback-rating')?.value || '').trim();
  const email = (document.getElementById('field-feedback-email')?.value || '').trim();
  const tester = Boolean(document.getElementById('field-feedback-tester')?.checked);
  const code = (document.getElementById('field-feedback-code')?.value || '').trim();
  const brand = (document.getElementById('field-feedback-brand')?.value || '').trim();
  const photoType = (document.getElementById('field-feedback-photo-type')?.value || '').trim();
  const error = document.getElementById('field-feedback-error');
  if (!text && !rating && !tester) {
    if (error) {
      error.textContent = 'Add a quick note, rating, or field tester opt-in first.';
      error.style.display = 'block';
    }
    return;
  }
  if (!validOptionalEmail(email)) {
    if (error) {
      error.textContent = 'Use a valid email or leave it blank.';
      error.style.display = 'block';
    }
    return;
  }
  if (email) rememberSplashLensIdentity({ email, role: getSplashLensRole() }, 'field_feedback');
  const state = readFieldFeedbackState();
  state.submittedAt = Date.now();
  state.snoozedUntil = Date.now() + FIELD_FEEDBACK_AFTER_SUBMIT_MS;
  state.lastFeedback = { text: text.slice(0, 500), rating, email, tester, code, brand, photoType, at: new Date().toISOString() };
  writeFieldFeedbackState(state);
  trackSplashLensEvent('field_feedback_submitted', {
    feedback: text.slice(0, 900),
    rating,
    email,
    code_or_part: code,
    brand,
    photo_type: photoType,
    field_tester_opt_in: tester,
    consent_to_follow_up: Boolean(email && tester),
    meaningful_actions: state.meaningfulActions || 0,
    opens: state.opens || 0,
    recent_signals: (state.signals || []).map(s => s.event).join(', '),
    current_tab: S.tab,
    role: getSplashLensRole(),
  });
  const overlay = document.getElementById('field-feedback-overlay');
  if (overlay) {
    overlay.innerHTML = `
      <div style="width:min(480px,100%);background:#ffffff;border:1px solid #bbf7d0;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:18px;text-align:center;">
        <p style="color:#166534;font-size:11px;font-weight:950;letter-spacing:.09em;text-transform:uppercase;margin-bottom:6px;">Feedback sent</p>
        <h2 style="color:#0f172a;font-size:21px;line-height:1.1;font-weight:950;margin:0 0 8px;">That helps build the right thing.</h2>
        <p style="color:#64748b;font-size:13px;line-height:1.45;margin-bottom:14px;">Thanks for giving field truth instead of polite noise.</p>
        <button type="button" onclick="closeFieldFeedbackPrompt()" style="background:#0369a1;color:#fff;border:0;border-radius:10px;padding:12px 16px;font-size:13px;font-weight:950;cursor:pointer;">Back to SplashLens</button>
      </div>`;
  }
}

function readStoreReviewState() {
  try {
    return { wins: 0, promptShown: 0, reviewedAt: 0, declinedAt: 0, ...JSON.parse(localStorage.getItem(STORE_REVIEW_KEY) || '{}') };
  } catch {
    return { wins: 0, promptShown: 0, reviewedAt: 0, declinedAt: 0 };
  }
}

function writeStoreReviewState(state) {
  try { localStorage.setItem(STORE_REVIEW_KEY, JSON.stringify(state)); } catch {}
}

function recordReviewableWin(eventName) {
  if (!STORE_REVIEW_SUCCESS_EVENTS.has(eventName)) return;
  const state = readStoreReviewState();
  state.wins = Number(state.wins || 0) + 1;
  writeStoreReviewState(state);
  if (shouldShowStoreReviewPrompt(state)) setTimeout(() => showStoreReviewPrompt(eventName), 650);
}

function shouldShowStoreReviewPrompt(state) {
  const now = Date.now();
  if (document.getElementById('field-feedback-overlay') || document.getElementById('store-review-overlay')) return false;
  if (state.wins < 2) return false;
  if (state.reviewedAt) return false;
  if (state.promptShown && now - Number(state.promptShown) < STORE_REVIEW_COOLDOWN_MS) return false;
  if (state.declinedAt && now - Number(state.declinedAt) < STORE_REVIEW_COOLDOWN_MS) return false;
  return true;
}

function storeReviewLinks() {
  const store = getStoreShellMode();
  if (store === 'ios') return [{ label: 'Review on App Store', url: SPLASHLENS_IOS_REVIEW_URL }];
  if (store === 'android') return [{ label: 'Review on Google Play', url: SPLASHLENS_PLAY_REVIEW_URL }];
  return [
    { label: 'App Store', url: SPLASHLENS_IOS_REVIEW_URL },
    { label: 'Google Play', url: SPLASHLENS_PLAY_REVIEW_URL },
  ];
}

function showStoreReviewPrompt(trigger = 'success') {
  const state = readStoreReviewState();
  if (!shouldShowStoreReviewPrompt(state)) return;
  state.promptShown = Date.now();
  writeStoreReviewState(state);
  trackSplashLensEvent('store_review_prompt_shown', { trigger, wins: state.wins, store: getStoreShellMode() || 'web' });

  const links = storeReviewLinks();
  const overlay = document.createElement('div');
  overlay.id = 'store-review-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.style.cssText = 'position:fixed;inset:0;z-index:9999;background:rgba(15,23,42,.62);display:flex;align-items:flex-end;justify-content:center;padding:14px;';
  overlay.innerHTML = `
    <div style="width:min(500px,100%);background:#ffffff;border:1px solid #cbd5e1;border-radius:14px;box-shadow:0 24px 70px rgba(15,23,42,.28);padding:16px;">
      <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.09em;text-transform:uppercase;margin-bottom:6px;">Quick field check</p>
      <h2 style="color:#0f172a;font-size:21px;line-height:1.08;font-weight:950;margin:0 0 8px;">Did SplashLens save you time?</h2>
      <p style="color:#64748b;font-size:13px;line-height:1.45;margin-bottom:14px;">If it helped, a store review helps other pool techs find it. If it missed, tell us what to fix instead.</p>
      <div style="display:grid;grid-template-columns:${links.length === 1 ? '1fr' : '1fr 1fr'};gap:8px;margin-bottom:8px;">
        ${links.map(link => `<a href="${link.url}" target="_blank" rel="noopener" onclick="markStoreReviewClicked('${escAttr(link.label)}')" style="background:#0369a1;color:#fff;text-align:center;text-decoration:none;border-radius:10px;padding:12px 8px;font-size:13px;font-weight:950;">${escHtml(link.label)}</a>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" onclick="storeReviewNeedsWork()" style="background:#fef3c7;color:#92400e;border:1px solid #fde68a;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:900;cursor:pointer;">Needs Work</button>
        <button type="button" onclick="dismissStoreReviewPrompt()" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:900;cursor:pointer;">Not Now</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
}

function closeStoreReviewPrompt() {
  document.getElementById('store-review-overlay')?.remove();
}

function markStoreReviewClicked(label) {
  const state = readStoreReviewState();
  state.reviewedAt = Date.now();
  writeStoreReviewState(state);
  trackSplashLensEvent('store_review_click', { store_label: label, wins: state.wins, store: getStoreShellMode() || 'web' });
}

function dismissStoreReviewPrompt() {
  const state = readStoreReviewState();
  state.declinedAt = Date.now();
  writeStoreReviewState(state);
  trackSplashLensEvent('store_review_dismissed', { wins: state.wins, store: getStoreShellMode() || 'web' });
  closeStoreReviewPrompt();
}

function storeReviewNeedsWork() {
  const state = readStoreReviewState();
  state.declinedAt = Date.now();
  writeStoreReviewState(state);
  trackSplashLensEvent('store_review_needs_work', { wins: state.wins, store: getStoreShellMode() || 'web' });
  closeStoreReviewPrompt();
  const feedback = readFieldFeedbackState();
  feedback.promptShown = 0;
  feedback.snoozedUntil = 0;
  writeFieldFeedbackState(feedback);
  showFieldFeedbackPrompt('store_review_needs_work');
}

function onVolumeChange(val) {
  const n = parseFloat(val);
  if (n > 0) {
    localStorage.setItem('poolens-vol', val);
    const badge = document.getElementById('pool-vol-badge');
    const disp  = document.getElementById('pool-vol-display');
    if (badge) badge.style.display = '';
    if (disp)  disp.textContent = Number(n).toLocaleString() + ' gal';
    // Sync to SLAM volume if empty
    const sv = document.getElementById('slam-volume');
    if (sv && !sv.value) sv.value = val;
  }
}

function loadPersistedVolume() {
  const saved = localStorage.getItem('poolens-vol');
  if (!saved) return;
  const el = document.getElementById('dose-volume');
  if (el) { el.value = saved; onVolumeChange(saved); }
}

function focusVolumeInput() {
  showTab('dosing');
  setTimeout(() => {
    const el = document.getElementById('dose-volume');
    if (el) { el.focus(); el.select(); }
  }, 80);
}

function focusErrorSearch(query = '') {
  showTab('errors');
  setTimeout(() => {
    const el = document.getElementById('error-search');
    if (!el) return;
    if (query) {
      el.value = query;
      onErrorSearch(query);
      const clear = document.getElementById('search-clear');
      if (clear) clear.style.display = 'block';
    }
    el.focus();
    el.select();
    el.scrollIntoView({ behavior: 'auto', block: 'center' });
  }, 80);
}

function quickServiceNote() {
  showTab('report');
  setTimeout(() => {
    const work = document.getElementById('rpt-work');
    if (work && !work.value) {
      work.value = 'Cleaned pool, checked equipment, tested and balanced water.';
    }
    work?.focus();
  }, 80);
}

// ═══════════════════════════════════════════
// ERROR CODES
// ═══════════════════════════════════════════
function setReportValueAndNotify(id, value, opts = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  const next = String(value || '');
  if (opts.append && el.value.trim()) {
    if (!el.value.includes(next)) el.value = `${el.value.trim()}\n${next}`;
  } else if (opts.force || !el.value.trim()) {
    el.value = next;
  }
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function setReportCheck(id, checked = true) {
  const el = document.getElementById(id);
  if (!el) return;
  el.checked = !!checked;
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

function focusReportField(id) {
  setTimeout(() => {
    const el = document.getElementById(id);
    el?.focus();
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, 90);
}

function renderProofWorkflowOutput(title, body, actions = '') {
  const output = document.getElementById('rpt-proof-os-output');
  if (!output) return;
  output.innerHTML = `
    <section class="brain-card" aria-label="Service Proof workflow prompt">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:9px;">
        <div>
          <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Proof workflow</p>
          <h3 style="font-size:18px;line-height:1.1;font-weight:950;color:#0f172a;margin:0;">${escHtml(title)}</h3>
        </div>
        <span class="brain-pill warn">Field safe</span>
      </div>
      <p style="color:#475569;font-size:12px;line-height:1.5;margin-bottom:10px;">${escHtml(body)}</p>
      ${actions}
    </section>`;
}

function startServiceProofWorkflow(kind = 'visit') {
  showTab('report');
  setReportValueAndNotify('rpt-date', new Date().toISOString().split('T')[0], { force: false });
  if (kind === 'facility') {
    setSplashLensRole('facility', { persist: false, forced: true, source: 'service_proof_command' });
    trackSplashLensEvent('service_proof_workflow_started', { workflow: 'facility' });
    return;
  }
  document.body.classList.remove('facility-tools-hidden');
  if (kind === 'part') {
    setReportValueAndNotify('rpt-type', 'Repair', { force: true });
    setReportValueAndNotify('rpt-priority', 'senior-review', { force: true });
    setReportValueAndNotify('rpt-review-to', 'Senior tech / vendor', { force: false });
    setReportValueAndNotify('rpt-photo-proof', 'Needs: wide equipment photo, model plate, code display, close-up part marking, second proof photo.', { force: false });
    setReportValueAndNotify('rpt-issue-note', 'Part/code needs verification before ordering. Capture label, model, serial, and symptom proof.', { force: false });
    setReportValueAndNotify('rpt-equip', 'PartSnap / scanner workflow started. Verify possible match against model plate, manual, and qualified tech judgment.', { force: false });
    setReportCheck('rpt-proof-equipment', false);
    renderProofWorkflowOutput(
      'PartSnap to saved job note',
      'Start with the part or code, then save the proof into a customer record before ordering. The note should show what is known, what is missing, and who needs to verify it.',
      `<div class="brain-grid"><button type="button" class="brain-action green" onclick="showTab('scan');setTimeout(()=>setScanMode('parts'),80)">Open PartSnap</button><button type="button" class="brain-action secondary" onclick="createServiceProofShareLink()">Build packet</button></div>`
    );
    focusReportField('rpt-photo-proof');
  } else if (kind === 'closing') {
    const proof = window.CLOSING_SEASON_PROOF || {};
    setReportValueAndNotify('rpt-type', 'Closing / Winterization', { force: true });
    setReportValueAndNotify('rpt-priority', 'seasonal', { force: true });
    setReportValueAndNotify('rpt-review-to', 'Customer / owner / spring opening crew', { force: false });
    setReportValueAndNotify('rpt-work', 'Completed closing-season proof workflow: chemistry recorded, visible equipment checked, winterization proof captured, and follow-up risks documented.', { force: false });
    setReportValueAndNotify('rpt-photo-proof', `Closing proof needed: ${(proof.proofPhotos || []).join(', ') || 'water level, equipment pad, drain plugs, winter plugs, cover, and unusual conditions.'}`, { force: false });
    setReportValueAndNotify('rpt-issue-note', `Repeat issue check: ${(proof.callbackFlags || []).slice(0, 6).join(', ') || 'missing drain-plug proof, unclear cover proof, hard-freeze forecast, or declined work.'}`, { force: false });
    setReportValueAndNotify('rpt-customer-summary', 'Pool was closed and documented for the season. Photos and notes show the visible work completed today, open items, and any customer-approved or declined follow-up. This record supports future review but does not replace the exact equipment manual, local code, or qualified judgment.', { force: false });
    setReportCheck('rpt-proof-summary', true);
    renderProofWorkflowOutput(
      'Closing Season Proof Packet',
      proof.promise || 'Document water level, equipment pad, drain plugs, winter plugs, cover details, and any repeat-issue risks before leaving the property.',
      `<div class="brain-grid">
        <button type="button" class="brain-action green" onclick="switchClType('closing');showTab('guide')">Open closing checklist</button>
        <button type="button" class="brain-action secondary" onclick="createServiceProofShareLink()">Build proof packet</button>
        <button type="button" class="brain-action secondary" onclick="saveReportDraft()">Save closing draft</button>
      </div>
      <p style="color:#64748b;font-size:11px;line-height:1.45;margin-top:10px;">${escHtml(proof.trustBoundary || 'Verify exact model manuals, product labels, company policy, local code, and qualified technician judgment before acting.')}</p>`
    );
    focusReportField('rpt-photo-proof');
  } else {
    setReportValueAndNotify('rpt-type', 'Regular Service', { force: false });
    setReportValueAndNotify('rpt-priority', 'today', { force: false });
    setReportValueAndNotify('rpt-work', 'Tested water, checked visible equipment, and documented the stop.', { force: false });
    setReportValueAndNotify('rpt-customer-summary', 'Water was tested and the visit was documented. Any repair or part decisions still need label, manual, and qualified service verification.', { force: false });
    setReportCheck('rpt-proof-summary', true);
    renderProofWorkflowOutput(
      'Regular visit job note',
      'Capture readings first, dictate the work note, generate the customer-safe summary, then save it to the pool history.',
      '<div class="brain-grid"><button type="button" class="brain-action green" onclick="generateServiceProofSummary()">Generate summary</button><button type="button" class="brain-action secondary" onclick="saveReportDraft()">Save draft</button></div>'
    );
    focusReportField('rpt-fc');
  }
  validateReportProof({ quiet: true });
  trackSplashLensEvent('service_proof_workflow_started', { workflow: kind });
}

function startSpanishFieldWorkflow(kind) {
  showTab('report');
  setReportValueAndNotify('rpt-date', new Date().toISOString().split('T')[0], { force: false });
  if (kind === 'readings') {
    setReportValueAndNotify('rpt-reading-source', 'manual', { force: true });
    renderProofWorkflowOutput('Lecturas primero', 'Anota FC, pH y cualquier lectura requerida. Despues guarda el pasaporte o genera un resumen para el cliente.', `<div class="brain-grid"><button type="button" class="brain-action green" onclick="focusReportField('rpt-fc')">Ir a FC</button><button type="button" class="brain-action secondary" onclick="showTab('dosing')">Calcular dosis</button></div>`);
    focusReportField('rpt-fc');
  } else if (kind === 'proof_note') {
    setReportValueAndNotify('rpt-priority', 'today', { force: false });
    setReportValueAndNotify('rpt-issue-note', 'Nota de campo: documentar codigo, sintomas, fotos y cambios recientes antes de cerrar la visita.', { force: false });
    renderProofWorkflowOutput('Nota de prueba', 'Dicta o escribe la nota corta: que paso, que se verifico, que falta, y si se necesita tecnico senior o proveedor.', `<div class="brain-grid"><button type="button" class="brain-action green" onclick="focusReportField('rpt-issue-note')">Escribir nota</button><button type="button" class="brain-action secondary" onclick="generateServiceProofSummary()">Resumen</button></div>`);
    focusReportField('rpt-issue-note');
  } else {
    setReportValueAndNotify('rpt-priority', 'senior-review', { force: false });
    setReportValueAndNotify('rpt-review-to', 'Tecnico senior / proveedor', { force: false });
    renderProofWorkflowOutput('Paquete listo para revisar', 'Antes de pedir piezas: foto amplia, placa/modelo, codigo, marca de la pieza, lecturas y resumen seguro para el cliente.', '<div class="brain-grid"><button type="button" class="brain-action green" onclick="createServiceProofShareLink()">Crear paquete</button><button type="button" class="brain-action secondary" onclick="saveReportDraft()">Guardar borrador</button></div>');
    focusReportField('rpt-photo-proof');
  }
  validateReportProof({ quiet: true });
  trackSplashLensEvent('spanish_quick_chip', { chip: kind, workflow: 'service_proof_passport' });
}

function renderFieldLearningOS(kind = 'partsnap') {
  showTab('report');
  const lessons = {
    partsnap: {
      title: 'PartSnap miss to five-minute lesson',
      body: 'Use the weird part as the lesson. Student names visible proof, missing proof, order risk, and the safe customer explanation before anyone buys.',
      task: 'A tech has a possible part family but no model plate. What proof must be captured before ordering?',
      answer: 'Wide equipment photo, model/serial plate, close-up molded or printed marking, symptom/code, and current parts diagram or vendor/senior review.',
      fields: {
        type: 'Training / PartSnap Review',
        priority: 'senior-review',
        reviewTo: 'Trainer / senior tech',
        issue: 'Training prompt: PartSnap result needs proof-before-ordering review. Student must list visible proof, missing proof, and order decision.',
        proof: 'Needs: part photo, label/model plate, second proof photo, symptom/code, and manual/vendor verification.'
      }
    },
    facility: {
      title: 'Facility incident to CPO scenario',
      body: 'Use a real operator call as a conservative scenario: first safe action, what to document, when to close access, and when to escalate.',
      task: 'A facility manager reports cloudy water and a recent high bather load. What should be documented before reopening or calling support?',
      answer: 'Time, FC/sanitizer, pH, clarity, bather load/recent event, equipment status, facility policy followed, and supervisor/CPO signoff.',
      fields: {
        type: 'Training / Facility Scenario',
        priority: 'today',
        reviewTo: 'CPO / facility lead',
        issue: 'Training prompt: Facility scenario. Document first safe action, readings, visible proof, policy boundary, and escalation route.',
        proof: 'Needs: readings, clarity note, time, facility lane, equipment status, recent changes, and support packet if unresolved.'
      }
    },
    proof: {
      title: 'Service Proof review lesson',
      body: 'Turn a saved visit into coaching material: what was captured, what was missing, what should be customer-safe, and what would prevent a callback.',
      task: 'A visit note says “heater acting up” but has no code photo or model plate. Is the note ready for customer or vendor use?',
      answer: 'No. Add code/display photo, model plate, symptom timing, water-flow context, readings if relevant, and human-reviewed summary before sending.',
      fields: {
        type: 'Training / Service Proof Review',
        priority: 'senior-review',
        reviewTo: 'Owner / trainer',
        issue: 'Training prompt: Review whether this saved visit has enough proof for customer, vendor, or senior-tech handoff.',
        proof: 'Needs: readings if relevant, equipment photo, issue note, customer-safe summary, and explicit missing-proof list.'
      }
    }
  };
  const lesson = lessons[kind] || lessons.partsnap;
  setReportValueAndNotify('rpt-type', lesson.fields.type, { force: true });
  setReportValueAndNotify('rpt-priority', lesson.fields.priority, { force: true });
  setReportValueAndNotify('rpt-review-to', lesson.fields.reviewTo, { force: false });
  setReportValueAndNotify('rpt-issue-note', lesson.fields.issue, { force: false });
  setReportValueAndNotify('rpt-photo-proof', lesson.fields.proof, { force: false });
  setReportValueAndNotify('rpt-customer-summary', 'Training use only: this lesson teaches proof habits and should be reviewed by a qualified person before customer-facing use.', { force: false });
  setReportCheck('rpt-proof-summary', true);
  renderProofWorkflowOutput(
    lesson.title,
    lesson.body,
    `<div style="display:grid;gap:8px;margin-top:10px;">
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;">
        <p style="color:#0369a1;font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:4px;">Student task</p>
        <p style="color:#334155;font-size:12px;line-height:1.45;">${escHtml(lesson.task)}</p>
      </div>
      <details style="background:#ffffff;border:1px solid #dbe8ef;border-radius:8px;padding:10px;">
        <summary style="cursor:pointer;color:#0f172a;font-size:12px;font-weight:950;">Show answer key</summary>
        <p style="color:#334155;font-size:12px;line-height:1.45;margin-top:7px;">${escHtml(lesson.answer)}</p>
      </details>
      <div class="brain-grid">
        <button type="button" class="brain-action green" onclick="createServiceProofShareLink()">Create lesson packet</button>
        <button type="button" class="brain-action secondary" onclick="saveReportDraft()">Save for review</button>
        <a class="brain-action secondary" href="https://splashlens.com/field-learning-os.html" target="_blank" rel="noopener" onclick="trackSplashLensEvent('learning_os_public_page_click',{source:'app_lesson'})" style="text-align:center;text-decoration:none;">Public Learning OS</a>
      </div>
    </div>`
  );
  validateReportProof({ quiet: true });
  trackSplashLensEvent('field_learning_os_lesson_generated', { lesson_kind: kind });
}

function renderVerifiedProofNetwork() {
  showTab('report');
  if (isStoreShellMode()) {
    renderProofWorkflowOutput(
      'SplashLens FreeCore native build',
      'Manual lookup, calculators, Facility Assist, saved drafts, and customer-safe proof summaries remain free to start. AI scanner workflows require a free field profile so scan usage and misses are tied to a real contact.',
      `<div class="brain-grid" style="margin-top:10px;">
        <button type="button" class="brain-action green" onclick="startServiceProofWorkflow('visit')">Build proof</button>
        <button type="button" class="brain-action secondary" onclick="renderFieldLearningOS('proof')">Proof Review</button>
        <button type="button" class="brain-action secondary" onclick="showTab('scan');setTimeout(()=>setScanMode('lookup'),80)">Manual Lookup</button>
      </div>
      <p style="color:#64748b;font-size:11px;line-height:1.45;margin-top:10px;">Web subscriptions, checkout links, and paid lead capture are intentionally unavailable in native store shell mode.</p>`
    );
    trackSplashLensEvent('store_paid_lane_blocked', { source: 'verified_proof_network', store: getStoreShellMode() });
    return;
  }
  const network = window.SPLASHLENS_MONETIZATION_LANES || {};
  const plans = Array.isArray(network.plans) ? network.plans : [];
  const cards = plans.map((plan) => `
    <details class="brain-card" style="margin-bottom:8px;" ${plan.planKey === 'free_core' ? 'open' : ''}>
      <summary style="cursor:pointer;list-style:none;display:flex;align-items:flex-start;justify-content:space-between;gap:10px;">
        <span>
          <strong style="display:block;color:#0f172a;font-size:14px;line-height:1.15;">${escHtml(plan.name)}</strong>
          <span style="display:block;color:#64748b;font-size:11px;font-weight:800;margin-top:3px;">${escHtml(plan.buyer || '')}</span>
        </span>
        <span class="brain-pill ${plan.planKey === 'free_core' ? 'ready' : 'warn'}">${escHtml(plan.price || '')}</span>
      </summary>
      <div style="padding-top:9px;">
        <p style="color:#334155;font-size:12px;line-height:1.45;margin-bottom:7px;"><strong>Who it helps:</strong> ${escHtml(plan.buyer || '')}</p>
        <ul style="margin:0 0 0 16px;color:#334155;font-size:12px;line-height:1.45;">
          ${(plan.includes || []).map(item => `<li>${escHtml(item)}</li>`).join('')}
        </ul>
        <p style="color:#0f766e;font-size:11px;line-height:1.45;font-weight:850;margin-top:6px;"><strong>Trust boundary:</strong> ${escHtml(plan.guardrail || network.trustBoundary || '')}</p>
        ${plan.planKey === 'free_save_profile'
          ? `<button type="button" class="brain-action green" style="width:100%;margin-top:8px;" onclick="ensureFieldSaveAccount('pricing_catalog')">Create free save profile</button>`
          : plan.planKey && plan.planKey !== 'free_core'
            ? `<button type="button" class="brain-action green" style="width:100%;margin-top:8px;" onclick="openSplashLensPaidLane('${escHtml(plan.planKey)}','${escHtml(plan.name)}')">${plan.availability === 'self_serve' ? 'Start paid plan' : 'Request Teams access'}</button>`
            : ''}
      </div>
    </details>
  `).join('');
  renderProofWorkflowOutput(
    'SplashLens Verified Proof Network',
    network.promise || 'Free lookup first. Paid when the work needs to be saved, shared, reported, or reviewed.',
    `<div style="margin-top:10px;">${cards}</div><div class="brain-grid" style="margin-top:10px;"><button type="button" class="brain-action green" onclick="ensureFieldSaveAccount('verified_proof_network')" style="text-align:center;text-decoration:none;">Create save profile</button><a class="brain-action secondary" href="mailto:hello@splashlens.com?subject=SplashLens%20Teams%20access" onclick="trackSplashLensEvent('team_interest_click',{lane:'verified_proof_network'})" style="text-align:center;text-decoration:none;">Talk Teams</a></div>`
  );
  trackSplashLensEvent('verified_proof_network_viewed', { plans: plans.length });
}

async function openSplashLensPaidLane(planKey, label) {
  const safePlan = String(planKey || '').trim();
  const safeLabel = String(label || 'SplashLens paid lane').trim();
  trackSplashLensEvent('paid_lane_click', { plan_key: safePlan, label: safeLabel });
  if (isStoreShellMode()) {
    trackSplashLensEvent('store_paid_lane_blocked', { plan_key: safePlan, label: safeLabel, store: getStoreShellMode() });
    window.alert('This native store build is FreeCore. Web subscriptions and paid pilots are not offered inside the app.');
    return;
  }
  try {
    const response = await fetch('/api/checkout?catalog=1', { cache: 'no-store' });
    const payload = await response.json();
    const plan = (payload.plans || []).find(item => item.key === safePlan);
    if (plan && plan.checkoutConfigured) {
      window.location.href = `/api/checkout?plan=${encodeURIComponent(safePlan)}`;
      return;
    }
  } catch {}
  const email = String(window.prompt(`Enter your email to request ${safeLabel} access:`) || '').trim().toLowerCase();
  if (!email) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    window.alert('Enter a valid email address.');
    return;
  }
  rememberSplashLensIdentity({ email, role: getSplashLensRole() }, 'paid_lane_lead');
  try {
    const response = await fetch('/api/waitlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        source: 'paid-lane-request',
        interest: safePlan,
        interest_label: safeLabel,
        path: window.location.pathname,
      }),
    });
    const result = await response.json();
    if (!response.ok || !result.ok) throw new Error(result.error || 'request_failed');
    trackSplashLensEvent('paid_lane_lead_captured', { plan_key: safePlan, label: safeLabel });
    window.alert(`Request received for ${safeLabel}. Check your email for confirmation.`);
  } catch {
    const subject = encodeURIComponent(`SplashLens ${safeLabel} access request`);
    const body = encodeURIComponent(`Hi Joshua,\n\nI want to talk about ${safeLabel} for SplashLens.\n\nEmail: ${email}\n\nTalk Soon,`);
    window.location.href = `mailto:hello@splashlens.com?subject=${subject}&body=${body}`;
  }
}

function getFieldSaveAccount() {
  try {
    const account = JSON.parse(localStorage.getItem(FIELD_SAVE_ACCOUNT_KEY) || 'null');
    if (account && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(account.email || ''))) {
      const token = account.profileToken || localStorage.getItem(FREE_PROFILE_TOKEN_KEY) || '';
      return token ? { ...account, profileToken: token } : account;
    }
  } catch {}
  return null;
}

async function syncFieldSaveProfile(profile, feature = 'saved_job') {
  if (!navigator.onLine || !profile?.email) return false;
  if (!profile.profileToken) return false;
  return true;
}

function isVerifiedFieldProfile(profile) {
  if (!profile?.email || !String(profile.profileToken || '').startsWith('sl_profile_v1.')) return false;
  const expiresAt = Date.parse(profile.tokenExpiresAt || profile.profileTokenExpiresAt || '');
  return !Number.isFinite(expiresAt) || expiresAt > Date.now() + 60000;
}

async function requestFreeProfileCode(profile, feature = 'scan_gate') {
  try {
    const response = await fetch(SPLASHLENS_FREE_PROFILE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLanguageHeaders() },
      body: JSON.stringify(withLanguageMetadata({
        action: 'request_code',
        email: profile.email,
        name: profile.name || '',
        company: profile.company || '',
        role: profile.role || getSplashLensRole() || 'tech',
        feature,
        sourceFeature: profile.sourceFeature || feature,
        clientId: getScanClientId(),
        path: `${window.location.pathname}${window.location.search}`,
      })),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok) throw new Error(payload.error || 'Could not send verification code.');
    trackSplashLensEvent('free_scan_profile_code_requested', {
      feature,
      role: profile.role || getSplashLensRole() || 'tech',
      email_sent: Boolean(payload.emailSent),
    });
    return payload;
  } catch (error) {
    trackSplashLensEvent('free_scan_profile_code_request_failed', { feature, error: String(error.message || error).slice(0, 120) });
    throw error;
  }
}

async function verifyFreeProfileCode(profile, code, feature = 'scan_gate') {
  try {
    const response = await fetch(SPLASHLENS_FREE_PROFILE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLanguageHeaders() },
      body: JSON.stringify(withLanguageMetadata({
        action: 'verify_code',
        email: profile.email,
        code,
        name: profile.name || '',
        company: profile.company || '',
        role: profile.role || getSplashLensRole() || 'tech',
        feature,
        sourceFeature: profile.sourceFeature || feature,
        clientId: getScanClientId(),
        path: `${window.location.pathname}${window.location.search}`,
      })),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || !payload.ok || !payload.profileToken) throw new Error(payload.error || 'Verification failed.');
    const next = {
      ...profile,
      profileToken: payload.profileToken,
      tokenExpiresAt: payload.tokenExpiresAt || '',
      serverCaptured: true,
      verified: true,
      verifiedAt: new Date().toISOString(),
      serverCaptureLastTriedAt: new Date().toISOString(),
      serverCaptureStatus: 'verified',
    };
    localStorage.setItem(FREE_PROFILE_TOKEN_KEY, payload.profileToken);
    localStorage.setItem(FIELD_SAVE_ACCOUNT_KEY, JSON.stringify(next));
    rememberSplashLensIdentity({ email: next.email, name: next.name, company: next.company, role: next.role }, 'free_scan_profile_verified');
    trackSplashLensEvent('free_save_profile_server_synced', {
        feature,
        role: next.role || getSplashLensRole() || 'tech',
        verified: true,
      });
    return next;
  } catch {
    trackSplashLensEvent('free_scan_profile_verification_failed', { feature });
    throw new Error('SplashLens could not verify that code. Try again or request a new one.');
  }
}

function ensureFieldSaveAccount(feature = 'saved_job') {
  const existing = getFieldSaveAccount();
  if (existing) {
    rememberSplashLensIdentity({
      email: existing.email,
      name: existing.name || '',
      company: existing.company || '',
      role: getSplashLensRole() || 'tech',
    }, 'free_save_profile_returning');
    syncFieldSaveProfile(existing, feature).catch(() => {});
    return true;
  }

  const wantsProfile = window.confirm(
    feature.startsWith('scan_gate')
      ? `Manual lookup stays free. Create a free SplashLens profile to unlock ${SCAN_LIMIT_FREE} AI scans this month and let us follow up on misses?`
      : 'Manual lookup stays free. Create a free SplashLens profile to save job history and proof on this device?'
  );
  if (!wantsProfile) {
    trackSplashLensEvent('free_save_profile_gate_dismissed', { feature });
    return false;
  }

  const email = String(window.prompt('Email for your free SplashLens save profile:') || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    window.alert('Enter a valid email before using AI scans or saving job history.');
    trackSplashLensEvent('free_save_profile_invalid_email', { feature });
    return false;
  }

  const name = String(window.prompt('Your name (optional):') || '').trim().slice(0, 80);
  const company = String(window.prompt('Company (optional):') || '').trim().slice(0, 120);
  const profile = {
    email,
    name,
    company,
    createdAt: new Date().toISOString(),
    sourceFeature: feature,
    role: getSplashLensRole() || 'tech',
  };
  localStorage.setItem(FIELD_SAVE_ACCOUNT_KEY, JSON.stringify(profile));
  rememberSplashLensIdentity({ email, name, company, role: profile.role }, 'free_save_profile_created');
  syncFieldSaveProfile(profile, feature).catch(() => {});
  trackSplashLensEvent('free_save_profile_created', {
    feature,
    role: profile.role,
    company_provided: Boolean(company),
    name_provided: Boolean(name),
  });
  return true;
}

async function ensureFreeScanProfile(mode = 'ai_scan', result = null, status = null) {
  if (isPartSnapPro()) return true;
  let profile = getFieldSaveAccount();
  const feature = `scan_gate_${mode}`;

  if (!profile && !ensureFieldSaveAccount(feature)) {
    if (status) status.textContent = 'FREE PROFILE REQUIRED FOR AI SCAN';
    if (result) {
      result.innerHTML = `
        <div style="background:#0f172a;border:1px solid #334155;border-left:4px solid #14b8a6;border-radius:14px;padding:18px;margin:0 0 14px;text-align:center;">
          <p style="color:#ccfbf1;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:6px;">Free to start</p>
          <p style="color:#f8fafc;font-size:18px;font-weight:950;line-height:1.15;margin-bottom:8px;">Verify a free profile before AI scanning.</p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:14px;">Manual lookup, calculators, guides, and checklists stay open. PartSnap, Error Scan, and Strip Scan include ${SCAN_LIMIT_FREE} free AI scans each month after email verification so SplashLens can follow up on real misses.</p>
          <button type="button" onclick="ensureFreeScanProfile('${escAttr(mode)}').then(updateAIStatusBar)" style="width:100%;background:#14b8a6;color:#042f2e;border:0;border-radius:10px;padding:12px 10px;font-size:13px;font-weight:950;cursor:pointer;">Verify free profile</button>
        </div>`;
    }
    trackSplashLensEvent('free_scan_profile_required', { mode, feature });
    return false;
  }

  profile = getFieldSaveAccount();
  if (!profile) return false;
  if (!isVerifiedFieldProfile(profile)) {
    if (!navigator.onLine) {
      if (status) status.textContent = 'INTERNET REQUIRED TO VERIFY FREE PROFILE';
      if (result) {
        result.innerHTML = `<div style="background:#450a0a;border:1px solid #dc2626;border-radius:12px;padding:16px;text-align:center;">
          <p style="color:#fecaca;font-size:16px;font-weight:900;margin-bottom:6px;">Verify your free profile online first.</p>
          <p style="color:#fee2e2;font-size:12px;line-height:1.5;">Manual lookup still works offline. AI scans need one email-code verification so free scan limits and product feedback attach to a real contact.</p>
        </div>`;
      }
      trackSplashLensEvent('free_scan_profile_verification_offline', { mode, feature });
      return false;
    }

    try {
      await requestFreeProfileCode(profile, feature);
      window.alert(`SplashLens emailed a 6-digit scanner code to ${profile.email}.`);
      const code = String(window.prompt(`Enter the 6-digit SplashLens code sent to ${profile.email}:`) || '').trim();
      if (!/^\d{6}$/.test(code)) {
        trackSplashLensEvent('free_scan_profile_verification_dismissed', { mode, feature });
        if (status) status.textContent = 'EMAIL VERIFICATION REQUIRED';
        return false;
      }
      profile = await verifyFreeProfileCode(profile, code, feature);
      trackSplashLensEvent('free_scan_profile_verification_completed', { mode, feature });
    } catch (error) {
      if (status) status.textContent = 'EMAIL VERIFICATION NEEDED';
      if (result) {
        result.innerHTML = `<div style="background:#451a03;border:1px solid #f59e0b;border-radius:12px;padding:16px;text-align:center;">
          <p style="color:#fed7aa;font-size:16px;font-weight:900;margin-bottom:6px;">SplashLens could not verify that profile yet.</p>
          <p style="color:#ffedd5;font-size:12px;line-height:1.5;margin-bottom:12px;">${escHtml(error.message || 'Request a fresh code and try again.')}</p>
          <button type="button" onclick="ensureFreeScanProfile('${escAttr(mode)}').then(updateAIStatusBar)" style="width:100%;background:#f59e0b;color:#451a03;border:0;border-radius:10px;padding:11px 8px;font-size:12px;font-weight:900;cursor:pointer;">Try verification again</button>
        </div>`;
      }
      return false;
    }
  }
  rememberSplashLensIdentity({
    email: profile.email,
    name: profile.name || '',
    company: profile.company || '',
    role: profile.role || getSplashLensRole() || 'tech',
  }, 'free_scan_profile');
  await syncFieldSaveProfile(profile, feature);
  return true;
}

let activeVoiceNote = null;

function speechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function voiceStatus(targetId, text, tone = 'muted') {
  let el = document.getElementById(`voice-status-${targetId}`);
  if (!el) {
    const target = document.getElementById(targetId);
    if (!target) return;
    el = document.createElement('div');
    el.id = `voice-status-${targetId}`;
    el.className = 'mic-status';
    target.insertAdjacentElement('afterend', el);
  }
  if (!el) return;
  el.textContent = text || '';
  el.style.color = tone === 'error' ? '#991b1b' : tone === 'ok' ? '#166534' : '#64748b';
}

function appendVoiceText(target, text) {
  const clean = String(text || '').trim();
  if (!target || !clean) return;
  const joiner = target.value && !/\s$/.test(target.value) ? ' ' : '';
  target.value = `${target.value}${joiner}${clean}`;
  target.dispatchEvent(new Event('input', { bubbles: true }));
  target.dispatchEvent(new Event('change', { bubbles: true }));
}

function micSvg() {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><path d="M12 19v3"/></svg>`;
}

function setMicButtonState(btn, listening) {
  if (!btn) return;
  btn.classList.toggle('listening', listening);
  btn.innerHTML = `${micSvg()} ${listening ? 'Stop' : 'Dictate'}`;
}

function voiceNoteButton(targetId) {
  const safeTarget = escAttr(targetId);
  return `<button type="button" class="mic-btn" data-mic-target="${safeTarget}" onclick="toggleVoiceNote('${safeTarget}', this)">${micSvg()} Dictate</button>`;
}

function toggleVoiceNote(targetId, btn) {
  const target = document.getElementById(targetId);
  const Recognition = speechRecognitionCtor();
  if (!target) return;
  if (!Recognition) {
    voiceStatus(targetId, 'Voice dictation is not available in this browser. Use the keyboard mic if your phone shows one.', 'error');
    if (btn) btn.disabled = true;
    return;
  }
  if (activeVoiceNote?.targetId === targetId) {
    activeVoiceNote.recognition.stop();
    return;
  }
  if (activeVoiceNote) activeVoiceNote.recognition.stop();

  const recognition = new Recognition();
  const profile = getLanguageProfile();
  recognition.lang = profile.locale || profile.preferredLanguage || 'en-US';
  recognition.interimResults = true;
  recognition.continuous = false;

  let finalText = '';
  activeVoiceNote = { targetId, recognition, btn };
  setMicButtonState(btn, true);
  target.focus();
  voiceStatus(targetId, 'Listening... say the note, then pause.', 'muted');
  trackSplashLensEvent('voice_note_started', { target: targetId });

  recognition.onresult = (event) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const text = event.results[i][0]?.transcript || '';
      if (event.results[i].isFinal) finalText += text;
      else interim += text;
    }
    voiceStatus(targetId, interim ? `Heard: ${interim.trim()}` : 'Listening...', 'muted');
  };
  recognition.onerror = (event) => {
    voiceStatus(targetId, event.error === 'not-allowed'
      ? 'Microphone permission was blocked. Allow mic access or use the keyboard mic.'
      : 'Voice note stopped. Try again or use the keyboard mic.', 'error');
  };
  recognition.onend = () => {
    if (finalText.trim()) {
      appendVoiceText(target, finalText);
      voiceStatus(targetId, 'Added to note. Review before sending to a customer.', 'ok');
      trackSplashLensEvent('voice_note_completed', { target: targetId });
    } else {
      voiceStatus(targetId, 'No voice text captured. Try again or use the keyboard mic.', 'error');
    }
    setMicButtonState(btn, false);
    if (activeVoiceNote?.targetId === targetId) activeVoiceNote = null;
  };

  try {
    recognition.start();
  } catch {
    setMicButtonState(btn, false);
    activeVoiceNote = null;
    voiceStatus(targetId, 'Voice dictation could not start. Try the keyboard mic.', 'error');
  }
}

function initErrors() {
  renderBrandGrid();
}

function startOperatorWizard(intent) {
  const panel = document.getElementById('operator-wizard-result');
  if (!panel) return;
  const flows = {
    daily: {
      title: 'Daily pool check',
      steps: [
        'Record free chlorine, pH, clarity, temperature, and any required facility readings.',
        'Walk the equipment area: water level, pump basket, unusual noise, leaks, controller alarms.',
        'Document who checked it and when, especially if another staff member is covering.'
      ],
      actions: [
        ['Open Visit Report', 'report'],
        ['Chemical Guide', 'guide']
      ],
      note: 'Use this as the light front door for non-technical staff. Local code, facility policy, and trained CPO procedures still control.'
    },
    dose: {
      title: 'Chemical dose',
      steps: [
        'Confirm pool volume before calculating anything.',
        'Enter current reading and target range, then split larger corrections when needed.',
        'Retest after circulation time and document the adjustment.'
      ],
      actions: [
        ['Open Dosing', 'dosing'],
        ['Set Volume', 'volume']
      ],
      note: 'SplashLens helps with math, but label directions, local rules, and trained judgment still matter.'
    },
    contamination: {
      title: 'Contamination event',
      steps: [
        'Close access to the water and document the time, location, and event type.',
        'Remove visible material using facility-approved PPE and procedures.',
        'Follow the current local health-code, CDC/MAHC, facility, or trainer-approved response before reopening.'
      ],
      actions: [
        ['Document Event', 'report'],
        ['Save / Share Report', 'report']
      ],
      note: 'This is intentionally conservative. SplashLens should route the operator to the approved standard, not invent a reopening decision.'
    },
    pump: {
      title: 'Pump or motor basic check',
      steps: [
        'Do not open energized equipment. Start with visible, non-invasive checks only.',
        'Check water level, skimmer/pump baskets, obvious valve position, breaker/GFCI state, and alarm/code display.',
        'Capture a photo of the pump label or controller display before calling a service tech.'
      ],
      actions: [
        ['Scan Label / Code', 'scan'],
        ['Save Notes', 'report']
      ],
      note: 'Gather visible proof and document the issue before deciding whether qualified service is needed.'
    },
    manual: {
      title: 'Find manual or equipment proof',
      steps: [
        'Photo the model plate, equipment face, controller screen, or QR sticker if present.',
        'Use PartSnap or lookup to identify the equipment family and missing proof.',
        'Save the proof packet before calling support or ordering parts.'
      ],
      actions: [
        ['Open PartSnap', 'partsnap'],
        ['Save Equipment Proof', 'pools']
      ],
      note: 'Keep equipment proof attached to the facility record before ordering parts or requesting support.'
    },
    support: {
      title: 'Escalate to qualified support',
      steps: [
        'Capture the issue, readings, photos, model/serial proof, and what changed recently.',
        'Use a short packet so the expert is not starting cold.',
        'Call the configured support route when the issue is above staff scope or involves safety/code uncertainty.'
      ],
      actions: [
        ['Build Report', 'report'],
        ['Save / Share Report', 'report']
      ],
      note: 'Save or share a complete report through the facility\'s approved support route.'
    }
  };
  const flow = flows[intent] || flows.daily;
  trackSplashLensEvent('operator_pilot_wizard_opened', { intent, title: flow.title });
  panel.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #dbeafe;border-radius:10px;padding:12px;">
      <p style="color:#0369a1;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">CPO / Facility Mode</p>
      <h3 style="color:#0f172a;font-size:15px;font-weight:950;line-height:1.2;margin-bottom:8px;">${escHtml(flow.title)}</h3>
      <div style="display:grid;gap:7px;margin-bottom:10px;">
        ${flow.steps.map((step, index) => `<div style="display:flex;gap:8px;align-items:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:8px;"><b style="display:grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#e0f2fe;color:#0369a1;font-size:11px;flex:0 0 auto;">${index + 1}</b><span style="color:#334155;font-size:12px;line-height:1.4;font-weight:750;">${escHtml(step)}</span></div>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px;">
        ${flow.actions.map(([label, target]) => `<button type="button" data-intent="${escAttr(intent)}" data-action="${escAttr(label)}" data-target="${escAttr(target)}" onclick="selectFacilityWorkflowAction(this.dataset.intent,this.dataset.action,this.dataset.target)" style="background:#0369a1;color:#fff;border:0;border-radius:9px;padding:10px 8px;font-size:12px;font-weight:950;cursor:pointer;">${escHtml(label)}</button>`).join('')}
      </div>
      <div class="operator-alert">${escHtml(flow.note)}</div>
    </div>`;
}

function selectFacilityWorkflowAction(intent, action, target) {
  trackSplashLensEvent('facility_workflow_action_selected', {
    intent: intent || 'unknown',
    action: action || 'unknown',
    target: target || 'report',
  });
  if (target === 'partsnap') {
    showTab('scan');
    setTimeout(() => setScanMode('parts'), 80);
    return;
  }
  showTab(target || 'report');
}

function renderBrandGrid() {
  const el = document.getElementById('brand-grid');
  el.innerHTML = Object.entries(window.ERROR_DB).map(([id, b]) =>
    `<button class="brand-btn" id="brand-${id}" onclick="selectBrand('${id}')">${b.label}</button>`
  ).join('');
}

function selectBrand(id) {
  // Toggle off
  if (S.brand === id) {
    resetBrandBtn(id);
    S.brand = null;
    S.category = null;
    document.getElementById('category-strip').style.display = 'none';
    document.getElementById('error-results').innerHTML = emptyState();
    document.getElementById('error-search').value = '';
    document.getElementById('search-clear').style.display = 'none';
    return;
  }
  // Deactivate previous
  if (S.brand) resetBrandBtn(S.brand);
  S.brand = id;
  S.category = null;
  // Activate selected
  const brand = window.ERROR_DB[id];
  const btn = document.getElementById(`brand-${id}`);
  btn.style.background = brand.color + '22';
  btn.style.borderColor = brand.color;
  btn.style.color = brand.color;
  renderCategoryStrip(id);
  renderCodesForBrand(id, null);
  window.SplashLensFieldSignals?.onBrandSelected({
    brand: brand.label || id,
    category: Object.keys(brand.categories || {}).join(' '),
  });
}

function resetBrandBtn(id) {
  const btn = document.getElementById(`brand-${id}`);
  if (!btn) return;
  btn.style.background = '';
  btn.style.borderColor = '';
  btn.style.color = '';
}

function renderCategoryStrip(brandId) {
  const brand = window.ERROR_DB[brandId];
  const cats  = Object.keys(brand.categories);
  const strip = document.getElementById('category-strip');
  strip.style.display = '';
  strip.innerHTML = `<div style="display:flex;gap:7px;padding:2px 0;">
    <button class="cat-pill active" id="cat-all" onclick="selectCategory(null)">All</button>
    ${cats.map(c => `<button class="cat-pill" id="cat-${slug(c)}" onclick="selectCategory('${esc(c)}')">${c}</button>`).join('')}
  </div>`;
}

function selectCategory(cat) {
  S.category = cat;
  document.querySelectorAll('.cat-pill').forEach(p => p.classList.remove('active'));
  const targetId = cat ? `cat-${slug(cat)}` : 'cat-all';
  const target = document.getElementById(targetId);
  if (target) target.classList.add('active');
  if (S.brand) renderCodesForBrand(S.brand, cat);
}

function renderCodesForBrand(brandId, catFilter) {
  const brand = window.ERROR_DB[brandId];
  let html = '';
  Object.entries(brand.categories).forEach(([catName, cat]) => {
    if (catFilter && catName !== catFilter) return;
    html += `
      <div style="margin-bottom:20px;">
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:9px;">
          <span style="width:10px;height:10px;border-radius:50%;background:${brand.color};flex-shrink:0;display:inline-block;"></span>
          <span style="color:#0f172a;font-weight:800;font-size:13px;">${catName}</span>
        </div>
        ${cat.note ? `<div class="warn-box" style="margin-bottom:8px;font-size:11px;">${cat.note}</div>` : ''}
        <p style="color:#64748b;font-size:11px;margin-bottom:8px;">Models: ${cat.models.slice(0,5).join(' · ')}${cat.models.length > 5 ? ` +${cat.models.length - 5}` : ''}</p>
        ${cat.codes.map((c, i) => codeCard(c, `${brandId}-${slug(catName)}-${i}`, brand.color)).join('')}
      </div>`;
  });
  if (!html) html = `<p style="color:#64748b;text-align:center;padding:32px;">No codes in this category.</p>`;
  document.getElementById('error-results').innerHTML = html;
}

function codeCard(code, uid, brandColor) {
  const isLED = code.code.startsWith('LED:') || code.code.startsWith('No ');
  const sevClass = { low: 'badge-low', medium: 'badge-med', high: 'badge-high' }[code.severity] || 'badge-med';
  const causes = (code.causes || []).slice(0, 5);
  const fixes = (code.fix || []).slice(0, 6);
  return `
    <div class="error-card" style="border-left:3px solid ${brandColor};">
      <button class="error-toggle" onclick="toggleCode('${uid}')">
        <div style="flex:1;">
          <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:5px;align-items:center;">
            <span class="badge ${isLED ? 'badge-led' : ''}" style="${!isLED ? `background:#f1f5f9;color:#374151;border:1px solid #e2e8f0;font-size:11px;` : ''}">${code.code}</span>
            <span class="badge ${sevClass}">${code.severity}</span>
            ${code.callpro ? `<span class="badge badge-pro">Call Pro</span>` : ''}
          </div>
          <span style="color:#1e293b;font-size:14px;font-weight:600;">${code.name}</span>
        </div>
        <svg id="chev-${uid}" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;margin-top:3px;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
      </button>
      <div id="det-${uid}" class="error-detail">
        <div style="padding-top:12px;">
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;">Check first</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:7px;">
            ${causes.map((c, i) => `<div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;padding:9px;min-height:62px;"><span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#fed7aa;color:#9a3412;font-size:11px;font-weight:950;margin-bottom:5px;">${i+1}</span><p style="font-size:12px;line-height:1.28;color:#7c2d12;font-weight:800;">${c}</p></div>`).join('')}
          </div>
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 7px;">Do next</p>
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(118px,1fr));gap:7px;">
            ${fixes.map((f, i) => `<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:9px;min-height:62px;"><span style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#0284c7;color:#fff;font-size:11px;font-weight:950;margin-bottom:5px;">${i+1}</span><p style="font-size:12px;line-height:1.28;color:#1e3a8a;font-weight:800;">${f}</p></div>`).join('')}
          </div>
          ${code.callpro ? `<div class="badge-pro" style="margin-top:10px;padding:8px 10px;border-radius:8px;font-size:12px;font-weight:600;text-transform:none;letter-spacing:0;">⚠ This fault typically requires a licensed technician. Do not bypass safety controls.</div>` : ''}
        </div>
      </div>
    </div>`;
}

function toggleCode(uid) {
  const det  = document.getElementById(`det-${uid}`);
  const chev = document.getElementById(`chev-${uid}`);
  const open = det.classList.toggle('open');
  chev.style.transform = open ? 'rotate(180deg)' : '';
  if (open) {
    window.SplashLensFieldSignals?.onCodeOpened({
      description: det.closest('.error-card')?.textContent || '',
    });
  }
}

function onErrorSearch(q) {
  q = q.trim().toLowerCase();
  if (q.length >= 3) window.SplashLensFieldSignals?.onSearch(q);
  const clearBtn = document.getElementById('search-clear');
  clearBtn.style.display = q ? '' : 'none';
  if (!q) {
    if (S.brand) renderCodesForBrand(S.brand, S.category);
    else document.getElementById('error-results').innerHTML = emptyState();
    return;
  }
  const matches = [];
  Object.entries(window.ERROR_DB).forEach(([brandId, brand]) => {
    Object.entries(brand.categories).forEach(([catName, cat]) => {
      cat.codes.forEach((code, i) => {
        const hay = [code.code, code.name, ...code.causes, ...code.fix].join(' ').toLowerCase();
        if (hay.includes(q)) matches.push({ brandId, brand, catName, code, i });
      });
    });
  });
  if (!matches.length) {
    document.getElementById('error-results').innerHTML =
      `<p style="color:#64748b;text-align:center;padding:40px;font-size:14px;">No results for "${q}"</p>`;
    return;
  }
  document.getElementById('error-results').innerHTML = matches.map(({ brandId, brand, catName, code, i }) =>
    `<div style="margin-bottom:4px;">
       <p style="color:#64748b;font-size:11px;margin-bottom:3px;display:flex;align-items:center;gap:5px;">
         <span style="width:7px;height:7px;border-radius:50%;background:${brand.color};display:inline-block;"></span>
         ${brand.label} — ${catName}
       </p>
       ${codeCard(code, `srch-${brandId}-${i}`, brand.color)}
     </div>`
  ).join('');
  if (q.length >= 2 && onErrorSearch._lastTracked !== q) {
    onErrorSearch._lastTracked = q;
    trackSplashLensEvent('manual_code_search', {
      query: q.slice(0, 40),
      brand: S.brand || 'all',
      result_count: matches.length,
      surface: 'error_search',
    });
    trackSplashLensEvent('first_value_completed', {
      role: getSplashLensRole(),
      workflow: 'manual_code_search',
      result_count: matches.length,
      time_back_message: 'Code path found without leaving the stop.',
    });
  }
}

function clearSearch() {
  const el = document.getElementById('error-search');
  el.value = '';
  document.getElementById('search-clear').style.display = 'none';
  if (S.brand) renderCodesForBrand(S.brand, S.category);
  else document.getElementById('error-results').innerHTML = emptyState();
  el.focus();
}

function emptyState() {
  return `<div style="text-align:center;padding:40px 16px;">
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.5" style="margin:0 auto 14px;display:block;"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
    <p style="font-size:15px;color:#475569;margin-bottom:5px;font-weight:600;">Pick a brand or search</p>
    <p style="font-size:12px;color:#94a3b8;">Hayward · Pentair · Jandy · Maytronics · Aiper · Raypak</p>
  </div>`;
}

// ═══════════════════════════════════════════
// DOSING CALCULATOR
// ═══════════════════════════════════════════
function initDosing() {
  renderSlamBanner();
  renderSlamTypeBtns();
  renderSlamProducts();
  renderRangesTable();
  renderAdditionOrder();
  renderSaltSection();
  renderDangerSection();
  renderProductLineHelper();
}

function onParamChange() {
  const p = document.getElementById('dose-param').value;
  let html = '';
  const fld = (label, id, ph, extra = '') =>
    `<div class="field-group"><label class="field-label">${label}</label>
     <input type="number" id="${id}" placeholder="${ph}" min="0" inputmode="decimal" ${extra}></div>`;
  const sel = (label, id, opts) =>
    `<div class="field-group"><label class="field-label">${label}</label>
     <select id="${id}" onchange="renderProductLineHelper()">${opts}</select></div>`;

  switch (p) {
    case 'fc':
      html += fld('Current FC (ppm)', 'dose-cur', 'e.g. 1');
      html += fld('Target FC (ppm)', 'dose-tgt', 'e.g. 5');
      html += sel('Chlorine Product', 'dose-prod',
        window.CHEM_DATA.dosing.fc.products.map(x => `<option value="${x.id}">${x.label} (${x.unit})</option>`).join(''));
      break;
    case 'ph_lower':
      html += fld('Current pH', 'dose-cur', 'e.g. 7.8', 'step="0.1"');
      html += fld('Target pH', 'dose-tgt', 'e.g. 7.4', 'step="0.1"');
      html += fld('TA Level (ppm)', 'dose-ta', 'e.g. 100');
      html += sel('Product', 'dose-prod',
        window.CHEM_DATA.dosing.ph.lower.map(x => `<option value="${x.id}">${x.label}</option>`).join(''));
      break;
    case 'ph_raise':
      html += fld('Current pH', 'dose-cur', 'e.g. 7.2', 'step="0.1"');
      html += fld('Target pH', 'dose-tgt', 'e.g. 7.4', 'step="0.1"');
      html += sel('Product', 'dose-prod',
        window.CHEM_DATA.dosing.ph.raise.map(x => `<option value="${x.id}">${x.label}</option>`).join(''));
      break;
    case 'ta':
      html += fld('Current TA (ppm)', 'dose-cur', 'e.g. 60');
      html += fld('Target TA (ppm)', 'dose-tgt', 'e.g. 100');
      break;
    case 'ch':
      html += fld('Current CH (ppm)', 'dose-cur', 'e.g. 150');
      html += fld('Target CH (ppm)', 'dose-tgt', 'e.g. 300');
      break;
    case 'cya':
      html += fld('Current CYA (ppm)', 'dose-cur', 'e.g. 20');
      html += fld('Target CYA (ppm)', 'dose-tgt', 'e.g. 50');
      break;
  }
  document.getElementById('dose-fields').innerHTML = html;
  document.getElementById('dose-result').innerHTML = '';
  renderProductLineHelper();
  seedLsiFromDoseInputs();
}

function calculateDose() {
  const param  = gv('dose-param');
  const volume = gf('dose-volume');
  const cur    = gf('dose-cur');
  const tgt    = gf('dose-tgt');

  if (!param)        return setEl('dose-result', errorBox('Select a parameter first.'));
  if (!volume || volume <= 0) return setEl('dose-result', errorBox('Enter pool volume in gallons.'));
  if (isNaN(cur) || isNaN(tgt)) return setEl('dose-result', errorBox('Enter current and target levels.'));

  const vf = volume / 10000;
  let amount, unit, product, note, basis;

  switch (param) {
    case 'fc': {
      const delta = tgt - cur;
      if (delta <= 0) return setEl('dose-result', infoBox('FC is at or above target.', 'Stop adding chlorine. Let sunlight and usage reduce it naturally. Do not add sequestrants.'));
      const pid = gv('dose-prod');
      const p   = window.CHEM_DATA.dosing.fc.products.find(x => x.id === pid);
      if (!p)   return setEl('dose-result', errorBox('Select a product.'));
      amount  = delta * vf * p.factor;
      unit    = p.unit;
      product = p.label;
      note    = p.note;
      basis   = `${volume.toLocaleString()} gal · raising FC by ${delta.toFixed(1)} ppm`;
      break;
    }
    case 'ph_lower': {
      const delta = cur - tgt;
      if (delta <= 0) return setEl('dose-result', infoBox('pH is at or below target.', ''));
      const ta     = gf('dose-ta') || 100;
      const pid    = gv('dose-prod');
      if (pid === 'muriaticAcid') {
        amount  = (delta / 0.1) * vf * interpMuriatic(ta);
        unit    = 'fl oz';
        product = 'Muriatic Acid 31.45%';
        note    = 'Pre-dilute in a bucket of water first. Add slowly with pump running. Wait 30 min and retest.';
      } else {
        const murOz = (delta / 0.1) * vf * interpMuriatic(ta);
        amount  = murOz * 0.80;
        unit    = 'oz dry';
        product = 'Dry Acid (Sodium Bisulfate)';
        note    = 'Broadcast across surface with pump running. Safer to handle than muriatic.';
      }
      basis = `${volume.toLocaleString()} gal · lowering pH by ${delta.toFixed(2)} · TA ${ta} ppm`;
      break;
    }
    case 'ph_raise': {
      const delta = tgt - cur;
      if (delta <= 0) return setEl('dose-result', infoBox('pH is at or above target.', ''));
      amount  = (delta / 0.1) * vf * window.CHEM_DATA.dosing.ph.sodaAshFactor;
      unit    = 'oz dry';
      product = 'Soda Ash (pH Up)';
      note    = 'Broadcast across the deep end with pump running. Also raises TA slightly.';
      basis   = `${volume.toLocaleString()} gal · raising pH by ${delta.toFixed(2)}`;
      break;
    }
    case 'ta': {
      const delta = tgt - cur;
      if (delta <= 0) return setEl('dose-result', infoBox('TA is at or above target.', 'To lower TA: add muriatic acid, then aerate to bring pH back up. Multiple doses needed.'));
      amount  = (delta / 10) * vf * window.CHEM_DATA.dosing.ta.raise[0].factor;
      unit    = 'lbs';
      product = 'Baking Soda (Sodium Bicarbonate)';
      note    = 'Broadcast across the surface. Retest in 1 hour. Minor pH rise expected.';
      basis   = `${volume.toLocaleString()} gal · raising TA by ${delta} ppm`;
      break;
    }
    case 'ch': {
      const delta = tgt - cur;
      if (delta <= 0) return setEl('dose-result', infoBox('CH is at or above target.', 'Only way to lower CH is to drain and dilute with fresh water.'));
      amount  = (delta / 10) * vf * window.CHEM_DATA.dosing.ch.raise[0].factor;
      unit    = 'lbs';
      product = 'Calcium Chloride';
      note    = '⚠ Extremely exothermic. Always pre-dissolve in a bucket of water before adding. Never add dry directly to pool.';
      basis   = `${volume.toLocaleString()} gal · raising CH by ${delta} ppm`;
      break;
    }
    case 'cya': {
      const delta = tgt - cur;
      if (delta <= 0) return setEl('dose-result', infoBox('CYA is at or above target.', 'To lower CYA: drain 20-30% and refill. No chemical removes CYA.'));
      amount  = (delta / 10) * vf * window.CHEM_DATA.dosing.cya.raise[0].factor;
      unit    = 'lbs';
      product = 'Cyanuric Acid (Stabilizer)';
      note    = 'Place in a sock in the skimmer basket. Dissolves slowly — takes 1-2 weeks. Retest accurately after 7 days.';
      basis   = `${volume.toLocaleString()} gal · raising CYA by ${delta} ppm`;
      break;
    }
  }

  if (!amount || amount <= 0) return setEl('dose-result', errorBox('No addition needed or check your inputs.'));
  setEl('dose-result', resultCard(amount, unit, product, note, basis) + doseSupportCard(param, product, amount, unit));
  renderProductLineHelper();
  seedLsiFromDoseInputs();
  calculateLsiPreview({ quiet: true });
}

function resultCard(amount, unit, product, note, basis) {
  const { main, alt } = fmtAmt(amount, unit);
  const raw = main;
  return `
    <div class="result-wrap">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;">
        <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Dose Required</p>
        <button class="copy-btn" onclick="copyText('${raw.replace(/'/g, "\\'")}', this)">Copy</button>
      </div>
      <p class="result-amount">${main}</p>
      ${alt ? `<p class="result-alt">${alt}</p>` : ''}
      <p class="result-product">${product}</p>
      ${note ? `<div class="result-note">${note}</div>` : ''}
      <p class="result-basis">${basis}</p>
    </div>`;
}

function getDoseNeed() {
  const param = gv('dose-param');
  return param || '';
}

function productLineNotes(lineKey, needKey) {
  const line = PRODUCT_LINE_HELPER[lineKey] || PRODUCT_LINE_HELPER.generic;
  return line.notes[needKey] || line.notes.default || PRODUCT_LINE_HELPER.generic.notes[needKey] || [];
}

function renderProductLineHelper() {
  const el = document.getElementById('dose-line-helper');
  if (!el) return;
  const need = getDoseNeed();
  const lineKey = gv('dose-line') || 'generic';
  const line = PRODUCT_LINE_HELPER[lineKey] || PRODUCT_LINE_HELPER.generic;
  if (!need) {
    el.innerHTML = 'Select what you are adjusting, then choose the product line on the truck. SplashLens will translate the chemistry need into likely product names and active ingredients.';
    return;
  }
  const notes = productLineNotes(lineKey, need);
  el.innerHTML = `
    <div style="display:grid;grid-template-columns:1fr;gap:7px;">
      <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:9px;">
        <p style="color:#0f172a;font-weight:900;font-size:12px;margin-bottom:3px;">${escHtml(line.label)} - ${escHtml(DOSE_NEED_LABELS[need] || 'Dose')}</p>
        ${notes.map(n => `<p style="color:#334155;font-size:12px;line-height:1.45;margin-top:4px;">${escHtml(n)}</p>`).join('')}
      </div>
    </div>`;
}

function doseSupportCard(param, product, amount, unit) {
  const lineKey = gv('dose-line') || 'generic';
  const notes = productLineNotes(lineKey, param);
  const formatted = fmtAmt(amount, unit).main;
  return `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-top:10px;">
      <p style="color:#0369a1;font-weight:900;font-size:12px;margin-bottom:6px;">Field Dose Check</p>
      <p style="color:#334155;font-size:12px;line-height:1.45;">Add <strong>${escHtml(formatted)}</strong> of <strong>${escHtml(product)}</strong>. Match the product label to the active ingredient before pouring.</p>
      ${notes[0] ? `<p style="color:#64748b;font-size:11px;line-height:1.45;margin-top:6px;">${escHtml(notes[0])}</p>` : ''}
    </div>`;
}

function seedLsiFromDoseInputs() {
  const param = gv('dose-param');
  const cur = gf('dose-cur');
  const tgt = gf('dose-tgt');
  const ta = gf('dose-ta');
  const setIfEmpty = (id, value) => {
    const el = document.getElementById(id);
    if (el && !el.value && !isNaN(value) && value > 0) el.value = value;
  };
  if (param === 'ph_lower' || param === 'ph_raise') setIfEmpty('lsi-ph', cur || tgt);
  if (param === 'ta') setIfEmpty('lsi-ta', cur || tgt);
  if (param === 'ch') setIfEmpty('lsi-ch', cur || tgt);
  if (param === 'cya') setIfEmpty('lsi-cya', cur || tgt);
  if (param === 'ph_lower' && !isNaN(ta) && ta > 0) setIfEmpty('lsi-ta', ta);
}

function calculateLsiValue(v) {
  const ph = Number(v.ph);
  const ch = Math.max(Number(v.ch) || 0, 1);
  const cya = Math.max(Number(v.cya) || 0, 0);
  const taRaw = Math.max(Number(v.ta) || 0, 1);
  const temp = Number(v.temp) || 80;
  const salt = Number(v.salt) || 1000;
  const adjTa = Math.max(taRaw - (cya * 0.33), 1);
  const tempFactor = temp < 60 ? 0.6 : temp < 70 ? 0.7 : temp < 80 ? 0.8 : temp < 90 ? 0.9 : 1.0;
  const calciumFactor = Math.log10(ch) - 0.4;
  const alkalinityFactor = Math.log10(adjTa);
  const tdsFactor = salt > 3000 ? 12.2 : 12.1;
  return ph + tempFactor + calciumFactor + alkalinityFactor - tdsFactor;
}

function lsiVerdict(v) {
  if (v < -0.3) return { label: 'corrosive risk', color: '#991b1b', bg: '#fee2e2' };
  if (v > 0.3) return { label: 'scale risk', color: '#9a3412', bg: '#ffedd5' };
  return { label: 'balanced', color: '#166534', bg: '#dcfce7' };
}

function calculateLsiPreview(opts = {}) {
  const base = {
    ph: gf('lsi-ph'), ta: gf('lsi-ta'), ch: gf('lsi-ch'), cya: gf('lsi-cya'),
    temp: gf('lsi-temp') || 80, salt: gf('lsi-salt') || 1000
  };
  if ([base.ph, base.ta, base.ch].some(v => isNaN(v) || v <= 0)) {
    if (!opts.quiet) setEl('lsi-preview', errorBox('Enter at least pH, TA, and CH for a balance preview.'));
    return null;
  }

  const after = { ...base };
  const param = gv('dose-param');
  const tgt = gf('dose-tgt');
  if (!isNaN(tgt) && tgt > 0) {
    if (param === 'ph_lower' || param === 'ph_raise') after.ph = tgt;
    if (param === 'ta') after.ta = tgt;
    if (param === 'ch') after.ch = tgt;
    if (param === 'cya') after.cya = tgt;
  }

  const beforeVal = calculateLsiValue(base);
  const afterVal = calculateLsiValue(after);
  const before = lsiVerdict(beforeVal);
  const afterVerdict = lsiVerdict(afterVal);
  const pill = document.getElementById('lsi-status-pill');
  if (pill) {
    pill.textContent = afterVerdict.label;
    pill.style.background = afterVerdict.bg;
    pill.style.color = afterVerdict.color;
  }
  setEl('lsi-preview', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
      <div style="background:${before.bg};border-radius:8px;padding:10px;">
        <p style="color:${before.color};font-size:10px;font-weight:900;text-transform:uppercase;">Before</p>
        <p style="color:${before.color};font-size:22px;font-weight:900;">${beforeVal.toFixed(2)}</p>
        <p style="color:${before.color};font-size:11px;font-weight:800;">${before.label}</p>
      </div>
      <div style="background:${afterVerdict.bg};border-radius:8px;padding:10px;">
        <p style="color:${afterVerdict.color};font-size:10px;font-weight:900;text-transform:uppercase;">After dose</p>
        <p style="color:${afterVerdict.color};font-size:22px;font-weight:900;">${afterVal.toFixed(2)}</p>
        <p style="color:${afterVerdict.color};font-size:11px;font-weight:800;">${afterVerdict.label}</p>
      </div>
    </div>
    <p style="color:#64748b;font-size:11px;line-height:1.45;margin-top:8px;">Uses cyanurate-adjusted alkalinity and field factors. If the after number is outside -0.30 to +0.30, retest and split the dose.</p>`);
  return { before: beforeVal, after: afterVal };
}

// ═══════════════════════════════════════════
// SLAM CALCULATOR
// ═══════════════════════════════════════════
function renderSlamTypeBtns() {
  document.getElementById('slam-type-btns').innerHTML =
    Object.entries(window.CHEM_DATA.slam).map(([id, t]) =>
      `<button class="slam-btn" id="slam-${id}" onclick="selectSlamType('${id}')">${t.label}</button>`
    ).join('');
}

function renderSlamProducts() {
  const opts = window.CHEM_DATA.dosing.fc.products
    .filter(p => p.unit === 'fl oz')
    .map(p => `<option value="${p.id}">${p.label}</option>`).join('');
  document.getElementById('slam-product').innerHTML = opts;
}

function selectSlamType(id) {
  S.slamType = id;
  document.querySelectorAll('.slam-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById(`slam-${id}`);
  if (btn) btn.classList.add('active');
}

function calculateSlam() {
  const cya  = gf('slam-cya');
  const curFC = gf('slam-current-fc');
  const vol  = gf('slam-volume');
  const pid  = gv('slam-product');

  if (isNaN(cya) || cya <= 0) return setEl('slam-result', errorBox('Enter your CYA level.'));
  if (!S.slamType)             return setEl('slam-result', errorBox('Select a SLAM type.'));
  if (isNaN(vol) || vol <= 0)  return setEl('slam-result', errorBox('Enter pool volume.'));

  const def     = window.CHEM_DATA.slam[S.slamType];
  const targetFC = Math.round(cya * def.mult);
  const currentFC = isNaN(curFC) ? 0 : curFC;
  const delta    = Math.max(0, targetFC - currentFC);
  const product  = window.CHEM_DATA.dosing.fc.products.find(p => p.id === pid);

  let addHtml = '';
  if (delta > 0 && product) {
    const amt = delta * (vol / 10000) * product.factor;
    const { main, alt } = fmtAmt(amt, product.unit);
    addHtml = `
      <div class="result-wrap" style="margin-top:12px;">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;">
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Add Now</p>
          <button class="copy-btn" onclick="copyText('${main.replace(/'/g, "\\'")}', this)">Copy</button>
        </div>
        <p class="result-amount">${main}</p>
        ${alt ? `<p class="result-alt">${alt}</p>` : ''}
        <p class="result-product">${product.label}</p>
      </div>`;
  } else if (delta === 0) {
    addHtml = `<div class="info-box" style="margin-top:10px;">FC is already at SLAM level. Maintain and test every 4-6 hours.</div>`;
  }

  setEl('slam-result', `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:14px;margin-bottom:12px;">${def.label}</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;">
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">SLAM Target FC</p>
          <p style="color:#0f172a;font-size:28px;font-weight:900;">${targetFC} <span style="font-size:14px;color:#64748b;">ppm</span></p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:12px;text-align:center;">
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:5px;">Need to Add</p>
          <p style="color:${delta > 0 ? '#d97706' : '#166534'};font-size:28px;font-weight:900;">${delta} <span style="font-size:14px;color:#64748b;">ppm</span></p>
        </div>
      </div>
      ${addHtml}
      <div class="info-box" style="margin-top:10px;font-size:11px;">${def.note}</div>
      <p style="color:#94a3b8;font-size:10px;margin-top:8px;">OCLT: After SLAM, test FC at dusk and dawn. Pass = loss &lt; 1 ppm overnight.</p>
      <button onclick="startSlamTracker(${targetFC},'${S.slamType}',${vol},${cya})"
        style="width:100%;margin-top:12px;padding:14px;background:#92400e;color:#fef3c7;border:none;border-radius:10px;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:.02em;">
        ▶ Start SLAM Tracker (Multi-Day)
      </button>
    </div>`);
}

// ═══════════════════════════════════════════
// SLAM MULTI-DAY TRACKER
// ═══════════════════════════════════════════
const SLAM_KEY = 'poolens-slam';

function getSlamState() {
  try { return JSON.parse(localStorage.getItem(SLAM_KEY)) || null; } catch { return null; }
}
function saveSlamState(s) { localStorage.setItem(SLAM_KEY, JSON.stringify(s)); }
function clearSlamState() { localStorage.removeItem(SLAM_KEY); }

function startSlamTracker(targetFC, slamType, poolVolume, cya) {
  const existing = getSlamState();
  if (existing?.active) {
    if (!confirm('A SLAM is already in progress. Start a new one?')) return;
  }
  const state = {
    active:        true,
    startDate:     new Date().toISOString(),
    slamType,
    targetFC,
    poolVolume,
    cya,
    checks:        [],
    oclt:          { dusk: null, dawn: null },
    completed:     false,
    completedDate: null,
  };
  saveSlamState(state);
  renderSlamBanner();
  setEl('slam-result', `
    <div style="background:#fefce8;border:1px solid #fde68a;border-radius:12px;padding:16px;text-align:center;">
      <p style="color:#92400e;font-weight:800;font-size:14px;margin-bottom:6px;">SLAM Tracker Started</p>
      <p style="color:#78350f;font-size:13px;">Check FC every 4-6 hours. Maintain at ${targetFC} ppm. Use the banner at the top of this tab to log readings.</p>
    </div>`);
}

function renderSlamBanner() {
  const el = document.getElementById('slam-banner');
  if (!el) return;
  const s = getSlamState();
  if (!s?.active) { el.style.display = 'none'; return; }
  el.style.display = 'block';

  const dayNum    = Math.floor((Date.now() - new Date(s.startDate)) / 86400000) + 1;
  const lastCheck = s.checks.length ? s.checks[s.checks.length - 1] : null;
  const lastFC    = lastCheck ? `${lastCheck.fc} ppm` : '—';
  const lastTime  = lastCheck ? new Date(lastCheck.time).toLocaleTimeString([], {hour:'2-digit',minute:'2-digit'}) : '—';
  const passCount = s.checks.filter(c => c.pass).length;
  const checkCount = s.checks.length;
  const ocltReady  = passCount >= 2 && checkCount >= 4;

  const conditionsMet = s.oclt.dusk && s.oclt.dawn && (s.oclt.dusk - s.oclt.dawn) <= 1;

  el.innerHTML = `
    <div style="background:linear-gradient(135deg,#78350f,#92400e);border-radius:12px;padding:14px;color:#fff;">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
        <div>
          <span style="background:#fbbf24;color:#78350f;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:800;">SLAM DAY ${dayNum}</span>
          <p style="font-size:16px;font-weight:900;margin-top:4px;">Target FC: ${s.targetFC} ppm</p>
        </div>
        <button onclick="if(confirm('End SLAM and clear tracker?')){clearSlamState();renderSlamBanner();}" style="background:rgba(255,255,255,0.15);color:#fff;border:1px solid rgba(255,255,255,0.3);border-radius:8px;padding:6px 12px;font-size:11px;cursor:pointer;">End SLAM</button>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:12px;">
        <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;text-align:center;">
          <p style="font-size:9px;opacity:.7;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Last FC</p>
          <p style="font-size:18px;font-weight:900;">${lastFC}</p>
          <p style="font-size:9px;opacity:.6;">${lastTime}</p>
        </div>
        <div style="background:rgba(0,0,0,0.2);border-radius:8px;padding:8px;text-align:center;">
          <p style="font-size:9px;opacity:.7;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Checks</p>
          <p style="font-size:18px;font-weight:900;">${checkCount}</p>
          <p style="font-size:9px;opacity:.6;">${passCount} passed</p>
        </div>
        <div style="background:${ocltReady?'rgba(21,128,61,0.4)':'rgba(0,0,0,0.2)'};border-radius:8px;padding:8px;text-align:center;">
          <p style="font-size:9px;opacity:.7;font-weight:700;text-transform:uppercase;margin-bottom:3px;">OCLT</p>
          <p style="font-size:18px;font-weight:900;">${s.oclt.dawn !== null ? '✓' : ocltReady ? '→' : '⏳'}</p>
          <p style="font-size:9px;opacity:.6;">${s.oclt.dawn !== null ? 'Done' : ocltReady ? 'Ready' : 'Hold'}</p>
        </div>
      </div>
      <div id="slam-checkin-form">
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="slam-fc-reading" type="number" placeholder="FC ppm" inputmode="decimal" min="0" max="50"
            style="flex:1;padding:12px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:16px;font-weight:700;outline:none;"
            onkeydown="if(event.key==='Enter')logSlamCheckIn()">
          <button onclick="logSlamCheckIn()" style="padding:12px 16px;background:#fbbf24;color:#78350f;border:none;border-radius:8px;font-size:14px;font-weight:800;cursor:pointer;white-space:nowrap;">Log FC</button>
        </div>
      </div>
      ${s.checks.length > 0 ? `
        <div style="margin-top:10px;max-height:120px;overflow-y:auto;">
          ${[...s.checks].reverse().slice(0,5).map(c => `
            <div style="display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.08);">
              <span style="font-size:12px;opacity:.7;">${new Date(c.time).toLocaleString([],{month:'numeric',day:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
              <span style="font-size:14px;font-weight:700;color:${c.pass?'#86efac':'#fca5a5'};">${c.fc} ppm ${c.pass?'✓':'✗'}</span>
            </div>`).join('')}
        </div>` : ''}
      ${ocltReady && !s.oclt.dusk ? `
        <div style="margin-top:10px;background:rgba(21,128,61,0.3);border:1px solid rgba(134,239,172,0.3);border-radius:8px;padding:12px;">
          <p style="font-size:12px;font-weight:700;margin-bottom:8px;">🌅 Ready for OCLT — Log Dusk FC</p>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="slam-dusk-fc" type="number" placeholder="Dusk FC" inputmode="decimal" min="0" max="50"
              style="flex:1;padding:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:16px;font-weight:700;outline:none;">
            <button onclick="logSlamOCLT('dusk')" style="padding:10px 14px;background:#86efac;color:#14532d;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;">Log Dusk</button>
          </div>
        </div>` : ''}
      ${s.oclt.dusk && !s.oclt.dawn ? `
        <div style="margin-top:10px;background:rgba(30,64,175,0.3);border:1px solid rgba(147,197,253,0.3);border-radius:8px;padding:12px;">
          <p style="font-size:12px;font-weight:700;margin-bottom:4px;">🌄 Log Dawn FC (next morning)</p>
          <p style="font-size:11px;opacity:.7;margin-bottom:8px;">Dusk reading: ${s.oclt.dusk} ppm · Pass = loss &lt; 1 ppm</p>
          <div style="display:flex;gap:8px;align-items:center;">
            <input id="slam-dawn-fc" type="number" placeholder="Dawn FC" inputmode="decimal" min="0" max="50"
              style="flex:1;padding:10px;background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.2);border-radius:8px;color:#fff;font-size:16px;font-weight:700;outline:none;">
            <button onclick="logSlamOCLT('dawn')" style="padding:10px 14px;background:#93c5fd;color:#1e3a8a;border:none;border-radius:8px;font-size:13px;font-weight:800;cursor:pointer;">Log Dawn</button>
          </div>
        </div>` : ''}
      ${conditionsMet ? `
        <div style="margin-top:10px;background:rgba(21,128,61,0.4);border:1px solid rgba(134,239,172,0.4);border-radius:8px;padding:14px;text-align:center;">
          <p style="font-size:16px;font-weight:900;margin-bottom:4px;">SLAM COMPLETE</p>
          <p style="font-size:12px;opacity:.8;margin-bottom:10px;">FC loss ${s.oclt.dusk - s.oclt.dawn} ppm — OCLT PASSED</p>
          <button onclick="clearSlamState();renderSlamBanner();" style="background:#86efac;color:#14532d;border:none;border-radius:8px;padding:10px 20px;font-size:14px;font-weight:800;cursor:pointer;">Close Tracker</button>
        </div>` : ''}
    </div>`;
}

function logSlamCheckIn() {
  const input = document.getElementById('slam-fc-reading');
  const fc = parseFloat(input?.value);
  if (isNaN(fc) || fc < 0 || fc > 50) { if (input) input.focus(); return; }
  const s = getSlamState();
  if (!s) return;
  const pass = fc >= s.targetFC;
  s.checks.push({ time: new Date().toISOString(), fc, pass });
  saveSlamState(s);
  if (input) input.value = '';
  renderSlamBanner();
  if (!pass) {
    // Brief feedback
    const lbl = document.createElement('p');
    lbl.style.cssText = 'color:#fca5a5;font-size:12px;margin-top:6px;text-align:center;';
    lbl.textContent = `FC below target (${s.targetFC} ppm) — dose and retest in 4-6 hrs`;
    document.getElementById('slam-banner')?.querySelector('input')?.insertAdjacentElement('afterend', lbl);
    setTimeout(() => lbl.remove(), 4000);
  }
}

function logSlamOCLT(type) {
  const input = document.getElementById(`slam-${type}-fc`);
  const fc = parseFloat(input?.value);
  if (isNaN(fc) || fc < 0 || fc > 50) { if (input) input.focus(); return; }
  const s = getSlamState();
  if (!s) return;
  s.oclt[type] = fc;
  saveSlamState(s);
  renderSlamBanner();
}

// Call renderSlamBanner() when Dosing tab is shown
// (hooked into showTab below)

// ═══════════════════════════════════════════
// RANGES TABLE
// ═══════════════════════════════════════════
function renderRangesTable() {
  const ranges = window.CHEM_DATA.ranges;
  const labels = { fc:'Free Chlorine', cc:'Combined Chlorine', ph:'pH', ta:'Total Alkalinity', ch:'Calcium Hardness', cya:'CYA / Stabilizer' };
  const rows = ['fc','ph','ta','ch','cya','cc'].map(k => {
    const r = ranges[k];
    return `<div class="range-row">
      <div>
        <p style="color:#1e293b;font-size:13px;font-weight:600;">${labels[k] || k.toUpperCase()}</p>
        ${r.note ? `<p style="color:#94a3b8;font-size:10px;margin-top:1px;">${r.note}</p>` : ''}
      </div>
      <span class="range-pill range-ok">${r.ideal} ${r.unit}</span>
    </div>`;
  }).join('');
  setEl('ranges-table', rows);
}

// ═══════════════════════════════════════════
// ADDITION ORDER
// ═══════════════════════════════════════════
function renderAdditionOrder() {
  setEl('addition-order',
    window.CHEM_DATA.additionOrder.map(s => `
      <div style="display:flex;gap:12px;padding:10px 0;border-bottom:1px solid #f1f5f9;">
        <div style="width:26px;height:26px;min-width:26px;border-radius:50%;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">${s.step}</div>
        <div>
          <p style="color:#0f172a;font-size:13px;font-weight:700;">${s.chem}</p>
          <p style="color:#0284c7;font-size:11px;margin-top:1px;">Wait: ${s.wait}</p>
          <p style="color:#64748b;font-size:12px;margin-top:3px;line-height:1.4;">${s.reason}</p>
        </div>
      </div>`).join(''));
}

// ═══════════════════════════════════════════
// VOLUME CALCULATOR
// ═══════════════════════════════════════════
const SHAPE_ICONS = { rectangle:'▬', oval:'⬬', round:'●', kidney:'⁀', lshape:'⌐', freeform:'〜' };
const FIELD_LABELS = {
  length:'Length (ft)', width:'Width (ft)', shallowEnd:'Shallow End (ft)', deepEnd:'Deep End (ft)',
  diameter:'Diameter (ft)', length1:'Section 1 Length (ft)', width1:'Section 1 Width (ft)',
  length2:'Section 2 Length (ft)', width2:'Section 2 Width (ft)', surfaceAreaEst:'Surface Area Est (sq ft)'
};

function initVolume() {
  renderShapeGrid();
}

function renderShapeGrid() {
  setEl('shape-grid',
    window.POOL_VOLUME_DATA.shapes.map(s => `
      <button class="shape-btn" id="shape-${s.id}" onclick="selectShape('${s.id}')">
        <div style="font-size:22px;margin-bottom:5px;">${SHAPE_ICONS[s.id] || '⬛'}</div>
        ${s.label}
      </button>`).join(''));
}

function selectShape(id) {
  S.shape = id;
  document.querySelectorAll('.shape-btn').forEach(b => b.classList.remove('active'));
  document.getElementById(`shape-${id}`).classList.add('active');
  const shape = window.POOL_VOLUME_DATA.shapes.find(s => s.id === id);
  const fields = shape.fields.map(f => `
    <div class="field-group">
      <label class="field-label">${FIELD_LABELS[f] || f}</label>
      <input type="number" id="vol-${f}" placeholder="feet" min="0" step="0.5" inputmode="decimal" oninput="autoCalcVol()">
    </div>`).join('');
  setEl('shape-fields', `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#64748b;font-size:12px;margin-bottom:14px;">💡 ${shape.tip}</p>
      ${fields}
      <button class="btn-calc" onclick="calcVolume()">Calculate Gallons</button>
    </div>`);
  setEl('vol-result', '');
}

function autoCalcVol() {
  const shape = window.POOL_VOLUME_DATA.shapes.find(s => s.id === S.shape);
  if (!shape) return;
  if (shape.fields.every(f => { const v = gf(`vol-${f}`); return !isNaN(v) && v > 0; })) calcVolume();
}

function calcVolume() {
  const shape = window.POOL_VOLUME_DATA.shapes.find(s => s.id === S.shape);
  if (!shape) return setEl('vol-result', errorBox('Select a pool shape first.'));
  const vals = shape.fields.map(f => gf(`vol-${f}`));
  if (vals.some(v => isNaN(v) || v <= 0)) return setEl('vol-result', errorBox('Fill in all dimensions.'));
  const gallons = shape.formula(...vals);
  if (isNaN(gallons) || gallons <= 0) return setEl('vol-result', errorBox('Check your measurements.'));
  const cubicFt = (gallons / 7.48).toFixed(0);
  const display = Math.round(gallons).toLocaleString();
  setEl('vol-result', `
    <div class="result-wrap" style="text-align:center;">
      <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Estimated Volume</p>
      <p style="font-size:52px;font-weight:900;color:#0369a1;line-height:1;letter-spacing:-2px;">${display}</p>
      <p style="color:#0284c7;font-size:17px;font-weight:600;margin-top:4px;">gallons</p>
      <p style="color:#94a3b8;font-size:12px;margin-top:6px;">${cubicFt} cubic feet</p>
      <div class="result-note" style="text-align:left;margin-top:14px;">
        Use this number in the Dosing tab for accurate chemical calculations.
        <button onclick="useVolumeInDosing(${Math.round(gallons)})" style="display:block;margin-top:8px;background:#eff6ff;border:1px solid #93c5fd;border-radius:6px;color:#0369a1;font-size:11px;font-weight:800;padding:5px 12px;cursor:pointer;width:100%;">
          → Use in Dosing Calculator
        </button>
      </div>
    </div>`);
}

function useVolumeInDosing(gallons) {
  const el = document.getElementById('dose-volume');
  if (el) { el.value = gallons; onVolumeChange(gallons); }
  showTab('dosing');
}

// ═══════════════════════════════════════════
// SAND FILTER
// ═══════════════════════════════════════════
function initSandFilter() {
  renderSandTable();
  renderAltMedia();
  renderDeSection();
  renderCartridgeSection();
}

function renderSandTable() {
  const data = window.SAND_FILTER_DATA.sandByDiameter;
  const rows = data.map((r, i) => `
    <tr class="sand-row" onclick="tapSandRow(${r.dia})" style="background:${i % 2 ? '#f8fafc' : '#ffffff'};">
      <td style="padding:8px 12px;color:#0f172a;font-weight:800;">${r.dia}"</td>
      <td style="padding:8px 12px;color:#0369a1;font-weight:700;">${r.sand} lbs</td>
      <td style="padding:8px 12px;color:#374151;">${r.flow}</td>
      <td style="padding:8px 12px;color:#64748b;">${r.sqft} ft²</td>
    </tr>`).join('');
  setEl('sand-quick-table', `
    <thead>
      <tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0;">
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Dia</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Sand</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Flow</th>
        <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Sq Ft</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>`);
}

function tapSandRow(dia) {
  const el = document.getElementById('sand-dia');
  if (el) el.value = dia;
  lookupSandFilter(dia);
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function lookupSandFilter(dia) {
  dia = parseInt(dia);
  if (!dia || dia < 10) { setEl('sand-result', ''); return; }
  const data = window.SAND_FILTER_DATA.sandByDiameter;
  let match = data.find(d => d.dia === dia);
  let approx = false;
  if (!match) {
    match = data.reduce((p, c) => Math.abs(c.dia - dia) < Math.abs(p.dia - dia) ? c : p);
    approx = true;
  }
  const signs = window.SAND_FILTER_DATA.replacement.signs;
  setEl('sand-result', `
    <div class="result-wrap" style="margin-bottom:12px;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">Sand Required${approx ? ` (nearest: ${match.dia}")` : ''}</p>
          <p class="result-amount" style="font-size:40px;">${match.sand} lbs</p>
          <p class="result-alt">#20 Silica Sand · ${match.dia}" tank</p>
        </div>
        <div style="text-align:right;">
          <p style="color:#0f172a;font-size:16px;font-weight:800;">${match.flow}</p>
          <p style="color:#94a3b8;font-size:11px;">flow rate</p>
          <p style="color:#64748b;font-size:12px;margin-top:6px;">${match.sqft} sq ft</p>
        </div>
      </div>
      <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:10px 12px;">
        <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Common Models</p>
        <p style="color:#0369a1;font-size:12px;line-height:1.5;">${match.commonModels.join(' · ')}</p>
      </div>
    </div>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:12px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#92400e;font-size:12px;font-weight:700;margin-bottom:8px;">Signs Sand Needs Replacing</p>
      ${signs.map(s => `<p style="color:#374151;font-size:12px;padding:3px 0;display:flex;gap:7px;"><span style="color:#dc2626;">•</span>${s}</p>`).join('')}
      <p style="color:#94a3b8;font-size:10px;margin-top:8px;">Residential: 3–5 years · Commercial: 1–2 years</p>
    </div>`);
}

function renderAltMedia() {
  setEl('alt-media-section', `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:12px;">Alternative Filter Media</p>
      ${window.SAND_FILTER_DATA.alternatMedia.map(m => `
        <div style="padding:9px 0;border-bottom:1px solid #f1f5f9;">
          <p style="color:#0f172a;font-size:13px;font-weight:700;">${m.name}</p>
          <p style="color:#0284c7;font-size:11px;font-family:monospace;margin-top:3px;">${m.amount}</p>
          <p style="color:#64748b;font-size:12px;margin-top:3px;line-height:1.4;">${m.note}</p>
        </div>`).join('')}
    </div>`);
}

// ═══════════════════════════════════════════
// FILTER TYPE SUB-NAV
// ═══════════════════════════════════════════
function switchFilterType(type) {
  S.filterType = type;
  ['sand', 'de', 'cart'].forEach(t => {
    const btn     = document.getElementById(`flt-btn-${t}`);
    const content = document.getElementById(`filter-${t}-content`);
    if (btn)     btn.classList.toggle('active', t === type);
    if (content) content.style.display = t === type ? '' : 'none';
  });
}

// ═══════════════════════════════════════════
// DE FILTER REFERENCE
// ═══════════════════════════════════════════
function renderDeSection() {
  const data = window.DE_FILTER_DATA;
  const tableRows = data.filters.map((f, i) =>
    `<tr class="sand-row" onclick="tapDeRow(${f.sqft || 0})" style="background:${i % 2 ? '#f8fafc' : '#ffffff'};">
      <td style="padding:7px 10px;color:#0f172a;font-weight:700;font-size:12px;">${f.brand}</td>
      <td style="padding:7px 10px;color:#0369a1;font-size:12px;font-weight:700;">${f.model}</td>
      <td style="padding:7px 10px;color:#374151;font-size:12px;">${f.sqft ? f.sqft + ' ft²' : '—'}</td>
      <td style="padding:7px 10px;color:#0284c7;font-size:12px;font-weight:800;">${f.deChargeLbs ? f.deChargeLbs + ' lbs' : '—'}</td>
    </tr>`).join('');

  setEl('de-section', `
    <p style="color:#0369a1;font-weight:900;font-size:16px;margin-bottom:4px;">DE Filter Reference</p>
    <p style="color:#64748b;font-size:12px;margin-bottom:10px;">Tap any row to fill calculator</p>

    <div class="scroll-x" style="border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:340px;">
        <thead>
          <tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0;">
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Brand</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Model</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Sq Ft</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">DE (lbs)</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:12px;">DE Charge Calculator</p>
      <div class="field-group">
        <label class="field-label">Filter Area (sq ft)</label>
        <input type="number" id="de-sqft" placeholder="e.g. 48" min="1" max="200" inputmode="decimal" oninput="calcDeCharge(this.value)">
      </div>
      <div id="de-charge-result"></div>
      <div class="warn-box" style="margin-top:10px;font-size:11px;">⚠ Wear a dust mask when handling DE powder — silica is a respiratory hazard.</div>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:10px;">Recharge Procedure</p>
      ${data.recharge.steps.map((s, i) => `
        <div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9;">
          <div style="width:22px;height:22px;min-width:22px;border-radius:50%;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;">${i + 1}</div>
          <p style="color:#374151;font-size:13px;line-height:1.45;padding-top:2px;">${s}</p>
        </div>`).join('')}
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#92400e;font-size:13px;font-weight:800;margin-bottom:8px;">Grid Replacement Signs</p>
      ${data.gridReplacement.signs.map(s => `<p style="color:#374151;font-size:12px;padding:4px 0;display:flex;gap:7px;"><span style="color:#dc2626;flex-shrink:0;">•</span>${s}</p>`).join('')}
      <p style="color:#94a3b8;font-size:10px;margin-top:10px;">${data.gridReplacement.interval}</p>
      <div class="info-box" style="margin-top:8px;font-size:11px;">Acid wash: ${data.gridReplacement.acidWash}</div>
    </div>`);
}

function tapDeRow(sqft) {
  if (!sqft) return;
  const el = document.getElementById('de-sqft');
  if (el) { el.value = sqft; calcDeCharge(sqft); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}

function calcDeCharge(sqft) {
  sqft = parseFloat(sqft);
  if (!sqft || sqft <= 0) { setEl('de-charge-result', ''); return; }
  const initial       = (sqft * 0.1).toFixed(1);
  const afterBackwash = (sqft * 0.08).toFixed(1);
  setEl('de-charge-result', `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px;">
      <div style="background:#eff6ff;border:1px solid #93c5fd;border-radius:8px;padding:12px;text-align:center;">
        <p style="color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">Initial / Full Teardown</p>
        <p style="color:#0369a1;font-size:28px;font-weight:900;line-height:1;">${initial}</p>
        <p style="color:#0284c7;font-size:11px;">lbs DE</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:12px;text-align:center;">
        <p style="color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px;">After Backwash (80%)</p>
        <p style="color:#166534;font-size:28px;font-weight:900;line-height:1;">${afterBackwash}</p>
        <p style="color:#16a34a;font-size:11px;">lbs DE</p>
      </div>
    </div>
    <p style="color:#94a3b8;font-size:10px;margin-top:8px;text-align:center;">${sqft} sq ft filter · 0.1 lbs/sq ft initial · 0.08 lbs/sq ft after backwash</p>`);
}

// ═══════════════════════════════════════════
// CARTRIDGE FILTER REFERENCE
// ═══════════════════════════════════════════
function renderCartridgeSection() {
  const data = window.CARTRIDGE_FILTER_DATA;
  const tableRows = data.filters.map((f, i) =>
    `<tr style="background:${i % 2 ? '#f8fafc' : '#ffffff'};">
      <td style="padding:7px 10px;color:#0f172a;font-weight:700;font-size:12px;">${f.brand}</td>
      <td style="padding:7px 10px;color:#0369a1;font-size:12px;font-weight:700;">${f.model}</td>
      <td style="padding:7px 10px;color:#374151;font-size:12px;">${f.sqft} ft²</td>
      <td style="padding:7px 10px;color:#64748b;font-size:11px;">${f.elements} elem.</td>
    </tr>`).join('');

  setEl('cart-section', `
    <p style="color:#0369a1;font-weight:900;font-size:16px;margin-bottom:12px;">Cartridge Filter Reference</p>

    <div class="scroll-x" style="border-radius:10px;border:1px solid #e2e8f0;margin-bottom:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <table style="width:100%;border-collapse:collapse;font-size:12px;min-width:320px;">
        <thead>
          <tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0;">
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Brand</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Model</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Sq Ft</th>
            <th style="padding:8px 10px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Elem.</th>
          </tr>
        </thead>
        <tbody>${tableRows}</tbody>
      </table>
    </div>

    <div class="info-box" style="margin-bottom:12px;">Clean when pressure is 8+ PSI above your clean baseline. Most filters: every 3–6 months minimum.</div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:10px;">Cleaning Procedure</p>
      ${data.cleaning.steps.map((s, i) => `
        <div style="display:flex;gap:10px;padding:7px 0;border-bottom:1px solid #f1f5f9;">
          <div style="width:22px;height:22px;min-width:22px;border-radius:50%;background:linear-gradient(135deg,#0284c7,#0369a1);color:white;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:900;">${i + 1}</div>
          <p style="color:#374151;font-size:13px;line-height:1.45;padding-top:2px;">${s}</p>
        </div>`).join('')}
      <p style="color:#94a3b8;font-size:11px;margin-top:10px;">${data.cleaning.replacementInterval}</p>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#92400e;font-size:13px;font-weight:800;margin-bottom:8px;">Replacement Signs</p>
      ${data.cleaning.signs.map(s => `<p style="color:#374151;font-size:12px;padding:4px 0;display:flex;gap:7px;"><span style="color:#dc2626;flex-shrink:0;">•</span>${s}</p>`).join('')}
    </div>`);
}

// ═══════════════════════════════════════════
// OPENING CHECKLIST
// ═══════════════════════════════════════════
function initGuide() {
  // Migrate old single-key format to per-type keys
  const old = localStorage.getItem('poolens-cl');
  if (old) { localStorage.setItem('poolens-cl-opening', old); localStorage.removeItem('poolens-cl'); }
  Object.keys(CL_MAP).forEach(type => {
    try { S.checklists[type] = JSON.parse(localStorage.getItem(CL_MAP[type].key) || '{}'); }
    catch(e) { S.checklists[type] = {}; }
  });
  renderChecklist();
}

function switchClType(type) {
  S.clType = type;
  ['opening','closing','weekly','monthly'].forEach(t => {
    const btn = document.getElementById(`cl-btn-${t}`);
    if (btn) btn.classList.toggle('active', t === type);
  });
  const meta = CL_MAP[type];
  setEl('cl-title', meta.label);
  const freq = document.getElementById('cl-freq-label');
  if (freq) freq.textContent = meta.freq;
  renderChecklist();
}

function renderChecklist() {
  const phases = CL_MAP[S.clType].data();
  const cl = S.checklists[S.clType];
  setEl('checklist-content',
    phases.map((phase, pi) => `
      <div style="margin-bottom:16px;">
        <div style="border-left:3px solid #0284c7;padding:9px 12px;background:#eff6ff;border-radius:0 8px 8px 0;margin-bottom:8px;">
          <p style="color:#0369a1;font-weight:800;font-size:13px;">${phase.phase}</p>
        </div>
        ${phase.steps.map((step, si) => {
          const k = `${pi}-${si}`;
          const done = !!cl[k];
          return `<div id="cli-${k}" class="cl-item${done ? ' done' : ''}" onclick="toggleItem(${pi},${si})">
            <input type="checkbox" id="chk-${k}" ${done ? 'checked' : ''} onclick="event.stopPropagation();toggleItem(${pi},${si})">
            <span class="cl-text">${step}</span>
          </div>`;
        }).join('')}
      </div>`).join(''));
  updateProgress();
}

function toggleItem(pi, si) {
  const k = `${pi}-${si}`;
  const cl = S.checklists[S.clType];
  cl[k] = !cl[k];
  localStorage.setItem(CL_MAP[S.clType].key, JSON.stringify(cl));
  const row = document.getElementById(`cli-${k}`);
  const chk = document.getElementById(`chk-${k}`);
  if (row) row.classList.toggle('done', !!cl[k]);
  if (chk) chk.checked = !!cl[k];
  updateProgress();
}

function updateProgress() {
  const phases = CL_MAP[S.clType].data();
  const cl = S.checklists[S.clType];
  let total = 0, done = 0;
  phases.forEach((phase, pi) =>
    phase.steps.forEach((_, si) => { total++; if (cl[`${pi}-${si}`]) done++; }));
  setEl('progress-text', `${done} / ${total}`);
  const pct = total ? (done / total * 100) : 0;
  const fill = document.getElementById('progress-fill');
  if (fill) fill.style.width = `${pct}%`;
  const txt = document.getElementById('progress-text');
  if (txt) txt.style.color = (done === total && total > 0) ? '#166534' : '#0369a1';
}

function resetChecklist() {
  if (!confirm(`Reset ${CL_MAP[S.clType].label}?`)) return;
  S.checklists[S.clType] = {};
  localStorage.removeItem(CL_MAP[S.clType].key);
  renderChecklist();
}

// ═══════════════════════════════════════════
// VISIT REPORT
// ═══════════════════════════════════════════
let _chemRowId = 0;
let _reportPoolId = null;
const REPORT_DRAFT_KEY = 'splashlens-report-draft-v1';

function initReport() {
  const today = new Date().toISOString().split('T')[0];
  const dateEl = document.getElementById('rpt-date');
  if (dateEl && !dateEl.value) dateEl.value = today;
  addChemRow();
  ['rpt-fc','rpt-cc','rpt-ph','rpt-ta','rpt-ch','rpt-cya','rpt-customer-summary','rpt-issue-note','rpt-photo-proof'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => validateReportProof({ quiet: true }));
  });
  ['rpt-customer','rpt-address'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', () => { _reportPoolId = null; });
  });
  updateReportCostSummary();
  validateReportProof({ quiet: true });
  renderReportDraftStatus();
  // Show share button only when Web Share API is available (iOS Safari, Android Chrome)
  const shareBtn = document.getElementById('rpt-share-btn');
  if (shareBtn && !navigator.share) shareBtn.style.display = 'none';
}

function addChemRow() {
  _chemRowId++;
  const id = _chemRowId;
  const container = document.getElementById('chem-rows');
  if (!container) return;
  const div = document.createElement('div');
  div.id = `chem-row-${id}`;
  div.style.cssText = 'display:grid;grid-template-columns:minmax(92px,1fr) 60px 54px 64px 36px;gap:4px;margin-bottom:8px;align-items:center;';
  div.innerHTML = `
    <input type="text" id="cr-name-${id}" placeholder="Chemical..." oninput="updateReportCostSummary()" style="background:#ffffff;border:1px solid #cbd5e1;color:#0f172a;border-radius:9px;padding:10px 10px;font-size:13px;font-family:inherit;width:100%;min-width:0;">
    <input type="text" id="cr-amt-${id}"  placeholder="Amt" inputmode="decimal" oninput="updateReportCostSummary()" style="background:#ffffff;border:1px solid #cbd5e1;color:#0f172a;border-radius:9px;padding:10px 8px;font-size:13px;font-family:inherit;width:100%;min-width:0;">
    <input type="number" id="cr-cost-${id}" placeholder="$" inputmode="decimal" step="0.01" min="0" oninput="updateReportCostSummary()" style="background:#ffffff;border:1px solid #cbd5e1;color:#0f172a;border-radius:9px;padding:10px 8px;font-size:13px;font-family:inherit;width:100%;min-width:0;">
    <select id="cr-stock-${id}" onchange="updateReportCostSummary()" style="background:#ffffff;border:1px solid #cbd5e1;color:#0f172a;border-radius:9px;padding:10px 6px;font-size:12px;font-family:inherit;width:100%;min-width:0;">
      <option>Truck</option>
      <option>Restock</option>
      <option>Customer</option>
    </select>
    <button type="button" onclick="removeChemRow(${id})" style="background:#fee2e2;border:1px solid #fca5a5;color:#991b1b;border-radius:8px;padding:0;height:36px;width:36px;cursor:pointer;font-size:18px;line-height:1;">×</button>`;
  container.appendChild(div);
  updateReportCostSummary();
}

function removeChemRow(id) {
  const row = document.getElementById(`chem-row-${id}`);
  if (row) row.remove();
  updateReportCostSummary();
}

function _rptVal(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }

function _rptChecked(id) { const el = document.getElementById(id); return !!(el && el.checked); }

function getReportChemRows() {
  const chems = [];
  document.querySelectorAll('[id^="chem-row-"]').forEach(row => {
    const rid = row.id.replace('chem-row-', '');
    const name = _rptVal(`cr-name-${rid}`);
    const amt = _rptVal(`cr-amt-${rid}`);
    const costRaw = _rptVal(`cr-cost-${rid}`);
    const cost = parseFloat(costRaw);
    const stock = _rptVal(`cr-stock-${rid}`) || 'Truck';
    if (name || amt || costRaw) chems.push({ name, amt, cost: isNaN(cost) ? 0 : cost, stock });
  });
  return chems;
}

function updateReportCostSummary() {
  const chems = getReportChemRows();
  const total = chems.reduce((sum, c) => sum + (c.cost || 0), 0);
  const totalEl = document.getElementById('rpt-cost-total');
  if (totalEl) totalEl.textContent = `$${total.toFixed(2)}`;
  const byStock = chems.reduce((acc, c) => {
    const key = c.stock || 'Truck';
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
  const summary = Object.keys(byStock).length
    ? Object.entries(byStock).map(([k, v]) => `${v} from ${k.toLowerCase()}`).join(', ')
    : 'Add chemical costs and stock source to estimate stop cost.';
  setEl('rpt-inventory-summary', `${summary}${total ? ` - estimated chemical cost for this stop: $${total.toFixed(2)}.` : ''}`);
}

function hasAnyReportReading() {
  return ['rpt-fc','rpt-cc','rpt-ph','rpt-ta','rpt-ch','rpt-cya'].some(id => _rptVal(id));
}

function validateReportProof(opts = {}) {
  const missing = [];
  const source = _rptVal('rpt-reading-source') || 'manual';
  const hasReading = hasAnyReportReading();
  const waterOk = _rptChecked('rpt-proof-water') || hasReading;
  const photoOk = _rptChecked('rpt-proof-equipment') || !!_rptVal('rpt-photo-proof');
  const summaryOk = _rptChecked('rpt-proof-summary') || !!_rptVal('rpt-customer-summary');
  if (!waterOk) missing.push('water reading');
  if (!photoOk) missing.push('equipment/photo proof');
  if (!summaryOk) missing.push('customer summary');
  if (source.includes('spintouch') && !hasReading) missing.push('SpinTouch values');

  const complete = missing.length === 0;
  const pill = document.getElementById('rpt-proof-pill');
  if (pill) {
    pill.textContent = complete ? 'proof ready' : 'incomplete';
    pill.style.background = complete ? '#dcfce7' : '#fee2e2';
    pill.style.color = complete ? '#166534' : '#991b1b';
  }
  setEl('rpt-proof-missing', complete ? '' : `Missing: ${missing.join(', ')}`);
  if (!complete && !opts.quiet) alert(`Stop proof is incomplete: ${missing.join(', ')}`);
  return { complete, missing, source };
}

function reportReadingSummary() {
  return [
    ['FC', _rptVal('rpt-fc')],
    ['CC', _rptVal('rpt-cc')],
    ['pH', _rptVal('rpt-ph')],
    ['TA', _rptVal('rpt-ta')],
    ['CH', _rptVal('rpt-ch')],
    ['CYA', _rptVal('rpt-cya')],
  ].filter(([, value]) => value).map(([label, value]) => `${label} ${value}`).join(', ');
}

function reportProofRiskFlags(passport = null, pool = null) {
  const p = passport || buildServicePassport();
  const fields = [
    p.proof?.issueNote,
    p.proof?.customerSummary,
    p.workPerformed,
    p.equipmentNotes,
    p.recommendations,
    p.visitType,
  ].filter(Boolean).join(' ').toLowerCase();
  const issueFields = [
    p.proof?.issueNote,
    p.workPerformed,
    p.equipmentNotes,
    p.recommendations,
    p.visitType,
  ].filter(Boolean).join(' ').toLowerCase();
  const waterRiskPattern = /\b(algae|cloudy|foam|biofilm|chlorine|orp)\b|\bgreen\s+(water|pool)\b|\b(cya|ph|alkalinity)\b.{0,30}\b(high|low|drift|swing|off|adjust|raise|lower|problem|issue)\b|\b(high|low|drift|swing|off|adjust|raise|lower|problem|issue)\b.{0,30}\b(cya|ph|alkalinity)\b/;
  const flags = [];
  if (p.proof && p.proof.complete === false) flags.push('Proof is incomplete before this should be treated as customer-ready.');
  if (/heater|gas|ignition|flame|rollout|high limit|heat exchanger/.test(fields)) flags.push('Heater-related issue: capture model plate, code display, water flow proof, and qualified-tech verification.');
  if (/gfci|breaker|voltage|electrical|light|transformer|relay|automation|rs-485/.test(fields)) flags.push('Electrical/automation issue: document visible proof and route qualified electrical checks appropriately.');
  if (waterRiskPattern.test(issueFields)) flags.push('Water-quality trend candidate: compare against recent chemistry before promising a one-visit fix.');
  if (/\b(robot|cleaner|cordless|track|tracks|brushes|drive brush|cable|power supply)\b/.test(fields)) flags.push('Robot/cleaner issue: save power supply, tracks/brushes, basket, cable, and model proof before parts ordering.');
  if (pool) {
    const recent = (pool.servicePassports || []).slice(-4);
    const repeatText = recent.map(x => [x.visitType, x.proof?.issueNote, x.equipmentNotes, x.recommendations].filter(Boolean).join(' ')).join(' ').toLowerCase();
    ['heater','salt','robot','light','automation','algae','cloudy','pump','filter'].forEach((term) => {
      const count = (repeatText.match(new RegExp(term, 'g')) || []).length;
      if (count >= 2 && !flags.some(flag => flag.toLowerCase().includes(term))) flags.push(`Repeat ${term} signal in recent history: review before closing the stop.`);
    });
  }
  return flags.slice(0, 5);
}

function buildServiceProofCustomerSummary() {
  const visitType = _rptVal('rpt-type') || 'service visit';
  const readings = reportReadingSummary();
  const work = _rptVal('rpt-work');
  const equip = _rptVal('rpt-equip');
  const rec = _rptVal('rpt-rec');
  const proof = validateReportProof({ quiet: true });
  const pieces = [];
  pieces.push(`Today we completed a ${visitType.toLowerCase()} and documented the visit for your pool record.`);
  if (readings) pieces.push(`Current readings recorded: ${readings}.`);
  if (work) pieces.push(`Work completed: ${work}`);
  if (equip) pieces.push(`Equipment note: ${equip}`);
  if (rec) pieces.push(`Recommended next step: ${rec}`);
  if (!proof.complete) pieces.push(`A few proof items still need to be confirmed before this should be treated as final: ${proof.missing.join(', ')}.`);
  pieces.push('This summary is a field reference note and should be verified against labels, manuals, and qualified service judgment when repair decisions are involved.');
  return pieces.join(' ');
}

function generateServiceProofSummary() {
  const summary = buildServiceProofCustomerSummary();
  const target = document.getElementById('rpt-customer-summary');
  if (target) {
    target.value = summary;
    target.dispatchEvent(new Event('input'));
  }
  validateReportProof({ quiet: true });
  const output = document.getElementById('rpt-proof-os-output');
  if (output) {
    output.innerHTML = `
      <section class="brain-card">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
          <h3 style="font-size:14px;font-weight:950;color:#0f172a;margin:0;">Homeowner-safe draft</h3>
          <span class="brain-pill ready">Generated</span>
        </div>
        <p style="color:#334155;font-size:12px;line-height:1.5;">${escHtml(summary)}</p>
      </section>`;
  }
  trackSplashLensEvent('service_proof_summary_generated', { proof_ready: validateReportProof({ quiet: true }).complete });
}

function previewServiceTrustPortal() {
  const passport = buildServicePassport();
  const pool = findPoolForReport();
  const flags = reportProofRiskFlags(passport, pool);
  const proof = validateReportProof({ quiet: true });
  const output = document.getElementById('rpt-proof-os-output');
  if (!output) return;
  output.innerHTML = `
    <section class="brain-card" aria-label="Customer trust portal preview">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
        <div>
          <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Customer trust portal preview</p>
          <h3 style="color:#0f172a;font-size:18px;line-height:1.1;font-weight:950;margin:0;">${escHtml(passport.customer || 'Customer')} - ${escHtml(passport.visitType || 'Service visit')}</h3>
        </div>
        <span class="brain-pill ${proof.complete ? 'ready' : 'risk'}">${proof.complete ? 'proof ready' : 'needs proof'}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;text-align:center;"><strong style="display:block;color:#0369a1;font-size:15px;">${escHtml(passport.date)}</strong><span style="display:block;color:#64748b;font-size:10px;font-weight:800;">visit date</span></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;text-align:center;"><strong style="display:block;color:#0369a1;font-size:15px;">${passport.chemicals.length}</strong><span style="display:block;color:#64748b;font-size:10px;font-weight:800;">chemical rows</span></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;text-align:center;"><strong style="display:block;color:#0369a1;font-size:15px;">${flags.length}</strong><span style="display:block;color:#64748b;font-size:10px;font-weight:800;">risk flags</span></div>
      </div>
      <p style="color:#334155;font-size:12px;line-height:1.5;margin-bottom:9px;"><strong>Customer summary:</strong> ${escHtml(passport.proof.customerSummary || buildServiceProofCustomerSummary())}</p>
      ${passport.proof.photoProof ? `<p style="color:#334155;font-size:12px;line-height:1.5;margin-bottom:9px;"><strong>Photos/proof:</strong> ${escHtml(passport.proof.photoProof)}</p>` : ''}
      ${flags.length ? `<div class="warn-box" style="margin-bottom:9px;"><strong>Trend/risk signals:</strong><br>${flags.map(escHtml).join('<br>')}</div>` : '<div class="info-box" style="margin-bottom:9px;">No strong risk signal from this visit yet. Save more visits to build trend memory.</div>'}
      <div class="brain-grid">
        <button type="button" class="brain-action green" onclick="copyServiceTrustPortalPreview()">Copy portal text</button>
        <button type="button" class="brain-action secondary" onclick="saveReportToPoolHistory()">Save Passport</button>
      </div>
    </section>`;
  trackSplashLensEvent('service_proof_portal_previewed', { proof_ready: proof.complete, risk_flags: flags.length });
}

function copyServiceTrustPortalPreview() {
  const passport = buildServicePassport();
  const pool = findPoolForReport();
  const flags = reportProofRiskFlags(passport, pool);
  const text = [
    `SplashLens saved job history`,
    `Customer: ${passport.customer}`,
    `Visit: ${passport.visitType} on ${passport.date}`,
    reportReadingSummary() ? `Readings: ${reportReadingSummary()}` : '',
    passport.proof.photoProof ? `Photos/proof: ${passport.proof.photoProof}` : '',
    `Summary: ${passport.proof.customerSummary || buildServiceProofCustomerSummary()}`,
    flags.length ? `Trend/risk signals: ${flags.join(' | ')}` : '',
    `Reference only. Verify repair decisions with labels, manuals, and qualified service judgment.`,
  ].filter(Boolean).join('\n');
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => alert('Trust portal preview copied.')).catch(() => alert(text));
  } else {
    alert(text);
  }
  trackSplashLensEvent('service_proof_portal_copied', { risk_flags: flags.length });
}

function serviceProofSharePayload() {
  const passport = buildServicePassport();
  const pool = findPoolForReport();
  const flags = reportProofRiskFlags(passport, pool);
  const proof = validateReportProof({ quiet: true });
  return {
    v: 1,
    kind: 'splashlens_service_proof_packet',
    generatedAt: new Date().toISOString(),
    customer: passport.customer || 'Customer',
    address: passport.address || '',
    tech: passport.tech || '',
    date: passport.date || '',
    visitType: passport.visitType || 'Service visit',
    readings: passport.readings || {},
    proof: {
      complete: proof.complete,
      missing: proof.missing || [],
      photoProof: passport.proof?.photoProof || '',
      issueNote: passport.proof?.issueNote || '',
      customerSummary: passport.proof?.customerSummary || buildServiceProofCustomerSummary(),
    },
    chemicals: (passport.chemicals || []).slice(0, 12).map((item) => ({
      name: item.name || '',
      amount: item.amount || item.amt || '',
      cost: item.cost || 0,
    })),
    doseBasis: passport.doseBasis || '',
    workPerformed: passport.workPerformed || '',
    equipmentNotes: passport.equipmentNotes || '',
    recommendations: passport.recommendations || '',
    nextVisit: passport.nextVisit || '',
    callbackRisk: passport.callbackRisk || { level: flags.length ? 'medium' : 'low', flags },
    disclaimer: 'SplashLens is a reference and documentation workflow. Verify repair decisions, part fit, chemical safety, and code requirements with manuals, labels, manufacturer guidance, and qualified service judgment.',
  };
}

function encodeProofPacketPayload(payload) {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function createServiceProofShareLink() {
  const proof = validateReportProof({ quiet: true });
  if (!proof.complete && !confirm(`Stop proof is incomplete: ${proof.missing.join(', ')}. Create a share link anyway?`)) return;
  const payload = serviceProofSharePayload();
  const encoded = encodeProofPacketPayload(payload);
  const url = `${window.location.origin}/proof-packet.html?p=${encoded}`;
  const message = `SplashLens Service Proof Packet\n${url}\n\nReference only. Verify repairs, part fit, chemical safety, and code requirements with qualified service judgment.`;
  const output = document.getElementById('rpt-proof-os-output');
  if (output) {
    output.innerHTML = `
      <section class="brain-card" aria-label="Service Proof share link">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
          <div>
            <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Shareable proof packet</p>
            <h3 style="color:#0f172a;font-size:18px;line-height:1.1;font-weight:950;margin:0;">${escHtml(payload.customer)} - ${escHtml(payload.visitType)}</h3>
          </div>
          <span class="brain-pill ${proof.complete ? 'ready' : 'risk'}">${proof.complete ? 'proof ready' : 'needs proof'}</span>
        </div>
        <p style="color:#334155;font-size:12px;line-height:1.45;margin-bottom:10px;">This creates a customer/senior-tech packet link from this visit. The packet is reference-only and keeps all repair decisions in qualified hands.</p>
        <input type="text" readonly value="${escAttr(url)}" onclick="this.select()" style="width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:12px;margin-bottom:10px;">
        <div class="brain-grid">
          <button type="button" class="brain-action green" onclick="copyTextToClipboard('${escAttr(message)}','Proof packet link copied.')">Copy link</button>
          <a class="brain-action secondary" href="${escAttr(url)}" target="_blank" rel="noopener" style="text-align:center;text-decoration:none;">Open packet</a>
        </div>
      </section>`;
  }
  if (navigator.share) {
    navigator.share({ title: 'SplashLens Service Proof Packet', text: message, url }).catch(() => {});
  } else if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(message).catch(() => {});
  }
  trackSplashLensEvent('service_proof_share_link_created', {
    proof_ready: proof.complete,
    risk: payload.callbackRisk?.level || 'unknown',
    has_customer_summary: Boolean(payload.proof?.customerSummary),
  });
}

function copyTextToClipboard(text, confirmation) {
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).then(() => alert(confirmation || 'Copied.')).catch(() => alert(text));
  } else {
    alert(text);
  }
}

function copyCustomerSafeSummary() {
  const summary = _rptVal('rpt-customer-summary') || buildServiceProofCustomerSummary();
  const text = [
    summary,
    '',
    'SplashLens note: this is a customer-safe field summary. Repair decisions, part fit, chemical safety, and code requirements still need labels, manuals, manufacturer guidance, and qualified service judgment.'
  ].join('\n');
  copyTextToClipboard(text, 'Customer-safe summary copied.');
  trackSplashLensEvent('service_proof_customer_summary_copied', {
    proof_ready: validateReportProof({ quiet: true }).complete,
    role: getSplashLensRole(),
  });
}

function downloadServiceProofJson() {
  const payload = serviceProofSharePayload();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  const customer = (payload.customer || 'customer').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'customer';
  anchor.href = url;
  anchor.download = `splashlens-service-proof-${customer}-${Date.now()}.json`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  trackSplashLensEvent('service_proof_json_exported', {
    proof_ready: validateReportProof({ quiet: true }).complete,
    risk: payload.callbackRisk?.level || 'unknown',
    role: getSplashLensRole(),
  });
}

function copyRouteNote() {
  const passport = buildServicePassport();
  const proof = validateReportProof({ quiet: true });
  const flags = passport.callbackRisk?.flags || [];
  const text = [
    `Route note - ${passport.customer || 'Customer'} (${passport.visitType || 'Service visit'})`,
    reportReadingSummary() ? `Readings: ${reportReadingSummary()}` : '',
    passport.proof?.issueNote ? `Tech note: ${passport.proof.issueNote}` : '',
    passport.proof?.photoProof ? `Proof: ${passport.proof.photoProof}` : '',
    passport.proof?.customerSummary ? `Customer summary: ${passport.proof.customerSummary}` : '',
    passport.recommendations ? `Next recommendation: ${passport.recommendations}` : '',
    proof.complete ? 'Proof status: ready' : `Proof missing: ${proof.missing.join(', ')}`,
    flags.length ? `Repeat issue flags: ${flags.join(' | ')}` : '',
  ].filter(Boolean).join('\n');
  copyTextToClipboard(text, 'Route note copied.');
  trackSplashLensEvent('service_proof_route_note_copied', {
    proof_ready: proof.complete,
    risk: passport.callbackRisk?.level || 'unknown',
    role: getSplashLensRole(),
  });
}

const SERVICE_PROOF_FAQ = [
  {
    keys: ['crm', 'jobber', 'skimmer', 'pool brain', 'replace'],
    answer: 'SplashLens job proof tools are meant to sit beside your CRM first. Use your CRM for scheduling, invoices, and customer records. Use SplashLens for proof, field memory, PartSnap, customer-safe summaries, and trend flags.'
  },
  {
    keys: ['customer', 'homeowner', 'summary', 'explain'],
    answer: 'Use Generate Summary after the tech notes are entered. It rewrites the stop into plain language: what was checked, what changed, why it matters, and what should happen next.'
  },
  {
    keys: ['photo', 'proof', 'picture', 'part'],
    answer: 'Best proof is wide equipment context, model plate, code display, close-up part marking, chemistry screenshot, and before/after condition. If a part order is involved, capture a second proof photo.'
  },
  {
    keys: ['ai', 'agent', 'chat'],
    answer: 'The current assistant is local and rule-based so it works without a backend key. It can answer workflows and write draft summaries. A true agentic chat can be added on top with a server endpoint and an OpenAI key, with disclaimers and no diagnosis claims.'
  },
  {
    keys: ['price', 'paid', 'subscription'],
    answer: 'The FreeCore app stays useful: manual lookup, calculators, checklists, and Facility Assist stay open. A free field profile unlocks 3 monthly AI scans and lets a tech start saving job context on this device. Splash Lens Pro Unlimited is the paid lane for unlimited scanner use and saved job memory where paid access is available. Teams is for owners who want crew visibility and company reporting. Partner/manufacturer/training ideas are handled through direct discussion, not self-serve checkout.'
  },
  {
    keys: ['trend', 'callback', 'risk', 'repeat'],
    answer: 'Repeat issue flags look for incomplete proof, repeated symptoms, repeated equipment categories, water-quality drift, and high-risk hardware like heaters, electrical, lights, covers, and automation.'
  },
  {
    keys: ['facility', 'cpo', 'apartment', 'swim school'],
    answer: 'Facility users should start with Facility Assist for daily checks, contamination events, dose records, equipment proof, and help packets. Saved job history keeps the longer record.'
  }
];

function serviceProofAssistantAnswer(query) {
  const q = String(query || '').toLowerCase();
  const hit = SERVICE_PROOF_FAQ.find(item => item.keys.some(key => q.includes(key)));
  if (hit) return hit.answer;
  return 'Start with the visit workflow: capture readings, add photo/proof names, dictate a tech note, generate the homeowner summary, preview the customer note, then save the job history. Keep repair language cautious until model numbers, manuals, and qualified checks are verified.';
}

function renderServiceProofAssistant() {
  const output = document.getElementById('rpt-proof-os-output');
  if (!output) return;
  output.innerHTML = `
    <section class="brain-card" aria-label="Service Proof assistant">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:9px;">
        <h3 style="font-size:14px;font-weight:950;color:#0f172a;margin:0;">Service Proof Assistant</h3>
        <span class="brain-pill warn">Local FAQ</span>
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.45;margin-bottom:10px;">Ask about workflow, customer summaries, proof photos, CRM fit, pricing, trend flags, or Facility Assist. This is a field-help assistant, not a diagnosis engine.</p>
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px;margin-bottom:10px;">
        <input type="text" id="proof-assistant-question" placeholder="Ask: what proof should I capture for a heater call?">
        <button type="button" class="brain-action" onclick="answerServiceProofAssistant()" style="padding:10px 12px;">Ask</button>
      </div>
      <div style="display:flex;gap:6px;overflow-x:auto;margin-bottom:10px;">
        ${['CRM fit','Customer summary','Proof photos','AI chat','Repeat issues','Facility workflow'].map(q => `<button type="button" class="brain-chip primary" onclick="askServiceProofAssistant('${escAttr(q)}')">${escHtml(q)}</button>`).join('')}
      </div>
      <div id="proof-assistant-answer" class="info-box">Pick a chip or ask a question.</div>
    </section>`;
  trackSplashLensEvent('service_proof_assistant_opened', {});
}

function askServiceProofAssistant(question) {
  const input = document.getElementById('proof-assistant-question');
  if (input) input.value = question;
  answerServiceProofAssistant();
}

function answerServiceProofAssistant() {
  const input = document.getElementById('proof-assistant-question');
  const answer = document.getElementById('proof-assistant-answer');
  const q = input ? input.value : '';
  if (answer) answer.textContent = serviceProofAssistantAnswer(q);
  trackSplashLensEvent('service_proof_assistant_answered', { topic: String(q || '').slice(0, 80) });
}

function buildReportText() {
  const customer = _rptVal('rpt-customer') || 'Customer';
  const address  = _rptVal('rpt-address');
  const tech     = _rptVal('rpt-tech') || 'Tech';
  const rawDate  = _rptVal('rpt-date');
  const date     = rawDate ? new Date(rawDate + 'T12:00:00').toLocaleDateString() : new Date().toLocaleDateString();
  const type     = _rptVal('rpt-type');
  const priority = _rptVal('rpt-priority') || 'routine';
  const reviewTo = _rptVal('rpt-review-to');
  const work     = _rptVal('rpt-work');
  const equip    = _rptVal('rpt-equip');
  const rec      = _rptVal('rpt-rec');
  const rawNext  = _rptVal('rpt-next');
  const next     = rawNext ? new Date(rawNext + 'T12:00:00').toLocaleDateString() : '';
  const readingSource = _rptVal('rpt-reading-source') || 'manual';
  const photoProof = _rptVal('rpt-photo-proof');
  const issueNote = _rptVal('rpt-issue-note');
  const customerSummary = _rptVal('rpt-customer-summary');
  const doseBasis = _rptVal('rpt-dose-basis');
  const proof = validateReportProof({ quiet: true });

  const readings = [
    ['FC', _rptVal('rpt-fc')], ['CC', _rptVal('rpt-cc')], ['pH', _rptVal('rpt-ph')],
    ['TA', _rptVal('rpt-ta')], ['CH', _rptVal('rpt-ch')], ['CYA', _rptVal('rpt-cya')]
  ].filter(([,v]) => v).map(([l,v]) => `${l}: ${v}`).join('  |  ');

  const chemRows = getReportChemRows();
  const totalCost = chemRows.reduce((sum, c) => sum + (c.cost || 0), 0);
  const chems = [];
  document.querySelectorAll('[id^="chem-row-"]').forEach(row => {
    const rid  = row.id.replace('chem-row-', '');
    const name = _rptVal(`cr-name-${rid}`);
    const amt  = _rptVal(`cr-amt-${rid}`);
    if (name) chems.push(`  • ${name}${amt ? ' — ' + amt : ''}`);
  });

  const HR = '─'.repeat(42);
  const lines = [
    `POOL SERVICE REPORT`, date,
    HR,
    `Customer : ${customer}`,
    ...(address ? [`Address  : ${address}`] : []),
    `Tech     : ${tech}`,
    `Visit    : ${type}`,
    `Priority : ${priority}`,
    ...(reviewTo ? [`Review   : ${reviewTo}`] : []),
    '',
    ...(readings ? ['WATER READINGS:', readings, `Source: ${readingSource}`, ''] : []),
    'STOP PROOF:',
    `Status   : ${proof.complete ? 'Proof ready' : 'Incomplete'}`,
    ...(proof.missing.length ? [`Missing  : ${proof.missing.join(', ')}`] : []),
    ...(photoProof ? [`Photos   : ${photoProof}`] : []),
    ...(issueNote ? [`Tech note : ${issueNote}`] : []),
    ...(customerSummary ? [`Customer : ${customerSummary}`] : []),
    '',
    ...(chems.length ? ['CHEMICALS ADDED:', ...chems, ''] : []),
    ...(chemRows.length ? [`EST. CHEMICAL COST: $${totalCost.toFixed(2)}`, ''] : []),
    ...(doseBasis ? [`DOSE BASIS: ${doseBasis}`, ''] : []),
    ...(work  ? ['WORK PERFORMED:', work, '']  : []),
    ...(equip ? ['EQUIPMENT NOTES:', equip, ''] : []),
    ...(rec   ? ['RECOMMENDATIONS:', rec, '']  : []),
    ...(next  ? [`NEXT VISIT: ${next}`, '']    : []),
    HR,
    'Generated by SplashLens Field Reference',
  ];
  return lines.join('\n');
}

function buildServicePassport() {
  const rawDate = _rptVal('rpt-date');
  const proof = validateReportProof({ quiet: true });
  const chemRows = getReportChemRows();
  const totalCost = chemRows.reduce((sum, c) => sum + (c.cost || 0), 0);
  const passport = {
    id: `svc-${Date.now()}`,
    type: 'service_passport',
    savedAt: new Date().toISOString(),
    poolId: _reportPoolId,
    customer: _rptVal('rpt-customer') || 'Customer',
    address: _rptVal('rpt-address'),
    tech: _rptVal('rpt-tech') || 'Tech',
    date: rawDate || new Date().toISOString().split('T')[0],
    visitType: _rptVal('rpt-type') || 'Regular Service',
    priority: _rptVal('rpt-priority') || 'routine',
    reviewTo: _rptVal('rpt-review-to'),
    readings: {
      source: _rptVal('rpt-reading-source') || 'manual',
      fc: _rptVal('rpt-fc'),
      cc: _rptVal('rpt-cc'),
      ph: _rptVal('rpt-ph'),
      ta: _rptVal('rpt-ta'),
      ch: _rptVal('rpt-ch'),
      cya: _rptVal('rpt-cya'),
    },
    proof: {
      complete: proof.complete,
      missing: proof.missing,
      photoProof: _rptVal('rpt-photo-proof'),
      issueNote: _rptVal('rpt-issue-note'),
      customerSummary: _rptVal('rpt-customer-summary'),
    },
    chemicals: chemRows,
    totalChemicalCost: totalCost,
    doseBasis: _rptVal('rpt-dose-basis'),
    workPerformed: _rptVal('rpt-work'),
    equipmentNotes: _rptVal('rpt-equip'),
    recommendations: _rptVal('rpt-rec'),
    nextVisit: _rptVal('rpt-next'),
    reportText: buildReportText(),
  };
  const pool = findPoolForReport();
  const flags = reportProofRiskFlags(passport, pool);
  passport.trendFlags = flags;
  passport.callbackRisk = {
    level: flags.length >= 3 || (proof.missing && proof.missing.length >= 2) ? 'high' : flags.length ? 'medium' : 'low',
    flags,
  };
  return passport;
}

function readReportDraft() {
  try { return JSON.parse(localStorage.getItem(REPORT_DRAFT_KEY) || 'null'); }
  catch (err) { return null; }
}

function renderReportDraftStatus() {
  const draft = readReportDraft();
  const pill = document.getElementById('rpt-draft-pill');
  const status = document.getElementById('rpt-draft-status');
  if (!pill || !status) return;
  if (!draft) {
    pill.textContent = 'No draft';
    pill.className = 'brain-pill warn';
    status.textContent = 'Save an incomplete stop locally before the route pulls you away.';
    return;
  }
  pill.textContent = draft.priority === 'senior-review' ? 'Senior review' : 'Draft saved';
  pill.className = draft.priority === 'callback-risk' || draft.priority === 'senior-review' ? 'brain-pill risk' : 'brain-pill ready';
  const when = draft.savedAt ? new Date(draft.savedAt).toLocaleString() : 'recently';
  status.textContent = `${draft.customer || 'Unnamed stop'} - ${draft.visitType || 'Service'} - saved ${when}.`;
}

function saveReportDraft() {
  const draft = buildServicePassport();
  draft.status = 'draft';
  draft.proofChecks = {
    water: _rptChecked('rpt-proof-water'),
    equipment: _rptChecked('rpt-proof-equipment'),
    summary: _rptChecked('rpt-proof-summary'),
  };
  try {
    localStorage.setItem(REPORT_DRAFT_KEY, JSON.stringify(draft));
    renderReportDraftStatus();
    trackSplashLensEvent('service_report_draft_saved', {
      priority: draft.priority,
      proof_ready: !!(draft.proof && draft.proof.complete),
      chemical_rows: draft.chemicals.length,
    });
  } catch (err) {
    alert('This device could not save the draft locally. Copy or share the report before leaving the page.');
  }
}

function setReportDraftValue(id, value) {
  const el = document.getElementById(id);
  if (el) el.value = value == null ? '' : String(value);
}

function resumeReportDraft() {
  const draft = readReportDraft();
  if (!draft) {
    alert('No saved Service Proof draft is available on this device.');
    return;
  }
  _reportPoolId = draft.poolId || null;
  setReportDraftValue('rpt-customer', draft.customer);
  setReportDraftValue('rpt-address', draft.address);
  setReportDraftValue('rpt-tech', draft.tech);
  setReportDraftValue('rpt-date', draft.date);
  setReportDraftValue('rpt-type', draft.visitType);
  setReportDraftValue('rpt-priority', draft.priority || 'routine');
  setReportDraftValue('rpt-review-to', draft.reviewTo);
  setReportDraftValue('rpt-dose-basis', draft.doseBasis);
  const readings = draft.readings || {};
  setReportDraftValue('rpt-reading-source', readings.source || 'manual');
  ['fc','cc','ph','ta','ch','cya'].forEach(key => setReportDraftValue(`rpt-${key}`, readings[key]));
  const proof = draft.proof || {};
  setReportDraftValue('rpt-photo-proof', proof.photoProof);
  setReportDraftValue('rpt-issue-note', proof.issueNote);
  setReportDraftValue('rpt-customer-summary', proof.customerSummary);
  setReportDraftValue('rpt-work', draft.workPerformed);
  setReportDraftValue('rpt-equip', draft.equipmentNotes);
  setReportDraftValue('rpt-rec', draft.recommendations);
  setReportDraftValue('rpt-next', draft.nextVisit);
  const checks = draft.proofChecks || {};
  ['water','equipment','summary'].forEach(key => {
    const el = document.getElementById(`rpt-proof-${key}`);
    if (el) el.checked = !!checks[key];
  });
  const container = document.getElementById('chem-rows');
  if (container) container.innerHTML = '';
  _chemRowId = 0;
  const chemicals = Array.isArray(draft.chemicals) && draft.chemicals.length ? draft.chemicals : [{}];
  chemicals.forEach(chemical => {
    addChemRow();
    const id = _chemRowId;
    setReportDraftValue(`cr-name-${id}`, chemical.name);
    setReportDraftValue(`cr-amt-${id}`, chemical.amt);
    setReportDraftValue(`cr-cost-${id}`, chemical.cost || '');
    setReportDraftValue(`cr-stock-${id}`, chemical.stock || 'Truck');
  });
  updateReportCostSummary();
  validateReportProof({ quiet: true });
  renderReportDraftStatus();
  trackSplashLensEvent('service_report_draft_resumed', { priority: draft.priority || 'routine' });
}

function clearReportDraft() {
  const draft = readReportDraft();
  if (!draft) return;
  if (!confirm('Clear the saved Service Proof draft from this device?')) return;
  localStorage.removeItem(REPORT_DRAFT_KEY);
  renderReportDraftStatus();
  trackSplashLensEvent('service_report_draft_cleared', {});
}

function findPoolForReport() {
  const pools = getPools();
  if (_reportPoolId) {
    const linked = pools.find(p => p.id === _reportPoolId);
    if (linked) return linked;
  }
  const customer = _rptVal('rpt-customer').toLowerCase();
  const address = _rptVal('rpt-address').toLowerCase();
  return pools.find(p =>
    (customer && p.name && p.name.toLowerCase() === customer) ||
    (address && p.address && p.address.toLowerCase() === address)
  );
}

function saveReportToPoolHistory() {
  if (!ensureFieldSaveAccount('service_report_saved')) return;

  const proof = validateReportProof({ quiet: true });
  if (!proof.complete && !confirm(`Stop proof is incomplete: ${proof.missing.join(', ')}. Save anyway?`)) return;

  const pools = getPools();
  if (!pools.length) {
    alert('Add a pool profile first, then load it into the Visit Report.');
    showTab('pools');
    return;
  }

  const pool = findPoolForReport();
  if (!pool) {
    alert('Load a saved pool before saving this report to history.');
    toggleReportPoolPicker();
    return;
  }

  const passport = buildServicePassport();
  passport.poolId = pool.id;
  const target = pools.find(p => p.id === pool.id);
  if (!target) return;
  if (!target.servicePassports) target.servicePassports = [];
  target.servicePassports.push(passport);
  if (target.servicePassports.length > 100) target.servicePassports = target.servicePassports.slice(-100);
  savePools(pools);
  _reportPoolId = target.id;

  trackSplashLensEvent('service_report_saved', {
    proof_ready: proof.complete,
    pool_id: target.id,
    visit_type: passport.visitType,
  });
  if (proof.complete) {
    trackSplashLensEvent('proof_ready_report_saved', { pool_id: target.id, visit_type: passport.visitType });
  }
  window.SplashLensFieldSignals?.offerSystemNotificationsAfterValue('service_report_saved');

  const el = document.getElementById('rpt-copy-confirm');
  if (el) {
    el.textContent = `Saved to ${target.name} history.`;
    el.style.display = 'block';
    setTimeout(() => {
      el.style.display = 'none';
      el.textContent = 'Copied to clipboard!';
    }, 3000);
  }
}

function copyReport() {
  const proof = validateReportProof({ quiet: true });
  if (!proof.complete && !confirm(`Stop proof is incomplete: ${proof.missing.join(', ')}. Copy anyway?`)) return;
  const text = buildReportText();
  navigator.clipboard.writeText(text).then(() => {
    const el = document.getElementById('rpt-copy-confirm');
    if (el) { el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 2600); }
  });
}

function shareReport() {
  const proof = validateReportProof({ quiet: true });
  if (!proof.complete && !confirm(`Stop proof is incomplete: ${proof.missing.join(', ')}. Share anyway?`)) return;
  const text = buildReportText();
  trackSplashLensEvent('service_report_shared', { proof_ready: proof.complete, method: navigator.share ? 'native' : 'clipboard' });
  if (navigator.share) {
    navigator.share({ title: 'Pool Service Report', text }).catch(() => {});
  } else {
    // Fallback: copy + show confirm
    navigator.clipboard.writeText(text).then(() => {
      const el = document.getElementById('rpt-copy-confirm');
      if (el) { el.style.display = 'block'; setTimeout(() => { el.style.display = 'none'; }, 2600); }
    });
  }
}

function printReport() {
  const proof = validateReportProof({ quiet: true });
  if (!proof.complete && !confirm(`Stop proof is incomplete: ${proof.missing.join(', ')}. Print anyway?`)) return;
  const text = buildReportText();
  const safe = text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  const win  = window.open('', '_blank');
  if (!win) return;
  win.document.write(`<!DOCTYPE html><html><head>
    <meta charset="UTF-8"><title>Pool Service Report</title>
    <style>body{font-family:'Courier New',monospace;font-size:13px;color:#111;padding:36px;max-width:620px;margin:0 auto;}
    pre{white-space:pre-wrap;word-wrap:break-word;line-height:1.75;}
    @media print{body{padding:16px;}}</style>
  </head><body><pre>${safe}</pre>
  <script>window.onload=()=>window.print();<\/script></body></html>`);
  win.document.close();
}

// ═══════════════════════════════════════════
// TREATMENT PLAN GENERATOR
// ═══════════════════════════════════════════
function calcTreatmentPlan() {
  const fc  = gf('plan-fc');
  const cc  = gf('plan-cc');
  const ph  = gf('plan-ph');
  const ta  = gf('plan-ta');
  const ch  = gf('plan-ch');
  const cya = gf('plan-cya');
  const vol = gf('plan-vol');

  if ([ph, ta].some(v => isNaN(v)) && isNaN(fc)) {
    return setEl('plan-result', errorBox('Enter at least FC, pH, TA, and CYA to generate a plan.'));
  }

  const steps = [];
  const minFC = (!isNaN(cya) && cya > 0) ? Math.max(2, cya * 0.075) : 3;
  const needsSlam = (!isNaN(cc) && cc >= 0.5) || (!isNaN(fc) && fc < minFC * 0.5);

  // TA first (affects pH buffer capacity)
  if (!isNaN(ta)) {
    if (ta < 60) {
      const delta = 80 - ta;
      const dose = (!isNaN(vol) && vol > 0) ? ((delta / 10) * (vol / 10000) * 1.5).toFixed(1) + ' lbs Baking Soda' : 'baking soda (see Dosing Calculator for dose)';
      steps.push({ num:1, type:'ta', icon:'↑', label:'Raise Total Alkalinity',
        detail:`TA is ${ta} ppm — low. Target 80–100 ppm.`,
        action:`Add ${dose}. Broadcast across the surface with pump running.`,
        wait:'15 min, retest before adjusting pH' });
    } else if (ta > 130) {
      steps.push({ num:1, type:'ta', icon:'↓', label:'Lower Total Alkalinity',
        detail:`TA is ${ta} ppm — high. Target 80–100 ppm.`,
        action:'Add muriatic acid to lower TA, then aerate aggressively (jets, fountains, waterfall) to raise pH without adding more TA. Multiple doses over several days.',
        wait:'Multiple sessions — retest daily' });
    }
  }

  // pH
  if (!isNaN(ph)) {
    if (ph < 7.2) {
      const delta = 7.4 - ph;
      const oz = (!isNaN(vol) && vol > 0) ? Math.round((delta / 0.1) * (vol / 10000) * 3.0) + ' oz Soda Ash (pH Up)' : 'soda ash (see Dosing Calculator)';
      steps.push({ num:2, type:'ph', icon:'↑', label:'Raise pH',
        detail:`pH is ${ph} — too low. Target 7.4–7.6.`,
        action:`Add ${oz}. Broadcast across the deep end with pump running.`,
        wait:'30 min, then retest' });
    } else if (ph > 7.8) {
      steps.push({ num:2, type:'ph', icon:'↓', label:'Lower pH',
        detail:`pH is ${ph} — too high. Target 7.4–7.6.`,
        action:'Add muriatic acid (or dry acid). Pre-dilute in a bucket of water first. See Dosing Calculator for exact dose based on your TA level.',
        wait:'30 min, then retest' });
    }
  }

  // CYA
  if (!isNaN(cya)) {
    if (cya < 30) {
      const delta = 40 - cya;
      const dose = (!isNaN(vol) && vol > 0) ? ((delta / 10) * (vol / 10000) * 0.73).toFixed(2) + ' lbs Cyanuric Acid' : 'cyanuric acid (see Dosing Calculator)';
      steps.push({ num:3, type:'cya', icon:'↑', label:'Add Stabilizer (CYA)',
        detail:`CYA is ${cya} ppm — low. Target 30–50 ppm (salt pools: 60–80).`,
        action:`Add ${dose} in a sock hung in the skimmer basket. Dissolves slowly.`,
        wait:'7–14 days before retesting (dissolves slowly)' });
    } else if (cya > 80) {
      const drainPct = Math.round((1 - 50 / cya) * 100);
      const drainGal = (!isNaN(vol) && vol > 0) ? ` (${Math.round(vol * drainPct / 100).toLocaleString()} gallons)` : '';
      steps.push({ num:3, type:'cya', icon:'⚠', label:'Lower CYA — Partial Drain Required',
        detail:`CYA is ${cya} ppm — above 80. No chemical removes CYA.`,
        action:`Drain and replace approximately ${drainPct}%${drainGal} of pool water. Rebalance all chemistry after refill.`,
        wait:'After refill — retest and rebalance' });
    }
  }

  // CH
  if (!isNaN(ch)) {
    if (ch < 150) {
      const delta = 250 - ch;
      const dose = (!isNaN(vol) && vol > 0) ? ((delta / 10) * (vol / 10000) * 1.25).toFixed(1) + ' lbs Calcium Chloride' : 'calcium chloride (see Dosing Calculator)';
      steps.push({ num:4, type:'ch', icon:'↑', label:'Raise Calcium Hardness',
        detail:`CH is ${ch} ppm — low. Target 200–400 ppm.`,
        action:`Add ${dose}. ⚠ Pre-dissolve in a bucket of water — extremely exothermic. Pour slowly around pool edge.`,
        wait:'4 hours before next addition' });
    } else if (ch > 450) {
      const drainPct = Math.round((1 - 300 / ch) * 100);
      steps.push({ num:4, type:'ch', icon:'↓', label:'Lower Calcium Hardness — Dilute',
        detail:`CH is ${ch} ppm — scaling risk at this level.`,
        action:`Drain and replace approximately ${drainPct}% of pool water. No chemical lowers CH.`,
        wait:'After refill — retest and rebalance' });
    }
  }

  // SLAM (priority 0 — rendered first despite being added last)
  if (needsSlam) {
    const slamCYA = (!isNaN(cya) && cya > 0) ? cya : 40;
    const slamFC = Math.round(slamCYA * 0.40);
    const reason = (!isNaN(cc) && cc >= 0.5)
      ? `CC is ${cc} ppm — combined chlorine indicates contamination. Must shock to breakpoint.`
      : `FC is ${!isNaN(fc) ? fc : '?'} ppm — critically low vs CYA level.`;
    steps.unshift({ num:0, type:'slam', icon:'🚨', label:'SLAM Required — Shock to Breakpoint',
      detail: reason,
      action:`Raise FC to ${slamFC} ppm (CYA × 40%). Use liquid chlorine or cal-hypo. Test every 4–6 hours and maintain SLAM level until: CC < 0.5, water is visually clear, and OCLT passes (< 1 ppm FC loss overnight).`,
      wait:'Continue until all 3 pass criteria met before moving to other adjustments' });
  } else if (!isNaN(fc) && fc < minFC) {
    const delta = minFC - fc;
    const doseStr = (!isNaN(vol) && vol > 0) ? (() => {
      const oz = delta * (vol / 10000) * 12.85;
      return oz >= 128 ? (oz / 128).toFixed(1) + ' gal' : oz.toFixed(0) + ' fl oz';
    })() + ' Liquid Chlorine 10%' : 'chlorine (see Dosing Calculator)';
    steps.push({ num:5, type:'fc', icon:'↑', label:'Add Chlorine',
      detail:`FC is ${fc} ppm — below minimum target of ${minFC.toFixed(0)} ppm for your CYA level.`,
      action:`Add ${doseStr}. Distribute around pool perimeter with pump running.`,
      wait:'15 min circulation, then retest' });
  }

  if (steps.length === 0) {
    return setEl('plan-result', `
      <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px;text-align:center;">
        <div style="font-size:36px;margin-bottom:10px;">✓</div>
        <p style="color:#166534;font-size:16px;font-weight:900;margin-bottom:6px;">Water is Balanced!</p>
        <p style="color:#374151;font-size:13px;">All parameters are within target range. No adjustments needed today.</p>
      </div>`);
  }

  const typeColors = {
    slam:{ bg:'#fef2f2', bdr:'#fca5a5', txt:'#991b1b', dot:'#dc2626' },
    ph:  { bg:'#fffbeb', bdr:'#fcd34d', txt:'#92400e', dot:'#d97706' },
    ta:  { bg:'#f0f9ff', bdr:'#7dd3fc', txt:'#0369a1', dot:'#0284c7' },
    cya: { bg:'#faf5ff', bdr:'#d8b4fe', txt:'#6b21a8', dot:'#7c3aed' },
    ch:  { bg:'#fff7ed', bdr:'#fed7aa', txt:'#9a3412', dot:'#ea580c' },
    fc:  { bg:'#eff6ff', bdr:'#93c5fd', txt:'#1e40af', dot:'#0369a1' },
  };

  const slamWarn = needsSlam
    ? `<div class="warn-box" style="margin-bottom:14px;font-size:12px;">⚠ SLAM condition — complete Step 1 before adjusting pH, TA, or CH. Do not cover pool during SLAM.</div>`
    : '';

  setEl('plan-result', `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:16px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:900;font-size:14px;margin-bottom:12px;">Treatment Plan — ${steps.length} step${steps.length !== 1 ? 's' : ''}</p>
      ${slamWarn}
      ${steps.map((step, i) => {
        const c = typeColors[step.type] || typeColors.fc;
        return `<div style="background:${c.bg};border:1px solid ${c.bdr};border-radius:10px;padding:14px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
            <div style="width:26px;height:26px;min-width:26px;border-radius:50%;background:${c.dot};color:white;display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:900;">${i + 1}</div>
            <p style="color:${c.txt};font-weight:900;font-size:14px;">${step.label}</p>
          </div>
          <p style="color:#374151;font-size:12px;margin-bottom:8px;">${step.detail}</p>
          <div style="background:rgba(255,255,255,0.75);border-radius:6px;padding:9px 11px;margin-bottom:6px;">
            <p style="color:#0f172a;font-size:13px;font-weight:600;line-height:1.5;">${step.action}</p>
          </div>
          <p style="color:#64748b;font-size:11px;"><strong>Wait:</strong> ${step.wait}</p>
        </div>`;
      }).join('')}
      <p style="color:#94a3b8;font-size:10px;margin-top:8px;">Always add chemicals one at a time with pump running. Retest after each step before proceeding.${!isNaN(vol) && vol > 0 ? ' Volume: ' + Number(vol).toLocaleString() + ' gal.' : ''}</p>
    </div>`);
}

// ═══════════════════════════════════════════
// DRAIN / REFILL CALCULATOR
// ═══════════════════════════════════════════
function calcDrainRefill() {
  const vol     = gf('drain-vol');
  const current = gf('drain-current');
  const target  = gf('drain-target');
  if (isNaN(vol) || vol <= 0)       return setEl('drain-result', errorBox('Enter pool volume.'));
  if (isNaN(current) || current <= 0) return setEl('drain-result', errorBox('Enter current level.'));
  if (isNaN(target)  || target <= 0)  return setEl('drain-result', errorBox('Enter target level.'));
  if (target >= current) return setEl('drain-result', infoBox('Current is already at or below target.', 'No drain needed. Dilution is not required.'));
  const pct       = (1 - target / current) * 100;
  const drainGal  = Math.round(vol * pct / 100);
  const refillGal = drainGal;
  setEl('drain-result', `
    <div class="result-wrap">
      <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Drain Required</p>
      <p class="result-amount">${pct.toFixed(0)}%</p>
      <p class="result-alt">${drainGal.toLocaleString()} gallons to drain and refill</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:10px;text-align:center;">
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;margin-bottom:4px;">Drain Out</p>
          <p style="color:#991b1b;font-size:18px;font-weight:900;">${drainGal.toLocaleString()}</p>
          <p style="color:#64748b;font-size:10px;">gallons</p>
        </div>
        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:10px;text-align:center;">
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;margin-bottom:4px;">Refill With</p>
          <p style="color:#166534;font-size:18px;font-weight:900;">${refillGal.toLocaleString()}</p>
          <p style="color:#64748b;font-size:10px;">gallons fresh</p>
        </div>
      </div>
      <div class="result-note" style="margin-top:12px;">Draining ${pct.toFixed(0)}% reduces level from ${current} → approximately ${Math.round(current * (1 - pct / 100))} ppm. Rebalance all chemistry after refill.</div>
    </div>`);
}

// ═══════════════════════════════════════════
// TURNOVER RATE CALCULATOR
// ═══════════════════════════════════════════
function calcTurnoverRate() {
  const vol = gf('turn-vol');
  const gpm = gf('turn-gpm');
  if (isNaN(vol) || vol <= 0) return setEl('turn-result', errorBox('Enter pool volume.'));
  if (isNaN(gpm) || gpm <= 0) return setEl('turn-result', errorBox('Enter pump flow rate (GPM).'));
  const hours = vol / (gpm * 60);
  const isGood = hours <= 8;
  const isOk   = hours <= 12;
  const status = isGood ? { label:'Good', color:'#166534', bg:'#f0fdf4', border:'#86efac' }
               : isOk   ? { label:'Marginal', color:'#92400e', bg:'#fffbeb', border:'#fcd34d' }
               :           { label:'Too Slow', color:'#991b1b', bg:'#fef2f2', border:'#fca5a5' };
  const dailyRec = Math.ceil(8 / hours);
  trackSplashLensEvent('first_value_completed', {
    role: getSplashLensRole(),
    workflow: 'turnover_calculator',
    hours: Number(hours.toFixed(2)),
    status: status.label,
    time_back_message: 'Turnover answer calculated without a spreadsheet.',
  });
  setEl('turn-result', `
    <div class="result-wrap">
      <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:10px;">Turnover Rate</p>
      <p class="result-amount">${hours.toFixed(1)} hrs</p>
      <p class="result-alt">per full pool turnover</p>
      <div style="background:${status.bg};border:1px solid ${status.border};border-radius:8px;padding:12px;margin-top:12px;text-align:center;">
        <p style="color:${status.color};font-size:14px;font-weight:900;">${status.label}</p>
        <p style="color:#374151;font-size:12px;margin-top:4px;">
          ${isGood ? 'On target. Residential pools need at least 1 full turnover per 8 hours of pump runtime.'
          : isOk   ? `Run pump at least ${dailyRec > 1 ? dailyRec + ' turnovers/day (extend runtime)' : 'longer daily'}.`
                   : `Flow rate is too low. Check filter PSI, basket blockage, or impeller wear. Target: ≤ 8 hrs per turnover.`}
        </p>
      </div>
      <p class="result-basis">${vol.toLocaleString()} gal ÷ ${gpm} GPM · Recommended: &le; 8 hrs residential, &le; 6 hrs commercial</p>
    </div>`);
}

// ═══════════════════════════════════════════
// SALT CHLORINATOR REFERENCE
// ═══════════════════════════════════════════
function renderSaltSection() {
  const data = window.SALT_CHLORINATOR_DATA;
  const brandRows = data.saltTargets.map((b, i) =>
    `<tr style="background:${i % 2 ? '#f8fafc' : '#ffffff'};">
       <td style="padding:8px 12px;color:#0f172a;font-size:12px;font-weight:700;">${b.brand}</td>
       <td style="padding:8px 12px;color:#0369a1;font-size:12px;font-weight:800;">${b.target}</td>
     </tr>`).join('');

  setEl('salt-section', `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);overflow:hidden;">
      <table style="width:100%;border-collapse:collapse;">
        <thead><tr style="background:#f1f5f9;border-bottom:2px solid #e2e8f0;">
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Brand</th>
          <th style="padding:8px 12px;text-align:left;color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;">Salt Target</th>
        </tr></thead>
        <tbody>${brandRows}</tbody>
      </table>
    </div>

    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:10px 12px;margin-bottom:12px;">
      <p style="color:#0369a1;font-size:12px;font-weight:800;">Salt to Raise Level</p>
      <p style="color:#374151;font-size:12px;margin-top:4px;">0.83 lbs per 1,000 gallons per 100 ppm rise · Test with a digital salt meter, not strips</p>
      <p style="color:#0369a1;font-size:12px;font-weight:800;margin-top:8px;">CYA Recommendation for Salt Pools</p>
      <p style="color:#374151;font-size:12px;margin-top:4px;">${data.cyaRecommendation}</p>
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:10px;">Cell Maintenance</p>
      ${data.maintenance.map(s => `<p style="color:#374151;font-size:12px;padding:4px 0;display:flex;gap:7px;border-bottom:1px solid #f1f5f9;"><span style="color:#0284c7;flex-shrink:0;">•</span>${s}</p>`).join('')}
    </div>

    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:4px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#92400e;font-weight:800;font-size:13px;margin-bottom:8px;">Low Output Causes</p>
      ${data.lowOutputCauses.map(s => `<p style="color:#374151;font-size:12px;padding:4px 0;display:flex;gap:7px;"><span style="color:#dc2626;flex-shrink:0;">•</span>${s}</p>`).join('')}
    </div>`);
}

// ═══════════════════════════════════════════
// CHEMICAL SAFETY / DANGER GUIDE
// ═══════════════════════════════════════════
function renderDangerSection() {
  const data = window.CHEM_DANGER_DATA;
  const sevColor = { deadly:'#991b1b', high:'#92400e' };
  const sevBg    = { deadly:'#fef2f2', high:'#fffbeb' };
  const sevBdr   = { deadly:'#fca5a5', high:'#fcd34d' };

  setEl('danger-section', `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#991b1b;font-weight:900;font-size:13px;margin-bottom:12px;">☠ Never Mix These</p>
      ${data.neverMix.map(d => `
        <div style="background:${sevBg[d.severity]};border:1px solid ${sevBdr[d.severity]};border-radius:8px;padding:10px;margin-bottom:8px;">
          <p style="color:${sevColor[d.severity]};font-size:13px;font-weight:800;margin-bottom:4px;">${d.icon} ${d.combo}</p>
          <p style="color:#374151;font-size:12px;line-height:1.45;">${d.result}</p>
        </div>`).join('')}
    </div>
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:12px;box-shadow:0 1px 3px rgba(0,0,0,0.06);">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:10px;">Safe Handling Rules</p>
      ${data.safeHandling.map(s => `<p style="color:#374151;font-size:12px;padding:4px 0;display:flex;gap:7px;border-bottom:1px solid #f1f5f9;"><span style="color:#0369a1;flex-shrink:0;">✓</span>${s}</p>`).join('')}
    </div>`);
}

// ═══════════════════════════════════════════
// REPORT: LOAD FROM POOL PROFILE
// ═══════════════════════════════════════════
function toggleReportPoolPicker() {
  const picker = document.getElementById('rpt-pool-picker');
  if (!picker) return;
  if (picker.style.display !== 'none') { picker.style.display = 'none'; picker.innerHTML = ''; return; }
  const pools = getPools();
  if (!pools.length) {
    picker.style.display = '';
    picker.innerHTML = `<p style="color:#94a3b8;font-size:13px;text-align:center;padding:8px;">No pools saved yet. Add pools in the Pools tab first.</p>`;
    return;
  }
  picker.style.display = '';
  picker.innerHTML = `
    <p style="color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;">Select Pool to Auto-Fill</p>
    ${pools.map(p => `
      <div onclick="loadReportFromPool('${p.id}')"
           style="padding:10px;border-radius:7px;border:1px solid #e2e8f0;background:#ffffff;cursor:pointer;margin-bottom:6px;-webkit-tap-highlight-color:transparent;">
        <p style="color:#0f172a;font-size:14px;font-weight:700;">${escHtml(p.name)}</p>
        ${p.address ? `<p style="color:#64748b;font-size:12px;">${escHtml(p.address)}</p>` : ''}
        ${p.gallons  ? `<p style="color:#0284c7;font-size:11px;">${Number(p.gallons).toLocaleString()} gal</p>` : ''}
      </div>`).join('')}`;
}

function loadReportFromPool(poolId) {
  const pool = getPools().find(p => p.id === poolId);
  if (!pool) return;
  const setV = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  setV('rpt-customer', pool.name);
  setV('rpt-address',  pool.address);
  _reportPoolId = pool.id;
  if (pool.gallons) onVolumeChange(pool.gallons);
  const picker = document.getElementById('rpt-pool-picker');
  if (picker) { picker.style.display = 'none'; picker.innerHTML = ''; }
  const confirm = document.createElement('div');
  confirm.className = 'info-box';
  confirm.style.cssText = 'margin-bottom:10px;font-size:12px;';
  confirm.textContent = `Loaded: ${pool.name}`;
  const rptHead = document.getElementById('rpt-pool-picker');
  if (rptHead) { rptHead.parentNode.insertBefore(confirm, rptHead); setTimeout(() => confirm.remove(), 2500); }
}

// ═══════════════════════════════════════════
// OFFLINE STATUS INDICATOR
// ═══════════════════════════════════════════
function checkOfflineStatus() {
  const dot = document.getElementById('offline-dot');
  if (!dot) return;
  const setDot = (color, title) => { dot.style.background = color; dot.title = title; };
  if (!('serviceWorker' in navigator)) return;
  if (navigator.serviceWorker.controller) {
    setDot('#4ade80', 'Offline ready - core tools cached');
  } else {
    navigator.serviceWorker.ready.then(() => {
      setDot('#4ade80', 'Offline ready - core tools cached');
    }).catch(() => setDot('#fbbf24', 'Caching in progress'));
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    setDot('#4ade80', 'Offline ready - core tools cached');
  });
}

// ═══════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════
function gv(id) { const el = document.getElementById(id); return el ? el.value : ''; }
function gf(id) { const el = document.getElementById(id); return el ? parseFloat(el.value) : NaN; }
function setEl(id, html) { const el = document.getElementById(id); if (el) el.innerHTML = html; }
function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]/g, '_').replace(/_+/g, '_'); }
function esc(s)  { return s.replace(/'/g, "\\'"); }

function fmtAmt(amount, unit) {
  if (unit === 'fl oz') {
    if (amount >= 128) return { main: `${(amount/128).toFixed(2)} gal`, alt: `(${amount.toFixed(0)} fl oz)` };
    if (amount >= 32)  return { main: `${(amount/32).toFixed(2)} qts`, alt: `(${amount.toFixed(0)} fl oz)` };
    if (amount >= 8)   return { main: `${(amount/8).toFixed(1)} cups`, alt: `(${amount.toFixed(0)} fl oz)` };
    return { main: `${amount.toFixed(1)} fl oz`, alt: '' };
  }
  if (unit === 'oz dry') {
    if (amount >= 32) return { main: `${(amount/16).toFixed(2)} lbs`, alt: `(${amount.toFixed(0)} oz)` };
    if (amount >= 16) { const lbs = Math.floor(amount/16); return { main: `${lbs} lb ${(amount - lbs*16).toFixed(0)} oz`, alt: '' }; }
    return { main: `${amount.toFixed(1)} oz`, alt: '' };
  }
  if (unit === 'lbs') {
    const lbs = Math.floor(amount);
    const oz  = Math.round((amount - lbs) * 16);
    if (oz === 0 || lbs === 0) return { main: `${amount.toFixed(2)} lbs`, alt: '' };
    return { main: `${lbs} lbs ${oz} oz`, alt: `(${amount.toFixed(2)} lbs)` };
  }
  return { main: `${amount.toFixed(2)} ${unit}`, alt: '' };
}

function interpMuriatic(ta) {
  const f = window.CHEM_DATA.dosing.ph.muriaticFactor;
  const keys = Object.keys(f).map(Number).sort((a,b) => a-b);
  if (ta <= keys[0]) return f[keys[0]];
  if (ta >= keys[keys.length-1]) return f[keys[keys.length-1]];
  for (let i = 0; i < keys.length - 1; i++) {
    if (ta >= keys[i] && ta <= keys[i+1]) {
      const r = (ta - keys[i]) / (keys[i+1] - keys[i]);
      return f[keys[i]] + r * (f[keys[i+1]] - f[keys[i]]);
    }
  }
  return f[100];
}

// ═══════════════════════════════════════════
// POOLS — CUSTOMER PROFILES
// ═══════════════════════════════════════════
const POOLS_KEY = 'poolens-pools';

function getPools() {
  try { return JSON.parse(localStorage.getItem(POOLS_KEY) || '[]'); }
  catch(e) { return []; }
}

function savePools(pools) {
  localStorage.setItem(POOLS_KEY, JSON.stringify(pools));
}

function initPools() {
  renderPoolList();
}

// ─── POOL LIST VIEW ───────────────────────
function renderPoolList() {
  S.poolView = 'list';
  S.pool = null;
  const pools = getPools();
  const container = document.getElementById('pools-content');
  if (!container) return;

  if (pools.length === 0) {
    container.innerHTML = `
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
        <p style="color:#0369a1;font-weight:900;font-size:16px;">My Pools</p>
      </div>
      <div style="text-align:center;padding:48px 16px 32px;">
        <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2" style="margin:0 auto 16px;display:block;"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
        <p style="font-size:16px;color:#475569;font-weight:700;margin-bottom:6px;">No pools saved yet</p>
        <p style="font-size:13px;color:#94a3b8;margin-bottom:22px;">Save customer profiles with chemistry history.</p>
        <button onclick="renderPoolForm(null)" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border:none;border-radius:10px;padding:13px 28px;font-size:15px;font-weight:800;cursor:pointer;letter-spacing:0.03em;">+ Add Your First Pool</button>
      </div>`;
    return;
  }

  const cards = pools.map(p => {
    const historyCount = (p.history || []).length;
    const passportCount = (p.servicePassports || []).length;
    const lastService = passportCount ? p.servicePassports[p.servicePassports.length - 1] : null;
    const lastDate = lastService
      ? `Last service: ${lastService.date}`
      : historyCount
      ? `Last reading: ${p.history[p.history.length - 1].date}`
      : 'No service history yet';
    const gallonsDisplay = p.gallons ? Number(p.gallons).toLocaleString() + ' gal' : '';
    return `
      <div class="pool-card" onclick="renderPoolDetail('${p.id}')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
          <div style="flex:1;min-width:0;">
            <div class="pool-card-name">${escHtml(p.name)}</div>
            ${p.address ? `<div class="pool-card-meta" style="margin-bottom:3px;">${escHtml(p.address)}</div>` : ''}
            <div class="pool-card-meta">${[p.type, p.sanitizer, gallonsDisplay].filter(Boolean).join(' · ')}</div>
          </div>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;margin-top:4px;"><polyline points="9 18 15 12 9 6"/></svg>
        </div>
        <div style="margin-top:8px;padding-top:8px;border-top:1px solid #f1f5f9;">
          <span style="color:#64748b;font-size:11px;">${lastDate}</span>
          ${passportCount || historyCount ? `<span style="color:#0369a1;font-size:11px;font-weight:700;float:right;">${passportCount} report${passportCount !== 1 ? 's' : ''} / ${historyCount} reading${historyCount !== 1 ? 's' : ''}</span>` : ''}
        </div>
      </div>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
      <p style="color:#0369a1;font-weight:900;font-size:16px;">My Pools</p>
      <button onclick="renderPoolForm(null)" style="background:#0369a1;color:white;border:none;border-radius:8px;padding:7px 14px;font-size:12px;font-weight:800;cursor:pointer;letter-spacing:0.03em;">+ New Pool</button>
    </div>
    ${cards}`;
}

// ─── POOL DETAIL VIEW ─────────────────────
function renderPoolDetail(id) {
  S.poolView = 'detail';
  S.pool = id;
  const pools = getPools();
  const p = pools.find(x => x.id === id);
  if (!p) { renderPoolList(); return; }

  const historyHtml = (() => {
    if (!p.history || p.history.length === 0) {
      return `<p style="color:#94a3b8;font-size:13px;padding:14px 0;text-align:center;">No readings saved yet.</p>`;
    }
    const sorted = [...p.history].reverse().slice(0, 20);
    return sorted.map((r, i) => {
      const uid = `reading-${id}-${i}`;
      const dateStr = r.date || '';
      const summary = [
        r.fc  != null ? `FC ${r.fc}`  : '',
        r.ph  != null ? `pH ${r.ph}`  : '',
        r.ta  != null ? `TA ${r.ta}`  : '',
        r.cya != null ? `CYA ${r.cya}` : '',
      ].filter(Boolean).join('  ');
      return `
        <div class="pool-reading-row" onclick="toggleReadingDetail('${uid}')">
          <div style="display:flex;align-items:center;justify-content:space-between;">
            <div>
              <span style="color:#0f172a;font-size:13px;font-weight:700;">${dateStr}</span>
              ${r.note ? `<span style="color:#64748b;font-size:11px;margin-left:8px;">· ${escHtml(r.note)}</span>` : ''}
            </div>
            <svg id="rchev-${uid}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;transition:transform 0.2s;"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
          <p style="color:#64748b;font-size:12px;margin-top:4px;">${summary}</p>
          <div id="${uid}" class="pool-reading-detail">
            ${poolReadingDetailGrid(r)}
          </div>
        </div>`;
    }).join('');
  })();

  const serviceHistoryHtml = renderServicePassportHistory(p);
  const equipmentTreeHtml = renderPoolEquipmentTree(p);
  const fieldIntelHtml = renderPoolFieldIntelligence(p);

  const container = document.getElementById('pools-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <button onclick="renderPoolList()" style="background:#f1f5f9;border:none;border-radius:8px;padding:7px 12px;cursor:pointer;display:flex;align-items:center;gap:5px;color:#374151;font-size:13px;font-weight:700;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <p style="color:#0369a1;font-weight:900;font-size:16px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escHtml(p.name)}</p>
      <button onclick="renderPoolForm('${id}')" style="background:#f1f5f9;border:none;border-radius:8px;padding:7px 12px;cursor:pointer;color:#374151;font-size:12px;font-weight:700;">Edit</button>
    </div>

    <!-- Info pills -->
    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:14px;">
      ${p.gallons ? poolPill(Number(p.gallons).toLocaleString() + ' gal') : ''}
      ${p.type    ? poolPill(p.type)    : ''}
      ${p.filter  ? poolPill(p.filter + (p.filterDia ? ' ' + p.filterDia + '"' : '') + ' filter') : ''}
      ${p.sanitizer ? poolPill(p.sanitizer) : ''}
    </div>

    ${fieldIntelHtml}

    ${p.heater ? `
      <div class="pool-form-panel" style="padding:12px;margin-bottom:10px;">
        <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Equipment</p>
        <p style="color:#0f172a;font-size:13px;">${escHtml(p.heater)}</p>
      </div>` : ''}

    ${equipmentTreeHtml}

    <!-- Notes -->
    <div class="pool-form-panel" style="padding:12px;margin-bottom:14px;">
      <div class="note-tools">
        <p class="field-label">Notes</p>
        ${voiceNoteButton('pool-notes-ta')}
      </div>
      <textarea id="pool-notes-ta" class="pool-textarea" rows="3" placeholder="Gate code, special instructions…" onblur="savePoolNotes('${id}')">${escHtml(p.notes || '')}</textarea>
    </div>

    <!-- Use in Dosing -->
    ${p.gallons ? `
    <button class="btn-outline-blue" style="margin-bottom:14px;" onclick="usePoolInDosing(${Number(p.gallons)})">
      → Use ${Number(p.gallons).toLocaleString()} gal in Dosing Calculator
    </button>` : ''}

    <!-- Chemistry History -->
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <p style="color:#0369a1;font-weight:900;font-size:15px;">Chemistry History</p>
      <button onclick="showChemForm('${id}')" style="background:#eff6ff;border:1px solid #93c5fd;color:#0369a1;font-size:12px;font-weight:700;padding:6px 12px;border-radius:6px;cursor:pointer;">+ Save Today</button>
    </div>

    <div id="chem-form-wrap-${id}"></div>

    <div id="history-list-${id}">
      ${historyHtml}
    </div>

    <hr class="section-div">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">
      <p style="color:#0369a1;font-weight:900;font-size:15px;">Saved Job Notes</p>
      <button onclick="loadReportFromPool('${id}');showTab('report')" style="background:#ecfeff;border:1px solid #67e8f9;color:#0e7490;font-size:12px;font-weight:800;padding:6px 12px;border-radius:6px;cursor:pointer;">+ New Report</button>
    </div>
    <div id="service-passports-${id}">
      ${serviceHistoryHtml}
    </div>

    <hr class="section-div">
    <button class="btn-delete" onclick="deletePool('${id}')">Delete Pool</button>
    <div style="height:8px;"></div>`;
  window.SplashLensFieldSignals?.onPoolViewed(p);
}

function poolPill(text) {
  return `<span style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:4px 11px;font-size:12px;font-weight:700;color:#374151;">${escHtml(text)}</span>`;
}

function renderPoolFieldIntelligence(pool) {
  const intel = poolFieldIntel(pool);
  const trendFlags = poolTrendFlags(pool);
  const next = pool.nextVisitReminder || {};
  const due = next.date ? next.date : 'Not set';
  const dueColor = intel.callbackRisk.level === 'high' ? '#991b1b' : intel.callbackRisk.level === 'medium' ? '#92400e' : '#166534';
  const dueBg = intel.callbackRisk.level === 'high' ? '#fee2e2' : intel.callbackRisk.level === 'medium' ? '#fef3c7' : '#dcfce7';
  return `
    <section class="pool-form-panel" style="padding:12px;margin-bottom:10px;border-left:4px solid #0f766e;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
        <div>
          <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:4px;">Field Intelligence Layer</p>
          <p style="color:#0f172a;font-size:16px;font-weight:950;line-height:1.1;">Proof, history, and next-stop memory.</p>
        </div>
        <span style="background:${dueBg};color:${dueColor};border-radius:999px;padding:4px 8px;font-size:10px;font-weight:950;white-space:nowrap;">${intel.callbackRisk.label}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px;">
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;text-align:center;"><strong style="display:block;color:#0369a1;font-size:17px;">${intel.passports}</strong><span style="display:block;color:#64748b;font-size:10px;font-weight:800;">proof saves</span></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;text-align:center;"><strong style="display:block;color:#0369a1;font-size:17px;">${intel.equipment}</strong><span style="display:block;color:#64748b;font-size:10px;font-weight:800;">equipment</span></div>
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;text-align:center;"><strong style="display:block;color:#0369a1;font-size:17px;">${intel.readings}</strong><span style="display:block;color:#64748b;font-size:10px;font-weight:800;">readings</span></div>
      </div>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:9px;margin-bottom:10px;">
        <p style="color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Next visit reminder</p>
        <p style="color:#0f172a;font-size:12px;font-weight:900;">${escHtml(due)}</p>
        ${next.note ? `<p style="color:#64748b;font-size:11px;line-height:1.35;margin-top:4px;">${escHtml(next.note)}</p>` : '<p style="color:#94a3b8;font-size:11px;line-height:1.35;margin-top:4px;">Set a reminder for the thing that will create the callback.</p>'}
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:9px;margin-bottom:10px;">
        <p style="color:#9a3412;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">Service memory trends</p>
        ${trendFlags.length ? `<ul style="margin:0 0 0 16px;color:#7c2d12;font-size:11px;line-height:1.45;font-weight:750;">${trendFlags.map(flag => `<li>${escHtml(flag)}</li>`).join('')}</ul>` : '<p style="color:#9a3412;font-size:11px;line-height:1.45;font-weight:750;">No repeat pattern yet. Save a few visits, PartSnap packets, or Route Brain checks to build signal.</p>'}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="copyPoolCRMPacket('${pool.id}')" style="background:#0369a1;color:#fff;border:0;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Copy CRM Packet</button>
        <button onclick="sharePoolCRMPacket('${pool.id}')" style="background:#0f766e;color:#fff;border:0;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Share / Export</button>
        <button onclick="showNextVisitReminderForm('${pool.id}')" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Set Reminder</button>
        <button onclick="loadReportFromPool('${pool.id}');showTab('report')" style="background:#f1f5f9;color:#334155;border:1px solid #cbd5e1;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">New Visit</button>
        <button onclick="downloadPoolCSV('${pool.id}')" style="background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Download CSV</button>
        <button onclick="printPoolPacket('${pool.id}')" style="background:#f8fafc;color:#0369a1;border:1px solid #bae6fd;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Print / PDF</button>
      </div>
      <div id="next-visit-form-${pool.id}"></div>
      <p style="color:#94a3b8;font-size:10px;line-height:1.35;margin-top:8px;">This is not a CRM replacement. Use this packet to feed your service CRM, accounting notes, a dispatcher, or a senior tech.</p>
    </section>`;
}

function poolFieldIntel(pool) {
  const passports = pool.servicePassports || [];
  const equipment = pool.equipmentTree || [];
  const readings = pool.history || [];
  const incomplete = passports.filter(p => p.proof && p.proof.complete === false).length;
  const highRisk = passports.filter(p => (p.callbackRisk && p.callbackRisk.level === 'high') || (p.routeBrain && /cover|gas|heater|light|electrical|automation/i.test([p.routeBrain.hardware, p.routeBrain.symptom].filter(Boolean).join(' ')))).length;
  const recentNext = passports.slice(-5).filter(p => p.nextVisit || (p.proof && p.proof.missing && p.proof.missing.length)).length;
  let level = 'low';
  if (highRisk || incomplete >= 2) level = 'high';
  else if (incomplete || recentNext || equipment.length >= 6) level = 'medium';
  return {
    passports: passports.length,
    equipment: equipment.length,
    readings: readings.length,
    callbackRisk: {
      level,
      label: level === 'high' ? 'High Repeat Issue Watch' : level === 'medium' ? 'Watch Next Visit' : 'Clean History',
    },
  };
}

function poolTrendFlags(pool) {
  const passports = pool.servicePassports || [];
  const readings = pool.history || [];
  const flags = [];
  const incomplete = passports.filter(p => p.proof && p.proof.complete === false).length;
  if (incomplete >= 2) flags.push(`${incomplete} saved visits still have incomplete proof.`);
  const recentText = passports.slice(-8).map(p => [
    p.visitType,
    p.proof?.issueNote,
    p.proof?.customerSummary,
    p.workPerformed,
    p.equipmentNotes,
    p.recommendations,
    ...(Array.isArray(p.trendFlags) ? p.trendFlags : []),
  ].filter(Boolean).join(' ')).join(' ').toLowerCase();
  ['heater','salt','robot','light','automation','pump','filter','algae','cloudy','leak','cover'].forEach((term) => {
    const count = (recentText.match(new RegExp(term, 'g')) || []).length;
    if (count >= 2) flags.push(`Repeat ${term} language in recent service memory.`);
  });
  const recentFc = readings.slice(-5).map(r => Number(r.fc)).filter(v => !Number.isNaN(v));
  if (recentFc.length >= 3 && recentFc.every(v => v > 8)) flags.push('Free chlorine has been high across recent readings.');
  if (recentFc.length >= 3 && recentFc.every(v => v < 1)) flags.push('Free chlorine has been low across recent readings.');
  const recentPh = readings.slice(-5).map(r => Number(r.ph)).filter(v => !Number.isNaN(v));
  if (recentPh.length >= 3 && recentPh.every(v => v > 7.9)) flags.push('pH has been high across recent readings.');
  if (recentPh.length >= 3 && recentPh.every(v => v < 7.2)) flags.push('pH has been low across recent readings.');
  const proofFlags = passports.slice(-5).flatMap(p => Array.isArray(p.trendFlags) ? p.trendFlags : []);
  proofFlags.slice(-3).forEach(flag => {
    if (!flags.includes(flag)) flags.push(flag);
  });
  return flags.slice(0, 6);
}

function renderPoolEquipmentTree(pool) {
  const tree = pool.equipmentTree || [];
  const treeList = tree.length ? tree.slice(-8).reverse().map(item => `
        <div style="border:1px solid #e2e8f0;border-radius:7px;padding:8px;margin-bottom:6px;background:#f8fafc;">
          <p style="color:#0f172a;font-size:13px;font-weight:900;">${escHtml([item.manufacturer, item.hardware, item.model].filter(Boolean).join(' / ') || 'Unknown equipment')}</p>
          <p style="color:#64748b;font-size:11px;line-height:1.4;">${escHtml(item.symptom || 'No symptom saved')} ${item.confidence ? ' - ' + escHtml(item.confidence) : ''}</p>
          ${[item.speedType, item.thp ? `${item.thp} THP` : '', item.voltage ? `${item.voltage} V` : '', item.installedYear ? `Installed ${item.installedYear}` : ''].filter(Boolean).length ? `<p style="color:#64748b;font-size:10px;line-height:1.4;margin-top:4px;">${escHtml([item.speedType, item.thp ? `${item.thp} THP` : '', item.voltage ? `${item.voltage} V` : '', item.installedYear ? `Installed ${item.installedYear}` : ''].filter(Boolean).join(' / '))}</p>` : ''}
          ${/pump|motor/i.test([item.hardware, item.model, item.symptom].filter(Boolean).join(' ')) ? `<button type="button" onclick="event.stopPropagation();SplashLensFieldSignals.openPumpDecisionFromEquipment('${escAttr(pool.id)}','${escAttr(item.id)}')" style="margin-top:7px;background:#fff;color:#075985;border:1px solid #7dd3fc;border-radius:7px;padding:7px 9px;font-size:10px;font-weight:900;cursor:pointer;">Compare repair or upgrade</button>` : ''}
        </div>`).join('') : `<p style="color:#94a3b8;font-size:12px;text-align:center;padding:10px 0;">No equipment saved yet. Add the first pump, heater, robot, light, cover, salt cell, or controller.</p>`;
  return `
    <div class="pool-form-panel" style="padding:12px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Equipment Tree</p>
        <button onclick="showEquipmentForm('${pool.id}')" style="background:#e0f2fe;color:#075985;border:1px solid #7dd3fc;border-radius:999px;padding:4px 8px;font-size:10px;font-weight:900;cursor:pointer;">+ Add</button>
      </div>
      <div id="equipment-form-${pool.id}"></div>
      ${treeList}
    </div>`;
}

function findPoolById(poolId) {
  return getPools().find(p => p.id === poolId) || null;
}

function updatePoolById(poolId, updater) {
  const pools = getPools();
  const idx = pools.findIndex(p => p.id === poolId);
  if (idx === -1) return null;
  const next = updater(pools[idx]) || pools[idx];
  pools[idx] = next;
  savePools(pools);
  return next;
}

function showEquipmentForm(poolId) {
  const wrap = document.getElementById(`equipment-form-${poolId}`);
  if (!wrap) return;
  wrap.innerHTML = `
    <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:10px;padding:10px;margin-bottom:10px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <input id="eq-mfg-${poolId}" type="text" placeholder="Manufacturer" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;">
        <input id="eq-hardware-${poolId}" type="text" placeholder="Hardware" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;">
        <input id="eq-model-${poolId}" type="text" placeholder="Model / family" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;">
        <select id="eq-confidence-${poolId}" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;background:#fff;">
          <option value="visible label">Visible label</option>
          <option value="tech verified">Tech verified</option>
          <option value="possible match">Possible match</option>
          <option value="needs manual verification">Needs manual verification</option>
        </select>
      </div>
      <input id="eq-symptom-${poolId}" type="text" placeholder="Symptom, part clue, or next check" style="width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;margin-bottom:8px;">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">
        <select id="eq-speed-${poolId}" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;background:#fff;">
          <option value="">Pump speed type</option>
          <option value="Single-speed">Single-speed</option>
          <option value="Two-speed">Two-speed</option>
          <option value="Variable-speed">Variable-speed</option>
          <option value="Unknown speed">Unknown</option>
        </select>
        <input id="eq-thp-${poolId}" type="number" min="0" step="0.01" inputmode="decimal" placeholder="Total HP (THP)" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;">
        <input id="eq-voltage-${poolId}" type="number" min="0" step="1" inputmode="numeric" placeholder="Voltage" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;">
        <input id="eq-year-${poolId}" type="number" min="1950" max="2100" step="1" inputmode="numeric" placeholder="Installed year" style="min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;">
      </div>
      <textarea id="eq-note-${poolId}" rows="2" placeholder="Proof note, label text, serial clue, vendor pointer..." style="width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px;font-size:13px;resize:vertical;margin-bottom:8px;"></textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="saveManualEquipment('${poolId}')" style="background:#0369a1;color:#fff;border:0;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Save Equipment</button>
        <button onclick="cancelEquipmentForm('${poolId}')" style="background:#f8fafc;color:#64748b;border:1px solid #cbd5e1;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Cancel</button>
      </div>
    </div>`;
}

function saveManualEquipment(poolId) {
  const val = suffix => (document.getElementById(`eq-${suffix}-${poolId}`)?.value || '').trim();
  const item = {
    id: `eq-manual-${Date.now()}`,
    manufacturer: val('mfg'),
    hardware: val('hardware'),
    model: val('model'),
    symptom: val('symptom'),
    note: val('note'),
    speedType: val('speed'),
    thp: val('thp'),
    voltage: val('voltage'),
    installedYear: val('year'),
    confidence: document.getElementById(`eq-confidence-${poolId}`)?.value || 'needs manual verification',
    source: 'manual',
    savedAt: new Date().toISOString(),
  };
  if (![item.manufacturer, item.hardware, item.model, item.symptom, item.note].some(Boolean)) {
    alert('Add at least one equipment detail first.');
    return;
  }
  const pool = updatePoolById(poolId, p => {
    p.equipmentTree = Array.isArray(p.equipmentTree) ? p.equipmentTree : [];
    p.equipmentTree.push(item);
    if (p.equipmentTree.length > 100) p.equipmentTree = p.equipmentTree.slice(-100);
    return p;
  });
  if (pool) {
    trackSplashLensEvent('manual_equipment_saved', { pool_id: poolId, hardware: item.hardware || '', manufacturer: item.manufacturer || '' });
    window.SplashLensFieldSignals?.onEquipmentSaved(item, poolId);
    renderPoolDetail(poolId);
  }
}

function cancelEquipmentForm(poolId) {
  const wrap = document.getElementById(`equipment-form-${poolId}`);
  if (wrap) wrap.innerHTML = '';
}

function showNextVisitReminderForm(poolId) {
  const pool = findPoolById(poolId);
  const wrap = document.getElementById(`next-visit-form-${poolId}`);
  if (!pool || !wrap) return;
  const next = pool.nextVisitReminder || {};
  wrap.innerHTML = `
    <div style="background:#fffbeb;border:1px solid #fde68a;border-radius:10px;padding:10px;margin-top:10px;">
      <label class="field-label" for="next-date-${poolId}">Next Visit Date</label>
      <input id="next-date-${poolId}" type="date" value="${escAttr(next.date || '')}" style="width:100%;border:1px solid #d6d3d1;border-radius:8px;padding:10px;font-size:13px;margin-bottom:8px;">
      <div class="note-tools">
        <label class="field-label" for="next-note-${poolId}">Callback Preventer</label>
        ${voiceNoteButton(`next-note-${poolId}`)}
      </div>
      <textarea id="next-note-${poolId}" rows="3" placeholder="What should the next tech check first?" style="width:100%;border:1px solid #d6d3d1;border-radius:8px;padding:10px;font-size:13px;resize:vertical;margin-bottom:8px;">${escHtml(next.note || '')}</textarea>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <button onclick="saveNextVisitReminder('${poolId}')" style="background:#d97706;color:#fff;border:0;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Save</button>
        <button onclick="clearNextVisitReminder('${poolId}')" style="background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Clear</button>
        <button onclick="document.getElementById('next-visit-form-${poolId}').innerHTML=''" style="background:#f8fafc;color:#64748b;border:1px solid #cbd5e1;border-radius:9px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Cancel</button>
      </div>
    </div>`;
}

function saveNextVisitReminder(poolId) {
  const date = (document.getElementById(`next-date-${poolId}`)?.value || '').trim();
  const note = (document.getElementById(`next-note-${poolId}`)?.value || '').trim();
  if (!date && !note) {
    alert('Add a date or note first.');
    return;
  }
  const pool = updatePoolById(poolId, p => {
    p.nextVisitReminder = { date, note, savedAt: new Date().toISOString() };
    return p;
  });
  if (pool) {
    trackSplashLensEvent('next_visit_reminder_saved', { pool_id: poolId, has_date: !!date, has_note: !!note });
    window.SplashLensFieldSignals?.scheduleNextVisitReminder(poolId, pool.nextVisitReminder, pool);
    renderPoolDetail(poolId);
  }
}

function clearNextVisitReminder(poolId) {
  const pool = updatePoolById(poolId, p => {
    delete p.nextVisitReminder;
    return p;
  });
  if (pool) {
    trackSplashLensEvent('next_visit_reminder_cleared', { pool_id: poolId });
    renderPoolDetail(poolId);
  }
}

function buildPoolCRMPacket(pool) {
  const intel = poolFieldIntel(pool);
  const trendFlags = poolTrendFlags(pool);
  const passports = pool.servicePassports || [];
  const readings = pool.history || [];
  const equipment = pool.equipmentTree || [];
  const latestPassport = passports[passports.length - 1] || null;
  const latestReading = readings[readings.length - 1] || null;
  const next = pool.nextVisitReminder || {};
  const missing = passports.flatMap(p => (p.proof && Array.isArray(p.proof.missing)) ? p.proof.missing : []).slice(-8);
  const lines = [
    `SplashLens Field Intelligence Packet`,
    `Pool: ${pool.name || 'Unnamed pool'}`,
    pool.address ? `Address: ${pool.address}` : '',
    `Profile: ${[pool.gallons ? `${pool.gallons} gal` : '', pool.type, pool.sanitizer, pool.filter].filter(Boolean).join(' | ') || 'Not set'}`,
    pool.heater ? `Primary equipment note: ${pool.heater}` : '',
    '',
    `Repeat issue watch: ${intel.callbackRisk.label}`,
    trendFlags.length ? `Trend flags: ${trendFlags.join(' | ')}` : '',
    next.date || next.note ? `Next visit: ${[next.date, next.note].filter(Boolean).join(' - ')}` : 'Next visit: Not set',
    '',
    latestPassport ? `Latest proof (${latestPassport.date || 'undated'}): ${latestPassport.proof?.customerSummary || latestPassport.workPerformed || latestPassport.equipmentNotes || 'Saved service proof.'}` : 'Latest proof: none saved',
    latestPassport?.proof ? `Proof status: ${latestPassport.proof.complete ? 'complete' : 'incomplete'}` : '',
    missing.length ? `Open proof items: ${missing.join('; ')}` : '',
    latestReading ? `Latest chemistry (${latestReading.date || 'undated'}): ${[
      latestReading.fc ? `FC ${latestReading.fc}` : '',
      latestReading.cc ? `CC ${latestReading.cc}` : '',
      latestReading.ph ? `pH ${latestReading.ph}` : '',
      latestReading.ta ? `TA ${latestReading.ta}` : '',
      latestReading.ch ? `CH ${latestReading.ch}` : '',
      latestReading.cya ? `CYA ${latestReading.cya}` : '',
    ].filter(Boolean).join(' | ') || 'saved'}` : 'Latest chemistry: none saved',
    '',
    'Equipment tree:',
    ...(equipment.length ? equipment.slice(-10).reverse().map(item => `- ${[item.manufacturer, item.hardware, item.model].filter(Boolean).join(' / ') || 'Unknown equipment'}${item.symptom ? `: ${item.symptom}` : ''}${item.confidence ? ` (${item.confidence})` : ''}`) : ['- None saved yet']),
    '',
    pool.notes ? `Site notes: ${pool.notes}` : '',
    'Use this as a field packet for your service CRM, accounting notes, office notes, a senior tech, or a vendor counter.',
    'SplashLens is a reference aid. Verify with model numbers, manuals, qualified tech judgment, and manufacturer guidance before ordering parts or diagnosing.',
  ];
  return lines.filter(line => line !== '').join('\n');
}

function copyPoolCRMPacket(poolId) {
  const pool = findPoolById(poolId);
  if (!pool) return;
  navigator.clipboard.writeText(buildPoolCRMPacket(pool)).then(() => {
    trackSplashLensEvent('pool_crm_packet_copied', { pool_id: poolId });
    alert('CRM packet copied.');
  }).catch(() => alert('Copy failed. Use Share / Export instead.'));
}

async function sharePoolCRMPacket(poolId) {
  const pool = findPoolById(poolId);
  if (!pool) return;
  const text = buildPoolCRMPacket(pool);
  trackSplashLensEvent('pool_crm_packet_shared', { pool_id: poolId, native_share: !!navigator.share });
  if (navigator.share) {
    try {
      await navigator.share({ title: `SplashLens packet - ${pool.name || 'pool'}`, text });
      return;
    } catch (e) {}
  }
  navigator.clipboard.writeText(text).then(() => alert('Packet copied for sharing.')).catch(() => alert(text));
}

function poolCSVRows(pool) {
  const rows = [['section', 'date', 'key', 'value']];
  rows.push(['profile', '', 'name', pool.name || '']);
  rows.push(['profile', '', 'address', pool.address || '']);
  rows.push(['profile', '', 'gallons', pool.gallons || '']);
  rows.push(['profile', '', 'type', pool.type || '']);
  rows.push(['profile', '', 'sanitizer', pool.sanitizer || '']);
  rows.push(['profile', '', 'filter', pool.filter || '']);
  rows.push(['profile', '', 'heater', pool.heater || '']);
  if (pool.nextVisitReminder) {
    rows.push(['next_visit', pool.nextVisitReminder.date || '', 'note', pool.nextVisitReminder.note || '']);
  }
  (pool.history || []).forEach(r => {
    ['fc', 'cc', 'ph', 'ta', 'ch', 'cya', 'salt', 'temp', 'note'].forEach(key => {
      if (r[key] != null && r[key] !== '') rows.push(['chemistry', r.date || '', key, r[key]]);
    });
  });
  (pool.equipmentTree || []).forEach(item => {
    rows.push(['equipment', item.savedAt || '', 'summary', [item.manufacturer, item.hardware, item.model].filter(Boolean).join(' / ')]);
    if (item.symptom) rows.push(['equipment', item.savedAt || '', 'symptom', item.symptom]);
    if (item.note) rows.push(['equipment', item.savedAt || '', 'note', item.note]);
    if (item.confidence) rows.push(['equipment', item.savedAt || '', 'confidence', item.confidence]);
  });
  (pool.servicePassports || []).forEach(p => {
    rows.push(['service_proof', p.date || '', 'summary', p.proof?.customerSummary || p.workPerformed || p.equipmentNotes || '']);
    rows.push(['service_proof', p.date || '', 'proof_complete', p.proof?.complete ? 'yes' : 'no']);
    if (p.nextVisit) rows.push(['service_proof', p.date || '', 'next_visit', p.nextVisit]);
  });
  return rows;
}

function csvEscape(value) {
  return `"${String(value == null ? '' : value).replace(/"/g, '""')}"`;
}

function downloadPoolCSV(poolId) {
  const pool = findPoolById(poolId);
  if (!pool) return;
  const csv = poolCSVRows(pool).map(row => row.map(csvEscape).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${(pool.name || 'splashlens-pool').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toLowerCase()}-field-packet.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  trackSplashLensEvent('pool_csv_downloaded', { pool_id: poolId });
}

function printPoolPacket(poolId) {
  const pool = findPoolById(poolId);
  if (!pool) return;
  const packet = buildPoolCRMPacket(pool);
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (!win) {
    navigator.clipboard.writeText(packet).then(() => alert('Packet copied. Browser blocked the print window.'));
    return;
  }
  win.document.write(`<!doctype html><html><head><title>SplashLens Field Packet</title><style>body{font-family:Arial,sans-serif;max-width:760px;margin:32px auto;padding:0 18px;color:#0f172a;line-height:1.45;}h1{font-size:24px;margin-bottom:10px;}pre{white-space:pre-wrap;font:14px/1.55 Arial,sans-serif;border:1px solid #e2e8f0;border-radius:10px;padding:18px;background:#f8fafc;}</style></head><body><h1>SplashLens Field Packet</h1><pre>${escHtml(packet)}</pre><script>window.onload=function(){window.print();}<\/script></body></html>`);
  win.document.close();
  trackSplashLensEvent('pool_packet_printed', { pool_id: poolId });
}

function poolReadingDetailGrid(r) {
  const fields = [
    ['FC', r.fc], ['CC', r.cc], ['pH', r.ph],
    ['TA', r.ta], ['CH', r.ch], ['CYA', r.cya],
  ];
  return fields.filter(([,v]) => v != null && v !== '').map(([label, val]) =>
    `<div style="background:#f8fafc;border-radius:6px;padding:8px;text-align:center;">
       <p style="color:#64748b;font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;">${label}</p>
       <p style="color:#0f172a;font-size:16px;font-weight:900;margin-top:2px;">${val}</p>
     </div>`
  ).join('') +
  (r.source ? `<div style="grid-column:1/-1;background:#f0f9ff;border:1px solid #bae6fd;border-radius:6px;padding:8px;font-size:11px;color:#0369a1;font-weight:800;">Source: ${escHtml(readingSourceLabel(r.source))}</div>` : '') +
  (r.note ? `<div style="grid-column:1/-1;background:#eff6ff;border-radius:6px;padding:8px;font-size:12px;color:#0369a1;margin-top:2px;">${escHtml(r.note)}</div>` : '');
}

function renderServicePassportHistory(pool) {
  const passports = pool.servicePassports || [];
  if (!passports.length) {
    return `<p style="color:#94a3b8;font-size:13px;padding:14px 0;text-align:center;">No service reports saved yet.</p>`;
  }
  return [...passports].reverse().slice(0, 20).map((r, i) => {
    const uid = `passport-${pool.id}-${i}`;
    const proofColor = r.proof?.complete ? '#166534' : '#991b1b';
    const proofBg = r.proof?.complete ? '#dcfce7' : '#fee2e2';
    const summary = r.proof?.customerSummary || r.workPerformed || r.equipmentNotes || 'Service report saved.';
    const readings = r.readings || {};
    const readingSummary = [
      readings.fc ? `FC ${readings.fc}` : '',
      readings.ph ? `pH ${readings.ph}` : '',
      readings.ta ? `TA ${readings.ta}` : '',
      readings.cya ? `CYA ${readings.cya}` : '',
    ].filter(Boolean).join('  ');
    return `
      <div class="pool-reading-row" onclick="toggleReadingDetail('${uid}')">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;">
          <div style="min-width:0;">
            <span style="color:#0f172a;font-size:13px;font-weight:800;">${escHtml(r.date || '')}</span>
            <span style="background:${proofBg};color:${proofColor};border-radius:999px;padding:2px 7px;font-size:9px;font-weight:900;margin-left:6px;">${r.proof?.complete ? 'proof ready' : 'incomplete'}</span>
            <p style="color:#64748b;font-size:12px;margin-top:4px;line-height:1.35;">${escHtml(summary)}</p>
            ${readingSummary ? `<p style="color:#0369a1;font-size:11px;font-weight:800;margin-top:4px;">${escHtml(readingSummary)}</p>` : ''}
          </div>
          <svg id="rchev-${uid}" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" style="flex-shrink:0;transition:transform 0.2s;margin-top:3px;"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div id="${uid}" class="pool-reading-detail">
          ${servicePassportDetail(r)}
        </div>
      </div>`;
  }).join('');
}

function servicePassportDetail(r) {
  const blocks = [];
  if (r.proof?.photoProof) blocks.push(['Photo Proof', r.proof.photoProof]);
  if (r.proof?.issueNote) blocks.push(['Tech Note', r.proof.issueNote]);
  if (r.workPerformed) blocks.push(['Work', r.workPerformed]);
  if (r.equipmentNotes) blocks.push(['Equipment', r.equipmentNotes]);
  if (r.recommendations) blocks.push(['Recommendations', r.recommendations]);
  if (r.nextVisit) blocks.push(['Next Visit', r.nextVisit]);
  if (r.totalChemicalCost) blocks.push(['Chemical Cost', `$${Number(r.totalChemicalCost).toFixed(2)}`]);
  return `
    ${poolReadingDetailGrid({
      fc: r.readings?.fc,
      cc: r.readings?.cc,
      ph: r.readings?.ph,
      ta: r.readings?.ta,
      ch: r.readings?.ch,
      cya: r.readings?.cya,
      source: r.readings?.source,
    })}
    ${blocks.map(([label, value]) => `
      <div style="grid-column:1/-1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:8px;font-size:12px;color:#334155;">
        <strong style="color:#0369a1;">${escHtml(label)}:</strong> ${escHtml(value)}
      </div>`).join('')}
    ${r.proof?.missing?.length ? `<div style="grid-column:1/-1;background:#fef2f2;border:1px solid #fecaca;border-radius:6px;padding:8px;font-size:12px;color:#991b1b;"><strong>Missing:</strong> ${escHtml(r.proof.missing.join(', '))}</div>` : ''}
  `;
}

function readingSourceLabel(source) {
  return {
    manual: 'Manual entry',
    spintouch: 'LaMotte SpinTouch - device reading',
    'spintouch-edited': 'LaMotte SpinTouch - edited after import',
    admin: 'Office/admin edited'
  }[source] || source;
}

function toggleReadingDetail(uid) {
  const el   = document.getElementById(uid);
  const chev = document.getElementById(`rchev-${uid}`);
  if (!el) return;
  const open = el.classList.toggle('open');
  if (chev) chev.style.transform = open ? 'rotate(180deg)' : '';
}

function savePoolNotes(id) {
  const ta = document.getElementById('pool-notes-ta');
  if (!ta) return;
  const pools = getPools();
  const p = pools.find(x => x.id === id);
  if (!p) return;
  p.notes = ta.value;
  savePools(pools);
}

// ─── CHEM READING FORM ────────────────────
function showChemForm(poolId) {
  const wrap = document.getElementById(`chem-form-wrap-${poolId}`);
  if (!wrap) return;
  const today = new Date().toISOString().split('T')[0];
  wrap.innerHTML = `
    <div class="inline-chem-form" id="chem-form-inner-${poolId}">
      <p style="color:#0369a1;font-weight:800;font-size:13px;margin-bottom:12px;">Save Reading</p>
      <div class="field-group">
        <label class="field-label">Date</label>
        <input type="date" id="cf-date-${poolId}" value="${today}" style="color-scheme:light;">
      </div>
      <div class="field-group">
        <label class="field-label">Reading Source</label>
        <select id="cf-source-${poolId}">
          <option value="manual">Manual entry</option>
          <option value="spintouch">LaMotte SpinTouch - device reading</option>
          <option value="spintouch-edited">LaMotte SpinTouch - edited after import</option>
          <option value="admin">Office/admin edited</option>
        </select>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;margin-bottom:14px;">
        <div><label class="field-label">FC</label><input type="number" id="cf-fc-${poolId}" placeholder="—" inputmode="decimal" step="0.1" min="0"></div>
        <div><label class="field-label">CC</label><input type="number" id="cf-cc-${poolId}" placeholder="—" inputmode="decimal" step="0.1" min="0"></div>
        <div><label class="field-label">pH</label><input type="number" id="cf-ph-${poolId}" placeholder="—" inputmode="decimal" step="0.1" min="0"></div>
        <div><label class="field-label">TA</label><input type="number" id="cf-ta-${poolId}" placeholder="—" inputmode="decimal" min="0"></div>
        <div><label class="field-label">CH</label><input type="number" id="cf-ch-${poolId}" placeholder="—" inputmode="decimal" min="0"></div>
        <div><label class="field-label">CYA</label><input type="number" id="cf-cya-${poolId}" placeholder="—" inputmode="decimal" min="0"></div>
      </div>
      <div class="field-group">
        <div class="note-tools">
          <label class="field-label">Note (optional)</label>
          ${voiceNoteButton(`cf-note-${poolId}`)}
        </div>
        <textarea id="cf-note-${poolId}" class="pool-textarea" rows="2" placeholder="Backwashed filter, added shock…"></textarea>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="saveChemReading('${poolId}')" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border:none;border-radius:9px;padding:12px;font-weight:800;font-size:14px;cursor:pointer;">Save</button>
        <button onclick="cancelChemForm('${poolId}')" style="background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b;border-radius:9px;padding:12px;font-weight:700;font-size:14px;cursor:pointer;">Cancel</button>
      </div>
    </div>`;
}

function cancelChemForm(poolId) {
  const wrap = document.getElementById(`chem-form-wrap-${poolId}`);
  if (wrap) wrap.innerHTML = '';
}

function saveChemReading(poolId) {
  const get = id => { const el = document.getElementById(id); return el ? el.value.trim() : ''; };
  const getF = id => { const v = parseFloat(get(id)); return isNaN(v) ? null : v; };

  const date = get(`cf-date-${poolId}`) || new Date().toISOString().split('T')[0];
  const fc   = getF(`cf-fc-${poolId}`);
  const cc   = getF(`cf-cc-${poolId}`);
  const ph   = getF(`cf-ph-${poolId}`);
  const ta   = getF(`cf-ta-${poolId}`);
  const ch   = getF(`cf-ch-${poolId}`);
  const cya  = getF(`cf-cya-${poolId}`);
  const note = get(`cf-note-${poolId}`);
  const source = get(`cf-source-${poolId}`) || 'manual';

  if ([fc, cc, ph, ta, ch, cya].every(v => v === null)) {
    alert('Enter at least one reading value.');
    return;
  }

  const reading = { date };
  if (fc  !== null) reading.fc  = fc;
  if (cc  !== null) reading.cc  = cc;
  if (ph  !== null) reading.ph  = ph;
  if (ta  !== null) reading.ta  = ta;
  if (ch  !== null) reading.ch  = ch;
  if (cya !== null) reading.cya = cya;
  reading.source = source;
  if (note) reading.note = note;

  const pools = getPools();
  const p = pools.find(x => x.id === poolId);
  if (!p) return;
  if (!p.history) p.history = [];
  p.history.push(reading);
  // Cap at 100 readings (newest kept)
  if (p.history.length > 100) p.history = p.history.slice(-100);
  savePools(pools);
  renderPoolDetail(poolId);
}

// ─── NEW / EDIT POOL FORM ─────────────────
function renderPoolForm(id) {
  S.poolView = id ? 'edit' : 'new';
  const pools = getPools();
  const p = id ? pools.find(x => x.id === id) : null;

  const v = (field, fallback = '') => p ? (p[field] != null ? p[field] : fallback) : fallback;
  const sel = (field, value) => v(field) === value ? 'selected' : '';

  const container = document.getElementById('pools-content');
  if (!container) return;

  container.innerHTML = `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:16px;">
      <button onclick="${id ? `renderPoolDetail('${id}')` : 'renderPoolList()'}" style="background:#f1f5f9;border:none;border-radius:8px;padding:7px 12px;cursor:pointer;display:flex;align-items:center;gap:5px;color:#374151;font-size:13px;font-weight:700;">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"><polyline points="15 18 9 12 15 6"/></svg>
        Back
      </button>
      <p style="color:#0369a1;font-weight:900;font-size:16px;">${id ? 'Edit Pool' : 'New Pool'}</p>
    </div>

    <div class="pool-form-panel">
      <div class="field-group">
        <label class="field-label">Pool Name <span style="color:#dc2626;">*</span></label>
        <input type="text" id="pf-name" placeholder="e.g. Smith Residence" value="${escAttr(v('name'))}">
      </div>
      <div class="field-group">
        <label class="field-label">Address</label>
        <input type="text" id="pf-address" placeholder="123 Main St" value="${escAttr(v('address'))}">
      </div>
      <div class="field-group">
        <label class="field-label">Pool Volume (gallons) <span style="color:#dc2626;">*</span></label>
        <input type="number" id="pf-gallons" placeholder="e.g. 15000" min="100" inputmode="decimal" value="${v('gallons')}">
      </div>
      <div class="field-group">
        <label class="field-label">Pool Type</label>
        <select id="pf-type">
          <option value="">— Select —</option>
          <option value="Inground Gunite" ${sel('type','Inground Gunite')}>Inground Gunite</option>
          <option value="Inground Vinyl" ${sel('type','Inground Vinyl')}>Inground Vinyl</option>
          <option value="Inground Fiberglass" ${sel('type','Inground Fiberglass')}>Inground Fiberglass</option>
          <option value="Above Ground" ${sel('type','Above Ground')}>Above Ground</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Sanitizer</label>
        <select id="pf-sanitizer">
          <option value="">— Select —</option>
          <option value="Chlorine" ${sel('sanitizer','Chlorine')}>Chlorine</option>
          <option value="Salt" ${sel('sanitizer','Salt')}>Salt</option>
          <option value="Bromine" ${sel('sanitizer','Bromine')}>Bromine</option>
        </select>
      </div>
      <div class="field-group">
        <label class="field-label">Filter Type</label>
        <select id="pf-filter" onchange="toggleFilterDia()">
          <option value="">— Select —</option>
          <option value="Sand" ${sel('filter','Sand')}>Sand</option>
          <option value="Cartridge" ${sel('filter','Cartridge')}>Cartridge</option>
          <option value="DE" ${sel('filter','DE')}>DE (Diatomaceous Earth)</option>
        </select>
      </div>
      <div class="field-group" id="pf-dia-wrap" style="${['Sand','DE'].includes(v('filter')) ? '' : 'display:none;'}">
        <label class="field-label">Filter Tank Diameter (inches)</label>
        <input type="number" id="pf-filterDia" placeholder="e.g. 24" min="10" max="48" inputmode="decimal" value="${v('filterDia')}">
      </div>
      <div class="field-group">
        <label class="field-label">Heater / Equipment</label>
        <input type="text" id="pf-heater" placeholder="e.g. Hayward H250" value="${escAttr(v('heater'))}">
      </div>
      <div class="field-group">
        <div class="note-tools">
          <label class="field-label">Notes</label>
          ${voiceNoteButton('pf-notes')}
        </div>
        <textarea id="pf-notes" class="pool-textarea" rows="3" placeholder="Gate code, special instructions…">${escHtml(v('notes'))}</textarea>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:4px;">
        <button onclick="savePool('${id || ''}')" style="background:linear-gradient(135deg,#0284c7,#0369a1);color:white;border:none;border-radius:10px;padding:13px;font-weight:800;font-size:14px;cursor:pointer;">Save Pool</button>
        <button onclick="${id ? `renderPoolDetail('${id}')` : 'renderPoolList()'}" style="background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b;border-radius:10px;padding:13px;font-weight:700;font-size:14px;cursor:pointer;">Cancel</button>
      </div>
    </div>`;
}

function toggleFilterDia() {
  const sel = document.getElementById('pf-filter');
  const wrap = document.getElementById('pf-dia-wrap');
  if (!sel || !wrap) return;
  wrap.style.display = ['Sand', 'DE'].includes(sel.value) ? '' : 'none';
}

function savePool(id) {
  const name = (document.getElementById('pf-name')?.value || '').trim();
  if (!name) { alert('Pool name is required.'); return; }

  const gallonsRaw = document.getElementById('pf-gallons')?.value;
  const gallons = gallonsRaw ? parseInt(gallonsRaw, 10) : null;

  const pool = {
    name,
    address:    (document.getElementById('pf-address')?.value   || '').trim(),
    gallons:    gallons || null,
    type:        document.getElementById('pf-type')?.value      || '',
    sanitizer:   document.getElementById('pf-sanitizer')?.value || '',
    filter:      document.getElementById('pf-filter')?.value    || '',
    filterDia:   parseInt(document.getElementById('pf-filterDia')?.value || '0') || null,
    heater:     (document.getElementById('pf-heater')?.value    || '').trim(),
    notes:      (document.getElementById('pf-notes')?.value     || '').trim(),
  };

  const pools = getPools();
  if (id) {
    const idx = pools.findIndex(x => x.id === id);
    if (idx !== -1) {
      pool.id = id;
      pool.history = pools[idx].history || [];
      pool.servicePassports = pools[idx].servicePassports || [];
      pool.equipmentTree = pools[idx].equipmentTree || [];
      pool.nextVisitReminder = pools[idx].nextVisitReminder || null;
      pools[idx] = pool;
    }
  } else {
    pool.id = String(Date.now());
    pool.history = [];
    pool.servicePassports = [];
    pool.equipmentTree = [];
    pool.nextVisitReminder = null;
    pools.push(pool);
  }
  savePools(pools);
  renderPoolDetail(pool.id);
}

// ─── DELETE POOL ──────────────────────────
function deletePool(id) {
  if (!confirm('Delete this pool profile and all its history? This cannot be undone.')) return;
  const pools = getPools().filter(x => x.id !== id);
  savePools(pools);
  renderPoolList();
}

// ─── USE POOL IN DOSING ───────────────────
function usePoolInDosing(gallons) {
  const el = document.getElementById('dose-volume');
  if (el) { el.value = gallons; onVolumeChange(gallons); }
  showTab('dosing');
}

// ─── POOL HTML HELPERS ────────────────────
function escHtml(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function escAttr(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    const orig = btn.textContent;
    btn.textContent = 'Copied!';
    btn.style.color = '#4ade80';
    btn.style.borderColor = '#166534';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; btn.style.borderColor = ''; }, 1800);
  }).catch(() => {});
}

// ═══════════════════════════════════════════
// ROUTE / DAY VIEW
// ═══════════════════════════════════════════
const ROUTE_KEY = 'poolens-route';
const ROUTE_BRAIN_KEY = 'splashlens-route-brain-state';

const ROUTE_BRAIN_HARDWARE = [
  'heater','heat pump','pump','filter','salt cell','automation','lighting','robot','water feature','valve actuator','UV / ozone / AOP','chemical controller','feeder','automatic cover','unknown'
];

const ROUTE_BRAIN_QUICK_SYMPTOMS = [
  'light trips GFCI','wrong light color','Omni offline','iAquaLink waiting connection','IntelliCenter no comm','valve actuator stuck',
  'robot will not climb','robot Wi-Fi pairing','ORP low','pH high alarm','cover will not move','heater says LO','flow fault','pump not priming'
];

function renderTechRadarPanel() {
  const radar = window.SPLASHLENS_TECH_RADAR;
  if (!radar || !Array.isArray(radar.categories)) return '';
  const tiles = radar.categories.map((cat) => `
    <details class="brain-card" style="margin-bottom:8px;">
      <summary style="cursor:pointer;list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;">
        <span>
          <strong style="display:block;color:#0f172a;font-size:13px;">${escHtml(cat.name)}</strong>
          <span style="display:block;color:#64748b;font-size:11px;font-weight:800;">${escHtml(cat.status)}</span>
        </span>
        <span class="brain-pill ready">Radar</span>
      </summary>
      <div style="padding-top:9px;">
        <p style="color:#334155;font-size:12px;line-height:1.5;"><strong>Models / systems:</strong> ${escHtml((cat.examples || []).join(', '))}</p>
        <p style="color:#334155;font-size:12px;line-height:1.5;margin-top:5px;"><strong>Proof to capture:</strong> ${escHtml((cat.proof || []).join(', '))}</p>
        <p style="color:#334155;font-size:12px;line-height:1.5;margin-top:5px;"><strong>Field flags:</strong> ${escHtml((cat.fieldFlags || []).join(', '))}</p>
        ${Array.isArray(cat.sourceNotes) && cat.sourceNotes.length ? `<p style="color:#0f766e;font-size:11px;line-height:1.45;margin-top:7px;font-weight:800;"><strong>Radar note:</strong> ${escHtml(cat.sourceNotes.join(' '))}</p>` : ''}
      </div>
    </details>
  `).join('');
  return `
    <section class="brain-card dark" aria-label="New Tech Radar">
      <p style="color:#7dd3fc;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px;">New Tech Radar</p>
      <h2 style="font-size:21px;line-height:1.06;font-weight:950;margin:0 0 6px;color:#fff;">PartSnap + Connected Pool Network</h2>
      <p style="color:#cbd5e1;font-size:12px;line-height:1.45;">Track the fast-moving stuff: robots, smart automation, lights, heat pumps, covers, sensors, feeders, and chemical controllers. Use it to capture proof, spot repeat issues, and build safer send-out notes.</p>
      <div class="brain-grid" style="margin-top:10px;">
        <span class="brain-pill ready" style="justify-content:center;">Daily data adds</span>
        <span class="brain-pill ready" style="justify-content:center;">Weekly field cards</span>
        <span class="brain-pill warn" style="justify-content:center;">Monthly update</span>
        <span class="brain-pill warn" style="justify-content:center;">Partner cards ready</span>
      </div>
    </section>
    ${tiles}
  `;
}

function routeBrainDefaults() {
  return {
    poolId: '',
    manufacturer: '',
    hardware: '',
    model: '',
    visibleLabel: '',
    symptom: '',
    checks: '',
    photoProof: '',
    techNote: '',
    confidence: 'possible',
  };
}

function getRouteBrainState() {
  try {
    return { ...routeBrainDefaults(), ...JSON.parse(localStorage.getItem(ROUTE_BRAIN_KEY) || '{}') };
  } catch {
    return routeBrainDefaults();
  }
}

function saveRouteBrainState(state) {
  localStorage.setItem(ROUTE_BRAIN_KEY, JSON.stringify({ ...routeBrainDefaults(), ...state }));
}

function collectRouteBrainState() {
  const state = routeBrainDefaults();
  ['poolId','manufacturer','hardware','model','visibleLabel','symptom','checks','photoProof','techNote','confidence'].forEach((id) => {
    const el = document.getElementById(`brain-${id}`);
    if (el) state[id] = el.value.trim();
  });
  saveRouteBrainState(state);
  return state;
}

function routeBrainManufacturers() {
  if (!window.ERROR_DB) return [];
  return Object.entries(window.ERROR_DB).map(([key, brand]) => ({ key, label: brand.label || key }));
}

function routeBrainPanel() {
  const state = getRouteBrainState();
  const pools = getPools();
  const manufacturerOptions = routeBrainManufacturers().map(({ key, label }) =>
    `<option value="${escAttr(key)}" ${state.manufacturer === key ? 'selected' : ''}>${escHtml(label)}</option>`).join('');
  const hardwareOptions = ROUTE_BRAIN_HARDWARE.map((h) =>
    `<option value="${escAttr(h)}" ${state.hardware === h ? 'selected' : ''}>${escHtml(h)}</option>`).join('');
  const poolOptions = pools.map((p) =>
    `<option value="${escAttr(p.id)}" ${state.poolId === p.id ? 'selected' : ''}>${escHtml(p.name || 'Pool')}</option>`).join('');
  const quickChips = ROUTE_BRAIN_QUICK_SYMPTOMS.map((s) =>
    `<button type="button" class="brain-chip primary" onclick="setRouteBrainSymptom('${escAttr(s)}')">${escHtml(s)}</button>`).join('');

  return `
    <section class="brain-card dark" aria-label="Route Brain">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;margin-bottom:10px;">
        <div>
          <p style="color:#7dd3fc;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px;">Route Brain</p>
          <h2 style="font-size:22px;line-height:1.05;font-weight:900;margin:0 0 5px;color:#ffffff;">Photo-to-fix field companion</h2>
          <p style="color:#cbd5e1;font-size:12px;line-height:1.45;">Build an equipment tree, run symptom checks, make an escalation packet, and save proof before leaving the pad.</p>
        </div>
        <span class="brain-pill ready">Live Sprint</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
        <span class="brain-pill ready" style="justify-content:center;">Tree</span>
        <span class="brain-pill ready" style="justify-content:center;">Proof</span>
        <span class="brain-pill warn" style="justify-content:center;">AI photo tree soon</span>
      </div>
    </section>

    <section class="brain-card">
      <div class="brain-grid">
        <div class="field-group">
          <label class="field-label">Pool</label>
          <select id="brain-poolId" onchange="routeBrainPoolChanged()">
            <option value="">Temporary stop / no saved pool</option>
            ${poolOptions}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Manufacturer / System</label>
          <select id="brain-manufacturer" onchange="collectRouteBrainState()">
            <option value="">Unknown / all systems</option>
            ${manufacturerOptions}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Hardware</label>
          <select id="brain-hardware" onchange="collectRouteBrainState()">
            <option value="">Pick hardware</option>
            ${hardwareOptions}
          </select>
        </div>
        <div class="field-group">
          <label class="field-label">Model / Line</label>
          <input id="brain-model" type="text" value="${escAttr(state.model)}" placeholder="e.g. IntelliBrite, OmniPL, Coverstar" oninput="collectRouteBrainState()">
        </div>
      </div>
      <div class="field-group">
        <label class="field-label">Visible Label / Photo Proof</label>
        <input id="brain-visibleLabel" type="text" value="${escAttr(state.visibleLabel)}" placeholder="model plate, serial, transformer size, label photo filename" oninput="collectRouteBrainState()">
      </div>
      <div class="field-group">
        <label class="field-label">Symptom</label>
        <input id="brain-symptom" type="text" value="${escAttr(state.symptom)}" placeholder="e.g. light trips GFCI, robot will not climb, ORP low" oninput="collectRouteBrainState()">
      </div>
      <div style="display:flex;gap:6px;overflow-x:auto;padding-bottom:7px;margin-bottom:10px;">
        ${quickChips}
      </div>
      <div class="field-group">
        <div class="note-tools">
          <label class="field-label">Checks Already Done / Tech Note</label>
          ${voiceNoteButton('brain-techNote')}
        </div>
        <textarea id="brain-techNote" rows="3" class="pool-textarea" placeholder="What you saw, what you tested, readings, breaker/GFCI behavior..." oninput="collectRouteBrainState()">${escHtml(state.techNote)}</textarea>
      </div>
      <div class="brain-grid">
        <div class="field-group">
          <label class="field-label">Checks Completed</label>
          <input id="brain-checks" type="text" value="${escAttr(state.checks)}" placeholder="voltage checked, filter clean, photo captured..." oninput="collectRouteBrainState()">
        </div>
        <div class="field-group">
          <label class="field-label">Part Confidence</label>
          <select id="brain-confidence" onchange="collectRouteBrainState()">
            ${['visible marking','likely family','possible','unknown'].map(v => `<option value="${v}" ${state.confidence === v ? 'selected' : ''}>${v}</option>`).join('')}
          </select>
        </div>
      </div>
      <div class="brain-grid" style="margin-top:4px;">
        <button class="brain-action" onclick="runRouteBrain()">Build Field Plan</button>
        <button class="brain-action secondary" onclick="copyRouteBrainPacket()">Copy Escalation</button>
        <button class="brain-action green" onclick="saveRouteBrainToPool()">Save Proof</button>
        <button class="brain-action orange" onclick="makeRouteBrainTraining()">Training Mode</button>
      </div>
    </section>

    <div id="route-brain-result" class="brain-result"></div>
    ${renderTechRadarPanel()}
    ${routeBrainLearningShelf()}
    <section class="brain-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <h3 style="font-size:14px;font-weight:900;color:#0f172a;margin:0;">Coming Soon Gates</h3>
        <span class="brain-pill warn">Prepared</span>
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">Positioned now, but gated until backend/partner lanes are ready: live photo-to-equipment-tree AI, manufacturer sponsored banners, instructor-shared lessons, team sync, and native iOS speech cleanup.</p>
    </section>
  `;
}

function routeBrainLearningShelf() {
  const groups = routeBrainManufacturers().slice(0, 10).map(({ key, label }) => {
    const cats = Object.keys(window.ERROR_DB?.[key]?.categories || {});
    return `<button type="button" class="brain-chip" onclick="openRouteBrainLearning('${escAttr(key)}')"><strong>${escHtml(label)}</strong><br><span style="font-weight:700;color:#64748b;">${cats.slice(0, 2).map(escHtml).join(' / ')}${cats.length > 2 ? ' +' + (cats.length - 2) : ''}</span></button>`;
  }).join('');
  return `
    <section class="brain-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <h3 style="font-size:14px;font-weight:900;color:#0f172a;margin:0;">Manufacturer Learning Pages</h3>
        <span class="brain-pill ready">Live</span>
      </div>
      <p style="color:#64748b;font-size:12px;line-height:1.5;margin-bottom:10px;">Tap a manufacturer/system to review hardware families, symptoms, codes, field checks, and when to call a pro.</p>
      <div class="brain-grid">${groups}</div>
      <div id="route-brain-learning-result" class="brain-result" style="margin-top:10px;"></div>
    </section>`;
}

function openRouteBrainLearning(brandKey) {
  const brand = window.ERROR_DB?.[brandKey];
  const result = document.getElementById('route-brain-learning-result');
  if (!brand || !result) return;
  result.innerHTML = Object.entries(brand.categories || {}).map(([name, cat]) => `
    <div style="border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-bottom:8px;">
      <h3>${escHtml(name)}</h3>
      <p><strong>Models:</strong> ${escHtml((cat.models || []).slice(0, 8).join(', '))}${(cat.models || []).length > 8 ? '...' : ''}</p>
      ${(cat.codes || []).slice(0, 4).map(c => `
        <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:7px;padding:8px;margin-top:6px;">
          <p style="font-weight:900;color:#0369a1;">${escHtml(c.code)} - ${escHtml(c.name)}</p>
          <p><strong>Symptoms / causes:</strong> ${escHtml((c.causes || []).slice(0, 2).join('; '))}</p>
          <p><strong>First checks:</strong> ${escHtml((c.fix || []).slice(0, 2).join('; '))}</p>
        </div>`).join('')}
    </div>`).join('');
  trackSplashLensEvent('route_brain_learning_opened', { brand: brandKey });
}

function setRouteBrainSymptom(symptom) {
  const el = document.getElementById('brain-symptom');
  if (el) el.value = symptom;
  collectRouteBrainState();
  runRouteBrain();
}

function routeBrainPoolChanged() {
  const state = collectRouteBrainState();
  const pool = getPools().find(p => p.id === state.poolId);
  if (!pool) return;
  const model = document.getElementById('brain-model');
  const label = document.getElementById('brain-visibleLabel');
  if (model && !model.value) {
    model.value = [pool.pump, pool.filter, pool.heater, pool.salt].filter(Boolean).join(' / ');
  }
  if (label && !label.value) label.value = pool.address || pool.name || '';
  collectRouteBrainState();
}

function routeBrainQuery(state) {
  return [state.manufacturer, state.hardware, state.model, state.visibleLabel, state.symptom, state.checks, state.techNote]
    .filter(Boolean).join(' ');
}

function routeBrainHits(state) {
  const queries = [
    state.symptom,
    ...String(state.symptom || '').split(/[^a-zA-Z0-9]+/).filter(t => t.length > 3),
    [state.hardware, state.symptom].filter(Boolean).join(' '),
    state.model,
    state.hardware,
    routeBrainQuery(state),
  ].filter(Boolean);
  const seen = new Set();
  const hits = [];
  queries.forEach((query) => {
    const found = state.manufacturer ? searchErrorDB(query, state.manufacturer) : searchErrorDB(query);
    found.forEach((hit) => {
      const key = `${hit.brandKey}|${hit.category}|${hit.code}|${hit.name}`;
      if (seen.has(key)) return;
      seen.add(key);
      hits.push(hit);
    });
  });
  const hardware = String(state.hardware || '').toLowerCase();
  const model = String(state.model || '').toLowerCase();
  const symptomTokens = String(state.symptom || '').toLowerCase().split(/[^a-z0-9]+/).filter(t => t.length > 3);
  const ranked = hits
    .map(hit => ({ hit, score: routeBrainHitScore(hit, hardware, model, symptomTokens) }))
    .sort((a, b) => b.score - a.score);
  const focused = hardware ? ranked.filter(item => item.score >= 3) : ranked;
  return (focused.length ? focused : ranked).slice(0, 5).map(item => item.hit);
}

function routeBrainHitScore(hit, hardware, model, symptomTokens) {
  const text = [hit.brandLabel, hit.category, hit.code, hit.name, ...(hit.causes || []), ...(hit.fix || [])].join(' ').toLowerCase();
  let score = 0;
  if (hardware && text.includes(hardware)) score += 12;
  if (model && text.includes(model)) score += 8;
  symptomTokens.forEach(t => { if (text.includes(t)) score += 3; });
  if (hit.severity === 'high') score += 2;
  if (hit.callpro) score += 1;
  return score;
}

function routeBrainRisk(state, hits) {
  const missing = [];
  if (!state.symptom) missing.push('symptom');
  if (!state.visibleLabel) missing.push('model/label proof');
  if (!state.checks && !state.techNote) missing.push('checks performed');
  if (state.confidence === 'unknown') missing.push('part confidence');
  const highHit = hits.some(h => h.severity === 'high' || h.callpro);
  const electricalWords = /gfci|breaker|voltage|240|120|transformer|gas|refrigerant|cover|commercial|orp|acid/i.test(routeBrainQuery(state));
  const level = highHit || electricalWords || missing.length >= 3 ? 'high' : missing.length ? 'medium' : 'low';
  return { level, missing, highHit, electricalWords };
}

function routeBrainNextChecks(state, hits) {
  const checks = [];
  hits.forEach(h => (h.fix || []).slice(0, 3).forEach(f => checks.push(f)));
  if (!checks.length) {
    checks.push('Capture the model plate or clear photo of the equipment label.');
    checks.push('Confirm power, flow, settings, and visible symptoms before ordering parts.');
    checks.push('Search the exact manufacturer plus symptom in SplashLens lookup if the model is unknown.');
  }
  if (!state.visibleLabel) checks.unshift('Get model/serial proof or a clear label photo before ordering parts.');
  if (state.confidence === 'unknown') checks.unshift('Treat any part match as unknown until a visible marking, size, or model diagram confirms fit.');
  return [...new Set(checks)].slice(0, 7);
}

function routeBrainCustomerSummary(state, hits, risk) {
  const hardware = state.hardware || 'equipment';
  const symptom = state.symptom || 'reported issue';
  const first = hits[0];
  if (risk.level === 'high') {
    return `Checked ${hardware} for ${symptom}. This needs verification before repair or parts ordering because safety-critical power, gas, cover, chemical-controller, or manufacturer-specific checks may be involved.`;
  }
  if (first) {
    return `Checked ${hardware} for ${symptom}. Current reference points to ${first.name}; next step is to verify the model and complete the listed field checks before repair decisions.`;
  }
  return `Checked ${hardware} for ${symptom}. More model or label proof is needed before a confident recommendation.`;
}

function routeBrainChangedSince(pool) {
  if (!pool) return 'No saved pool selected. Save this stop to build comparison history.';
  const passports = pool.servicePassports || [];
  const history = pool.history || [];
  const lastReport = passports[passports.length - 1];
  const lastReading = history[history.length - 1];
  if (!lastReport && !lastReading) return 'No prior report or reading is saved for this pool yet.';
  const pieces = [];
  if (lastReport) pieces.push(`Last report ${lastReport.date || ''}: ${lastReport.recommendations || lastReport.equipmentNotes || lastReport.workPerformed || 'service proof saved'}.`);
  if (lastReading) pieces.push(`Last readings ${lastReading.date || ''}: FC ${lastReading.fc || '-'}, pH ${lastReading.ph || '-'}, TA ${lastReading.ta || '-'}, CYA ${lastReading.cya || '-'}.`);
  return pieces.join(' ');
}

function buildRouteBrainPacket(state, hits, risk) {
  const checks = routeBrainNextChecks(state, hits);
  const customer = routeBrainCustomerSummary(state, hits, risk);
  return [
    'SplashLens Route Brain Escalation',
    `Pool: ${getPools().find(p => p.id === state.poolId)?.name || 'Temporary stop'}`,
    `Manufacturer/system: ${routeBrainManufacturers().find(m => m.key === state.manufacturer)?.label || state.manufacturer || 'Unknown'}`,
    `Hardware: ${state.hardware || 'Unknown'}`,
    `Model/label: ${state.model || state.visibleLabel || 'Needs proof'}`,
    `Symptom: ${state.symptom || 'Not entered'}`,
    `Part confidence: ${state.confidence || 'possible'}`,
    `Risk: ${risk.level.toUpperCase()}${risk.missing.length ? ' - missing ' + risk.missing.join(', ') : ''}`,
    '',
    'Checks already done:',
    state.checks || state.techNote || 'Not documented yet',
    '',
    'Recommended next checks:',
    ...checks.map((c, i) => `${i + 1}. ${c}`),
    '',
    'Reference matches:',
    ...(hits.length ? hits.map(h => `- ${h.brandLabel} / ${h.category} / ${h.code}: ${h.name}`) : ['- No confident match yet']),
    '',
    'Customer-safe summary:',
    customer,
    '',
    'Reference only. Verify against current manufacturer manual, label directions, calibrated tests, and qualified field judgment.'
  ].join('\n');
}

function runRouteBrain() {
  const state = collectRouteBrainState();
  const pool = getPools().find(p => p.id === state.poolId);
  const hits = routeBrainHits(state);
  const risk = routeBrainRisk(state, hits);
  const checks = routeBrainNextChecks(state, hits);
  const customer = routeBrainCustomerSummary(state, hits, risk);
  const riskClass = risk.level === 'high' ? 'risk' : risk.level === 'medium' ? 'warn' : 'ready';
  const result = document.getElementById('route-brain-result');
  if (!result) return;
  result.innerHTML = `
    <section class="brain-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <h3>Field Plan</h3>
        <span class="brain-pill ${riskClass}">${risk.level} repeat issue watch</span>
      </div>
      ${risk.missing.length ? `<div class="warn-box" style="margin-bottom:10px;">Missing before this is proof-ready: ${escHtml(risk.missing.join(', '))}</div>` : `<div class="info-box" style="margin-bottom:10px;">Proof path looks complete enough to document and escalate if needed.</div>`}
      <p><strong>Customer-safe summary:</strong> ${escHtml(customer)}</p>
      <div class="dark-note">
        <p style="font-weight:900;margin-bottom:6px;">Fastest next checks</p>
        <ol>${checks.map(c => `<li>${escHtml(c)}</li>`).join('')}</ol>
      </div>
      <div style="margin-top:10px;">
        <p style="font-weight:900;margin-bottom:6px;color:#0f172a;">Reference matches</p>
        ${hits.length ? hits.map(h => `<div style="border:1px solid #e2e8f0;border-radius:8px;padding:9px;margin-bottom:6px;"><p style="font-weight:900;color:#0369a1;">${escHtml(h.brandLabel)} - ${escHtml(h.category)}</p><p>${escHtml(h.code)}: ${escHtml(h.name)}</p></div>`).join('') : '<p>No confident match yet. Capture the label/model and search the exact symptom.</p>'}
      </div>
      <div style="margin-top:10px;">
        <p style="font-weight:900;margin-bottom:6px;color:#0f172a;">What changed since last visit?</p>
        <p>${escHtml(routeBrainChangedSince(pool))}</p>
      </div>
      <div class="brain-grid" style="margin-top:12px;">
        <button class="brain-action secondary" onclick="makeRouteBrainQuote()">Quick Quote Prep</button>
        <button class="brain-action secondary" onclick="copyRouteBrainPacket()">Copy Packet</button>
      </div>
    </section>`;
  trackSplashLensEvent('route_brain_plan_built', { hardware: state.hardware || 'unknown', risk: risk.level, matches: hits.length });
}

function copyRouteBrainPacket() {
  const state = collectRouteBrainState();
  const hits = routeBrainHits(state);
  const risk = routeBrainRisk(state, hits);
  const packet = buildRouteBrainPacket(state, hits, risk);
  navigator.clipboard.writeText(packet).then(() => {
    const result = document.getElementById('route-brain-result');
    if (result && !result.innerHTML) runRouteBrain();
    alert('Route Brain escalation packet copied.');
  }).catch(() => alert(packet));
  trackSplashLensEvent('route_brain_packet_copied', { risk: risk.level, matches: hits.length });
}

function saveRouteBrainToPool() {
  const state = collectRouteBrainState();
  const pools = getPools();
  const pool = pools.find(p => p.id === state.poolId);
  if (!pool) {
    alert('Select a saved pool before saving proof. Temporary stops can still copy an escalation packet.');
    return;
  }
  const hits = routeBrainHits(state);
  const risk = routeBrainRisk(state, hits);
  const passport = {
    id: `brain-${Date.now()}`,
    type: 'route_brain_proof',
    savedAt: new Date().toISOString(),
    poolId: pool.id,
    customer: pool.name,
    address: pool.address || '',
    tech: '',
    date: getTodayStr(),
    visitType: 'Route Brain Troubleshooting',
    readings: {},
    proof: {
      complete: risk.missing.length === 0,
      missing: risk.missing,
      photoProof: state.visibleLabel,
      issueNote: state.techNote || state.checks,
      customerSummary: routeBrainCustomerSummary(state, hits, risk),
    },
    chemicals: [],
    totalChemicalCost: 0,
    workPerformed: `Route Brain checked ${state.hardware || 'equipment'} for ${state.symptom || 'reported issue'}.`,
    equipmentNotes: buildRouteBrainPacket(state, hits, risk),
    recommendations: routeBrainNextChecks(state, hits).join(' '),
    nextVisit: '',
    routeBrain: state,
  };
  if (!pool.servicePassports) pool.servicePassports = [];
  pool.servicePassports.push(passport);
  if (!pool.equipmentTree) pool.equipmentTree = [];
  pool.equipmentTree.push({
    id: `eq-${Date.now()}`,
    manufacturer: state.manufacturer,
    hardware: state.hardware,
    model: state.model,
    visibleLabel: state.visibleLabel,
    symptom: state.symptom,
    confidence: state.confidence,
    savedAt: new Date().toISOString(),
  });
  if (pool.equipmentTree.length > 50) pool.equipmentTree = pool.equipmentTree.slice(-50);
  savePools(pools);
  alert(`Saved Route Brain proof to ${pool.name}.`);
  trackSplashLensEvent('route_brain_saved_to_pool', { risk: risk.level, pool_id: pool.id });
}

function makeRouteBrainTraining() {
  const state = collectRouteBrainState();
  const hits = routeBrainHits(state);
  const risk = routeBrainRisk(state, hits);
  const checks = routeBrainNextChecks(state, hits);
  const result = document.getElementById('route-brain-result');
  if (!result) return;
  const modules = [
    ['proof', 'Proof First', 'Student identifies model/label proof, photos, readings, and missing evidence before touching parts.'],
    ['safe-checks', 'Safe Checks', 'Student orders checks from lowest-risk observation to qualified electrical/gas/refrigerant work.'],
    ['customer', 'Customer Summary', 'Student writes a plain-English explanation without diagnosis, warranty, or fitment claims.'],
    ['escalation', 'Escalation Packet', 'Student prepares a senior tech/vendor packet with exact photos and questions.'],
  ];
  result.innerHTML = `
    <section class="brain-card">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <h3>Guided Training Module</h3>
        <span class="brain-pill ready">5-minute lesson</span>
      </div>
      <p><strong>Scenario:</strong> A tech arrives to investigate ${escHtml(state.hardware || 'equipment')} with symptom "${escHtml(state.symptom || 'unknown symptom')}".</p>
      <div class="brain-grid" style="margin:10px 0;">
        ${modules.map(([key, title, body], index) => `
          <button class="brain-action secondary" onclick="openTrainingModule('${key}')" style="text-align:left;height:auto;min-height:76px;">
            <span style="display:block;font-size:11px;color:#0369a1;font-weight:950;">${index + 1}. ${title}</span>
            <span style="display:block;font-size:11px;color:#475569;line-height:1.35;margin-top:3px;">${body}</span>
          </button>`).join('')}
      </div>
      <div class="dark-note">
        <p style="font-weight:900;margin-bottom:6px;">Answer key / expected checks</p>
        <ol>${checks.map(c => `<li>${escHtml(c)}</li>`).join('')}</ol>
      </div>
      <div id="training-module-panel" class="info-box" style="margin-top:10px;">Pick a module above to run the tech through a focused field exercise.</div>
      <p style="margin-top:8px;"><strong>Safety note:</strong> Electrical, gas, refrigerant, automatic cover, and commercial chemical controller work should be handled by qualified personnel.</p>
      <button class="brain-action secondary" style="margin-top:10px;width:100%;" onclick="copyRouteBrainPacket()">Copy Instructor Packet</button>
    </section>`;
  trackSplashLensEvent('route_brain_training_generated', { hardware: state.hardware || 'unknown', risk: risk.level });
}

function openTrainingModule(key) {
  const panel = document.getElementById('training-module-panel');
  if (!panel) return;
  const state = collectRouteBrainState();
  const hits = routeBrainHits(state);
  const risk = routeBrainRisk(state, hits);
  const checks = routeBrainNextChecks(state, hits);
  const copy = {
    proof: ['Proof First', 'List the exact model/label, photo, reading, or app screen needed before ordering.'],
    'safe-checks': ['Safe Checks', `Start with: ${checks[0] || 'capture proof before repair work'}`],
    customer: ['Customer Summary', routeBrainCustomerSummary(state, hits, risk)],
    escalation: ['Escalation Packet', buildRouteBrainPacket(state, hits, risk)],
  }[key] || ['Training Module', 'Run the scenario and document proof before action.'];
  panel.innerHTML = `<strong>${escHtml(copy[0])}</strong><p style="margin-top:6px;">${escHtml(copy[1])}</p>`;
  trackSplashLensEvent('route_brain_training_module_opened', { module: key, risk: risk.level });
}

function makeRouteBrainQuote() {
  const state = collectRouteBrainState();
  const hits = routeBrainHits(state);
  const risk = routeBrainRisk(state, hits);
  const quote = [
    `Issue: ${state.symptom || 'Equipment issue reported'}`,
    `Equipment: ${[state.manufacturer, state.hardware, state.model].filter(Boolean).join(' / ') || 'Needs model confirmation'}`,
    `Proof needed: ${risk.missing.length ? risk.missing.join(', ') : 'model and field checks documented'}`,
    `Recommended next step: ${routeBrainNextChecks(state, hits)[0]}`,
    `Customer note: ${routeBrainCustomerSummary(state, hits, risk)}`,
  ].join('\n');
  navigator.clipboard.writeText(quote).then(() => alert('Quick quote prep copied.')).catch(() => alert(quote));
  trackSplashLensEvent('route_brain_quote_copied', { risk: risk.level });
}

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function getRoute() {
  try {
    const raw = localStorage.getItem(ROUTE_KEY);
    if (!raw) return { date: getTodayStr(), jobs: [] };
    return JSON.parse(raw);
  } catch(e) {
    return { date: getTodayStr(), jobs: [] };
  }
}

function saveRoute(route) {
  localStorage.setItem(ROUTE_KEY, JSON.stringify(route));
}

function initRoute() {
  renderRoute();
}

function renderRoute() {
  const container = document.getElementById('route-content');
  if (!container) return;

  const route      = getRoute();
  const todayStr   = getTodayStr();
  const isToday    = route.date === todayStr;
  const dateObj    = new Date(route.date + 'T12:00:00');
  const dateFmt    = dateObj.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  const doneCount  = route.jobs.filter(j => j.done).length;
  const total      = route.jobs.length;

  const staleBanner = (!isToday && total > 0)
    ? `<div class="warn-box" style="margin-bottom:12px;font-size:12px;">Showing route from ${dateFmt}. <button onclick="startNewRouteDay()" style="background:none;border:none;color:#92400e;font-weight:800;cursor:pointer;text-decoration:underline;padding:0;">Start Today</button></div>`
    : '';

  const progressBar = total > 0
    ? `<div style="margin:10px 0 14px;">
         <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:5px;">
           <span style="color:#64748b;font-size:12px;font-weight:700;">Stops complete</span>
           <span style="color:#0369a1;font-size:13px;font-weight:900;">${doneCount} / ${total}</span>
         </div>
         <div class="progress-track"><div class="progress-fill" style="width:${(doneCount / total * 100).toFixed(0)}%;"></div></div>
       </div>`
    : '';

  const jobsHtml = total === 0
    ? `<div style="text-align:center;padding:36px 16px;">
         <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#cbd5e1" stroke-width="1.2" style="margin:0 auto 14px;display:block;"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
         <p style="font-size:15px;font-weight:700;color:#475569;margin-bottom:5px;">No stops planned</p>
         <p style="font-size:13px;color:#94a3b8;">Add pool stops from your list or custom stops below.</p>
       </div>`
    : route.jobs.map((job, idx) => routeJobCard(job, idx)).join('');

  container.innerHTML = `
    ${routeBrainPanel()}

    <div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:4px;">
      <div>
        <p style="color:#0369a1;font-weight:900;font-size:16px;">Today's Route</p>
        <p style="color:#64748b;font-size:12px;">${isToday ? dateFmt : 'Viewing: ' + dateFmt}</p>
      </div>
      ${total > 0 ? `<button onclick="confirmClearRoute()" style="background:#f1f5f9;border:1px solid #e2e8f0;color:#64748b;font-size:11px;font-weight:700;padding:5px 10px;border-radius:6px;cursor:pointer;">Clear</button>` : ''}
    </div>

    ${staleBanner}
    ${progressBar}

    <div id="route-jobs">${jobsHtml}</div>

    <div id="route-pool-picker" style="display:none;"></div>
    <div id="route-manual-wrap" style="display:none;margin-top:8px;">
      <div style="display:grid;grid-template-columns:1fr auto;gap:8px;">
        <input type="text" id="route-manual-name" placeholder="Stop description…" style="font-size:16px;">
        <button onclick="confirmAddManualRouteStop()" style="background:#0369a1;color:white;border:none;border-radius:9px;padding:12px 16px;font-weight:800;cursor:pointer;">Add</button>
      </div>
    </div>

    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px;">
      <button onclick="toggleRoutePoolPicker()" style="background:#eff6ff;border:1px solid #93c5fd;color:#0369a1;font-weight:800;font-size:13px;padding:12px;border-radius:9px;cursor:pointer;">+ Pool Stop</button>
      <button onclick="toggleRouteManualInput()" style="background:#f1f5f9;border:1px solid #e2e8f0;color:#374151;font-weight:800;font-size:13px;padding:12px;border-radius:9px;cursor:pointer;">+ Custom Stop</button>
    </div>`;
}

function routeJobCard(job, idx) {
  const op = job.done ? 'opacity:0.5;' : '';
  const tx = job.done ? 'text-decoration:line-through;color:#94a3b8;' : 'color:#0f172a;';
  return `
    <div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;padding:12px 14px;margin-bottom:8px;box-shadow:0 1px 2px rgba(0,0,0,0.04);${op}">
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <input type="checkbox" ${job.done ? 'checked' : ''} onclick="toggleRouteJobDone(${idx})"
               style="width:22px;height:22px;min-width:22px;flex-shrink:0;margin-top:2px;accent-color:#0284c7;cursor:pointer;">
        <div style="flex:1;min-width:0;">
          <p style="font-size:14px;font-weight:800;${tx}">${escHtml(job.name)}</p>
          ${job.address ? `<p style="color:#64748b;font-size:12px;margin-top:2px;">${escHtml(job.address)}</p>` : ''}
          ${job.type === 'pool' && job.poolId
            ? `<button onclick="openPoolFromRoute('${job.poolId}')" style="background:none;border:none;color:#0284c7;font-size:11px;font-weight:700;cursor:pointer;padding:0;margin-top:4px;">View Profile →</button>`
            : ''}
        </div>
        <button onclick="deleteRouteJob(${idx})"
                style="background:none;border:none;color:#cbd5e1;cursor:pointer;padding:4px;flex-shrink:0;font-size:20px;line-height:1;">×</button>
      </div>
    </div>`;
}

function toggleRouteJobDone(idx) {
  const route = getRoute();
  if (!route.jobs[idx]) return;
  route.jobs[idx].done = !route.jobs[idx].done;
  saveRoute(route);
  renderRoute();
}

function deleteRouteJob(idx) {
  const route = getRoute();
  route.jobs.splice(idx, 1);
  saveRoute(route);
  renderRoute();
}

function confirmClearRoute() {
  if (!confirm('Clear all stops from today\'s route?')) return;
  saveRoute({ date: getTodayStr(), jobs: [] });
  renderRoute();
}

function startNewRouteDay() {
  saveRoute({ date: getTodayStr(), jobs: [] });
  renderRoute();
}

function toggleRoutePoolPicker() {
  const picker = document.getElementById('route-pool-picker');
  if (!picker) return;
  // Close manual input if open
  const manualWrap = document.getElementById('route-manual-wrap');
  if (manualWrap) manualWrap.style.display = 'none';

  if (picker.style.display !== 'none') { picker.style.display = 'none'; picker.innerHTML = ''; return; }
  const pools = getPools();
  if (pools.length === 0) {
    picker.style.display = '';
    picker.innerHTML = `<div class="info-box" style="margin-top:8px;">No pools saved yet. Add pools in the Pools tab first.</div>`;
    return;
  }
  picker.style.display = '';
  picker.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-top:8px;">
      <p style="color:#64748b;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.07em;margin-bottom:8px;">Select Pool to Add</p>
      ${pools.map(p => `
        <div onclick="addPoolToRoute('${p.id}')"
             style="padding:10px;border-radius:7px;cursor:pointer;margin-bottom:4px;border:1px solid #e2e8f0;background:#ffffff;-webkit-tap-highlight-color:transparent;">
          <p style="color:#0f172a;font-size:14px;font-weight:700;">${escHtml(p.name)}</p>
          ${p.address ? `<p style="color:#64748b;font-size:12px;">${escHtml(p.address)}</p>` : ''}
        </div>`).join('')}
    </div>`;
}

function addPoolToRoute(poolId) {
  const pools = getPools();
  const pool  = pools.find(p => p.id === poolId);
  if (!pool) return;
  const route = getRoute();
  route.jobs.push({
    id:      String(Date.now()),
    type:    'pool',
    poolId:  pool.id,
    name:    pool.name,
    address: pool.address || '',
    done:    false,
  });
  saveRoute(route);
  renderRoute();
}

function toggleRouteManualInput() {
  const wrap = document.getElementById('route-manual-wrap');
  if (!wrap) return;
  // Close pool picker if open
  const picker = document.getElementById('route-pool-picker');
  if (picker) { picker.style.display = 'none'; picker.innerHTML = ''; }

  const visible = wrap.style.display !== 'none';
  wrap.style.display = visible ? 'none' : '';
  if (!visible) {
    const el = document.getElementById('route-manual-name');
    if (el) { el.value = ''; el.focus(); }
  }
}

function confirmAddManualRouteStop() {
  const el   = document.getElementById('route-manual-name');
  const name = el ? el.value.trim() : '';
  if (!name) { if (el) el.focus(); return; }
  const route = getRoute();
  route.jobs.push({
    id:      String(Date.now()),
    type:    'manual',
    name,
    address: '',
    done:    false,
  });
  saveRoute(route);
  renderRoute();
}

function openPoolFromRoute(poolId) {
  showTab('pools');
  setTimeout(() => renderPoolDetail(poolId), 80);
}

function errorBox(msg) {
  return `<div class="error-box">${msg}</div>`;
}
function infoBox(main, sub) {
  return `<div style="background:#ffffff;border:1px solid #e2e8f0;border-radius:8px;padding:12px;">
    <p style="color:#0f172a;font-size:14px;font-weight:600;">${main}</p>
    ${sub ? `<p style="color:#64748b;font-size:12px;margin-top:6px;line-height:1.5;">${sub}</p>` : ''}
  </div>`;
}

// ═══════════════════════════════════════════
// SCAN TAB — Camera AI + Code Lookup + Chem
// ═══════════════════════════════════════════

let _scanStream    = null;
let _scanMode      = 'camera';
let _scanBrand     = null;   // null = all brands
let _flashOn       = false;
let _flashTrack    = null;
let _lastPartSnapResult = null;

const SCAN_LIMIT_FREE = 3;
const SCAN_USAGE_KEY = 'pl_scans_month';
const SCAN_PRO_KEY = 'sl_partsnap_pro_local';
const SCAN_ENTITLEMENT_TOKEN_KEY = 'sl_scan_entitlement_token';
const SCAN_ENTITLEMENT_META_KEY = 'sl_scan_entitlement_meta';
const PARTSNAP_MONTHLY_LINK = '/api/checkout?plan=monthly';
const PARTSNAP_YEARLY_LINK = '/api/checkout?plan=yearly';
const PARTSNAP_RESTORE_ENDPOINT = '/api/restore-entitlement';
const SPLASHLENS_EVENT_ENDPOINT = '/api/events';
const SPLASHLENS_FREE_PROFILE_ENDPOINT = '/api/free-profile';
const PARTSNAP_FEEDBACK_ENDPOINT = '/api/partsnap-feedback';
const SPLASHLENS_HEARTBEAT_INTERVAL_MS = 120000;
const PARTSNAP_REVIEW_KEY = 'splashlens-partsnap-review-tickets';
const STORE_SHELL_KEY = 'sl_store_shell_mode';
const ATTRIBUTION_KEY = 'splashlens-attribution-v1';
const ATTRIBUTION_SESSION_KEY = 'splashlens-attribution-session-v1';
const IDENTITY_PROFILE_KEY = 'splashlens-identity-profile-v1';
const IDENTITY_SESSION_KEY = 'splashlens-identity-session-v1';

function initScanTab() {
  updateAIStatusBar();
  setScanMode(_scanMode || 'camera');
  renderScanBrandFilter();
}

function updateAIStatusBar() {
  const dot   = document.getElementById('scan-ai-dot');
  const label = document.getElementById('scan-ai-label');
  if (!dot || !label) return;
  if (navigator.onLine) {
    const usage = getScanUsage();
    const hasFreeProfile = Boolean(getFieldSaveAccount());
    dot.style.background   = '#16a34a';
    label.textContent      = getScanEntitlementToken()
      ? 'SIGNED SCANNER ACCESS READY'
      : isPartSnapPro() ? 'PRO UNLIMITED READY' : hasFreeProfile ? `AI READY - ${Math.max(0, SCAN_LIMIT_FREE - usage.count)} PROFILE SCANS LEFT` : `FREE PROFILE UNLOCKS ${SCAN_LIMIT_FREE} AI SCANS`;
    label.style.color      = '#4ade80';
  } else {
    dot.style.background   = '#64748b';
    label.textContent      = 'OFFLINE — CODE LOOKUP AVAILABLE';
    label.style.color      = '#64748b';
  }
}

function setScanMode(mode) {
  _scanMode = mode;
  if (getSplashLensRole() === 'facility') {
    trackFacilityEvent('scan_used', { lane: 'manual', mode });
  }
  const isCameraMode = mode === 'camera' || mode === 'parts' || mode === 'strip';
  // Update mode buttons — all camera sub-modes share the camera panel
  ['camera','parts','strip','lookup','chem'].forEach(m => {
    const btn = document.getElementById(`scan-mode-${m}`);
    if (!btn) return;
    btn.style.background = m === mode ? '#0284c7' : 'transparent';
    btn.style.color      = m === mode ? '#fff'    : '#94a3b8';
  });
  // Panel visibility
  const camPanel    = document.getElementById('scan-camera-panel');
  const lookupPanel = document.getElementById('scan-lookup-panel');
  const chemPanel   = document.getElementById('scan-chem-panel');
  if (camPanel)    camPanel.style.display    = isCameraMode ? 'block' : 'none';
  if (lookupPanel) lookupPanel.style.display = mode === 'lookup' ? 'block' : 'none';
  if (chemPanel)   chemPanel.style.display   = mode === 'chem'   ? 'block' : 'none';

  // Update camera guidance text
  const status = document.getElementById('scan-camera-status');
  const capBtn = document.getElementById('scan-capture-btn');
  if (mode === 'parts') {
    if (status) status.textContent = 'AIM AT EQUIPMENT PART — TAP IDENTIFY';
    if (capBtn) capBtn.textContent = '🔧 IDENTIFY PART';
  } else if (mode === 'strip') {
    if (status) status.textContent = 'AIM AT TEST STRIP IN GOOD LIGHT — TAP SCAN';
    if (capBtn) capBtn.textContent = '🧪 SCAN STRIP';
  } else {
    if (status) status.textContent = 'AIM AT ERROR CODE DISPLAY — TAP CAPTURE';
    if (capBtn) capBtn.textContent = '⬤ CAPTURE';
  }

  if (mode === 'parts') {
    if (status) status.textContent = 'AIM AT EQUIPMENT PART - TAP IDENTIFY';
    if (capBtn) capBtn.textContent = 'IDENTIFY PART';
  } else if (mode === 'strip') {
    if (status) status.textContent = 'AIM AT TEST STRIP IN GOOD LIGHT - TAP SCAN';
    if (capBtn) capBtn.textContent = 'SCAN STRIP';
  } else {
    if (status) status.textContent = 'AIM AT ERROR CODE DISPLAY - TAP CAPTURE';
    if (capBtn) capBtn.textContent = 'CAPTURE';
  }

  if (isCameraMode) startCamera();
  else              stopCamera();
  if (mode === 'lookup') renderScanBrandFilter();
  if (mode === 'chem')   renderChemCatalogHome();
  if (mode === 'parts')  renderPartSnapPrimer();
  updateAIStatusBar();
}

function openLivePartSnap() {
  showTab('scan');
  setTimeout(() => {
    const result = document.getElementById('scan-result');
    if (result) result.innerHTML = '';
    setScanMode('parts');
    trackSplashLensEvent('first_action_started', {
      role: getSplashLensRole(),
      action: 'Use real PartSnap',
      workflow_style: getWorkflowStyle(),
    });
  }, 80);
}

function renderCounterSamplePacket() {
  const result = document.getElementById('scan-result');
  if (!result) return;
  result.innerHTML = `
    <div style="margin:12px 0 16px;background:#f8fafc;border:1px solid #99f6e4;border-left:4px solid #0f766e;border-radius:14px;padding:14px;">
      <p style="color:#0f766e;font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;">Counter sample - no live fitment</p>
      <h3 style="color:#0f172a;font-size:19px;font-weight:950;line-height:1.08;margin-bottom:7px;">Walk-in pump lid packet</h3>
      <p style="color:#475569;font-size:12px;line-height:1.45;margin-bottom:10px;">Use this sample to show how SplashLens slows down a risky sale: possible family, missing proof, repeat issue watch, and supplier questions before anyone orders.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px;">
        <div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:9px;padding:9px;"><b style="display:block;color:#0e7490;font-size:12px;">Visible</b><span style="display:block;color:#475569;font-size:11px;margin-top:4px;">lid profile, molded ribs</span></div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;padding:9px;"><b style="display:block;color:#92400e;font-size:12px;">Missing</b><span style="display:block;color:#475569;font-size:11px;margin-top:4px;">pump model plate, diameter</span></div>
        <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:9px;padding:9px;"><b style="display:block;color:#991b1b;font-size:12px;">Watch</b><span style="display:block;color:#475569;font-size:11px;margin-top:4px;">medium repeat issue watch</span></div>
      </div>
      <div style="background:#0f172a;border-radius:10px;padding:11px;margin-bottom:10px;">
        <p style="color:#94a3b8;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">Vendor packet</p>
        <p style="color:#e2e8f0;font-size:12px;line-height:1.45;">Possible pump lid family only. Need model plate, lid OD, union size, and current parts diagram before fitment or order. Customer should not be told this is confirmed.</p>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" onclick="copyCounterSamplePacket()" style="background:#0f766e;color:#fff;border:0;border-radius:10px;padding:11px;font-size:12px;font-weight:950;cursor:pointer;">Copy sample packet</button>
        <button type="button" onclick="openLivePartSnap()" style="background:#ffffff;color:#075985;border:1px solid #bae6fd;border-radius:10px;padding:11px;font-size:12px;font-weight:950;cursor:pointer;">Use real part</button>
      </div>
    </div>`;
  trackSplashLensEvent('counter_sample_packet_viewed', { role: getSplashLensRole(), demo: true });
}

function copyCounterSamplePacket() {
  const text = [
    'SplashLens counter sample packet - DEMO TEST',
    'Possible family: pump lid / strainer cover',
    'Visible proof: lid profile, molded ribs',
    'Missing proof: pump model plate, lid outside diameter, union size, current parts diagram',
    'Watch: medium repeat issue watch until proof improves',
    'Language: do not confirm fitment or order until manufacturer diagram and model proof agree.',
  ].join('\n');
  navigator.clipboard?.writeText(text);
  trackSplashLensEvent('counter_sample_packet_copied', { role: getSplashLensRole(), demo: true });
}

function renderTrainerSampleLesson() {
  const result = document.getElementById('scan-result');
  if (!result) return;
  result.innerHTML = `
    <div style="margin:12px 0 16px;background:#f8fafc;border:1px solid #bae6fd;border-left:4px solid #0284c7;border-radius:14px;padding:14px;">
      <p style="color:#0369a1;font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;">DEMO TEST five-minute lesson</p>
      <h3 style="color:#0f172a;font-size:19px;font-weight:950;line-height:1.08;margin-bottom:7px;">Observe, prove, then order.</h3>
      <p style="color:#475569;font-size:12px;line-height:1.45;margin-bottom:10px;">Student task: look at a possible pump lid result and decide what proof is still missing before a counter or senior tech should trust it.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px;">
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:9px;padding:9px;"><b style="display:block;color:#0369a1;font-size:12px;">1. Observe</b><span style="display:block;color:#475569;font-size:11px;margin-top:4px;">part shape, markings, damage</span></div>
        <div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:9px;padding:9px;"><b style="display:block;color:#0e7490;font-size:12px;">2. Prove</b><span style="display:block;color:#475569;font-size:11px;margin-top:4px;">model plate, dimensions</span></div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:9px;padding:9px;"><b style="display:block;color:#92400e;font-size:12px;">3. Hold</b><span style="display:block;color:#475569;font-size:11px;margin-top:4px;">no fitment claim yet</span></div>
      </div>
      <details style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:10px;margin-bottom:10px;">
        <summary style="color:#e2e8f0;font-size:12px;font-weight:950;cursor:pointer;">Show answer key</summary>
        <p style="color:#cbd5e1;font-size:12px;line-height:1.45;margin-top:8px;">Correct answer: this is not order-ready. The student should request the equipment model plate, lid OD, part markings, and current diagram. A cautious app helps by saying what proof is missing instead of pretending certainty.</p>
      </details>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button type="button" onclick="openLivePartSnap()" style="background:#0284c7;color:#fff;border:0;border-radius:10px;padding:11px;font-size:12px;font-weight:950;cursor:pointer;">Use real part</button>
        <button type="button" onclick="startOperatorWizard('contamination')" style="background:#ffffff;color:#075985;border:1px solid #bae6fd;border-radius:10px;padding:11px;font-size:12px;font-weight:950;cursor:pointer;">CPO scenario</button>
      </div>
    </div>`;
  trackSplashLensEvent('trainer_sample_lesson_viewed', { role: getSplashLensRole(), demo: true });
}

function renderPartSnapPrimer() {
  const result = document.getElementById('scan-result');
  if (!result || result.innerHTML.trim()) return;
  result.innerHTML = `
    <div style="margin:12px 0 16px;background:linear-gradient(135deg,#062b2f,#0f172a);border:1px solid #0f766e;border-radius:14px;padding:14px;border-left:4px solid #14b8a6;">
      <p style="color:#5eead4;font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;">PartSnap AI Service</p>
      <p style="color:#f8fafc;font-size:18px;font-weight:950;line-height:1.1;margin-bottom:8px;">Shoot the part, then shoot the label.</p>
      <div style="display:grid;grid-template-columns:repeat(4,minmax(76px,1fr));gap:7px;overflow-x:auto;-webkit-overflow-scrolling:touch;">
        <div style="background:#042f2e;border:1px solid #0f766e;border-radius:9px;padding:9px;min-height:66px;"><b style="display:block;color:#ccfbf1;font-size:12px;">1. Part</b><span style="display:block;color:#99f6e4;font-size:10px;font-weight:800;margin-top:6px;">close + lit</span></div>
        <div style="background:#111827;border:1px solid #334155;border-radius:9px;padding:9px;min-height:66px;"><b style="display:block;color:#e2e8f0;font-size:12px;">2. Label</b><span style="display:block;color:#94a3b8;font-size:10px;font-weight:800;margin-top:6px;">model proof</span></div>
        <div style="background:#431407;border:1px solid #b45309;border-radius:9px;padding:9px;min-height:66px;"><b style="display:block;color:#fed7aa;font-size:12px;">3. Verify</b><span style="display:block;color:#fdba74;font-size:10px;font-weight:800;margin-top:6px;">before buy</span></div>
        <div style="background:#082f49;border:1px solid #0369a1;border-radius:9px;padding:9px;min-height:66px;"><b style="display:block;color:#bae6fd;font-size:12px;">4. Packet</b><span style="display:block;color:#7dd3fc;font-size:10px;font-weight:800;margin-top:6px;">send / save</span></div>
      </div>
      ${renderPartSnapFieldStopSummary()}
      ${renderPartSnapReviewTicketSummary()}
    </div>`;
}

function renderPartSnapFieldStopSummary() {
  const stops = getPartSnapFieldStops();
  if (!stops.length) return '';
  const latest = stops[0];
  return `
    <div style="margin-top:10px;background:#ecfeff;border:1px solid #22d3ee;border-radius:10px;padding:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div style="min-width:0;">
          <p style="color:#0e7490;font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;">Saved field stops</p>
          <p style="color:#0f172a;font-size:12px;font-weight:900;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${stops.length} saved - ${escHtml(latest.title || 'latest PartSnap result')}</p>
        </div>
        <button onclick="renderPartSnapFieldStops()" style="background:#0891b2;color:#fff;border:0;border-radius:8px;padding:9px 11px;font-size:10px;font-weight:950;cursor:pointer;white-space:nowrap;">Open</button>
      </div>
    </div>`;
}

function renderPartSnapFieldStops() {
  const result = document.getElementById('scan-result');
  if (!result) return;
  const stops = getPartSnapFieldStops();
  trackSplashLensEvent('partsnap_field_stop_library_opened', { saved_count: stops.length });
  result.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:14px;margin:8px 0;">
      <p style="color:#0e7490;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">Saved on this device</p>
      <h3 style="color:#0f172a;font-size:18px;font-weight:950;margin-bottom:5px;">Recent PartSnap field stops</h3>
      <p style="color:#64748b;font-size:11px;line-height:1.45;margin-bottom:12px;">Reopen the evidence, assign it to a customer, or send the handoff without scanning again.</p>
      ${stops.length ? stops.map((stop) => `
        <div style="background:#fff;border:1px solid #dbeafe;border-radius:10px;padding:10px;margin-bottom:8px;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
            <div style="min-width:0;"><strong style="display:block;color:#0f172a;font-size:12px;">${escHtml(stop.title || 'PartSnap field stop')}</strong><span style="display:block;color:#64748b;font-size:10px;margin-top:3px;">${escHtml(stop.model || 'Model proof still needed')} - ${new Date(stop.savedAt).toLocaleString()}</span></div>
            <span style="background:${stop.risk === 'high' ? '#dc2626' : stop.risk === 'medium' ? '#d97706' : '#16a34a'};color:#fff;border-radius:999px;padding:3px 7px;font-size:9px;font-weight:950;white-space:nowrap;">${escHtml((stop.risk || 'unknown').toUpperCase())}</span>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr auto;gap:6px;margin-top:9px;">
            <button onclick="openPartSnapFieldStop('${escAttr(stop.id)}')" style="background:#0369a1;color:#fff;border:0;border-radius:8px;padding:9px;font-size:10px;font-weight:900;cursor:pointer;">Open stop</button>
            <button onclick="assignPartSnapFieldStop('${escAttr(stop.id)}')" style="background:#0f766e;color:#fff;border:0;border-radius:8px;padding:9px;font-size:10px;font-weight:900;cursor:pointer;">Assign</button>
            <button onclick="deletePartSnapFieldStop('${escAttr(stop.id)}')" aria-label="Delete saved stop" title="Delete saved stop" style="background:#fff;color:#991b1b;border:1px solid #fecaca;border-radius:8px;padding:9px 11px;font-size:11px;font-weight:900;cursor:pointer;">X</button>
          </div>
        </div>`).join('') : '<p style="color:#64748b;font-size:12px;">No saved field stops yet.</p>'}
      <button onclick="document.getElementById('scan-result').innerHTML='';renderPartSnapPrimer()" style="width:100%;background:#0f172a;color:#fff;border:0;border-radius:9px;padding:10px;font-size:11px;font-weight:900;cursor:pointer;">Back to PartSnap</button>
    </div><div id="partsnap-feedback-panel"></div>`;
}

function openPartSnapFieldStop(id) {
  const stop = getPartSnapFieldStops().find((item) => item.id === id);
  const result = document.getElementById('scan-result');
  if (!stop || !result) return;
  _lastPartSnapResult = stop.partSnap || {};
  trackSplashLensEvent('partsnap_field_stop_reopened', { age_days: Math.max(0, Math.floor((Date.now() - Date.parse(stop.savedAt)) / 86400000)), risk: stop.risk || 'unknown' });
  result.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #67e8f9;border-left:4px solid #0891b2;border-radius:12px;padding:14px;margin:8px 0;">
      <p style="color:#0e7490;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:5px;">Saved field stop</p>
      <h3 style="color:#0f172a;font-size:19px;font-weight:950;margin-bottom:4px;">${escHtml(stop.title)}</h3>
      <p style="color:#475569;font-size:12px;margin-bottom:10px;">${escHtml(stop.model || 'Model proof still needed')} - saved ${new Date(stop.savedAt).toLocaleString()}</p>
      ${renderPartEvidencePanel(stop.visibleEvidence || [], stop.missingProof || [])}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <button onclick="savePartSnapToPool()" style="background:#0f766e;color:#fff;border:0;border-radius:9px;padding:11px;font-size:11px;font-weight:900;cursor:pointer;">Assign customer</button>
        <button onclick="sharePartSnapPacket()" style="background:#0369a1;color:#fff;border:0;border-radius:9px;padding:11px;font-size:11px;font-weight:900;cursor:pointer;">Share packet</button>
        <button onclick="requestPartSnapSecondProof()" style="background:#fff;color:#075985;border:1px solid #bae6fd;border-radius:9px;padding:10px;font-size:11px;font-weight:900;cursor:pointer;">Add proof photo</button>
        <button onclick="renderPartSnapFieldStops()" style="background:#fff;color:#334155;border:1px solid #cbd5e1;border-radius:9px;padding:10px;font-size:11px;font-weight:900;cursor:pointer;">All saved stops</button>
      </div>
    </div><div id="partsnap-feedback-panel"></div>`;
}

function assignPartSnapFieldStop(id) {
  const stop = getPartSnapFieldStops().find((item) => item.id === id);
  if (!stop) return;
  _lastPartSnapResult = stop.partSnap || {};
  trackSplashLensEvent('partsnap_field_stop_assign_started', { risk: stop.risk || 'unknown' });
  savePartSnapToPool();
}

function deletePartSnapFieldStop(id) {
  if (!window.confirm('Delete this saved field stop from this device?')) return;
  const stops = getPartSnapFieldStops().filter((item) => item.id !== id);
  localStorage.setItem('splashlens-partsnap-field-stops', JSON.stringify(stops));
  trackSplashLensEvent('partsnap_field_stop_deleted', { remaining_count: stops.length });
  renderPartSnapFieldStops();
}

// ── Camera ──────────────────────────────────

function revealNoCameraFallback(noCam, vWrap) {
  if (vWrap) vWrap.style.display = 'none';
  if (!noCam) return;
  noCam.style.display = 'block';
  noCam.style.scrollMarginBottom = 'calc(184px + env(safe-area-inset-bottom))';
  setTimeout(() => noCam.scrollIntoView({ block: 'nearest', behavior: 'smooth' }), 60);
}

function getPartSnapReviewTickets() {
  try {
    const tickets = JSON.parse(localStorage.getItem(PARTSNAP_REVIEW_KEY) || '[]');
    return Array.isArray(tickets) ? tickets : [];
  } catch {
    return [];
  }
}

function savePartSnapReviewTicket(ticket) {
  const tickets = getPartSnapReviewTickets();
  tickets.push(ticket);
  localStorage.setItem(PARTSNAP_REVIEW_KEY, JSON.stringify(tickets.slice(-25)));
}

function renderPartSnapReviewTicketSummary() {
  const tickets = getPartSnapReviewTickets();
  if (!tickets.length) return '';
  const latest = tickets[tickets.length - 1];
  return `
    <div style="margin-top:10px;background:#020617;border:1px solid #164e63;border-radius:10px;padding:10px;">
      <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;">
        <div>
          <p style="color:#67e8f9;font-size:10px;font-weight:950;letter-spacing:.08em;text-transform:uppercase;margin-bottom:3px;">Mystery Part Review Queue</p>
          <p style="color:#e0f2fe;font-size:11px;line-height:1.35;">Latest: ${escHtml(latest.id || 'local ticket')} - ${escHtml(latest.status || 'saved')}</p>
        </div>
        <button onclick="renderPartSnapReviewTickets()" style="background:#0e7490;color:#fff;border:none;border-radius:8px;padding:8px 10px;font-size:10px;font-weight:900;cursor:pointer;white-space:nowrap;">View</button>
      </div>
    </div>`;
}

function renderPartSnapReviewTickets() {
  const result = document.getElementById('scan-result');
  if (!result) return;
  const tickets = getPartSnapReviewTickets().slice().reverse();
  result.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:12px;padding:14px;margin:8px 0;">
      <p style="color:#0369a1;font-size:10px;font-weight:950;letter-spacing:.1em;text-transform:uppercase;margin-bottom:5px;">PartSnap Review Queue</p>
      <h3 style="color:#0f172a;font-size:18px;font-weight:950;margin-bottom:7px;">Mystery part tickets saved on this device</h3>
      <p style="color:#64748b;font-size:12px;line-height:1.45;margin-bottom:12px;">These are the last 25 mystery-part submissions or failed sends from this device. Owner review also appears in the protected dashboard when the ticket reaches SplashLens.</p>
      ${tickets.length ? tickets.map(ticket => `
        <div style="border:1px solid #e2e8f0;border-radius:10px;padding:10px;margin-bottom:8px;background:#fff;">
          <div style="display:flex;justify-content:space-between;gap:8px;align-items:flex-start;">
            <strong style="color:#0f172a;font-size:12px;">${escHtml(ticket.id || 'local ticket')}</strong>
            <span style="color:#0369a1;background:#e0f2fe;border-radius:999px;padding:3px 7px;font-size:10px;font-weight:900;">${escHtml(ticket.status || 'saved')}</span>
          </div>
          <p style="color:#475569;font-size:11px;line-height:1.4;margin-top:6px;">${escHtml(ticket.summary || 'Mystery part submitted.')}</p>
          <p style="color:#94a3b8;font-size:10px;margin-top:6px;">${escHtml(ticket.createdAt || '')}</p>
        </div>`).join('') : '<p style="color:#64748b;font-size:12px;">No tickets yet. Send a mystery part from a PartSnap result to start the queue.</p>'}
      <button onclick="setScanMode('parts')" style="width:100%;background:#0f766e;color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;margin-top:4px;">Back to PartSnap</button>
    </div>`;
}

function startCamera() {
  const video  = document.getElementById('scan-video');
  const noCam  = document.getElementById('scan-no-camera');
  const vWrap  = document.getElementById('scan-viewfinder-wrap');
  if (!video) return;
  if (!navigator.mediaDevices?.getUserMedia) {
    revealNoCameraFallback(noCam, vWrap);
    return;
  }
  // Don't restart if already streaming
  if (_scanStream?.active) {
    video.srcObject = _scanStream;
    if (vWrap)  vWrap.style.display = 'block';
    if (noCam)  noCam.style.display = 'none';
    return;
  }
  navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } } })
    .then(stream => {
      _scanStream = stream;
      _flashTrack = stream.getVideoTracks()[0] || null;
      video.srcObject = stream;
      if (vWrap)  vWrap.style.display = 'block';
      if (noCam)  noCam.style.display = 'none';
    })
    .catch(() => {
      revealNoCameraFallback(noCam, vWrap);
    });
}

function toggleFlashlight() {
  if (!_flashTrack) return;
  const cap = _flashTrack.getCapabilities?.();
  if (!cap?.torch) return;
  _flashOn = !_flashOn;
  _flashTrack.applyConstraints({ advanced: [{ torch: _flashOn }] }).catch(() => {});
  const btn = document.getElementById('scan-flash-btn');
  if (btn) btn.style.background = _flashOn ? '#fbbf24' : '#1e293b';
}

function stopCamera() {
  if (_flashOn && _flashTrack) {
    _flashTrack.applyConstraints({ advanced: [{ torch: false }] }).catch(() => {});
    _flashOn = false;
    const btn = document.getElementById('scan-flash-btn');
    if (btn) btn.style.background = '#1e293b';
  }
  if (_scanStream) {
    _scanStream.getTracks().forEach(t => t.stop());
    _scanStream = null;
    _flashTrack = null;
  }
}

async function captureAndAnalyze() {
  const video  = document.getElementById('scan-video');
  const canvas = document.getElementById('scan-canvas');
  const status = document.getElementById('scan-camera-status');
  const result = document.getElementById('scan-result');
  if (!video || !canvas) return;

  canvas.width  = video.videoWidth  || 640;
  canvas.height = video.videoHeight || 360;
  canvas.getContext('2d').drawImage(video, 0, 0);

  const isPartsScan  = _scanMode === 'parts';
  const isStripScan  = _scanMode === 'strip';

  if (status) status.textContent = navigator.onLine ? 'AI ANALYZING…' : 'SCANNING…';

  // AI-first path: call CF Worker when online
  if (navigator.onLine) {
    const aiMode = isPartsScan ? 'parts_snap' : isStripScan ? 'test_strip' : 'error_code';
    if (!(await ensureFreeScanProfile(aiMode, result, status))) return;
    if (!canUseAIScan()) {
      showScanLimitModal(result, status);
      return;
    }
    if (isPartsScan) {
      const preflight = inspectPartSnapImage(canvas);
      if (preflight.block) {
        showPartSnapImagePreflight(preflight, result, status);
        return;
      }
      if (preflight.warnings.length) {
        trackSplashLensEvent('partsnap_image_preflight_warning', {
          warnings: preflight.warnings,
          brightness: preflight.brightness,
          contrast: preflight.contrast,
          edge_score: preflight.edgeScore,
          width: preflight.width,
          height: preflight.height,
          recovery: getPartSnapRecoveryContext()?.active || false,
        });
      }
    }
    callAIScan(canvas, aiMode, result, status);
    return;
  }

  // Offline strip and parts need AI — show message
  if (isStripScan || isPartsScan) {
    if (status) status.textContent = 'INTERNET REQUIRED FOR AI SCAN';
    if (result) result.innerHTML = `<div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:20px;text-align:center;">
      <p style="color:#fbbf24;font-size:14px;font-weight:700;margin-bottom:8px;">${isStripScan ? '🧪 Test Strip' : '🔧 PartSnap'} requires AI</p>
      <p style="color:#64748b;font-size:12px;line-height:1.5;">Connect to internet and try again, or use Code Lookup to search manually.</p>
    </div>`;
    return;
  }

  // Offline error code: try native TextDetector
  if ('TextDetector' in window) {
    canvas.convertToBlob({ type: 'image/jpeg' }).then(blob =>
      createImageBitmap(blob).then(bmp => {
        new TextDetector().detect(bmp).then(texts => {
          const raw   = texts.map(t => t.rawValue).join(' ');
          const codes = extractErrorCodes(raw);
          if (codes.length) runCodeSearch(codes[0], result, status);
          else showCaptureWithManualEntry(canvas, raw, result, status);
        }).catch(() => showCaptureWithManualEntry(canvas, '', result, status));
      })
    ).catch(() => showCaptureWithManualEntry(canvas, '', result, status));
    return;
  }

  // Final fallback: manual entry
  showCaptureWithManualEntry(canvas, '', result, status);
}

function inspectPartSnapImage(canvas) {
  const width = canvas.width || 0;
  const height = canvas.height || 0;
  const warnings = [];
  const blockers = [];
  if (width < 320 || height < 220) blockers.push('low_resolution');

  const sampleSize = 48;
  const sample = document.createElement('canvas');
  sample.width = sampleSize;
  sample.height = sampleSize;
  const ctx = sample.getContext('2d', { willReadFrequently: true });
  if (!ctx) return { block: false, warnings, blockers, width, height, brightness: 0, contrast: 0, edgeScore: 0 };
  ctx.drawImage(canvas, 0, 0, sampleSize, sampleSize);
  const pixels = ctx.getImageData(0, 0, sampleSize, sampleSize).data;
  const luminance = [];
  let total = 0;
  for (let i = 0; i < pixels.length; i += 4) {
    const y = (pixels[i] * 0.2126) + (pixels[i + 1] * 0.7152) + (pixels[i + 2] * 0.0722);
    luminance.push(y);
    total += y;
  }
  const brightness = total / luminance.length;
  const variance = luminance.reduce((sum, y) => sum + ((y - brightness) ** 2), 0) / luminance.length;
  const contrast = Math.sqrt(variance);
  let edgeTotal = 0;
  let edgeCount = 0;
  for (let y = 1; y < sampleSize; y += 1) {
    for (let x = 1; x < sampleSize; x += 1) {
      const index = y * sampleSize + x;
      const left = luminance[index - 1];
      const up = luminance[index - sampleSize];
      edgeTotal += Math.abs(luminance[index] - left) + Math.abs(luminance[index] - up);
      edgeCount += 2;
    }
  }
  const edgeScore = edgeTotal / Math.max(edgeCount, 1);

  if (brightness < 38) blockers.push('too_dark');
  else if (brightness < 55) warnings.push('dim');
  if (brightness > 238) blockers.push('washed_out');
  else if (brightness > 220) warnings.push('bright_glare');
  if (contrast < 12) blockers.push('flat_or_blank');
  else if (contrast < 20) warnings.push('low_contrast');
  if (edgeScore < 4.5) blockers.push('blurry_or_too_far');
  else if (edgeScore < 7) warnings.push('soft_focus');

  return {
    block: blockers.length > 0,
    warnings,
    blockers,
    width,
    height,
    brightness: Math.round(brightness),
    contrast: Math.round(contrast),
    edgeScore: Math.round(edgeScore * 10) / 10,
  };
}

function partSnapPreflightCopy(code) {
  const copy = {
    low_resolution: ['Move closer', 'The photo is too small for part markings. Fill the screen with the label or part.'],
    too_dark: ['Add light', 'Turn on the pad light/flashlight or move the part into brighter light.'],
    washed_out: ['Reduce glare', 'Angle the phone so the label or plastic is not washed out by reflection.'],
    flat_or_blank: ['Find markings', 'PartSnap sees too little detail. Aim at a label, molded number, casting mark, or model plate.'],
    blurry_or_too_far: ['Steady and closer', 'Hold still, move closer, and tap the label/marking area before scanning.'],
  };
  return copy[code] || ['Retake photo', 'Capture a clearer part close-up and the equipment model plate.'];
}

function showPartSnapImagePreflight(preflight, result, status) {
  if (status) status.textContent = 'PHOTO NEEDS PROOF BEFORE AI SCAN';
  const primary = preflight.blockers[0] || preflight.warnings[0] || 'retake';
  const [title, body] = partSnapPreflightCopy(primary);
  trackSplashLensEvent('partsnap_image_preflight_blocked', {
    blockers: preflight.blockers,
    warnings: preflight.warnings,
    brightness: preflight.brightness,
    contrast: preflight.contrast,
    edge_score: preflight.edgeScore,
    width: preflight.width,
    height: preflight.height,
    recovery: getPartSnapRecoveryContext()?.active || false,
  });
  if (!result) return;
  result.innerHTML = `
    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:12px;padding:14px;margin:8px 0;">
      <p style="color:#9a3412;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Photo check</p>
      <p style="color:#0f172a;font-size:16px;font-weight:950;margin-bottom:5px;">${escHtml(title)}</p>
      <p style="color:#7c2d12;font-size:12px;line-height:1.45;margin-bottom:10px;">${escHtml(body)}</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-bottom:10px;">
        <div style="background:#fff;border:1px solid #fed7aa;border-radius:8px;padding:8px;text-align:center;">
          <p style="color:#92400e;font-size:9px;font-weight:950;text-transform:uppercase;">Light</p>
          <p style="color:#0f172a;font-size:14px;font-weight:950;">${preflight.brightness}</p>
        </div>
        <div style="background:#fff;border:1px solid #fed7aa;border-radius:8px;padding:8px;text-align:center;">
          <p style="color:#92400e;font-size:9px;font-weight:950;text-transform:uppercase;">Contrast</p>
          <p style="color:#0f172a;font-size:14px;font-weight:950;">${preflight.contrast}</p>
        </div>
        <div style="background:#fff;border:1px solid #fed7aa;border-radius:8px;padding:8px;text-align:center;">
          <p style="color:#92400e;font-size:9px;font-weight:950;text-transform:uppercase;">Detail</p>
          <p style="color:#0f172a;font-size:14px;font-weight:950;">${preflight.edgeScore}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="captureAndAnalyze()" style="background:#ea580c;color:#fff;border:0;border-radius:9px;padding:12px 9px;font-size:12px;font-weight:950;cursor:pointer;">Retake now</button>
        <button onclick="requestPartSnapSecondProof()" style="background:#0f172a;color:#fed7aa;border:1px solid #92400e;border-radius:9px;padding:12px 9px;font-size:12px;font-weight:950;cursor:pointer;">Show proof tips</button>
      </div>
    </div>`;
}

function aiScanLabel() {
  if (_scanMode === 'parts') return 'parts_snap';
  if (_scanMode === 'strip') return 'test_strip';
  return 'error_code';
}

function currentScanMonth() {
  return new Date().toISOString().slice(0, 7);
}

function getScanUsage() {
  try {
    const raw = JSON.parse(localStorage.getItem(SCAN_USAGE_KEY) || '{}');
    if (raw.month === currentScanMonth()) return { month: raw.month, count: Number(raw.count) || 0 };
  } catch {}
  return { month: currentScanMonth(), count: 0 };
}

function saveScanUsage(usage) {
  localStorage.setItem(SCAN_USAGE_KEY, JSON.stringify({ month: usage.month, count: usage.count }));
}

function isPartSnapPro() {
  const entitlement = getScanEntitlementMeta();
  return localStorage.getItem(SCAN_PRO_KEY) === '1' || entitlement.scopes.includes('scan') || Boolean(getScanEntitlementToken());
}

function getScanEntitlementToken() {
  const token = localStorage.getItem(SCAN_ENTITLEMENT_TOKEN_KEY) || '';
  return token.startsWith('sl_scan_v1.') ? token : '';
}

function decodeScanEntitlementToken(token) {
  try {
    const parts = String(token || '').split('.');
    if (parts.length !== 3 || parts[0] !== 'sl_scan_v1') return null;
    const normalized = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
    return JSON.parse(atob(padded));
  } catch {
    return null;
  }
}

function getScanEntitlementMeta() {
  try {
    const token = getScanEntitlementToken();
    const fromToken = decodeScanEntitlementToken(token);
    const stored = JSON.parse(localStorage.getItem(SCAN_ENTITLEMENT_META_KEY) || '{}');
    const meta = fromToken || stored || {};
    const scopes = Array.isArray(meta.scopes) ? meta.scopes : String(meta.scopes || '').split(',');
    return {
      plan: String(meta.plan || stored.plan || 'SplashLens paid access').slice(0, 100),
      planKey: String(meta.planKey || stored.planKey || '').slice(0, 100),
      feature: String(meta.feature || stored.feature || '').slice(0, 100),
      scopes: scopes.map(scope => String(scope || '').trim()).filter(Boolean),
      expiresAt: meta.exp ? new Date(Number(meta.exp) * 1000).toISOString() : (stored.expiresAt || ''),
    };
  } catch {
    return { plan: 'SplashLens paid access', planKey: '', feature: '', scopes: [], expiresAt: '' };
  }
}

function captureScanEntitlementFromUrl() {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('scan_token') || '';
    if (!token.startsWith('sl_scan_v1.')) return;
    const meta = getScanEntitlementMetaFromToken(token);
    localStorage.setItem(SCAN_ENTITLEMENT_TOKEN_KEY, token);
    if (meta) localStorage.setItem(SCAN_ENTITLEMENT_META_KEY, JSON.stringify(meta));
    localStorage.setItem(SCAN_PRO_KEY, '1');
    url.searchParams.delete('scan_token');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
    trackSplashLensEvent('paid_entitlement_activated', {
      plan: meta?.plan || 'SplashLens paid access',
      plan_key: meta?.planKey || '',
      feature: meta?.feature || '',
      scopes: (meta?.scopes || []).join(','),
    });
  } catch {}
}

function getScanEntitlementMetaFromToken(token) {
  const payload = decodeScanEntitlementToken(token);
  if (!payload) return null;
  const scopes = Array.isArray(payload.scopes) ? payload.scopes : String(payload.scopes || '').split(',');
  return {
    plan: String(payload.plan || 'SplashLens paid access').slice(0, 100),
    planKey: String(payload.planKey || '').slice(0, 100),
    feature: String(payload.feature || '').slice(0, 100),
    scopes: scopes.map(scope => String(scope || '').trim()).filter(Boolean),
    expiresAt: payload.exp ? new Date(Number(payload.exp) * 1000).toISOString() : '',
  };
}

function getStoreShellMode() {
  try {
    const params = new URLSearchParams(window.location.search);
    const requested = (params.get('store') || '').toLowerCase();
    if (['ios', 'android', 'native'].includes(requested)) {
      localStorage.setItem(STORE_SHELL_KEY, requested);
      return requested;
    }
    if (requested === '0' || requested === 'web') {
      localStorage.removeItem(STORE_SHELL_KEY);
      return '';
    }
  } catch {}
  return localStorage.getItem(STORE_SHELL_KEY) || '';
}

function isStoreShellMode() {
  return !!getStoreShellMode();
}

function nativePlanProductId(plan) {
  return plan === 'annual' || plan === 'yearly' ? 'partsnap_pro_annual' : 'partsnap_pro_monthly';
}

function requestNativePartSnapPurchase(plan = 'monthly') {
  const store = getStoreShellMode();
  const productId = nativePlanProductId(plan);
  trackSplashLensEvent('native_purchase_click', { store, plan, product_id: productId });

  try {
    if (window.webkit?.messageHandlers?.splashlensNativeBilling) {
      window.webkit.messageHandlers.splashlensNativeBilling.postMessage({ action: 'purchase', plan, productId });
      return;
    }
  } catch {}

  if (store === 'android') {
    window.location.href = `intent://billing?plan=${encodeURIComponent(plan)}&productId=${encodeURIComponent(productId)}#Intent;scheme=splashlens;package=com.splashlens.fieldtools;end`;
    return;
  }

  const result = document.getElementById('scan-result');
  if (result) {
    result.innerHTML = `<div style="background:#1e293b;border:1px solid #334155;border-radius:14px;padding:18px;text-align:center;border-left:4px solid #0284c7;">
      <p style="color:#f1f5f9;font-size:16px;font-weight:900;margin-bottom:6px;">Native billing is not available in this build yet.</p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.5;">Update SplashLens from the store when the Splash Lens Pro Unlimited native billing build is approved. Manual tools remain free.</p>
      <button onclick="setScanMode('lookup');document.getElementById('scan-result').innerHTML=''" style="margin-top:12px;background:#0284c7;color:#fff;border:0;border-radius:10px;padding:11px 14px;font-size:12px;font-weight:800;cursor:pointer;width:100%;">Use Manual Lookup</button>
    </div>`;
  }
}

function requestNativePartSnapRestore() {
  const store = getStoreShellMode();
  trackSplashLensEvent('native_restore_click', { store });

  try {
    if (window.webkit?.messageHandlers?.splashlensNativeBilling) {
      window.webkit.messageHandlers.splashlensNativeBilling.postMessage({ action: 'restore' });
      return;
    }
  } catch {}

  if (store === 'android') {
    window.location.href = 'intent://billing?action=restore#Intent;scheme=splashlens;package=com.splashlens.fieldtools;end';
    return;
  }

  restorePaidScanEntitlement();
}

function cleanAttributionValue(value, max = 160) {
  return String(value || '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
    .slice(0, max);
}

function normalizeAttributionSource(value) {
  const source = cleanAttributionValue(value, 80).toLowerCase();
  if (!source) return '';
  if (source.includes('poolpro') || source.includes('poolpro mag') || source.includes('poolpromag')) return 'poolpro';
  return source.replace(/[^a-z0-9._-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
}

function getReferrerHost() {
  try {
    if (!document.referrer) return '';
    return new URL(document.referrer).hostname.replace(/^www\./i, '').toLowerCase();
  } catch {
    return '';
  }
}

function readAttribution(storage) {
  try {
    const raw = storage.getItem(storage === sessionStorage ? ATTRIBUTION_SESSION_KEY : ATTRIBUTION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeAttribution(storage, attribution) {
  try {
    storage.setItem(storage === sessionStorage ? ATTRIBUTION_SESSION_KEY : ATTRIBUTION_KEY, JSON.stringify(attribution));
  } catch {}
}

function attributionFromCurrentPage() {
  try {
    const url = new URL(window.location.href);
    const params = url.searchParams;
    const referrerHost = getReferrerHost();
    const explicitSource = params.get('utm_source') || params.get('source') || params.get('ref') || params.get('referrer');
    let source = normalizeAttributionSource(explicitSource);
    if (!source && referrerHost.endsWith('poolpromag.com')) source = 'poolpro';
    if (!source && referrerHost) source = normalizeAttributionSource(referrerHost);
    const campaign = cleanAttributionValue(params.get('utm_campaign') || params.get('campaign') || (source === 'poolpro' ? 'poolpro_launch_article' : ''), 120);
    const medium = cleanAttributionValue(params.get('utm_medium') || (referrerHost ? 'referral' : ''), 80);
    if (!source && !campaign && !medium && !referrerHost) return null;
    const now = new Date().toISOString();
    return {
      source: source || 'direct',
      medium,
      campaign,
      referrer: cleanAttributionValue(document.referrer, 300),
      referrer_host: cleanAttributionValue(referrerHost, 120),
      landing_path: cleanAttributionValue(`${window.location.pathname}${window.location.search}`, 300),
      article: source === 'poolpro' ? 'poolpro_splashlens_launches_free_field_reference_app' : '',
      first_seen: now,
      last_seen: now,
    };
  } catch {
    return null;
  }
}

function initSplashLensAttribution() {
  const incoming = attributionFromCurrentPage();
  const stored = readAttribution(localStorage);
  let attribution = stored || incoming || null;

  if (incoming) {
    const shouldReplace =
      !stored ||
      incoming.source === 'poolpro' ||
      (incoming.source && incoming.source !== 'direct' && stored.source === 'direct') ||
      incoming.campaign;
    attribution = shouldReplace
      ? { ...stored, ...incoming, first_seen: stored?.first_seen || incoming.first_seen, last_seen: incoming.last_seen }
      : { ...stored, last_seen: incoming.last_seen };
  }

  if (attribution) {
    writeAttribution(localStorage, attribution);
    writeAttribution(sessionStorage, attribution);
  }
  return attribution || {};
}

function getSplashLensAttribution() {
  return readAttribution(sessionStorage) || readAttribution(localStorage) || initSplashLensAttribution() || {};
}

function normalizeIdentityEmail(value) {
  const email = cleanAttributionValue(value, 180).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function readIdentityProfile(storage) {
  try {
    const raw = storage.getItem(storage === sessionStorage ? IDENTITY_SESSION_KEY : IDENTITY_PROFILE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeIdentityProfile(storage, profile) {
  try {
    storage.setItem(storage === sessionStorage ? IDENTITY_SESSION_KEY : IDENTITY_PROFILE_KEY, JSON.stringify(profile));
  } catch {}
}

function hasIdentitySignal(profile = {}) {
  return Boolean(
    profile.known_email ||
    profile.known_name ||
    profile.known_company ||
    profile.known_role ||
    profile.lead_id ||
    profile.pilot_id ||
    profile.participant_id
  );
}

function identityFromCurrentPage() {
  try {
    const params = new URL(window.location.href).searchParams;
    const email = normalizeIdentityEmail(params.get('contact_email') || params.get('email') || params.get('e') || params.get('sl_email'));
    const firstName = cleanAttributionValue(params.get('first_name') || '', 80);
    const lastName = cleanAttributionValue(params.get('last_name') || '', 80);
    const name = cleanAttributionValue(params.get('contact_name') || params.get('name') || [firstName, lastName].filter(Boolean).join(' '), 140);
    const company = cleanAttributionValue(params.get('company') || params.get('organization') || params.get('org') || params.get('account') || '', 160);
    const role = cleanAttributionValue(params.get('role') || params.get('audience') || params.get('persona') || '', 80);
    const leadId = cleanAttributionValue(params.get('lead_id') || params.get('contact_id') || params.get('recipient_id') || params.get('prospect_id') || '', 120);
    const pilotId = cleanAttributionValue(params.get('pilot_id') || params.get('pilot') || '', 80);
    const participantId = cleanAttributionValue(params.get('participant_id') || params.get('participant') || '', 80);
    if (!email && !name && !company && !role && !leadId && !pilotId && !participantId) return null;
    return {
      known_email: email,
      known_name: name,
      known_company: company,
      known_role: role,
      lead_id: leadId,
      pilot_id: pilotId,
      participant_id: participantId,
      identity_source: cleanAttributionValue(params.get('identity_source') || params.get('utm_source') || 'tracked_link', 80),
      identity_confidence: email ? 'provided-email' : leadId || participantId ? 'tracked-link' : 'self-described',
      identity_captured_at: new Date().toISOString(),
      identity_last_seen: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

function mergeSplashLensIdentityProfile(incoming, source = 'app') {
  const stored = readIdentityProfile(localStorage) || {};
  const incomingFields = Object.fromEntries(Object.entries(incoming || {}).filter(([, value]) => value !== undefined && value !== null && String(value).trim() !== ''));
  if (!hasIdentitySignal(stored) && !hasIdentitySignal(incomingFields)) return {};
  const now = new Date().toISOString();
  const profile = {
    ...stored,
    ...incomingFields,
    identity_source: cleanAttributionValue((incoming || {}).identity_source || stored.identity_source || source, 80),
    identity_confidence: cleanAttributionValue((incoming || {}).identity_confidence || stored.identity_confidence || 'self-described', 40),
    identity_captured_at: stored.identity_captured_at || (incoming || {}).identity_captured_at || now,
    identity_last_seen: now,
  };
  if (!hasIdentitySignal(profile)) return {};
  writeIdentityProfile(localStorage, profile);
  writeIdentityProfile(sessionStorage, profile);
  return profile;
}

function rememberSplashLensIdentity(fields = {}, source = 'app') {
  const incoming = {
    known_email: normalizeIdentityEmail(fields.known_email || fields.email || fields.customer_email || fields.subject || ''),
    known_name: cleanAttributionValue(fields.known_name || fields.name || fields.contact_name || '', 140),
    known_company: cleanAttributionValue(fields.known_company || fields.company || fields.organization || fields.org || '', 160),
    known_role: cleanAttributionValue(fields.known_role || fields.role || fields.audience || '', 80),
    lead_id: cleanAttributionValue(fields.lead_id || fields.contact_id || fields.recipient_id || fields.prospect_id || '', 120),
    pilot_id: cleanAttributionValue(fields.pilot_id || fields.pilot || '', 80),
    participant_id: cleanAttributionValue(fields.participant_id || fields.participant || '', 80),
    identity_source: source,
    identity_confidence: normalizeIdentityEmail(fields.known_email || fields.email || fields.customer_email || fields.subject || '') ? 'provided-email' : 'self-described',
  };
  return mergeSplashLensIdentityProfile(incoming, source);
}

function getSplashLensIdentityProfile() {
  return readIdentityProfile(sessionStorage) || readIdentityProfile(localStorage) || mergeSplashLensIdentityProfile(identityFromCurrentPage(), 'tracked_link') || {};
}

function getFieldChallengeContext() {
  try {
    const params = new URL(window.location.href).searchParams;
    const incoming = cleanAttributionValue(params.get('challenge') || '', 80);
    const stored = JSON.parse(sessionStorage.getItem(FIELD_CHALLENGE_CONTEXT_KEY) || localStorage.getItem(FIELD_CHALLENGE_CONTEXT_KEY) || 'null');
    const storedAt = Date.parse(stored?.captured_at || '');
    const currentStored = Number.isFinite(storedAt) && Date.now() - storedAt <= 14 * 86400000 ? stored : null;
    if (!incoming && !currentStored) return {};
    const context = incoming ? {
      field_challenge: incoming,
      challenge_path: cleanAttributionValue(params.get('challenge_path') || '', 40),
      challenge_id: cleanAttributionValue(params.get('challenge_id') || '', 100),
      challenge_type: cleanAttributionValue(params.get('challenge_type') || '', 40),
      pilot_id: cleanAttributionValue(params.get('pilot_id') || params.get('pilot') || '', 80),
      participant_id: cleanAttributionValue(params.get('participant_id') || params.get('participant') || '', 80),
      referral_id: cleanAttributionValue(params.get('ref') || params.get('referral_id') || '', 80),
      captured_at: new Date().toISOString(),
    } : currentStored;
    sessionStorage.setItem(FIELD_CHALLENGE_CONTEXT_KEY, JSON.stringify(context));
    localStorage.setItem(FIELD_CHALLENGE_CONTEXT_KEY, JSON.stringify(context));
    return context;
  } catch {
    return {};
  }
}

function claimFieldChallenge(key) {
  try {
    if (sessionStorage.getItem(key) === '1') return false;
    sessionStorage.setItem(key, '1');
    return true;
  } catch {
    return true;
  }
}

function trackFieldChallengeOpen() {
  const context = getFieldChallengeContext();
  if (!context.field_challenge || !claimFieldChallenge(FIELD_CHALLENGE_STARTED_KEY)) return;
  trackSplashLensEvent('field_challenge_started', context);
  trackSplashLensEvent('field_challenge_routed', {
    ...context,
    route: context.challenge_path || 'app_choice',
  });
}

function shareFieldResult(audience = 'tech') {
  const attribution = getSplashLensAttribution();
  const referralId = `sl-${Date.now().toString(36)}-${getScanClientId().slice(0, 6)}`;
  const url = new URL(window.location.origin + window.location.pathname);
  url.searchParams.set('utm_source', 'field_referral');
  url.searchParams.set('utm_medium', 'share');
  url.searchParams.set('utm_campaign', 'saved_me_time');
  url.searchParams.set('ref', referralId);
  const labels = { tech: 'another pool tech', senior: 'a senior tech', counter: 'a parts counter' };
  const text = `SplashLens helped me get through a pool-service workflow. Try one real code or part: ${url.toString()}`;
  trackSplashLensEvent('referral_share', {
    audience,
    referral_id: referralId,
    attribution_source: attribution.source || 'app',
  });
  if (navigator.share) {
    navigator.share({ title: 'Try SplashLens in the field', text, url: url.toString() }).catch(() => {});
  } else {
    navigator.clipboard?.writeText(text).then(() => alert(`Link copied for ${labels[audience] || 'another tech'}.`)).catch(() => prompt('Copy this SplashLens link:', url.toString()));
  }
  document.getElementById('field-referral-prompt')?.remove();
}

function showFieldReferralPrompt(trigger) {
  if (document.getElementById('field-referral-prompt')) return;
  try {
    const lastShown = Number(localStorage.getItem(FIELD_REFERRAL_PROMPT_KEY) || 0);
    if (lastShown && Date.now() - lastShown < 7 * 86400000) return;
    localStorage.setItem(FIELD_REFERRAL_PROMPT_KEY, String(Date.now()));
  } catch {}
  const wrap = document.createElement('div');
  wrap.id = 'field-referral-prompt';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', 'Share a useful SplashLens result');
  wrap.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:9997;display:flex;justify-content:center;pointer-events:none;';
  wrap.innerHTML = `
    <div style="width:min(560px,100%);background:#0f172a;border:1px solid #334155;border-radius:12px;box-shadow:0 18px 46px rgba(15,23,42,.28);padding:13px;pointer-events:auto;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;">
        <div><strong style="display:block;color:#fff;font-size:15px;">Useful result?</strong><span style="display:block;color:#cbd5e1;font-size:12px;line-height:1.4;margin-top:3px;">Send the same starting point without retyping it.</span></div>
        <button type="button" onclick="document.getElementById('field-referral-prompt')?.remove()" aria-label="Close" style="border:0;background:transparent;color:#cbd5e1;font-size:20px;cursor:pointer;">x</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin-top:10px;">
        <button type="button" onclick="shareFieldResult('tech')" style="border:0;border-radius:8px;background:#0284c7;color:#fff;padding:10px 6px;font-size:11px;font-weight:900;cursor:pointer;">Another tech</button>
        <button type="button" onclick="shareFieldResult('senior')" style="border:1px solid #475569;border-radius:8px;background:#1e293b;color:#fff;padding:10px 6px;font-size:11px;font-weight:900;cursor:pointer;">Senior tech</button>
        <button type="button" onclick="shareFieldResult('counter')" style="border:1px solid #475569;border-radius:8px;background:#1e293b;color:#fff;padding:10px 6px;font-size:11px;font-weight:900;cursor:pointer;">Parts counter</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  trackSplashLensEvent('referral_prompt_shown', { trigger });
}

function shouldShowValueIdentityPrompt() {
  if (hasIdentitySignal(getSplashLensIdentityProfile())) return false;
  if (document.getElementById('field-identity-prompt') || document.getElementById('field-feedback-overlay')) return false;
  try {
    const lastShown = Number(localStorage.getItem(FIELD_IDENTITY_PROMPT_KEY) || 0);
    if (lastShown && Date.now() - lastShown < 14 * 86400000) return false;
  } catch {}
  return true;
}

function showValueIdentityPrompt(trigger = 'value_completed') {
  if (!shouldShowValueIdentityPrompt()) return;
  try { localStorage.setItem(FIELD_IDENTITY_PROMPT_KEY, String(Date.now())); } catch {}
  const role = getSplashLensRole();
  const wrap = document.createElement('div');
  wrap.id = 'field-identity-prompt';
  wrap.setAttribute('role', 'dialog');
  wrap.setAttribute('aria-label', 'Tag this SplashLens field test');
  wrap.style.cssText = 'position:fixed;left:12px;right:12px;bottom:14px;z-index:9997;display:flex;justify-content:center;pointer-events:none;';
  wrap.innerHTML = `
    <div style="width:min(560px,100%);background:#ffffff;border:1px solid #bae6fd;border-radius:14px;box-shadow:0 18px 46px rgba(15,23,42,.24);padding:14px;pointer-events:auto;">
      <div style="display:flex;justify-content:space-between;gap:10px;align-items:start;margin-bottom:10px;">
        <div>
          <strong style="display:block;color:#0f172a;font-size:15px;line-height:1.2;">Want Joshua to see this field test worked?</strong>
          <span style="display:block;color:#64748b;font-size:12px;line-height:1.4;margin-top:3px;">Tag this session with a company or email. Free use still stays free.</span>
        </div>
        <button type="button" onclick="dismissValueIdentityPrompt('${escAttr(trigger)}')" aria-label="Close" style="border:0;background:transparent;color:#64748b;font-size:20px;font-weight:900;cursor:pointer;">x</button>
      </div>
      <div style="display:grid;grid-template-columns:1.2fr 1fr .9fr;gap:8px;">
        <input id="field-identity-email" type="email" inputmode="email" placeholder="email" style="min-width:0;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:13px;">
        <input id="field-identity-company" type="text" placeholder="company" style="min-width:0;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:13px;">
        <select id="field-identity-role" style="min-width:0;border:1px solid #cbd5e1;border-radius:10px;padding:10px;font-size:13px;background:#fff;">
          ${SPLASHLENS_ROLES.map(item => `<option value="${escAttr(item)}" ${item === role ? 'selected' : ''}>${item}</option>`).join('')}
        </select>
      </div>
      <div id="field-identity-error" style="display:none;background:#fef2f2;border:1px solid #fecaca;color:#991b1b;border-radius:8px;padding:7px;font-size:12px;font-weight:800;margin-top:8px;"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:9px;">
        <button type="button" onclick="submitValueIdentityPrompt('${escAttr(trigger)}')" style="background:#0369a1;color:#fff;border:0;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:950;cursor:pointer;">Tag This Test</button>
        <button type="button" onclick="dismissValueIdentityPrompt('${escAttr(trigger)}')" style="background:#f8fafc;color:#334155;border:1px solid #cbd5e1;border-radius:10px;padding:11px 8px;font-size:13px;font-weight:900;cursor:pointer;">Keep Anonymous</button>
      </div>
    </div>`;
  document.body.appendChild(wrap);
  trackSplashLensEvent('identity_prompt_shown', { trigger, prompt: 'post_value_field_test' });
}

function dismissValueIdentityPrompt(trigger = 'value_completed') {
  document.getElementById('field-identity-prompt')?.remove();
  trackSplashLensEvent('identity_prompt_dismissed', { trigger, prompt: 'post_value_field_test' });
}

function submitValueIdentityPrompt(trigger = 'value_completed') {
  const email = (document.getElementById('field-identity-email')?.value || '').trim();
  const company = (document.getElementById('field-identity-company')?.value || '').trim();
  const role = (document.getElementById('field-identity-role')?.value || '').trim();
  const error = document.getElementById('field-identity-error');
  if (!email && !company) {
    if (error) {
      error.textContent = 'Add an email or company so the field test is identifiable.';
      error.style.display = 'block';
    }
    return;
  }
  if (!validOptionalEmail(email)) {
    if (error) {
      error.textContent = 'Use a valid email or leave email blank and enter a company.';
      error.style.display = 'block';
    }
    return;
  }
  rememberSplashLensIdentity({ email, company, role }, 'post_value_prompt');
  trackSplashLensEvent('identity_captured_after_value', {
    trigger,
    prompt: 'post_value_field_test',
    has_email: Boolean(email),
    has_company: Boolean(company),
    captured_role: role,
  });
  document.getElementById('field-identity-prompt')?.remove();
}

function claimActivationCompletion(activationType) {
  const value = JSON.stringify({ activation_type: activationType, completed_at: new Date().toISOString() });
  try {
    if (localStorage.getItem(ACTIVATION_COMPLETED_KEY)) return false;
    localStorage.setItem(ACTIVATION_COMPLETED_KEY, value);
    return true;
  } catch {
    try {
      if (sessionStorage.getItem(ACTIVATION_COMPLETED_KEY)) return false;
      sessionStorage.setItem(ACTIVATION_COMPLETED_KEY, value);
      return true;
    } catch {
      return false;
    }
  }
}

function maybeTrackActivationCompleted(eventName, props = {}) {
  const activationType = ACTIVATION_EVENT_TYPES.get(eventName);
  if (!activationType) return;
  const attribution = getSplashLensAttribution();
  const firstActivation = claimActivationCompletion(activationType);
  if (firstActivation) {
    trackSplashLensEvent('activation_completed', {
      activation_type: activationType,
      activation_trigger: eventName,
      activation_source: attribution.source || props.attribution_source || props.source || 'direct',
      activation_medium: attribution.medium || props.attribution_medium || '',
      activation_campaign: attribution.campaign || props.attribution_campaign || '',
      activation_referrer_host: attribution.referrer_host || props.attribution_referrer_host || '',
    });
  }
  const challenge = getFieldChallengeContext();
  const challengeCompleted = challenge.field_challenge && claimFieldChallenge(FIELD_CHALLENGE_COMPLETED_KEY);
  if (challengeCompleted) {
    trackSplashLensEvent('field_challenge_completed', {
      ...challenge,
      activation_type: activationType,
      activation_trigger: eventName,
    });
  }
  if (firstActivation || challengeCompleted) {
    setTimeout(() => showValueIdentityPrompt(eventName), 1200);
    setTimeout(() => showFieldReferralPrompt(eventName), 6200);
  }
}

function trackReferralLandingOpen() {
  const attribution = getSplashLensAttribution();
  const source = normalizeAttributionSource(attribution.source);
  if (!source || source === 'direct') return;
  const key = `splashlens-referral-open-${source}`;
  try {
    if (sessionStorage.getItem(key) === '1') return;
    sessionStorage.setItem(key, '1');
  } catch {}
  trackSplashLensEvent('article_referral_open', {
    referral_source: source,
    referral_campaign: attribution.campaign || '',
    referral_medium: attribution.medium || '',
    referral_host: attribution.referrer_host || '',
    article: attribution.article || '',
  });
}

function canUseAIScan() {
  return isPartSnapPro() || (Boolean(getFieldSaveAccount()) && getScanUsage().count < SCAN_LIMIT_FREE);
}

function syncScanUsageFromServer(serverUsage) {
  if (!serverUsage || serverUsage.source !== 'free_metered') return;
  const count = Number(serverUsage.count);
  if (!Number.isFinite(count)) return;
  saveScanUsage({ month: currentScanMonth(), count: Math.max(0, Math.min(count, SCAN_LIMIT_FREE)) });
}

function recordAIScan(mode, serverUsage = null) {
  if (serverUsage && serverUsage.source === 'free_metered') {
    syncScanUsageFromServer(serverUsage);
  } else if (!isPartSnapPro()) {
    const usage = getScanUsage();
    usage.count += 1;
    saveScanUsage(usage);
  }
  trackSplashLensEvent('ai_scan_started', { mode });
  updateAIStatusBar();
}

function unlockPartSnapProLocal() {
  const entitlement = getScanEntitlementMeta();
  const plan = entitlement.plan || 'SplashLens paid access';
  if (!getScanEntitlementToken()) localStorage.setItem(SCAN_PRO_KEY, '1');
  updateAIStatusBar();
  const result = document.getElementById('scan-result');
  if (result) {
    result.innerHTML = `<div style="background:#052e16;border:1px solid #16a34a;border-radius:12px;padding:18px;text-align:center;">
      <p style="color:#86efac;font-size:15px;font-weight:900;margin-bottom:6px;">${escHtml(plan)} enabled on this device</p>
      <p style="color:#bbf7d0;font-size:12px;line-height:1.5;">Paid SplashLens access is enabled on this device. Signed entitlement links sync access without trusting caller-supplied identity.</p>
    </div>`;
  }
}

async function restorePartSnapPro() {
  const email = prompt('Enter the email used at SplashLens checkout:');
  if (!email) return;
  rememberSplashLensIdentity({ email, role: getSplashLensRole() }, 'restore_entitlement');
  const result = document.getElementById('scan-result');
  try {
    if (result) {
      result.innerHTML = `<div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:16px;text-align:center;">
        <p style="color:#e2e8f0;font-size:14px;font-weight:900;">Checking Splash Lens Pro Unlimited access...</p>
      </div>`;
    }
    const response = await fetch(PARTSNAP_RESTORE_ENDPOINT, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    const payload = await response.json().catch(() => ({}));
    trackSplashLensEvent('partsnap_pro_restore_requested', { ok: response.ok, email_sent: Boolean(payload.emailSent) });
    if (!response.ok) throw new Error(payload.error || 'Restore failed.');
    if (result) {
      result.innerHTML = `<div style="background:#052e16;border:1px solid #16a34a;border-radius:12px;padding:18px;text-align:center;">
        <p style="color:#86efac;font-size:15px;font-weight:900;margin-bottom:6px;">Restore link requested</p>
        <p style="color:#bbf7d0;font-size:12px;line-height:1.5;">${escHtml(payload.message || 'Check the email used at checkout for your activation link.')}</p>
      </div>`;
    }
  } catch (error) {
    if (result) {
      result.innerHTML = `<div style="background:#450a0a;border:1px solid #dc2626;border-radius:12px;padding:18px;text-align:center;">
        <p style="color:#fecaca;font-size:15px;font-weight:900;margin-bottom:6px;">Could not restore yet</p>
        <p style="color:#fee2e2;font-size:12px;line-height:1.5;">${escHtml(error.message || 'Contact hello@splashlens.com for help restoring Splash Lens Pro Unlimited.')}</p>
        <button onclick="setScanMode('parts')" style="margin-top:12px;background:#dc2626;color:#fff;border:0;border-radius:10px;padding:10px 12px;font-size:12px;font-weight:900;cursor:pointer;">Back to PartSnap</button>
      </div>`;
    }
  }
}

function showScanLimitModal(result, status) {
  if (status) status.textContent = 'FREE SCAN LIMIT REACHED';
  const usage = getScanUsage();
  if (isStoreShellMode()) {
    trackSplashLensEvent('store_scan_limit_reached', { count: usage.count, store: getStoreShellMode() });
    if (result) {
      result.innerHTML = `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:14px;padding:18px;margin:0 0 14px;text-align:center;border-left:4px solid #0284c7;">
          <p style="color:#f1f5f9;font-size:19px;font-weight:900;margin-bottom:6px;">You've used ${usage.count} of ${SCAN_LIMIT_FREE} free AI scans this month.</p>
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:14px;">Manual code lookup, dosing, reports, filters, and checklists stay free. Your free profile keeps scanner usage tied to you instead of disposable browser storage. Paid upgrades are not offered inside this native store build.</p>
          <button onclick="setScanMode('lookup');document.getElementById('scan-result').innerHTML=''" style="background:#334155;color:#fff;border:0;border-radius:10px;padding:11px 14px;font-size:12px;font-weight:800;cursor:pointer;width:100%;">Use Manual Lookup</button>
        </div>`;
    }
    return;
  }
  if (result) {
    result.innerHTML = `
      <div style="background:#1e293b;border:1px solid #7c3aed;border-radius:14px;padding:18px;margin:0 0 14px;text-align:center;border-left:4px solid #7c3aed;">
        <p style="color:#f1f5f9;font-size:19px;font-weight:900;margin-bottom:6px;">You've used ${usage.count} of ${SCAN_LIMIT_FREE} free AI scans this month.</p>
        <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:14px;">Manual code lookup, dosing, reports, filters, and checklists stay free. Your free profile keeps scanner usage tied to you. Upgrade Splash Lens Pro Unlimited for unlimited scanner access and saved job memory where paid access is available.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <a href="${PARTSNAP_MONTHLY_LINK}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('upgrade_click',{plan:'monthly'})" style="background:#0284c7;color:#fff;text-decoration:none;border-radius:10px;padding:12px 8px;font-size:13px;font-weight:900;">$29 / mo</a>
          <a href="${PARTSNAP_YEARLY_LINK}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('upgrade_click',{plan:'yearly'})" style="background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;padding:12px 8px;font-size:13px;font-weight:900;">$249 / yr</a>
        </div>
        <button onclick="restorePartSnapPro()" style="width:100%;background:#334155;color:#e2e8f0;border:0;border-radius:10px;padding:10px 8px;font-size:12px;font-weight:900;cursor:pointer;">Restore Pro from checkout email</button>
        <p style="color:#64748b;font-size:10px;line-height:1.4;margin-top:10px;">After web checkout, use the signed activation link. If browser storage is cleared, restore with the checkout email. Store builds remain FreeCore until native billing is added.</p>
      </div>`;
  }
}

function trackSplashLensEvent(name, props = {}) {
  if (isInternalAnalyticsSession(name, props)) return;
  const clientId = getScanClientId();
  const attribution = getSplashLensAttribution();
  const identity = getSplashLensIdentityProfile();
  const sessionKey = 'splashlens-session-id';
  let sessionId = sessionStorage.getItem(sessionKey);
  if (!sessionId) {
    sessionId = `session-${Date.now().toString(36)}-${clientId.slice(0, 8)}`;
    sessionStorage.setItem(sessionKey, sessionId);
  }
  const eventProps = {
    client_id: clientId,
    session_id: sessionId,
    standalone: isStandaloneAppShell(),
    store_shell: getStoreShellMode() || '',
    attribution_source: attribution.source || '',
    attribution_medium: attribution.medium || '',
    attribution_campaign: attribution.campaign || '',
    attribution_referrer: attribution.referrer || '',
    attribution_referrer_host: attribution.referrer_host || '',
    attribution_landing_path: attribution.landing_path || '',
    attribution_article: attribution.article || '',
    known_email: identity.known_email || '',
    known_name: identity.known_name || '',
    known_company: identity.known_company || '',
    known_role: identity.known_role || '',
    lead_id: identity.lead_id || '',
    pilot_id: identity.pilot_id || '',
    participant_id: identity.participant_id || '',
    identity_source: identity.identity_source || '',
    identity_confidence: identity.identity_confidence || '',
    splashlens_role: getSplashLensRole(),
    ...getFieldChallengeContext(),
    ...props,
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...eventProps, ts: new Date().toISOString() });
  if (window.plausible) window.plausible(name, { props: eventProps });
  recordFieldFeedbackSignal(name);
  recordReviewableWin(name);
  maybeTrackActivationCompleted(name, eventProps);
  if (!navigator.onLine) return;

  const payload = JSON.stringify(withLanguageMetadata({
    event: name,
    source: attribution.source || props.source || 'app',
    path: `${window.location.pathname}${window.location.search}`,
    props: withLanguageMetadata(eventProps),
  }));

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(SPLASHLENS_EVENT_ENDPOINT, new Blob([payload], { type: 'application/json' }));
      return;
    }
    fetch(SPLASHLENS_EVENT_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLanguageHeaders() },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {}
}

const PRODUCT_INTELLIGENCE = {
  startedAt: 0,
  activeStartedAt: 0,
  engagedSeconds: 0,
  currentTab: '',
  tabStartedAt: 0,
  ended: false,
};

function accrueProductEngagement() {
  if (!PRODUCT_INTELLIGENCE.activeStartedAt) return;
  const now = Date.now();
  PRODUCT_INTELLIGENCE.engagedSeconds += Math.max(0, Math.round((now - PRODUCT_INTELLIGENCE.activeStartedAt) / 1000));
  PRODUCT_INTELLIGENCE.activeStartedAt = document.visibilityState === 'visible' ? now : 0;
}

function flushProductEngagement(reason) {
  accrueProductEngagement();
  const seconds = PRODUCT_INTELLIGENCE.engagedSeconds;
  if (seconds < 1) return;
  PRODUCT_INTELLIGENCE.engagedSeconds = 0;
  trackSplashLensEvent('session_heartbeat', {
    engaged_delta_seconds: Math.min(seconds, 300),
    active_tab: PRODUCT_INTELLIGENCE.currentTab || S.tab || '',
    reason,
  });
}

function trackProductTabChange(nextTab) {
  if (!PRODUCT_INTELLIGENCE.startedAt) return;
  const now = Date.now();
  const previousTab = PRODUCT_INTELLIGENCE.currentTab || S.tab || '';
  if (previousTab && previousTab !== nextTab && PRODUCT_INTELLIGENCE.tabStartedAt) {
    trackSplashLensEvent('tab_dwell', {
      tab: previousTab,
      dwell_seconds: Math.min(1800, Math.max(0, Math.round((now - PRODUCT_INTELLIGENCE.tabStartedAt) / 1000))),
      next_tab: nextTab,
    });
  }
  if (previousTab !== nextTab) {
    PRODUCT_INTELLIGENCE.currentTab = nextTab;
    PRODUCT_INTELLIGENCE.tabStartedAt = now;
    trackSplashLensEvent('app_tab_view', { tab: nextTab, previous_tab: previousTab });
  }
}

function endProductIntelligenceSession(reason) {
  if (!PRODUCT_INTELLIGENCE.startedAt || PRODUCT_INTELLIGENCE.ended) return;
  flushProductEngagement(reason);
  PRODUCT_INTELLIGENCE.ended = true;
  trackSplashLensEvent('session_ended', {
    session_duration_seconds: Math.min(7200, Math.max(0, Math.round((Date.now() - PRODUCT_INTELLIGENCE.startedAt) / 1000))),
    active_tab: PRODUCT_INTELLIGENCE.currentTab || S.tab || '',
    reason,
  });
}

function initProductIntelligenceTracking() {
  const now = Date.now();
  PRODUCT_INTELLIGENCE.startedAt = now;
  PRODUCT_INTELLIGENCE.activeStartedAt = document.visibilityState === 'visible' ? now : 0;
  PRODUCT_INTELLIGENCE.currentTab = S.tab || 'errors';
  PRODUCT_INTELLIGENCE.tabStartedAt = now;
  initReturnFieldTask();
  trackSplashLensEvent('session_started', { entry_tab: PRODUCT_INTELLIGENCE.currentTab });
  trackSplashLensEvent('app_tab_view', { tab: PRODUCT_INTELLIGENCE.currentTab, previous_tab: '' });
  window.setInterval(() => {
    if (document.visibilityState === 'visible') flushProductEngagement('interval');
  }, SPLASHLENS_HEARTBEAT_INTERVAL_MS);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushProductEngagement('hidden');
    else PRODUCT_INTELLIGENCE.activeStartedAt = Date.now();
  });
  window.addEventListener('pagehide', () => endProductIntelligenceSession('pagehide'), { once: true });
}

function isInternalAnalyticsSession(name, props = {}) {
  if (name !== 'session_heartbeat') return false;
  try {
    const ua = String(navigator.userAgent || '').toLowerCase();
    const href = String(window.location.href || '').toLowerCase();
    const source = String(props.source || new URLSearchParams(window.location.search).get('utm_source') || '').toLowerCase();
    const medium = String(new URLSearchParams(window.location.search).get('utm_medium') || '').toLowerCase();
    return (
      navigator.webdriver === true ||
      ua.includes('headless') ||
      ua.includes('bot') ||
      ua.includes('crawler') ||
      ua.includes('spider') ||
      href.includes('/test/') ||
      href.includes('codex') ||
      href.includes('amplitude-readiness') ||
      href.includes('growth-plan') ||
      href.includes('verify=') ||
      source === 'qa' ||
      source === 'codex' ||
      medium === 'playwright' ||
      props.test === true ||
      props.synthetic === true
    );
  } catch {
    return false;
  }
}

function initReturnFieldTask() {
  const button = document.getElementById('continue-field-task');
  const tab = localStorage.getItem('splashlens-last-field-tab') || '';
  const lastAt = Date.parse(localStorage.getItem('splashlens-last-field-tab-at') || '');
  const allowed = new Set(['errors', 'dosing', 'report', 'guide', 'pools', 'scan', 'volume', 'sand', 'route']);
  if (!button || !allowed.has(tab) || !Number.isFinite(lastAt) || Date.now() - lastAt > 30 * 86400000) return;
  const labels = { errors: 'code lookup', dosing: 'dose math', report: 'service note', guide: 'checklist', pools: 'saved pool', scan: 'PartSnap', volume: 'volume math', sand: 'filter math', route: 'smart pad' };
  button.textContent = `Continue ${labels[tab] || 'last field task'}`;
  button.dataset.tab = tab;
  button.style.display = '';
}

function continueLastFieldTask() {
  const button = document.getElementById('continue-field-task');
  const tab = button?.dataset.tab || 'errors';
  trackSplashLensEvent('return_task_continued', { target_tab: tab });
  enterSplashLensApp(tab, tab === 'scan' ? 'parts' : undefined);
}

function compactPartSnapList(items, limit = 3) {
  return Array.isArray(items)
    ? items.filter(Boolean).map(item => String(item).trim()).filter(Boolean).slice(0, limit)
    : [];
}

function isStandaloneAppShell() {
  return Boolean(
    window.matchMedia?.('(display-mode: standalone)')?.matches ||
    window.navigator.standalone ||
    getStoreShellMode()
  );
}

function trackSplashLensAppOpen() {
  const firstOpenKey = 'splashlens-first-open-tracked';
  const openedBefore = localStorage.getItem(firstOpenKey) === '1';
  if (!openedBefore) {
    localStorage.setItem(firstOpenKey, '1');
    trackSplashLensEvent('first_app_open', { tab: S.tab, first_open: true });
  }
  trackFieldChallengeOpen();
  trackSplashLensEvent('app_open', { tab: S.tab, first_open: !openedBefore });
}

function initInstallTracking() {
  window.addEventListener('beforeinstallprompt', () => {
    trackSplashLensEvent('pwa_install_prompt_seen', { tab: S.tab });
  });
  window.addEventListener('appinstalled', () => {
    localStorage.setItem('splashlens-pwa-installed', '1');
    trackSplashLensEvent('pwa_installed', { tab: S.tab });
  });
  if (isStandaloneAppShell() && localStorage.getItem('splashlens-standalone-open-tracked') !== '1') {
    localStorage.setItem('splashlens-standalone-open-tracked', '1');
    trackSplashLensEvent('pwa_standalone_open', { tab: S.tab });
  }
}

function trackStoreShellOpen() {
  const store = getStoreShellMode();
  if (!store) return;
  const firstStoreOpenKey = `splashlens-store-shell-first-open-${store}`;
  const firstStoreOpen = localStorage.getItem(firstStoreOpenKey) !== '1';
  if (firstStoreOpen) {
    localStorage.setItem(firstStoreOpenKey, '1');
    trackSplashLensEvent('native_shell_first_open', { tab: S.tab, store, first_native_open: true });
  }
  trackSplashLensEvent('native_shell_open', { tab: S.tab, store, first_native_open: firstStoreOpen });
}

async function callAIScan(canvas, mode, result, status) {
  try {
    const base64 = canvas.toDataURL('image/jpeg', 0.85).replace(/^data:image\/jpeg;base64,/, '');
    const headers = { 'Content-Type': 'application/json', ...getLanguageHeaders() };
    const entitlementToken = getScanEntitlementToken();
    if (entitlementToken) headers['X-SplashLens-Entitlement-Token'] = entitlementToken;
    const partSnapRecovery = mode === 'parts_snap' ? getPartSnapRecoveryContext() : null;
    const identity = getSplashLensIdentityProfile();
    const fieldProfile = getFieldSaveAccount() || {};
    const freeProfileToken = fieldProfile.profileToken || localStorage.getItem(FREE_PROFILE_TOKEN_KEY) || '';
    if (freeProfileToken) headers['X-SplashLens-Profile-Token'] = freeProfileToken;
    const knownEmail = identity.known_email || fieldProfile.email || '';
    const knownCompany = identity.known_company || fieldProfile.company || '';
    const knownRole = identity.known_role || fieldProfile.role || getSplashLensRole() || '';
    const res = await fetch('/api/scan', {
      method:  'POST',
      headers,
      body:    JSON.stringify(withLanguageMetadata({
        image: base64,
        mode,
        clientId: getScanClientId(),
        store_shell: getStoreShellMode() || '',
        known_email: knownEmail,
        known_name: identity.known_name || fieldProfile.name || '',
        known_company: knownCompany,
        known_role: knownRole,
        free_profile_email: fieldProfile.email || knownEmail,
        free_profile_token: freeProfileToken,
        free_profile_company: fieldProfile.company || knownCompany,
        free_profile_role: fieldProfile.role || knownRole,
        lead_id: identity.lead_id || '',
        pilot_id: identity.pilot_id || '',
        participant_id: identity.participant_id || '',
        identity_source: identity.identity_source || (fieldProfile.email ? 'free_scan_profile' : ''),
        identity_confidence: identity.identity_confidence || (fieldProfile.email ? 'provided-email' : ''),
        partSnapRecovery,
      })),
    });
    const payload = await res.json().catch(() => ({}));
    if (!res.ok) {
      if (payload.profileRequired) {
        localStorage.removeItem(FREE_PROFILE_TOKEN_KEY);
        const savedProfile = getFieldSaveAccount();
        if (savedProfile?.email) {
          const { profileToken, tokenExpiresAt, profileTokenExpiresAt, verified, verifiedAt, ...retryProfile } = savedProfile;
          localStorage.setItem(FIELD_SAVE_ACCOUNT_KEY, JSON.stringify({
            ...retryProfile,
            serverCaptureStatus: 'verification_required',
            serverCaptureLastTriedAt: new Date().toISOString(),
          }));
        } else {
          localStorage.removeItem(FIELD_SAVE_ACCOUNT_KEY);
        }
        trackSplashLensEvent('scan_profile_required_server', { mode, limit: payload.limit || SCAN_LIMIT_FREE });
        await ensureFreeScanProfile(mode, result, status);
        return;
      }
      if (res.status === 429 && /free scan limit/i.test(payload.error || '')) {
        syncScanUsageFromServer({ source: 'free_metered', count: payload.limit || SCAN_LIMIT_FREE });
        trackSplashLensEvent('scan_limit_reached_server', { mode, limit: payload.limit || SCAN_LIMIT_FREE, upgrade: payload.upgrade || '' });
        showScanLimitModal(result, status);
        return;
      }
      if ([401, 402, 403].includes(res.status) && entitlementToken) {
        localStorage.removeItem(SCAN_ENTITLEMENT_TOKEN_KEY);
        localStorage.removeItem(SCAN_ENTITLEMENT_META_KEY);
        localStorage.removeItem(SCAN_PRO_KEY);
        updateAIStatusBar();
        trackSplashLensEvent('scan_entitlement_rejected', { mode, status: res.status, error: payload.error || '' });
        if (result) {
          result.innerHTML = `<div style="background:#450a0a;border:1px solid #dc2626;border-radius:12px;padding:18px;text-align:center;">
        <p style="color:#fecaca;font-size:16px;font-weight:900;margin-bottom:6px;">Splash Lens Pro Unlimited needs restore</p>
            <p style="color:#fee2e2;font-size:12px;line-height:1.5;margin-bottom:12px;">${escHtml(payload.error || 'Your paid scanner access could not be verified on this device.')}</p>
            <button onclick="restorePartSnapPro()" style="width:100%;background:#dc2626;color:#fff;border:0;border-radius:10px;padding:11px 8px;font-size:12px;font-weight:900;cursor:pointer;">Restore from checkout email</button>
          </div>`;
        }
        if (status) status.textContent = 'SPLASHLENS PRO RESTORE NEEDED';
        return;
      }
      throw new Error(payload.error || `HTTP ${res.status}`);
    }
    const { result: aiResult, usage: serverUsage } = payload;
    recordAIScan(mode, serverUsage);

    if (mode === 'parts_snap') {
      renderPartsSnapResult(aiResult, result, status);
      return;
    }
    if (mode === 'test_strip') {
      renderStripResult(aiResult, result, status);
      return;
    }

    // error_code mode
    const { codes = [], brand, model, context, confidence } = aiResult;
    if (codes.length && confidence !== 'low') {
      if (status) status.textContent = `AI READ - VERIFY: ${codes.join(', ')}`;
      const hits = searchErrorDB(codes[0], null);
      if (result) result.innerHTML = `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px;">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:6px;">
            <span style="background:#7c3aed;color:#fff;padding:2px 10px;border-radius:100px;font-size:10px;font-weight:700;">AI READ - VERIFY</span>
            ${brand ? `<span style="color:#94a3b8;font-size:11px;">${brand}${model ? ' · '+model : ''}</span>` : ''}
          </div>
          <p style="color:#f1f5f9;font-size:18px;font-weight:900;letter-spacing:.08em;margin-bottom:4px;">${codes.join('  ')}</p>
          ${context ? `<p style="color:#7dd3fc;font-size:12px;">${context}</p>` : ''}
          <p style="color:#94a3b8;font-size:11px;line-height:1.45;margin-top:8px;">Reference only. Confirm the code, model, and procedure against the current manufacturer manual before repair or parts ordering.</p>
        </div>
        ${renderScanHits(hits, codes[0])}
        ${!hits.length ? `<div style="text-align:center;padding:16px 0;"><button onclick="showCaptureWithManualEntry(document.getElementById('scan-canvas'),'${codes[0]}',document.getElementById('scan-result'),document.getElementById('scan-camera-status'))" style="background:#334155;color:#94a3b8;border:none;border-radius:8px;padding:10px 20px;font-size:13px;cursor:pointer;">Edit Code Manually</button></div>` : ''}
      `;
    } else {
      // AI not confident — try TextDetector then manual
      if ('TextDetector' in window) {
        canvas.convertToBlob({ type: 'image/jpeg' }).then(blob =>
          createImageBitmap(blob).then(bmp =>
            new TextDetector().detect(bmp).then(texts => {
              const raw   = texts.map(t => t.rawValue).join(' ');
              const found = extractErrorCodes(raw);
              if (found.length) runCodeSearch(found[0], result, status);
              else showCaptureWithManualEntry(canvas, context || raw, result, status);
            }).catch(() => showCaptureWithManualEntry(canvas, context || '', result, status))
          )
        );
      } else {
        showCaptureWithManualEntry(canvas, context || '', result, status);
      }
    }
  } catch (err) {
    // Network error or worker unavailable — fall back to offline path
    if (status) status.textContent = 'AI UNAVAILABLE — USING LOCAL SCAN';
    if ('TextDetector' in window) {
      canvas.convertToBlob({ type: 'image/jpeg' }).then(blob =>
        createImageBitmap(blob).then(bmp =>
          new TextDetector().detect(bmp).then(texts => {
            const raw   = texts.map(t => t.rawValue).join(' ');
            const codes = extractErrorCodes(raw);
            if (codes.length) runCodeSearch(codes[0], result, status);
            else showCaptureWithManualEntry(canvas, raw, result, status);
          }).catch(() => showCaptureWithManualEntry(canvas, '', result, status))
        )
      );
    } else {
      showCaptureWithManualEntry(canvas, '', result, status);
    }
  }
}

function getScanClientId() {
  const key = 'splashlens-scan-client-id';
  let id = localStorage.getItem(key);
  if (!id) {
    if (crypto.randomUUID) {
      id = crypto.randomUUID();
    } else {
      const bytes = new Uint32Array(4);
      crypto.getRandomValues(bytes);
      id = `scan-${Array.from(bytes, n => n.toString(16)).join('')}`;
    }
    localStorage.setItem(key, id);
  }
  return id;
}

const PARTSNAP_RECOVERY_KEY = 'splashlens-partsnap-recovery-loop';

function getPartSnapRecoveryContext() {
  try {
    const value = JSON.parse(localStorage.getItem(PARTSNAP_RECOVERY_KEY) || '{}');
    if (!value || typeof value !== 'object' || !value.active) return null;
    const startedAt = Date.parse(value.startedAt || '');
    if (Number.isFinite(startedAt) && Date.now() - startedAt > 30 * 60 * 1000) {
      localStorage.removeItem(PARTSNAP_RECOVERY_KEY);
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function savePartSnapRecoveryContext(value = {}) {
  const existing = getPartSnapRecoveryContext() || {};
  const next = {
    ...existing,
    ...value,
    active: true,
    startedAt: existing.startedAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    attempts: Math.min(10, Number(existing.attempts || 0) + 1),
  };
  localStorage.setItem(PARTSNAP_RECOVERY_KEY, JSON.stringify(next));
  return next;
}

function clearPartSnapRecoveryContext(reason = 'completed') {
  const existing = getPartSnapRecoveryContext();
  localStorage.removeItem(PARTSNAP_RECOVERY_KEY);
  return existing ? { ...existing, clearedReason: reason, clearedAt: new Date().toISOString() } : null;
}

function knownPartSnapComponent(ai = {}) {
  const component = String(ai.component || '').trim().toLowerCase();
  return Boolean(component && component !== 'unknown' && !component.includes('unknown'));
}

function isPartSnapRecoveryImproved(ai = {}, candidates = [], visibleEvidence = [], missingProof = []) {
  const confidence = String(ai.confidence || '').toLowerCase();
  return knownPartSnapComponent(ai) ||
    candidates.length > 0 ||
    visibleEvidence.length > 0 ||
    ['medium', 'high'].includes(confidence) ||
    missingProof.length <= 1;
}

function renderPartsSnapResult(ai, result, status) {
  if (!result) return;
  _lastPartSnapResult = ai || {};
  const visibleEvidence = Array.isArray(_lastPartSnapResult.visibleEvidence) ? _lastPartSnapResult.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(_lastPartSnapResult.missingProof) ? _lastPartSnapResult.missingProof.filter(Boolean).slice(0, 4) : [];
  const alternates = Array.isArray(_lastPartSnapResult.alternates) ? _lastPartSnapResult.alternates.filter(Boolean).slice(0, 3) : [];
  const corpusCandidates = Array.isArray(_lastPartSnapResult.corpusCandidates) ? _lastPartSnapResult.corpusCandidates.filter(Boolean).slice(0, 4) : [];
  const corpusStatus = _lastPartSnapResult.corpusStatus || {};
  const { manufacturer, category, component, model, partNumber, description, condition, replacementNotes, verificationNotes, searchTerms, confidence } = ai;
  const low = confidence === 'low';
  const notes = verificationNotes || replacementNotes;

  const condColor = { new:'#16a34a', good:'#16a34a', worn:'#d97706', damaged:'#dc2626', unknown:'#64748b' }[condition] || '#64748b';

  const ladder = partConfidenceLadder(confidence, partNumber, manufacturer, model, component);
  const risk = partSnapCallbackRisk(_lastPartSnapResult, ladder, visibleEvidence, missingProof);
  const buyLinks = ladder.allowLinks ? renderPartBuyLinks(searchTerms, partNumber, manufacturer, component) : '';
  const showGuidedRetry = shouldShowPartSnapGuidedRetry(_lastPartSnapResult, corpusCandidates, ladder, risk, visibleEvidence, missingProof);
  const recoveryBefore = getPartSnapRecoveryContext();

  if (status) status.textContent = showGuidedRetry ? 'PART NOT IDENTIFIED - NEEDS TWO PHOTOS' : low ? 'PART NOT IDENTIFIED - TRY CLOSER' : `POSSIBLE MATCH: ${component || 'Unknown part'}`;

  if (status && status.textContent.startsWith('POSSIBLE MATCH:')) {
    status.textContent = status.textContent.replace('POSSIBLE MATCH:', 'POSSIBLE MATCH:');
  }
  trackSplashLensEvent('partsnap_result', {
    confidence: confidence || 'unknown',
    category: category || 'unknown',
    risk: risk.level,
    manufacturer: manufacturer || '',
    component: component || '',
    model: model || '',
    part_number_visible: partNumber || '',
    condition: condition || 'unknown',
    proof_visible_count: visibleEvidence.length,
    proof_missing_count: missingProof.length || (ladder.missing || []).length,
    corpus_status: corpusStatus.label || (corpusCandidates.length ? 'source-backed candidates' : 'ai-only'),
    corpus_candidate_count: corpusCandidates.length,
    corpus_top_source_tier: corpusCandidates[0]?.sourceTier || '',
    corpus_top_match_level: corpusCandidates[0]?.matchLevel || '',
    proof_visible: compactPartSnapList(visibleEvidence),
    proof_missing: compactPartSnapList(missingProof.length ? missingProof : ladder.missing),
    result_summary: [manufacturer, component, model || partNumber].filter(Boolean).join(' / ') || 'Unknown PartSnap result',
  });
  if (showGuidedRetry) {
    const recovery = savePartSnapRecoveryContext({
      lastSummary: [manufacturer, component, model || partNumber].filter(Boolean).join(' / ') || 'Unknown PartSnap result',
      lastMissingProof: compactPartSnapList(missingProof.length ? missingProof : ladder.missing),
      lastRisk: risk.level,
      lastConfidence: confidence || 'unknown',
      lastCorpusStatus: corpusStatus.label || (corpusCandidates.length ? 'source-backed candidates' : 'ai-only'),
    });
    trackSplashLensEvent('partsnap_guided_retry_shown', {
      confidence: confidence || 'unknown',
      risk: risk.level,
      corpus_status: corpusStatus.label || (corpusCandidates.length ? 'source-backed candidates' : 'ai-only'),
      proof_visible_count: visibleEvidence.length,
      proof_missing_count: missingProof.length || (ladder.missing || []).length,
      recovery_attempts: recovery.attempts,
    });
    if (recoveryBefore?.active) {
      trackSplashLensEvent('partsnap_guided_retry_still_missing', {
        recovery_attempts: recovery.attempts,
        proof_missing_count: missingProof.length || (ladder.missing || []).length,
        result_summary: [manufacturer, component, model || partNumber].filter(Boolean).join(' / ') || 'Unknown PartSnap result',
      });
    }
  } else if (recoveryBefore?.active && isPartSnapRecoveryImproved(_lastPartSnapResult, corpusCandidates, visibleEvidence, missingProof)) {
    const recovery = clearPartSnapRecoveryContext('improved_result');
    trackSplashLensEvent('partsnap_guided_retry_completed', {
      recovery_attempts: recovery?.attempts || 1,
      confidence: confidence || 'unknown',
      risk: risk.level,
      corpus_status: corpusStatus.label || (corpusCandidates.length ? 'source-backed candidates' : 'ai-only'),
      corpus_candidate_count: corpusCandidates.length,
      proof_visible_count: visibleEvidence.length,
      proof_missing_count: missingProof.length || (ladder.missing || []).length,
      result_summary: [manufacturer, component, model || partNumber].filter(Boolean).join(' / ') || 'Unknown PartSnap result',
    });
  }
  trackSplashLensEvent('first_value_completed', {
    role: getSplashLensRole(),
    workflow: 'partsnap_result',
    confidence: confidence || 'unknown',
    risk: risk.level,
    proof_visible_count: visibleEvidence.length,
    proof_missing_count: missingProof.length || (ladder.missing || []).length,
    time_back_message: 'Part path, missing proof, and packet actions are visible.',
  });

  result.innerHTML = `
    <div style="background:#1e293b;border:1px solid ${low?'#334155':'#14b8a6'};border-radius:12px;padding:16px;margin-bottom:10px;border-left:4px solid ${low?'#334155':'#14b8a6'};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;flex-wrap:wrap;">
        <span style="background:#0f766e;color:#fff;padding:2px 10px;border-radius:100px;font-size:10px;font-weight:900;letter-spacing:.04em;">PARTSNAP SERVICE</span>
        ${manufacturer ? `<span style="color:#94a3b8;font-size:11px;">${manufacturer}</span>` : ''}
        ${category ? `<span style="color:#64748b;font-size:11px;text-transform:uppercase;">${category}</span>` : ''}
        <span style="background:${risk.color};color:#fff;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:900;">${risk.label}</span>
        <span style="margin-left:auto;background:${condColor};color:#fff;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;">${(condition||'unknown').toUpperCase()}</span>
      </div>
      <p style="color:#f1f5f9;font-size:18px;font-weight:800;margin-bottom:4px;">${component || 'Unknown Part'}</p>
      ${model ? `<p style="color:#7dd3fc;font-size:12px;margin-bottom:6px;">${model}</p>` : ''}
      ${description ? `<p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:10px;">${description}</p>` : ''}
      ${partNumber ? `
        <div style="background:#0f172a;border-radius:8px;padding:10px 12px;margin-bottom:10px;">
          <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px;">POSSIBLE OEM / MODEL NUMBER</p>
          <p style="color:#fbbf24;font-size:16px;font-weight:800;letter-spacing:.05em;">${partNumber}</p>
        </div>
      ` : ''}
      ${replacementNotes ? `<p style="color:#fbbf24;font-size:12px;font-weight:600;margin-bottom:10px;">⚠ ${replacementNotes}</p>` : ''}
      ${verificationNotes ? `<p style="color:#fbbf24;font-size:12px;font-weight:600;margin-bottom:10px;">Check: ${verificationNotes}</p>` : ''}
      ${showGuidedRetry ? renderPartSnapGuidedRetry(_lastPartSnapResult, ladder, risk, missingProof) : ''}
      ${renderPartSnapFastWorkflow(_lastPartSnapResult, corpusCandidates, ladder, missingProof)}
      ${renderPartSnapFeedbackTrap(_lastPartSnapResult, corpusCandidates, ladder, missingProof, risk)}
      ${renderPartSnapPrimaryAction(risk, missingProof.length ? missingProof : ladder.missing)}
      ${renderPartSnapProofSnapshot(ladder, risk, visibleEvidence, missingProof)}
      ${renderPartConfidenceLadder(ladder)}
      ${renderPartEvidencePanel(visibleEvidence, missingProof)}
      ${renderPartSnapCorpusPanel(corpusCandidates, corpusStatus)}
      ${renderPartSnapCallbackRisk(risk)}
      ${renderPartSnapNextProofNudge(_lastPartSnapResult, ladder, risk, visibleEvidence, missingProof)}
      ${renderPartAlternates(alternates)}
      ${renderPartSnapProofPacketDrawer(_lastPartSnapResult)}
      ${renderPartSnapPartnerCards(_lastPartSnapResult)}
      ${searchTerms?.length ? `
        <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">SEARCH ONLINE</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          ${searchTerms.map(t => `<span style="background:#0f172a;color:#7dd3fc;padding:5px 10px;border-radius:6px;font-size:11px;font-weight:600;">${t}</span>`).join('')}
        </div>
      ` : ''}
      ${buyLinks}
      ${!ladder.allowLinks ? `<div style="margin-top:12px;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px;"><p style="color:#fbbf24;font-size:12px;font-weight:900;margin-bottom:4px;">Hold buying links until proof improves</p><p style="color:#94a3b8;font-size:11px;line-height:1.45;">Need: ${ladder.missing.map(escHtml).join(', ')}.</p></div>` : ''}
      ${ai.escalationSummary ? `<div style="margin-top:12px;background:#020617;border:1px solid #334155;border-radius:10px;padding:11px;"><p style="color:#94a3b8;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Escalation packet</p><p style="color:#e2e8f0;font-size:12px;line-height:1.45;">${escHtml(ai.escalationSummary)}</p></div>` : ''}
      <p style="color:#94a3b8;font-size:11px;line-height:1.45;margin-top:10px;">Reference only. Confirm model, dimensions, and the current manufacturer parts diagram before ordering.</p>
      ${low && !showGuidedRetry ? `<p style="color:#64748b;font-size:12px;margin-top:12px;text-align:center;">Try getting closer, better lighting, or a different angle</p>` : ''}
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px 0 8px;">
      <button onclick="sharePartSnapPacket()" style="background:#0f766e;color:#fff;border:none;border-radius:10px;padding:11px 8px;font-size:12px;font-weight:900;cursor:pointer;">Share Packet</button>
      <button onclick="savePartSnapToPool()" style="background:#0284c7;color:#fff;border:none;border-radius:10px;padding:11px 8px;font-size:12px;font-weight:900;cursor:pointer;">Save Proof</button>
      <button onclick="startPartSnapApprenticeMode()" style="background:#334155;color:#e2e8f0;border:none;border-radius:10px;padding:11px 8px;font-size:12px;font-weight:900;cursor:pointer;">Apprentice Mode</button>
      <button onclick="renderMysteryPartForm()" style="background:#431407;color:#fed7aa;border:1px solid #b45309;border-radius:10px;padding:11px 8px;font-size:12px;font-weight:900;cursor:pointer;">Mystery Lab</button>
      <button onclick="copyPartSnapEscalation()" style="background:#0f172a;color:#7dd3fc;border:1px solid #334155;border-radius:10px;padding:10px 8px;font-size:12px;font-weight:900;cursor:pointer;">Copy Text</button>
      <button onclick="requestPartSnapSecondProof()" style="background:#0f172a;color:#7dd3fc;border:1px solid #334155;border-radius:10px;padding:10px 8px;font-size:12px;font-weight:900;cursor:pointer;">Second Proof Photo</button>
      <button onclick="document.getElementById('scan-result').innerHTML='';renderPartSnapPrimer();setScanMode('parts')" style="grid-column:1 / -1;background:#0f172a;color:#7dd3fc;border:1px solid #334155;border-radius:10px;padding:10px 20px;font-size:13px;cursor:pointer;">Scan Another Part or Label</button>
    </div>
    <div id="partsnap-feedback-panel"></div>
  `;
  window.SplashLensFieldSignals?.onPartSnapResult({
    manufacturer,
    model,
    component,
    category,
    partNumber,
    description,
    missingProof: missingProof.length ? missingProof : ladder.missing,
  });
}

function renderPartSnapFeedbackTrap(ai = {}, candidates = [], ladder = {}, missingProof = [], risk = {}) {
  const corpusStatus = ai.corpusStatus?.label || (candidates.length ? 'source-backed family' : 'AI-only');
  return `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-left:4px solid #0284c7;border-radius:10px;padding:11px;margin:10px 0;">
      <p style="color:#0369a1;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Train SplashLens</p>
      <p style="color:#0f172a;font-size:13px;font-weight:950;line-height:1.25;margin-bottom:4px;">Did this PartSnap result help?</p>
      <p style="color:#64748b;font-size:11px;line-height:1.35;margin-bottom:9px;">One tap tells us whether this should become a stronger source-backed card. Status: ${escHtml(corpusStatus)}.</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;">
        <button onclick="capturePartSnapOutcome('helpful')" style="background:#dcfce7;color:#166534;border:1px solid #86efac;border-radius:9px;padding:10px 5px;font-size:11px;font-weight:950;cursor:pointer;">Helpful</button>
        <button onclick="capturePartSnapOutcome('saved_time')" style="background:#e0f2fe;color:#075985;border:1px solid #7dd3fc;border-radius:9px;padding:10px 5px;font-size:11px;font-weight:950;cursor:pointer;">Saved time</button>
        <button onclick="capturePartSnapOutcome('wrong')" style="background:#fee2e2;color:#991b1b;border:1px solid #fecaca;border-radius:9px;padding:10px 5px;font-size:11px;font-weight:950;cursor:pointer;">Wrong</button>
        <button onclick="capturePartSnapOutcome('missing')" style="background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;border-radius:9px;padding:10px 5px;font-size:11px;font-weight:950;cursor:pointer;">Missing</button>
      </div>
    </div>`;
}

function capturePartSnapOutcome(outcome = 'helpful') {
  const ai = _lastPartSnapResult || {};
  const visibleEvidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(ai.missingProof) ? ai.missingProof.filter(Boolean).slice(0, 4) : [];
  const summary = [ai.manufacturer, ai.component, ai.model || ai.partNumber].filter(Boolean).join(' / ') || 'PartSnap result';
  const needsReview = outcome === 'wrong' || outcome === 'missing';
  const ticketId = `feedback-${Date.now().toString(36)}`;
  trackSplashLensEvent('partsnap_result_feedback', {
    outcome,
    confidence: ai.confidence || 'unknown',
    category: ai.category || ai.component || 'unknown',
    corpus_status: ai.corpusStatus?.label || (Array.isArray(ai.corpusCandidates) && ai.corpusCandidates.length ? 'source-backed candidates' : 'ai-only'),
    proof_visible_count: visibleEvidence.length,
    proof_missing_count: missingProof.length,
    result_summary: summary,
    review_ticket_id: needsReview ? ticketId : '',
  });
  if (needsReview) {
    savePartSnapReviewTicket({
      id: ticketId,
      createdAt: new Date().toLocaleString(),
      status: outcome === 'wrong' ? 'needs correction' : 'missing info',
      summary: `${outcome === 'wrong' ? 'Wrong result' : 'Missing info'} - ${summary}`,
    });
    const panel = document.getElementById('partsnap-feedback-panel');
    if (panel) {
      panel.innerHTML = `
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:10px;padding:12px;margin:4px 0 16px;">
          <p style="color:#9a3412;font-size:13px;font-weight:950;margin-bottom:4px;">Saved to review queue</p>
          <p style="color:#92400e;font-size:11px;line-height:1.4;margin-bottom:9px;">Ticket ${escHtml(ticketId)} is saved on this device. Add what you know so SplashLens can train the next card around the miss.</p>
          <button onclick="renderMysteryPartForm()" style="width:100%;background:#0f766e;color:#fff;border:0;border-radius:9px;padding:10px;font-size:12px;font-weight:950;cursor:pointer;">Add correction details</button>
        </div>`;
    }
    return;
  }
  const panel = document.getElementById('partsnap-feedback-panel');
  if (panel) {
    panel.innerHTML = `
      <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px;margin:4px 0 16px;">
        <p style="color:#065f46;font-size:13px;font-weight:950;margin-bottom:4px;">Got it. That helps tune SplashLens.</p>
        <p style="color:#047857;font-size:11px;line-height:1.4;margin-bottom:9px;">If this saved time, send the same starting point to another tech, senior tech, or parts counter.</p>
        <button onclick="showFieldReferralPrompt('partsnap_result_feedback')" style="width:100%;background:#0369a1;color:#fff;border:0;border-radius:9px;padding:10px;font-size:12px;font-weight:950;cursor:pointer;">Share the useful path</button>
      </div>`;
  }
  showValueIdentityPrompt('partsnap_result_feedback');
}

function shouldShowPartSnapGuidedRetry(ai = {}, candidates = [], ladder = {}, risk = {}, visibleEvidence = [], missingProof = []) {
  const confidence = String(ai.confidence || '').toLowerCase();
  const component = String(ai.component || '').toLowerCase();
  const corpusLabel = String(ai.corpusStatus?.label || '').toLowerCase();
  const missingCount = missingProof.length || (ladder.missing || []).length;
  const unknownPart = !component || component === 'unknown' || component.includes('unknown');
  return unknownPart &&
    candidates.length === 0 &&
    visibleEvidence.length === 0 &&
    missingCount >= 2 &&
    (confidence === 'low' || risk.level === 'high' || corpusLabel.includes('ai-only'));
}

function renderPartSnapGuidedRetry(ai = {}, ladder = {}, risk = {}, missingProof = []) {
  const missing = (missingProof.length ? missingProof : (ladder.missing || [])).filter(Boolean).slice(0, 3);
  const firstNeed = missing[0] || 'clear close-up of the part';
  const secondNeed = missing[1] || 'equipment model plate';
  const thirdNeed = missing[2] || 'wide shot showing where the part lives';
  return `
    <div style="background:#fff7ed;border:2px solid #fb923c;border-radius:12px;padding:13px;margin:10px 0;">
      <p style="color:#9a3412;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Quick retry path</p>
      <p style="color:#0f172a;font-size:15px;font-weight:950;line-height:1.25;margin-bottom:5px;">PartSnap needs two better proof shots before it can help.</p>
      <p style="color:#7c2d12;font-size:12px;line-height:1.4;margin-bottom:10px;">Do not order from this result yet. Grab the fastest proof, then run PartSnap again.</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:8px;margin-bottom:10px;">
        <div style="background:#fff;border:1px solid #fed7aa;border-radius:9px;padding:10px;">
          <b style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#ea580c;color:#fff;font-size:11px;margin-bottom:6px;">1</b>
          <p style="color:#0f172a;font-size:12px;font-weight:950;line-height:1.25;">Close-up</p>
          <p style="color:#92400e;font-size:10px;line-height:1.35;margin-top:4px;">${escHtml(firstNeed)}</p>
        </div>
        <div style="background:#fff;border:1px solid #fed7aa;border-radius:9px;padding:10px;">
          <b style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#d97706;color:#fff;font-size:11px;margin-bottom:6px;">2</b>
          <p style="color:#0f172a;font-size:12px;font-weight:950;line-height:1.25;">Model plate</p>
          <p style="color:#92400e;font-size:10px;line-height:1.35;margin-top:4px;">${escHtml(secondNeed)}</p>
        </div>
        <div style="background:#fff;border:1px solid #fed7aa;border-radius:9px;padding:10px;">
          <b style="display:inline-grid;place-items:center;width:22px;height:22px;border-radius:999px;background:#b45309;color:#fff;font-size:11px;margin-bottom:6px;">3</b>
          <p style="color:#0f172a;font-size:12px;font-weight:950;line-height:1.25;">Context</p>
          <p style="color:#92400e;font-size:10px;line-height:1.35;margin-top:4px;">${escHtml(thirdNeed)}</p>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <button onclick="requestPartSnapSecondProof()" style="background:#ea580c;color:#fff;border:0;border-radius:9px;padding:12px 9px;font-size:12px;font-weight:950;cursor:pointer;">Add proof photo</button>
        <button onclick="document.getElementById('scan-result').innerHTML='';setScanMode('parts')" style="background:#0f172a;color:#fed7aa;border:1px solid #92400e;border-radius:9px;padding:12px 9px;font-size:12px;font-weight:950;cursor:pointer;">Run PartSnap again</button>
      </div>
    </div>`;
}

function renderPartSnapPrimaryAction(risk = {}, missingProof = []) {
  const needsProof = risk.level !== 'low' || missingProof.length > 0;
  return `
    <div style="background:#ecfeff;border:2px solid #0891b2;border-radius:10px;padding:11px;margin:10px 0;">
      <p style="color:#0f172a;font-size:13px;font-weight:950;margin-bottom:4px;">Keep this result with the job</p>
      <p style="color:#475569;font-size:11px;line-height:1.4;margin-bottom:9px;">Save what PartSnap found now. Add the customer or pool when you have time.</p>
      <div style="display:grid;grid-template-columns:${needsProof ? '1fr 1fr' : '1fr'};gap:7px;">
        <button onclick="savePartSnapFieldStop()" style="background:#0369a1;color:#fff;border:0;border-radius:9px;padding:12px 10px;font-size:13px;font-weight:950;cursor:pointer;">Save this stop</button>
        ${needsProof ? '<button onclick="requestPartSnapSecondProof()" style="background:#fff;color:#075985;border:1px solid #0ea5e9;border-radius:9px;padding:12px 10px;font-size:12px;font-weight:950;cursor:pointer;">Add proof photo</button>' : ''}
      </div>
    </div>`;
}

function getPartSnapFieldStops() {
  try {
    const value = JSON.parse(localStorage.getItem('splashlens-partsnap-field-stops') || '[]');
    return Array.isArray(value) ? value : [];
  } catch {
    return [];
  }
}

function savePartSnapFieldStop() {
  if (!ensureFieldSaveAccount('partsnap_field_stop_saved')) return;

  const ai = _lastPartSnapResult || {};
  const visibleEvidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(ai.missingProof) ? ai.missingProof.filter(Boolean).slice(0, 4) : [];
  const ladder = partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component);
  const risk = partSnapCallbackRisk(ai, ladder, visibleEvidence, missingProof);
  const stops = getPartSnapFieldStops();
  const stop = {
    id: `field-stop-${Date.now()}`,
    savedAt: new Date().toISOString(),
    title: [ai.manufacturer, ai.component].filter(Boolean).join(' ') || 'Unidentified field part',
    model: ai.model || ai.partNumber || '',
    confidence: ai.confidence || 'unknown',
    risk: risk.level,
    visibleEvidence,
    missingProof: risk.missing,
    partSnap: ai,
  };
  localStorage.setItem('splashlens-partsnap-field-stops', JSON.stringify([stop, ...stops].slice(0, 25)));
  localStorage.setItem('splashlens-last-field-tab', 'scan');
  localStorage.setItem('splashlens-last-field-tab-at', stop.savedAt);
  trackSplashLensEvent('partsnap_field_stop_saved', {
    confidence: stop.confidence,
    risk: stop.risk,
    category: ai.category || ai.component || 'unknown',
    proof_visible_count: visibleEvidence.length,
    proof_missing_count: risk.missing.length,
  });
  const panel = document.getElementById('partsnap-feedback-panel');
  if (panel) panel.innerHTML = `
    <div style="background:#ecfdf5;border:1px solid #6ee7b7;border-radius:10px;padding:12px;margin:4px 0 16px;">
      <p style="color:#065f46;font-size:13px;font-weight:950;margin-bottom:4px;">Field stop saved on this device</p>
      <p style="color:#047857;font-size:11px;line-height:1.4;margin-bottom:9px;">You can leave the result here, assign it to a saved customer, or share the packet.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <button onclick="savePartSnapToPool()" style="background:#0f766e;color:#fff;border:0;border-radius:8px;padding:10px;font-size:11px;font-weight:900;cursor:pointer;">Assign customer</button>
        <button onclick="sharePartSnapPacket()" style="background:#fff;color:#0f766e;border:1px solid #0f766e;border-radius:8px;padding:10px;font-size:11px;font-weight:900;cursor:pointer;">Share packet</button>
      </div>
    </div>${renderPostValueUpgradeOffer()}`;
  window.SplashLensFieldSignals?.offerSystemNotificationsAfterValue('partsnap_field_stop_saved');
}

function renderPostValueUpgradeOffer() {
  if (isPartSnapPro()) return '';
  const key = 'splashlens-post-value-upgrade-shown-at';
  const lastShownAt = Date.parse(localStorage.getItem(key) || '');
  if (Number.isFinite(lastShownAt) && Date.now() - lastShownAt < 7 * 86400000) return '';
  localStorage.setItem(key, new Date().toISOString());
  trackSplashLensEvent('post_value_upgrade_shown', { feature: 'unlimited_partsnap', placement: 'field_stop_saved' });
  return `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:10px;padding:12px;margin:0 0 16px;">
      <p style="color:#7dd3fc;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.08em;margin-bottom:4px;">Splash Lens Pro Unlimited</p>
      <p style="color:#f8fafc;font-size:13px;font-weight:950;margin-bottom:4px;">Need PartSnap throughout the route?</p>
      <p style="color:#94a3b8;font-size:11px;line-height:1.4;margin-bottom:9px;">A free field profile includes 3 AI scans each month. Pro Unlimited unlocks unlimited scanner access, saved job memory, customer-safe summaries, and boss/counter packets where paid access is available. Code lookup, dosing, notes, and core field tools stay free to start.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;">
        <a href="${PARTSNAP_MONTHLY_LINK}" target="_blank" rel="noopener" onclick="trackPostValueUpgrade('monthly')" style="background:#0284c7;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:10px 7px;font-size:11px;font-weight:950;">$29 monthly</a>
        <a href="${PARTSNAP_YEARLY_LINK}" target="_blank" rel="noopener" onclick="trackPostValueUpgrade('yearly')" style="background:#16a34a;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:10px 7px;font-size:11px;font-weight:950;">$249 yearly</a>
      </div>
    </div>`;
}

function trackPostValueUpgrade(plan) {
  trackSplashLensEvent('post_value_upgrade_clicked', { plan, feature: 'unlimited_partsnap', placement: 'field_stop_saved' });
  trackSplashLensEvent('upgrade_click', { plan, feature: 'unlimited_partsnap', placement: 'field_stop_saved' });
}

function renderPartSnapProofSnapshot(ladder = {}, risk = {}, visibleEvidence = [], missingProof = []) {
  const proofCount = visibleEvidence.length;
  const missingCount = missingProof.length || (ladder.missing || []).length;
  const packetState = missingCount ? 'Needs proof' : 'Packet ready';
  return `
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:7px;margin:10px 0;">
      <div style="background:#ecfeff;border:1px solid #67e8f9;border-radius:8px;padding:9px;">
        <p style="color:#0e7490;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Proof</p>
        <p style="color:#0f172a;font-size:15px;font-weight:950;line-height:1;">${proofCount}</p>
        <p style="color:#475569;font-size:10px;font-weight:800;margin-top:3px;">captured</p>
      </div>
      <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:9px;">
        <p style="color:#92400e;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Missing</p>
        <p style="color:#0f172a;font-size:15px;font-weight:950;line-height:1;">${missingCount}</p>
        <p style="color:#92400e;font-size:10px;font-weight:800;margin-top:3px;">before order</p>
      </div>
      <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:9px;">
        <p style="color:#991b1b;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Risk</p>
        <p style="color:${risk.color || '#d97706'};font-size:15px;font-weight:950;line-height:1;">${escHtml(risk.level || 'hold')}</p>
        <p style="color:#7f1d1d;font-size:10px;font-weight:800;margin-top:3px;">callback flag</p>
      </div>
      <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:9px;">
        <p style="color:#166534;font-size:9px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Packet</p>
        <p style="color:#0f172a;font-size:13px;font-weight:950;line-height:1.05;">${packetState}</p>
        <p style="color:#166534;font-size:10px;font-weight:800;margin-top:3px;">senior/vendor</p>
      </div>
    </div>`;
}

function renderPartSnapFastWorkflow(ai = {}, candidates = [], ladder = {}, missingProof = []) {
  const top = candidates[0] || null;
  const family = top?.component || ai.component || 'part family';
  const proof = (top?.requiredProof || missingProof || ladder.missing || []).filter(Boolean).slice(0, 2);
  const status = top ? 'Source-backed family' : 'AI-only until proof improves';
  const next = proof[0] || 'model plate or visible marking';
  return `
    <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:10px;padding:10px;margin:10px 0;">
      <p style="color:#0f172a;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:7px;">Fast field path</p>
      <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(96px,1fr));gap:7px;">
        <div style="background:#fff;border:1px solid #e2e8f0;border-radius:8px;padding:9px;">
          <b style="display:inline-grid;place-items:center;width:20px;height:20px;border-radius:999px;background:#0f766e;color:#fff;font-size:11px;margin-bottom:6px;">1</b>
          <p style="color:#0f172a;font-size:12px;font-weight:950;line-height:1.2;">${escHtml(status)}</p>
          <p style="color:#64748b;font-size:10px;line-height:1.3;margin-top:4px;">${escHtml(family)}</p>
        </div>
        <div style="background:#fff7ed;border:1px solid #fed7aa;border-radius:8px;padding:9px;">
          <b style="display:inline-grid;place-items:center;width:20px;height:20px;border-radius:999px;background:#d97706;color:#fff;font-size:11px;margin-bottom:6px;">2</b>
          <p style="color:#7c2d12;font-size:12px;font-weight:950;line-height:1.2;">Get proof</p>
          <p style="color:#92400e;font-size:10px;line-height:1.3;margin-top:4px;">${escHtml(next)}</p>
        </div>
        <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:9px;">
          <b style="display:inline-grid;place-items:center;width:20px;height:20px;border-radius:999px;background:#0284c7;color:#fff;font-size:11px;margin-bottom:6px;">3</b>
          <p style="color:#0f172a;font-size:12px;font-weight:950;line-height:1.2;">Escalate clean</p>
          <p style="color:#475569;font-size:10px;line-height:1.3;margin-top:4px;">Save, share, or send vendor packet.</p>
        </div>
      </div>
    </div>`;
}

function renderPartSnapNextProofNudge(ai = {}, ladder = {}, risk = {}, visibleEvidence = [], missingProof = []) {
  const missing = (missingProof.length ? missingProof : (ladder.missing || [])).filter(Boolean).slice(0, 3);
  const shouldNudge = ai.confidence === 'low' || risk.level !== 'low' || missing.length > 0;
  if (!shouldNudge) return '';
  const nextShot = missing[0] || 'model plate or wider equipment-pad context';
  return `
    <div style="background:#082f49;border:1px solid #0284c7;border-radius:10px;padding:12px;margin:10px 0;">
      <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap;">
        <div style="min-width:0;flex:1;">
          <p style="color:#bae6fd;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;">Next best photo</p>
          <p style="color:#f8fafc;font-size:13px;font-weight:900;line-height:1.35;margin-bottom:4px;">Capture ${escHtml(nextShot)} before ordering or escalating.</p>
          <p style="color:#bae6fd;font-size:11px;line-height:1.4;">PartSnap can be more useful with a label, casting number, model plate, wiring/control face, or a wider shot that shows where the part lives.</p>
        </div>
        <button onclick="requestPartSnapSecondProof()" style="background:#38bdf8;color:#082f49;border:0;border-radius:9px;padding:10px 12px;font-size:12px;font-weight:950;cursor:pointer;">Add Proof</button>
      </div>
    </div>`;
}

function renderPartEvidencePanel(visibleEvidence, missingProof) {
  if (!visibleEvidence.length && !missingProof.length) return '';
  const chips = (items, color, bg, border) => items.map((item, i) => `<span style="display:flex;align-items:center;gap:6px;background:${bg};border:1px solid ${border};color:${color};border-radius:999px;padding:7px 9px;font-size:11px;font-weight:900;line-height:1.2;"><b style="display:grid;place-items:center;width:18px;height:18px;border-radius:999px;background:rgba(255,255,255,.16);font-size:10px;">${i + 1}</b>${escHtml(item)}</span>`).join('');
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;">
      <div style="background:#052e2b;border:1px solid #0f766e;border-radius:8px;padding:10px;">
        <p style="color:#5eead4;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Visible proof</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${visibleEvidence.length ? chips(visibleEvidence, '#ccfbf1', '#064e3b', '#0f766e') : '<span style="color:#94a3b8;font-size:11px;">No strong visible proof yet</span>'}</div>
      </div>
      <div style="background:#431407;border:1px solid #b45309;border-radius:8px;padding:10px;">
        <p style="color:#fdba74;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Next proof</p>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">${missingProof.length ? chips(missingProof, '#fed7aa', '#7c2d12', '#b45309') : '<span style="color:#94a3b8;font-size:11px;">No extra proof listed</span>'}</div>
      </div>
    </div>`;
}

function renderPartSnapCorpusPanel(candidates = [], status = {}) {
  const count = candidates.length;
  const label = status.label || (count ? 'source-backed candidates' : 'ai-only');
  if (!count) {
    return `
      <div style="background:#111827;border:1px solid #475569;border-radius:10px;padding:11px;margin:10px 0;">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
          <p style="color:#e2e8f0;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;">AI-only result</p>
          <span style="background:#475569;color:#fff;border-radius:999px;padding:2px 8px;font-size:9px;font-weight:950;">NO CORPUS MATCH</span>
        </div>
        <p style="color:#94a3b8;font-size:11px;line-height:1.45;">${escHtml(status.note || 'No source-backed family matched this scan yet. Capture the model plate, molded number, second angle, or label before ordering.')}</p>
      </div>`;
  }

  const top = candidates[0];
  const compact = (items, color = '#cffafe', bg = '#164e63', border = '#0e7490') => (Array.isArray(items) ? items : [])
    .filter(Boolean)
    .slice(0, 5)
    .map((item) => `<span style="display:inline-flex;align-items:center;background:${bg};border:1px solid ${border};color:${color};border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900;line-height:1.2;">${escHtml(item)}</span>`)
    .join('');
  const sourceLinks = (candidate) => (Array.isArray(candidate.sourceUrls) ? candidate.sourceUrls : [])
    .filter(Boolean)
    .slice(0, 2)
    .map((url, index) => `<a href="${escAttr(url)}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('partsnap_corpus_source_clicked',{candidate_id:'${escAttr(candidate.id)}',source_tier:'${escAttr(candidate.sourceTier)}'})" style="color:#7dd3fc;font-size:10px;font-weight:900;text-decoration:none;">Source ${index + 1}</a>`)
    .join(' ');

  return `
    <div style="background:#042f2e;border:1px solid #14b8a6;border-radius:10px;padding:11px;margin:10px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:7px;flex-wrap:wrap;">
        <p style="color:#ccfbf1;font-size:10px;font-weight:950;text-transform:uppercase;letter-spacing:.06em;">Source-backed candidates</p>
        <span style="background:#0f766e;color:#fff;border-radius:999px;padding:2px 8px;font-size:9px;font-weight:950;">${count} MATCH${count === 1 ? '' : 'ES'} - TIER ${escHtml(top.sourceTier)}</span>
      </div>
      <p style="color:#99f6e4;font-size:11px;line-height:1.45;margin-bottom:9px;">${escHtml(status.note || 'PartSnap compared the AI result to the seed evidence corpus. This narrows the family; it is still not final fitment.')}</p>
      <div style="display:grid;gap:8px;">
        ${candidates.map((candidate, index) => `
          <div style="background:#0f172a;border:1px solid ${index === 0 ? '#2dd4bf' : '#334155'};border-radius:8px;padding:10px;">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px;margin-bottom:6px;">
              <div>
                <p style="color:#f8fafc;font-size:12px;font-weight:950;line-height:1.2;">${escHtml(candidate.component || 'Source-backed family')}</p>
                <p style="color:#94a3b8;font-size:10px;line-height:1.35;margin-top:3px;">${escHtml([candidate.manufacturer, candidate.category, ...(candidate.modelFamilies || []).slice(0, 2)].filter(Boolean).join(' / '))}</p>
              </div>
              <span style="background:${index === 0 ? '#0f766e' : '#334155'};color:#fff;border-radius:999px;padding:2px 7px;font-size:9px;font-weight:950;white-space:nowrap;">${escHtml(candidate.matchLevel || label)}</span>
            </div>
            ${(candidate.sourceLabels || []).length ? `<p style="color:#7dd3fc;font-size:10px;font-weight:900;line-height:1.35;margin-bottom:6px;">${escHtml((candidate.sourceLabels || []).slice(0, 2).join(' + '))}</p>` : ''}
            ${(candidate.requiredProof || []).length ? `<div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:6px;">${compact(candidate.requiredProof, '#fed7aa', '#7c2d12', '#b45309')}</div>` : ''}
            ${(candidate.lookalikeWarnings || []).length ? `<p style="color:#fbbf24;font-size:10px;line-height:1.35;margin-bottom:5px;">${escHtml(candidate.lookalikeWarnings[0])}</p>` : ''}
            ${sourceLinks(candidate)}
          </div>`).join('')}
      </div>
    </div>`;
}

function renderPartAlternates(alternates) {
  if (!alternates.length) return '';
  return `
    <div style="margin:10px 0;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px;">
      <p style="color:#94a3b8;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Other possible families</p>
      ${alternates.map(alt => `<div style="border-top:1px solid #1e293b;padding-top:7px;margin-top:7px;">
        <p style="color:#e2e8f0;font-size:12px;font-weight:900;">${escHtml(alt.name || 'Possible alternate')}</p>
        <p style="color:#94a3b8;font-size:11px;line-height:1.4;">${escHtml(alt.why || 'Compare visible markings and dimensions.')} ${alt.confidence ? `(${escHtml(alt.confidence)})` : ''}</p>
      </div>`).join('')}
    </div>`;
}

function partSnapProofPacketTemplates(ai = {}) {
  const text = [ai.category, ai.component, ai.description, ai.model, ai.manufacturer].filter(Boolean).join(' ').toLowerCase();
  const templates = [
    {
      key: 'pump',
      title: 'Pump / Wet End',
      match: ['pump', 'impeller', 'seal', 'basket', 'lid', 'volute', 'diffuser'],
      proof: ['pump model plate', 'HP/THP and voltage', 'wet-end close-up', 'molded number', 'union size', 'seal plate or diffuser view'],
      hold: 'Hold ordering until pump family, motor/wet-end split, and part dimensions agree.'
    },
    {
      key: 'robot',
      title: 'Robot Cleaner',
      match: ['robot', 'cleaner', 'track', 'brush', 'basket', 'dock', 'charger', 'aiper', 'dolphin', 'polaris'],
      proof: ['robot model/serial', 'power supply or dock label', 'track/brush profile', 'filter basket style', 'app/status screen', 'runtime or charging symptom'],
      hold: 'Cleaner families share lookalike parts. Confirm model and accessory/dock family first.'
    },
    {
      key: 'spa_pack',
      title: 'Spa Pack / Topside / Swim Spa',
      match: ['spa', 'hot tub', 'swim spa', 'balboa', 'gecko', 'waterway', 'watkins', 'hot spring', 'caldera', 'jacuzzi', 'sundance', 'bullfrog', 'master spas', 'h2x', 'endless', 'hydropool', 'tidalfit', 'topside', 'heater tube', 'flow switch', 'pressure switch', 'current pump'],
      proof: ['pack label', 'topside display code', 'brand/model plate', 'water level', 'filter condition', 'circ/jet/current pump movement', 'GFCI trip timing', 'heater tube/sensor context', 'suction cover marking', 'ozone/UV/check-valve proof'],
      hold: 'Do not call a board, heater, sensor, pump, current system, or proprietary topside from one code. Verify current manual and qualified electrical boundary.'
    },
    {
      key: 'chemical_controller',
      title: 'Chemical Controller',
      match: ['orp', 'ph', 'probe', 'chemical', 'controller', 'feed', 'stenner', 'rola', 'cat', 'chemtrol'],
      proof: ['manual water test', 'controller screen', 'probe age', 'calibration standard/date', 'flow cell photo', 'tank/tablet level', 'feed tube and injection fitting'],
      hold: 'Automation readings that disagree with manual testing need a high repeat-issue watch.'
    },
    {
      key: 'aop_ozone_uv',
      title: 'AOP / Ozone / UV',
      match: ['ozone', 'uv', 'aop', 'clear comfort', 'del', 'lamp', 'check valve', 'injector'],
      proof: ['module label', 'status light/app alert', 'lamp age', 'flow proof', 'injector air draw', 'check-valve/tubing water intrusion', 'power boundary'],
      hold: 'Stop if water reached electronics or internal energized testing is required.'
    },
    {
      key: 'lighting',
      title: 'Lighting / Transformer',
      match: ['light', 'lighting', 'niche', 'transformer', 'gfci', 'fixture', 'watercolors', 'colorlogic'],
      proof: ['fixture family', 'voltage', 'transformer label/load', 'junction box condition', 'cord path', 'GFCI behavior', 'automation mode'],
      hold: 'Voltage, GFCI, and niche/fixture family must be proven before parts.'
    },
    {
      key: 'automation',
      title: 'Automation / Connected Pool',
      match: ['automation', 'relay', 'actuator', 'rs-485', 'intellicenter', 'omni', 'aqualink', 'board'],
      proof: ['controller model', 'firmware/app screen', 'relay label', 'RS-485 wiring photo', 'device assignment screen', 'breaker/GFCI behavior'],
      hold: 'Package this for senior tech/vendor review when wiring, board, or line-voltage work is involved.'
    }
  ];
  const matched = templates.filter(t => t.match.some(term => text.includes(term)));
  return matched.length ? matched.slice(0, 3) : templates.slice(0, 4);
}

function renderPartSnapProofPacketDrawer(ai = {}) {
  const templates = partSnapProofPacketTemplates(ai);
  const category = escHtml(ai.category || ai.component || 'unknown');
  return `
    <details data-category="${category}" style="margin:10px 0;background:#020617;border:1px solid #334155;border-radius:8px;overflow:hidden;" ontoggle="if(this.open) trackSplashLensEvent('partsnap_proof_packet_drawer_opened',{category:this.dataset.category||'unknown'})">
      <summary style="cursor:pointer;list-style:none;padding:11px 12px;color:#e2e8f0;font-size:12px;font-weight:950;display:flex;justify-content:space-between;gap:10px;align-items:center;">
        <span>Proof packet drawer</span>
        <span style="color:#7dd3fc;font-size:10px;font-weight:900;">pump / robot / spa / chem / light</span>
      </summary>
      <div style="display:grid;gap:8px;padding:0 10px 10px;">
        ${templates.map(t => `
          <div style="background:#0f172a;border:1px solid #1e293b;border-radius:8px;padding:10px;">
            <p style="color:#f8fafc;font-size:12px;font-weight:950;margin-bottom:6px;">${escHtml(t.title)}</p>
            <div style="display:flex;flex-wrap:wrap;gap:5px;margin-bottom:7px;">
              ${t.proof.map((item, i) => `<span style="display:inline-flex;align-items:center;gap:5px;background:#164e63;color:#cffafe;border:1px solid #0e7490;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900;"><b>${i + 1}</b>${escHtml(item)}</span>`).join('')}
            </div>
            <p style="color:#fbbf24;font-size:11px;line-height:1.4;"><strong>Hold:</strong> ${escHtml(t.hold)}</p>
          </div>`).join('')}
      </div>
    </details>`;
}

function partSnapCallbackRisk(ai = {}, ladder = {}, visibleEvidence = [], missingProof = []) {
  const text = [ai.category, ai.component, ai.description, ai.replacementNotes, ai.verificationNotes].filter(Boolean).join(' ').toLowerCase();
  const highRiskTerms = ['gas', 'heater', 'heat pump', 'electrical', 'transformer', 'light', 'lighting', 'automation', 'cover', 'refrigerant'];
  const reasons = [];
  let score = 0;
  if ((ai.confidence || '').toLowerCase() === 'low' || ladder.level === 'unknown') {
    score += 3;
    reasons.push('Low confidence result.');
  }
  if (!ai.partNumber) {
    score += 2;
    reasons.push('No visible part number or model marking.');
  }
  if (!ai.manufacturer || !ai.component) {
    score += 1;
    reasons.push('Manufacturer or component family still needs proof.');
  }
  if (missingProof.length >= 2) {
    score += 2;
    reasons.push('Multiple proof items are still missing.');
  }
  if (!visibleEvidence.length) {
    score += 1;
    reasons.push('No strong visible proof was captured.');
  }
  if (highRiskTerms.some(term => text.includes(term))) {
    score += 2;
    reasons.push('Safety-sensitive hardware can create expensive callbacks.');
  }
  const level = score >= 6 ? 'high' : score >= 3 ? 'medium' : 'low';
  return {
    level,
    label: `${level.toUpperCase()} REPEAT ISSUE WATCH`,
    color: level === 'high' ? '#dc2626' : level === 'medium' ? '#d97706' : '#16a34a',
    reasons: reasons.slice(0, 4),
    missing: missingProof.length ? missingProof : (ladder.missing || []).slice(0, 4),
  };
}

function renderPartSnapCallbackRisk(risk) {
  const reasons = risk.reasons.length ? risk.reasons : ['Enough visible proof was captured for a lower-risk field note.'];
  const missing = risk.missing.length ? risk.missing : ['No extra proof listed.'];
  return `
    <div style="background:#020617;border:1px solid ${risk.color};border-radius:8px;padding:10px;margin:10px 0;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:6px;">
        <p style="color:#e2e8f0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;">Repeat Issue Watch</p>
        <span style="background:${risk.color};color:#fff;border-radius:999px;padding:2px 8px;font-size:9px;font-weight:950;">${risk.level.toUpperCase()}</span>
      </div>
      <p style="color:#94a3b8;font-size:11px;line-height:1.4;margin-bottom:6px;">${reasons.map(escHtml).join(' ')}</p>
      <p style="color:#fbbf24;font-size:11px;line-height:1.4;"><strong>Before ordering:</strong> ${missing.map(escHtml).join(', ')}</p>
    </div>`;
}

function renderPartSnapPartnerCards(ai = {}) {
  const cards = [
    ['counter', 'Send to Boss / Supplier', 'Ready', 'One tap note with proof, missing evidence, repeat-issue watch, and exact questions for a senior tech, distributor, or vendor.'],
    ['verified', 'Partner-Verified Card', 'Ready for partner', 'A manufacturer, distributor, trainer, or vendor intake card for official docs, failure points, model aliases, and required proof language.'],
    ['training', 'Training Scenario Card', 'Ready', 'Turns the result into a 5-minute apprentice lesson with student task, proof checklist, and answer key.'],
    ['passport', 'Saved Job History', 'Ready', 'Save the part result into a customer/pool history so repeat problems and reorders have field proof attached.'],
  ];
  return `
    <div style="margin:10px 0;background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px;">
      <p style="color:#94a3b8;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">PartSnap field network</p>
      <div style="display:grid;gap:7px;">
        ${cards.map(([key, title, state, body]) => `
          <button onclick="openPartSnapPartnerCard('${key}')" style="text-align:left;background:#111827;border:1px solid #334155;border-radius:8px;padding:9px;cursor:pointer;">
            <span style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
              <strong style="color:#e2e8f0;font-size:12px;">${title}</strong>
              <span style="background:${state === 'Ready' ? '#0f766e' : '#334155'};color:#fff;border-radius:999px;padding:2px 7px;font-size:9px;font-weight:900;">${state}</span>
            </span>
            <span style="display:block;color:#94a3b8;font-size:11px;line-height:1.35;margin-top:4px;">${body}</span>
          </button>`).join('')}
      </div>
      <p style="color:#64748b;font-size:10px;line-height:1.35;margin-top:8px;">Partner-verified means an actual manufacturer, distributor, trainer, or vendor has supplied the official proof language. Until then, these cards stay conservative.</p>
    </div>`;
}

function openPartSnapPartnerCard(type) {
  const panel = document.getElementById('partsnap-feedback-panel');
  const title = {
    counter: 'Send to Boss / Supplier',
    verified: 'Partner-Verified Card Intake',
    training: 'Training Scenario Card',
    passport: 'Saved Job History',
  }[type] || 'Partner Card';
  trackSplashLensEvent('partsnap_partner_card_opened', { card: type, confidence: (_lastPartSnapResult || {}).confidence || 'unknown' });
  if (!panel) return;
  const body = partSnapPartnerCardText(type);
  panel.innerHTML = `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:12px;margin:4px 0 16px;">
      <p style="color:#0f172a;font-size:14px;font-weight:950;margin-bottom:5px;">${escHtml(title)}</p>
      <p style="color:#64748b;font-size:12px;line-height:1.45;margin-bottom:10px;">${type === 'verified' ? 'Use this when a partner wants to tell SplashLens exactly what evidence, language, or official doc link should appear on a verified field card.' : 'Use this to move the field result into the next workflow without overstating certainty.'}</p>
      <pre style="white-space:pre-wrap;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;color:#334155;font-size:11px;line-height:1.4;">${escHtml(body)}</pre>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px;">
        <button onclick="navigator.clipboard.writeText(partSnapPartnerCardText('${type}')).then(()=>alert('Card copied.')).catch(()=>alert(partSnapPartnerCardText('${type}')))" style="background:#0369a1;color:#fff;border:0;border-radius:8px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Copy Card</button>
        <button onclick="${type === 'passport' ? 'savePartSnapToPool()' : type === 'training' ? 'startPartSnapApprenticeMode()' : 'sharePartSnapPacket()'}" style="background:#0f766e;color:#fff;border:0;border-radius:8px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Use Now</button>
      </div>
    </div>`;
}

function partSnapPartnerCardText(type) {
  const ai = _lastPartSnapResult || {};
  const base = partSnapEscalationText();
  const risk = partSnapCallbackRisk(ai, partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component), ai.visibleEvidence || [], ai.missingProof || []);
  if (type === 'verified') {
    return [
      'SplashLens partner-verified card intake',
      '',
      `Brand/family: ${[ai.manufacturer, ai.category, ai.component].filter(Boolean).join(' / ') || 'Needs partner input'}`,
      `Possible model/part: ${ai.model || ai.partNumber || 'Needs official model language'}`,
      '',
      'Partner input requested:',
      '- Official model-family names and aliases techs use at the counter',
      '- Required proof before fitment or ordering',
      '- Known failure points and common misidentifications',
      '- New release notes, superseded part numbers, and do-not-confuse families',
      '- Manual, diagram, or support URL that should be checked',
      '- Preferred safe wording for field techs and customers',
      '',
      'Current unverified field packet:',
      base,
    ].join('\n');
  }
  if (type === 'training') {
    return [
      'SplashLens 5-minute PartSnap training card',
      '',
      `Scenario: A tech found ${ai.component || 'a mystery pool part'} with ${ai.confidence || 'unknown'} confidence.`,
      `Repeat issue watch: ${risk.level}`,
      '',
      'Student task:',
      '1. Name what proof is visible.',
      '2. Name what proof is missing.',
      '3. Decide if buying links should be held.',
      '4. Write the customer-safe explanation.',
      '',
      `Answer key: ${risk.missing.length ? `Do not order until ${risk.missing.join(', ')} is captured.` : 'Proof path is strong enough to escalate with normal verification.'}`,
      '',
      base,
    ].join('\n');
  }
  if (type === 'passport') {
    return [
      'Saved job history note',
      '',
      `Saved item: ${[ai.manufacturer, ai.component, ai.model || ai.partNumber].filter(Boolean).join(' / ') || 'PartSnap result'}`,
      `Repeat issue watch: ${risk.level}`,
      `Before ordering: ${risk.missing.length ? risk.missing.join(', ') : 'verify against current manufacturer parts diagram'}`,
      '',
      base,
    ].join('\n');
  }
  return [
    'SplashLens senior tech / vendor packet',
    '',
    'Use this for a distributor counter, vendor support, or senior tech review. It is not a final diagnosis or fitment guarantee.',
    '',
    base,
  ].join('\n');
}

function partSnapEscalationText() {
  const ai = _lastPartSnapResult || {};
  const evidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.join('; ') : '';
  const missing = Array.isArray(ai.missingProof) ? ai.missingProof.join('; ') : '';
  return [
    'SplashLens PartSnap escalation',
    `Possible part: ${[ai.manufacturer, ai.component].filter(Boolean).join(' ') || 'unknown'}`,
    `Model/family: ${ai.model || 'needs model proof'}`,
    `Possible number: ${ai.partNumber || 'not visible'}`,
    `Confidence: ${ai.confidence || 'unknown'}`,
    evidence ? `Visible proof: ${evidence}` : '',
    missing ? `Still needed: ${missing}` : '',
    ai.escalationSummary ? `Summary: ${ai.escalationSummary}` : '',
    'Verify against current manufacturer parts diagram before ordering.'
  ].filter(Boolean).join('\n');
}

function copyPartSnapEscalation() {
  const text = partSnapEscalationText();
  navigator.clipboard?.writeText(text).then(() => {
    trackSplashLensEvent('partsnap_packet_copied', { confidence: (_lastPartSnapResult || {}).confidence || 'unknown' });
    const panel = document.getElementById('partsnap-feedback-panel');
    if (panel) panel.innerHTML = `<p style="color:#5eead4;text-align:center;font-size:12px;font-weight:900;padding:8px 0;">Escalation packet copied.</p>`;
  }).catch(() => {});
}

async function sharePartSnapPacket() {
  const ai = _lastPartSnapResult || {};
  const text = partSnapEscalationText();
  try {
    if (navigator.share) {
      await navigator.share({ title: 'SplashLens PartSnap packet', text });
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(text);
    }
    trackSplashLensEvent('partsnap_share_used', { confidence: ai.confidence || 'unknown', category: ai.category || 'unknown' });
    const panel = document.getElementById('partsnap-feedback-panel');
    if (panel) panel.innerHTML = `<p style="color:#5eead4;text-align:center;font-size:12px;font-weight:900;padding:8px 0;">Packet ready for senior tech, vendor, or customer file.</p>`;
  } catch {}
}

function savePartSnapToPool() {
  const pools = getPools();
  const panel = document.getElementById('partsnap-feedback-panel');
  if (!panel) return;
  if (!pools.length) {
    panel.innerHTML = `
      <div style="background:#fff7ed;border:1px solid #fdba74;border-radius:12px;padding:12px;margin:4px 0 16px;">
        <p style="color:#9a3412;font-size:13px;font-weight:900;margin-bottom:5px;">Create a saved pool first</p>
        <p style="color:#7c2d12;font-size:12px;line-height:1.4;margin-bottom:10px;">PartSnap proof saves into job history so the tech can find it later by customer.</p>
        <button onclick="showTab('pools')" style="width:100%;background:#0f766e;color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Go to Pools</button>
      </div>`;
    return;
  }
  panel.innerHTML = `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:12px;margin:4px 0 16px;">
      <p style="color:#0f172a;font-size:14px;font-weight:950;margin-bottom:5px;">Save PartSnap to job history</p>
      <p style="color:#64748b;font-size:12px;line-height:1.4;margin-bottom:10px;">Attach this result to a customer record with the proof, repeat-issue watch, and supplier note.</p>
      <label class="field-label" for="partsnap-save-pool">Saved pool</label>
      <select id="partsnap-save-pool" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;">
        ${pools.map(p => `<option value="${escHtml(p.id)}">${escHtml([p.name, p.address].filter(Boolean).join(' - ') || 'Saved pool')}</option>`).join('')}
      </select>
      <button onclick="confirmPartSnapSaveToPool()" style="width:100%;background:#0284c7;color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;">Save Job Note</button>
      <p id="partsnap-save-status" style="color:#64748b;font-size:11px;text-align:center;margin-top:8px;"></p>
    </div>`;
}

function confirmPartSnapSaveToPool() {
  if (!ensureFieldSaveAccount('partsnap_saved_to_pool')) return;

  const poolId = document.getElementById('partsnap-save-pool')?.value;
  const status = document.getElementById('partsnap-save-status');
  const pools = getPools();
  const pool = pools.find(p => p.id === poolId);
  const ai = _lastPartSnapResult || {};
  if (!pool) {
    if (status) status.textContent = 'Choose a saved pool first.';
    return;
  }
  const visibleEvidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(ai.missingProof) ? ai.missingProof.filter(Boolean).slice(0, 4) : [];
  const ladder = partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component);
  const risk = partSnapCallbackRisk(ai, ladder, visibleEvidence, missingProof);
  const passport = {
    id: `partsnap-${Date.now()}`,
    type: 'partsnap_proof',
    savedAt: new Date().toISOString(),
    poolId: pool.id,
    customer: pool.name,
    address: pool.address || '',
    tech: '',
    date: getTodayStr(),
    visitType: 'PartSnap Parts ID',
    readings: {},
    proof: {
      complete: risk.level === 'low' && missingProof.length === 0,
      missing: risk.missing,
      photoProof: visibleEvidence.join('; ') || 'PartSnap image result saved.',
      issueNote: ai.verificationNotes || ai.replacementNotes || ai.escalationSummary || '',
      customerSummary: `PartSnap reviewed ${[ai.manufacturer, ai.component].filter(Boolean).join(' ') || 'an unknown part'} with ${ai.confidence || 'unknown'} confidence.`,
    },
    chemicals: [],
    totalChemicalCost: 0,
    workPerformed: `PartSnap reviewed ${ai.component || 'unknown part'} for identification and ordering proof.`,
    equipmentNotes: partSnapEscalationText(),
    recommendations: (risk.missing.length ? `Before ordering: ${risk.missing.join(', ')}.` : 'Verify against the current manufacturer parts diagram before ordering.'),
    nextVisit: '',
    partSnap: ai,
    callbackRisk: risk,
  };
  if (!pool.servicePassports) pool.servicePassports = [];
  pool.servicePassports.push(passport);
  if (!pool.equipmentTree) pool.equipmentTree = [];
  pool.equipmentTree.push({
    id: `partsnap-eq-${Date.now()}`,
    manufacturer: ai.manufacturer || '',
    hardware: ai.category || ai.component || 'PartSnap',
    model: ai.model || ai.partNumber || '',
    visibleLabel: visibleEvidence.join('; '),
    symptom: ai.replacementNotes || ai.description || 'Part identification',
    confidence: `${ai.confidence || 'unknown'} / ${risk.level} repeat issue watch`,
    savedAt: new Date().toISOString(),
  });
  if (pool.equipmentTree.length > 50) pool.equipmentTree = pool.equipmentTree.slice(-50);
  savePools(pools);
  trackSplashLensEvent('partsnap_saved_to_pool', { confidence: ai.confidence || 'unknown', risk: risk.level, pool_id: pool.id });
  if (status) status.textContent = `Saved to ${pool.name}.`;
}

function startPartSnapApprenticeMode() {
  const ai = _lastPartSnapResult || {};
  const visibleEvidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(ai.missingProof) ? ai.missingProof.filter(Boolean).slice(0, 4) : [];
  const ladder = partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component);
  const risk = partSnapCallbackRisk(ai, ladder, visibleEvidence, missingProof);
  const panel = document.getElementById('partsnap-feedback-panel');
  if (!panel) return;
  trackSplashLensEvent('partsnap_apprentice_started', { confidence: ai.confidence || 'unknown', risk: risk.level });
  panel.innerHTML = `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:12px;margin:4px 0 16px;">
      <p style="color:#0f172a;font-size:14px;font-weight:950;margin-bottom:5px;">Apprentice Mode</p>
      <p style="color:#64748b;font-size:12px;line-height:1.4;margin-bottom:10px;">Turn this part into a quick field coaching moment before someone orders the wrong thing.</p>
      <label class="field-label" for="partsnap-apprentice-proof">What proof would you ask for next?</label>
      <textarea id="partsnap-apprentice-proof" rows="2" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical;margin-bottom:8px;"></textarea>
      <label class="field-label" for="partsnap-apprentice-order">Would you order yet? Why?</label>
      <textarea id="partsnap-apprentice-order" rows="2" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical;margin-bottom:10px;"></textarea>
      <button onclick="revealPartSnapApprenticeAnswer()" style="width:100%;background:#0f766e;color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;">Show Answer Key</button>
      <div id="partsnap-apprentice-answer"></div>
    </div>`;
}

function revealPartSnapApprenticeAnswer() {
  const ai = _lastPartSnapResult || {};
  const visibleEvidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(ai.missingProof) ? ai.missingProof.filter(Boolean).slice(0, 4) : [];
  const ladder = partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component);
  const risk = partSnapCallbackRisk(ai, ladder, visibleEvidence, missingProof);
  const answer = document.getElementById('partsnap-apprentice-answer');
  if (!answer) return;
  answer.innerHTML = `
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:10px;margin-top:10px;">
      <p style="color:#0f172a;font-size:12px;font-weight:900;margin-bottom:5px;">Answer key</p>
      <p style="color:#334155;font-size:12px;line-height:1.45;margin-bottom:6px;"><strong>Next proof:</strong> ${escHtml((risk.missing || []).join(', ') || 'Confirm current manufacturer parts diagram.')}</p>
      <p style="color:#334155;font-size:12px;line-height:1.45;margin-bottom:6px;"><strong>Order decision:</strong> ${risk.level === 'low' ? 'Lower risk, but still verify model fit before ordering.' : 'Do not order yet without the missing proof or a senior/vendor review.'}</p>
      <p style="color:#334155;font-size:12px;line-height:1.45;"><strong>Customer wording:</strong> ${escHtml(ai.escalationSummary || 'We found a possible match and are verifying the exact model/part fit before ordering.')}</p>
    </div>`;
}

function requestPartSnapSecondProof() {
  const ai = _lastPartSnapResult || {};
  const visibleEvidence = Array.isArray(ai.visibleEvidence) ? ai.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(ai.missingProof) ? ai.missingProof.filter(Boolean).slice(0, 4) : [];
  const ladder = partConfidenceLadder(ai.confidence, ai.partNumber, ai.manufacturer, ai.model, ai.component);
  const risk = partSnapCallbackRisk(ai, ladder, visibleEvidence, missingProof);
  const proofRequestId = `proof-${Date.now().toString(36)}`;
  const recovery = savePartSnapRecoveryContext({
    proofRequestId,
    secondProofRequestedAt: new Date().toISOString(),
    lastSummary: [ai.manufacturer, ai.component, ai.model || ai.partNumber].filter(Boolean).join(' / ') || 'Unknown PartSnap result',
    lastMissingProof: missingProof.length ? missingProof : (ladder.missing || []).slice(0, 4),
    lastRisk: risk.level,
    lastConfidence: ai.confidence || 'unknown',
  });
  const result = document.getElementById('scan-result');
  const status = document.getElementById('scan-camera-status');
  if (status) status.textContent = 'SECOND PROOF: CAPTURE LABEL, MODEL PLATE, OR PART NUMBER';
  if (result) result.innerHTML = `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:14px;margin:8px 0;text-align:center;">
      <p style="color:#e2e8f0;font-size:14px;font-weight:900;margin-bottom:6px;">Second proof photo</p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.45;margin-bottom:10px;">Get the label, model plate, casting number, wiring label, or a wider shot that shows where the part lives.</p>
      <button onclick="setScanMode('parts')" style="background:#0f766e;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:12px;font-weight:900;cursor:pointer;">Capture Second Proof</button>
    </div>`;
  trackSplashLensEvent('partsnap_second_proof_requested', {
    proof_request_id: proofRequestId,
    recovery_attempts: recovery.attempts,
    confidence: ai.confidence || 'unknown',
    category: ai.category || ai.component || 'unknown',
    risk: risk.level,
    proof_visible_count: visibleEvidence.length,
    proof_missing_count: missingProof.length || (ladder.missing || []).length,
    result_summary: [ai.manufacturer, ai.component, ai.model || ai.partNumber].filter(Boolean).join(' / ') || 'Unknown PartSnap result',
  });
}

function renderMysteryPartForm() {
  const panel = document.getElementById('partsnap-feedback-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:12px;margin:4px 0 16px;">
      <p style="color:#0f172a;font-size:14px;font-weight:950;margin-bottom:5px;">Send this mystery part to SplashLens</p>
      <p style="color:#64748b;font-size:12px;line-height:1.4;margin-bottom:10px;">Use this when PartSnap is low-confidence or you want the app trained around a real field miss. It becomes a review ticket, not a public post.</p>
      <label class="field-label" for="partsnap-feedback-email">Your email</label>
      <input id="partsnap-feedback-email" type="email" placeholder="you@example.com" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:8px;">
      <label class="field-label" for="partsnap-feedback-note">What do you know?</label>
      <textarea id="partsnap-feedback-note" rows="3" placeholder="Brand, pool type, where the part came from, vendor clue..." style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;resize:vertical;margin-bottom:10px;"></textarea>
      <button onclick="submitMysteryPartFeedback()" style="width:100%;background:#0f766e;color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;">Send Mystery Part</button>
      <p id="partsnap-feedback-status" style="color:#64748b;font-size:11px;text-align:center;margin-top:8px;"></p>
    </div>`;
}

async function submitMysteryPartFeedback() {
  const status = document.getElementById('partsnap-feedback-status');
  const email = document.getElementById('partsnap-feedback-email')?.value || '';
  const note = document.getElementById('partsnap-feedback-note')?.value || '';
  const ai = _lastPartSnapResult || {};
  const summary = [ai.manufacturer, ai.component, ai.model, ai.partNumber].filter(Boolean).join(' / ') || note || 'Mystery part submitted.';
  if (email) rememberSplashLensIdentity({ email, role: getSplashLensRole() }, 'partsnap_mystery');
  if (status) status.textContent = 'Sending...';
  try {
    const res = await fetch(PARTSNAP_FEEDBACK_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getLanguageHeaders() },
      body: JSON.stringify(withLanguageMetadata({
        email,
        note,
        result: _lastPartSnapResult || {},
        escalation: partSnapEscalationText(),
        source: 'partsnap-result',
        path: `${window.location.pathname}${window.location.search}`,
      })),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const payload = await res.json().catch(() => ({}));
    const ticketId = payload.ticketId || `local-${Date.now().toString(36)}`;
    savePartSnapReviewTicket({
      id: ticketId,
      createdAt: new Date().toLocaleString(),
      status: payload.alertQueued ? 'sent to review' : 'saved locally',
      summary,
    });
    trackSplashLensEvent('partsnap_mystery_submitted', { confidence: ai.confidence || 'unknown', ticket_id: ticketId });
    if (status) status.textContent = `Sent. Ticket ${ticketId} saved in the review queue.`;
  } catch {
    const ticketId = `local-${Date.now().toString(36)}`;
    savePartSnapReviewTicket({
      id: ticketId,
      createdAt: new Date().toLocaleString(),
      status: 'needs manual email',
      summary,
    });
    trackSplashLensEvent('partsnap_mystery_saved_local', { confidence: ai.confidence || 'unknown', ticket_id: ticketId });
    if (status) status.textContent = `Could not send. Local ticket ${ticketId} saved; copy the packet and email hello@splashlens.com.`;
  }
}

function partConfidenceLadder(confidence, partNumber, manufacturer, model, component) {
  const hasMarking = !!partNumber;
  const hasFamily = !!(manufacturer && (model || component));
  const level = hasMarking ? 'visible marking' : hasFamily && confidence !== 'low' ? 'likely family' : confidence === 'low' ? 'unknown' : 'possible';
  const missing = [];
  if (!hasMarking) missing.push('visible part number or model plate');
  if (!manufacturer) missing.push('manufacturer proof');
  if (!model) missing.push('equipment model');
  if (!component) missing.push('component name');
  return {
    level,
    allowLinks: hasMarking || (level === 'likely family' && missing.length <= 2),
    missing,
  };
}

function renderPartConfidenceLadder(ladder) {
  const steps = ['visible marking','likely family','possible','unknown'];
  return `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:8px;padding:10px;margin:10px 0;">
      <p style="color:#94a3b8;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px;">Part Confidence Ladder</p>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:5px;">
        ${steps.map(step => {
          const active = ladder.level === step;
          return `<span style="text-align:center;border-radius:6px;padding:6px 3px;font-size:9px;font-weight:900;border:1px solid ${active ? '#14b8a6' : '#334155'};background:${active ? '#0f766e' : '#1e293b'};color:${active ? '#fff' : '#94a3b8'};">${escHtml(step)}</span>`;
        }).join('')}
      </div>
      <p style="color:#64748b;font-size:10px;line-height:1.4;margin-top:8px;">Buying links unlock only when the result has enough visible evidence to avoid guessing.</p>
    </div>`;
}

function renderPartBuyLinks(searchTerms, partNumber, manufacturer, component) {
  const rawTerm = partNumber || searchTerms?.[0] || [manufacturer, component].filter(Boolean).join(' ');
  if (!rawTerm) return '';
  const q = encodeURIComponent(rawTerm);
  const outbound = (store) => `/api/outbound?store=${encodeURIComponent(store)}&q=${q}`;
  return `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid #334155;">
      <p style="color:#64748b;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:8px;">VERIFY FIT / PRICE CHECK</p>
      <p style="color:#94a3b8;font-size:10px;line-height:1.4;margin-bottom:8px;">Best path: use the proof packet with your normal local distributor or SCP-style counter first, then compare online availability if needed.</p>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <a href="${outbound('distributor')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('part_search_click',{store:'local_distributor'})" style="background:#0f766e;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">Local Distributor</a>
        <a href="${outbound('leslies')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('affiliate_click',{store:'leslies'})" style="background:#0284c7;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">Leslie's</a>
        <a href="${outbound('intheswim')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('affiliate_click',{store:'intheswim'})" style="background:#0ea5e9;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">In The Swim</a>
        <a href="${outbound('poolsupplyworld')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('affiliate_click',{store:'poolsupplyworld'})" style="background:#334155;color:#e2e8f0;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">Pool Supply World</a>
        <a href="${outbound('web')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('part_search_click',{store:'web'})" style="background:#0f172a;color:#7dd3fc;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;border:1px solid #334155;">Search Web</a>
      </div>
      <p style="color:#64748b;font-size:10px;line-height:1.4;margin-top:8px;">Search links are for convenience only. SplashLens has no live inventory, seller guarantee, SCP affiliation, or fitment guarantee. Verify fit before ordering. If an affiliate tag is configured, SplashLens may earn a commission.</p>
    </div>`;
}

function extractErrorCodes(text) {
  if (!text) return [];
  const t = text.toUpperCase();
  const patterns = [
    /\bE\d{1,3}\b/g,          // E01, E5, E123
    /\bERR(?:OR)?\s*\d{1,3}\b/g, // ERR 3, ERROR 05
    /\bFLO\b/g,
    /\bLO\b/g, /\bHI\b/g,
    /\bSF\b/g,  /\bAGS\b/g,
    /\bBD\b/g,
    /\bF\d{1,3}\b/g,          // F1, F25 (Jandy style)
    /\b\d{1,3}\b/g             // bare numbers as fallback
  ];
  const found = new Set();
  patterns.forEach(rx => { const m = t.match(rx); if (m) m.forEach(c => found.add(c.replace(/\s+/g,''))); });
  // deduplicate and remove bare single digits unless nothing else
  const rich = [...found].filter(c => c.length > 1 || /E\d/.test(c));
  return rich.length ? rich : [...found];
}

function showCaptureWithManualEntry(canvas, detectedText, result, status) {
  if (status) status.textContent = 'ENTER CODE SHOWN ON DISPLAY';
  const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
  if (result) result.innerHTML = `
    <div style="margin-bottom:12px;">
      <img src="${dataUrl}" style="width:100%;border-radius:8px;border:2px solid #334155;max-height:200px;object-fit:cover;">
    </div>
    ${detectedText ? `<p style="color:#7dd3fc;font-size:12px;margin-bottom:10px;font-weight:600;">Detected text: ${detectedText}</p>` : ''}
    <div style="display:flex;gap:8px;margin-bottom:8px;">
      <input id="scan-manual-code" type="text" value="${detectedText}" placeholder="Type error code (e.g. E05)"
        style="flex:1;padding:12px;background:#1e293b;border:1px solid #334155;border-radius:8px;color:#f1f5f9;font-size:16px;outline:none;letter-spacing:.06em;"
        oninput="scanManualSearch(this.value)">
    </div>
    <div id="scan-manual-results"></div>
  `;
}

function scanManualSearch(val) {
  const el = document.getElementById('scan-manual-results');
  if (!el || !val.trim()) { if (el) el.innerHTML = ''; return; }
  const hits = searchErrorDB(val.trim());
  el.innerHTML = renderScanHits(hits, val.trim());
}

function runCodeSearch(code, result, status) {
  if (status) status.textContent = `FOUND CODE: ${code}`;
  const hits = searchErrorDB(code);
  if (result) {
    result.innerHTML = `
      <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:10px;">
        <p style="color:#7dd3fc;font-size:11px;font-weight:700;letter-spacing:.06em;margin-bottom:4px;">DETECTED CODE</p>
        <p style="color:#f1f5f9;font-size:18px;font-weight:800;letter-spacing:.08em;">${code}</p>
      </div>
      ${renderScanHits(hits, code)}
    `;
  }
}

// ── Code Lookup ─────────────────────────────

function renderScanBrandFilter() {
  const el = document.getElementById('scan-brand-filter');
  if (!el || !window.ERROR_DB) return;
  const brands = Object.entries(window.ERROR_DB);
  el.innerHTML = `
    <button onclick="setScanBrand(null)" style="${scanBrandPillStyle(_scanBrand === null)}">All Brands</button>
    ${brands.map(([k,b]) => `<button onclick="setScanBrand('${k}')" style="${scanBrandPillStyle(_scanBrand === k)}">${b.label}</button>`).join('')}
  `;
}

function scanBrandPillStyle(active) {
  return `padding:6px 14px;border-radius:100px;border:1px solid ${active ? '#0284c7' : '#334155'};background:${active ? '#0284c7' : '#1e293b'};color:${active ? '#fff' : '#94a3b8'};font-size:12px;font-weight:600;cursor:pointer;white-space:nowrap;`;
}

function setScanBrand(brand) {
  _scanBrand = brand;
  renderScanBrandFilter();
  const input = document.getElementById('scan-code-input');
  if (input) scanCodeSearch(input.value);
}

function scanCodeSearch(val) {
  const el = document.getElementById('scan-lookup-results');
  if (!el) return;
  const query = val.trim();
  if (!query) {
    el.innerHTML = `<p style="color:#475569;font-size:13px;text-align:center;padding:24px 0;">Enter an error code to search</p>`;
    return;
  }
  const safeQuery = query.replace(/[^a-zA-Z0-9 ._-]/g, '').slice(0, 40);
  const hits = searchErrorDB(query, _scanBrand);
  el.innerHTML = renderScanHits(hits, query);
  const trackingKey = `${_scanBrand || 'all'}:${safeQuery}`;
  if (safeQuery.length >= 2 && scanCodeSearch._lastTracked !== trackingKey) {
    scanCodeSearch._lastTracked = trackingKey;
    trackSplashLensEvent('manual_code_search', {
      query: safeQuery,
      brand: _scanBrand || 'all',
      result_count: hits.length,
    });
    trackSplashLensEvent('first_value_completed', {
      role: getSplashLensRole(),
      workflow: 'scan_lookup_search',
      result_count: hits.length,
      time_back_message: 'Lookup answer found inside scanner mode.',
    });
  }
}

function searchErrorDB(query, brandFilter) {
  if (!window.ERROR_DB) return [];
  const normalizeSearchText = (value) => String(value || '').toUpperCase().replace(/[^A-Z0-9]/g,'');
  const q = normalizeSearchText(query);
  const results = [];
  const brands = brandFilter ? { [brandFilter]: window.ERROR_DB[brandFilter] } : window.ERROR_DB;
  for (const [brandKey, brand] of Object.entries(brands)) {
    if (!brand?.categories) continue;
    for (const [catName, cat] of Object.entries(brand.categories)) {
      for (const code of (cat.codes || [])) {
        const c = normalizeSearchText(code.code);
        const n = (code.name || '').toUpperCase();
        const category = (catName || '').toUpperCase();
        const models = (cat.models || []).join(' ').toUpperCase();
        const causes = (code.causes || []).join(' ').toUpperCase();
        const fixes = (code.fix || []).join(' ').toUpperCase();
        const haystack = normalizeSearchText([category, models, c, n, causes, fixes].join(' '));
        const looseHaystack = [category, models, c, n, causes, fixes].join(' ');
        const exactOrLongCode = c === q || (c.length >= 3 && q.includes(c));
        if (haystack.includes(q) || exactOrLongCode || looseHaystack.includes(query.trim().toUpperCase())) {
          results.push({ brandKey, brandLabel: brand.label, brandColor: brand.color || '#0284c7', category: catName, ...code });
        }
      }
    }
  }
  return results;
}

function renderScanHits(hits, query) {
  if (!hits.length) return `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:20px;text-align:center;">
      <p style="color:#64748b;font-size:13px;">No matches for <strong style="color:#94a3b8">"${query}"</strong></p>
      <p style="color:#475569;font-size:12px;margin-top:6px;">Try the brand name + code, or search a keyword (e.g. "ignition", "flow", "pressure")</p>
    </div>`;
  return hits.map(h => `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:10px;border-left:4px solid ${h.brandColor};">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <span style="background:${h.brandColor};color:#fff;padding:2px 10px;border-radius:100px;font-size:11px;font-weight:700;">${h.brandLabel}</span>
        <span style="color:#94a3b8;font-size:11px;">${h.category}</span>
        <span style="margin-left:auto;background:${h.severity==='high'?'#dc2626':h.severity==='medium'?'#d97706':'#16a34a'};color:#fff;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;">${(h.severity||'').toUpperCase()}</span>
      </div>
      <div style="font-size:20px;font-weight:900;color:#f1f5f9;letter-spacing:.08em;margin-bottom:4px;">${h.code}</div>
      <div style="font-size:14px;font-weight:700;color:#7dd3fc;margin-bottom:10px;">${h.name}</div>
      ${h.causes?.length ? `
        <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Likely Causes</p>
        <ul style="margin:0 0 10px;padding-left:16px;">${h.causes.map(c=>`<li style="color:#94a3b8;font-size:13px;line-height:1.5;">${c}</li>`).join('')}</ul>
      ` : ''}
      ${h.fix?.length ? `
        <p style="color:#64748b;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">Next Checks</p>
        <ol style="margin:0;padding-left:16px;">${h.fix.map(f=>`<li style="color:#e2e8f0;font-size:13px;line-height:1.6;margin-bottom:2px;">${f}</li>`).join('')}</ol>
      ` : ''}
      ${h.callpro ? `<p style="color:#fbbf24;font-size:12px;font-weight:700;margin-top:10px;">⚠ Recommend calling a certified technician for this fault.</p>` : ''}
      <p style="color:#64748b;font-size:10px;line-height:1.45;margin-top:10px;">Reference only. Confirm the code, model, and procedure against the current manufacturer manual before repair or parts ordering.</p>
    </div>
  `).join('');
}

function renderStripResult(ai, result, status) {
  if (!result) return;
  const { fc, ph, ta, ch, cya, notes, confidence, disclaimer } = ai;

  if (status) status.textContent = 'TEST STRIP READING COMPLETE';

  const val  = (v, unit='ppm') => v !== null && v !== undefined ? `<span style="font-size:22px;font-weight:900;color:#f1f5f9;">${v}</span> <span style="font-size:12px;color:#64748b;">${unit}</span>` : '<span style="color:#334155;font-size:18px;">—</span>';
  const flag = (v, lo, hi) => {
    if (v === null || v === undefined) return '#334155';
    return v < lo || v > hi ? '#d97706' : '#16a34a';
  };

  const rows = [
    { label: 'Free Chlorine', key: 'fc', v: fc, lo: 1, hi: 5 },
    { label: 'pH', key: 'ph', v: ph, lo: 7.2, hi: 7.8, unit: '' },
    { label: 'Total Alkalinity', key: 'ta', v: ta, lo: 80, hi: 120 },
    { label: 'Calcium Hardness', key: 'ch', v: ch, lo: 150, hi: 400 },
    { label: 'Cyanuric Acid', key: 'cya', v: cya, lo: 30, hi: 80 },
  ];

  result.innerHTML = `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:16px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">
        <span style="background:#0284c7;color:#fff;padding:2px 10px;border-radius:100px;font-size:10px;font-weight:700;">🧪 TEST STRIP AI READ</span>
        <span style="margin-left:auto;background:#334155;color:#94a3b8;padding:2px 8px;border-radius:100px;font-size:10px;font-weight:700;">${(confidence||'medium').toUpperCase()}</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">
        ${rows.map(r => `
          <div style="background:#0f172a;border:1px solid ${flag(r.v, r.lo, r.hi)};border-radius:8px;padding:10px;border-left:3px solid ${flag(r.v, r.lo, r.hi)};">
            <p style="color:#64748b;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${r.label}</p>
            ${val(r.v, r.unit !== undefined ? r.unit : 'ppm')}
            ${r.v !== null && r.v !== undefined ? (r.v < r.lo || r.v > r.hi ? '<p style="color:#fbbf24;font-size:9px;margin-top:3px;">⚠ Out of range</p>' : '<p style="color:#4ade80;font-size:9px;margin-top:3px;">✓ In range</p>') : ''}
          </div>`).join('')}
      </div>
      ${notes ? `<p style="color:#7dd3fc;font-size:13px;line-height:1.5;margin-bottom:10px;">${notes}</p>` : ''}
      <p style="color:#475569;font-size:10px;line-height:1.4;font-style:italic;">${disclaimer || 'AI strip readings are rough field triage. Confirm with a calibrated kit before dosing.'}</p>
      <p style="color:#fbbf24;font-size:10px;line-height:1.4;margin-top:6px;">Confirm readings with a calibrated kit before using the dosing calculator.</p>
    </div>
    <div style="text-align:center;padding:0 0 16px;">
      <button onclick="showTab('dosing')" style="background:#0284c7;color:#fff;border:none;border-radius:8px;padding:10px 20px;font-size:13px;font-weight:700;cursor:pointer;margin-right:8px;">Calculate Doses →</button>
      <button onclick="setScanMode('strip');document.getElementById('scan-result').innerHTML=''" style="background:#334155;color:#94a3b8;border:none;border-radius:8px;padding:10px 16px;font-size:13px;cursor:pointer;">Scan Again</button>
    </div>
  `;
}

// ── Chem Catalog ─────────────────────────────

function renderChemCatalogHome() {
  const el = document.getElementById('scan-chem-results');
  if (!el) return;
  if (!window.CHEM_CATALOG) {
    el.innerHTML = `<p style="color:#475569;font-size:13px;text-align:center;padding:24px 0;">Chemical catalog loading…</p>`;
    return;
  }
  const { homeAlternatives } = window.CHEM_CATALOG;
  if (homeAlternatives?.length) {
    el.innerHTML = `
      <p style="color:#7dd3fc;font-size:12px;font-weight:700;letter-spacing:.06em;margin-bottom:12px;">💰 HOME STORE ALTERNATIVES</p>
      ${homeAlternatives.map(a => `
        <div style="background:#1e293b;border:1px solid #334155;border-radius:10px;padding:12px;margin-bottom:8px;border-left:3px solid #16a34a;">
          <p style="color:#86efac;font-size:12px;font-weight:700;margin-bottom:4px;">${a.chemical}</p>
          <p style="color:#f1f5f9;font-size:14px;font-weight:700;margin-bottom:4px;">${a.homeProduct}</p>
          <p style="color:#94a3b8;font-size:12px;margin-bottom:4px;">${a.savings}</p>
          ${a.caution ? `<p style="color:#fbbf24;font-size:11px;font-weight:600;">⚠ ${a.caution}</p>` : ''}
        </div>
      `).join('')}
    `;
  } else {
    el.innerHTML = `<p style="color:#475569;font-size:13px;text-align:center;padding:24px 0;">Search above to find chemical products</p>`;
  }
}

function scanChemSearch(val) {
  const el = document.getElementById('scan-chem-results');
  if (!el) return;
  if (!val.trim()) { renderChemCatalogHome(); return; }
  const q = val.toLowerCase();
  if (!window.CHEM_CATALOG?.categories) {
    el.innerHTML = `<p style="color:#475569;font-size:13px;text-align:center;padding:24px 0;">Chemical catalog not yet loaded. Please try again.</p>`;
    return;
  }
  const hits = [];
  for (const cat of window.CHEM_CATALOG.categories) {
    for (const p of (cat.products || [])) {
      const searchable = [p.name, p.genericName, p.activeIngredient, ...(p.brands||[])].join(' ').toLowerCase();
      if (searchable.includes(q)) hits.push({ ...p, catLabel: cat.label });
    }
  }
  if (!hits.length) {
    el.innerHTML = `<p style="color:#475569;font-size:13px;text-align:center;padding:24px 0;">No results for "${val}"</p>`;
    return;
  }
  el.innerHTML = hits.map(p => `
    <div style="background:#1e293b;border:1px solid #334155;border-radius:12px;padding:14px;margin-bottom:10px;">
      <p style="color:#7dd3fc;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;margin-bottom:4px;">${p.catLabel}</p>
      <p style="color:#f1f5f9;font-size:15px;font-weight:700;margin-bottom:2px;">${p.name}</p>
      <p style="color:#94a3b8;font-size:12px;margin-bottom:8px;">${p.genericName}${p.activeIngredient ? ' · ' + p.activeIngredient : ''}</p>
      ${p.brands?.length ? `<p style="color:#64748b;font-size:11px;font-weight:600;margin-bottom:6px;">Brands: ${p.brands.join(', ')}</p>` : ''}
      ${p.notes ? `<p style="color:#94a3b8;font-size:12px;line-height:1.5;margin-bottom:8px;">${p.notes}</p>` : ''}
      ${p.alternatives?.length ? `
        <p style="color:#86efac;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px;">💰 Store Alternatives</p>
        ${p.alternatives.map(a => `
          <div style="background:#0f172a;border-radius:6px;padding:8px 10px;margin-bottom:4px;display:flex;gap:10px;align-items:flex-start;">
            <span style="background:#16a34a;color:#fff;padding:2px 8px;border-radius:4px;font-size:10px;font-weight:700;white-space:nowrap;flex-shrink:0;">${a.store}</span>
            <div>
              <p style="color:#e2e8f0;font-size:12px;font-weight:600;">${a.product}</p>
              ${a.note ? `<p style="color:#64748b;font-size:11px;">${a.note}</p>` : ''}
            </div>
          </div>
        `).join('')}
      ` : ''}
      ${p.incompatible?.length ? `<p style="color:#fbbf24;font-size:11px;font-weight:600;margin-top:8px;">⚠ Never mix with: ${p.incompatible.join(', ')}</p>` : ''}
    </div>
  `).join('');
}
