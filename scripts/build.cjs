// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs'),path=require('node:path'),zlib=require('node:zlib');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
// Rasterize the supplied rectangle-only SVG without a graphics dependency.
function crc(buffer){let n=0xffffffff;for(const byte of buffer){n^=byte;for(let i=0;i<8;i++)n=(n>>>1)^((n&1)?0xedb88320:0);}return (n^0xffffffff)>>>0;}
function chunk(type,data){const name=Buffer.from(type),length=Buffer.alloc(4),sum=Buffer.alloc(4);length.writeUInt32BE(data.length);sum.writeUInt32BE(crc(Buffer.concat([name,data])));return Buffer.concat([length,name,data,sum]);}
function icon(svg,size,color){
 const view=svg.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number),scale=(size-4)/view[3],ox=(size-view[2]*scale)/2,oy=2;
 const rects=Array.from(svg.matchAll(/<rect\s+([^>]+)\/>/g),m=>Object.fromEntries(Array.from(m[1].matchAll(/(x|y|width|height)="([^"]+)"/g),a=>[a[1],Number(a[2])])));
 const raw=Buffer.alloc(size*(size*4+1)),samples=8;
 for(let y=0;y<size;y++)for(let x=0;x<size;x++){
  let hit=0;
  for(let sy=0;sy<samples;sy++)for(let sx=0;sx<samples;sx++){
   const px=(x+(sx+.5)/samples-ox)/scale,py=(y+(sy+.5)/samples-oy)/scale;
   if(rects.some(r=>px>=(r.x||0)&&px<(r.x||0)+r.width&&py>=(r.y||0)&&py<(r.y||0)+r.height))hit++;
  }
  const i=y*(size*4+1)+1+x*4;raw[i]=raw[i+1]=raw[i+2]=color;raw[i+3]=Math.round(hit/(samples*samples)*255);
 }
 const head=Buffer.alloc(13);head.writeUInt32BE(size,0);head.writeUInt32BE(size,4);head[8]=8;head[9]=6;
 return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',head),chunk('IDAT',zlib.deflateSync(raw)),chunk('IEND',Buffer.alloc(0))]);
}
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const name of ['index.html','src','host','CSXS','assets','LICENSE'])fs.cpSync(path.join(root,name),path.join(dist,name),{recursive:true});
const svg=fs.readFileSync(path.join(root,'assets/icon.svg'),'utf8');
for(const [name,color] of [['icon',182],['icon-dark',84]])for(const size of [23,46])fs.writeFileSync(path.join(dist,'assets',name+(size===46?'@2x':'')+'.png'),icon(svg,size,color));
console.log('Built dist/ · CEP 12 · no runtime dependencies');
