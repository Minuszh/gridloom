// SPDX-License-Identifier: GPL-3.0-only
const {test}=require('node:test'),assert=require('node:assert/strict'),G=require('../src/core.js'),N=require('../src/notation.js'),P=require('../src/presets.js');
const context={bounds:[100,900,520,306],artboard:[0,1000,600,0]};
const cfg=()=>({...G.defaults(),unit:'pt',margins:{top:'24',right:'24',bottom:'24',left:'24'},gutterX:'6'});
test('physical units, pixels and percent',()=>{assert.equal(G.length('1in'),72);assert.equal(G.length('25.4mm'),72);assert.equal(G.length('50%', 'pt',200),100);assert.equal(G.length('16px'),16);for(const v of ['NaN','Infinity','1e4','calc()',''])assert.throws(()=>G.length(v));});
test('12 columns on non-zero-origin artboard',()=>{const p=G.plan(cfg(),context);assert.equal(p.columns.size,25.5);assert.equal(p.lines.length,26);assert.deepEqual(p.lines[0],[124,1000,124,0]);assert.deepEqual(p.lines.at(-3),[496,1000,496,0]);});
test('zero gutters deduplicate coincident lines',()=>{const c=cfg();c.cols='3';c.gutterX='0';assert.equal(G.plan(c,context).lines.length,6);});
test('negative margins and selection-length guides',()=>{const c=cfg();c.margins.left='-10';c.guideLength='selection';assert.deepEqual(G.plan(c,context).lines[0],[90,900,90,306]);});
test('auto fill with fixed size, centered remainder',()=>{const c=cfg();c.cols='';c.colWidth='100';c.alignX='center';const p=G.plan(c,context);assert.equal(p.columns.count,3);assert.deepEqual(p.lines[0],[154,1000,154,0]);});
test('overconstrained and invalid layouts rejected',()=>{for(const patch of [{cols:'2.5'},{gutterX:'100'},{colWidth:'1000'},{rows:'-1'},{cols:'1001'}])assert.throws(()=>G.plan({...cfg(),...patch},context));});
test('margins percentage uses its own axis',()=>{const c=cfg();c.margins.left='10%';c.margins.top='10%';c.rows='1';const p=G.plan(c,context);assert.equal(p.lines[0][0],142);assert.equal(p.lines.at(-2)[1],840.6);});
test('rounded coordinates remain deduplicated',()=>assert.equal(G.unique([[.01,0,.01,10],[.02,0,.02,10]],0).length,1));
test('baseline fill and comments',()=>{const p=N.compile('# baseline\n$row = | 16px |\n$row* (h)',context,cfg());assert.equal(p.lines.length,38);assert.deepEqual(p.lines[1],[0,884,600,884]);});
test('variables, wildcards and repeats',()=>{const p=N.compile('$c = | ~ |\n$c*3 (v)',context,cfg());assert.deepEqual(p.lines.map(l=>l[0]),[100,240,380,520]);});
test('fixed-size block centers inner grid',()=>{const p=N.compile('~ | { ~ | ~ | ~ (100px) } | ~ (v)',context,cfg());assert.deepEqual(p.lines.map(l=>l[0]),[260,293.333,326.667,360]);});
test('nested multiline blocks',()=>{const p=N.compile('| {\n 10px | { 20px | }\n} (v)',context,cfg());assert.deepEqual(p.lines.map(l=>l[0]),[100,110,130]);});
test('percentages and built-in sizes',()=>{const p=N.compile('| 10% | ~ | (v $WIDTH)',context,cfg());assert.deepEqual(p.lines.map(l=>l[0]),[100,142,520]);});
test('pixel remainder distribution first and last',()=>{assert.deepEqual(N.compile('| ~ | ~ | ~ | (vpf 10px)',context,cfg()).lines.map(l=>l[0]),[100,104,107,110]);assert.deepEqual(N.compile('| ~ | ~ | ~ | (vpl 10px)',context,cfg()).lines.map(l=>l[0]),[100,103,106,110]);});
test('syntax errors carry line and column',()=>{assert.throws(()=>N.compile('# hi\n| wat',context,cfg()),e=>e.line===2&&e.column===3);});
test('cycles, invalid fill, unknown variables, runaway expansion rejected',()=>{for(const s of ['$a=$b\n$b=$a\n$a','~*','0px*','| $missing','10px* 20px*','{| 1px}*1000*1000'])assert.throws(()=>N.compile(s,context,cfg()));});
test('sized variables preserve isolated wildcard context',()=>{const p=N.compile('$c = | ~ | (100pt)\n$c*2 (v)',context,cfg());assert.deepEqual(p.lines.map(l=>l[0]),[100,200,300]);});
test('presets roundtrip and reject malformed import',()=>{const p=P.builtIn('columns');assert.deepEqual(P.decode(P.encode([p])),[p]);for(const s of ['{}','{"version":2,"presets":[]}','{"version":1,"presets":[{}]}'])assert.throws(()=>P.decode(s));});
test('all builtin presets compile on A2',()=>{const c={bounds:[0,594*G.UNITS.mm,420*G.UNITS.mm,0],artboard:[0,594*G.UNITS.mm,420*G.UNITS.mm,0]};for(const name of ['columns','modular','thirds','golden','fibonacci','baseline','ratio','reading','editorial2','editorial3','modules8','modules20','modules32']){const p=P.builtIn(name);assert.ok((p.mode==='grid'?G.plan(p.config,c):N.compile(p.notation,c,p.config)).lines.length>0);}});
test('zero rows retain top and bottom margins and ignore inactive row dimensions',()=>{
 const c={...cfg(),rowHeight:'invalid',gutterY:'invalid'};
 const p=G.plan(c,context);assert.equal(p.rows.count,0);
 assert.deepEqual(p.rows.positions,[24,570]);
 assert.deepEqual(p.lines.slice(-2),[[0,876,600,876],[0,330,600,330]]);
});
test('zero columns retain margins, including zero and negative offsets',()=>{
 assert.deepEqual(G.axis(100,'0','-5','0','invalid','invalid','start','pt').positions,[0,105]);
 assert.deepEqual(G.axis(100,'10','','0','','','start','pt').positions,[10]);
 assert.deepEqual(G.axis(100,'','20','0','','','start','pt').positions,[80]);
 assert.deepEqual(G.axis(100,'','','0','','','start','pt').positions,[]);
});
test('zero rows still validate margin constraints and support margin notation',()=>{
 assert.throws(()=>G.axis(100,'60','60','0','','','start','pt'));
 assert.deepEqual(G.axis(100,'10 | 5','20 | 5','0','','','start','pt').positions,[10,15,75,80]);
});

test('book mode draws two equal page grids with page-relative margins and local spans',()=>{
 const c={...cfg(),book:'horizontal',cols:'2',rows:'0',gutterX:'0',margins:{top:'10%',right:'10%',bottom:'10%',left:'10%'}};
 const p=G.plan(c,context);
 assert.equal(p.columns.size,84);
 assert.equal(p.lines.filter(l=>l.join(',')==='310,900,310,306').length,1);
 for(const line of p.lines){assert(line[0]>=100&&line[2]<=520);assert(line[1]<=900&&line[3]>=306);}
 assert(p.lines.some(l=>l.join(',')==='121,900,121,306'));
 assert(p.lines.some(l=>l.join(',')==='331,900,331,306'));
 assert(p.lines.some(l=>l.join(',')==='100,840.6,310,840.6'));
 assert(p.lines.some(l=>l.join(',')==='310,840.6,520,840.6'));
});
test('vertical book mode translates a page downward and notation follows both pages',()=>{
 const c={...cfg(),book:'vertical'};
 assert.deepEqual(N.compile('| 50% | (h)',context,c).lines,[[100,900,520,900],[100,751.5,520,751.5],[100,603,520,603],[100,454.5,520,454.5]]);
 const single=G.plan({...c,book:'none',guideLength:'selection'}, {...context,bounds:[100,900,520,603],artboard:[100,900,520,603]});
 assert.deepEqual(G.plan(c,context).lines,G.unique(single.lines.concat(single.lines.map(([x,y,z,w])=>[x,y-297,z,w-297]),[[100,603,520,603]]),3));
});
test('book mode is saved, old presets default off, and invalid modes are rejected',()=>{
 const p=P.builtIn('columns');p.config.book='horizontal';assert.equal(P.decode(P.encode([p]))[0].config.book,'horizontal');
 delete p.config.book;assert.equal(P.validate(p).config.book,'none');
 p.config.book='bad';assert.throws(()=>P.validate(p));assert.throws(()=>G.plan(p.config,context));
});
test('book mode calculates a page once and enforces combined line limits',()=>{
 let calls=0;const c={...cfg(),book:'horizontal'};
 G.book(c,context,()=>{calls++;return {lines:[[100,900,100,306]]};});assert.equal(calls,1);
 assert.throws(()=>G.book(c,context,()=>({lines:Array.from({length:2501},(_,i)=>[i,900,i,306])})));
});

test('grid notation conversion retains guides in normal and book layouts',()=>{
 const sorted=lines=>lines.map(l=>l.join(',')).sort();
 for(const book of ['none','horizontal','vertical']){
  const c={...cfg(),book,cols:'3',rows:'2',alignX:'center',alignY:'end'};
  assert.deepEqual(sorted(N.compile(N.fromGrid(c,context),context,c).lines),sorted(G.plan(c,context).lines));
 }
});
test('notation presets populate grid fields without changing geometry',()=>{
 const sorted=lines=>lines.map(l=>l.join(',')).sort();
 for(const name of ['golden','fibonacci','baseline','ratio']){
  const p=P.builtIn(name,context),c=N.toGrid(p.notation,context,p.config);
  assert.deepEqual(sorted(G.plan(c,context).lines),sorted(N.compile(p.notation,context,p.config).lines),name);
 }
});

test('short grid syntax keeps percentages and supports Chinese and English',()=>{
 const c={...cfg(),cols:'3',rows:'2',margins:{top:'10%',right:'12pt',bottom:'10%',left:'12pt'}};
 const source=N.fromGrid(c,context,'zh');assert.equal(source.split('\n').length,3);assert.match(source,/边距: 10%, 12pt/);assert.match(source,/列: 3, auto, 6pt/);
 assert.deepEqual(N.compile(source,context,c).lines,G.plan(c,context).lines);
 assert.deepEqual(N.compile('margin: 12pt\ncolumns: 3, auto, 4pt\nrows: 0',context,c).lines,G.plan({...c,margins:{top:'12pt',right:'12pt',bottom:'12pt',left:'12pt'},cols:'3',colWidth:'',gutterX:'4pt',rows:'0'},context).lines);
 assert.throws(()=>N.compile('列: 3\n列: 4',context,c),/重复设置/);
 assert.throws(()=>N.compile('边距: 1,2,3',context,c),/边距需要/);
});

test('short syntax preserves blank margins without adding boundary guides',()=>{
 const c={...cfg(),cols:'0',rows:'0',border:false,margins:{top:'',right:'12pt',bottom:'',left:''}};
 assert.deepEqual(N.compile(N.fromGrid(c,context),context,c).lines,G.plan(c,context).lines);
});
