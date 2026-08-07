import { writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const outputPath = resolve('docs', `SPLASHLENS_GROWTH_PLAN_RUN_${new Date().toISOString().slice(0, 10)}.md`);

async function getJson(url, options = {}) {
  const response = await fetch(url, { cache: 'no-store', ...options });
  const text = await response.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    data = { raw: text.slice(0, 500) };
  }
  return { url, ok: response.ok && data.ok !== false, status: response.status, data };
}

async function postJson(url, body) {
  return getJson(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

function yes(value) {
  return value ? 'YES' : 'NO';
}

function line(label, value) {
  return `- ${label}: ${value}`;
}

function topRows(rows = []) {
  if (!rows.length) return '- None reported.';
  return rows.slice(0, 8).map((row) => `- ${row.event || row.name || 'unknown'}: ${row.count || 0}`).join('\n');
}

function classify({ appEvents, siteEvents, appAmp, siteAmp, checkout }) {
  const failures = [];
  if (!appEvents.ok) failures.push('app event endpoint');
  if (!siteEvents.ok) failures.push('site event endpoint');
  if (!checkout.data?.productionReady) failures.push('checkout production readiness');
  const missing = [];
  if (!appAmp.data?.enabled) missing.push('app Amplitude key');
  if (!siteAmp.data?.enabled) missing.push('site Amplitude key');
  if (failures.length) return `RED: fix ${failures.join(', ')} before heavy traffic.`;
  if (missing.length) return `YELLOW: live funnel works, but ${missing.join(' and ')} must be added for Amplitude charts.`;
  return 'GREEN: first-party funnel, checkout, and Amplitude are all live.';
}

async function main() {
  const stamp = new Date().toISOString();
  const smokeProps = {
    synthetic: true,
    test: true,
    source: 'growth_plan_run',
    attribution_source: 'growth_plan_run',
    attribution_campaign: 'splashlens_growth_plan',
    known_company: 'SplashLens Internal',
    identity_confidence: 'synthetic-smoke',
    client_id: `growth-plan-${stamp}`,
  };

  const [appEvents, siteEvents, appAmp, siteAmp, checkout, monthlyCheckout, yearlyCheckout] = await Promise.all([
    getJson('https://app.splashlens.com/api/events'),
    getJson('https://splashlens.com/api/event'),
    getJson('https://app.splashlens.com/api/amplitude-config'),
    getJson('https://splashlens.com/api/amplitude-config'),
    getJson('https://app.splashlens.com/api/checkout-readiness'),
    fetch('https://app.splashlens.com/api/checkout?plan=monthly', { redirect: 'manual' }),
    fetch('https://app.splashlens.com/api/checkout?plan=yearly', { redirect: 'manual' }),
  ]);

  const [appSmoke, siteSmoke] = await Promise.all([
    postJson('https://app.splashlens.com/api/events', {
      event: 'growth_plan_smoke',
      source: 'app',
      path: '/growth-plan',
      props: smokeProps,
    }),
    postJson('https://splashlens.com/api/event', {
      event: 'growth_plan_smoke',
      source: 'site',
      path: '/growth-plan',
      props: smokeProps,
    }),
  ]);

  const checkoutData = checkout.data || {};
  const webhook = checkoutData.webhook || {};
  const paymentLinks = checkoutData.paymentLinks || {};
  const classification = classify({ appEvents, siteEvents, appAmp, siteAmp, checkout });

  const report = [
    '# SplashLens Growth Plan Run',
    '',
    `Generated: ${stamp}`,
    '',
    '## Classification',
    '',
    classification,
    '',
    '## Question',
    '',
    'Can SplashLens tell which attention sources turn into real app use, first useful workflow, proof/feedback, and paid conversion?',
    '',
    '## Tracked',
    '',
    line('App event endpoint', `${appEvents.status} storage=${yes(appEvents.data?.storageConfigured)} email=${yes(appEvents.data?.emailConfigured)}`),
    line('Site event endpoint', `${siteEvents.status} stored=${yes(siteEvents.data?.stored)} fresh=${yes(siteEvents.data?.fresh)}`),
    line('Site public 7d events', siteEvents.data?.events_7d ?? 'unknown'),
    line('Site public 30d events', siteEvents.data?.events_30d ?? 'unknown'),
    line('App smoke stored', `${appSmoke.status} stored=${yes(appSmoke.data?.stored)} amplitudeQueued=${yes(appSmoke.data?.amplitudeQueued)}`),
    line('Site smoke stored', `${siteSmoke.status} funnelForwarded=${yes(siteSmoke.data?.funnelForwarded)} amplitudeQueued=${yes(siteSmoke.data?.amplitudeQueued)}`),
    line('Stripe readiness', `productionReady=${yes(checkoutData.productionReady)} mode=${checkoutData.checkoutMode || 'unknown'}`),
    line('Stripe account', `ok=${yes(checkoutData.stripe?.ok)} charges=${yes(checkoutData.stripe?.chargesEnabled)} payouts=${yes(checkoutData.stripe?.payoutsEnabled)}`),
    line('Webhook', `ok=${yes(webhook.ok)} status=${webhook.endpointStatus || 'unknown'} missingEvents=${(webhook.missingEvents || []).length}`),
    line('Payment links', `ok=${yes(paymentLinks.ok)} configured=${paymentLinks.configured || 0} active=${paymentLinks.active || 0}`),
    line('Monthly checkout redirect', `${monthlyCheckout.status} ${monthlyCheckout.headers.get('location') || ''}`),
    line('Yearly checkout redirect', `${yearlyCheckout.status} ${yearlyCheckout.headers.get('location') || ''}`),
    '',
    '## Missing',
    '',
    appAmp.data?.enabled ? '- App Amplitude key is present.' : '- App Amplitude key is missing in Cloudflare Pages project `poolens`.',
    siteAmp.data?.enabled ? '- Site Amplitude key is present.' : '- Site Amplitude key is missing in Cloudflare Pages project `poolens-site`.',
    '- Protected owner-dashboard KPI snapshot was not pulled unless a stats secret is entered in the dashboard or supplied through a secure local env.',
    '',
    '## Broken',
    '',
    checkoutData.productionReady ? '- No payment readiness blocker found in public probes.' : '- Checkout readiness did not report production ready.',
    appEvents.ok && siteEvents.ok ? '- No first-party event endpoint outage found.' : '- One or more event endpoints failed.',
    appAmp.data?.enabled && siteAmp.data?.enabled ? '- No Amplitude activation blocker found.' : '- Amplitude ingestion is not active until the real SplashLens Amplitude API key is added to both Cloudflare projects.',
    '',
    '## Event Plan',
    '',
    '1. Keep all outreach, paid, podcast, magazine, and partner links tagged with `attribution_source`, `attribution_campaign`, and a stable `client_id` or `lead_id` when lawful.',
    '2. Count `campaign_landing_view`, `article_referral_open`, `open_app_click`, `app_store_download_click`, and `google_play_download_click` as attention and intent.',
    '3. Count `first_app_open`, `app_open`, `native_shell_first_open`, and `pwa_standalone_open` as app arrival.',
    '4. Count `manual_code_search`, `partsnap_result`, `facility_workflow_completed`, `service_report_saved`, and `proof_ready_report_saved` as first useful work.',
    '5. Count `partsnap_saved_to_pool`, `service_proof_share_link_created`, `service_proof_customer_summary_copied`, and `service_proof_json_exported` as proof value.',
    '6. Count `field_feedback_submitted`, `field_feedback_quick_answered`, and `field_challenge_feedback` as roadmap feedback.',
    '7. Count `checkout_click`, `upgrade_click`, and `checkout_started` as paid intent, but only `checkout_success` as paid conversion.',
    '8. Review the owner dashboard daily for top sources, top campaigns, known users, anonymous clients, PartSnap source-backed versus AI-only results, checkout starts, paid conversions, and seven-day returns.',
    '',
    '## Next Seven Days',
    '',
    '1. Add the real SplashLens Amplitude API key to both Cloudflare Pages projects.',
    '2. Rerun `node tools\\check-amplitude-readiness.mjs` until GREEN.',
    '3. Use `https://splashlens.com/campaign` or `https://splashlens.com/paid-media` for every serious send, not the broad homepage.',
    '4. Send the CTA as a field challenge: run one real code, part, or equipment family.',
    '5. Push the first paid ask only after a useful PartSnap/proof moment, not on first page load.',
    '6. Call any checkout-click-without-checkout-success pattern a copy/pricing/checkout friction issue and inspect the flow.',
    '7. Make the next homepage/app emphasis follow the highest first-value workflow, not opinion.',
    '',
    '## Public Site Top Events',
    '',
    topRows(siteEvents.data?.top_events || []),
    '',
    '## Confidence',
    '',
    checkoutData.productionReady && appEvents.ok && siteEvents.ok
      ? 'High for first-party event capture and Stripe readiness. Medium for full behavior analytics until Amplitude key is installed and the protected dashboard is reviewed with the stats secret.'
      : 'Medium. Fix the broken public probes before interpreting campaign performance.',
    '',
  ].join('\n');

  await writeFile(outputPath, report, 'utf8');
  console.log(report);
  console.log(`\nWrote ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
