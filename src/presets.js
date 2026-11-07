// SPDX-License-Identifier: GPL-3.0-only
(function(root,factory){const api=factory(typeof module==='object'?require('./core.js'):root.Gridloom);if(typeof module==='object')module.exports=api;else root.GridloomPresets=api;})(typeof globalThis==='object'?globalThis:this,function(G){
 'use strict';
 function validate(p){
  G.assert(p&&typeof p.name==='string'&&p.name.trim().length>0&&p.name.length<=80,'无效预设名称');
  G.assert(p.mode==='grid'||p.mode==='notation','无效预设模式');
  const c=p.config,d=G.defaults();G.assert(c&&Object.hasOwn(G.UNITS,c.unit),'无效预设单位');
  G.assert(c.margins&&['top','right','bottom','left'].every(k=>typeof c.margins[k]==='string'&&c.margins[k].length<=512),'无效边距');
  for(const k of ['cols','rows','colWidth','rowHeight','gutterX','gutterY'])G.assert(typeof c[k]==='string'&&c[k].length<=512,'无效尺寸字段');
  G.assert(['start','center','end'].includes(c.alignX)&&['start','center','end'].includes(c.alignY),'无效位置');
  G.assert(['artboard','selection'].includes(c.guideLength),'无效参考线长度');
  G.assert(Number.isInteger(c.precision)&&c.precision>=0&&c.precision<=6&&typeof c.border==='boolean','无效精度');
  G.assert(typeof p.notation==='string'&&p.notation.length<=50000,'无效语法文本');
  // Allowlist fields; never merge arbitrary imported keys into runtime state.
  return {name:p.name.trim(),mode:p.mode,config:Object.fromEntries(Object.keys(d).map(k=>[k,k==='margins'?Object.fromEntries(['top','right','bottom','left'].map(side=>[side,c.margins[side]])):c[k]])),notation:p.notation};
 }
 function decode(text){G.assert(text.length<1000000,'预设文件过大');const data=JSON.parse(text);G.assert(data.version===1&&Array.isArray(data.presets)&&data.presets.length<=100,'不支持的预设格式');return data.presets.map(validate);}
 function encode(presets){return JSON.stringify({version:1,presets:presets.map(validate)},null,2);}
 function builtIn(name,context){
  const config=G.defaults();let mode='grid',notation='';
  const classic={reading:[1,0],editorial2:[2,0],editorial3:[3,0],modules8:[2,4],modules20:[4,5],modules32:[4,8]};
  if(classic[name]){config.cols=String(classic[name][0]);config.rows=String(classic[name][1]);config.margins={top:'6%',right:'8%',bottom:'10%',left:'8%'};config.gutterX=config.gutterY='2%';}
  if(name==='modular'){config.cols='6';config.rows='8';}
  if(name==='thirds'){config.cols=config.rows='3';config.gutterX=config.gutterY='0';for(const k in config.margins)config.margins[k]='0';}
  const width=context?context.bounds[2]-context.bounds[0]:420*G.UNITS.mm;
  const height=context?context.bounds[1]-context.bounds[3]:594*G.UNITS.mm;
  const ratioWidth=Math.min(width,height*16/9),ratioHeight=ratioWidth*9/16;
  const sources={golden:'| 38.1966% | 23.6068% | 38.1966% | (v)\n| 38.1966% | 23.6068% | 38.1966% | (h)',fibonacci:'| ~ | ~ | ~*2 | ~*3 | ~*5 | ~*8 | (v)',baseline:'$row = | 16px |\n$row* (h)',ratio:`~ | { ~ (${ratioWidth}pt) } | ~ (v)\n~ | { ~ (${ratioHeight}pt) } | ~ (h)`};
  if(sources[name]){mode='notation';notation=sources[name];}
  G.assert(['columns','modular','thirds',...Object.keys(classic),...Object.keys(sources)].includes(name),'未知预设');
  return {name,mode,config,notation};
 }
 return {validate,decode,encode,builtIn};
});
