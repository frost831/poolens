const PLAN_CATALOG = {
  partsnap_pro_monthly: {
    key: 'partsnap_pro_monthly',
    aliases: ['monthly', 'part-snap-monthly', 'partsnap-monthly', 'partsnap_pro'],
    displayName: 'PartSnap Pro Monthly',
    feature: 'partsnap_pro',
    publicStatus: 'live',
    defaultPriceId: 'price_1TbAp725fqLun6cVz5lhOiiS',
    defaultPaymentLinkUrl: 'https://buy.stripe.com/7sY7sE2aIaq31cE5EF8AE0O',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_PARTSNAP_PRO_MONTHLY', 'SPLASHLENS_STRIPE_PRICE_MONTHLY', 'STRIPE_PRICE_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_PARTSNAP_PRO_MONTHLY', 'SPLASHLENS_STRIPE_LINK_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_PARTSNAP_PRO_MONTHLY_ID', 'SPLASHLENS_STRIPE_PAYMENT_LINK_MONTHLY_ID'],
    scopes: ['scan'],
    activationTab: 'scan',
    restoreSubject: 'Restore your SplashLens PartSnap Pro access',
  },
  partsnap_pro_annual: {
    key: 'partsnap_pro_annual',
    aliases: ['yearly', 'annual', 'part-snap-annual', 'partsnap-annual', 'partsnap_pro_yearly'],
    displayName: 'PartSnap Pro Annual',
    feature: 'partsnap_pro',
    publicStatus: 'live',
    defaultPriceId: 'price_1TbAp825fqLun6cVoVG0wqQl',
    defaultPaymentLinkUrl: 'https://buy.stripe.com/aFa28k9Da69NdZq3wx8AE0P',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_PARTSNAP_PRO_ANNUAL', 'SPLASHLENS_STRIPE_PRICE_YEARLY', 'STRIPE_PRICE_YEARLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_PARTSNAP_PRO_ANNUAL', 'SPLASHLENS_STRIPE_LINK_YEARLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_PARTSNAP_PRO_ANNUAL_ID', 'SPLASHLENS_STRIPE_PAYMENT_LINK_YEARLY_ID', 'SPLASHLENS_STRIPE_PAYMENT_LINK_ANNUAL_ID'],
    scopes: ['scan'],
    activationTab: 'scan',
    restoreSubject: 'Restore your SplashLens PartSnap Pro access',
  },
  service_proof_pro_monthly: {
    key: 'service_proof_pro_monthly',
    aliases: ['service-proof-pro', 'service_proof_pro', 'proof_pro', 'service-proof'],
    displayName: 'Service Proof Pro',
    feature: 'service_proof_pro',
    publicStatus: 'pilot',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_SERVICE_PROOF_PRO_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_SERVICE_PROOF_PRO_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_SERVICE_PROOF_PRO_MONTHLY_ID'],
    scopes: ['scan', 'service_proof', 'proof_packets', 'exports'],
    activationTab: 'report',
    restoreSubject: 'Restore your SplashLens Service Proof Pro access',
  },
  team_proof_os_monthly: {
    key: 'team_proof_os_monthly',
    aliases: ['team-proof-os', 'team_proof_os', 'team', 'team_proof'],
    displayName: 'Team Proof OS',
    feature: 'team_proof_os',
    publicStatus: 'pilot',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_TEAM_PROOF_OS_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_TEAM_PROOF_OS_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_TEAM_PROOF_OS_MONTHLY_ID'],
    scopes: ['scan', 'service_proof', 'proof_packets', 'exports', 'team_dashboard'],
    activationTab: 'pools',
    restoreSubject: 'Restore your SplashLens Team Proof OS access',
  },
  facility_cpo_pilot_monthly: {
    key: 'facility_cpo_pilot_monthly',
    aliases: ['facility-cpo', 'facility_cpo', 'facility', 'cpo', 'facility_pilot'],
    displayName: 'Facility / CPO Pilot',
    feature: 'facility_cpo_pilot',
    publicStatus: 'pilot',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_FACILITY_CPO_PILOT_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_FACILITY_CPO_PILOT_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_FACILITY_CPO_PILOT_MONTHLY_ID'],
    scopes: ['scan', 'facility_assist', 'service_proof', 'proof_packets', 'exports'],
    activationTab: 'report',
    restoreSubject: 'Restore your SplashLens Facility / CPO Pilot access',
  },
  verified_manufacturer_cards_monthly: {
    key: 'verified_manufacturer_cards_monthly',
    aliases: ['verified-cards', 'verified_cards', 'manufacturer_cards', 'manufacturer'],
    displayName: 'Verified Manufacturer Cards',
    feature: 'verified_manufacturer_cards',
    publicStatus: 'partner',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_VERIFIED_MANUFACTURER_CARDS_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_VERIFIED_MANUFACTURER_CARDS_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_VERIFIED_MANUFACTURER_CARDS_MONTHLY_ID'],
    scopes: ['partner_cards', 'service_proof', 'proof_packets'],
    activationTab: 'route',
    restoreSubject: 'Restore your SplashLens Verified Manufacturer Cards access',
  },
  distributor_counter_mode_monthly: {
    key: 'distributor_counter_mode_monthly',
    aliases: ['counter-mode', 'counter', 'distributor', 'distributor_counter'],
    displayName: 'Distributor / Counter Mode',
    feature: 'distributor_counter_mode',
    publicStatus: 'pilot',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_DISTRIBUTOR_COUNTER_MODE_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_DISTRIBUTOR_COUNTER_MODE_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_DISTRIBUTOR_COUNTER_MODE_MONTHLY_ID'],
    scopes: ['scan', 'counter_packets', 'service_proof', 'proof_packets'],
    activationTab: 'scan',
    restoreSubject: 'Restore your SplashLens Distributor / Counter Mode access',
  },
  training_partner_layer_monthly: {
    key: 'training_partner_layer_monthly',
    aliases: ['training', 'training_partner', 'training-layer', 'trainer'],
    displayName: 'Training Partner Layer',
    feature: 'training_partner_layer',
    publicStatus: 'partner',
    priceEnv: ['SPLASHLENS_STRIPE_PRICE_TRAINING_PARTNER_LAYER_MONTHLY'],
    linkEnv: ['SPLASHLENS_STRIPE_LINK_TRAINING_PARTNER_LAYER_MONTHLY'],
    paymentLinkIdEnv: ['SPLASHLENS_STRIPE_PAYMENT_LINK_TRAINING_PARTNER_LAYER_MONTHLY_ID'],
    scopes: ['training', 'facility_assist', 'service_proof', 'proof_packets'],
    activationTab: 'guide',
    restoreSubject: 'Restore your SplashLens Training Partner Layer access',
  },
};

const ALIAS_MAP = new Map();
for (const plan of Object.values(PLAN_CATALOG)) {
  ALIAS_MAP.set(plan.key, plan.key);
  for (const alias of plan.aliases || []) ALIAS_MAP.set(alias, plan.key);
}

function clean(value, max = 180) {
  return String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, max);
}

function envValue(env, names = []) {
  for (const name of names) {
    const value = clean(env?.[name], 500);
    if (value) return value;
  }
  return '';
}

export function resolveSplashLensPlan(value = 'monthly') {
  const normalized = clean(value || 'monthly', 120)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  return PLAN_CATALOG[ALIAS_MAP.get(normalized) || normalized] || PLAN_CATALOG.partsnap_pro_monthly;
}

export function splashLensPlanByKey(key) {
  return PLAN_CATALOG[key] || null;
}

export function splashLensPlans() {
  return Object.values(PLAN_CATALOG).map((plan) => ({ ...plan, aliases: [...(plan.aliases || [])], scopes: [...(plan.scopes || [])] }));
}

export function splashLensCheckoutPrice(env, plan) {
  return envValue(env, plan.priceEnv) || plan.defaultPriceId || '';
}

export function splashLensPaymentLinkUrl(env, plan) {
  return envValue(env, plan.linkEnv) || plan.defaultPaymentLinkUrl || '';
}

export function splashLensAllowedPaymentLinkIds(env) {
  const entries = [];
  for (const plan of Object.values(PLAN_CATALOG)) {
    for (const envName of plan.paymentLinkIdEnv || []) {
      const id = clean(env?.[envName], 120);
      if (id) entries.push([id, plan]);
    }
  }
  return new Map(entries);
}

export function splashLensPlanFromSession(session, env) {
  const metadata = session?.metadata || {};
  if (metadata.plan_key) return resolveSplashLensPlan(metadata.plan_key);
  if (metadata.plan) {
    const exact = Object.values(PLAN_CATALOG).find((plan) => plan.displayName.toLowerCase() === clean(metadata.plan, 120).toLowerCase());
    return exact || resolveSplashLensPlan(metadata.plan);
  }

  const paymentLink = clean(session?.payment_link, 120);
  const allowed = splashLensAllowedPaymentLinkIds(env);
  if (paymentLink && allowed.has(paymentLink)) return allowed.get(paymentLink);

  const amount = Number(session?.amount_total || 0);
  if (amount >= 3900) return PLAN_CATALOG.partsnap_pro_annual;
  return PLAN_CATALOG.partsnap_pro_monthly;
}

export function splashLensActivationUrl(token, plan) {
  const tab = clean(plan?.activationTab || 'scan', 40) || 'scan';
  return `https://app.splashlens.com/?tab=${encodeURIComponent(tab)}&scan_token=${encodeURIComponent(token)}`;
}

export function splashLensPlanPublicPayload(env = {}) {
  return splashLensPlans().map((plan) => ({
    key: plan.key,
    displayName: plan.displayName,
    feature: plan.feature,
    publicStatus: plan.publicStatus,
    scopes: plan.scopes,
    checkoutConfigured: Boolean(splashLensCheckoutPrice(env, plan) || splashLensPaymentLinkUrl(env, plan)),
    hasDefaultLiveCheckout: Boolean(plan.defaultPriceId || plan.defaultPaymentLinkUrl),
  }));
}

