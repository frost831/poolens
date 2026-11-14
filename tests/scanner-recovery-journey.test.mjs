import assert from 'node:assert/strict';
import test from 'node:test';
import vm from 'node:vm';
import { readFileSync, mkdirSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { DatabaseSync } from 'node:sqlite';
import { recoveryFailureStats } from '../functions/api/stats.js';

const root=fileURLToPath(new URL('..',import.meta.url));
const source=readFileSync(resolve(root,'js/app.js'),'utf8');
function fn(name){
  const match=source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match,`Missing ${name}`);return match[0];
}
function context(names,overrides={}){
  const c=vm.createContext({setTimeout,clearTimeout,AbortController,fetch, ...overrides});
  vm.runInContext(names.map(fn).join('\n'),c);return c;
}

test('a stalled provider times out, aborts its request, and permits another request',async()=>{
  let signal;
  const c=context(['fetchSplashLensWithTimeout'],{fetch:(_url,options)=>{signal=options.signal;return new Promise(()=>{});}});
  await assert.rejects(c.fetchSplashLensWithTimeout('/api/scan',{},8),{name:'TimeoutError'});
  assert.equal(signal.aborted,true);
  c.fetch=async()=>({ok:true});
  assert.equal((await c.fetchSplashLensWithTimeout('/api/scan',{},50)).ok,true);
});

test('timeout recovery also works on a browser without AbortController',async()=>{
  const c=context(['fetchSplashLensWithTimeout'],{AbortController:undefined,fetch:()=>new Promise(()=>{})});
  await assert.rejects(c.fetchSplashLensWithTimeout('/api/scan',{},8),{name:'TimeoutError'});
});

test('local OCR reads ordinary HTML canvas photos and fails recoverably on empty blobs',async()=>{
  const c=context(['scanCanvasBlob']);const expected={type:'image/jpeg'};
  assert.equal(await c.scanCanvasBlob({toBlob:(callback,type)=>{assert.equal(type,'image/jpeg');callback(expected);}}),expected);
  await assert.rejects(c.scanCanvasBlob({toBlob:callback=>callback(null)}),/photo could not be read/);
  assert.equal(await c.scanCanvasBlob({convertToBlob:async()=>expected}),expected);
});

test('verification recovery analyzes the original frame once and prevents duplicate submission',async()=>{
  const original={proof:'original photo'};let release;const calls=[];
  const captureAndAnalyze=()=>{};captureAndAnalyze.pendingCapture={canvas:original,mode:'parts_snap'};
  const c=context(['resumePendingAIScan'],{
    captureAndAnalyze,document:{getElementById:()=>({})},
    ensureFreeScanProfile:async()=>true,updateAIStatusBar(){},canUseAIScan:()=>true,
    trackSplashLensEvent(){},callAIScan:async frame=>{calls.push(frame);await new Promise(r=>release=r);},
  });
  const first=c.resumePendingAIScan('parts_snap');
  await new Promise(r=>setImmediate(r));
  await c.resumePendingAIScan('parts_snap');
  assert.deepEqual(calls,[original]);release();await first;
  assert.equal(captureAndAnalyze.pending,false);
});

test('canceling verification keeps the frame, and a quota block never calls AI',async()=>{
  for(const verified of [false,true]){
    const pending={canvas:{},mode:'test_strip'};const captureAndAnalyze=()=>{};captureAndAnalyze.pendingCapture=pending;
    let scans=0,limits=0;
    const c=context(['resumePendingAIScan'],{captureAndAnalyze,document:{getElementById:()=>({})},
      ensureFreeScanProfile:async()=>verified,updateAIStatusBar(){},canUseAIScan:()=>false,
      showScanLimitModal:()=>limits++,callAIScan:async()=>scans++,trackSplashLensEvent(){}});
    await c.resumePendingAIScan('test_strip');
    assert.equal(scans,0);assert.equal(limits,verified?1:0);
    assert.equal(captureAndAnalyze.pendingCapture,pending);assert.equal(captureAndAnalyze.pending,false);
  }
});

test('switching tasks during verification never submits the old evidence into the new task',async()=>{
  let verify,scans=0;const captureAndAnalyze=()=>{};
  captureAndAnalyze.pendingCapture={canvas:{},mode:'parts_snap'};
  const c=context(['resumePendingAIScan'],{captureAndAnalyze,document:{getElementById:()=>({})},
    ensureFreeScanProfile:()=>new Promise(r=>verify=r),updateAIStatusBar(){},
    canUseAIScan:()=>true,callAIScan:async()=>scans++,trackSplashLensEvent(){}});
  const oldTask=c.resumePendingAIScan('parts_snap');
  captureAndAnalyze.generation=1;captureAndAnalyze.pendingCapture=null;verify(true);await oldTask;
  assert.equal(scans,0);assert.equal(captureAndAnalyze.pending,false);
});

function aiHarness(fetchResponse){
  const values=new Map();const captureAndAnalyze=()=>{};
  const c=context(['callAIScan'],{captureAndAnalyze,
    trackSplashLensEvent(){},getLanguageHeaders:()=>({}),getScanEntitlementToken:()=>'',
    getPartSnapRecoveryContext:()=>null,getSplashLensIdentityProfile:()=>({}),getFieldSaveAccount:()=>({email:'fixture@example.test'}),
    localStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)},
    FREE_PROFILE_TOKEN_KEY:'profile',ACCOUNT_TOKEN_KEY:'account',FIELD_SAVE_ACCOUNT_KEY:'field',SCAN_LIMIT_FREE:3,
    getSplashLensRole:()=> 'tech',getScanClientId:()=> 'fixture',getStoreShellMode:()=>'',withLanguageMetadata:x=>x,
    getPartSnapEvidenceSummary:()=>({complete:true}),fetchSplashLensWithTimeout:fetchResponse,
    ensureFreeScanProfile:async()=>true,trackPartSnapResultFailure(){},escHtml:String,
  });return c;
}

test('server-expired verification resumes the same evidence and retries authentication only once',async()=>{
  let requests=0,verifications=0;const frame={toDataURL:()=> 'data:image/jpeg;base64,AA=='};
  const c=aiHarness(async()=>{requests++;return {ok:false,status:401,json:async()=>({profileRequired:true,error:'verification required'})};});
  c.ensureFreeScanProfile=async()=>{verifications++;return true;};
  const result={innerHTML:''};await c.callAIScan(frame,'parts_snap',result,{});
  assert.equal(requests,2);assert.equal(verifications,1);
  assert.match(result.innerHTML,/Retry analysis/);
});

test('late AI results cannot replace a newer task',async()=>{
  let finish;const c=aiHarness(()=>new Promise(r=>finish=r));const result={innerHTML:'new task'};
  const request=c.callAIScan({toDataURL:()=> 'data:image/jpeg;base64,AA=='},'parts_snap',result,{});
  c.captureAndAnalyze.generation=1;
  finish({ok:true,json:async()=>({result:{}})});await request;
  assert.equal(result.innerHTML,'new task');
});

test('recovery reporting executes real SQLite SQL, excludes QA, and never exposes arbitrary reason values',async()=>{
  const sqlite=new DatabaseSync(':memory:');
  sqlite.exec('CREATE TABLE events(event TEXT, source TEXT, props TEXT, user_agent TEXT, path TEXT, created_at TEXT)');
  const add=sqlite.prepare("INSERT INTO events VALUES (?, ?, ?, 'Mozilla/5.0', '/', datetime('now'))");
  add.run('partsnap_result_fail','app',JSON.stringify({reason:'camera_denied',store:'android',traffic_class:'real'}));
  add.run('partsnap_result_fail','qa',JSON.stringify({reason:'camera_denied',store:'android',traffic_class:'qa'}));
  add.run('checkout_handoff_failed','app',JSON.stringify({reason:'person@example.test',store:'web'}));
  const rows=await recoveryFailureStats({prepare:sql=>({bind(){return this;},all:async()=>({results:sqlite.prepare(sql).all()})})});
  assert.equal(rows.reduce((n,r)=>n+r.count,0),2);
  assert.ok(rows.some(r=>r.stage==='PartSnap'&&r.platform==='android'&&r.reason==='camera_denied'));
  assert.doesNotMatch(JSON.stringify(rows),/person@example/);sqlite.close();
});

for(const width of [1365,390]) test(`full app verification and saved-frame recovery at ${width}px`,{skip:!process.env.SPLASHLENS_PLAYWRIGHT_PATH},async()=>{
  const {chromium}=await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser=await chromium.launch({headless:true});
  const errors=[];const requests=[];let codeRequests=0;
  const page=await browser.newPage({viewport:{width,height:900},serviceWorkers:'block'});
  page.setDefaultTimeout(8000);
  page.on('pageerror',e=>errors.push(e.message));
  try{
    await page.route('**/*',async route=>{
      const url=new URL(route.request().url());
      if(url.origin!=='https://splashlens-app.test')return route.abort();
      if(url.pathname==='/api/free-profile'){
        const body=route.request().postDataJSON();requests.push(body.action);
        if(body.action==='request_code'){codeRequests++;return route.fulfill({json:{ok:true,emailSent:true}});}
        if(body.code!=='123456')return route.fulfill({status:400,json:{ok:false,error:'Wrong code'}});
        return route.fulfill({json:{ok:true,profileToken:'fixture-profile',accountToken:'fixture-account',tokenExpiresAt:'2099-01-01T00:00:00Z'}});
      }
      if(url.pathname.startsWith('/api/'))return route.fulfill({status:503,json:{ok:false,error:'fixture'}});
      const name=url.pathname==='/'?'index.html':url.pathname.slice(1),file=resolve(root,name);
      if(!file.startsWith(resolve(root)+sep)||!/^(?:index\.html|owner-dashboard\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name))return route.abort();
      try{return route.fulfill({contentType:/\.m?js$/.test(file)?'text/javascript':/\.html$/.test(file)?'text/html':/\.json$/.test(file)?'application/json':'image/png',body:readFileSync(file)});}catch{return route.abort();}
    });
    await page.goto('https://splashlens-app.test/?utm_source=qa&utm_medium=playwright');
    await page.evaluate(()=>{setSplashLensRole('tech');hideRolePicker();enterSplashLensApp('scan','lookup');});
    await page.locator('#scan-lookup-panel').waitFor({state:'visible'});
    await page.evaluate(()=>{setScanMode('parts');closeSplashLensSheet();});
    await page.locator('#scan-no-camera').waitFor({state:'visible'});
    await page.evaluate(()=>{
      localStorage.setItem(FIELD_SAVE_ACCOUNT_KEY,JSON.stringify({email:'fixture@example.test',role:'tech'}));
      window.__proofFrame={marker:'the same evidence'};window.__scanFrames=[];
      captureAndAnalyze.pendingCapture={canvas:__proofFrame,mode:'parts_snap'};
      window.callAIScan=async frame=>__scanFrames.push(frame===__proofFrame);
      window.syncFieldSaveProfile=async profile=>profile;
      window.__verification=resumePendingAIScan('parts_snap');
    });
    await page.getByRole('button',{name:'Not now',exact:true}).click();
    await page.getByRole('button',{name:'Verify and resume scan',exact:true}).waitFor();
    await page.waitForFunction(()=>!captureAndAnalyze.pending);
    assert.deepEqual(await page.evaluate(()=>__scanFrames),[]);
    await page.getByRole('button',{name:'Verify and resume scan',exact:true}).click();
    await page.getByRole('button',{name:'Resend code',exact:true}).click();
    await page.getByRole('alert').filter({hasText:/Please wait/}).waitFor();
    assert.equal(codeRequests,2,'cooldown does not send another email');
    await page.getByLabel('6-digit code',{exact:true}).fill('111111');
    await page.getByRole('button',{name:'Verify and scan',exact:true}).click();
    await page.locator('[data-sheet-error]').filter({hasText:/could not verify/}).waitFor();
    await page.evaluate(()=>{window.__originalNow=Date.now;Date.now=()=>__originalNow()+61000;});
    await page.getByRole('button',{name:'Resend code',exact:true}).click();
    await page.locator('[data-sheet-status]').filter({hasText:/new code was sent/}).waitFor();
    assert.equal(codeRequests,3);
    await page.getByLabel('6-digit code',{exact:true}).fill('123456');
    await page.getByLabel('6-digit code',{exact:true}).press('Tab');
    assert.equal(await page.evaluate(()=>document.activeElement.textContent),'Verify and scan');
    const out=process.env.SPLASHLENS_QA_ARTIFACT_DIR;
    if(out){mkdirSync(out,{recursive:true});await page.screenshot({path:resolve(out,`verification-${width}.png`)});}
    await page.getByRole('button',{name:'Verify and scan',exact:true}).click();
    await page.waitForFunction(()=>__scanFrames.length===1&&!captureAndAnalyze.pending);
    assert.deepEqual(await page.evaluate(()=>__scanFrames),[true]);
    assert.equal(await page.locator('#splashlens-sheet').count(),0);
    assert.equal(codeRequests,3);assert.deepEqual(requests,['request_code','request_code','verify_code','request_code','verify_code']);
    assert.deepEqual(errors,[]);
    // A slow, dismissed submission cannot close a replacement sheet.
    await page.evaluate(()=>{window.__old=openSplashLensSheet({title:'Old task',submit:()=>new Promise(r=>window.__finishOld=r)});});
    await page.getByRole('button',{name:'Continue',exact:true}).click();
    await page.evaluate(()=>{openSplashLensSheet({title:'New task'});__finishOld(true);});
    await page.getByRole('dialog',{name:'New task',exact:true}).waitFor();
    assert.equal(await page.getByRole('dialog',{name:'New task',exact:true}).count(),1);
    await page.route('**/api/stats',r=>r.fulfill({json:{ok:true,recoveryFailures30d:[{stage:'PartSnap',reason:'request_timeout',platform:'android',count:3},{stage:'Verify email',reason:'other',platform:'web',count:1}]}}));
    await page.route('**/api/admin',r=>r.fulfill({json:{ok:true}}));
    await page.goto('https://splashlens-app.test/owner-dashboard.html');
    await page.getByPlaceholder('Paste SplashLens stats/admin secret').fill('qa-fixture-only');
    await page.getByRole('button',{name:'Load Dashboard',exact:true}).click();
    await page.locator('#recoveryFailures').getByText('request_timeout',{exact:true}).waitFor();
    assert.equal(await page.locator('#recoveryFailures tbody tr').count(),2);
    assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),true);
    await page.locator('#recoveryFailures').scrollIntoViewIfNeeded();
    if(out)await page.screenshot({path:resolve(out,`owner-recovery-${width}.png`)});
    assert.deepEqual(errors,[]);
  }catch(error){
    console.error({width,sheet:await page.locator('#splashlens-sheet').innerText().catch(()=>''),result:await page.locator('#scan-result').innerText().catch(()=>''),state:await page.evaluate(()=>({tab:S.tab,generation:captureAndAnalyze.generation,pending:captureAndAnalyze.pending}))});
    throw error;
  }finally{await browser.close();}
});
