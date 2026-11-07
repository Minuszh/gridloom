// SPDX-License-Identifier: GPL-3.0-only
const {test}=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/host.js'),'utf8');
function setup(appId='ILST',reply){
 const loads=[],calls=[],context=vm.createContext({console:{warn(){}},navigator:{language:'en'},document:{documentElement:{style:{setProperty(){}}}}});
 context.window=context;context.$={global:context,evalFile(file){loads.push(file);context.GridloomHost={dispatch(method,payload){calls.push({method,payload});return JSON.stringify({ok:true,value:{method,payload}});}};}};context.File=p=>p;
 context.__adobe_cep__={getHostEnvironment:()=>JSON.stringify({appId}),getSystemPath:()=> 'file:///tmp/gridloom%20extension',addEventListener(){},evalScript(script,callback){callback(reply===undefined?vm.runInContext(script,context):reply);}};
 vm.runInContext(source,context);return {client:context.GridloomHostClient,loads,calls};
}
test('CEP bridge loads the correct host once, using an explicit extension path',async()=>{
 for(const [id,file] of [['ILST','illustrator.jsx'],['IDSN','indesign.jsx']]){const e=setup(id);await e.client.call('context');await e.client.call('apply',{text:'";throw Error(1);//'});assert.deepEqual(e.loads,['/tmp/gridloom extension/host/'+file]);assert.equal(e.calls.length,2);assert.equal(e.calls[1].payload.text,'";throw Error(1);//');}
});
test('non-JSON native errors are reported without JSON parse noise or retry',async()=>{
 const e=setup('ILST','EvalScript error.');await assert.rejects(e.client.call('context'),error=>!/Unexpected token|JSON/.test(error.message));assert.equal(e.calls.length,0);
});
