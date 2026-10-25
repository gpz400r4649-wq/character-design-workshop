const ids=['shoe-color','shoe','eye-style','activity','hair','hair-back','outfit','bottom','bottom-color','view','grid','line-hint','hair-hint-strength','reference-format','hair-color','eye-color','outfit-color','skin-color','hair-pattern','hair-accent','eye-mode','eye-color-right',...ColorTune.ids,...FabricPatterns.ids,'hair-tune-target','eye-tune-target'];
const preferenceKey='character-design-workshop.selection.v1';
const preferenceOptions={shoe:ShoeKit.ids,'shoe-color':KIT_OUTFIT.palette.map(x=>x.id),...ColorTune.preferences,...FabricPatterns.options,'hair-tune-target':['0','1'],'eye-tune-target':['0','1'],'eye-style':Object.keys(KIT_EYE_STYLES),'skin-color':KIT_SKIN.palette.map(x=>x.id),'hair-hint-strength':['faint','clear'],activity:['create','eyes','hair','clothes','copy','color'],hair:Object.keys(KIT_MIX.front),'hair-back':Object.keys(KIT_MIX.back),outfit:Object.keys(KIT_CLOTHING.tops),bottom:Object.keys(KIT_CLOTHING.bottoms),'bottom-color':KIT_OUTFIT.palette.map(x=>x.id),view:['normal','space','silhouette','lineart'],'reference-format':['current','lineart'],'hair-pattern':HairPatterns.kinds,'hair-accent':KIT_HAIR.palette.map(x=>x.id),'hair-color':KIT_HAIR.palette.map(x=>x.id),'eye-color':KIT_EYES.palette.map(x=>x.id),'eye-mode':EyeColorKit.modes,'eye-color-right':KIT_EYES.palette.map(x=>x.id),'outfit-color':KIT_OUTFIT.palette.map(x=>x.id)};
let selectedVariant=null,selectionRevision=0,saving=false,referenceSaving=false,previousActivity=null;
const element=id=>document.getElementById(id),value=id=>element(id).value;
function restorePreferences(){try{const saved=JSON.parse(localStorage.getItem(preferenceKey));if(saved?.version!==1)return;saved.selection=normalizeHairSelection(saved.selection||{},saved.hairCatalogVersion||0);saved.selection['eye-style']=normalizeEyeStyle(saved.selection['eye-style']);saved.selection['skin-color']=normalizeSkinTone(saved.selection['skin-color']);saved.selection.bottom=normalizeBottomChoice(saved.selection.bottom);saved.selection['hair-pattern']=normalizeHairPattern(saved.selection['hair-pattern']);saved.selection['eye-mode']=normalizeEyeMode(saved.selection['eye-mode']);for(const [id,options] of Object.entries(preferenceOptions))if(options.includes(saved.selection?.[id]))element(id).value=saved.selection[id];if(!saved.selection?.['hair-back'])element('hair-back').value=KIT_MIX.front[value('hair')].defaultBack;if(typeof saved.selection?.grid==='boolean')element('grid').checked=saved.selection.grid;if(typeof saved.selection?.['line-hint']==='boolean')element('line-hint').checked=saved.selection['line-hint'];previousActivity=value('activity');}catch(e){}}
function rememberPreferences(){try{localStorage.setItem(preferenceKey,JSON.stringify({version:1,hairCatalogVersion:KIT_MIX.version,selection:Object.fromEntries(ids.map(id=>[id,['grid','line-hint'].includes(id)?element(id).checked:value(id)]))}));element('preference-status').textContent='えらんだ ないようを おぼえたよ。';}catch(e){element('preference-status').textContent='このブラウザーでは おぼえられないよ。そのまま あそべるよ。';}}
function referenceSelection(){return {view:value('activity')==='color'?'normal':value('reference-format')==='lineart'?'lineart':value('view'),grid:element('grid').checked};}
function saveDescription(){return ({normal:'ふつう',space:'すきまを見やすくする',silhouette:'シルエットを見る',lineart:'せんが'}[value('view')])+'・'+(element('grid').checked?'マスあり':'マスなし')+(['hair','clothes'].includes(value('activity'))?'・'+(element('line-hint').checked?(value('activity')==='hair'&&value('hair-hint-strength')==='clear'?'はっきりした線のヒント':'うすい線のヒント'):'線のヒントなし'):'');}
function selection(){return {shoeColor:value('shoe-color'),shoe:value('shoe'),front:value('hair'),back:value('hair-back'),outfit:value('outfit'),bottom:value('bottom'),bottomColor:value('bottom-color'),color:value('hair-color'),eye:value('eye-color'),fabric:value('outfit-color'),skin:value('skin-color'),eyeStyle:value('eye-style'),pattern:value('hair-pattern'),accent:value('hair-accent'),eyeMode:value('eye-mode'),eyeRight:value('eye-color-right'),tunes:ColorTune.ids.map(value),fabricPatterns:FabricPatterns.ids.map(value)};}
async function referenceFor(s,view,grid,thumb=false,current){return HairMix.reference(s.front,s.back,ClothingKit.outfitId(s.outfit,s.bottom),view,grid,s.color,thumb,current,s.eye,s.fabric,s.skin,s.eyeStyle,s.bottomColor,s.pattern,s.accent,s.eyeMode,s.eyeRight,s.tunes,s.fabricPatterns,s.shoe,s.shoeColor);}
let previewController=null,previewWaitTimer=null;
function previewStatus(message,retry=false){
 element('preview-loading').hidden=!message;
 element('preview-loading-text').textContent=message;
 element('preview-retry').hidden=!retry;
}
element('preview-retry').addEventListener('click',()=>update());
function update(){
 previewController?.abort();previewController=new AbortController();clearTimeout(previewWaitTimer);
 lastFrontChoice=value('hair');const revision=++selectionRevision,activity=value('activity'),s=selection(),current=()=>revision===selectionRevision;current.signal=previewController.signal;
 for(const group of ['shoe-color','shoe','eye-style','hair','hair-back','outfit','bottom','bottom-color','hair-color','eye-color','outfit-color','skin-color'])for(const id of preferenceOptions[group]){const radio=element(group+(group.endsWith('color')?'-':'-choice-')+id);if(radio)radio.checked=value(group)===id;}
 syncHairPatternControls(s);syncEyeColorControls(s);ColorTuneUI.sync(s);FabricPatternsUI.sync(s);ShoeKit.sync(s);
 const onePiece=!!KIT_CLOTHING.tops[s.outfit]?.onePiece;element('bottom-choice-section').hidden=false;element('bottom-choice-section').disabled=onePiece;element('onepiece-note').hidden=!onePiece;element('bottom-onepiece-note').hidden=!onePiece;if(onePiece)element('bottom-onepiece-note').textContent=KIT_CLOTHING.tops[s.outfit].name+'は 上下がひとつの服です。トップスで 別の服を選ぶと、ボトムスを変更できます。';document.querySelector('.bottom-colors').hidden=onePiece;
 const view=element('view');if(previousActivity==='copy'&&activity!=='copy'){view.value='normal';element('grid').checked=false;}
 if(['hair','clothes'].includes(activity)&&previousActivity!==activity)view.value='normal';
 if(activity==='color'){view.value='lineart';view.disabled=true;}else{if(view.disabled)view.value='normal';view.disabled=false;}
 if(activity==='copy'&&previousActivity!=='copy'){view.value='space';element('grid').checked=true;}previousActivity=activity;
 element('reference-format').disabled=activity==='color';if(activity==='color')element('reference-format').value='current';
 const grid=element('grid').checked,ref=referenceSelection(),mode=activity==='hair'?'hair_all':activity==='clothes'?'outfit_practice':activity;
 selectedVariant={...HairMix.variant(mode,s.front,s.back,ClothingKit.outfitId(s.outfit,s.bottom),view.value,grid,element('line-hint').checked,value('hair-hint-strength'),s.eyeStyle),hairColor:s.color,hairPattern:s.pattern,hairAccent:s.accent,eyeColor:s.eye,eyeMode:s.eyeMode,eyeRightColor:s.eyeRight,colorTunes:s.tunes,fabricPatterns:s.fabricPatterns,shoe:s.shoe,shoeColor:s.shoeColor,outfitColor:s.fabric,bottomColor:s.bottomColor,skinColor:s.skin};
 selectedVariant.filename=selectedVariant.filename.replace('.psd',`_${s.eyeStyle}_${s.color}_${s.eye}_${s.fabric}_${s.bottom}_${s.bottomColor}_${s.skin}${s.eyeMode==='odd'?'_odd_'+s.eyeRight:''}${s.pattern!=='none'?'_'+s.pattern+'_'+s.accent:''}.psd`);
 if(s.shoe!=='original')selectedVariant.filename=selectedVariant.filename.replace('.psd','_shoes_'+s.shoe+'.psd');
 if(s.shoeColor!=='original')selectedVariant.filename=selectedVariant.filename.replace('.psd','_shoeColor_'+s.shoeColor+'.psd');
 if(ColorTune.any(selectedVariant))selectedVariant.filename=selectedVariant.filename.replace('.psd','_tuned.psd');
 selectedVariant.filename=selectedVariant.filename.replace('.psd',FabricPatterns.stamp(selectedVariant)+'.psd');
 const practice=['copy','hair','clothes'].includes(activity);element('preview-panel').classList.toggle('copy-practice',practice);window.syncReferencePractice?.();
 element('preview-heading').textContent=practice?'ここに、お手本を見ながらかこう':'PSDを ひらくと こうなるよ';
 const tip=activity==='hair'?'頭の かたちを みながら、かみの線を なぞってみよう。':activity==='clothes'?'肩・そで・こし・すそを みて、うすい ふくの線を なぞってみよう。':activity==='eyes'?'めが ない こに、すきな めを かこう。':activity==='copy'?'マスと すきまを ヒントに、じぶんで かいてみよう。':activity==='color'?'せんがの したに、すきな いろを ぬろう。':'まえがみと うしろがみを くみあわせた こを ほぞんできるよ。';
 element('preview-tip').textContent=tip;element('preview-note').textContent=tip;element('preview').alt=tip;
 element('activity-filename').textContent='ほぞんする じょうたい：'+saveDescription();element('activity-tip').textContent=activity==='hair'?'PSDでは「ここに・まえの・かみを・かく」に かこう。うしろは「ここに・うしろの・かみを・かく」だよ。':activity==='clothes'?'PSDでは「ここに・ふくを・かく」に かこう。線のヒントは 別のレイヤーで けせるよ。':'えらんだ まえがみ・うしろがみと 色で ほぞんするよ。';
 element('line-hint-control').hidden=!['hair','clothes'].includes(activity);element('hair-hint-strength-control').hidden=activity!=='hair';element('hair-hint-strength').disabled=!element('line-hint').checked;element('clothes-learning').hidden=activity!=='clothes';
 element('filename').textContent='PNG・えらんだ かみがたと ふくの お手本';element('reference').download=`reference_${s.shoe}_${s.shoeColor}_${s.front}__${s.back}_v53.png`;
 element('hair-color-note').textContent=activity==='hair'||activity==='copy'?'えらんだ色は お手本で たしかめよう。':view.value==='lineart'?'線画は 色をつけずに ほぞんするよ。':'かみ全体の 基本の色を えらぼう。下で 別の色も 足せるよ。';
 element('eye-color-note').textContent=s.eyeMode==='odd'?'画面を 見たときの 左右だよ。左右それぞれの 色を えらぼう。':'はじめの色は いちばん ひだり。すきな色を えらぼう。';element('outfit-color-note').textContent=activity==='clothes'?'えらんだ ふくの色は、お手本で たしかめよう。':'トップスの色を えらぼう。ボトムスの色は 別々に えらべるよ。';element('outfit-original-swatch').style.background=KIT_OUTFIT.originalSwatches[s.outfit];element('bottom-original-swatch').style.background=KIT_CLOTHING.bottoms[s.bottom].swatch||(s.bottom==='trousers'?'#cdd8e9':'#fbead2');
 for(const outfit of preferenceOptions.outfit)element('outfit-description-'+outfit).textContent=s.fabric==='original'?({blouse:'むらさき',sailor:'ミント',cardigan:'ピンク',tshirt:'むらさき',relaxed:'むらさき'}[outfit]||'はじめの色'):KIT_OUTFIT.palette.find(x=>x.id===s.fabric).name;
 const guide=`assets/hair-guides/${KIT_MIX.front[s.front].userFinished||s.front==='none'?'mix':s.front}.html?v=49`;
 element('hair-learning').hidden=activity!=='hair';element('hair-guide-open').href=guide;const card=element('eye-card-link');card.hidden=!['eyes','hair','clothes'].includes(activity);card.href=activity==='hair'?guide:activity==='clothes'?'assets/clothes-guide.html':'assets/eye_card.png';card.textContent=['hair','clothes'].includes(activity)?'かきかたガイドを ひらく':'めの カードを ひらく';
 element('hair-pair-note').textContent=KIT_MIX.front[s.front].onePiece?'この まえがみは、ひとつで かみがたが 完成するよ。':'ながい よこがみは 体の まえ、うしろがみは 体の うしろに なるよ。';
 const frontType=KIT_MIX.front[s.front].onePiece?'complete':'front';const activePart=Object.keys(lookSections).find(id=>element('hair-part-'+id).getAttribute('aria-selected')==='true');if(['front','complete'].includes(activePart)&&lastVisibleFrontType!==frontType)hairPartTab(frontType);lastVisibleFrontType=frontType;syncHairPairControls();rememberPreferences();if(!saving)element('export-status').textContent='ひょうじを じゅんびしています。';
 element('preview').setAttribute('aria-busy','true');
 previewStatus('えらんだ 子を よみこんでいるよ。画像が かわるまで まってね。');
 previewWaitTimer=setTimeout(()=>{if(current())previewStatus('よみこみに 時間が かかっているよ。このまま まってね。画像が かわるまで、まえの 子を ひょうじしているよ。');},12000);
 ColorKit.preview(selectedVariant,s.color,current).then(async data=>{
  if(!current())return;clearTimeout(previewWaitTimer);element('preview').src='data:image/png;base64,'+data;element('preview').style.visibility='visible';element('preview').setAttribute('aria-busy','false');previewStatus('');if(!saving)element('export-status').textContent='';
  try{const reference=await referenceFor(s,ref.view,ref.grid,false,current);if(!current())return;element('reference-preview').src=reference;element('reference').href=reference;
  for(const bottom of preferenceOptions.bottom){const thumb=await referenceFor({...s,bottom,outfit:KIT_CLOTHING.tops[s.outfit]?.onePiece?'blouse':s.outfit},'normal',false,true,current);if(!current())return;element('bottom-image-'+bottom).src=thumb;}
  for(const outfit of preferenceOptions.outfit){const thumb=await referenceFor({...s,outfit},'normal',false,true,current);if(!current())return;element('outfit-image-'+outfit).src=thumb;}
  }catch(e){if(current()){console.error(e);if(!saving)element('export-status').textContent='お手本の よみこみに 時間が かかっています。';}}
 }).catch(e=>{if(current()){clearTimeout(previewWaitTimer);console.error(e);element('preview').setAttribute('aria-busy','false');previewStatus('よみこめなかったよ。つながりを たしかめて、もういちど よみこんでね。画像は まえの 子のままだよ。',true);if(!saving)element('export-status').textContent='';}});
}
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
element('activity-file').addEventListener('click',async event=>{event.preventDefault();if(saving)return;update();const chosen=selectedVariant,description=saveDescription();saving=true;element('activity-file').setAttribute('aria-busy','true');element('export-status').textContent='PSDを じゅんびしています。すこし まってね。';try{download(await KitExport.build(chosen),chosen.filename);element('export-status').textContent=description+' のPSDを ほぞんして、アイビスペイントで ひらこう。';}catch(e){console.error(e);element('export-status').textContent='ほぞんできませんでした。もういちど ためしてね。';}finally{saving=false;element('activity-file').removeAttribute('aria-busy');}});
element('reference').addEventListener('click',async event=>{event.preventDefault();if(referenceSaving)return;referenceSaving=true;const s=selection(),r=referenceSelection();element('export-status').textContent='お手本を じゅんびしています。';try{const url=await referenceFor(s,r.view,r.grid),binary=atob(url.split(',')[1]),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));download(new Blob([bytes],{type:'image/png'}),`reference_${s.shoe}_${s.shoeColor}_${s.front}__${s.back}_${s.outfit}_${r.view}_${s.color}_${s.eye}_${s.fabric}_${s.bottom}_${s.bottomColor}_${s.skin}_${s.eyeStyle}${ColorTune.any({colorTunes:s.tunes,hairPattern:s.pattern,eyeMode:s.eyeMode,outfit:s.outfit,fabricPatterns:s.fabricPatterns})?'_tuned':''}${s.eyeMode==='odd'?'_odd_'+s.eyeRight:''}${s.pattern!=='none'?'_'+s.pattern+'_'+s.accent:''}${FabricPatterns.stamp({fabricPatterns:s.fabricPatterns,outfit:s.outfit})}_v115.png`);element('export-status').textContent='お手本を ほぞんしたよ。';}catch(e){console.error(e);element('export-status').textContent='お手本を ほぞんできませんでした。';}finally{referenceSaving=false;}});
for(const id of ids)element(id).addEventListener('change',update);
for(const group of ['shoe-color','hair-color','hair-accent','eye-color','outfit-color','bottom-color','skin-color'])for(const option of preferenceOptions[group])element(group+'-'+option).addEventListener('change',e=>{if(e.target.checked){element(group).value=option;ColorTuneUI.preset(group);update();}});
let lastFrontChoice=value('hair'),lastVisibleFrontType=null;
for(const group of ['shoe','eye-style','hair','hair-back','outfit','bottom'])for(const option of preferenceOptions[group])element(group+'-choice-'+option).addEventListener('change',e=>{if(!e.target.checked)return;element(group).value=option;if(group==='hair'){const previous=KIT_MIX.front[lastFrontChoice];if(KIT_MIX.front[option].onePiece)element('hair-back').value='none';else if(previous?.onePiece&&value('hair-back')==='none')element('hair-back').value=KIT_MIX.front[option].defaultBack;lastFrontChoice=option;}update();});
element('hair-matching-back').addEventListener('click',()=>{element('hair-back').value=KIT_MIX.front[value('hair')].defaultBack;update();});
function syncHairPairControls(){const matching=element('hair-matching-back');matching.hidden=!!KIT_MIX.front[value('hair')].onePiece;element('hair-pair-actions').hidden=matching.hidden;}

const lookSections={complete:'hair-complete-choices',front:'hair-choices',back:'hair-back-choices'};
function hairPartTab(part,focus=false){
 for(const [id,panel] of Object.entries(lookSections)){
  element(panel).hidden=id!==part;
  element('hair-part-'+id).setAttribute('aria-selected',String(id===part));
  element('hair-part-'+id).tabIndex=id===part?0:-1;
 }
 element('hair-pair-note').hidden=false;
 syncHairPairControls();
 const scroll=document.querySelector('.controls-scroll');if(scroll)scroll.scrollTop=0;
 if(focus)element('hair-part-'+part).focus();
}
for(const part of Object.keys(lookSections)){
 const button=element('hair-part-'+part);
 button.addEventListener('click',()=>hairPartTab(part));
 button.addEventListener('keydown',event=>{
  const order=Object.keys(lookSections),index=order.indexOf(part);let next;
  if(event.key==='ArrowRight')next=order[(index+1)%order.length];
  if(event.key==='ArrowLeft')next=order[(index+order.length-1)%order.length];
  if(event.key==='Home')next=order[0];if(event.key==='End')next=order[order.length-1];
  if(next){event.preventDefault();hairPartTab(next,true);}
 });
}
function syncHairPatternControls(s){
 element('hair-accent-panel').hidden=s.pattern==='none';
 for(const c of KIT_HAIR.palette)element('hair-accent-'+c.id).checked=s.accent===c.id;
 element('hair-pattern-note').textContent=s.pattern==='none'?'１色で 全体を そろえるよ。':s.color===s.accent&&ColorTune.text(s.tunes[0])===ColorTune.text(s.tunes[1])?'ちがう２色を えらぶと、色の 入れ方が 見えるよ。':({tips:'毛先に、追加の色を 入れるよ。',gradient:'上から 毛先へ、少しずつ 追加の色に かわるよ。',split:'少し ななめに 分かれるよ。画面の 左が 基本の色、右が 追加の色だよ。'})[s.pattern];
}
element('hair-colors-swap').addEventListener('click',()=>{ColorTuneUI.swap(0,1);const a=value('hair-color');element('hair-color').value=value('hair-accent');element('hair-accent').value=a;update();});
function syncEyeColorControls(s){element('eye-right-panel').hidden=s.eyeMode!=='odd';element('eye-color-side').textContent=s.eyeMode==='odd'?'画面の 左の目':'両目の色';for(const c of KIT_EYES.palette)element('eye-right-'+c.id).checked=s.eyeRight===c.id;}
for(const c of KIT_EYES.palette)element('eye-right-'+c.id).addEventListener('change',e=>{if(e.target.checked){element('eye-color-right').value=c.id;ColorTuneUI.preset('eye-color-right');update();}});
element('eye-colors-swap').addEventListener('click',()=>{ColorTuneUI.swap(2,3);const a=value('eye-color');element('eye-color').value=value('eye-color-right');element('eye-color-right').value=a;update();});
restorePreferences();
const opening=new URLSearchParams(location.search);for(const [param,id] of [['top','outfit'],['bottom','bottom']])if(preferenceOptions[id].includes(normalizeBottomChoice(opening.get(param))))element(id).value=normalizeBottomChoice(opening.get(param));
if(ShoeKit.ids.includes(opening.get('shoe'))){element('shoe').value=opening.get('shoe');WorkshopTabs.activate('clothes');WorkshopTabs.clothesTab('shoes');}
hairPartTab(KIT_MIX.front[value('hair')].onePiece?'complete':'front');if(opening.has('top')||opening.has('bottom'))WorkshopTabs.activate('clothes');update();
