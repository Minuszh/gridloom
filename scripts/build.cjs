// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..'),dist=path.join(root,'dist');
fs.rmSync(dist,{recursive:true,force:true});fs.mkdirSync(dist,{recursive:true});
for(const name of ['index.html','src','host','CSXS','assets','LICENSE'])fs.cpSync(path.join(root,name),path.join(dist,name),{recursive:true});
console.log('Built dist/ · CEP 12 · no runtime dependencies');
