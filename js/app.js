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
const LANGUAGE_OPTIONS = ['en', 'es', 'pt-BR', 'fr'];

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
  const select = document.getElementById('language-select');
  if (!select) return;
  select.value = getLanguageProfile().preferredLanguage;
  select.addEventListener('change', () => {
    const profile = setPreferredLanguage(select.value);
    trackSplashLensEvent('language_preference_set', { preferred_language: profile.preferredLanguage, locale: profile.locale });
  });
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
  trackReferralLandingOpen();
  trackSplashLensAppOpen();
});

// ═══════════════════════════════════════════
// TABS
// ═══════════════════════════════════════════
function showTab(name) {
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
}

function initDeepLink() {
  const tab = new URLSearchParams(window.location.search).get('tab');
  const allowed = new Set(['errors', 'dosing', 'report', 'guide', 'pools', 'scan', 'volume', 'sand', 'route']);
  if (tab && allowed.has(tab)) showTab(tab);
}

// ═══════════════════════════════════════════
// PERSISTENT POOL VOLUME
// ═══════════════════════════════════════════
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

function focusErrorSearch() {
  showTab('errors');
  setTimeout(() => {
    const el = document.getElementById('error-search');
    if (!el) return;
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
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin-bottom:7px;">Possible Causes</p>
          <ul style="list-style:none;">
            ${code.causes.map(c => `<li style="display:flex;gap:7px;padding:3px 0;font-size:13px;color:#374151;"><span style="color:#dc2626;flex-shrink:0;margin-top:1px;">•</span>${c}</li>`).join('')}
          </ul>
          <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;margin:12px 0 7px;">Fix Steps</p>
          <ol style="list-style:none;">
            ${code.fix.map((f, i) => `<li style="display:flex;gap:8px;padding:4px 0;font-size:13px;color:#374151;"><span style="color:#0284c7;font-weight:900;flex-shrink:0;min-width:16px;">${i+1}.</span>${f}</li>`).join('')}
          </ol>
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
}

function onErrorSearch(q) {
  q = q.trim().toLowerCase();
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

function buildReportText() {
  const customer = _rptVal('rpt-customer') || 'Customer';
  const address  = _rptVal('rpt-address');
  const tech     = _rptVal('rpt-tech') || 'Tech';
  const rawDate  = _rptVal('rpt-date');
  const date     = rawDate ? new Date(rawDate + 'T12:00:00').toLocaleDateString() : new Date().toLocaleDateString();
  const type     = _rptVal('rpt-type');
  const work     = _rptVal('rpt-work');
  const equip    = _rptVal('rpt-equip');
  const rec      = _rptVal('rpt-rec');
  const rawNext  = _rptVal('rpt-next');
  const next     = rawNext ? new Date(rawNext + 'T12:00:00').toLocaleDateString() : '';
  const readingSource = _rptVal('rpt-reading-source') || 'manual';
  const photoProof = _rptVal('rpt-photo-proof');
  const issueNote = _rptVal('rpt-issue-note');
  const customerSummary = _rptVal('rpt-customer-summary');
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
  return {
    id: `svc-${Date.now()}`,
    type: 'service_passport',
    savedAt: new Date().toISOString(),
    poolId: _reportPoolId,
    customer: _rptVal('rpt-customer') || 'Customer',
    address: _rptVal('rpt-address'),
    tech: _rptVal('rpt-tech') || 'Tech',
    date: rawDate || new Date().toISOString().split('T')[0],
    visitType: _rptVal('rpt-type') || 'Regular Service',
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
    workPerformed: _rptVal('rpt-work'),
    equipmentNotes: _rptVal('rpt-equip'),
    recommendations: _rptVal('rpt-rec'),
    nextVisit: _rptVal('rpt-next'),
    reportText: buildReportText(),
  };
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
    setDot('#4ade80', 'Offline ready — all data cached');
  } else {
    navigator.serviceWorker.ready.then(() => {
      setDot('#4ade80', 'Offline ready — all data cached');
    }).catch(() => setDot('#fbbf24', 'Caching in progress…'));
  }
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    setDot('#4ade80', 'Offline ready — all data cached');
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
      <p style="color:#0369a1;font-weight:900;font-size:15px;">Service Proof Passports</p>
      <button onclick="loadReportFromPool('${id}');showTab('report')" style="background:#ecfeff;border:1px solid #67e8f9;color:#0e7490;font-size:12px;font-weight:800;padding:6px 12px;border-radius:6px;cursor:pointer;">+ New Report</button>
    </div>
    <div id="service-passports-${id}">
      ${serviceHistoryHtml}
    </div>

    <hr class="section-div">
    <button class="btn-delete" onclick="deletePool('${id}')">Delete Pool</button>
    <div style="height:8px;"></div>`;
}

function poolPill(text) {
  return `<span style="background:#f1f5f9;border:1px solid #e2e8f0;border-radius:20px;padding:4px 11px;font-size:12px;font-weight:700;color:#374151;">${escHtml(text)}</span>`;
}

function renderPoolEquipmentTree(pool) {
  const tree = pool.equipmentTree || [];
  if (!tree.length) return '';
  return `
    <div class="pool-form-panel" style="padding:12px;margin-bottom:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:8px;">
        <p style="color:#64748b;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;">Equipment Tree</p>
        <span style="background:#e0f2fe;color:#075985;border:1px solid #7dd3fc;border-radius:999px;padding:2px 7px;font-size:9px;font-weight:900;">${tree.length} saved</span>
      </div>
      ${tree.slice(-5).reverse().map(item => `
        <div style="border:1px solid #e2e8f0;border-radius:7px;padding:8px;margin-bottom:6px;background:#f8fafc;">
          <p style="color:#0f172a;font-size:13px;font-weight:900;">${escHtml([item.manufacturer, item.hardware, item.model].filter(Boolean).join(' / ') || 'Unknown equipment')}</p>
          <p style="color:#64748b;font-size:11px;line-height:1.4;">${escHtml(item.symptom || 'No symptom saved')} ${item.confidence ? ' - ' + escHtml(item.confidence) : ''}</p>
        </div>`).join('')}
    </div>`;
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
      pools[idx] = pool;
    }
  } else {
    pool.id = String(Date.now());
    pool.history = [];
    pool.servicePassports = [];
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
      </div>
    </details>
  `).join('');
  return `
    <section class="brain-card dark" aria-label="New Tech Radar">
      <p style="color:#7dd3fc;font-size:10px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;margin-bottom:4px;">New Tech Radar</p>
      <h2 style="font-size:21px;line-height:1.06;font-weight:950;margin:0 0 6px;color:#fff;">PartSnap + Connected Pool Brain</h2>
      <p style="color:#cbd5e1;font-size:12px;line-height:1.45;">Track the fast-moving stuff: robots, smart automation, lights, heat pumps, covers, sensors, feeders, and chemical controllers. Use it to capture proof, spot callback risk, and build safer escalation packets.</p>
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
        <span class="brain-pill ${riskClass}">${risk.level} callback risk</span>
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

const SCAN_LIMIT_FREE = 10;
const SCAN_USAGE_KEY = 'pl_scans_month';
const SCAN_PRO_KEY = 'sl_partsnap_pro_local';
const SCAN_ENTITLEMENT_TOKEN_KEY = 'sl_scan_entitlement_token';
const PARTSNAP_MONTHLY_LINK = '/api/checkout?plan=monthly';
const PARTSNAP_YEARLY_LINK = '/api/checkout?plan=yearly';
const SPLASHLENS_EVENT_ENDPOINT = '/api/events';
const PARTSNAP_FEEDBACK_ENDPOINT = '/api/partsnap-feedback';
const PARTSNAP_REVIEW_KEY = 'splashlens-partsnap-review-tickets';
const STORE_SHELL_KEY = 'sl_store_shell_mode';
const ATTRIBUTION_KEY = 'splashlens-attribution-v1';
const ATTRIBUTION_SESSION_KEY = 'splashlens-attribution-session-v1';

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
    dot.style.background   = '#16a34a';
    label.textContent      = getScanEntitlementToken()
      ? 'SIGNED SCANNER ACCESS READY'
      : isPartSnapPro() ? 'PARTSNAP PRO READY' : `AI READY - ${Math.max(0, SCAN_LIMIT_FREE - usage.count)} FREE SCANS LEFT`;
    label.style.color      = '#4ade80';
  } else {
    dot.style.background   = '#64748b';
    label.textContent      = 'OFFLINE — CODE LOOKUP AVAILABLE';
    label.style.color      = '#64748b';
  }
}

function setScanMode(mode) {
  _scanMode = mode;
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

function renderPartSnapPrimer() {
  const result = document.getElementById('scan-result');
  if (!result || result.innerHTML.trim()) return;
  result.innerHTML = `
    <div style="margin:12px 0 16px;background:linear-gradient(135deg,#062b2f,#0f172a);border:1px solid #0f766e;border-radius:14px;padding:14px;border-left:4px solid #14b8a6;">
      <p style="color:#5eead4;font-size:10px;font-weight:950;letter-spacing:.12em;text-transform:uppercase;margin-bottom:6px;">PartSnap AI Service</p>
      <p style="color:#f8fafc;font-size:18px;font-weight:950;line-height:1.1;margin-bottom:8px;">Shoot the part, then shoot the label.</p>
      <p style="color:#cbd5e1;font-size:12px;line-height:1.45;margin-bottom:12px;">Best results come from two photos: the mystery part up close, then the equipment model plate or molded number. PartSnap returns possible matches, missing proof, and a clean escalation packet.</p>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;">
        <div style="background:#042f2e;border:1px solid #0f766e;border-radius:8px;padding:8px;text-align:center;"><b style="display:block;color:#ccfbf1;font-size:11px;">1. Part</b><span style="display:block;color:#99f6e4;font-size:9px;margin-top:2px;">close + lit</span></div>
        <div style="background:#111827;border:1px solid #334155;border-radius:8px;padding:8px;text-align:center;"><b style="display:block;color:#e2e8f0;font-size:11px;">2. Label</b><span style="display:block;color:#94a3b8;font-size:9px;margin-top:2px;">model proof</span></div>
        <div style="background:#431407;border:1px solid #b45309;border-radius:8px;padding:8px;text-align:center;"><b style="display:block;color:#fed7aa;font-size:11px;">3. Verify</b><span style="display:block;color:#fdba74;font-size:9px;margin-top:2px;">before buy</span></div>
      </div>
      ${renderPartSnapReviewTicketSummary()}
    </div>`;
}

// ── Camera ──────────────────────────────────

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
      <p style="color:#64748b;font-size:12px;line-height:1.45;margin-bottom:12px;">These are the last 25 mystery-part submissions or failed sends from this device. Use the ticket id when emailing SplashLens or following up with a senior tech/vendor.</p>
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
    if (vWrap)  vWrap.style.display = 'none';
    if (noCam)  noCam.style.display = 'block';
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
      if (vWrap)  vWrap.style.display = 'none';
      if (noCam)  noCam.style.display = 'block';
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

function captureAndAnalyze() {
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
    if (!canUseAIScan()) {
      showScanLimitModal(result, status);
      return;
    }
    const aiMode = isPartsScan ? 'parts_snap' : isStripScan ? 'test_strip' : 'error_code';
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
  return localStorage.getItem(SCAN_PRO_KEY) === '1' || Boolean(getScanEntitlementToken());
}

function getScanEntitlementToken() {
  const token = localStorage.getItem(SCAN_ENTITLEMENT_TOKEN_KEY) || '';
  return token.startsWith('sl_scan_v1.') ? token : '';
}

function captureScanEntitlementFromUrl() {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get('scan_token') || '';
    if (!token.startsWith('sl_scan_v1.')) return;
    localStorage.setItem(SCAN_ENTITLEMENT_TOKEN_KEY, token);
    localStorage.setItem(SCAN_PRO_KEY, '1');
    url.searchParams.delete('scan_token');
    window.history.replaceState({}, '', `${url.pathname}${url.search}${url.hash}`);
  } catch {}
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
  return isPartSnapPro() || getScanUsage().count < SCAN_LIMIT_FREE;
}

function recordAIScan(mode) {
  if (!isPartSnapPro()) {
    const usage = getScanUsage();
    usage.count += 1;
    saveScanUsage(usage);
  }
  trackSplashLensEvent('ai_scan_started', { mode });
  updateAIStatusBar();
}

function unlockPartSnapProLocal() {
  if (!getScanEntitlementToken()) localStorage.setItem(SCAN_PRO_KEY, '1');
  updateAIStatusBar();
  const result = document.getElementById('scan-result');
  if (result) {
    result.innerHTML = `<div style="background:#052e16;border:1px solid #16a34a;border-radius:12px;padding:18px;text-align:center;">
      <p style="color:#86efac;font-size:15px;font-weight:900;margin-bottom:6px;">PartSnap Pro enabled on this device</p>
      <p style="color:#bbf7d0;font-size:12px;line-height:1.5;">Scanner access is enabled on this device. Signed entitlement links sync access without trusting caller-supplied identity.</p>
    </div>`;
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
          <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:14px;">Manual code lookup, dosing, reports, filters, and checklists stay free. This store build is free-core only while native billing is finalized.</p>
          <button onclick="setScanMode('lookup');document.getElementById('scan-result').innerHTML=''" style="background:#0284c7;color:#fff;border:0;border-radius:10px;padding:11px 14px;font-size:12px;font-weight:800;cursor:pointer;width:100%;">Use Manual Lookup</button>
        </div>`;
    }
    return;
  }
  if (result) {
    result.innerHTML = `
      <div style="background:#1e293b;border:1px solid #7c3aed;border-radius:14px;padding:18px;margin:0 0 14px;text-align:center;border-left:4px solid #7c3aed;">
        <p style="color:#f1f5f9;font-size:19px;font-weight:900;margin-bottom:6px;">You've used ${usage.count} of ${SCAN_LIMIT_FREE} free AI scans this month.</p>
        <p style="color:#94a3b8;font-size:13px;line-height:1.5;margin-bottom:14px;">Manual code lookup, dosing, reports, filters, and checklists stay free. Upgrade PartSnap Pro for extended web scanner access on this device.</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">
          <a href="${PARTSNAP_MONTHLY_LINK}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('upgrade_click',{plan:'monthly'})" style="background:#0284c7;color:#fff;text-decoration:none;border-radius:10px;padding:12px 8px;font-size:13px;font-weight:900;">$4.99 / mo</a>
          <a href="${PARTSNAP_YEARLY_LINK}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('upgrade_click',{plan:'yearly'})" style="background:#16a34a;color:#fff;text-decoration:none;border-radius:10px;padding:12px 8px;font-size:13px;font-weight:900;">$39 / yr</a>
        </div>
        <p style="color:#64748b;font-size:10px;line-height:1.4;margin-top:10px;">After web checkout, use the signed activation link issued by SplashLens support. Store builds remain free-core until native billing is added.</p>
      </div>`;
  }
}

function trackSplashLensEvent(name, props = {}) {
  const clientId = getScanClientId();
  const attribution = getSplashLensAttribution();
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
    ...props,
  };
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event: name, ...eventProps, ts: new Date().toISOString() });
  if (window.plausible) window.plausible(name, { props: eventProps });

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
    const res = await fetch('/api/scan', {
      method:  'POST',
      headers,
      body:    JSON.stringify(withLanguageMetadata({ image: base64, mode, clientId: getScanClientId() })),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const { result: aiResult } = await res.json();
    recordAIScan(mode);

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

function renderPartsSnapResult(ai, result, status) {
  if (!result) return;
  _lastPartSnapResult = ai || {};
  const visibleEvidence = Array.isArray(_lastPartSnapResult.visibleEvidence) ? _lastPartSnapResult.visibleEvidence.filter(Boolean).slice(0, 4) : [];
  const missingProof = Array.isArray(_lastPartSnapResult.missingProof) ? _lastPartSnapResult.missingProof.filter(Boolean).slice(0, 4) : [];
  const alternates = Array.isArray(_lastPartSnapResult.alternates) ? _lastPartSnapResult.alternates.filter(Boolean).slice(0, 3) : [];
  const { manufacturer, category, component, model, partNumber, description, condition, replacementNotes, verificationNotes, searchTerms, confidence } = ai;
  const low = confidence === 'low';
  const notes = verificationNotes || replacementNotes;

  if (status) status.textContent = low ? 'PART NOT IDENTIFIED — TRY CLOSER' : `POSSIBLE MATCH: ${component || 'Unknown part'}`;

  if (status && status.textContent.startsWith('POSSIBLE MATCH:')) {
    status.textContent = status.textContent.replace('POSSIBLE MATCH:', 'POSSIBLE MATCH:');
  }

  const condColor = { new:'#16a34a', good:'#16a34a', worn:'#d97706', damaged:'#dc2626', unknown:'#64748b' }[condition] || '#64748b';

  const ladder = partConfidenceLadder(confidence, partNumber, manufacturer, model, component);
  const risk = partSnapCallbackRisk(_lastPartSnapResult, ladder, visibleEvidence, missingProof);
  const buyLinks = ladder.allowLinks ? renderPartBuyLinks(searchTerms, partNumber, manufacturer, component) : '';
  trackSplashLensEvent('partsnap_result', { confidence: confidence || 'unknown', category: category || 'unknown', risk: risk.level });

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
      ${renderPartConfidenceLadder(ladder)}
      ${renderPartEvidencePanel(visibleEvidence, missingProof)}
      ${renderPartSnapCallbackRisk(risk)}
      ${renderPartAlternates(alternates)}
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
      ${low ? `<p style="color:#64748b;font-size:12px;margin-top:12px;text-align:center;">Try getting closer, better lighting, or a different angle</p>` : ''}
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
}

function renderPartEvidencePanel(visibleEvidence, missingProof) {
  if (!visibleEvidence.length && !missingProof.length) return '';
  const list = (items, color) => items.map(item => `<li style="color:${color};font-size:11px;line-height:1.35;margin-bottom:4px;">${escHtml(item)}</li>`).join('');
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:10px 0;">
      <div style="background:#052e2b;border:1px solid #0f766e;border-radius:8px;padding:10px;">
        <p style="color:#5eead4;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Visible proof</p>
        <ul style="padding-left:14px;margin:0;">${visibleEvidence.length ? list(visibleEvidence, '#ccfbf1') : '<li style="color:#94a3b8;font-size:11px;">No strong visible proof yet</li>'}</ul>
      </div>
      <div style="background:#431407;border:1px solid #b45309;border-radius:8px;padding:10px;">
        <p style="color:#fdba74;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;margin-bottom:6px;">Next proof</p>
        <ul style="padding-left:14px;margin:0;">${missingProof.length ? list(missingProof, '#fed7aa') : '<li style="color:#94a3b8;font-size:11px;">No extra proof listed</li>'}</ul>
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
    label: `${level.toUpperCase()} CALLBACK RISK`,
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
        <p style="color:#e2e8f0;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.06em;">Callback Risk Score</p>
        <span style="background:${risk.color};color:#fff;border-radius:999px;padding:2px 8px;font-size:9px;font-weight:950;">${risk.level.toUpperCase()}</span>
      </div>
      <p style="color:#94a3b8;font-size:11px;line-height:1.4;margin-bottom:6px;">${reasons.map(escHtml).join(' ')}</p>
      <p style="color:#fbbf24;font-size:11px;line-height:1.4;"><strong>Before ordering:</strong> ${missing.map(escHtml).join(', ')}</p>
    </div>`;
}

function renderPartSnapPartnerCards(ai = {}) {
  const cards = [
    ['counter', 'Senior Tech / Vendor Packet', 'Ready', 'One tap packet with proof, missing evidence, risk, and exact questions for a senior tech, distributor, or vendor.'],
    ['verified', 'Partner-Verified Card', 'Ready for partner', 'A manufacturer/distributor intake card that shows what official docs or model language would be needed before SplashLens marks it verified.'],
    ['training', 'Training Scenario Card', 'Ready', 'Turns the result into a 5-minute apprentice lesson with student task, proof checklist, and answer key.'],
    ['passport', 'Service Proof Passport', 'Ready', 'Save the part result into a customer/pool history so callbacks and reorders have field proof attached.'],
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
    counter: 'Senior Tech / Vendor Packet',
    verified: 'Partner-Verified Card Intake',
    training: 'Training Scenario Card',
    passport: 'Service Proof Passport',
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
      `Callback risk: ${risk.level}`,
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
      'Service Proof Passport note',
      '',
      `Saved item: ${[ai.manufacturer, ai.component, ai.model || ai.partNumber].filter(Boolean).join(' / ') || 'PartSnap result'}`,
      `Callback risk: ${risk.level}`,
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
        <p style="color:#7c2d12;font-size:12px;line-height:1.4;margin-bottom:10px;">PartSnap proof saves into Service Proof Passport so the tech can find it later by customer.</p>
        <button onclick="showTab('pools')" style="width:100%;background:#0f766e;color:#fff;border:none;border-radius:10px;padding:10px;font-size:12px;font-weight:900;cursor:pointer;">Go to Pools</button>
      </div>`;
    return;
  }
  panel.innerHTML = `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:12px;margin:4px 0 16px;">
      <p style="color:#0f172a;font-size:14px;font-weight:950;margin-bottom:5px;">Save PartSnap to Service Proof Passport</p>
      <p style="color:#64748b;font-size:12px;line-height:1.4;margin-bottom:10px;">Attach this result to a customer record with the proof, callback risk, and vendor packet.</p>
      <label class="field-label" for="partsnap-save-pool">Saved pool</label>
      <select id="partsnap-save-pool" style="width:100%;padding:10px;border:1px solid #cbd5e1;border-radius:8px;margin-bottom:10px;">
        ${pools.map(p => `<option value="${escHtml(p.id)}">${escHtml([p.name, p.address].filter(Boolean).join(' - ') || 'Saved pool')}</option>`).join('')}
      </select>
      <button onclick="confirmPartSnapSaveToPool()" style="width:100%;background:#0284c7;color:#fff;border:none;border-radius:10px;padding:11px;font-size:13px;font-weight:900;cursor:pointer;">Save Proof Passport</button>
      <p id="partsnap-save-status" style="color:#64748b;font-size:11px;text-align:center;margin-top:8px;"></p>
    </div>`;
}

function confirmPartSnapSaveToPool() {
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
    confidence: `${ai.confidence || 'unknown'} / ${risk.level} callback risk`,
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
  const result = document.getElementById('scan-result');
  const status = document.getElementById('scan-camera-status');
  if (status) status.textContent = 'SECOND PROOF: CAPTURE LABEL, MODEL PLATE, OR PART NUMBER';
  if (result) result.innerHTML = `
    <div style="background:#0f172a;border:1px solid #334155;border-radius:12px;padding:14px;margin:8px 0;text-align:center;">
      <p style="color:#e2e8f0;font-size:14px;font-weight:900;margin-bottom:6px;">Second proof photo</p>
      <p style="color:#94a3b8;font-size:12px;line-height:1.45;margin-bottom:10px;">Get the label, model plate, casting number, wiring label, or a wider shot that shows where the part lives.</p>
      <button onclick="setScanMode('parts')" style="background:#0f766e;color:#fff;border:none;border-radius:10px;padding:10px 18px;font-size:12px;font-weight:900;cursor:pointer;">Capture Second Proof</button>
    </div>`;
  trackSplashLensEvent('partsnap_second_proof_requested', { confidence: (_lastPartSnapResult || {}).confidence || 'unknown' });
}

function renderMysteryPartForm() {
  const panel = document.getElementById('partsnap-feedback-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div style="background:#ffffff;border:1px solid #bae6fd;border-radius:12px;padding:12px;margin:4px 0 16px;">
      <p style="color:#0f172a;font-size:14px;font-weight:950;margin-bottom:5px;">Send this mystery part to SplashLens</p>
      <p style="color:#64748b;font-size:12px;line-height:1.4;margin-bottom:10px;">Use this when PartSnap is low-confidence or you want the app trained around a real field miss.</p>
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
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">
        <a href="${outbound('leslies')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('affiliate_click',{store:'leslies'})" style="background:#0284c7;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">Leslie's</a>
        <a href="${outbound('intheswim')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('affiliate_click',{store:'intheswim'})" style="background:#0ea5e9;color:#fff;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">In The Swim</a>
        <a href="${outbound('poolsupplyworld')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('affiliate_click',{store:'poolsupplyworld'})" style="background:#334155;color:#e2e8f0;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;">Pool Supply World</a>
        <a href="${outbound('web')}" target="_blank" rel="noopener" onclick="trackSplashLensEvent('part_search_click',{store:'web'})" style="background:#0f172a;color:#7dd3fc;text-decoration:none;text-align:center;border-radius:8px;padding:9px 6px;font-size:12px;font-weight:900;border:1px solid #334155;">Search Web</a>
      </div>
      <p style="color:#64748b;font-size:10px;line-height:1.4;margin-top:8px;">Search links are for convenience only. Verify fit before ordering. If an affiliate tag is configured, SplashLens may earn a commission.</p>
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
  if (safeQuery.length >= 2 && scanCodeSearch._lastTracked !== safeQuery) {
    scanCodeSearch._lastTracked = safeQuery;
    trackSplashLensEvent('manual_code_search', { query: safeQuery, brand: _scanBrand || 'all' });
  }
  const hits = searchErrorDB(query, _scanBrand);
  el.innerHTML = renderScanHits(hits, query);
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
