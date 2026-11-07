// SPDX-License-Identifier: GPL-3.0-only
const {test}=require('node:test'),assert=require('node:assert/strict'),{queue}=require('../src/live.js');
const tick=()=>new Promise(resolve=>setTimeout(resolve,8));
test('slider queue coalesces values and never overlaps host writes',async()=>{
 const writes=[];let release;const q=queue(value=>{writes.push(value);return new Promise(resolve=>release=resolve);},()=>{},1);
 q.push(1);q.push(2);await tick();assert.deepEqual(writes,[2]);q.push(3);q.push(4);await tick();assert.deepEqual(writes,[2]);release();await tick();assert.deepEqual(writes,[2,4]);release();await q.stop();
});
test('cancel drops queued values and waits for the running update',async()=>{
 let release;const writes=[];const q=queue(value=>{writes.push(value);return new Promise(resolve=>release=resolve);},()=>{},1);
 q.push(1);await tick();q.push(2);const stopped=q.stop();release();await stopped;await tick();assert.deepEqual(writes,[1]);
});
test('apply flushes final value and surfaces host failures',async()=>{
 const writes=[];const q=queue(async value=>writes.push(value),()=>{},100);q.push(1);await q.flush(4);assert.deepEqual(writes,[4]);await q.stop();
 let error;const broken=queue(async()=>{throw Error('host failure');},e=>error=e,1);await assert.rejects(broken.flush(1),/host failure/);assert.equal(error.message,'host failure');await broken.stop();
});
