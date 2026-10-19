import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { DatabaseSync } from 'node:sqlite';
import test from 'node:test';
import { onRequestPost as webhook } from '../functions/api/stripe-webhook.js';
import { onRequestGet as success } from '../functions/api/checkout-success.js';

const signingSecret = 'whsec_billing_period_fixture';
const session = { id:'cs_test_period', customer:'cus_period', subscription:'sub_period', mode:'subscription', payment_status:'paid', customer_details:{email:'qa@example.invalid'}, metadata:{product:'splashlens',feature:'scanner',plan:'Splash Lens Pro Unlimited Monthly'} };
const end = Math.floor(Date.now()/1000)+30*86400;
function environment() {
  const sqlite=new DatabaseSync(':memory:',{enableDoubleQuotedStringLiterals:true});
  const db={prepare(sql){const s=sqlite.prepare(sql);const wrap=(v)=>({async run(){return s.run(...v);},async first(){return s.get(...v)||null;},async all(){return {results:s.all(...v)};}});return {...wrap([]),bind(...v){return wrap(v);}};}};
  return {sqlite,env:{SUBSCRIBERS_DB:db,STRIPE_SECRET_KEY:'sk_test_fixture',SPLASHLENS_STRIPE_WEBHOOK_SECRET:signingSecret,SPLASHLENS_ENTITLEMENT_SECRET:'billing-period-fixture-long-secret-12345'}};
}
async function deliver(env,type,object,id) {
  const body=JSON.stringify({id,type,data:{object}});
  const ts=Math.floor(Date.now()/1000);
  const sig=createHmac('sha256',signingSecret).update(`${ts}.${body}`).digest('hex');
  return webhook({env,request:new Request('https://example.invalid/api/stripe-webhook',{method:'POST',headers:{'stripe-signature':`t=${ts},v1=${sig}`},body})});
}
test('monthly webhook never records token expiry as a billing period; verified checkout repairs an existing wrong date',async t=>{
  const {env,sqlite}=environment();t.after(()=>sqlite.close());
  assert.equal((await deliver(env,'checkout.session.completed',session,'evt_period_checkout')).status,200);
  assert.equal(sqlite.prepare('SELECT current_period_end FROM commercial_entitlements').get().current_period_end,null);
  sqlite.prepare('UPDATE commercial_entitlements SET current_period_end=?').run(new Date(Date.now()+365*86400000).toISOString());
  t.mock.method(globalThis,'fetch',async url=>Response.json(String(url).includes('/checkout/sessions/')?session:{status:'active',items:{data:[{current_period_end:end}]}}));
  const response=await success({env,request:new Request('https://example.invalid/api/checkout-success?session_id=cs_test_period')});
  assert.equal(response.status,200);
  assert.equal(sqlite.prepare('SELECT current_period_end FROM commercial_entitlements').get().current_period_end,new Date(end*1000).toISOString());
});
test('subscription lifecycle reads Stripe item billing dates and preserves them through checkout webhook ordering',async t=>{
  const {env,sqlite}=environment();t.after(()=>sqlite.close());
  await deliver(env,'checkout.session.completed',session,'evt_period_checkout');
  assert.equal((await deliver(env,'customer.subscription.updated',{id:'sub_period',customer:'cus_period',status:'active',items:{data:[{current_period_end:end}]},metadata:session.metadata},'evt_period_update')).status,200);
  assert.equal(sqlite.prepare('SELECT current_period_end FROM commercial_entitlements').get().current_period_end,new Date(end*1000).toISOString());
  await deliver(env,'checkout.session.async_payment_succeeded',session,'evt_period_late_checkout');
  assert.equal(sqlite.prepare('SELECT current_period_end FROM commercial_entitlements').get().current_period_end,new Date(end*1000).toISOString());
});
