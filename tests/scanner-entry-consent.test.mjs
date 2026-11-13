import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import vm from 'node:vm';

const source=readFileSync(new URL('../js/app.js',import.meta.url),'utf8');
function functionSource(name){
  const match=source.match(new RegExp(`^(?:async )?function ${name}\\([^]*?^}`, 'm'));
  assert.ok(match,`Missing ${name}`);
  return match[0];
}
function scanner(previousMode){
  const calls={camera:0,sheets:0};
  const node=()=>({style:{},classList:{add(){},remove(){}},focus(){},scrollIntoView(){},removeAttribute(){},querySelectorAll:()=>[],parentElement:{prepend(){}}});
  const elements=new Map();
  let resolveSheet;
  const context=vm.createContext({
    FIELD_TABS:new Set(['scan','counter','errors','dosing']),S:{tab:'counter'},
    _scanMode:previousMode,_scanStream:null,_flashTrack:null,_flashOn:false,
    document:{getElementById(id){if(!elements.has(id))elements.set(id,node());return elements.get(id);},querySelectorAll:()=>[]},
    localStorage:{setItem(){}},window:{scrollTo(){}},
    navigator:{mediaDevices:{getUserMedia:async()=>{calls.camera++;throw Object.assign(Error('denied'),{name:'NotAllowedError'});}}},
    openSplashLensSheet:()=>{calls.sheets++;return new Promise(resolve=>{resolveSheet=resolve;});},
    getSplashLensRole:()=> 'tech',getStoreShellMode:()=> 'android',
    trackSplashLensEvent(){},trackProductTabChange(){},trackPartSnapResultFailure(){},trackFirstActionStarted(){},
    refreshFieldSurfaces(){},revealSplashLensApp(){},renderScanBrandFilter(){},renderChemCatalogHome(){},updateAIStatusBar(){},renderPartSnapEvidenceGuide(){},renderPartSnapPrimer(){},startPartSnapEvidenceSession(){},
    cameraFallbackCopy:(_key,fallback)=>fallback,
    setTimeout(){},requestAnimationFrame:callback=>callback(),
  });
  vm.runInContext('let partSnapCameraExplained=false;let cameraRequestPending=false;let cameraRequestGeneration=0;'+[
    'showTab','initScanTab','setScanMode','startCamera','stopCamera','revealNoCameraFallback',
    'openCounterTool','openFirstStart','openLivePartSnap','openFieldCodeLookup','enterSplashLensApp',
  ].map(functionSource).join('\n'),context);
  return {context,calls,elements,decline:()=>resolveSheet(null)};
}

test('PartSnap entry explains the camera before requesting it, from every prior scanner mode',async()=>{
  for(const previous of ['camera','strip','lookup','parts']){
    for(const enter of [c=>c.openCounterTool('part'),c=>c.openFirstStart('partsnap'),c=>c.openLivePartSnap(),c=>c.enterSplashLensApp('scan','parts')]){
      const {context,calls,elements,decline}=scanner(previous);
      enter(context);
      assert.equal(context._scanMode,'parts');
      assert.equal(calls.sheets,1,`Explanation must open first from ${previous}`);
      assert.equal(calls.camera,0,`No prior-mode permission request from ${previous}`);
      decline();
      await new Promise(resolve=>setImmediate(resolve));
      assert.equal(calls.camera,0,'Declining must keep camera optional');
      assert.equal(elements.get('scan-no-camera').style.display,'block');
    }
  }
});

test('manual lookup entry never requests camera permission or opens a camera sheet',()=>{
  for(const previous of ['camera','strip','parts','lookup']){
    for(const enter of [c=>c.openFieldCodeLookup(),c=>c.enterSplashLensApp('scan','lookup')]){
      const {context,calls,elements}=scanner(previous);
      enter(context);
      assert.equal(context._scanMode,'lookup');
      assert.deepEqual(calls,{camera:0,sheets:0});
      assert.equal(elements.get('scan-lookup-panel').style.display,'block');
    }
  }
});

test('restoring the Scan tab starts in PartSnap with the camera explanation',()=>{
  const initial=source.match(/^let _scanMode\s*= '([^']+)'/m)[1];
  const {context,calls}=scanner(initial);
  context.showTab('scan');
  assert.equal(context._scanMode,'parts');
  assert.deepEqual(calls,{camera:0,sheets:1});
});

test('automatic feedback cannot cover checkout, camera consent, or verification sheets',()=>{
  let sheet=true;
  const context=vm.createContext({
    document:{getElementById:id=>sheet&&id==='splashlens-sheet'?{}:null},
    FIELD_FEEDBACK_AFTER_SUBMIT_MS:1000,FIELD_FEEDBACK_COOLDOWN_MS:1000,
  });
  vm.runInContext(['shouldShowFieldFeedback','shouldShowQuickFeedback','showFieldFeedbackPrompt'].map(functionSource).join('\n'),context);
  const active={opens:3,meaningfulActions:3};
  assert.equal(context.shouldShowFieldFeedback(active),false);
  assert.equal(context.shouldShowQuickFeedback(active,'partsnap_result'),false);
  // Forced requests also leave the active task's dialog in control.
  context.showFieldFeedbackPrompt('partsnap_result',{force:true});
  sheet=false;
  assert.equal(context.shouldShowFieldFeedback(active),true);
  assert.equal(context.shouldShowQuickFeedback(active,'partsnap_result'),true);
});
