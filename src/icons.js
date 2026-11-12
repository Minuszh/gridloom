// SPDX-License-Identifier: GPL-3.0-only
/* Small task-specific symbols, not a copy of Illustrator's private assets. */
window.GridloomIcons={mount(t){
 const shapes={
  centerH:'<rect x="3" y="3" width="10" height="10" opacity=".5"/><path d="M1 8h14"/>',
  centerV:'<rect x="3" y="3" width="10" height="10" opacity=".5"/><path d="M8 1v14"/>',
  slider:'<path d="M1 8h4m6 0h4"/><circle cx="8" cy="8" r="3"/>',
  left:'<path d="M3 2v12M12 8H6m3-3L6 8l3 3"/>',
  center:'<path d="M8 2v12M1 8h4L3 6m2 2-2 2m12-2h-4l2-2m-2 2 2 2"/>',
  right:'<path d="M13 2v12M4 8h6M7 5l3 3-3 3"/>',
  top:'<path d="M2 3h12M8 12V6M5 9l3-3 3 3"/>',
  middle:'<path d="M2 8h12M8 1v4L6 3m2 2 2-2M8 15v-4l-2 2m2-2 2 2"/>',
  bottom:'<path d="M2 13h12M8 4v6M5 7l3 3 3-3"/>',
  clear:'<circle cx="8" cy="8" r="5.5"/><path d="m4 12 8-8"/>',
  eye:'<path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4Z"/><circle cx="8" cy="8" r="2"/>',
  eyeOff:'<path d="M1 8s2.5-4 7-4 7 4 7 4-2.5 4-7 4-7-4-7-4ZM2 2l12 12"/>',
  unlock:'<rect x="3" y="7" width="10" height="7"/><path d="M5 7V5a3 3 0 0 1 6 0"/>',
  refresh:'<path d="M13 6a5.2 5.2 0 1 0 0 4M13 2v4H9"/>',
  link:'<path d="M6 4H4a4 4 0 0 0 0 8h2m4-8h2a4 4 0 0 1 0 8h-2M5 8h6"/>',
  lock:'<rect x="3" y="7" width="10" height="7"/><path d="M5 7V5a3 3 0 0 1 6 0v2"/>'
 };
 const svg=name=>'<svg viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.3" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true" focusable="false">'+shapes[name]+'</svg>';
 this.set=(button,name)=>{if(button.dataset.icon===name)return;button.dataset.icon=name;button.innerHTML=svg(name);};
 document.querySelectorAll('[data-quick]').forEach(button=>{button.removeAttribute('data-i18n');this.set(button,button.dataset.quick);button.classList.add('icon-button');});
 for(const [id,name,label] of [['center-h','centerH','Horizontal center'],['center-v','centerV','Vertical center'],['live-preview','eye','Live preview'],['visibility','eye','Show / hide'],['lock-guides','lock','Lock / unlock guides'],['reset','refresh','Reset form']]){
  const button=document.getElementById(id);button.removeAttribute('data-i18n');this.set(button,name);button.setAttribute('aria-label',t(label));button.classList.add('icon-button');
 }
 for(const key of ['cols','rows'])this.set(document.getElementById(key+'-toggle'),'slider');
 const linked=document.getElementById('linked'),label=linked.parentElement,span=label.querySelector('span');
 span.removeAttribute('data-i18n');span.innerHTML=svg('link');linked.setAttribute('aria-label',t('Link'));label.classList.add('icon-check');
}};
