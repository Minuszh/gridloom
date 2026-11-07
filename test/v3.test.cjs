// SPDX-License-Identifier: GPL-3.0-only
const {test}=require('node:test'),assert=require('node:assert/strict');
const G=require('../src/core.js'),N=require('../src/notation.js');
const context={bounds:[0,200,100,0],artboard:[0,200,100,0]},config={...G.defaults(),unit:'pt'};
const xs=source=>N.compile(source,context,config).lines.map(l=>l[0]);
test('unit aliases, mixed picas and safe arithmetic',()=>{
 for(const input of ['1in','1 inch','72points','6picas','6p0','14agates'])assert.equal(G.length(input),72);
 assert.equal(G.length('-1p5'),-17);assert.equal(G.length('50pct','pt',200),100);
 assert.equal(G.length('calc((1in - 12pt) / 2)'),30);
 assert.equal(G.length('calc(2 * 3mm)'),6*G.UNITS.mm);
 assert.equal(G.length('calc(10% + 2)','mm',200),20+2*G.UNITS.mm);
 for(const input of ['calc(2 / 0)','calc(2pt * 2pt)','calc(2 / 3mm)','calc(alert(1))','calc('+ '('.repeat(40)+'1'+')'.repeat(40)+')'])assert.throws(()=>G.length(input));
 assert.deepEqual(xs('| 1p5 | calc(10pt / 2) | (v)'),[0,17,22]);
});
test('form fields distribute flex, generate padding and split gutters',()=>{
 const a=G.axis(100,'','','2','10pt | ~ | 10pt','5pt | 5pt','start','pt');
 assert.deepEqual(a.positions,[0,10,35,45,50,55,65,90,100]);assert.equal(a.size,45);
 const b=G.axis(100,'10 | 5','20 | 5','1','','0','start','pt');
 assert.deepEqual(b.positions,[10,15,75,80]);
 const c=G.axis(100,'~','','2','20','~','start','pt');assert.deepEqual(c.positions,[30,50,80,100]);
});
test('fixed grids align as a group including margins and border',()=>{
 const a=G.axis(100,'10','20','2','10','10','center','pt');
 assert.deepEqual(a.positions,[30,40,50,60]);assert.deepEqual(a.outer,[20,80]);
 const c={...config,cols:'',rows:'',colWidth:'',rowHeight:'',gutterX:'',gutterY:'',margins:{top:'',bottom:'',left:'',right:''}};
 assert.equal(G.plan(c,context).lines.length,4);
 c.margins={top:'10',bottom:'10',left:'10',right:'10'};
 assert.deepEqual(G.plan(c,context).lines,[[10,200,10,0],[90,200,90,0],[0,190,100,190],[0,10,100,10]]);
});
test('numeric variables flatten sized and unsized references independently',()=>{
 assert.deepEqual(xs('$1 = ~\n$2 = $1 (75px)\n$3 = $1 | $2\n| $3 | (v)'),[0,25,100]);
 assert.throws(()=>N.parse('$later (v)\n$later=10pt'),/未定义变量/);
 assert.throws(()=>N.parse('$self=$self'),/未定义变量/);
});
test('captures freeze percentages across axes using explicit context width',()=>{
 const source='$ = | { 20% } | ~ | 20% | (vnl $WIDTH)\n$ (v)\n| $[1] | ~ | $[1] | (h)';
 const lines=N.compile(source,context,config).lines;
 assert.deepEqual(lines.slice(0,4).map(l=>l[0]),[0,20,80,100]);
 assert.deepEqual(lines.slice(4).map(l=>l[1]),[200,180,20,0]);
 assert.deepEqual(xs('$a=|{10pt}|\n$a[0] (v)\n|$a[1]| (v)'),[0,10]);
});
test('nested captures use preorder indices and reject missing blocks',()=>{
 assert.deepEqual(xs('$a={10pt {5pt}} {20pt} (100pt)\n|$a[1]|$a[2]|$a[3]| (v)'),[0,15,20,40]);
 for(const s of ['$a={10}\n$a[2]','$a[1]=10','$WIDTH[0]','$a={10}\n$a[-1]'])assert.throws(()=>N.parse(s));
});
test('sized percentages freeze in declaration orientation',()=>{
 assert.deepEqual(xs('$a=|50%| (v 50%)\n$a (v)'),[0,25]);
 assert.deepEqual(xs('$a=|50%| (h 50%)\n$a (v)'),[0,50]);
});
test('nested pixel rounding retains shared endpoints',()=>{
 const lines=xs('| { | ~ | ~ | (3.6pt) } | ~ | (vpf 10pt)');
 assert.deepEqual(lines,[0,2,4,10]);
 assert.equal(new Set(lines).size,lines.length);assert.ok(lines.every(Number.isInteger));
});
test('fills reject unbounded flex through nested blocks and keep fixed blocks usable',()=>{
 assert.throws(()=>N.compile('{~}* (v)',context,config),/弹性空间/);
 assert.equal(xs('{|~| (20pt)}* (v)').length,6);
 assert.throws(()=>N.compile('$a={|1pt}*1000\n$a*1000 (v)',context,config),/过多/);
});
test('complex presets retain physical units when the document unit changes',()=>{
 for(const value of ['10 | ~ | 5','calc(2 * 3)','calc(10% + 2)','calc(2 * (3mm + 1))','1p5 | calc((2 + 3) / 2)']){
  const explicit=G.qualify(value,'mm');
  for(const extent of [100,500])assert.deepEqual(G.field(explicit,'in',extent),G.field(value,'mm',extent));
  let next=explicit;for(let i=0;i<10;i++)next=G.qualify(next,'in');assert.ok(next.length<512);
 }
});
test('arithmetic errors retain notation source location',()=>{
 for(const s of ['# comment\n| calc(1 / 0) |','\n| ~ | (calc(2 / 0))','\ncalc(2'])assert.throws(()=>N.compile(s,context,config),e=>e.line===2&&e.column>=1);
});
test('deep fixed variable chains are bounded before JavaScript stack exhaustion',()=>{
 let source='$0=~(1pt)\n';for(let n=1;n<100;n++)source+=`$${n}=$${n-1}(1pt)\n`;
 assert.throws(()=>N.compile(source+'$99 (v)',context,config),/嵌套过深/);
});
test('center pixel remainder, negative movement and fill with exterior flex',()=>{
 assert.deepEqual(xs('|~|~|~|(vpc 10pt)'),[0,3,7,10]);
 assert.deepEqual(xs('| -10pt | 20pt | (v)'),[0,-10,10]);
 assert.deepEqual(xs('~ | 20pt* | ~ (v)'),[40,60]);
});
test('field guide count and size limits reject excessive input',()=>{
 assert.throws(()=>G.axis(100,'','','1000','|~|~|~|~|~|~|','0','start','pt'),/参考线过多/);
 assert.throws(()=>G.field('1 '.repeat(300),'pt',100),/字段过长/);
});
test('deep captured blocks round without recursively duplicating capture trees',()=>{
 const source='$a='+ '{'.repeat(20)+'10pt'+'}'.repeat(20)+'(vpf 10pt)\n|$a[20]|(v)';
 assert.deepEqual(xs(source),[0,10]);
});
