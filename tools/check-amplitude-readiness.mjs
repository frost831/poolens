const endpoints = {
  appStatus: 'https://app.splashlens.com/api/events',
  appConfig: 'https://app.splashlens.com/api/amplitude-config',
  siteStatus: 'https://splashlens.com/api/event',
  siteConfig: 'https://splashlens.com/api/amplitude-config',
};

function line(label, value) {
  console.log(`${label}: ${value}`);
}

async function getJson(url) {
  const response = await fetch(url, { cache: 'no-store' });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { ok: response.ok, status: response.status, json };
}

async function postSmoke(url, payload) {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  return { ok: response.ok, status: response.status, json };
}

function classify(results) {
  const availabilityOk = results.appStatus.ok && results.siteStatus.ok && results.appConfig.ok && results.siteConfig.ok;
  const appConfigured = results.appConfig.json.enabled === true || results.appSmoke.json.amplitudeConfigured === true;
  const siteConfigured = results.siteConfig.json.enabled === true || results.siteSmoke.json.amplitudeConfigured === true;
  const appQueued = results.appSmoke.json.amplitudeQueued === true;
  const siteQueued = results.siteSmoke.json.amplitudeQueued === true;

  if (!availabilityOk) return 'RED: one or more live endpoints failed.';
  if (appConfigured && siteConfigured && appQueued && siteQueued) return 'GREEN: app and site are forwarding smoke events to Amplitude.';
  if (!appConfigured || !siteConfigured) return 'YELLOW: code is deployed, but Cloudflare is missing AMPLITUDE_API_KEY on one or both projects.';
  return 'YELLOW: Amplitude appears configured, but a smoke event did not confirm forwarding.';
}

async function main() {
  const stamp = new Date().toISOString();
  const smokeProps = {
    synthetic: true,
    test: true,
    source: 'amplitude_readiness_script',
    attribution_source: 'amplitude_readiness_script',
    attribution_campaign: 'splashlens_amplitude_readiness',
    known_company: 'SplashLens Internal',
    known_role: 'owner',
    identity_confidence: 'synthetic-smoke',
    client_id: `smoke-${stamp}`,
  };

  const results = {
    appStatus: await getJson(endpoints.appStatus),
    appConfig: await getJson(endpoints.appConfig),
    siteStatus: await getJson(endpoints.siteStatus),
    siteConfig: await getJson(endpoints.siteConfig),
    appSmoke: await postSmoke(endpoints.appStatus, {
      event: 'amplitude_readiness_smoke',
      source: 'app',
      path: '/amplitude-readiness',
      props: smokeProps,
    }),
    siteSmoke: await postSmoke(endpoints.siteStatus, {
      event: 'amplitude_readiness_smoke',
      source: 'site',
      path: '/amplitude-readiness',
      props: smokeProps,
    }),
  };

  line('Checked at', stamp);
  line('App endpoint', `${results.appStatus.status} storage=${results.appStatus.json.storageConfigured} email=${results.appStatus.json.emailConfigured} amplitude=${results.appStatus.json.amplitudeConfigured}`);
  line('App config', `${results.appConfig.status} enabled=${results.appConfig.json.enabled} status=${results.appConfig.json.status || 'unknown'}`);
  line('App smoke', `${results.appSmoke.status} stored=${results.appSmoke.json.stored} amplitudeQueued=${results.appSmoke.json.amplitudeQueued} amplitudeConfigured=${results.appSmoke.json.amplitudeConfigured}`);
  line('Site endpoint', `${results.siteStatus.status} stored=${results.siteStatus.json.stored} fresh=${results.siteStatus.json.fresh} amplitude=${results.siteStatus.json.amplitudeConfigured}`);
  line('Site config', `${results.siteConfig.status} enabled=${results.siteConfig.json.enabled} status=${results.siteConfig.json.status || 'unknown'}`);
  line('Site smoke', `${results.siteSmoke.status} funnelForwarded=${results.siteSmoke.json.funnelForwarded} amplitudeQueued=${results.siteSmoke.json.amplitudeQueued} amplitudeConfigured=${results.siteSmoke.json.amplitudeConfigured}`);
  line('Classification', classify(results));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
