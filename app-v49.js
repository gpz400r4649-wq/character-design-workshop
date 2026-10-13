const ids=['activity','hair','hair-back','outfit','view','grid','line-hint','reference-format','hair-color','eye-color','outfit-color'];
const preferenceKey='character-design-workshop.selection.v1';
const preferenceOptions={activity:['create','eyes','hair','clothes','copy','color'],hair:Object.keys(KIT_MIX.front),'hair-back':Object.keys(KIT_MIX.back),outfit:['blouse','sailor','cardigan'],view:['normal','space','silhouette','lineart'],'reference-format':['current','lineart'],'hair-color':['original','brown','black','honey','pink','lavender'],'eye-color':['original','blue','green','amber','purple','rose'],'outfit-color':['original','pink','blue','mint','lemon','lavender']};
let selectedVariant=null,selectionRevision=0,saving=false,referenceSaving=false,previousActivity=null;
const element=id=>document.getElementById(id),value=id=>element(id).value;
function restorePreferences(){try{const saved=JSON.parse(localStorage.getItem(preferenceKey));if(saved?.version!==1)return;for(const [id,options] of Object.entries(preferenceOptions))if(options.includes(saved.selection?.[id]))element(id).value=saved.selection[id];if(!saved.selection?.['hair-back'])element('hair-back').value=KIT_MIX.front[value('hair')].defaultBack;if(typeof saved.selection?.grid==='boolean')element('grid').checked=saved.selection.grid;if(typeof saved.selection?.['line-hint']==='boolean')element('line-hint').checked=saved.selection['line-hint'];previousActivity=value('activity');}catch(e){}}
function rememberPreferences(){try{localStorage.setItem(preferenceKey,JSON.stringify({version:1,selection:Object.fromEntries(ids.map(id=>[id,['grid','line-hint'].includes(id)?element(id).checked:value(id)]))}));element('preference-status').textContent='えらんだ ないようを おぼえたよ。';}catch(e){element('preference-status').textContent='このブラウザーでは おぼえられないよ。そのまま あそべるよ。';}}
function referenceSelection(){return {view:value('activity')==='color'?'normal':value('reference-format')==='lineart'?'lineart':value('view'),grid:element('grid').checked};}
function saveDescription(){return ({normal:'ふつう',space:'すきまを見やすくする',silhouette:'シルエットを見る',lineart:'せんが'}[value('view')])+'・'+(element('grid').checked?'マスあり':'マスなし')+(['hair','clothes'].includes(value('activity'))?'・'+(element('line-hint').checked?'線のヒントあり':'線のヒントなし'):'');}
function selection(){return {front:value('hair'),back:value('hair-back'),outfit:value('outfit'),color:value('hair-color'),eye:value('eye-color'),fabric:value('outfit-color')};}
async function referenceFor(s,view,grid,thumb=false,current){return HairMix.reference(s.front,s.back,s.outfit,view,grid,s.color,thumb,current,s.eye,s.fabric);}
function update(){
 const revision=++selectionRevision,activity=value('activity'),s=selection(),current=()=>revision===selectionRevision;
 for(const group of ['hair','hair-back','outfit','hair-color','eye-color','outfit-color'])for(const id of preferenceOptions[group]){const radio=element(group+(group.endsWith('color')?'-':'-choice-')+id);if(radio)radio.checked=value(group)===id;}
 const view=element('view');if(previousActivity==='copy'&&activity!=='copy'){view.value='normal';element('grid').checked=false;}
 if(['hair','clothes'].includes(activity)&&previousActivity!==activity)view.value='normal';
 if(activity==='color'){view.value='lineart';view.disabled=true;}else{if(view.disabled)view.value='normal';view.disabled=false;}
 if(activity==='copy'&&previousActivity!=='copy'){view.value='space';element('grid').checked=true;}previousActivity=activity;
 element('reference-format').disabled=activity==='color';if(activity==='color')element('reference-format').value='current';
 const grid=element('grid').checked,ref=referenceSelection(),mode=activity==='hair'?'hair_all':activity==='clothes'?'outfit_practice':activity;
 selectedVariant={...HairMix.variant(mode,s.front,s.back,s.outfit,view.value,grid,element('line-hint').checked),hairColor:s.color,eyeColor:s.eye,outfitColor:s.fabric};
 selectedVariant.filename=selectedVariant.filename.replace('.psd',`_${s.color}_${s.eye}_${s.fabric}.psd`);
 const practice=['copy','hair','clothes'].includes(activity);element('preview-panel').classList.toggle('copy-practice',practice);window.syncReferencePractice?.();
 element('preview-heading').textContent=practice?'ここに、お手本を見ながらかこう':'PSDを ひらくと こうなるよ';
 const tip=activity==='hair'?'頭の かたちを みながら、うすい かみの線を なぞってみよう。':activity==='clothes'?'肩・そで・こし・すそを みて、うすい ふくの線を なぞってみよう。':activity==='eyes'?'めが ない こに、すきな めを かこう。':activity==='copy'?'マスと すきまを ヒントに、じぶんで かいてみよう。':activity==='color'?'せんがの したに、すきな いろを ぬろう。':'まえがみと うしろがみを くみあわせた こを ほぞんできるよ。';
 element('preview-tip').textContent=tip;element('preview-note').textContent=tip;element('preview').alt=tip;
 element('activity-filename').textContent='ほぞんする じょうたい：'+saveDescription();element('activity-tip').textContent=activity==='hair'?'PSDでは「ここに・まえの・かみを・かく」に かこう。うしろは「ここに・うしろの・かみを・かく」だよ。':activity==='clothes'?'PSDでは「ここに・ふくを・かく」に かこう。線のヒントは 別のレイヤーで けせるよ。':'えらんだ まえがみ・うしろがみと 色で ほぞんするよ。';
 element('line-hint-control').hidden=!['hair','clothes'].includes(activity);element('clothes-learning').hidden=activity!=='clothes';
 element('filename').textContent='PNG・えらんだ かみがたと ふくの お手本';element('reference').download=`reference_${s.front}__${s.back}_v49.png`;
 element('hair-color-note').textContent=activity==='hair'||activity==='copy'?'えらんだ色は お手本で たしかめよう。':view.value==='lineart'?'線画は 色をつけずに ほぞんするよ。':'まえがみと うしろがみが、おなじ色に なるよ。';
 element('eye-color-note').textContent='はじめの色は いちばん ひだり。すきな色を えらぼう。';element('outfit-color-note').textContent=activity==='clothes'?'えらんだ ふくの色は、お手本で たしかめよう。':'うわぎの色を えらぼう。えりや スカートの色は そのままだよ。';element('outfit-original-swatch').style.background=KIT_OUTFIT.originalSwatches[s.outfit];
 for(const outfit of preferenceOptions.outfit)element('outfit-description-'+outfit).textContent=s.fabric==='original'?{blouse:'むらさき',sailor:'ミント',cardigan:'ピンク'}[outfit]:KIT_OUTFIT.palette.find(x=>x.id===s.fabric).name;
 const guide=`assets/hair-guides/${KIT_MIX.front[s.front].userFinished||s.front==='none'?'mix':s.front}.html?v=49`;
 element('hair-learning').hidden=activity!=='hair';element('hair-guide-open').href=guide;const card=element('eye-card-link');card.hidden=!['eyes','hair','clothes'].includes(activity);card.href=activity==='hair'?guide:activity==='clothes'?'assets/clothes-guide.html':'assets/eye_card.png';card.textContent=['hair','clothes'].includes(activity)?'かきかたガイドを ひらく':'めの カードを ひらく';
 element('hair-pair-note').textContent=KIT_MIX.front[s.front].onePiece?'この まえがみは、ひとつで かみがたが 完成するよ。':'ながい よこがみは 体の まえ、うしろがみは 体の うしろに なるよ。';
 rememberPreferences();if(!saving)element('export-status').textContent='ひょうじを じゅんびしています。';element('preview').style.visibility='hidden';
 ColorKit.preview(selectedVariant,s.color,current).then(async data=>{
  if(!current())return;element('preview').src='data:image/png;base64,'+data;element('preview').style.visibility='visible';if(!saving)element('export-status').textContent='';
  const reference=await referenceFor(s,ref.view,ref.grid,false,current);if(!current())return;element('reference-preview').src=reference;element('reference').href=reference;
  for(const outfit of preferenceOptions.outfit){const thumb=await referenceFor({...s,outfit},'normal',false,true,current);if(!current())return;element('outfit-image-'+outfit).src=thumb;}
 }).catch(e=>{if(current()){console.error(e);element('export-status').textContent='ひょうじできませんでした。ページを ひらきなおしてね。';}});
}
function download(blob,name){const url=URL.createObjectURL(blob),link=document.createElement('a');link.href=url;link.download=name;document.body.appendChild(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),60000);}
element('activity-file').addEventListener('click',async event=>{event.preventDefault();if(saving)return;update();const chosen=selectedVariant,description=saveDescription();saving=true;element('activity-file').setAttribute('aria-busy','true');element('export-status').textContent='PSDを じゅんびしています。すこし まってね。';try{download(await KitExport.build(chosen),chosen.filename);element('export-status').textContent=description+' のPSDを ほぞんして、アイビスペイントで ひらこう。';}catch(e){console.error(e);element('export-status').textContent='ほぞんできませんでした。もういちど ためしてね。';}finally{saving=false;element('activity-file').removeAttribute('aria-busy');}});
element('reference').addEventListener('click',async event=>{event.preventDefault();if(referenceSaving)return;referenceSaving=true;const s=selection(),r=referenceSelection();element('export-status').textContent='お手本を じゅんびしています。';try{const url=await referenceFor(s,r.view,r.grid),binary=atob(url.split(',')[1]),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));download(new Blob([bytes],{type:'image/png'}),`reference_${s.front}__${s.back}_${s.outfit}_${r.view}_${s.color}_${s.eye}_${s.fabric}_v49.png`);element('export-status').textContent='お手本を ほぞんしたよ。';}catch(e){console.error(e);element('export-status').textContent='お手本を ほぞんできませんでした。';}finally{referenceSaving=false;}});
for(const id of ids)element(id).addEventListener('change',update);
for(const group of ['hair-color','eye-color','outfit-color'])for(const option of preferenceOptions[group])element(group+'-'+option).addEventListener('change',e=>{if(e.target.checked){element(group).value=option;update();}});
for(const group of ['hair','hair-back','outfit'])for(const option of preferenceOptions[group])element(group+'-choice-'+option).addEventListener('change',e=>{if(!e.target.checked)return;element(group).value=option;if(group==='hair'&&KIT_MIX.front[option].onePiece)element('hair-back').value='none';update();});
element('hair-matching-back').addEventListener('click',()=>{element('hair-back').value=KIT_MIX.front[value('hair')].defaultBack;update();});
function hairPartTab(part,focus=false){
 element('hair-choices').hidden=part!=='front';element('hair-back-choices').hidden=part!=='back';
 for(const id of ['front','back']){element('hair-part-'+id).setAttribute('aria-selected',String(id===part));element('hair-part-'+id).tabIndex=id===part?0:-1;}
 if(focus)element('hair-part-'+part).focus();
}
for(const part of ['front','back']){element('hair-part-'+part).addEventListener('click',()=>hairPartTab(part));element('hair-part-'+part).addEventListener('keydown',event=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){event.preventDefault();hairPartTab(event.key==='Home'?'front':event.key==='End'?'back':part==='front'?'back':'front',true);}});}
hairPartTab('front');restorePreferences();update();
