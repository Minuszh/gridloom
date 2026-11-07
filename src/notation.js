// SPDX-License-Identifier: GPL-3.0-only
(function (root, factory) {
  const api = factory(typeof module === 'object' ? require('./core.js') : root.Gridloom);
  if (typeof module === 'object') module.exports = api;
  else root.GridloomNotation = api;
})(typeof globalThis === 'object' ? globalThis : this, function (G) {
  'use strict';
  function fail(message, token) {
    const error = new Error(`${message}（${token.line}:${token.column}）`);
    Object.assign(error, {line:token.line,column:token.column}); throw error;
  }
  function readSize(source,at){try{return G.sizeToken(source);}catch(error){fail(error.message,at);}}
  function parse(source) {
    G.assert(typeof source === 'string' && source.length <= 50000, '语法文本过长');
    const tokens=[]; let line=1,column=1,pos=0;
    while(pos<source.length){
      const rest=source.slice(pos), at={line,column};
      let m;
      if ((m=rest.match(/^(?:#[^\n]*|\/\/[^\n]*)/)) || (m=rest.match(/^[ \t\r]+/))) {pos+=m[0].length;column+=m[0].length;continue;}
      if(rest[0]==='\n'){tokens.push({type:'nl',...at});pos++;line++;column=1;continue;}
      if((m=rest.match(/^\$([A-Za-z_0-9]*)(?:\[(\d+)\])?/))){tokens.push({type:'ref',value:m[1],capture:m[2]===undefined?null:Number(m[2]),...at});}
      else if((m=readSize(rest,at))){tokens.push({type:'number',value:m,...at});m=[m];}
      else if((m=rest.match(/^[hvnpfcl]+/))){tokens.push({type:'flags',value:m[0],...at});}
      else if('|~{}()*='.includes(rest[0])){m=[rest[0]];tokens.push({type:rest[0],...at});}
      else fail(`无法识别「${rest[0]}」`,at);
      pos+=m[0].length;column+=m[0].length;
    }
    tokens.push({type:'eof',line,column}); let i=0;
    const peek=()=>tokens[i], take=()=>tokens[i++];
    const vars=Object.create(null),grids=[];
    function reference(t){
      if(['WIDTH','HEIGHT'].includes(t.value)){if(t.capture!==null)fail('内置变量不支持捕获',t);return;}
      if(!Object.hasOwn(vars,t.value))fail('未定义变量 $'+t.value,t);
      if(t.capture!==null&&!vars[t.value].captures[t.capture])fail('捕获块不存在',t);
    }
    function sequence(block=false,depth=0){
      if(depth>24)fail('块嵌套过深',peek());
      const seq={items:[],flags:'hnl',size:null,at:peek()};
      while(!['eof','}'].includes(peek().type) && (block||peek().type!=='nl')){
        if(peek().type==='nl'){take();continue;}
        const t=take();let item;
        if(t.type==='('){
          let flags='';
          while(![')','eof','nl'].includes(peek().type)){
            const o=take();
            if(o.type==='flags')flags+=o.value;
            else if(['number','ref'].includes(o.type)&&seq.size===null){if(o.type==='ref')reference(o);seq.size=o;}
            else fail('无效网格选项',o);
          }
          if(take().type!==')')fail('缺少右括号',t);
          seq.flags+=flags;continue;
        }
        if(t.type==='|')item={kind:'guide',at:t};
        else if(t.type==='~')item={kind:'flex',at:t};
        else if(t.type==='number')item={kind:'unit',value:t.value,at:t};
        else if(t.type==='ref'){reference(t);item={kind:'ref',name:t.value,capture:t.capture,at:t};}
        else if(t.type==='{'){
          item={kind:'block',seq:sequence(true,depth+1),at:t};
          if(take().type!=='}')fail('缺少右花括号',t);
        } else fail('此处需要尺寸、变量或参考线',t);
        if(peek().type==='*'){
          take();let count=null;
          if(peek().type==='number'){
            const n=take();count=Number(n.value);
            if(!Number.isInteger(count)||count<1||count>1000)fail('重复次数应为 1–1000 的整数',n);
          }
          item={kind:'repeat',item,count,at:t};
        }
        seq.items.push(item);
      }
      return seq;
    }
    while(peek().type!=='eof'){
      if(peek().type==='nl'){take();continue;}
      if(peek().type==='ref'&&tokens[i+1].type==='='){
        const t=take();take();
        if(t.capture!==null)fail('捕获不能用于变量声明',t);
        if(['WIDTH','HEIGHT'].includes(t.value))fail('不能覆盖内置变量',t);
        if(Object.hasOwn(vars,t.value))fail('变量重复定义',t);
        const def=sequence(),captures=[def];
        function capture(items){for(const item of items){const node=item.kind==='repeat'?item.item:item;if(node.kind==='block'){node.captureKey=JSON.stringify([t.value,captures.length]);captures.push(node.seq);capture(node.seq.items);}}}
        capture(def.items);def.captures=captures;vars[t.value]=def;
      } else grids.push(sequence());
      if(peek().type==='}')fail('多余的右花括号',peek());
    }
    return {vars,grids};
  }
  function compile(source,context,config){return G.book(config,context,(c,page)=>compilePage(source,page,c));}
  function compilePage(source,context,config){
    const program=parse(source),[left,top,right,bottom]=context.bounds;
    const width=right-left,height=top-bottom;G.assert(width>0&&height>0,'范围尺寸必须大于零');let budget=0;
    const cache=new Map(),resolving=[];
    const bump=(at,n=1)=>{budget+=n;if(budget>20000)fail('展开内容过多',at)};
    function scalar(token,extent,stack){
      if(token.type==='number'){try{return G.length(token.value,config.unit,extent);}catch(error){fail(error.message,token);}}
      if(token.value==='WIDTH')return width;
      if(token.value==='HEIGHT')return height;
      const def=program.vars[token.value];
      if(token.capture!==null&&token.capture!==undefined){if(!def?.size)fail('尺寸变量必须定义固定大小',token);return frozen(token.value,token.capture,token).size;}
      if(!def||!def.size)fail('尺寸变量必须定义固定大小',token);
      if(stack.includes(token.value))fail('变量循环引用',token);
      return scalar(def.size,extent,[...stack,token.value]);
    }
    function expand(items,stack=[]){
      const result=[];
      for(const item of items){bump(item.at);
        if(item.kind==='ref'){
          if(['WIDTH','HEIGHT'].includes(item.name)){result.push({kind:'unit',value:`${item.name==='WIDTH'?width:height}pt`,at:item.at});continue;}
          const def=program.vars[item.name];if(!def)fail('未定义变量 $'+item.name,item.at);
          if(stack.includes(item.name)||stack.length>24)fail('变量循环引用或嵌套过深',item.at);
          if(def.size)result.push({kind:'frozen',data:frozen(item.name,item.capture||0,item.at),at:item.at});
          else {
            const selected=def.captures[item.capture||0],content=expand(selected.items,[...stack,item.name]);
            if(selected.size)result.push({kind:'block',seq:{...selected,items:content},at:item.at});
            else result.push(...content);
          }
        } else if(item.kind==='repeat'){
          const body=expand([item.item],stack);
          if(item.count===null)result.push({kind:'fill',items:body,at:item.at});
          else {bump(item.at,body.length*item.count);for(let n=0;n<item.count;n++)result.push(...body);}
        } else if(item.kind==='block')result.push({...item,seq:{...item.seq,items:expand(item.seq.items,stack)},expanded:true});
        else result.push(item);
      }
      return result;
    }
    const last=(flags,group,fallback)=>[...flags].filter(x=>group.includes(x)).pop()||fallback;
    function frozen(name,index,at){
      if(!cache.has(name)){
        if(resolving.length>=24)fail('变量循环引用或嵌套过深',at);resolving.push(name);
        const def=program.vars[name],extent=last(def.flags,'hv','h')==='v'?width:height;
        cache.set(name,evaluate({...def,items:expand(def.items,[name])},extent));resolving.pop();
      }
      const data=cache.get(name),result=index===0?data:data.captures[JSON.stringify([name,index])];
      if(!result)fail('捕获块不存在',at);return result;
    }
    function flexible(items){return items.some(item=>item.kind==='flex'||item.kind==='fill'||item.kind==='block'&&!item.seq.size&&flexible(item.seq.items));}
    function evaluate(seq,parentExtent,depth=0){
      if(depth>24)fail('网格嵌套过深',seq.at);
      const extent=seq.size?scalar(seq.size,parentExtent,[]):parentExtent;
      if(!(extent>0))fail('网格尺寸必须大于零',seq.at);
      let items=seq.items;
      function descriptor(item){
        if(item.kind==='unit'){try{return {size:G.length(item.value,config.unit,extent),guides:[],at:item.at};}catch(error){fail(error.message,item.at);}}
        if(item.kind==='frozen')return {...item.data,at:item.at};
        if(item.kind==='guide')return {size:0,guides:[0],at:item.at};
        if(item.kind==='flex')return {flex:true,size:0,guides:[],at:item.at};
        if(item.kind==='block'){
          const data=evaluate(item.seq,extent,depth+1);return {...data,captures:{...data.captures,...(item.captureKey?{[item.captureKey]:{size:data.size,guides:data.guides}}:{})},at:item.at};
        }
        fail('嵌套填充不能用于重复填充',item.at);
      }
      const fills=items.filter(x=>x.kind==='fill');if(fills.length>1)fail('一个网格只能包含一个自动填充',fills[1].at);
      if(fills.length){
        const fill=fills[0],base=items.filter(x=>x!==fill).map(descriptor),body=fill.items.map(descriptor);
        if(flexible(fill.items))fail('弹性空间不能自动重复填充',fill.at);
        const size=body.reduce((a,b)=>a+b.size,0);if(size<=0)fail('填充内容必须有正尺寸',fill.at);
        const used=base.reduce((a,b)=>a+b.size,0);
        const count=base.some(x=>x.flex)?1:Math.max(1,Math.floor((extent-used+1e-8)/size));
        bump(fill.at,count*fill.items.length);
        items=items.flatMap(x=>x===fill?Array.from({length:count},()=>fill.items).flat():[x]);
      }
      const parts=items.map(descriptor),fixed=parts.reduce((a,b)=>a+b.size,0),flex=parts.filter(x=>x.flex);
      if(flex.length&&fixed>extent+1e-6)fail('固定尺寸超过可用空间',seq.at);
      flex.forEach(x=>x.size=(extent-fixed)/flex.length);
      if(last(seq.flags,'np','n')==='p'){
        const total=Math.round(parts.reduce((a,b)=>a+b.size,0)),original=parts.map(p=>p.size);
        parts.forEach(x=>x.size=Math.floor(x.size));
        let remainder=total-parts.reduce((a,b)=>a+b.size,0);
        const order=parts.map((p,i)=>({p,i})).filter(x=>items[x.i].kind!=='guide');
        const where=last(seq.flags,'fcl','l');
        if(where==='l')order.reverse();
        if(where==='c')order.sort((a,b)=>Math.abs(a.i-(parts.length-1)/2)-Math.abs(b.i-(parts.length-1)/2));
        for(let j=0;remainder>0&&order.length;j++,remainder--)order[j%order.length].p.size++;
        // Snap nested coordinates with their allocated parent, keeping shared endpoints identical.
        function snap(data,ratio){return {...data,size:Math.round(data.size*ratio),guides:data.guides.map(g=>Math.round(g*ratio)),captures:Object.fromEntries(Object.entries(data.captures||{}).map(([k,v])=>[k,snap(v,ratio)]))};}
        parts.forEach((p,i)=>{const adjusted=snap(p,original[i]===0?1:p.size/original[i]);p.guides=adjusted.guides;p.captures=adjusted.captures;});
      }
      let cursor=0;const guides=[],captures={};
      parts.forEach(p=>{p.guides.forEach(g=>guides.push(cursor+g));Object.assign(captures,p.captures);cursor+=p.size;});
      if(guides.length>G.LIMIT)fail('参考线过多，请减少行列或重复次数',seq.at);
      return {size:seq.size?extent:cursor,guides,captures};
    }
    const span=config.guideLength==='artboard'?context.artboard:context.bounds;
    const lines=[];
    for(const seq of program.grids){
      const vertical=last(seq.flags,'hv','h')==='v';
      const data=evaluate({...seq,items:expand(seq.items)},vertical?width:height);
      for(const v of data.guides)lines.push(vertical?[left+v,span[1],left+v,span[3]]:[span[0],top-v,span[2],top-v]);
    }
    return {lines:G.unique(lines,config.precision)};
  }
  return {parse,compile};
});
