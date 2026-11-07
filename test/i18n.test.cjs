// SPDX-License-Identifier: GPL-3.0-only
const {test}=require('node:test'),assert=require('node:assert/strict'),I=require('../src/i18n.js'),G=require('../src/core.js');
test('software locales resolve to Chinese or English',()=>{for(const locale of ['zh_CN','zh-TW','zh_HK'])assert.equal(I.create(locale).t('Margins'),'边距');for(const locale of ['en_US','en-GB','fr_FR'])assert.equal(I.create(locale).t('Margins'),'Margins');});
test('localized feedback interpolates values',()=>{assert.equal(I.create('en').t('{n} guides',{n:24}),'24 guides');assert.equal(I.create('zh_CN').t('{n} guides',{n:24}),'24 条参考线');});
test('notation errors translate without losing source location',()=>{assert.equal(I.create('en_US').error('无法识别「w」（2:3）'),'Unexpected character"w" (2:3)');assert.match(I.create('en').error('固定尺寸超出可用范围'),/Reduce margins/);});
test('bare dimensions follow document units; explicit units override',()=>{assert.equal(G.length('10','px'),10);assert.equal(G.length('10','in'),720);assert.equal(G.length('10px','mm'),10);assert.equal(G.length('2PC','mm'),24);assert.equal(G.length('1ft','pt'),864);});
