const ids=['activity','hair','outfit','view','grid','hair-area','reference-format','hair-color','eye-color','outfit-color'];
let selectedVariant=null,selectionRevision=0,saving=false,previousActivity=null;
const preferenceKey='character-design-workshop.selection.v1';
const preferenceOptions={activity:['create','eyes','hair','copy','color'],hair:['bob','long','pony'],outfit:['blouse','sailor','cardigan'],view:['normal','space','silhouette','lineart'],'hair-area':['front','all'],'reference-format':['current','lineart'],'hair-color':['original','brown','black','honey','pink','lavender'],'eye-color':['original','blue','green','amber','purple','rose'],'outfit-color':['original','pink','blue','mint','lemon','lavender']};
function restorePreferences(){
 try{
  const saved=JSON.parse(localStorage.getItem(preferenceKey));
  if(!saved||saved.version!==1||!saved.selection||typeof saved.selection!=='object')return;
  for(const [id,options] of Object.entries(preferenceOptions)){
   if(options.includes(saved.selection[id]))document.getElementById(id).value=saved.selection[id];
  }
  if(typeof saved.selection.grid==='boolean')document.getElementById('grid').checked=saved.selection.grid;
  // A restored copy session keeps its chosen guides, rather than applying entry defaults.
  previousActivity=document.getElementById('activity').value;
 }catch(error){/* Unavailable storage or damaged preferences must not interrupt drawing. */}
}
function rememberPreferences(){
 const status=document.getElementById('preference-status');
 try{
  const selection={};
  for(const id of ids)selection[id]=id==='grid'?document.getElementById(id).checked:document.getElementById(id).value;
  localStorage.setItem(preferenceKey,JSON.stringify({version:1,selection}));
  status.textContent='えらんだ ないようを おぼえたよ。つぎも ここから はじめられるよ。';
 }catch(error){status.textContent='このブラウザーでは えらんだ ないようを おぼえられないよ。そのまま あそべるよ。';}
}
function saveDescription(){
 const view=document.getElementById('view').value;
 const names={normal:'ふつう',space:'すきまを見やすくする',silhouette:'シルエットを見る',lineart:'せんが'};
 return names[view]+'・'+(document.getElementById('grid').checked?'マスあり':'マスなし');
}
function update(){
 const revision=++selectionRevision;
 const activity=document.getElementById('activity').value;
 const color=document.getElementById('hair-color').value,eyeColor=document.getElementById('eye-color').value,outfitColor=document.getElementById('outfit-color').value;
 for(const value of preferenceOptions['outfit-color'])document.getElementById('outfit-color-'+value).checked=value===outfitColor;
 for(const value of preferenceOptions['eye-color'])document.getElementById('eye-color-'+value).checked=value===eyeColor;
 for(const value of preferenceOptions['hair-color'])document.getElementById('hair-color-'+value).checked=value===color;
 const hair=document.getElementById('hair').value,outfit=document.getElementById('outfit').value;
 for(const group of ['hair','outfit'])for(const value of preferenceOptions[group]){
  document.getElementById(`${group}-choice-${value}`).checked=(group==='hair'?hair:outfit)===value;
  document.getElementById(`${group}-image-${value}`).src=`references/${group==='hair'?value:hair}_${group==='outfit'?value:outfit}_normal.png`;
 }
 document.getElementById('outfit-original-swatch').style.background=KIT_OUTFIT.originalSwatches[outfit];
 for(const value of preferenceOptions.outfit)document.getElementById('outfit-description-'+value).textContent=outfitColor==='original'?{blouse:'むらさき',sailor:'ミント',cardigan:'ピンク'}[value]:KIT_OUTFIT.palette.find(x=>x.id===outfitColor).name;
 const view=document.getElementById('view');
 if(previousActivity==='copy'&&activity!=='copy'){
  view.value='normal';document.getElementById('grid').checked=false;
 }
 if(activity==='color'){view.value='lineart';view.disabled=true;}
 else{if(view.disabled)view.value='normal';view.disabled=false;}
 if(activity==='copy'&&previousActivity!=='copy'){
  view.value='space';document.getElementById('grid').checked=true;
 }
 previousActivity=activity;
 document.getElementById('hair-color-note').textContent=view.value==='lineart'?'線画は 色をつけずに ほぞんするよ。':activity==='copy'||activity==='hair'?'えらんだ色は お手本で たしかめよう。':'はじめの色は いちばん ひだり。すきな色を えらぼう。';
 document.getElementById('eye-color-note').textContent=view.value==='lineart'?'線画は 色をつけずに ほぞんするよ。':activity==='eyes'||activity==='copy'?'えらんだ色は お手本で たしかめよう。':'はじめの色は いちばん ひだり。すきな色を えらぼう。';
 document.getElementById('outfit-color-note').textContent=view.value==='lineart'?'線画は 色をつけずに ほぞんするよ。':'うわぎの色を えらぼう。えりや スカートの色は そのままだよ。';
 const grid=document.getElementById('grid').checked;
 document.getElementById('preview-panel').classList.toggle('copy-practice',activity==='copy');
 document.getElementById('preview-heading').innerHTML=activity==='copy'?'ここに、お<ruby>手本<rt>てほん</rt></ruby>を<ruby>見<rt>み</rt></ruby>ながらかこう':'PSDを ひらくと こうなるよ';
 document.getElementById('preview-note').textContent=activity==='copy'?'おてほんと くらべて、すこしずつ かこう。ヒントは PSDの なかで けせるよ。':'めや かみの みほんは、PSDの なかで オンにして たしかめられるよ。';
 const filename=`references/${hair}_${outfit}_${view.value}${grid?'_grid':''}.png`;
 document.getElementById('reference-preview').src=filename;
 const referenceView=document.getElementById('reference-format').value==='lineart'?'lineart':view.value;
 const referenceFilename=`references/${hair}_${outfit}_${referenceView}${grid?'_grid':''}.png`;
 const reference=document.getElementById('reference');
 reference.href=referenceFilename;
 reference.download=`reference_${hair}_${outfit}_${referenceView}${grid?'_grid':''}_v17.png`;
 document.getElementById('filename').textContent='PNG・目と髪がそろった完成見本 ／ '+(referenceView==='lineart'?'線画':saveDescription().split('・')[0])+'・'+(grid?'マスあり':'マスなし');
 document.getElementById('hair-area-control').hidden=activity!=='hair';
 const mode=activity==='hair'?'hair_'+document.getElementById('hair-area').value:activity;
 const key=`${mode}_${hair}_${outfit}_${view.value}${grid?'_grid':''}`;
 selectedVariant={...KIT17.variants[key],hairColor:color,eyeColor,outfitColor};
 selectedVariant.filename=selectedVariant.filename.replace('_v17.psd',`_${color}_${eyeColor}_${outfitColor}_v20.psd`);
 if(!selectedVariant)throw new Error('Missing selection '+key);
 rememberPreferences();
 document.getElementById('activity-filename').textContent='ほぞんする じょうたい：'+saveDescription()+' ／ '+selectedVariant.filename;
 const tip=activity==='create'?'えらんだ こを、この すがたで PSDに ほぞんできるよ。':activity==='eyes'?'めが ない こに、すきな めを かこう。':activity==='hair'?(mode==='hair_front'?'まえがみが ない こに、まえがみを かこう。':'かみが ない こに、すきな かみを かこう。'):activity==='color'?'せんがに、すきな いろを ぬろう。':'マスと すきまを ヒントに、じぶんで かいてみよう。ヒントは あとで けせるよ。';
 document.getElementById('preview-tip').textContent=tip;
 document.getElementById('preview').alt=tip;
 document.getElementById('activity-file').innerHTML='この<ruby>子<rt>こ</rt></ruby>の<ruby>絵<rt>え</rt></ruby>をかく（ほぞん）';
 document.getElementById('activity-tip').textContent='かきやすさと マスも、えらんだ じょうたいで ほぞんするよ。';
 const card=document.getElementById('eye-card-link');card.hidden=!['eyes','hair'].includes(activity);
 card.href=activity==='hair'?'assets/hair_card.png':'assets/eye_card.png';card.textContent=activity==='hair'?'かみの カードを ひらく':'めの カードを ひらく';
 if(!saving)document.getElementById('export-status').textContent=color==='original'&&eyeColor==='original'&&outfitColor==='original'?'':'色を じゅんびしています。';
 const preview=document.getElementById('preview');preview.style.visibility='hidden';
 ColorKit.preview(selectedVariant,color,()=>revision===selectionRevision).then(async data=>{
  if(revision!==selectionRevision)return;
  preview.src='data:image/png;base64,'+data;preview.style.visibility='visible';
  if(!saving&&document.getElementById('export-status').textContent==='色を じゅんびしています。')document.getElementById('export-status').textContent='';
  const current=()=>revision===selectionRevision;
  const refImage=await ColorKit.reference(filename,color,false,current,eyeColor,outfitColor);
  if(!current())return;document.getElementById('reference-preview').src=refImage;
  for(const group of ['hair','outfit'])for(const value of preferenceOptions[group]){
   if(!current())return;
   const file=`references/${group==='hair'?value:hair}_${group==='outfit'?value:outfit}_normal.png`;
   const thumb=await ColorKit.reference(file,color,true,current,eyeColor,outfitColor);
   if(current())document.getElementById(`${group}-image-${value}`).src=thumb;
  }
 }).catch(()=>{
  if(revision===selectionRevision)document.getElementById('export-status').textContent='ひょうじできませんでした。ページを ひらきなおして、もういちど ためしてね。';
 });
}
document.getElementById('activity-file').addEventListener('click',async event=>{
 event.preventDefault();if(saving)return;
 // Read the controls at click time, including changes not delivered as change events.
 update();
 const description=saveDescription();
 const chosen=selectedVariant,status=document.getElementById('export-status');saving=true;
 document.getElementById('activity-file').setAttribute('aria-busy','true');
 status.textContent='PSDを じゅんびしています。すこし まってね。';
 try{
  const blob=await KitExport.build(chosen),url=URL.createObjectURL(blob),link=document.createElement('a');
  link.href=url;link.download=chosen.filename;document.body.appendChild(link);link.click();link.remove();
  setTimeout(()=>URL.revokeObjectURL(url),60000);
 status.textContent=description+' のPSDを ほぞんして、アイビスペイントで ひらこう。';
 }catch(error){
  console.error(error);status.textContent='ほぞんできませんでした。ページを ひらきなおして、もういちど ためしてね。';
 }finally{saving=false;document.getElementById('activity-file').removeAttribute('aria-busy');}
});
let referenceSaving=false;
document.getElementById('reference').addEventListener('click',async event=>{
 event.preventDefault();if(referenceSaving)return;update();referenceSaving=true;
 const hair=document.getElementById('hair').value,outfit=document.getElementById('outfit').value,color=document.getElementById('hair-color').value,eyeColor=document.getElementById('eye-color').value,outfitColor=document.getElementById('outfit-color').value;
 const view=document.getElementById('reference-format').value==='lineart'?'lineart':document.getElementById('view').value;
 const grid=document.getElementById('grid').checked,filename=`references/${hair}_${outfit}_${view}${grid?'_grid':''}.png`;
 const status=document.getElementById('export-status');status.textContent='お手本を じゅんびしています。';
 try{
  let url=await ColorKit.reference(filename,color,false,undefined,eyeColor,outfitColor);const link=document.createElement('a');let blobURL=null;
  if(url.startsWith('data:')){const binary=atob(url.split(',')[1]),data=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)data[i]=binary.charCodeAt(i);blobURL=URL.createObjectURL(new Blob([data],{type:'image/png'}));url=blobURL;}
  link.href=url;
  link.download=`reference_${hair}_${outfit}_${view}${grid?'_grid':''}_${color}_${eyeColor}_${outfitColor}_v20.png`;
  document.body.appendChild(link);link.click();link.remove();status.textContent='お手本を ほぞんしたよ。';
  if(blobURL)setTimeout(()=>URL.revokeObjectURL(blobURL),60000);
 }catch(error){console.error(error);status.textContent='お手本を ほぞんできませんでした。もういちど ためしてね。';}
 finally{referenceSaving=false;}
});
for(const group of ['hair-color','eye-color','outfit-color'])for(const value of preferenceOptions[group])document.getElementById(group+'-'+value).addEventListener('change',event=>{
 if(event.target.checked){document.getElementById(group).value=value;update();}
});
for(const id of ids)document.getElementById(id).addEventListener('change',update);
for(const group of ['hair','outfit'])for(const value of preferenceOptions[group]){
 document.getElementById(`${group}-choice-${value}`).addEventListener('change',event=>{
  if(!event.target.checked)return;
  document.getElementById(group).value=value;update();
 });
}
restorePreferences();
update();
