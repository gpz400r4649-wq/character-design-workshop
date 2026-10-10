const ids=['activity','hair','outfit','view','grid','hair-area','reference-format'];
let selectedVariant=null,selectionRevision=0,saving=false,previousActivity=null;
const preferenceKey='character-design-workshop.selection.v1';
const preferenceOptions={activity:['create','eyes','hair','copy','color'],hair:['bob','long','pony'],outfit:['blouse','sailor','cardigan'],view:['normal','space','silhouette','lineart'],'hair-area':['front','all'],'reference-format':['current','lineart']};
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
 const hair=document.getElementById('hair').value,outfit=document.getElementById('outfit').value;
 for(const group of ['hair','outfit'])for(const value of preferenceOptions[group]){
  document.getElementById(`${group}-choice-${value}`).checked=(group==='hair'?hair:outfit)===value;
  document.getElementById(`${group}-image-${value}`).src=`references/${group==='hair'?value:hair}_${group==='outfit'?value:outfit}_normal.png`;
 }
 const view=document.getElementById('view');
 if(activity==='color'){view.value='lineart';view.disabled=true;}
 else{if(view.disabled)view.value='normal';view.disabled=false;}
 if(activity==='copy'&&previousActivity!=='copy'){
  view.value='space';document.getElementById('grid').checked=true;
 }
 previousActivity=activity;
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
 selectedVariant=KIT17.variants[key];
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
 if(!saving)document.getElementById('export-status').textContent='';
 const preview=document.getElementById('preview');preview.style.visibility='hidden';
 KitExport.loadPreview(selectedVariant.preview).then(data=>{
  if(revision!==selectionRevision)return;
  preview.src='data:image/png;base64,'+data;preview.style.visibility='visible';
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
document.getElementById('reference').addEventListener('click',()=>update());
for(const id of ids)document.getElementById(id).addEventListener('change',update);
for(const group of ['hair','outfit'])for(const value of preferenceOptions[group]){
 document.getElementById(`${group}-choice-${value}`).addEventListener('change',event=>{
  if(!event.target.checked)return;
  document.getElementById(group).value=value;update();
 });
}
restorePreferences();
update();
