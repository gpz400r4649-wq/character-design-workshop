/* Organize editing by body part while retaining every selection/export control. */
(()=>{
 const controls=document.querySelector('.layout > .panel:not(#preview-panel)');controls.id='controls-panel';
 const heading=controls.querySelector('h2');heading.id='controls-heading';
 const scroll=document.createElement('div');scroll.className='controls-scroll';
 const names={hair:'かみ',eyes:'目',clothes:'服',skin:'肌',draw:'練習・保存'},labels={hair:'かみ',eyes:'<ruby>目<rt>め</rt></ruby>',clothes:'<ruby>服<rt>ふく</rt></ruby>',skin:'<ruby>肌<rt>はだ</rt></ruby>',draw:'<ruby>練習<rt>れんしゅう</rt></ruby><br><ruby>保存<rt>ほぞん</rt></ruby>'};
 const tabs=document.createElement('div');tabs.className='workshop-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','えらぶ ところ');
 const panels={},buttons={};
 for(const id of Object.keys(names)){
  const button=document.createElement('button');button.type='button';button.id='tab-'+id;button.innerHTML=labels[id];button.setAttribute('role','tab');button.setAttribute('aria-controls','pane-'+id);buttons[id]=button;tabs.appendChild(button);
  const panel=document.createElement('div');panel.id='pane-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);panel.tabIndex=0;panels[id]=panel;scroll.appendChild(panel);
 }
 const find=selector=>controls.querySelector(selector),hairColors=find('.hair-colors'),eyeColors=find('.eye-colors'),topColors=find('.outfit-colors'),bottomColors=find('.bottom-colors'),skinColors=find('.skin-colors'),eyes=find('#eye-style-choices'),clothes=find('#outfit-choices'),favorites=find('#favorites');
 const hairNodes=['#hair-part-tabs','#hair-choices','#hair-complete-choices','#hair-back-choices','#hair-pair-note','#hair-matching-back'].map(find);
 const special=new Set([...hairNodes,hairColors,eyeColors,topColors,bottomColors,skinColors,eyes,clothes,favorites]);
 for(const node of [...controls.childNodes])if(node!==heading&&!special.has(node))panels.draw.appendChild(node);
 // Hair has its own shape/color tabs, with the existing front/back choices inside shape.
 const hairTabs=document.createElement('div');hairTabs.className='section-tabs';hairTabs.setAttribute('role','tablist');hairTabs.setAttribute('aria-label','かみの えらびかた');
 const hairPanels={},hairButtons={};
 for(const [id,label] of [['shape','かたち'],['colors','色（いろ）']]){
  const button=document.createElement('button');button.type='button';button.id='hair-tab-'+id;button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls','hair-pane-'+id);hairButtons[id]=button;hairTabs.appendChild(button);
  const panel=document.createElement('div');panel.id='hair-pane-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);hairPanels[id]=panel;
 }
 hairNodes[0].setAttribute('aria-label','かみの かたち');panels.hair.append(hairTabs,hairPanels.shape,hairPanels.colors);hairNodes.forEach(node=>hairPanels.shape.appendChild(node));hairPanels.colors.appendChild(hairColors);
 const sizeHairTabs=()=>panels.hair.style.setProperty('--hair-category-height',hairTabs.getBoundingClientRect().height+'px');new ResizeObserver(sizeHairTabs).observe(hairTabs);
 const hairActions=document.createElement('div');hairActions.id='hair-pair-actions';hairActions.className='hair-pair-actions';hairNodes[1].querySelector('#hair-choose-back').remove();hairActions.append(hairNodes[5]);hairNodes[0].after(hairActions);
 for(const id of ['eyes','clothes'])hairNodes[0].querySelector('#hair-part-'+id).remove();
 eyes.hidden=false;clothes.hidden=false;panels.eyes.append(eyes,eyeColors);panels.clothes.appendChild(clothes);panels.skin.appendChild(skinColors);
 for(const p of eyes.querySelectorAll('p'))if(p.textContent.includes('色のタブ'))p.textContent='下で、ひとみの色も かえられるよ。';
 const bottom=clothes.querySelector('#bottom-choice-section');bottom.before(topColors);bottom.appendChild(bottomColors);topColors.after(clothes.querySelector('#onepiece-note'));
 // Keep each garment's shape, colors and motifs together.
 const clothesTabs=document.createElement('div');clothesTabs.className='section-tabs';clothesTabs.setAttribute('role','tablist');clothesTabs.setAttribute('aria-label','服のカテゴリー');
 const clothesPanels={},clothesButtons={};
 for(const [id,label] of [['tops','トップス'],['bottoms','ボトムス']]){
  const button=document.createElement('button');button.type='button';button.id='clothes-tab-'+id;button.textContent=label;button.setAttribute('role','tab');button.setAttribute('aria-controls','clothes-pane-'+id);clothesButtons[id]=button;clothesTabs.appendChild(button);
  const panel=document.createElement('div');panel.id='clothes-pane-'+id;panel.setAttribute('role','tabpanel');panel.setAttribute('aria-labelledby',button.id);clothesPanels[id]=panel;
 }
 clothesPanels.bottoms.appendChild(bottom);clothesPanels.tops.appendChild(clothes);
 const bottomNote=document.createElement('p');bottomNote.id='bottom-onepiece-note';bottomNote.className='small';bottomNote.hidden=true;bottomNote.textContent='この服は 上下がひとつのセットです。トップスで 別の服を えらぶと、ボトムスを えらべるよ。';clothesPanels.bottoms.prepend(bottomNote);
 panels.clothes.append(clothesTabs,clothesPanels.tops,clothesPanels.bottoms);
 // One shared favorite action and library follows the currently selected category.
 const actions=document.createElement('div');actions.className='favorite-actions';
 const save=favorites.querySelector('#favorite-save');save.dataset.favoriteSave='';actions.appendChild(save);
 const note=document.createElement('p');note.className='small';note.id='favorite-action-status';note.dataset.favoriteActionStatus='';note.setAttribute('role','status');note.setAttribute('aria-live','polite');actions.appendChild(note);
 const status=panels.draw.querySelector('#preference-status');controls.append(tabs,scroll,status);
 const storageKey='character-design-workshop.tabs.v117';let active='hair',hairActive='shape',clothesActive='tops';
 try{const saved=JSON.parse(localStorage.getItem(storageKey));if(names[saved?.category])active=saved.category;if(hairPanels[saved?.hair])hairActive=saved.hair;if(clothesPanels[saved?.clothes])clothesActive=saved.clothes;}catch{}
 function remember(){try{localStorage.setItem(storageKey,JSON.stringify({category:active,hair:hairActive,clothes:clothesActive}));}catch{}}
 function activate(id,focus=false){
  if(!panels[id])return;active=id;
  for(const name of Object.keys(names)){const selected=id===name;buttons[name].setAttribute('aria-selected',String(selected));buttons[name].tabIndex=selected?0:-1;panels[name].hidden=!selected;}
  panels[id].append(actions,favorites);scroll.scrollTop=0;if(focus)buttons[id].focus();remember();
 }
 function hairTab(id,focus=false){
  if(!hairPanels[id])return;hairActive=id;
  for(const name of Object.keys(hairPanels)){const selected=id===name;hairButtons[name].setAttribute('aria-selected',String(selected));hairButtons[name].tabIndex=selected?0:-1;hairPanels[name].hidden=!selected;}
  scroll.scrollTop=0;if(focus)hairButtons[id].focus();remember();
 }
 function clothesTab(id,focus=false){
  if(!clothesPanels[id])return;clothesActive=id;
  for(const name of Object.keys(clothesPanels)){const selected=id===name;clothesButtons[name].setAttribute('aria-selected',String(selected));clothesButtons[name].tabIndex=selected?0:-1;clothesPanels[name].hidden=!selected;}
  scroll.scrollTop=0;if(focus)clothesButtons[id].focus();remember();
 }
 function bind(buttons,change){
  const order=Object.keys(buttons);
  for(const [id,button] of Object.entries(buttons)){
   button.addEventListener('click',()=>change(id));
   button.addEventListener('keydown',event=>{const i=order.indexOf(id);let next;if(event.key==='ArrowRight')next=order[(i+1)%order.length];if(event.key==='ArrowLeft')next=order[(i+order.length-1)%order.length];if(event.key==='Home')next=order[0];if(event.key==='End')next=order.at(-1);if(next){event.preventDefault();change(next,true);}});
  }
 }
 bind(buttons,activate);bind(hairButtons,hairTab);bind(clothesButtons,clothesTab);
 window.WorkshopTabs={activate,hairTab,clothesTab};
 const reference=document.querySelector('#preview-panel > .reference-box'),drawer=document.createElement('details'),summary=document.createElement('summary');
 drawer.className='reference-drawer';summary.textContent='お手本を 見る';drawer.appendChild(summary);reference.before(drawer);drawer.appendChild(reference);
 let previousCopy=false;
 function referenceMode(){const copy=['copy','hair','clothes'].includes(document.getElementById('activity').value);if(copy)document.getElementById('preview-panel').appendChild(reference);else drawer.appendChild(reference);if(copy||previousCopy)drawer.open=copy;previousCopy=copy;}
 window.syncReferencePractice=referenceMode;document.getElementById('activity').addEventListener('change',referenceMode);document.addEventListener('DOMContentLoaded',referenceMode);
 hairTab(hairActive);clothesTab(clothesActive);activate(active);
})();
