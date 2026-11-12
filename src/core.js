// SPDX-License-Identifier: GPL-3.0-only
/* Pure geometry, in points. Shared by the panel and future host adapters. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object') module.exports = api;
  else root.Gridloom = api;
})(typeof globalThis === 'object' ? globalThis : this, function () {
  'use strict';
  const UNITS = Object.freeze({pt: 1, px: 1, mm: 72 / 25.4, cm: 72 / 2.54, in: 72, pc:12, m:72000/25.4, ft:864, yd:2592, ag:72/14});
  const LIMIT = 5000;
  function assert(condition, message) { if (!condition) throw new Error(message); }
  const aliases = {pixel:'px',pixels:'px',inch:'in',inches:'in',feet:'ft',yds:'yd',yard:'yd',yards:'yd',centimeter:'cm',centimeters:'cm',centimetre:'cm',centimetres:'cm',millimeter:'mm',millimeters:'mm',millimetre:'mm',millimetres:'mm',point:'pt',points:'pt',pts:'pt',pica:'pc',picas:'pc',agates:'ag',percent:'%',pct:'%'};
  const number = '(?:\\d+(?:\\.\\d*)?|\\.\\d+)';
  const suffixes = [...Object.keys(aliases),...Object.keys(UNITS),'%'].sort((a,b)=>b.length-a.length).join('|');
  const measure = new RegExp('^[+-]?(?:'+number+'p'+number+'|'+number+'(?:[ \t]*(?:'+suffixes+'))?)','i');
  // Shared by notation and form fields; calc is parsed as arithmetic, never JavaScript.
  function sizeToken(source) {
    if (/^calc\(/i.test(source)) {
      let depth=1,i=5;
      for(;i<source.length&&depth;i++){if(source[i]==='(')depth++;if(source[i]===')')depth--;assert(depth<=32,'运算嵌套过深');}
      assert(depth===0&&i<=1024,'无效运算表达式');return source.slice(0,i);
    }
    return source.match(measure)?.[0]||null;
  }
  function atom(text,unit,extent) {
    const pica=text.match(/^([+-]?)(\d+(?:\.\d*)?|\.\d+)p(\d+(?:\.\d*)?|\.\d+)$/i);
    if(pica)return {v:(pica[1]==='-'?-1:1)*(Number(pica[2])*12+Number(pica[3])),dimension:true};
    const m=text.match(/^([+-]?(?:\d+(?:\.\d*)?|\.\d+))\s*([a-z%]+)?$/i);
    assert(m,`无效尺寸：${text}`);let suffix=(m[2]||'').toLowerCase();suffix=aliases[suffix]||suffix;
    assert(!suffix||suffix==='%'||Object.hasOwn(UNITS,suffix),'未知单位');
    return {v:Number(m[1])*(suffix==='%'?extent/100:suffix?UNITS[suffix]:1),dimension:!!suffix};
  }
  function length(value, unit = 'mm', extent = 0, explicit = false) {
    assert(Object.hasOwn(UNITS, unit), '未知单位');
    const text=String(value).trim();let result,qualified;
    if(/^calc\(/i.test(text)){
      assert(sizeToken(text)===text,'无效运算表达式');
      const source=text.slice(5,-1);let i=0,steps=0;
      const skip=()=>{while(/\s/.test(source[i]||'!'))i++;};
      function primary(depth){
        assert(depth<=32&&++steps<=256,'运算嵌套过深');skip();let sign=1;
        if(source[i]==='+'||source[i]==='-'){if(source[i++]==='-')sign=-1;}
        skip();let item;
        if(source[i]==='('){i++;item=sum(depth+1);skip();assert(source[i++ ]===')','无效运算表达式');}
        else {const token=source.slice(i).match(measure)?.[0];assert(token,'无效运算表达式');i+=token.length;item={...atom(token,unit,extent),text:token};}
        return {...item,v:item.v*sign,text:sign===-1?'(-('+item.text+'))':item.text};
      }
      function product(depth){let a=primary(depth);skip();while(source[i]==='*'||source[i]==='/'){
        const op=source[i++],b=primary(depth);assert(!(op==='*'&&a.dimension&&b.dimension)&&!(op==='/'&&b.dimension),'运算单位不匹配');
        assert(op!=='/'||b.v!==0,'不能除以零');a={v:op==='*'?a.v*b.v:a.v/b.v,dimension:a.dimension||b.dimension,text:'('+a.text+op+b.text+')'};skip();
      }return a;}
      function sum(depth){let a=product(depth);skip();while(source[i]==='+'||source[i]==='-'){
        const op=source[i++],b=product(depth),dimension=a.dimension||b.dimension;
        const av=a.v*(dimension&&!a.dimension?UNITS[unit]:1),bv=b.v*(dimension&&!b.dimension?UNITS[unit]:1);
        const at=dimension&&!a.dimension?'('+a.text+'*1'+unit+')':a.text,bt=dimension&&!b.dimension?'('+b.text+'*1'+unit+')':b.text;
        a={v:op==='+'?av+bv:av-bv,dimension,text:'('+at+op+bt+')'};skip();
      }return a;}
      const a=sum(0);skip();assert(i===source.length,'无效运算表达式');result=a.v*(a.dimension?1:UNITS[unit]);qualified='calc('+a.text+(a.dimension?'':'*1'+unit)+')';
    }else {const a=atom(text,unit,extent);result=a.v*(a.dimension?1:UNITS[unit]);qualified=text+(a.dimension?'':unit);}
    assert(Number.isFinite(result) && Math.abs(result) <= 1e7, '尺寸超出可计算范围');
    return explicit?qualified:result;
  }
  function qualify(value,unit){
    let source=String(value).trim();const tokens=[];
    while(source){
      if(source[0]==='|'||source[0]==='~'){tokens.push(source[0]);source=source.slice(1);}
      else {const token=sizeToken(source);assert(token,`无效尺寸：${source}`);tokens.push(length(token,unit,100,true));source=source.slice(token.length);}
      source=source.trimStart();
    }
    return tokens.join(' ');
  }
  function field(value,unit,extent) {
    let source=String(value||'').trim();assert(source.length<=512,'尺寸字段过长');const items=[];
    while(source){
      const char=source[0];
      if(char==='|'||char==='~'){items.push(char==='|'?{size:0,guide:true}:{size:0,flex:true});source=source.slice(1);}
      else {const token=sizeToken(source);assert(token,`无效尺寸：${source}`);items.push({size:length(token,unit,extent)});source=source.slice(token.length);}
      source=source.trimStart();
    }
    return items;
  }
  function axis(extent, start, end, quantity, size, gutter, align, unit) {
    let count = quantity === '' ? null : Number(quantity);
    assert(count === null || Number.isInteger(count) && count >= 0 && count <= 1000, '行列数量必须为 0–1000 的整数');
    const before=field(start,unit,extent),after=field(end,unit,extent),gap=count===0?[]:field(gutter,unit,extent);
    let cell=count===0?[]:field(size,unit,extent);
    const total=parts=>parts.reduce((n,p)=>n+p.size,0),flex=parts=>parts.filter(p=>p.flex).length;
    assert(total(gap)>=0,'边距或间距超出可用空间');
    if(count===null&&cell.length){
      count=flex(cell)||flex(gap)||flex(before)||flex(after)?1:Math.floor((extent-total(before)-total(after)+total(gap)+1e-8)/(total(cell)+total(gap)));
      assert(count>0&&count<=1000,'固定尺寸无法放入，或网格数量过多');
    }
    count=count||0;
    if(count&&!cell.length)cell=[{size:0,flex:true}];
    if(count)assert(total(cell)>0||flex(cell),'固定尺寸必须大于零');
    const parts=[],sections=[];
    function append(pattern){const copy=pattern.map(p=>({...p}));parts.push(...copy);return copy;}
    append(before);
    if(count){
      for(let n=0;n<count;n++){
        if(n)append(gap);
        parts.push({size:0,guide:true});sections.push(append(cell));parts.push({size:0,guide:true});
      }
    } else if(before.length||after.length){
      if(before.length)parts.push({size:0,guide:true});
      parts.push({size:0,flex:true});
      if(after.length)parts.push({size:0,guide:true});
    }
    append([...after].reverse());
    const fixed=total(parts),flexes=flex(parts);
    assert(fixed<=extent+1e-6,'固定尺寸超出可用范围');
    if(flexes)parts.forEach(p=>{if(p.flex)p.size=(extent-fixed)/flexes;});
    sections.forEach(p=>assert(total(p)>0,'间距过大，单元格尺寸必须大于零'));
    const used=total(parts),offset=(extent-used)*({start:0,center:.5,end:1}[align]||0),positions=[];
    let cursor=offset;
    for(const p of parts){if(p.guide)positions.push(cursor);cursor+=p.size;}
    assert(positions.length<=LIMIT,'参考线过多，请减少行列或重复次数');
    return {positions,size:sections.length?total(sections[0]):0,count,outer:parts.length?[offset,offset+used]:[0,extent]};
  }
  function unique(lines, precision = 3) {
    assert(Number.isInteger(Number(precision)) && precision >= 0 && precision <= 6, '精度应为 0–6 位');
    assert(lines.length <= LIMIT, '参考线过多，请减少行列或重复次数');
    const seen = new Set();
    return lines.map(line => line.map(v => {
      assert(Number.isFinite(v), '无效参考线坐标');
      return Number(v.toFixed(Number(precision)));
    })).filter(line => { const key = line.join(','); if (seen.has(key)) return false; seen.add(key); return true; });
  }
  function book(config, context, draw) {
    const mode=config.book||'none';
    assert(['none','horizontal','vertical'].includes(mode),'无效书籍模式');
    const finish=result=>({...result,lines:unique(result.lines.concat(config.centerH?quick('middle',context,config.guideLength):[],config.centerV?quick('center',context,config.guideLength):[]),config.precision)});
    if(mode==='none')return finish(draw(config,context));
    const [l,t,r,b]=context.bounds;
    const bounds=mode==='horizontal'?[[l,t,(l+r)/2,b],[(l+r)/2,t,r,b]]:[[l,t,r,(t+b)/2],[l,(t+b)/2,r,b]];
    const pageConfig={...config,book:'none',guideLength:'selection'};
    const m=config.margins,paired=typeof m.inner==='string'&&typeof m.outer==='string';
    const pages=bounds.map((rect,i)=>{
      if(i&&!paired)return null;
      const margins=!paired?m:mode==='horizontal'?{...m,left:i?m.inner:m.outer,right:i?m.outer:m.inner}:{...m,top:i?m.inner:m.outer,bottom:i?m.outer:m.inner};
      return draw({...pageConfig,margins},{...context,bounds:rect,artboard:rect});
    });
    const first=pages[0],dx=bounds[1][0]-l,dy=bounds[1][1]-t;
    const second=pages[1]?pages[1].lines:first.lines.map(([x1,y1,x2,y2])=>[x1+dx,y1+dy,x2+dx,y2+dy]);
    const center=mode==='horizontal'?[(l+r)/2,t,(l+r)/2,b]:[l,(t+b)/2,r,(t+b)/2];
    return finish({...first,lines:unique(first.lines.concat(second,[center]),config.precision)});
  }
  function plan(config,context){return book(config,context,planPage);}
  function planPage(config, context) {
    const [left, top, right, bottom] = context.bounds;
    const width = right - left, height = top - bottom;
    assert(width > 0 && height > 0, '范围尺寸必须大于零');
    const m = config.margins;
    const x = axis(width, m.left, m.right, config.cols, config.colWidth, config.gutterX, config.alignX, config.unit);
    const y = axis(height, m.top, m.bottom, config.rows, config.rowHeight, config.gutterY, config.alignY, config.unit);
    const span = config.guideLength === 'artboard' ? context.artboard : context.bounds;
    let lines = x.positions.map(v => [left + v, span[1], left + v, span[3]])
      .concat(y.positions.map(v => [span[0], top - v, span[2], top - v]));
    const empty=[m.top,m.right,m.bottom,m.left,config.cols,config.rows,config.colWidth,config.rowHeight,config.gutterX,config.gutterY].every(v=>String(v).trim()==='');
    if (config.border || empty) lines.push(...(empty?[0,width]:x.outer).map(v=>[left+v,span[1],left+v,span[3]]),...(empty?[0,height]:y.outer).map(v=>[span[0],top-v,span[2],top-v]));
    return {lines: unique(lines, config.precision), columns: x, rows: y};
  }
  function quick(which, context, guideLength) {
    const [l,t,r,b] = context.bounds, span = guideLength === 'artboard' ? context.artboard : context.bounds;
    const map = {left:[l,span[1],l,span[3]],center:[(l+r)/2,span[1],(l+r)/2,span[3]],right:[r,span[1],r,span[3]],top:[span[0],t,span[2],t],middle:[span[0],(t+b)/2,span[2],(t+b)/2],bottom:[span[0],b,span[2],b]};
    assert(map[which], '未知快捷操作');
    return [map[which]];
  }
  const defaults = () => ({unit:'mm',margins:{top:'12',right:'12',bottom:'12',left:'12'},cols:'12',rows:'0',colWidth:'',rowHeight:'',gutterX:'4',gutterY:'4',alignX:'start',alignY:'start',guideLength:'artboard',precision:3,border:false,book:'none',centerH:false,centerV:false});
  return {UNITS,LIMIT,assert,length,qualify,sizeToken,field,axis,unique,book,plan,quick,defaults};
});
