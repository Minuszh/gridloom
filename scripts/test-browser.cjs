// SPDX-License-Identifier: GPL-3.0-only
/* Optional real-Chromium smoke test. No browser automation dependency. */
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),{spawn}=require('node:child_process');
const root=path.resolve(__dirname,'..'),profile=fs.mkdtempSync(path.join(os.tmpdir(),'gridloom-ui-'));
const binary=process.env.CHROME_BIN||(process.platform==='darwin'?'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome':process.platform==='win32'?path.join(process.env.PROGRAMFILES,'Google/Chrome/Application/chrome.exe'):'google-chrome');
const chrome=spawn(binary,['--headless','--disable-gpu','--no-first-run','--disable-background-networking','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:['ignore','ignore','pipe']});
let ws,session,id=0,logs='',pending=new Map();
const assert=(condition,message)=>{if(!condition)throw Error(message);};
async function main(){
 const endpoint=await new Promise((resolve,reject)=>{const timeout=setTimeout(()=>reject(Error('Chrome startup timed out')),15000);chrome.on('error',reject);chrome.stderr.on('data',data=>{logs+=data;const match=logs.match(/DevTools listening on (ws:\/\/[^\s]+)/);if(match){clearTimeout(timeout);resolve(match[1]);}});});
 ws=new WebSocket(endpoint);await new Promise((resolve,reject)=>{ws.onopen=resolve;ws.onerror=reject;});
 ws.onmessage=e=>{const message=JSON.parse(e.data),wait=pending.get(message.id);if(wait){pending.delete(message.id);message.error?wait.reject(Error(message.error.message)):wait.resolve(message.result);}};
 const send=(method,params={},target=session)=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});ws.send(JSON.stringify({id:key,method,params,...(target?{sessionId:target}:{})}));});
 const target=await send('Target.createTarget',{url:'about:blank'});session=(await send('Target.attachToTarget',{targetId:target.targetId,flatten:true})).sessionId;
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value;};
 async function stableTabs(){
  await evaluate(`window.tabFits=[];window.tabResize=GridloomHostClient.resize;GridloomHostClient.resize=(w,h)=>tabFits.push([w,h]);GridloomHostClient.available=true`);
  for(const width of [260,320,400]){
   await send('Emulation.setDeviceMetricsOverride',{width,height:950,screenWidth:1600,screenHeight:1200,deviceScaleFactor:1,mobile:false});
   await evaluate(`document.getElementById('tab-grid').click();new Promise(resolve=>setTimeout(resolve,80))`);
   const baseline=await evaluate(`tabFits.length=0;({height:document.querySelector('main').getBoundingClientRect().height,button:document.getElementById('apply').getBoundingClientRect().top})`);
   for(const name of ['notation','presets','grid','presets','notation','grid']){
    await evaluate(`document.getElementById('tab-${name}').click();new Promise(resolve=>setTimeout(resolve,30))`);
    const state=await evaluate(`({height:document.querySelector('main').getBoundingClientRect().height,button:document.getElementById('apply').getBoundingClientRect().top,resizes:tabFits.length})`);
    assert(Math.abs(state.height-baseline.height)<1&&Math.abs(state.button-baseline.button)<1&&state.resizes===0,'Tab switch moved the panel or footer at '+width+': '+name);
   }
  }
  await evaluate(`document.getElementById('tab-presets').click();for(let i=0;i<40;i++){const row=document.createElement('div');row.dataset.testRow='true';row.className='preset';const b=document.createElement('button');b.textContent='Long preset '+i;row.append(b);document.getElementById('preset-list').append(row);}new Promise(resolve=>setTimeout(resolve,80))`);
  assert(await evaluate(`document.getElementById('page-presets').scrollHeight>document.getElementById('page-presets').clientHeight&&tabFits.length===0`),'Long preset lists must scroll inside the page without resizing the host');
  await evaluate(`document.querySelectorAll('[data-test-row]').forEach(el=>el.remove());document.getElementById('tab-notation').click();window.previousNotation=document.getElementById('notation').value;document.getElementById('notation').value='$'+'missing'.repeat(40);document.getElementById('notation').dispatchEvent(new Event('input',{bubbles:true}));new Promise(resolve=>setTimeout(resolve,80))`);
  assert(await evaluate(`document.getElementById('status').scrollHeight>document.getElementById('status').clientHeight`),'Long errors must scroll within their bounded area');
  await evaluate(`GridloomHostClient.available=false;document.getElementById('notation').value=previousNotation;document.getElementById('notation').dispatchEvent(new Event('input',{bubbles:true}));GridloomHostClient.available=false;GridloomHostClient.resize=tabResize;document.getElementById('tab-grid').click()`);
 }
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:950,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:require('node:url').pathToFileURL(path.join(root,'dist/index.html')).href+'?lang=en'});
 for(let i=0;i<50;i++){if(await evaluate(`document.getElementById('status')?.textContent==='26 guides'`))break;await new Promise(r=>setTimeout(r,100));}
 assert(await evaluate(`document.getElementById('status').textContent==='26 guides'`),'Panel did not initialize');
 assert(await evaluate(`getComputedStyle(document.getElementById('status')).visibility==='hidden'&&document.getElementById('status').getAttribute('aria-hidden')==='true'`),'Routine count must be hidden');
 assert(await evaluate(`document.getElementById('options').open&&!document.querySelector('#write-mode,#border,#live-cancel')`),'Settings must start open with removed controls absent');
 assert(await evaluate(`!document.getElementById('preview')&&!document.getElementById('unit')`),'Preview and unit selector must be absent');
 assert(await evaluate(`!document.querySelector('[title],[data-tooltip]')`),'Hover tooltips must be absent');
 assert(await evaluate(`document.querySelectorAll('.quick svg').length===7`),'Quick actions must use icons');
 assert(await evaluate(`document.getElementById('apply').disabled`),'Preview must disable document writes');
 assert(await evaluate(`document.querySelectorAll('[data-builtin]').length===0`),'Presets must be deferred until first visit');
 await stableTabs();
 for(const width of [260,320,400]){await send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});assert(await evaluate(`document.documentElement.scrollWidth<=innerWidth`),'Horizontal overflow at '+width);}
 await evaluate(`document.getElementById('cols').value='6';document.getElementById('cols').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('status').textContent==='14 guides'`),'Grid preview did not update');
 await evaluate(`document.getElementById('tab-notation').click();document.getElementById('notation').value='$c = | ~ |\\n$c*3 (v)';document.getElementById('notation').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('status').textContent==='4 guides'`),'Notation did not update');
 await evaluate(`document.getElementById('notation').value='| invalid';document.getElementById('notation').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('status').classList.contains('error')`),'Syntax errors are not visible');
 assert(await evaluate(`getComputedStyle(document.getElementById('status')).visibility==='visible'&&document.getElementById('status').getAttribute('aria-hidden')==='false'`),'Errors must remain visible and accessible');
 assert(await evaluate(`!/[\u4e00-\u9fff]/.test(document.getElementById('status').textContent)`),'English errors contain untranslated text');
 await evaluate(`document.getElementById('tab-grid').click();document.getElementById('save').click();document.getElementById('preset-name').value='UI test';document.getElementById('save-confirm').click();document.getElementById('tab-presets').click()`);
 assert(await evaluate(`document.querySelector('#preset-list .preset button span').textContent==='UI test'`),'Preset save failed');
 await evaluate(`document.getElementById('tab-grid').click();document.getElementById('cols').value='12';document.getElementById('cols').dispatchEvent(new Event('input',{bubbles:true}))`);
 await evaluate(`document.getElementById('reset').click()`);
 assert(await evaluate(`document.getElementById('status').textContent==='4 guides'&&document.getElementById('cols').value===''`),'Reset should produce an empty outline form');
 await evaluate(`document.getElementById('cols').value='2';document.getElementById('colWidth').value='10mm | ~ | 10mm';document.getElementById('gutterX').value='2mm | 2mm';document.getElementById('colWidth').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('status').textContent==='9 guides'`),'Field notation should add padding and split gutters');
 await evaluate(`document.getElementById('tab-notation').click();document.getElementById('notation').value='$a={20%}(v $WIDTH)\\n|$a[1]|~|$a[1]|(h)';document.getElementById('notation').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('status').textContent==='4 guides'`),'Captured width should work across axes');
 await evaluate(`document.getElementById('notation').value='|calc(2 / 0)|';document.getElementById('notation').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('status').textContent.includes('Cannot divide by zero')`),'Arithmetic error translation failed');
 await evaluate(`document.getElementById('tab-presets').click();document.querySelector('[data-builtin=columns]').click();document.getElementById('tab-grid').click()`);
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:950,deviceScaleFactor:1,mobile:false});
 if(process.env.GRIDLOOM_SCREENSHOT){const image=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:320,height:Math.ceil(await evaluate(`document.querySelector('main').getBoundingClientRect().height`)),scale:1}});fs.writeFileSync(process.env.GRIDLOOM_SCREENSHOT,Buffer.from(image.data,'base64'));}
 await send('Page.navigate',{url:require('node:url').pathToFileURL(path.join(root,'dist/index.html')).href+'?lang=zh'});
 for(let i=0;i<50;i++){if(await evaluate(`document.getElementById('status')?.textContent==='26 条参考线'`))break;await new Promise(r=>setTimeout(r,100));}
 assert(await evaluate(`document.getElementById('tab-grid').textContent==='网格'&&document.getElementById('apply').textContent==='应用'`),'Chinese UI failed');
 await stableTabs();
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:950,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.getElementById('margin-top').value='10px';document.getElementById('margin-top').dispatchEvent(new Event('input',{bubbles:true}))`);
 assert(await evaluate(`document.getElementById('margin-right').value==='10px'&&!document.getElementById('status').classList.contains('error')`),'Mixed-unit input failed');
 assert(await evaluate(`document.getElementById('content-layout').getBoundingClientRect().height<550`),'Compact panel is too tall');
 if(process.env.GRIDLOOM_SCREENSHOT){const image=await send('Page.captureScreenshot',{format:'png',clip:{x:0,y:0,width:320,height:Math.ceil(await evaluate(`document.querySelector('main').getBoundingClientRect().height`)),scale:1}});fs.writeFileSync(process.env.GRIDLOOM_SCREENSHOT.replace('.png','-zh.png'),Buffer.from(image.data,'base64'));}
 // Simulate only host resizing; no Illustrator documents are accessed.
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:350,screenWidth:1600,screenHeight:1000,deviceScaleFactor:1,mobile:false});
 await evaluate(`window.fitRequests=[];window.originalResize=GridloomHostClient.resize;GridloomHostClient.resize=(width,height)=>fitRequests.push({width,height});GridloomHostClient.available=true;document.getElementById('options').open=true;new Promise(resolve=>setTimeout(resolve,100))`);
 const expanded=await evaluate(`({request:fitRequests.at(-1),content:Math.ceil(document.querySelector('main').getBoundingClientRect().height)})`);
 assert(expanded.request&&expanded.request.height>=expanded.content,'Expanded settings must request enough panel height');
 await send('Emulation.setDeviceMetricsOverride',{width:expanded.request.width,height:expanded.request.height,screenWidth:1600,screenHeight:1000,deviceScaleFactor:1,mobile:false});
 assert(await evaluate(`document.querySelector('main').getBoundingClientRect().bottom<=innerHeight&&document.getElementById('apply').getBoundingClientRect().bottom<=innerHeight`),'Resized panel must display settings and actions fully');
 await evaluate(`document.getElementById('options').open=false;new Promise(resolve=>setTimeout(resolve,100))`);
 assert(await evaluate(`fitRequests.at(-1).height<${expanded.request.height}`),'Closing settings must return to compact height');
 // A docked host can refuse the request. The footer still remains accessible.
 await send('Emulation.setDeviceMetricsOverride',{width:260,height:350,screenWidth:1600,screenHeight:1000,deviceScaleFactor:1,mobile:false});
 await evaluate(`document.getElementById('options').open=true;new Promise(resolve=>setTimeout(resolve,100))`);
 assert(await evaluate(`document.getElementById('apply').getBoundingClientRect().bottom<=innerHeight&&document.getElementById('apply').getBoundingClientRect().top>=0`),'Height-constrained panel must keep actions visible');
 await evaluate(`GridloomHostClient.available=false;GridloomHostClient.resize=originalResize;document.getElementById('options').open=false`);
 await evaluate(`document.getElementById('options').open=true;document.getElementById('panel-content').scrollTop=0`);
 const fixed=await evaluate(`({top:document.querySelector('.tabbar').getBoundingClientRect().top,bottom:document.getElementById('apply').getBoundingClientRect().top})`);
 await evaluate(`document.getElementById('panel-content').scrollTop=1000`);
 assert(await evaluate(`document.getElementById('panel-content').scrollTop>0&&document.documentElement.scrollTop===0&&document.querySelector('.tabbar').getBoundingClientRect().top===${fixed.top}&&document.getElementById('apply').getBoundingClientRect().top===${fixed.bottom}`),'Only the middle content should scroll');
 // Layer state comes from host replies, including externally changed state on focus.
 await evaluate(`window.layerState={exists:true,locked:false,visible:true};window.originalCall=GridloomHostClient.call;GridloomHostClient.available=true;GridloomHostClient.call=async method=>{if(method==='context')return {unit:'pt',contexts:[{key:'artboard:0',bounds:[0,594,420,0],artboard:[0,594,420,0]}],guideState:{...layerState}};const key=method==='lockGuides'?'locked':'visible';layerState[key]=!layerState[key];return {...layerState};};window.dispatchEvent(new Event('focus'));new Promise(resolve=>setTimeout(resolve,30))`);
 assert(await evaluate(`document.getElementById('lock-guides').getAttribute('aria-pressed')==='false'&&document.getElementById('visibility').getAttribute('aria-pressed')==='true'`),'Initial layer state mismatch');
 await evaluate(`document.getElementById('lock-guides').click();new Promise(resolve=>setTimeout(resolve,30))`);
 assert(await evaluate(`document.getElementById('lock-guides').getAttribute('aria-pressed')==='true'`),'Lock state failed');
 await evaluate(`document.getElementById('visibility').click();new Promise(resolve=>setTimeout(resolve,30))`);
 assert(await evaluate(`document.getElementById('visibility').getAttribute('aria-pressed')==='false'&&getComputedStyle(document.getElementById('visibility')).opacity==='0.45'`),'Hidden state must be gray');
 await evaluate(`window.previousLockIcon=document.querySelector('#lock-guides svg');window.dispatchEvent(new Event('focus'));new Promise(resolve=>setTimeout(resolve,30))`);
 assert(await evaluate(`document.querySelector('#lock-guides svg')===previousLockIcon`),'Unchanged state should retain its icon node');
 await evaluate(`layerState.locked=false;layerState.visible=true;window.dispatchEvent(new Event('focus'));new Promise(resolve=>setTimeout(resolve,30))`);
 assert(await evaluate(`document.getElementById('lock-guides').getAttribute('aria-pressed')==='false'&&document.getElementById('visibility').getAttribute('aria-pressed')==='true'`),'External layer changes must synchronize');
 await evaluate(`window.originalPlan=Gridloom.plan;window.planCalls=0;Gridloom.plan=(...args)=>{planCalls++;return originalPlan(...args);};document.getElementById('tab-grid').click();document.getElementById('tab-presets').click();document.getElementById('tab-grid').click();Gridloom.plan=originalPlan;`);
 assert(await evaluate(`planCalls===0`),'Unchanged tab switches must reuse computed geometry');
 await evaluate(`GridloomHostClient.call=originalCall;GridloomHostClient.available=false;`);
 assert(await evaluate(`!document.querySelector('#precision,#guideLength,#bounds-mode,#clear-mode')`),'Removed settings must be absent');
 await evaluate(`document.getElementById('tab-grid').click();document.getElementById('book').value='horizontal';document.getElementById('book').dispatchEvent(new Event('change',{bubbles:true}));`);
 assert(await evaluate(`!document.getElementById('status').classList.contains('error')`),'Book mode should render');
 await evaluate(`document.getElementById('save').click();document.getElementById('preset-name').value='Book UI';document.getElementById('save-confirm').click();`);
 assert(await evaluate(`JSON.parse(localStorage.getItem('gridloom.presets.v1')).presets.some(p=>p.name==='Book UI'&&p.config.book==='horizontal')`),'Preset must retain book mode');

 // Collapsible count sliders and the live-edit lifecycle, with an asynchronous host double.
 await evaluate(`document.getElementById('save-form').hidden=true;document.getElementById('options').open=false;document.getElementById('tab-grid').click();document.getElementById('cols-toggle').click();`);
 assert(await evaluate(`!document.getElementById('cols-slider').hidden&&document.getElementById('cols-toggle').getAttribute('aria-expanded')==='true'`),'Slider must open beneath count fields');
 assert(await evaluate(`getComputedStyle(document.getElementById('cols')).appearance==='textfield'&&document.querySelector('#cols-toggle svg')`),'Count must use a numeric entry and slider icon');
 await evaluate(`document.getElementById('cols-range').value='6';document.getElementById('cols-range').dispatchEvent(new Event('input',{bubbles:true}));`);
 assert(await evaluate(`document.getElementById('cols').value==='6'`),'Slider must synchronize exact count');
 await evaluate(`window.liveCalls=[];window.liveBusy=false;window.liveOverlap=false;window.liveInitial=document.getElementById('cols').value;GridloomHostClient.available=true;GridloomHostClient.call=async(method,payload)=>{if(liveBusy)liveOverlap=true;liveBusy=true;liveCalls.push({method,payload});await new Promise(r=>setTimeout(r,15));liveBusy=false;if(method==='context')return {token:'test',unit:'pt',contexts:[{key:'artboard:0',bounds:[0,594,420,0],artboard:[0,594,420,0]}],guideState:{exists:true,locked:false,visible:true}};if(method==='liveBegin')return {id:'test-live'};return {guideState:{exists:true,locked:false,visible:true}};};window.dispatchEvent(new Event('focus'));new Promise(r=>setTimeout(r,50))`);
 await evaluate(`document.getElementById('cols-range').value='7';document.getElementById('cols-range').dispatchEvent(new Event('input',{bubbles:true}));new Promise(r=>setTimeout(r,100))`);
 assert(await evaluate(`!document.getElementById('live-cancel')&&document.getElementById('apply').textContent==='应用'&&document.getElementById('clear').disabled`),'Live session controls failed');
 await evaluate(`for(const count of [3,4,5,7,8]){document.getElementById('cols-range').value=count;document.getElementById('cols-range').dispatchEvent(new Event('input',{bubbles:true}));}new Promise(r=>setTimeout(r,200))`);
 assert(await evaluate(`liveCalls.filter(c=>c.method==='liveUpdate').length===2&&!liveOverlap`),'Rapid dragging must coalesce into one serialized update');
 await evaluate(`document.getElementById('cols-range').value='9';document.getElementById('cols-range').dispatchEvent(new Event('input',{bubbles:true}));document.getElementById('apply').click();new Promise(r=>setTimeout(r,100))`);
 assert(await evaluate(`liveCalls.at(-1).method==='liveCommit'&&!document.getElementById('live-edit')&&document.getElementById('cols').value==='9'&&!liveOverlap`),'Apply must flush the final value before commit');
 await send('Emulation.setDeviceMetricsOverride',{width:320,height:500,deviceScaleFactor:1,mobile:false});
 if(process.env.GRIDLOOM_SCREENSHOT){await evaluate(`document.getElementById('panel-content').scrollTop=0`);const image=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(process.env.GRIDLOOM_SCREENSHOT.replace('.png','-slider.png'),Buffer.from(image.data,'base64'));}
 await evaluate(`GridloomHostClient.call=originalCall;GridloomHostClient.available=false;`);
 await evaluate(`document.getElementById('margin-top').value='5mm';document.getElementById('margin-top').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowUp',bubbles:true}));`);
 assert(await evaluate(`document.getElementById('margin-top').value==='6mm'&&document.getElementById('margin-right').value==='6mm'`),'Arrow keys must retain units and linked margins');
 await evaluate(`document.getElementById('gutterX').value='2.5px';document.getElementById('gutterX').dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowDown',bubbles:true}));`);
 assert(await evaluate(`document.getElementById('gutterX').value==='1.5px'`),'Arrow keys must change dimensions by one');
 assert(await evaluate(`!document.querySelector('#live-edit')&&document.getElementById('status').getBoundingClientRect().height===0`),'Routine status must not reserve footer space');
 console.log('UI passed: collapsible sliders, coalesced live updates, apply/cancel, 260/320/400px, no preview/unit selector, EN/ZH, mixed units, notation/captures/arithmetic errors, preset save, reset, field notation, disabled host writes, zero-row margins, expanding settings, stable tabs/footer, internal list/error scrolling and constrained docked actions.');
 await send('Browser.close',{},null);
}
main().catch(error=>{console.error(error);process.exitCode=1;}).finally(async()=>{if(ws)ws.close();chrome.kill();await new Promise(r=>setTimeout(r,300));try{fs.rmSync(profile,{recursive:true,force:true});}catch{}});
