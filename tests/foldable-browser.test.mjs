import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
const root=fileURLToPath(new URL('..',import.meta.url));
for (const [orientation,width,height] of [['vertical',1114,720],['horizontal',720,1114]]) {
 test(`hinge-safe account, navigation and manual recovery with ${orientation} display divider`,{skip:!process.env.SPLASHLENS_PLAYWRIGHT_PATH},async()=>{
  const {chromium}=await import(pathToFileURL(process.env.SPLASHLENS_PLAYWRIGHT_PATH).href);
  const browser=await chromium.launch();
  const context=await browser.newContext({viewport:{width,height},screen:{width,height},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  const page=await context.newPage();
  const errors=[]; page.on('pageerror',e=>errors.push(e.message));
  try {
   await page.route('**/*',route=>{
    const url=new URL(route.request().url());
    if(url.origin!=='https://splashlens-app.test'||url.pathname.startsWith('/api/')) return route.abort();
    const name=url.pathname==='/'?'index.html':url.pathname.slice(1),file=resolve(root,name);
    if(!file.startsWith(resolve(root)+sep)||!/^(index\.html|manifest\.json|favicon\.svg|js\/|icons\/)/.test(name))return route.abort();
    try{return route.fulfill({contentType:/\.m?js$/.test(file)?'text/javascript':/\.html$/.test(file)?'text/html':'application/json',body:readFileSync(file)});}catch{return route.abort();}
   });
   await page.goto('https://splashlens-app.test/?store=android&tab=errors&utm_source=qa');
   await page.waitForFunction(()=>typeof openSplashLensAccount==='function');
   const cdp=await context.newCDPSession(page);
   const metrics={width,height,screenWidth:width,screenHeight:height,deviceScaleFactor:1,mobile:true,displayFeature:{orientation,offset:540,maskLength:34}};
   await cdp.send('Emulation.setDeviceMetricsOverride',metrics);
   await page.waitForFunction(axis=>matchMedia(`(${axis==='vertical'?'horizontal':'vertical'}-viewport-segments:2)`).matches,orientation);
   await page.evaluate(()=>{closeSplashLensSheet();revealSplashLensApp();hideRolePicker();showTab('errors');});
   async function safe(locator,label){
    const rects=await locator.evaluateAll(nodes=>nodes.filter(e=>e.offsetWidth&&e.offsetHeight).map(e=>{const r=e.getBoundingClientRect();return {left:r.left,right:r.right,top:r.top,bottom:r.bottom,text:e.textContent.trim().slice(0,50)};}));
    assert.ok(rects.length,`${label} must be visible`);
    for(const r of rects){
     const start=orientation==='vertical'?r.left:r.top,end=orientation==='vertical'?r.right:r.bottom;
     assert.ok(end<=540.5||start>=573.5,`${label} crosses the hinge: ${JSON.stringify(r)}`);
     assert.ok(r.left>=-1&&r.right<=width+1&&r.top>=-1&&r.bottom<=height+1,`${label} outside viewport: ${JSON.stringify(r)}`);
    }
   }
   await safe(page.locator('nav[aria-label="SplashLens field tools"] button'),'navigation');
   await safe(page.locator('#error-search'),'code search');
   await page.evaluate(()=>openSplashLensAccount());
   const account=page.getByRole('dialog',{name:'SplashLens account',exact:true});
   await account.getByRole('button',{name:'Verify email',exact:true}).waitFor();
   await safe(account.locator('button'),'account actions');
   await account.getByRole('button',{name:'Verify email',exact:true}).click();
   const email=page.getByLabel('Work email',{exact:true}); await email.fill('qa@example.com');
   await safe(email,'email input');
   await safe(page.locator('#splashlens-sheet [data-sheet-controls] button'),'verification actions');
   await cdp.send('Emulation.setDeviceMetricsOverride',{width:390,height:844,screenWidth:390,screenHeight:844,deviceScaleFactor:1,mobile:true});
   assert.equal(await email.inputValue(),'qa@example.com');
   await cdp.send('Emulation.setDeviceMetricsOverride',metrics);
   await page.waitForFunction(axis=>matchMedia(`(${axis==='vertical'?'horizontal':'vertical'}-viewport-segments:2)`).matches,orientation);
   assert.equal(await email.inputValue(),'qa@example.com');
   await safe(email,'restored email input');
   if(process.env.SPLASHLENS_QA_SCREENSHOTS){
    mkdirSync(process.env.SPLASHLENS_QA_SCREENSHOTS,{recursive:true});
    // Capture directly so screenshot preparation cannot reset the emulated hinge.
    const {data}=await cdp.send('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
    writeFileSync(resolve(process.env.SPLASHLENS_QA_SCREENSHOTS,`hinge-${orientation}-email.png`),Buffer.from(data,'base64'));
   }
   await page.getByRole('button',{name:'Not now',exact:true}).click();
   await page.evaluate(()=>{document.getElementById('splashlens-account-modal')?.remove();showTab('scan',{scanMode:'parts'});openPartSnapManualSearch();});
   await safe(page.locator('#scan-code-input'),'PartSnap manual fallback');
   assert.deepEqual(errors,[]);
  }finally{await browser.close();}
 });
}
