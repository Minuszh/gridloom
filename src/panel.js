// SPDX-License-Identifier: GPL-3.0-only
(() => {
 'use strict';
 document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.classList.add('keyboard-focus');});
 document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('keyboard-focus'));
 const G=window.Gridloom,N=window.GridloomNotation,P=window.GridloomPresets,H=window.GridloomHostClient;
 const I=window.GridloomI18n.create((!H.available&&new URLSearchParams(location.search).get('lang'))||H.locale),t=I.t;I.apply(document);window.GridloomIcons.mount(t);
 const $=id=>document.getElementById(id),all=s=>Array.from(document.querySelectorAll(s));
 const fields=['cols','rows','colWidth','rowHeight','gutterX','gutterY','alignX','alignY','book'];
 let mode='grid',context=null,presets=[],editing=-1,working=false,refreshId=0,notationUnit=null;
 let previewEnabled=false;
 let liveSession=null,liveQueue=null,liveFailure=null,lastLiveKey=null;
 let planCache=null,refreshTask=null,lastHint='',presetsMounted=false,formInitialized=false,sessionKey=null,notationOriginKey=null;
 function guideButtons(state){
  for(const [id,key,on,off,label] of [['lock-guides','locked','lock','unlock','Lock gridloom layer'],['visibility','visible','eye','eyeOff','Show gridloom layer']]){
   const button=$(id),known=Boolean(state?.exists);button.disabled=working||(!!liveSession&&id!=='lock-guides')||!H.available||!known;
   button.setAttribute('aria-label',t(label));
   if(known)button.setAttribute('aria-pressed',String(state[key]));else button.removeAttribute('aria-pressed');
   window.GridloomIcons.set(button,known&&!state[key]?off:on);
  }
 }
 const status=(text,error=false)=>{$('status').textContent=error?I.error(text):text;$('status').classList.toggle('error',error);$('status').setAttribute('aria-hidden',String(!error));};
 function config(){return {unit:mode==='notation'&&notationUnit?notationUnit:(context?.unit||'pt'),margins:Object.fromEntries(['top','right','bottom','left'].map(k=>[k,$('margin-'+k).value])),...Object.fromEntries(fields.map(k=>[k,$(k).value])),precision:3,guideLength:'artboard',border:false};}
 function setConfig(c){
  const explicit=value=>{try{return G.qualify(value,c.unit);}catch{return value;}};
  for(const k in c.margins)$('margin-'+k).value=explicit(c.margins[k]);
  fields.forEach(k=>$(k).value=['colWidth','rowHeight','gutterX','gutterY'].includes(k)?explicit(c[k]):(k==='book'?(c.book||'none'):c[k]));
 }
 const currentPreset=name=>({name,mode,config:config(),notation:$('notation').value});
 function gridSettings(){return JSON.stringify({version:1,mode,config:config(),notation:$('notation').value});}
 function gridKey(){return JSON.stringify([fields.map(k=>$(k).value),['top','right','bottom','left'].map(k=>$('margin-'+k).value)]);}
 function saveSession(){
  if(!sessionKey)return;
  try{localStorage.setItem(sessionKey,JSON.stringify({mode,tab:document.querySelector('[aria-selected=true][data-tab]')?.dataset.tab||'grid',config:config(),notation:$('notation').value,notationUnit,notationOriginKey,linked:$('linked').checked}));}catch(ignore){}
 }
 async function restoreSession(){
  if(!H.available)return;
  try{const session=await H.call('session'),key='gridloom.form.'+(H.appId||'ILST');sessionKey=key;
   const raw=localStorage.getItem(key),data=raw?JSON.parse(raw):null;
   sessionKey=key+'.'+session.id;
   if(data?.id!==session.id){if(data?.id)localStorage.removeItem(key+'.'+data.id);localStorage.setItem(key,JSON.stringify({id:session.id}));return;}
   const saved=JSON.parse(localStorage.getItem(sessionKey)||'null');if(!saved)return;
   for(const k of fields)$(k).value=saved.config[k];for(const k of ['top','right','bottom','left'])$('margin-'+k).value=saved.config.margins[k];
   $('notation').value=saved.notation;notationUnit=saved.notationUnit;notationOriginKey=saved.notationOriginKey;mode=saved.mode;$('linked').checked=saved.linked;formInitialized=true;tab(saved.tab);
  }catch(error){status(error.message,true);}
 }
 function store(){try{localStorage.setItem('gridloom.presets.v1',P.encode(presets));}catch(error){status(t('Cannot save locally. Export a backup.'),true);}}
 function tab(value){
  try{
   if(value==='notation'&&mode==='grid'&&context&&notationOriginKey!==gridKey()){$('notation').value=N.fromGrid(config(),context.contexts[0],'en');notationUnit='pt';notationOriginKey=gridKey();}
   if(value==='presets'){mountPresets();hostPresets();}else mode=value;
   $('options').hidden=value==='presets';
   $('options').setAttribute('aria-hidden',String(value==='presets'));
   all('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===value)));
   all('[role=tabpanel]').forEach(p=>{p.hidden=p.id!=='page-'+value;p.setAttribute('aria-hidden',String(p.hidden));});render();saveSession();
  }catch(error){status(error.message,true);}
 }
 all('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
 async function read(){
  if(!H.available)return {name:'Sample',unit:'mm',contexts:[{key:'artboard:0',name:'A2',bounds:[0,594*G.UNITS.mm,420*G.UNITS.mm,0],artboard:[0,594*G.UNITS.mm,420*G.UNITS.mm,0]}]};
  return H.call('context',{scope:'auto',visibleBounds:false});
 }
 async function refresh(){
  if(working||liveSession)return;if(refreshTask)return refreshTask;
  const request=++refreshId;
  refreshTask=(async()=>{
   try{
    const next=await read();if(request!==refreshId)return;context=next;
    if(next.savedGrid&&!formInitialized){
     const data=JSON.parse(next.savedGrid);
     if(data.version===1){
      const saved=P.validate({...data,name:'gridloom'});
      setConfig(saved.config);mode=saved.mode;$('notation').value=saved.notation;
      notationUnit=saved.config.unit;$('linked').checked=false;formInitialized=true;tab(mode);
     }
    }
    if(next.prefill&&!formInitialized){setConfig(next.prefill.config);mode='grid';$('linked').checked=false;tab('grid');}
    formInitialized=true;guideButtons(next.guideState);liveControls();render();saveSession();
   }catch(error){if(request!==refreshId)return;context=null;guideButtons(null);$('apply').disabled=true;status(error.message,true);}
  })();
  try{await refreshTask;}finally{refreshTask=null;}
 }
 function compute(c=config(),data=context){
  G.assert(data&&data.contexts.length,'请先打开文档并刷新范围');
  const key=JSON.stringify([mode,c,data.contexts,mode==='notation'?$('notation').value:'']);
  if(planCache?.key===key)return planCache.plans;
  const plans=data.contexts.map(ctx=>({key:ctx.key,...(mode==='notation'?N.compile($('notation').value,ctx,c):G.plan(c,ctx))}));
  G.assert(plans.reduce((n,p)=>n+p.lines.length,0)<=G.LIMIT,'所有画板合计不能超过 5000 条参考线');
  planCache={key,plans};return plans;
 }
 function syncSettings(){
  all('[data-position]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.position===$('alignX').value+','+$('alignY').value)));
  all('[data-book]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.book===$('book').value)));
 }
 for(const [y,vertical] of [['start','Top'],['center','Middle'],['end','Bottom']])for(const [x,horizontal] of [['start','Left'],['center','Center'],['end','Right']]){
  const button=document.createElement('button');button.dataset.position=x+','+y;button.setAttribute('aria-label',t(vertical)+' · '+t(horizontal));
  button.onclick=()=>{$('alignX').value=x;$('alignY').value=y;changed();};$('position-grid').append(button);
 }
 all('[data-book]').forEach(button=>button.onclick=()=>{$('book').value=button.dataset.book;changed();});
 function render(){
  syncSettings();
  try{
   if(liveFailure)throw liveFailure;
   const c=config(),plans=compute(c),u=G.UNITS[c.unit];
   const hint=t('Bare values use document units ({unit}).',{unit:context.unit||'pt'});
   if(hint!==lastHint){lastHint=hint;all('#page-grid input:not([type=checkbox]):not([type=number])').forEach(el=>el.setAttribute('aria-description',hint));}
   const count=plans.reduce((n,p)=>n+p.lines.length,0);
   if(mode==='grid'){const p=plans[0];$('column-result').textContent=p.columns.count?`${Number((p.columns.size/u).toFixed(3))} ${c.unit}`:'';$('row-result').textContent=p.rows.count?`${Number((p.rows.size/u).toFixed(3))} ${c.unit}`:'';}
   $('apply').disabled=working||!H.available||count===0;
   syncSliders(plans);if(liveSession&&!working)liveQueue.push(wire(plans));
   status(t('{n} guides',{n:count})+(plans.length>1?' · '+t('{n} artboards',{n:plans.length}):''));
  }catch(error){if(liveQueue)liveQueue.clear();$('apply').disabled=true;status(error.message,true);}
 }
 async function action(fn){if(working)return;working=true;++refreshId;const controls=all('button,input,select,textarea'),disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);status(t('Working…'));try{if(refreshTask)await refreshTask;await fn();}catch(error){if(liveSession)try{await cancelLive();}catch(recovery){error=recovery;}status(error.message,true);}finally{working=false;controls.forEach((el,i)=>el.disabled=disabled[i]);guideButtons(context?.guideState);liveControls();try{$('apply').disabled=!H.available||!!liveFailure||compute().every(p=>!p.lines.length);}catch{$('apply').disabled=true;}}}
 $('apply').onclick=()=>action(async()=>{if(liveSession){await liveQueue.flush(wire(compute()));const result=await H.call('liveCommit',{id:liveSession,settings:gridSettings()});context.guideState=result.guideState;await endLive();return;}context=await read();const plans=compute();const result=await H.call('apply',{token:context.token,plans:plans.map(p=>({key:p.key,lines:p.lines})),mode:'replace',settings:gridSettings()});context.guideState=result.guideState;status(t('Created {n}; replaced {r}.',{n:result.count,r:result.removed}));});
 $('lock-guides').onclick=()=>action(async()=>{if(liveSession){await liveQueue.flush(wire(compute()));const result=await H.call('liveCommit',{id:liveSession,settings:gridSettings()});context.guideState=result.guideState;await endLive();}previewEnabled=false;syncPreview();const state=await H.call('lockGuides');if(context)context.guideState=state;status(t(state.locked?'gridloom layer locked.':'gridloom layer unlocked.'));});
 $('visibility').onclick=()=>action(async()=>{const state=await H.call('visibility');if(context)context.guideState=state;status(t(state.visible?'gridloom layer shown.':'gridloom layer hidden.'));});
 $('reset').onclick=()=>{const c=G.defaults();for(const key of Object.keys(c.margins))c.margins[key]='';for(const key of ['cols','rows','colWidth','rowHeight','gutterX','gutterY'])c[key]='';setConfig(c);$('notation').value='';notationUnit=null;$('save-form').hidden=true;editing=-1;tab('grid');changed();};
 all('#page-grid input:not([type=range])').forEach(el=>el.oninput=()=>{if(el.id.startsWith('margin-')&&$('linked').checked)['top','right','bottom','left'].forEach(k=>$('margin-'+k).value=el.value);if(el.id==='linked'){render();saveSession();}else changed();});
 all('#page-grid input:not([type])').forEach(el=>el.addEventListener('keydown',event=>{
  if(event.key!=='ArrowUp'&&event.key!=='ArrowDown')return;
  const match=el.value.match(/^(\s*)([+-]?(?:\d+\.?\d*|\.\d+))(\s*(?:[a-zA-Z%]+)?\s*)$/);
  if(!match)return;
  event.preventDefault();const value=Number((Number(match[2])+(event.key==='ArrowUp'?1:-1)).toFixed(8));
  el.value=match[1]+value+match[3];el.dispatchEvent(new Event('input',{bubbles:true}));
 }));
 fields.filter(k=>!['cols','rows','colWidth','rowHeight','gutterX','gutterY'].includes(k)).forEach(k=>$(k).onchange=changed);
 $('notation').oninput=()=>{notationUnit=null;changed();};

 function wire(plans){return plans.map(p=>({key:p.key,lines:p.lines}));}
 function syncSliders(plans){
  for(const [key,axis] of [['cols','columns'],['rows','rows']]){
   const input=$(key),range=$(key+'-range'),value=input.value===''?(plans[0][axis]?.count||0):Number(input.value);
   range.max=Math.min(1000,Math.max(Number(range.max),24,Math.ceil(value/12)*12));range.value=value;
  }
 }
 for(const key of ['cols','rows']){
  const toggle=$(key+'-toggle'),slider=$(key+'-slider'),range=$(key+'-range');
  toggle.onclick=()=>{slider.hidden=!slider.hidden;toggle.setAttribute('aria-expanded',String(!slider.hidden));};
  range.oninput=()=>{$(key).value=range.value;changed();};
  range.onkeydown=e=>{if(e.key==='Escape'){slider.hidden=true;toggle.setAttribute('aria-expanded','false');toggle.focus();}};
 }
 function liveControls(){
  $('apply').textContent=t('Apply');
  $('live-preview').disabled=working||!H.available||context?.capabilities?.livePreview===false;
 }
 async function endLive(){
  if(liveQueue)await liveQueue.stop();liveQueue=null;liveSession=null;
  liveFailure=null;lastLiveKey=null;liveControls();status('');
 }
 async function cancelLive(){
  if(liveQueue)await liveQueue.stop();await H.call('liveCancel');await endLive();
 }
 function syncPreview(){$('live-preview').setAttribute('aria-pressed',String(previewEnabled));}
 $('live-preview').onclick=()=>{previewEnabled=!previewEnabled;syncPreview();if(previewEnabled)changed();else if(liveSession)action(()=>cancelLive());};
 window.addEventListener('beforeunload',()=>{saveSession();if(liveQueue)liveQueue.stop().then(()=>H.call('liveCancel')).catch(()=>{});});
 function changed(){
  formInitialized=true;saveSession();render();
  if(context?.capabilities?.livePreview===false||!previewEnabled||!H.available||working||liveSession||$('status').classList.contains('error'))return;
  action(async()=>{
   context=await read();const plans=wire(compute());
   const result=await H.call('liveBegin',{token:context.token,mode:'replace'});liveSession=result.id;
   liveQueue=window.GridloomLive.queue(async plans=>{const key=JSON.stringify(plans);if(key===lastLiveKey)return;const value=await H.call('liveUpdate',{id:liveSession,plans});context.guideState=value.guideState;lastLiveKey=key;},error=>{liveFailure=error;previewEnabled=false;syncPreview();$('apply').disabled=true;status(error.message,true);setTimeout(()=>{if(liveSession&&!working)action(async()=>{await cancelLive();throw error;});},0);},300);
   liveControls();await liveQueue.flush(plans);
  });
 }

 function selectPreset(p){try{const c=p.mode==='notation'?N.toGrid(p.notation,context.contexts[0],p.config):p.config;setConfig(c);notationUnit=null;mode='grid';tab('grid');changed();}catch(error){status(error.message,true);}}
 function thumbnail(p){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 128');svg.setAttribute('aria-hidden','true');
  const sample={bounds:[0,594,420,0],artboard:[0,594,420,0]};
  try{const lines=p.mode==='grid'?G.plan(p.config,sample).lines:N.compile(p.notation,sample,p.config).lines;
   for(const line of lines.slice(0,180)){const path=document.createElementNS(ns,'line');for(const [key,value] of Object.entries({x1:8+line[0]/5,y1:5+(594-line[1])/5,x2:8+line[2]/5,y2:5+(594-line[3])/5}))path.setAttribute(key,value);svg.append(path);}
  }catch{const text=document.createElementNS(ns,'text');text.setAttribute('x','45');text.setAttribute('y','64');text.textContent='—';svg.append(text);}return svg;
 }
 function card(p,label,fn){const b=document.createElement('button');b.className='preset-card';b.append(thumbnail(p));const text=document.createElement('span');text.textContent=label;b.append(text);b.onclick=()=>{all('.preset-card').forEach(el=>el.removeAttribute('aria-pressed'));b.setAttribute('aria-pressed','true');fn();};return b;}
 const builtinNames=[["reading", "Reading column"], ["editorial2", "Editorial · 2 columns"], ["editorial3", "Editorial · 3 columns"], ["modules8", "Modules · 2 × 4"], ["modules20", "Modules · 4 × 5"], ["modules32", "Modules · 4 × 8"], ["columns", "12 columns"], ["modular", "Modular grid"], ["thirds", "Rule of thirds"], ["golden", "Golden ratio"], ["fibonacci", "Fibonacci"], ["baseline", "Baseline"], ["ratio", "16:9 frame"]];
 function hostPresets(){
  all('[data-host-preset]').forEach(el=>el.remove());if(!context?.prefill)return;
  const c=context.prefill.config,g=context.prefill.grid;
  const grid={...c,cols:'',rows:'',colWidth:(g.pointSize*g.horizontalScale/100)+'pt',rowHeight:(g.pointSize*g.verticalScale/100)+'pt',gutterX:(g.vertical?g.lineAki:g.characterAki)+'pt',gutterY:(g.vertical?g.characterAki:g.lineAki)+'pt'};
  for(const [label,config] of [['Page margins and columns',c],['Page layout grid',grid]]){const p={name:t(label),mode:'grid',config,notation:''},b=card(p,t(label),()=>selectPreset(p));b.dataset.hostPreset='true';$('preset-cards').append(b);}
 }
 function mountPresets(){
  if(presetsMounted)return;presetsMounted=true;
 for(const [name,label] of builtinNames){const p=P.builtIn(name);const b=card(p,t(label),()=>selectPreset(p));b.dataset.builtin=name;$('preset-cards').append(b);}
  list();
 }
 function list(){if(!presetsMounted)return;const box=$('preset-list');box.replaceChildren();presets.forEach((p,i)=>{const row=document.createElement('div');row.className='preset';row.append(card(p,p.name,()=>selectPreset(p)));const actions=document.createElement('div');actions.className='preset-tools';for(const [label,fn] of [[t('Edit'),()=>{editing=i;selectPreset(p);$('preset-name').value=p.name;$('save-form').hidden=false;}],[t('Delete'),()=>{presets.splice(i,1);list();store();}]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.append(b);}row.append(actions);box.append(row);});}
 $('save').onclick=()=>{editing=-1;$('preset-name').value='';$('save-form').hidden=false;$('preset-name').focus();};$('save-cancel').onclick=()=>$('save-form').hidden=true;
 $('save-confirm').onclick=()=>{try{compute();const p=P.validate(currentPreset($('preset-name').value));G.assert(editing>=0||presets.length<100,'最多保存 100 个预设');if(editing>=0)presets[editing]=p;else presets.push(p);list();$('save-form').hidden=true;status(t('Preset saved.'));store();}catch(error){status(error.message,true);}};
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([P.encode(presets)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gridloom-presets.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import').onclick=()=>$('import-file').click();$('import-file').onchange=async()=>{try{const file=$('import-file').files[0];if(!file)return;G.assert(file.size<1000000,'文件过大');const incoming=P.decode(await file.text());G.assert(presets.length+incoming.length<=100,'预设总数超过 100');presets.push(...incoming);list();status(t('Imported {n} presets.',{n:incoming.length}));store();}catch(error){status(error.message,true);}finally{$('import-file').value='';}};
 try{const raw=localStorage.getItem('gridloom.presets.v1');if(raw)presets=P.decode(raw);}catch(error){status(t('Stored presets could not be read.'),true);}
 $('preview-note').hidden=H.available;if(!H.available)['apply','visibility','lock-guides'].forEach(k=>$(k).disabled=true);
 let frame=0,lastFit='';
 function fitPanel(){
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const width=Math.max(260,window.innerWidth),height=Math.min(Math.max(260,Math.ceil(Math.min($('content-layout').getBoundingClientRect().height,$('options').hidden?420:Infinity)+all('main > .tabbar,main > .notice,main > footer').reduce((n,el)=>n+el.getBoundingClientRect().height,0))+2),Math.max(260,screen.availHeight-80));
   const key=width+':'+height;if(!H.available||key===lastFit)return;lastFit=key;
   if(Math.abs(window.innerHeight-height)>2)try{H.resize(width,height);}catch(error){console.warn('Panel resize unavailable',error);}
  });
 }
 const layoutObserver=new ResizeObserver(fitPanel);layoutObserver.observe($('content-layout'));layoutObserver.observe(document.querySelector('footer'));
 document.fonts.ready.then(fitPanel);window.addEventListener('resize',fitPanel);fitPanel();
 window.addEventListener('focus',refresh);document.addEventListener('pointerenter',refresh);liveControls();
 restoreSession().then(refresh);
})();
