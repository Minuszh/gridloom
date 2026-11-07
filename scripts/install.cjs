// SPDX-License-Identifier: GPL-3.0-only
const fs=require('node:fs'),path=require('node:path'),os=require('node:os');const root=path.resolve(__dirname,'..');
if(!fs.existsSync(path.join(root,'dist/CSXS/manifest.xml')))throw Error('Run npm run build first');
const base=process.platform==='darwin'?path.join(os.homedir(),'Library/Application Support/Adobe/CEP/extensions'):process.platform==='win32'?path.join(process.env.APPDATA,'Adobe/CEP/extensions'):null;
if(!base)throw Error('Only macOS and Windows are supported');
const target=path.join(base,'studio.gridloom.panel');fs.mkdirSync(target,{recursive:true});fs.cpSync(path.join(root,'dist'),target,{recursive:true});
console.log('Installed: '+target+'\nUnsigned development build. Enable CSXS.12 PlayerDebugMode manually, then reopen the panel in Illustrator or InDesign.');
