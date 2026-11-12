// SPDX-License-Identifier: GPL-3.0-only
/* InDesign adapter: page margin import and native ruler guides, ES3. */
var GridloomSessionId=typeof GridloomSessionId==='string'?GridloomSessionId:String(new Date().getTime())+'-'+String(Math.random());
var GridloomHost=(function(){
 var pending=null,serial=0,prefix='gridloom:1|';
 function encode(v){var t=typeof v,a=[],k;if(v===null||t==='undefined')return 'null';if(t==='string')return '"'+v.replace(/["\\\x00-\x1f]/g,function(c){return '\\u'+('0000'+c.charCodeAt(0).toString(16)).slice(-4);})+'"';if(t==='number')return isFinite(v)?String(v):'null';if(t==='boolean')return String(v);if(v instanceof Array){for(k=0;k<v.length;k++)a.push(encode(v[k]));return '['+a.join(',')+']';}for(k in v)if(v.hasOwnProperty(k))a.push(encode(k)+':'+encode(v[k]));return '{'+a.join(',')+'}';}
 function check(v,m){if(!v)throw Error(m);}
 function number(v){return Number(Number(v).toFixed(6));}
 function pt(v){return number(v)+'pt';}
 function doc(){check(app.documents.length,'请先打开 InDesign 文档');return app.activeDocument;}
 function layer(d){var l=d.layers.itemByName('gridloom');return l.isValid?l:null;}
 function state(d){var l=layer(d);return {exists:!!l,locked:l?l.locked:false,visible:l?l.visible:true};}
 function unit(d){var u=d.viewPreferences.horizontalMeasurementUnits,m=MeasurementUnits;if(u===m.MILLIMETERS)return 'mm';if(u===m.CENTIMETERS)return 'cm';if(u===m.INCHES)return 'in';if(u===m.PICAS)return 'pc';return 'pt';}
 function currentPage(d){var selection=app.selection;for(var i=0;i<selection.length;i++){var item=selection[i];if(item.hasOwnProperty('geometricBounds')&&item.parentPage&&item.parentPage.isValid)return item.parentPage;}var p;try{p=app.activeWindow.activePage;}catch(e){}check(p&&p.isValid,'请打开 InDesign 版面窗口');return p;}
 function bounds(p){var b=p.bounds;return [number(b[1]),-number(b[0]),number(b[3]),-number(b[2])];}
 function context(d,p){var area=bounds(p),selection=app.selection,b=null,ids=[],i,item,q,key='page:'+p.id;
  for(i=0;i<selection.length;i++){item=selection[i];if(!item.hasOwnProperty('geometricBounds'))continue;check(item.parentPage&&item.parentPage.id===p.id,'请选择当前页内的对象');q=item.geometricBounds;ids.push(item.id);if(!b)b=[Number(q[1]),-Number(q[0]),Number(q[3]),-Number(q[2])];else b=[Math.min(b[0],q[1]),Math.max(b[1],-q[0]),Math.max(b[2],q[3]),Math.min(b[3],-q[2])];}
  if(b){check(b[2]>b[0]&&b[1]>b[3],'选区需要具有宽度和高度');key+=':selection:'+ids.join(',');}
  return {key:key,name:p.name,bounds:b||area,artboard:area};
 }
 function prefill(d,p){var m=p.marginPreferences,vertical=m.columnDirection===HorizontalOrVertical.VERTICAL,left=Number(m.left),right=Number(m.right),isLeft=p.side===PageSideOptions.LEFT_HAND;
  // In facing pages, left/right preferences are inside/outside values.
  if(d.documentPreferences.facingPages&&isLeft){var temp=left;left=right;right=temp;}
  var displayUnit=unit(d),factor={mm:72/25.4,cm:72/2.54,'in':72,pc:12,pt:1}[displayUnit];
  function dimension(value){return number(Number(value)/factor)+displayUnit;}
  var c={unit:displayUnit,margins:{top:dimension(m.top),right:dimension(right),bottom:dimension(m.bottom),left:dimension(left)},cols:vertical?'0':String(m.columnCount),rows:vertical?String(m.columnCount):'0',colWidth:'',rowHeight:'',gutterX:vertical?'0pt':dimension(m.columnGutter),gutterY:vertical?dimension(m.columnGutter):'0pt',alignX:'start',alignY:'start',book:'none',border:false,precision:3,guideLength:'artboard'};
  if(m.customColumns){var values=m.columnsPositions,parts=[],previous=0;for(var i=0;i<values.length;i++){var v=Number(values[i]);if(v!==previous)parts.push(pt(v-previous));parts.push('|');previous=v;}c[vertical?'rows':'cols']='1';c[vertical?'rowHeight':'colWidth']=parts.join(' ');c[vertical?'gutterY':'gutterX']='0pt';check(parts.join(' ').length<=512,'尺寸字段过长');}
  var g=p.gridData;
  var grid={pointSize:Number(g.pointSize),characterAki:Number(g.characterAki),lineAki:Number(g.lineAki),horizontalScale:Number(g.horizontalScale),verticalScale:Number(g.verticalScale),vertical:vertical};
  return {config:c,grid:grid,sourceKey:d.id+':'+p.id+':'+encode([c,grid])};
 }
 function read(){var d=doc(),p=currentPage(d),c=context(d,p),settings=prefill(d,p),token=String(++serial);
  pending={docId:d.id,pageId:p.id,context:c,token:token,origin:String(d.viewPreferences.rulerOrigin),zero:encode(d.zeroPoint),unit:unit(d)};
  return {token:token,name:d.name,unit:pending.unit,contexts:[c],guideState:state(d),prefill:settings,savedGrid:savedGrid(d,c.key),capabilities:{livePreview:true,host:'InDesign'}};
 }
 function savedGrid(d,key){var tag=prefix+key+'|',marker='\ngridloom:settings|',g,at;for(var i=0;i<d.guides.length;i++){g=d.guides[i];if(g.label.indexOf(tag)===0){at=g.label.indexOf(marker);if(at>=0)return g.label.substring(at+marker.length);}}return null;}
 function verified(token){var d=doc(),p=currentPage(d);check(pending&&pending.token===token,'操作已过期，请重新生成');check(d.id===pending.docId&&p.id===pending.pageId,'选区或画板已变化，请重新生成');check(encode(context(d,p))===encode(pending.context)&&pending.origin===String(d.viewPreferences.rulerOrigin)&&pending.zero===encode(d.zeroPoint)&&pending.unit===unit(d),'选区或画板已变化，请重新生成');return {doc:d,page:p,context:pending.context};}
 function snapshot(g){return {orientation:g.orientation,location:g.location,itemLayer:g.itemLayer,fitToPage:g.fitToPage,label:g.label,locked:g.locked};}
 function apply(payload){var s=verified(payload.token),d=s.doc,p=s.page,plans=payload.plans,lines,seen={},unique=[],old=[],created=[],removed=[],l=layer(d),made=false,i,j,g,x,key;
  check(plans instanceof Array&&plans.length===1&&plans[0].key===s.context.key,'网格范围不匹配');lines=plans[0].lines;check(lines instanceof Array&&lines.length<=5000,'一次操作最多生成 5000 条参考线');
  for(i=0;i<lines.length;i++){x=lines[i];check(x instanceof Array&&x.length===4,'无效参考线');for(j=0;j<4;j++)check(typeof x[j]==='number'&&isFinite(x[j])&&Math.abs(x[j])<1e7,'坐标超出范围');check(x[0]===x[2]||x[1]===x[3],'仅支持水平或垂直参考线');var v=x[0]===x[2];key=(v?'v':'h')+':'+(v?x[0]:-x[1]);if(!seen[key]){seen[key]=true;unique.push({orientation:v?HorizontalOrVertical.VERTICAL:HorizontalOrVertical.HORIZONTAL,location:v?x[0]:-x[1]});}}
  if(l)check(!l.locked&&l.visible,'请先解锁并显示 gridloom 图层');
  var tag=prefix+s.context.key+'|';
  for(i=0;i<d.guides.length;i++){g=d.guides[i];if(g.label.indexOf(tag)===0){check(!g.locked&&!g.itemLayer.locked,'范围内有锁定参考线，请先解锁');old.push(g);}}
  try{if(!l){l=d.layers.add({name:'gridloom'});made=true;}
   for(i=0;i<unique.length;i++){g=p.guides.add(l,{orientation:unique[i].orientation,location:pt(unique[i].location),fitToPage:true});created.push(g);g.label=tag+serial+(i===0&&payload.settings?'\ngridloom:settings|'+payload.settings:'');}
   for(i=0;i<old.length;i++){var data=snapshot(old[i]);old[i].remove();removed.push(data);}
   pending=null;return {count:created.length,removed:removed.length,guideState:state(d)};
  }catch(error){for(i=created.length-1;i>=0;i--)try{if(created[i].isValid)created[i].remove();}catch(ignore){}for(i=0;i<removed.length;i++){var z=removed[i];p.guides.add(z.itemLayer,{orientation:z.orientation,location:pt(z.location),fitToPage:z.fitToPage,label:z.label,locked:z.locked});}if(made&&l.isValid&&!l.allPageItems.length)try{l.remove();}catch(ignore2){}throw error;}
 }
 function beginLive(payload){
  check(!$.global.GridloomIDPreview,'请先应用或取消实时编辑');var s=verified(payload.token),l=layer(s.doc),originals=[],g;
  if(l)check(!l.locked&&l.visible,'请先解锁并显示 gridloom 图层');
  for(var i=0;i<s.doc.guides.length;i++){g=s.doc.guides[i];if(g.label.indexOf(prefix+s.context.key+'|')===0){check(!g.locked&&!g.itemLayer.locked,'范围内有锁定参考线，请先解锁');var data=snapshot(g);data.layerId=g.itemLayer.id;delete data.itemLayer;originals.push(data);}}
  $.global.GridloomIDPreview={id:String(++serial),scope:pending,originals:originals,changed:false,created:!l};return {id:$.global.GridloomIDPreview.id};
 }
 function liveState(id){check($.global.GridloomIDPreview&&$.global.GridloomIDPreview.id===id,'实时编辑已结束，请重新开启');pending=$.global.GridloomIDPreview.scope;return verified(pending.token);}
 function updateLive(payload){var s=liveState(payload.id),result=apply({token:pending.token,plans:payload.plans});$.global.GridloomIDPreview.changed=true;$.global.GridloomIDPreview.plans=payload.plans;return result;}
 function commitLive(payload){var s=liveState(payload.id);check($.global.GridloomIDPreview.changed,'请先调整网格');var result=apply({token:pending.token,plans:$.global.GridloomIDPreview.plans,settings:payload.settings});$.global.GridloomIDPreview=null;return result;}
 function cancelLive(){
  if(!$.global.GridloomIDPreview)return {};var d=null,i,g,p,l;
  for(i=0;i<app.documents.length;i++)if(app.documents[i].id===$.global.GridloomIDPreview.scope.docId)d=app.documents[i];
  if(!d){$.global.GridloomIDPreview=null;return {};}
  p=d.pages.itemByID($.global.GridloomIDPreview.scope.pageId);if(!p.isValid){$.global.GridloomIDPreview=null;return {};}
  if($.global.GridloomIDPreview.changed){
   var originals=$.global.GridloomIDPreview.originals,restored=[],current=[];
   for(i=0;i<d.guides.length;i++){g=d.guides[i];if(g.label.indexOf(prefix+$.global.GridloomIDPreview.scope.context.key+'|')===0){check(!g.locked&&!g.itemLayer.locked,'范围内有锁定参考线，请先解锁');current.push(g);}}
   try{for(i=0;i<originals.length;i++){var z=originals[i];l=d.layers.itemByID(z.layerId);check(l.isValid&&!l.locked,'范围内有锁定参考线，请先解锁');restored.push(p.guides.add(l,{orientation:z.orientation,location:pt(z.location),fitToPage:z.fitToPage,label:z.label,locked:z.locked}));}}
   catch(error){for(i=0;i<restored.length;i++)if(restored[i].isValid)restored[i].remove();throw error;}
   for(i=current.length-1;i>=0;i--)current[i].remove();
   l=layer(d);if($.global.GridloomIDPreview.created&&l&&!l.allPageItems.length){var used=false;for(i=0;i<d.guides.length;i++)if(d.guides[i].itemLayer.id===l.id)used=true;if(!used)l.remove();}
  }
  $.global.GridloomIDPreview=null;pending=null;return {guideState:state(d)};
 }
 function toggle(property){var d=doc(),l=layer(d);check(l,'请先生成 gridloom 参考线');l[property]=!l[property];return state(d);}
 function dispatch(method,payload){var old=app.scriptPreferences.measurementUnit;try{app.scriptPreferences.measurementUnit=MeasurementUnits.POINTS;var value;
  if(method==='session')value={id:GridloomSessionId};else if(method==='context')value=read();else if(method==='apply'){value=apply(payload);}else if(method==='lockGuides')value=toggle('locked');else if(method==='visibility')value=toggle('visible');else if(method==='liveBegin')value=beginLive(payload);else if(method==='liveUpdate'||method==='liveCommit'||method==='liveCancel'){if(method==='liveUpdate')value=updateLive(payload);else if(method==='liveCommit')value=commitLive(payload);else value=cancelLive();}else throw Error('Unknown gridloom operation');
  return encode({ok:true,value:value});
 }catch(error){return encode({ok:false,error:String(error.message||error)});}finally{app.scriptPreferences.measurementUnit=old;}}
 return {dispatch:dispatch};
})();
