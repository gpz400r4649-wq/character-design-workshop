(()=>{
 const controls=document.querySelector('.layout > .panel:not(#preview-panel)');
 controls.id='controls-panel';
 const heading=controls.querySelector('h2');heading.id='controls-heading';
 const tabs=document.createElement('div');tabs.className='workshop-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','キャラクターのえらびかた');
 const scroll=document.createElement('div');scroll.className='controls-scroll';
 const names={look:'かみがた・服',colors:'色',draw:'練習・保存'},panels={},buttons={};
 for(const [id,name] of Object.entries(names)){
  const button=document.createElement('button');button.type='button';button.id='tab-'+id;button.innerHTML={look:'かみがた・<ruby>服<rt>ふく</rt></ruby>',colors:'<ruby>色<rt>いろ</rt></ruby>',draw:'<ruby>練習<rt>れんしゅう</rt></ruby>・<ruby>保存<rt>ほぞん</rt></ruby>'}[id];button.setAttribute('role','tab');button.setAttribute('aria-controls','pane-'+id);buttons[id]=button;tabs.appendChild(button);
  const panel=document.createElement('div');panel.id='pane-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;panels[id]=panel;scroll.appendChild(panel);
 }
 // Keep the original control elements and IDs: selections and export handlers stay connected.
 for(const node of [...controls.childNodes]){
  if(node===heading)continue;
  if(node.nodeType===1&&node.matches('#hair-part-tabs,#hair-choices,#hair-back-choices,#hair-pair-note,#hair-matching-back,#outfit-choices,#favorites'))continue;
  if(node.nodeType===1&&node.matches('.hair-colors,.eye-colors,.outfit-colors'))continue;
  panels.draw.appendChild(node);
 }
 for(const selector of ['#hair-part-tabs','#hair-choices','#hair-pair-note','#hair-matching-back','#hair-back-choices','#outfit-choices','#favorites'])panels.look.appendChild(controls.querySelector(selector));
 for(const selector of ['.hair-colors','.eye-colors','.outfit-colors'])panels.colors.appendChild(controls.querySelector(selector));
 const favorites=controls.querySelector('#favorites')||panels.look.querySelector('#favorites');
 const save=favorites.querySelector('#favorite-save');
 for(const id of ['look','colors']){
  const actions=document.createElement('div');actions.className='favorite-actions';
  const button=id==='look'?save:document.createElement('button');button.type='button';button.id=id==='look'?'favorite-save':'favorite-save-colors';button.textContent='この子を お気に入りに';actions.appendChild(button);
  const note=document.createElement('p');note.id='favorite-action-status-'+id;note.className='small';note.setAttribute('role','status');note.setAttribute('aria-live','polite');actions.appendChild(note);
  panels[id].appendChild(actions);
 }
 const status=panels.draw.querySelector('#preference-status');controls.appendChild(tabs);controls.appendChild(scroll);controls.appendChild(status);
 function activate(id,focus=false){
  for(const name of Object.keys(names)){const selected=id===name;buttons[name].setAttribute('aria-selected',String(selected));buttons[name].tabIndex=selected?0:-1;panels[name].hidden=!selected;}
  if(id==='look'||id==='colors')panels[id].appendChild(favorites);
  scroll.scrollTop=0;if(focus)buttons[id].focus();
 }
 for(const [id,button] of Object.entries(buttons)){
  button.addEventListener('click',()=>activate(id));
  button.addEventListener('keydown',event=>{const order=Object.keys(names),index=order.indexOf(id);let next;
   if(event.key==='ArrowRight')next=order[(index+1)%order.length];if(event.key==='ArrowLeft')next=order[(index+order.length-1)%order.length];if(event.key==='Home')next=order[0];if(event.key==='End')next=order[order.length-1];
   if(next){event.preventDefault();activate(next,true);}
  });
 }
 const reference=document.querySelector('#preview-panel > .reference-box'),drawer=document.createElement('details'),summary=document.createElement('summary');
 drawer.className='reference-drawer';summary.textContent='お手本を 見る';drawer.appendChild(summary);reference.before(drawer);drawer.appendChild(reference);
 let previousCopy=false;
 function referenceMode(){const copy=['copy','hair'].includes(document.getElementById('activity').value);if(copy){document.getElementById('preview-panel').appendChild(reference);}else{drawer.appendChild(reference);}if(copy||previousCopy)drawer.open=copy;previousCopy=copy;}
 window.syncReferencePractice=referenceMode;
 document.getElementById('activity').addEventListener('change',referenceMode);
 document.addEventListener('DOMContentLoaded',referenceMode);
 activate('look');
})();
