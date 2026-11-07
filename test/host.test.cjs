// SPDX-License-Identifier: GPL-3.0-only
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const host=fs.readFileSync(require('node:path').join(__dirname,'../host/illustrator.jsx'),'utf8');
function environment(){
 const env=vm.createContext({});
 vm.runInContext(`
 var failAddAt=0,adds=0,redraws=0,failGuides=false;
 var doc={name:'Test.ai',selection:[],pathItems:[],layers:[]};
 function layer(){var l={name:'Artwork',locked:false,visible:true,pageItems:[]};
 l.pathItems={add:function(){adds++;if(failAddAt===adds)throw Error('injected create failure');var p={parent:l,layer:l,guides:false,note:'',name:'',locked:false,hidden:false,editable:true,closed:false,pathPoints:[]};
 if(failGuides)Object.defineProperty(p,'guides',{get:function(){return false;},set:function(){}});
 p.pathPoints.add=function(){var point={};this.push(point);return point;};
 p.setEntirePath=function(points){this.pathPoints.length=0;for(var i=0;i<points.length;i++)this.pathPoints.push({anchor:points[i],leftDirection:points[i],rightDirection:points[i],pointType:0});var a=points[0],b=points[1];this.geometricBounds=[Math.min(a[0],b[0]),Math.max(a[1],b[1]),Math.max(a[0],b[0]),Math.min(a[1],b[1])];};
 p.remove=function(){doc.pathItems.splice(doc.pathItems.indexOf(this),1);l.pageItems.splice(l.pageItems.indexOf(this),1);};doc.pathItems.push(p);l.pageItems.push(p);return p;}};
 l.groupItems=[];l.groupItems.add=function(){
 var g={typename:'GroupItem',name:'',note:'',parent:l,pageItems:[],pathItems:{}};
 g.pathItems.add=function(){var p=l.pathItems.add();l.pageItems.splice(l.pageItems.indexOf(p),1);g.pageItems.push(p);p.parent=g;var remove=p.remove;p.remove=function(){var at=g.pageItems.indexOf(this);if(at>=0)g.pageItems.splice(at,1);var atDoc=doc.pathItems.indexOf(this);if(atDoc>=0)doc.pathItems.splice(atDoc,1);};return p;};
 g.remove=function(){if(this.pageItems.length)throw Error('group not empty');l.groupItems.splice(l.groupItems.indexOf(this),1);l.pageItems.splice(l.pageItems.indexOf(this),1);};
 l.groupItems.push(g);l.pageItems.push(g);return g;
 };
 l.remove=function(){doc.layers.splice(doc.layers.indexOf(this),1)};doc.layers.push(l);return l;}
 doc.layers.add=layer;doc.activeLayer=layer();doc.artboards=[{name:'A',artboardRect:[100,900,520,306]}];doc.artboards.getActiveArtboardIndex=function(){return 0;};
 var app={documents:[doc],activeDocument:doc,redraw:function(){redraws++;},executeMenuCommand:function(){}};
 `+host,env);
 const run=code=>vm.runInContext(code,env);
 const call=(method,payload)=>JSON.parse(run(`GridloomHost.dispatch(${JSON.stringify(method)},${JSON.stringify(payload)})`));
 return {env,run,call};
}
test('host context and apply create tagged native guides',()=>{const e=environment(),c=e.call('context',{}).value;const result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}],mode:'replace'});assert.equal(result.ok,true);assert.equal(result.value.count,1);assert.equal(e.run('doc.pathItems[0].guides'),true);assert.match(e.run('doc.pathItems[0].note'),/^gridloom:1\|artboard:0\|/);assert.equal(e.run('doc.activeLayer.name'),'Artwork');});
test('host rejects stale context without creating objects',()=>{const e=environment(),c=e.call('context',{}).value;e.run('doc.artboards[0].artboardRect[0]=99');const result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}]});assert.equal(result.ok,false);assert.equal(e.run('doc.pathItems.length'),0);});
test('host rejects switched document',()=>{const e=environment(),c=e.call('context',{}).value;e.run('app.activeDocument={name:"Other"}');assert.equal(e.call('clear',{token:c.token}).ok,false);});
test('failed creation removes partial new guides and empty layer',()=>{const e=environment(),c=e.call('context',{}).value;e.run('failAddAt=2');const result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306],[140,900,140,306]]}]});assert.equal(result.ok,false);assert.equal(e.run('doc.pathItems.length'),0);assert.equal(e.run('doc.layers.length'),1);});
test('owned clear leaves manual guides untouched',()=>{const e=environment();e.run(`var manual=doc.activeLayer.pathItems.add();manual.setEntirePath([[130,900],[130,306]]);manual.guides=true;var own=doc.activeLayer.pathItems.add();own.setEntirePath([[140,900],[140,306]]);own.guides=true;own.note='gridloom:1|artboard:0|old';`);const c=e.call('context',{}).value;assert.equal(e.call('clear',{token:c.token,clearMode:'owned'}).value.removed,1);assert.equal(e.run('doc.pathItems.length'),1);assert.equal(e.run('doc.pathItems[0]===manual'),true);});
test('locked guides fail preflight before new paths are created',()=>{const e=environment();e.run(`var own=doc.activeLayer.pathItems.add();own.setEntirePath([[140,900],[140,306]]);own.guides=true;own.note='gridloom:1|artboard:0|old';own.locked=true;`);const c=e.call('context',{}).value;const result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}],mode:'replace'});assert.equal(result.ok,false);assert.equal(e.run('doc.pathItems.length'),1);});
test('clipped group uses clipping path, not oversized content',()=>{const e=environment();e.run(`doc.selection=[{typename:'GroupItem',clipped:true,pageItems:[{typename:'PathItem',clipping:false,geometricBounds:[0,1000,900,0]},{typename:'PathItem',clipping:true,geometricBounds:[120,800,400,400]}]}]`);const c=e.call('context',{scope:'selection'}).value;assert.deepEqual(c.contexts[0].bounds,[120,800,400,400]);});
test('token is consumed after mutation',()=>{const e=environment(),c=e.call('context',{}).value;assert.equal(e.call('clear',{token:c.token,clearMode:'owned'}).ok,true);assert.equal(e.call('clear',{token:c.token,clearMode:'owned'}).ok,false);});
test('document ruler units are returned and changes invalidate token',()=>{const e=environment();e.run("doc.rulerUnits='RulerUnits.Millimeters'");const c=e.call('context',{}).value;assert.equal(c.unit,'mm');e.run("doc.rulerUnits='RulerUnits.Inches'");assert.equal(e.call('clear',{token:c.token,clearMode:'owned'}).ok,false);});
test('replace rollback restores deleted guides if a later deletion fails',()=>{
 const e=environment();e.run(`var first=doc.activeLayer.pathItems.add();first.setEntirePath([[140,900],[140,306]]);first.guides=true;first.note='gridloom:1|artboard:0|old';first.name='First';
 var second=doc.activeLayer.pathItems.add();second.setEntirePath([[150,900],[150,306]]);second.guides=true;second.note='gridloom:1|artboard:0|old';second.remove=function(){throw Error('injected removal failure');};`);
 const c=e.call('context',{}).value,result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}],mode:'replace'});
 assert.equal(result.ok,false);assert.equal(e.run('doc.pathItems.length'),2);assert.equal(e.run("doc.pathItems[1].name"),'First');
 assert.equal(e.run('doc.pathItems[1].pathPoints[0].anchor[0]'),140);assert.equal(e.run('doc.activeLayer.name'),'Artwork');
});
test('all-artboard apply validates every plan before changing the document',()=>{
 const e=environment();e.run("doc.artboards.push({name:'B',artboardRect:[600,900,1000,306]})");
 const c=e.call('context',{scope:'all'}).value;
 const result=e.call('apply',{token:c.token,mode:'append',plans:[{key:'artboard:0',lines:[[124,900,124,306]]},{key:'artboard:1',lines:[[650,900,660,306]]}]});
 assert.equal(result.ok,false);assert.equal(e.run('doc.pathItems.length'),0);
});

test('generated guides retain Illustrator default labels',()=>{
 const e=environment(),c=e.call('context',{}).value;
 const result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}],mode:'replace'});
 assert.equal(result.ok,true);assert.equal(e.run('doc.pathItems[0].name'),'');assert.equal(e.run('doc.pathItems[0].guides'),true);
});
test('silent native guide conversion failure rolls back before replacing old guides',()=>{
 const e=environment();e.run("var old=doc.activeLayer.pathItems.add();old.setEntirePath([[120,900],[120,306]]);old.guides=true;old.note='gridloom:1|artboard:0|old';failGuides=true;");
 const c=e.call('context',{}).value,result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}],mode:'replace'});
 assert.equal(result.ok,false);assert.match(result.error,/无法创建原生参考线/);assert.equal(e.run('doc.pathItems.length'),1);assert.equal(e.run('doc.pathItems[0]===old'),true);
});

test('legacy product layer is reused and adopts lowercase branding on generation',()=>{
 const e=environment();e.run("var legacy=doc.layers.add();legacy.name='Gridloom';");
 const c=e.call('context',{}).value,result=e.call('apply',{token:c.token,plans:[{key:'artboard:0',lines:[[124,900,124,306]]}],mode:'replace'});
 assert.equal(result.ok,true);assert.equal(e.run('doc.layers.length'),2);assert.equal(e.run('doc.pathItems[0].layer===legacy'),true);assert.equal(e.run('legacy.name'),'gridloom');assert.equal(e.run('doc.pathItems[0].name'),'');
});
test('layer toggles return real state and leave artwork and native global settings alone',()=>{
 const e=environment();e.run("var guides=doc.layers.add();guides.name='gridloom';app.executeMenuCommand=function(){throw Error('must not toggle global guides');}");
 assert.deepEqual(e.call('context',{}).value.guideState,{exists:true,locked:false,visible:true});
 assert.equal(e.call('lockGuides',{}).value.locked,true);
 assert.equal(e.call('visibility',{}).value.visible,false);
 assert.equal(e.run('doc.layers[0].locked'),false);assert.equal(e.run('doc.layers[0].visible'),true);
 e.run('guides.locked=false;guides.visible=true;');
 assert.deepEqual(e.call('context',{}).value.guideState,{exists:true,locked:false,visible:true});
 e.run('app.documents=[]');assert.equal(e.call('lockGuides',{}).ok,false);
});
test('missing layer is reported without creating or modifying anything',()=>{
 const e=environment();assert.equal(e.call('context',{}).value.guideState.exists,false);
 assert.equal(e.call('visibility',{}).ok,false);assert.equal(e.run('doc.layers.length'),1);
});
test('append does not inspect existing artwork',()=>{
 const e=environment();e.run("var inspected=0;for(var i=0;i<10000;i++)doc.pathItems.push(Object.defineProperty({},'guides',{get:function(){inspected++;return false;}}));");
 const c=e.call('context',{}).value,result=e.call('apply',{token:c.token,mode:'append',plans:[{key:'artboard:0',lines:[[124,900,124,306]]}]});
 assert.equal(result.ok,true);assert.equal(e.run('inspected'),0);assert.equal(result.value.guideState.exists,true);
});

test('each append creates a separate named artboard group; replacing retains other artboards',()=>{
 const e=environment();e.run("doc.artboards.push({name:'B',artboardRect:[600,900,1000,306]});");
 function apply(scope,mode){const c=e.call('context',{scope}).value;return e.call('apply',{token:c.token,mode,plans:c.contexts.map(a=>({key:a.key,lines:[[a.bounds[0]+10,a.bounds[1],a.bounds[0]+10,a.bounds[3]]]}))});}
 assert.equal(apply('all','append').ok,true);assert.equal(apply('artboard','append').ok,true);
 assert.equal(e.run('doc.layers[1].groupItems.length'),3);
 assert.equal(e.run('doc.layers[1].groupItems[0].name'),'A');
 assert.equal(e.run('doc.layers[1].groupItems[1].name'),'B');
 assert.equal(apply('artboard','replace').ok,true);
 assert.equal(e.run('doc.layers[1].groupItems.length'),2);
 assert.equal(e.run('doc.pathItems.length'),2);
 const c=e.call('context',{}).value;assert.equal(e.call('clear',{token:c.token,clearMode:'owned'}).ok,true);
 assert.equal(e.run('doc.layers[1].groupItems.length'),1);assert.equal(e.run('doc.layers[1].groupItems[0].name'),'B');
});
test('failed replacement restores guides to their original group',()=>{
 const e=environment();let c=e.call('context',{}).value;
 assert.equal(e.call('apply',{token:c.token,mode:'append',plans:[{key:'artboard:0',lines:[[120,900,120,306],[130,900,130,306]]}]}).ok,true);
 e.run("var originalGroup=doc.layers[1].groupItems[0];doc.pathItems[1].remove=function(){throw Error('cannot remove');}");
 c=e.call('context',{}).value;
 assert.equal(e.call('apply',{token:c.token,mode:'replace',plans:[{key:'artboard:0',lines:[[140,900,140,306]]}]}).ok,false);
 assert.equal(e.run('doc.layers[1].groupItems.length'),1);assert.equal(e.run('originalGroup.pageItems.length'),2);assert.equal(e.run('doc.pathItems[1].parent===originalGroup'),true);
});
