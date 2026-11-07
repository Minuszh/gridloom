// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');const root=path.resolve(__dirname,'..');
for(const directory of ['src','host','scripts'])for(const file of fs.readdirSync(path.join(root,directory)))if(/\.(js|jsx|cjs)$/.test(file))new vm.Script(fs.readFileSync(path.join(root,directory,file),'utf8'),{filename:file});
const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),ids=Array.from(html.matchAll(/\bid="([^"]+)"/g),m=>m[1]);if(ids.length!==new Set(ids).size)throw Error('Duplicate HTML id');
for(const m of html.matchAll(/(?:src|href)="([^"#]+)"/g))if(!fs.existsSync(path.join(root,m[1])))throw Error('Missing asset: '+m[1]);
const css=fs.readFileSync(path.join(root,'src/panel.css'),'utf8');for(const m of css.matchAll(/#([a-f\d]{6}|[a-f\d]{3})\b/gi)){let h=m[1];if(h.length===3)h=h.split('').map(c=>c+c).join('');if(h.slice(0,2)!==h.slice(2,4)||h.slice(0,2)!==h.slice(4))throw Error('Non-grayscale color: '+h);}
console.log('Syntax, assets, unique IDs and grayscale palette verified');
