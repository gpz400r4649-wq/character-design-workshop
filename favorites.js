window.FavoriteLibrary=(()=>{
 const key='character-design-workshop.favorites.v1';
 const options={'eye-style':Object.keys(KIT_EYE_STYLES),'skin-color':KIT_SKIN.palette.map(x=>x.id),hair:Object.keys(KIT_MIX.front),'hair-back':Object.keys(KIT_MIX.back),outfit:['blouse','sailor','cardigan'],'hair-color':['original','brown','black','honey','pink','lavender'],'eye-color':['original','blue','green','amber','purple','rose'],'outfit-color':['original','pink','blue','mint','lemon','lavender']};
 const clean=(input,catalogVersion=KIT_MIX.version)=>{const value=input?normalizeHairSelection({...input,'eye-style':input['eye-style']||'default','skin-color':normalizeSkinTone(input['skin-color']),'hair-back':input['hair-back']||KIT_MIX.front[input.hair]?.defaultBack},catalogVersion):null;return value&&Object.keys(options).every(id=>options[id].includes(value[id]))?Object.fromEntries(Object.keys(options).map(id=>[id,value[id]])):null;};
 function create(storage){
  let slots=[null,null,null],undo=null;
  try{const data=JSON.parse(storage.getItem(key));if(data?.version===1&&Array.isArray(data.slots))slots=slots.map((_,i)=>clean(data.slots[i],data.hairCatalogVersion||0));}catch(error){}
  const snapshot=()=>slots.map(value=>value?{...value}:null);
  function write(next){storage.setItem(key,JSON.stringify({version:1,hairCatalogVersion:KIT_MIX.version,slots:next}));slots=next;}
  return {snapshot,save(index,value){const valid=clean(value);if(!valid||!Number.isInteger(index)||index<0||index>2)throw new Error('Invalid favorite');const next=snapshot();next[index]=valid;write(next);undo=null;},remove(index){if(!slots[index])return;const next=snapshot(),removed=next[index];next[index]=null;write(next);undo={index,value:removed};},undo(){if(!undo)return;const next=snapshot();next[undo.index]=undo.value;write(next);undo=null;},canUndo:()=>!!undo};
 }
 return {create,options};
})();

(()=>{
 const root=document.getElementById('favorites');if(!root)return;
 const storage={getItem:key=>localStorage.getItem(key),setItem:(key,value)=>localStorage.setItem(key,value)};
 const library=FavoriteLibrary.create(storage),list=document.getElementById('favorite-list'),status=document.getElementById('favorite-status'),undo=document.getElementById('favorite-undo');
 let revision=0,pending=-1;
 const current=()=>Object.fromEntries(Object.keys(FavoriteLibrary.options).map(id=>[id,document.getElementById(id).value]));
 const same=(a,b)=>a&&Object.keys(FavoriteLibrary.options).every(id=>a[id]===b[id]);
 function report(message){status.textContent=message;for(const id of ['look','colors']){const note=document.getElementById('favorite-action-status-'+id);if(note)note.textContent=message;}}
 function mutate(action,message){try{action();pending=-1;render();report(message);}catch(error){report('おぼえられなかったよ。お気に入りは そのままだよ。');}}
 function button(text,action){const el=document.createElement('button');el.type='button';el.textContent=text;el.addEventListener('click',action);return el;}
 function render(){
  const rev=++revision;document.getElementById('favorite-count').textContent='（'+library.snapshot().filter(Boolean).length+'/3）';list.replaceChildren();undo.hidden=!library.canUndo();
  library.snapshot().forEach((saved,index)=>{
   const card=document.createElement('div');card.className='favorite-card';
   const title=document.createElement('p');title.className='favorite-title';title.textContent='お気に入り '+(index+1);card.appendChild(title);
   if(!saved){card.appendChild(button('ここに おぼえる',()=>mutate(()=>library.save(index,current()),'お気に入り '+(index+1)+' に おぼえたよ。')));list.appendChild(card);return;}
   const recall=button('この子を えらぶ',()=>{for(const [id,value] of Object.entries(saved))document.getElementById(id).value=value;update();report('お気に入り '+(index+1)+' を えらんだよ。');});recall.className='favorite-recall';
   const image=document.createElement('img');image.alt='お気に入り '+(index+1)+' の完成見本';image.src=`assets/hair-mix/${saved.hair}-front.png`;recall.prepend(image);card.appendChild(recall);
   HairMix.reference(saved.hair,saved['hair-back'],saved.outfit,'normal',false,saved['hair-color'],true,()=>rev===revision,saved['eye-color'],saved['outfit-color'],saved['skin-color'],saved['eye-style']).then(src=>{if(rev===revision)image.src=src;}).catch(()=>{if(rev===revision){image.hidden=true;image.alt='';const note=document.createElement('p');note.className='small';note.textContent='見本を よみこめなかったよ。もういちど ページを ひらいてね。';card.appendChild(note);}});
   if(pending===index){
    const note=document.createElement('p');note.className='small';note.textContent='今の子に 入れかえる？';card.appendChild(note);
    card.appendChild(button('今の子に 入れかえる',()=>mutate(()=>library.save(index,current()),'お気に入り '+(index+1)+' を 入れかえたよ。')));
    card.appendChild(button('やめる',()=>{pending=-1;render();}));
   }else{
    card.appendChild(button('入れかえる',()=>{pending=index;render();}));
    card.appendChild(button('はずす',()=>mutate(()=>library.remove(index),'お気に入りから はずしたよ。「もどす」で もとに もどせるよ。')));
   }
   list.appendChild(card);
  });
 }
 for(const id of ['favorite-save','favorite-save-colors'])document.getElementById(id).addEventListener('click',()=>{
  const selection=current(),slots=library.snapshot(),duplicate=slots.findIndex(value=>same(value,selection));
  if(duplicate>=0){report('この子は お気に入り '+(duplicate+1)+' に いるよ。');return;}
  const empty=slots.indexOf(null);if(empty<0){root.scrollIntoView({block:'nearest',behavior:'smooth'});report('3人とも そろったよ。入れかえる子を 下から えらんでね。');return;}
  mutate(()=>library.save(empty,selection),'お気に入り '+(empty+1)+' に おぼえたよ。');
 });
 undo.addEventListener('click',()=>mutate(()=>library.undo(),'お気に入りを もとに もどしたよ。'));
 render();
})();
