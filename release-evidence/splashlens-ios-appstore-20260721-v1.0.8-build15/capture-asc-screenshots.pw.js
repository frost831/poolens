async (page) => {
  const outDir = '/Users/macbookpro/SplashLens-asc-subscription-finish-2026-07-04/release-evidence/splashlens-ios-appstore-20260721-v1.0.8-build15/asc-screenshots';

  const browser = page.context().browser();
  const context = await browser.newContext({
    viewport: { width: 440, height: 956 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1',
    colorScheme: 'light'
  });
  const shotPage = await context.newPage();
  shotPage.setDefaultTimeout(45000);
  await shotPage.goto('https://app.splashlens.com/?store=ios&mode=trainer&utm_source=asc_screenshot', { waitUntil: 'domcontentloaded' });
  await shotPage.waitForLoadState('networkidle', { timeout: 45000 }).catch(() => {});
  await shotPage.waitForFunction(() => typeof window.showTab === 'function' && typeof window.renderFieldLearningOS === 'function', { timeout: 45000 });

  async function suppressFeedback() {
    await shotPage.evaluate(() => {
      const state = {
        submittedAt: Date.now(),
        snoozedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
        quickSnoozedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
        meaningfulActions: 0
      };
      localStorage.setItem('splashlens-field-feedback-state', JSON.stringify(state));
      document.getElementById('field-feedback-overlay')?.remove();
      document.getElementById('field-quick-feedback')?.remove();
    });
  }
  await suppressFeedback();
  await shotPage.evaluate(() => {
    window.localStorage.setItem('splashlens-role', 'trainer');
    window.localStorage.setItem('splashlens-field-feedback-state', JSON.stringify({
      submittedAt: Date.now(),
      snoozedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
      quickSnoozedUntil: Date.now() + 30 * 24 * 60 * 60 * 1000,
      meaningfulActions: 0
    }));
    if (typeof window.setSplashLensRole === 'function') {
      window.setSplashLensRole('trainer', { persist: false, forced: true, source: 'asc_screenshot' });
    }
  });
  await shotPage.waitForTimeout(300);
  await suppressFeedback();

  async function settle() {
    await shotPage.waitForTimeout(900);
    await shotPage.evaluate(() => {
      document.documentElement.style.scrollBehavior = 'auto';
      document.body.style.scrollBehavior = 'auto';
    });
  }

  async function save(name) {
    await suppressFeedback();
    await settle();
    await suppressFeedback();
    await shotPage.screenshot({ path: `${outDir}/${name}`, fullPage: false });
  }

  await shotPage.evaluate(() => {
    if (typeof window.showTab === 'function') window.showTab('scan');
    if (typeof window.setScanMode === 'function') window.setScanMode('parts');
    const result = document.getElementById('scan-result');
    const status = document.getElementById('scan-status');
    const sample = {
      manufacturer: 'Possible Pentair family',
      category: 'Pump lid / basket assembly',
      component: 'Pump strainer lid assembly',
      model: 'Model plate still needed',
      partNumber: '',
      description: 'Shape and lid tab pattern suggest a common pump-lid family, but the model plate and second proof photo are still required before ordering.',
      condition: 'worn',
      replacementNotes: 'Do not order from photo alone. Verify label, dimensions, gasket shape, and the current parts diagram.',
      verificationNotes: 'Capture wide equipment context, model/serial plate, molded markings, and a second proof angle.',
      searchTerms: ['pump strainer lid', 'model plate', 'lid gasket verification'],
      confidence: 'medium',
      visibleEvidence: ['Clear lid shape', 'Visible locking tabs', 'Basket housing context'],
      missingProof: ['Model/serial plate', 'Part number marking', 'Second proof photo'],
      corpusStatus: { label: 'source-backed candidates' },
      corpusCandidates: [
        { title: 'Pump lid family candidate', matchLevel: 'family', sourceTier: 'manual/catalog', why: 'Lid outline and tab placement look similar; model plate still required.' },
        { title: 'Basket assembly candidate', matchLevel: 'component', sourceTier: 'parts diagram', why: 'Housing shape suggests strainer assembly; dimensions still missing.' }
      ],
      alternates: ['Similar lid with different gasket profile', 'Aftermarket lid variant'],
      escalationSummary: 'Send wide pad photo, close-up lid, model plate, and symptom note to senior tech or vendor before ordering.'
    };
    if (typeof window.renderPartsSnapResult === 'function') window.renderPartsSnapResult(sample, result, status);
    document.querySelector('.role-picker')?.remove();
    document.getElementById('scan-result')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -80);
  });
  await save('01-partsnap-source-proof.png');

  await shotPage.evaluate(() => {
    window.renderFieldLearningOS('partsnap');
    const detail = document.querySelector('#rpt-proof-os-output details');
    if (detail) detail.open = true;
    document.getElementById('rpt-proof-os-output')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -90);
  });
  await save('02-field-learning-partsnap-lesson.png');

  await shotPage.evaluate(() => {
    window.renderFieldLearningOS('facility');
    const detail = document.querySelector('#rpt-proof-os-output details');
    if (detail) detail.open = true;
    document.getElementById('rpt-proof-os-output')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -90);
  });
  await save('03-cpo-scenario-answer-key.png');

  await shotPage.evaluate(() => {
    window.startServiceProofWorkflow('visit');
  });
  await shotPage.waitForTimeout(250);
  await shotPage.evaluate(() => {
    const fields = {
      'rpt-customer': 'Smith Residence',
      'rpt-address': '123 Main St, Anytown IL',
      'rpt-tech': 'SplashLens Tech',
      'rpt-fc': '3.2',
      'rpt-ph': '7.5',
      'rpt-photo-proof': 'wide pad photo, water reading photo, customer-safe summary',
      'rpt-issue-note': 'Visit documented: readings checked, equipment observed, and follow-up proof noted before any repair decision.',
      'rpt-customer-summary': 'Water was tested and the visit was documented. Any repair or part decision still needs label, manual, and qualified service verification.'
    };
    for (const [id, value] of Object.entries(fields)) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.value = value;
      el.dispatchEvent(new Event('input', { bubbles: true }));
        el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    for (const id of ['rpt-proof-water', 'rpt-proof-equipment', 'rpt-proof-summary']) {
      const el = document.getElementById(id);
      if (!el) continue;
      el.checked = true;
      el.dispatchEvent(new Event('change', { bubbles: true }));
    }
    if (typeof window.validateReportProof === 'function') window.validateReportProof({ quiet: true });
    if (typeof window.previewServiceTrustPortal === 'function') window.previewServiceTrustPortal();
    document.getElementById('rpt-proof-os-output')?.scrollIntoView({ block: 'start' });
    window.scrollBy(0, -90);
  });
  await save('04-service-proof-handoff.png');

  await context.close();
  return {
    outDir,
    files: [
      '01-partsnap-source-proof.png',
      '02-field-learning-partsnap-lesson.png',
      '03-cpo-scenario-answer-key.png',
      '04-service-proof-handoff.png'
    ]
  };
}
