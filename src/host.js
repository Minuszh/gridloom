// SPDX-License-Identifier: GPL-3.0-only
/* CEP's documented native bridge. Keep all host-specific behavior here. */
(function () {
  'use strict';
  const cep=window.__adobe_cep__;
  let environment={};try{if(cep)environment=JSON.parse(cep.getHostEnvironment());}catch(ignore){}
  const escape=value=>JSON.stringify(value).replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');
  let busy=false;
  let extensionPath='';try{if(cep)extensionPath=decodeURI(cep.getSystemPath('extension')).replace(/^file:\/\//,'');}catch(ignore){}
  window.GridloomHostClient={
    available:Boolean(cep),appId:environment.appId||'ILST',locale:environment.appUILocale||environment.appLocale||navigator.language,
    resize(width,height) {
      if(cep&&typeof cep.resizeContent==='function')cep.resizeContent(width,height);
    },
    async call(method,payload={}) {
      if(!cep)throw new Error('浏览器预览不能修改文档，请在 Illustrator 中打开面板');
      if(busy)throw new Error('上一操作仍在执行');busy=true;
      // No retry/timeout: a late mutation must never be submitted twice.
      try{return await new Promise((resolve,reject)=>{
        const hostFile=extensionPath+'/host/'+(environment.appId==='IDSN'?'indesign.jsx':'illustrator.jsx');
        const script=`var gridloomReply;try{if(typeof GridloomHost==='undefined'){$.evalFile(File(${escape(hostFile)}));$.global.GridloomHost=GridloomHost;}gridloomReply=GridloomHost.dispatch(${escape(method)},${escape(payload)});}catch(gridloomError){gridloomReply='GRIDLOOM_HOST_ERROR:'+String(gridloomError);}gridloomReply;`;
        cep.evalScript(script,raw=>{
          try{if(typeof raw!=='string'||raw.trim()[0]!=='{')throw new Error(raw&&raw.indexOf('GRIDLOOM_HOST_ERROR:')===0?raw.slice(20):'宿主脚本未能加载，请关闭并重新打开面板');const data=JSON.parse(raw);if(!data.ok)throw new Error(data.error);resolve(data.value);}
          catch(error){reject(new Error(raw==='EvalScript error.'?(environment.appId==='IDSN'?'InDesign':'Illustrator')+' 脚本加载失败，请关闭并重新打开扩展面板':error.message));}
        });
      });}finally{busy=false;}
    }
  };
  function theme(){
    if(!cep)return;
    try{
      const skin=JSON.parse(cep.getHostEnvironment()).appSkinInfo;
      const color=(skin.panelBackgroundColorSRGB || skin.panelBackgroundColor).color;
      const gray=Math.round(color.red*.2126+color.green*.7152+color.blue*.0722);
      const style=document.documentElement.style, dark=gray<128;
      style.setProperty('--surface',`rgb(${gray},${gray},${gray})`);
      style.setProperty('--field',`rgb(${Math.max(0,gray+(dark?-12:10))},${Math.max(0,gray+(dark?-12:10))},${Math.max(0,gray+(dark?-12:10))})`);
      style.setProperty('--text',dark?'#dedede':'#242424');
      style.setProperty('--muted',dark?'#b6b6b6':'#545454');
      style.setProperty('--edge',dark?'#5d5d5d':'#b9b9b9');
      if(skin.baseFontFamily)style.setProperty('--font',JSON.stringify(skin.baseFontFamily)+', system-ui, sans-serif');
      if(skin.baseFontSize>0)style.setProperty('--font-size',skin.baseFontSize+'px');
      style.colorScheme=dark?'dark':'light';
    }catch(error){console.warn('Host theme unavailable',error);}
  }
  theme();if(cep)cep.addEventListener('com.adobe.csxs.events.ThemeColorChanged',theme);
})();
