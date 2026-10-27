import test from 'node:test';
import assert from 'node:assert/strict';
import { interpret, renderScene, sceneAsset, EXAMPLES } from '../src/scene.js';
import { stat } from 'node:fs/promises';

test('四个核心片刻各自进入不同的场景',()=>{
  for(const example of EXAMPLES)assert.equal(interpret(example.text).type,example.id);
});
test('具体修改能改变天气和动物',()=>{
  assert.equal(interpret('下班路上一只白色的小猫').cat,true);
  assert.equal(interpret('下班路上一只白色的小猫').white,true);
  assert.equal(interpret('外婆家的窗旁，雨停了，现在是晴天').rainy,false);
  assert.equal(interpret('海边的夜晚有星空').night,true);
  assert.equal(interpret('小时候外婆家的下午').type,'memory');
});
test('同一句话产生稳定画面，不同文字改变种子',()=>{
  assert.equal(renderScene(interpret('未来的海边书店')),renderScene(interpret('未来的海边书店')));
  assert.notEqual(interpret('未来的海边书店').seed,interpret('未来的海边书店里有花').seed);
});
test('显式冷暖选择优先于文本，并兼容未识别的内容',()=>{
  assert.equal(interpret('夏天的公园','cool').warm,false);
  assert.equal(interpret('夏天的公园','cool').cool,true);
  assert.equal(interpret('一个未曾发生的念头').type,'garden');
  assert.equal(interpret('远方的山林').type,'mountain');
  assert.equal(interpret('星星落在夜里').type,'night');
});

test('每个场景与动物变体都有可用的本地水粉图片', async()=>{
  const texts=['海边书店','路边小狗','路边小猫','白色小狗','白色小猫','鲸鱼云','外婆家的窗','远方山林','星夜','花园'];
  const assets=texts.map(text=>sceneAsset(interpret(text)));
  assert.equal(new Set(assets).size,10);
  for(const asset of assets)assert.ok((await stat(new URL(asset))).size>0);
});

test('导出可内嵌图片且保留色调与雨景，不依赖外部图片地址',()=>{
  const scene=interpret('外婆家的窗外下雨','cool');
  const svg=renderScene(scene,{animated:false,id:'export',imageHref:'data:image/webp;base64,dGVzdA=='});
  assert.ok(svg.includes('href="data:image/webp;base64,dGVzdA=="'));
  assert.ok(!svg.includes('/art/gouache/'));
  assert.ok(svg.includes('class="rain"') && svg.includes('#7c9fae'));
});
