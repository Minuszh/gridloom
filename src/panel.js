// SPDX-License-Identifier: GPL-3.0-only
/* UI state stays local. All writes re-read and verify the host context. */
(() => {
 'use strict';
 document.addEventListener('keydown',e=>{if(e.key==='Tab')document.documentElement.classList.add('keyboard-focus');});
 document.addEventListener('pointerdown',()=>document.documentElement.classList.remove('keyboard-focus'));
 const G=window.Gridloom,N=window.GridloomNotation,P=window.GridloomPresets,H=window.GridloomHostClient;
 const I=window.GridloomI18n.create((!H.available&&new URLSearchParams(location.search).get('lang'))||H.locale),t=I.t;I.apply(document);window.GridloomIcons.mount(t);
 const $=id=>document.getElementById(id),all=s=>Array.from(document.querySelectorAll(s));
 const fields=['cols','rows','colWidth','rowHeight','gutterX','gutterY','alignX','alignY','guideLength'];
 let mode='grid',context=null,presets=[],editing=-1,working=false,refreshId=0,notationUnit=null;
 let planCache=null,refreshTask=null,lastHint='';
 function guideButtons(state){
  for(const [id,key,on,off,label] of [['lock-guides','locked','lock','unlock','Lock gridloom layer'],['visibility','visible','eye','eyeOff','Show gridloom layer']]){
   const button=$(id),known=Boolean(state?.exists);button.disabled=working||!H.available||!known;
   button.setAttribute('aria-label',t(label));
   if(known)button.setAttribute('aria-pressed',String(state[key]));else button.removeAttribute('aria-pressed');
   window.GridloomIcons.set(button,known&&!state[key]?off:on);
  }
 }
 const status=(text,error=false)=>{$('status').textContent=error?I.error(text):text;$('status').classList.toggle('error',error);$('status').setAttribute('aria-hidden',String(!error));};
 function config(){return {unit:mode==='notation'&&notationUnit?notationUnit:(context?.unit||'pt'),margins:Object.fromEntries(['top','right','bottom','left'].map(k=>[k,$('margin-'+k).value])),...Object.fromEntries(fields.map(k=>[k,$(k).value])),precision:Number($('precision').value),border:$('border').checked};}
 function setConfig(c){
  const explicit=value=>{try{return G.qualify(value,c.unit);}catch{return value;}};
  for(const k in c.margins)$('margin-'+k).value=explicit(c.margins[k]);
  fields.forEach(k=>$(k).value=['colWidth','rowHeight','gutterX','gutterY'].includes(k)?explicit(c[k]):c[k]);
  $('precision').value=c.precision;$('border').checked=c.border;
 }
 const currentPreset=name=>({name,mode,config:config(),notation:$('notation').value});
 function store(){try{localStorage.setItem('gridloom.presets.v1',P.encode(presets));}catch(error){status(t('Cannot save locally. Export a backup.'),true);}}
 function tab(value){if(value!=='presets')mode=value;all('[data-tab]').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===value)));all('[role=tabpanel]').forEach(p=>{p.hidden=p.id!=='page-'+value;p.setAttribute('aria-hidden',String(p.hidden));});render();}
 all('[data-tab]').forEach(b=>b.onclick=()=>tab(b.dataset.tab));
 async function read(){
  if(!H.available)return {name:'Sample',unit:'mm',contexts:[{key:'artboard:0',name:'A2',bounds:[0,594*G.UNITS.mm,420*G.UNITS.mm,0],artboard:[0,594*G.UNITS.mm,420*G.UNITS.mm,0]}]};
  return H.call('context',{scope:'auto',visibleBounds:$('bounds-mode').value==='visible'});
 }
 async function refresh(){
  if(working)return;if(refreshTask)return refreshTask;
  const request=++refreshId;
  refreshTask=(async()=>{try{const next=await read();if(request!==refreshId)return;context=next;guideButtons(next.guideState);render();}catch(error){if(request!==refreshId)return;context=null;guideButtons(null);$('apply').disabled=true;status(error.message,true);}})();
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
 function render(){
  try{
   const c=config(),plans=compute(c),first=context.contexts[0],b=first.bounds,u=G.UNITS[c.unit];
   const hint=t('Bare values use document units ({unit}).',{unit:context.unit||'pt'});
   if(hint!==lastHint){lastHint=hint;all('#page-grid input:not([type=checkbox]):not([type=number])').forEach(el=>el.setAttribute('aria-description',hint));}
   const count=plans.reduce((n,p)=>n+p.lines.length,0);
   if(mode==='grid'){const p=plans[0];$('column-result').textContent=p.columns.count?`${Number((p.columns.size/u).toFixed(3))} ${c.unit}`:'';$('row-result').textContent=p.rows.count?`${Number((p.rows.size/u).toFixed(3))} ${c.unit}`:'';}
   $('apply').disabled=working||!H.available||count===0;
   status(t('{n} guides',{n:count})+(plans.length>1?' · '+t('{n} artboards',{n:plans.length}):''));
  }catch(error){$('apply').disabled=true;status(error.message,true);}
 }
 async function action(fn){if(working)return;working=true;++refreshId;const controls=all('button,input,select,textarea'),disabled=controls.map(el=>el.disabled);controls.forEach(el=>el.disabled=true);status(t('Working…'));try{if(refreshTask)await refreshTask;await fn();}catch(error){status(error.message,true);}finally{working=false;controls.forEach((el,i)=>el.disabled=disabled[i]);guideButtons(context?.guideState);}}
 $('apply').onclick=()=>action(async()=>{context=await read();const plans=compute();const result=await H.call('apply',{token:context.token,plans:plans.map(p=>({key:p.key,lines:p.lines})),mode:$('write-mode').value});context.guideState=result.guideState;status(t('Created {n}; replaced {r}.',{n:result.count,r:result.removed}));});
 $('clear').onclick=()=>{if($('clear-mode').value==='all'&&!confirm(t('Clear ALL guides in this scope, including manually created guides?')))return;action(async()=>{context=await read();const result=await H.call('clear',{token:context.token,clearMode:$('clear-mode').value});context.guideState=result.guideState;status(t('Removed {n} guides.',{n:result.removed}));});};
 $('lock-guides').onclick=()=>action(async()=>{const state=await H.call('lockGuides');if(context)context.guideState=state;status(t(state.locked?'gridloom layer locked.':'gridloom layer unlocked.'));});
 $('visibility').onclick=()=>action(async()=>{const state=await H.call('visibility');if(context)context.guideState=state;status(t(state.visible?'gridloom layer shown.':'gridloom layer hidden.'));});
 all('[data-quick]').forEach(b=>{b.setAttribute('aria-label',t(({left:'Left edge',center:'Vertical center',right:'Right edge',top:'Top edge',middle:'Horizontal center',bottom:'Bottom edge'})[b.dataset.quick]));b.onclick=()=>action(async()=>{context=await read();const plans=context.contexts.map(c=>({key:c.key,lines:G.quick(b.dataset.quick,c,config().guideLength)}));const result=await H.call('apply',{token:context.token,plans,mode:'append'});context.guideState=result.guideState;status(t('Added {n} guides.',{n:result.count}));});});
 $('reset').onclick=()=>{const c=G.defaults();for(const key of Object.keys(c.margins))c.margins[key]='';for(const key of ['cols','rows','colWidth','rowHeight','gutterX','gutterY'])c[key]='';setConfig(c);$('notation').value='';notationUnit=null;$('save-form').hidden=true;editing=-1;tab('grid');};
 $('bounds-mode').onchange=refresh;
 all('#page-grid input').forEach(el=>el.oninput=()=>{if(el.id.startsWith('margin-')&&$('linked').checked)['top','right','bottom','left'].forEach(k=>$('margin-'+k).value=el.value);render();});
 fields.filter(k=>!['cols','rows','colWidth','rowHeight','gutterX','gutterY'].includes(k)).concat(['precision','border']).forEach(k=>$(k).onchange=render);
 $('notation').oninput=()=>{notationUnit=null;render();};

 function load(p){setConfig(p.config);$('notation').value=p.notation;notationUnit=p.config.unit;tab(p.mode);}
 function thumbnail(p){
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 100 128');svg.setAttribute('aria-hidden','true');
  const sample={bounds:[0,594,420,0],artboard:[0,594,420,0]};
  try{const lines=p.mode==='grid'?G.plan(p.config,sample).lines:N.compile(p.notation,sample,p.config).lines;
   for(const line of lines.slice(0,180)){const path=document.createElementNS(ns,'line');for(const [key,value] of Object.entries({x1:8+line[0]/5,y1:5+(594-line[1])/5,x2:8+line[2]/5,y2:5+(594-line[3])/5}))path.setAttribute(key,value);svg.append(path);}
  }catch{const text=document.createElementNS(ns,'text');text.setAttribute('x','45');text.setAttribute('y','64');text.textContent='—';svg.append(text);}return svg;
 }
 function card(p,label,fn){const b=document.createElement('button');b.className='preset-card';b.append(thumbnail(p));const text=document.createElement('span');text.textContent=label;b.append(text);b.onclick=()=>{all('.preset-card').forEach(el=>el.removeAttribute('aria-pressed'));b.setAttribute('aria-pressed','true');fn();};return b;}
 const builtinNames=[["reading", "Reading column"], ["editorial2", "Editorial · 2 columns"], ["editorial3", "Editorial · 3 columns"], ["modules8", "Modules · 2 × 4"], ["modules20", "Modules · 4 × 5"], ["modules32", "Modules · 4 × 8"], ["columns", "12 columns"], ["modular", "Modular grid"], ["thirds", "Rule of thirds"], ["golden", "Golden ratio"], ["fibonacci", "Fibonacci"], ["baseline", "Baseline"], ["ratio", "16:9 frame"]];
 for(const [name,label] of builtinNames){const p=P.builtIn(name);const b=card(p,t(label),()=>{setConfig(p.config);$('notation').value=p.notation;notationUnit=p.config.unit;mode=p.mode;render();});b.dataset.builtin=name;$('preset-cards').append(b);}
 function list(){const box=$('preset-list');box.replaceChildren();presets.forEach((p,i)=>{const row=document.createElement('div');row.className='preset';row.append(card(p,p.name,()=>{setConfig(p.config);$('notation').value=p.notation;notationUnit=p.config.unit;mode=p.mode;render();}));const actions=document.createElement('div');actions.className='preset-tools';for(const [label,fn] of [[t('Edit'),()=>{editing=i;load(p);$('preset-name').value=p.name;$('save-form').hidden=false;}],[t('Delete'),()=>{presets.splice(i,1);list();store();}]]){const b=document.createElement('button');b.textContent=label;b.onclick=fn;actions.append(b);}row.append(actions);box.append(row);});}
 $('save').onclick=()=>{editing=-1;$('preset-name').value='';$('save-form').hidden=false;$('preset-name').focus();};$('save-cancel').onclick=()=>$('save-form').hidden=true;
 $('save-confirm').onclick=()=>{try{compute();const p=P.validate(currentPreset($('preset-name').value));G.assert(editing>=0||presets.length<100,'最多保存 100 个预设');if(editing>=0)presets[editing]=p;else presets.push(p);list();$('save-form').hidden=true;status(t('Preset saved.'));store();}catch(error){status(error.message,true);}};
 $('export').onclick=()=>{const url=URL.createObjectURL(new Blob([P.encode(presets)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='gridloom-presets.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
 $('import').onclick=()=>$('import-file').click();$('import-file').onchange=async()=>{try{const file=$('import-file').files[0];if(!file)return;G.assert(file.size<1000000,'文件过大');const incoming=P.decode(await file.text());G.assert(presets.length+incoming.length<=100,'预设总数超过 100');presets.push(...incoming);list();status(t('Imported {n} presets.',{n:incoming.length}));store();}catch(error){status(error.message,true);}finally{$('import-file').value='';}};
 try{const raw=localStorage.getItem('gridloom.presets.v1');if(raw)presets=P.decode(raw);}catch(error){status(t('Stored presets could not be read.'),true);}
 list();$('preview-note').hidden=H.available;if(!H.available)['apply','clear','visibility','lock-guides',...all('[data-quick]').map(b=>{b.disabled=true;return '';})].filter(Boolean).forEach(k=>$(k).disabled=true);
 // Tabs share one content height. Only structural changes request a host resize.
 let frame=0,lastFit='';
 function fitPanel(){
  cancelAnimationFrame(frame);frame=requestAnimationFrame(()=>{
   const width=Math.max(260,window.innerWidth),height=Math.min(Math.ceil($('content-layout').getBoundingClientRect().height+all('main > .quick,main > .tabbar,main > .notice,main > footer').reduce((n,el)=>n+el.getBoundingClientRect().height,0))+2,Math.max(350,screen.availHeight-80));
   const key=width+':'+height;if(!H.available||key===lastFit)return;lastFit=key;
   if(Math.abs(window.innerHeight-height)>2)try{H.resize(width,height);}catch(error){console.warn('Panel resize unavailable',error);}
  });
 }
 const layoutObserver=new ResizeObserver(fitPanel);layoutObserver.observe($('content-layout'));layoutObserver.observe(document.querySelector('footer'));
 document.fonts.ready.then(fitPanel);fitPanel();
 window.addEventListener('focus',refresh);refresh();
})();
