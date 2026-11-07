// SPDX-License-Identifier: GPL-3.0-only
/* At most one host write in flight; intermediate slider values are discarded. */
(function(root,factory){const api=factory();if(typeof module==='object')module.exports=api;else root.GridloomLive=api;})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 function queue(write,onError,delay=120){
  let latest=null,timer=null,running=null,failure=null,closed=false;
  function clear(){clearTimeout(timer);timer=null;latest=null;}
  function schedule(){if(!closed&&!failure&&!running&&!timer&&latest)timer=setTimeout(()=>{timer=null;send();},delay);}
  function send(){
   if(running||!latest||closed||failure)return;
   const value=latest;latest=null;
   running=Promise.resolve().then(()=>write(value)).catch(error=>{failure=error;latest=null;onError(error);}).finally(()=>{running=null;schedule();});
  }
  return {
   push(value){if(closed||failure)return;latest=value;schedule();},clear,
   async flush(value){clear();if(running)await running;if(failure)throw failure;if(value)latest=value;send();if(running)await running;if(failure)throw failure;},
   async stop(){closed=true;clear();if(running)await running;}
  };
 }
 return {queue};
});
