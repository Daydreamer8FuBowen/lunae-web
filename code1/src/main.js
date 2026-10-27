import './style.css';
import { EXAMPLES, interpret, renderScene, sceneAsset } from './scene.js';
import { requestScene, requestPhotoScene, restoreScene } from './generation.js';
import { preparePhoto } from './photo-upload.js';
import { drawingLoaderMarkup, createDrawingLoader } from './drawing-loader.js';

const icons = {
  leaf: '<path d="M12 21V10M12 14C3 14 3 5 3 5s9-1 9 9Zm0-5C12 1 21 2 21 2s1 9-9 9"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>',
  book: '<path d="M12 5v15M3 4q5-1 9 2 4-3 9-2v15q-5-1-9 2-4-3-9-2Z"/>',
  star: '<path d="m12 3 2.6 6.4L21 12l-6.4 2.6L12 21l-2.6-6.4L3 12l6.4-2.6Z"/>',
  heart: '<path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.5a5.5 5.5 0 0 0 0-7.8Z"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>',
  trash: '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7m4-7v7"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.star}</svg>`;
const escape = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const storageKey = 'xuyu-scenes-v1';
const visibleExamples = EXAMPLES.filter(example => ['dog', 'cloud'].includes(example.id));
let memories = [];
let storageWarning = false;
try { const stored = JSON.parse(localStorage.getItem(storageKey) || '[]'); memories = Array.isArray(stored) ? stored.filter(m => m && typeof m.id === 'string' && /^[a-zA-Z0-9-]+$/.test(m.id) && typeof m.text === 'string' && m.text.length <= 240 && ['auto','warm','cool'].includes(m.mood) && Number.isFinite(m.createdAt)).slice(0,100) : []; } catch { storageWarning = true; }
let mood = 'auto';
let current = interpret(EXAMPLES[0].text);
try {
  const last = JSON.parse(localStorage.getItem('xuyu-last-scene') || 'null');
  if (last && typeof last.text === 'string' && last.text.length <= 240 && ['auto','warm','cool'].includes(last.mood)) {
    current = restoreScene(last); mood = last.mood;
  }
} catch { /* A damaged last preview does not prevent opening the journal. */ }
let busy = false;
let inputMode = 'text';
let uploadedPhoto = null;
let preparingPhoto = false;
let toastTimer;
let activeFilter = 'all';

document.querySelector('#app').innerHTML = `
  <header class="site-header"><a class="brand" href="#" aria-label="须臾集首页"><span class="brand-mark">${icon('leaf')}</span><span>须臾集</span></a><nav aria-label="主导航"><button class="nav-link active" id="nav-create">拾一个片刻</button><button class="nav-link" id="nav-collection">我的小集 <span id="collection-count">${memories.length.toString().padStart(2,'0')}</span></button><button class="about-link" id="about-button" aria-label="关于须臾集">?</button></nav></header>
  <main>
    <section class="studio" id="studio" aria-label="创作一个场景">
      <div class="writing-area"><h1>让一闪而过的，<br>有处可停<span class="heading-dot">。</span></h1>
        <form id="scene-form"><div class="creation-modes" role="group" aria-label="创作方式"><button type="button" data-mode="text" class="selected" aria-pressed="true">写一个片刻</button><button type="button" data-mode="photo" aria-pressed="false">从照片拾起</button></div><div id="text-input"><label for="moment" class="input-label">此刻，你想留住什么？</label><div class="input-shell"><textarea id="moment" maxlength="240" rows="4" placeholder="可以是一只路过的小狗，一朵像鲸鱼的云，或一个还没有发生的梦……">${EXAMPLES[0].text}</textarea><div class="input-bottom"><span id="char-count">${EXAMPLES[0].text.length} / 240</span></div></div>
          </div><div id="photo-input" hidden><input id="photo-file" type="file" accept="image/jpeg,image/png,image/webp" hidden /><button type="button" id="choose-photo" class="photo-picker"><span class="photo-plus" aria-hidden="true">＋</span><span>选一张照片</span><span class="photo-note">留下主体，让细节轻一点</span></button><div id="photo-preview" hidden><img id="photo-preview-image" alt="待绘制的照片" /><div class="photo-actions"><button type="button" id="replace-photo">换一张</button><button type="button" id="remove-photo">移除照片</button></div></div><p class="photo-limit">支持常见照片格式，大小不超过 10 兆</p></div>
          <div class="mood-row"><span class="mood-label">画面的心情</span><div class="mood-options" role="group" aria-label="画面色调"><button type="button" class="mood-option selected" data-mood="auto" aria-pressed="true">随画面</button><button type="button" class="mood-option" data-mood="warm" aria-pressed="false"><i class="color-dot warm"></i>暖一点</button><button type="button" class="mood-option" data-mood="cool" aria-pressed="false"><i class="color-dot cool"></i>冷一点</button></div></div>
          <button type="submit" class="primary-button" id="generate-button">${icon('star')}<span>让片刻成景</span>${icon('arrow')}</button>
          <p id="generation-status" class="generation-status" role="status" aria-live="polite"></p><p id="generation-error" class="generation-error" role="alert" hidden></p>
          <p class="keyboard-hint">按住控制键或 ⌘ 键，再按回车，也能留住这一刻</p>
        </form>
      </div>
      <div class="scene-area"><article class="artwork" id="artwork" aria-busy="false"><div class="art-window" id="scene-image">${renderScene(current)}</div><div class="scene-loading" id="scene-loading" hidden>${drawingLoaderMarkup()}</div><div class="artwork-caption"><span class="caption-mark">${icon('star')}</span><div><h2 id="scene-title">${current.title}</h2><p id="scene-quote">${escape(current.text)}</p></div><span class="seal" aria-hidden="true">须<br>臾</span></div></article>
        <div class="scene-toolbar"><div class="save-controls"><button class="text-button" id="download-button">${icon('download')}<span>存为图片</span></button><button class="collect-button" id="collect-button">${icon('heart')}<span>收进小集</span></button></div></div>
      </div>
    </section>
    <section class="inspiration" aria-labelledby="inspiration-title"><div class="section-heading"><div><h2 id="inspiration-title">也可以，从这些片刻开始</h2></div><span class="hand-note">平凡的一天，也有值得收藏的事。</span></div><div class="example-grid">${visibleExamples.map((e,i)=>`<button class="example-card ${e.text===current.text?'chosen':''}" data-example="${e.id}"><div class="example-thumb">${renderScene(interpret(e.text),{animated:false,id:`example-${i}`})}</div><div class="example-content"><span class="example-tag">0${i+1} / ${e.tag}</span><p>${e.short}</p><span class="example-arrow">↗</span></div></button>`).join('')}</div></section>
    <section class="collection" id="collection" hidden aria-labelledby="collection-title"><div class="section-heading"><div><h2 id="collection-title">我的小集</h2></div><div class="collection-filters" role="group" aria-label="收藏筛选"><button data-filter="all" class="active" aria-pressed="true">全部</button><button data-filter="today" aria-pressed="false">今天</button></div></div><div id="collection-content"></div></section>
  </main>
  <footer><p>有些念头，适合住一会儿。</p></footer>
  <div class="toast" id="toast" role="status" aria-live="polite"></div>
  <dialog id="collection-preview" class="collection-preview" aria-label="收藏图片预览"><button type="button" class="preview-close icon-button" aria-label="关闭图片预览" autofocus>${icon('close')}</button><img id="collection-preview-image" alt="" /></dialog>
  <dialog id="about-dialog"><button class="dialog-close icon-button" aria-label="关闭">${icon('close')}</button><span class="dialog-leaf">${icon('leaf')}</span><h2>须臾，也值得珍藏。</h2><p>这里装着路上的偶然、记忆里的午后，<br>和那些还没发生，却已经向往的日子。</p><p class="about-detail">写下一个片刻，或选一张照片，绘成一张简约水粉画。点击「让片刻成景」后，文字或压缩后的照片会发送至本站使用的图片服务；照片会提炼主体，并配上一句中文。同样的内容与色调会复用已有画面，上传原图不会保存。生成图片保存在服务端，收藏记录保存在当前浏览器。示例可以直接预览，喜欢的画面也可以存为图片。</p><button class="primary-button dialog-done">去拾一个片刻 ${icon('arrow')}</button></dialog>
`;

const $ = (s) => document.querySelector(s);
const drawingLoader = createDrawingLoader($('#scene-loading'));
function toast(message) { clearTimeout(toastTimer); $('#toast').textContent = message; $('#toast').classList.add('visible'); toastTimer=setTimeout(()=>$('#toast').classList.remove('visible'),3200); }
function setMood(value) { mood=value; document.querySelectorAll('[data-mood]').forEach(b=>{let active=b.dataset.mood===value;b.classList.toggle('selected',active);b.setAttribute('aria-pressed',String(active));}); }
function selectMood(value) {
  if (busy || value === mood) return;
  setMood(value);
  $('#generation-status').textContent = {
    auto: '下次成景，色调随画面而定。',
    warm: '下次成景，添一点温暖的光。',
    cool: '下次成景，添一点清冷的色。',
  }[value];
}
function countChars() { $('#char-count').textContent=`${$('#moment').value.length} / 240`; }
function isCollected() { return memories.some(m=>m.text===current.text && m.mood===current.mood && (m.imageUrl || '')===(current.imageUrl || '')); }
function updateCollectButton() { const saved=isCollected(); $('#collect-button').classList.toggle('saved',saved); $('#collect-button').innerHTML=`${icon('heart')}<span>${saved?'已收入小集':'收进小集'}</span>`; }
function paint() { $('#scene-image').innerHTML=renderScene(current); $('#scene-title').textContent=current.title; $('#scene-quote').textContent=current.text; $('#artwork').classList.remove('revealed'); void $('#artwork').offsetWidth; $('#artwork').classList.add('revealed'); updateCollectButton(); }
function persist() { try { localStorage.setItem(storageKey,JSON.stringify(memories)); return true; } catch { toast('浏览器暂时无法保存收藏，可以先存为图片。'); return false; } }
function sameDay(a,b) { const x=new Date(a),y=new Date(b);return x.getFullYear()===y.getFullYear()&&x.getMonth()===y.getMonth()&&x.getDate()===y.getDate(); }
function renderCollection() {
  $('#collection-count').textContent=memories.length.toString().padStart(2,'0');
  const items=memories.filter(m=>activeFilter==='all'||sameDay(m.createdAt,Date.now()));
  $('#collection-content').innerHTML=items.length ? `<div class="saved-grid">${items.map(m=>`<article class="saved-card"><button class="saved-open" data-open="${m.id}" aria-label="放大查看收藏：${escape(m.text)}"><div class="saved-thumb">${renderScene(restoreScene(m),{animated:false,id:m.id})}</div><div class="saved-info"><h3>${escape(restoreScene(m).title)}</h3><p>${escape(m.text)}</p></div></button><div class="saved-meta"><span>${new Date(m.createdAt).toLocaleDateString('zh-CN',{month:'long',day:'numeric'})}</span><button class="icon-button delete-button" data-delete="${m.id}" aria-label="移出收藏">${icon('trash')}</button></div></article>`).join('')}</div>` : `<div class="empty-collection">${icon('book')}<div><p>${activeFilter==='today'?'今天的小集，还是空白的一页':'这里，等一个你舍不得忘记的片刻'}</p><span>喜欢眼前的风景，就点一下「收进小集」。</span></div><span class="empty-doodle" aria-hidden="true">✧</span></div>`;
}

async function generate() {
  if(busy || preparingPhoto)return;
  const text=$('#moment').value.trim();
  if(inputMode==='photo' && !uploadedPhoto){toast('先选一张想留下的照片吧。');$('#choose-photo').focus();return;}
  if(inputMode==='text' && !text){toast('先写下一点什么吧，一句话也很好。');$('#moment').focus();return;}
  if(inputMode==='text' && text.length>240){toast('把这个片刻写在 240 字以内吧。');return;}
  busy=true;
  const selectedMood=mood;
  const selectedMode=inputMode;
  setPhotoControlsDisabled(true);
  document.querySelectorAll('[data-mood]').forEach(button=>{button.disabled=true;});
  $('#generate-button').disabled=true;$('#generate-button span').textContent='正在拾起这个片刻…';$('#artwork').setAttribute('aria-busy','true');$('#scene-loading').hidden=false;drawingLoader.start();
  $('#collect-button').disabled=true;$('#download-button').disabled=true;
  $('#generation-error').hidden=true;
  $('#generation-status').textContent=selectedMode==='photo'?'正在拾取照片里的主体，绘成水粉画…':'正在绘成水粉画，可能需要一两分钟。';
  try {
    const result=selectedMode==='photo'?await requestPhotoScene(uploadedPhoto,selectedMood):await requestScene(text,selectedMood);
    const preload=new Image();preload.src=result.scene.imageUrl;await preload.decode();
    current=result.scene;paint();
    try { localStorage.setItem('xuyu-last-scene',JSON.stringify({text:current.text,mood:current.mood,imageUrl:current.imageUrl,title:current.title,source:current.source})); } catch { /* Collection and export remain available. */ }

    document.querySelectorAll('[data-example]').forEach(b=>b.classList.toggle('chosen',selectedMode==='text' && EXAMPLES.find(e=>e.id===b.dataset.example).text===text));
    $('#generation-status').textContent=result.cached?'已拾回之前绘好的画面。':'这一刻，已绘成水粉画。';
    toast('这一刻，有了自己的模样。');
  } catch(error) {
    $('#generation-status').textContent='';
    $('#generation-error').textContent=error.name==='TimeoutError'?'绘制等待超时，请稍后重试。':error instanceof TypeError?'连接中断，请检查网络后重试。':error.message;
    $('#generation-error').hidden=false;
  } finally {
    document.querySelectorAll('[data-mood]').forEach(button=>{button.disabled=false;});
    $('#generate-button').disabled=false;$('#generate-button span').textContent='让片刻成景';$('#artwork').setAttribute('aria-busy','false');$('#scene-loading').hidden=true;drawingLoader.stop();
    $('#collect-button').disabled=false;$('#download-button').disabled=false;busy=false;setPhotoControlsDisabled(false);
  }
}
function setPhotoControlsDisabled(disabled) {
  document.querySelectorAll('[data-mode], #photo-file, #choose-photo, #replace-photo, #remove-photo').forEach(button=>{button.disabled=disabled;});
}
function setInputMode(mode) {
  if(busy || preparingPhoto)return;
  inputMode=mode;
  $('#text-input').hidden=mode!=='text';$('#photo-input').hidden=mode!=='photo';
  $('.keyboard-hint').hidden=mode!=='text';
  document.querySelectorAll('[data-mode]').forEach(button=>{const active=button.dataset.mode===mode;button.classList.toggle('selected',active);button.setAttribute('aria-pressed',String(active));});
  $('#generation-error').hidden=true;$('#generation-status').textContent='';
}
function refreshPhotoPreview() {
  $('#choose-photo').hidden=Boolean(uploadedPhoto);$('#photo-preview').hidden=!uploadedPhoto;
  if(uploadedPhoto)$('#photo-preview-image').src=uploadedPhoto;
  else $('#photo-preview-image').removeAttribute('src');
}
document.querySelectorAll('[data-mode]').forEach(button=>button.addEventListener('click',()=>setInputMode(button.dataset.mode)));
for(const id of ['#choose-photo','#replace-photo']) $(id).addEventListener('click',()=>{if(!busy && !preparingPhoto)$('#photo-file').click();});
$('#remove-photo').addEventListener('click',()=>{if(busy || preparingPhoto)return;uploadedPhoto=null;$('#photo-file').value='';refreshPhotoPreview();$('#generation-status').textContent='';$('#generation-error').hidden=true;});
$('#photo-file').addEventListener('change',async()=>{
  const file=$('#photo-file').files?.[0];if(!file || busy || preparingPhoto)return;
  preparingPhoto=true;setPhotoControlsDisabled(true);$('#generate-button').disabled=true;
  $('#generation-error').hidden=true;$('#generation-status').textContent='正在整理照片…';
  try { uploadedPhoto=await preparePhoto(file);refreshPhotoPreview();$('#generation-status').textContent=''; }
  catch(error){$('#generation-error').textContent=error.message;$('#generation-error').hidden=false;$('#generation-status').textContent='';}
  finally {$('#photo-file').value='';preparingPhoto=false;setPhotoControlsDisabled(false);$('#generate-button').disabled=false;}
});
$('#scene-form').addEventListener('submit',e=>{e.preventDefault();generate();});
$('#moment').addEventListener('input',countChars);
$('#moment').addEventListener('keydown',e=>{if((e.metaKey||e.ctrlKey)&&e.key==='Enter'){e.preventDefault();generate();}});
document.querySelectorAll('[data-mood]').forEach(b=>b.addEventListener('click',()=>selectMood(b.dataset.mood)));
document.querySelectorAll('[data-example]').forEach(b=>b.addEventListener('click',()=>{if(busy || preparingPhoto)return;setInputMode('text');const example=EXAMPLES.find(e=>e.id===b.dataset.example);$('#moment').value=example.text;setMood('auto');countChars();current=interpret(example.text);paint();$('#generation-error').hidden=true;$('#generation-status').textContent='示例画面 · 写下自己的片刻，再让它成景。';document.querySelectorAll('[data-example]').forEach(card=>card.classList.toggle('chosen',card===b));if(innerWidth<760)$('#studio').scrollIntoView({behavior:'smooth'});}));
$('#collect-button').addEventListener('click',()=>{if(busy)return;if(isCollected()){toast('这一刻已经在你的小集里了。');return;}if(memories.length>=100){toast('小集已收藏 100 个片刻，请先移出一些，或存为图片。');return;}const item={id:`m-${crypto.randomUUID()}`,text:current.text,mood:current.mood,title:current.title,source:current.source,...(current.imageUrl?{imageUrl:current.imageUrl}:{}),createdAt:Date.now()};memories.unshift(item);if(!persist()){memories.shift();return;}renderCollection();updateCollectButton();toast('已收进小集，替你记住这一刻。');});
$('#collection-content').addEventListener('click',e=>{
  const open=e.target.closest('[data-open]'),remove=e.target.closest('[data-delete]');
  if(open){const m=memories.find(i=>i.id===open.dataset.open);if(!m)return;const image=$('#collection-preview-image');image.alt=m.text;image.src=sceneAsset(restoreScene(m));$('#collection-preview').showModal();document.documentElement.classList.add('preview-open');}
  if(remove){const old=memories;memories=memories.filter(m=>m.id!==remove.dataset.delete);if(!persist()){memories=old;return;}renderCollection();updateCollectButton();toast('已从小集移出。');}
});
document.querySelectorAll('[data-filter]').forEach(b=>b.addEventListener('click',()=>{activeFilter=b.dataset.filter;document.querySelectorAll('[data-filter]').forEach(x=>{x.classList.toggle('active',x===b);x.setAttribute('aria-pressed',String(x===b));});renderCollection();}));
function downloadBlob(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
$('#download-button').addEventListener('click',async()=>{
  const button=$('#download-button');button.disabled=true;
  const snapshot=current;
  let url;
  try{
    const response=await fetch(sceneAsset(snapshot));
    if(!response.ok)throw new Error('无法读取画面');
    const imageBlob=await response.blob();
    const imageHref=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=()=>reject(reader.error);reader.readAsDataURL(imageBlob);});
    const svg=renderScene(snapshot,{animated:false,id:'export',imageHref});
    url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml;charset=utf-8'}));
    const img=new Image();img.src=url;await img.decode();
    const canvas=document.createElement('canvas');canvas.width=1600;canvas.height=1420;const ctx=canvas.getContext('2d');ctx.fillStyle='#f8f5eb';ctx.fillRect(0,0,1600,1420);ctx.drawImage(img,60,60,1480,1036);
    ctx.fillStyle='#525d50';ctx.font='40px serif';ctx.fillText(snapshot.title,90,1170);
    ctx.fillStyle='#858878';ctx.font='25px serif';let line='',y=1228;for(const char of snapshot.text){if(ctx.measureText(line+char).width>1410){ctx.fillText(line,90,y);line='';y+=38;if(y>1330){line='…';break;}}line+=char;}if(line)ctx.fillText(line,90,y);
    ctx.fillStyle='#8f977e';ctx.font='23px serif';ctx.fillText('须 臾 集',90,1380);
    const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw new Error('无法导出');downloadBlob(blob,`须臾集-${snapshot.title}.png`);toast('已将这一刻存为图片。');
  }catch{toast('图片导出暂时失败，请重试。');}finally{if(url)URL.revokeObjectURL(url);button.disabled=false;}
});
function showView(view, scroll = true) {
  const collectionOpen = view === 'collection';
  $('#studio').hidden = collectionOpen;
  $('.inspiration').hidden = collectionOpen;
  $('#collection').hidden = !collectionOpen;
  $('main').classList.toggle('view-collection', collectionOpen);
  for (const [selector, active] of [['#nav-create', !collectionOpen], ['#nav-collection', collectionOpen]]) {
    const button = $(selector);
    button.classList.toggle('active', active);
    if (active) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}
$('#nav-create').addEventListener('click',()=>showView('create'));
$('#nav-collection').addEventListener('click',()=>showView('collection'));
$('.brand').addEventListener('click',e=>{e.preventDefault();showView('create');});
showView('create', false);
$('#about-button').addEventListener('click',()=>$('#about-dialog').showModal());
const collectionPreview=$('#collection-preview');
$('.preview-close').addEventListener('click',()=>collectionPreview.close());
collectionPreview.addEventListener('click',e=>{if(e.target!==collectionPreview)return;const r=collectionPreview.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)collectionPreview.close();});
collectionPreview.addEventListener('close',()=>{document.documentElement.classList.remove('preview-open');$('#collection-preview-image').removeAttribute('src');});
$('#collection-preview-image').addEventListener('error',()=>{if(collectionPreview.open){collectionPreview.close();toast('暂时无法读取这张图片，请稍后重试。');}});
$('.dialog-close').addEventListener('click',()=>$('#about-dialog').close());
$('.dialog-done').addEventListener('click',()=>$('#about-dialog').close());
$('#about-dialog').addEventListener('click',e=>{if(e.target===$('#about-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
$('#moment').value=current.text;setMood(current.mood);countChars();paint();renderCollection();updateCollectButton();
fetch('/api/health').then(r=>r.json()).then(status=>{if(!busy)$('#generation-status').textContent=status.configured?'写下片刻，绘成水粉画。':'图片服务尚未就绪，先从示例里拾一个片刻吧。';}).catch(()=>{if(!busy)$('#generation-status').textContent='图片服务暂时未连接，示例预览与收藏仍可使用。';});
if(storageWarning)toast('暂时无法读取本地收藏，新片刻仍可以存为图片。');
