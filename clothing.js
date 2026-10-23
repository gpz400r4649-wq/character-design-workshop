window.ClothingKit=(()=>{
 const C=KIT_CLOTHING;
 for(const [top,t] of Object.entries(C.tops))for(const [bottom,b] of Object.entries(C.bottoms)){
  if(t.onePiece&&bottom!=='skirt')continue;
  const id=top+'__'+bottom,basis=['blouse','sailor','cardigan'].includes(top)?top:'blouse';
  const covered=top==='salopette'||(!t.onePiece&&['trousers','wide_pants'].includes(bottom));
  // Sleeves cover the same complete arms used by short-sleeved outfits.
  const body=bottom==='shorts'&&C.shortsBodies?C.shortsBodies.body:(t.new||['wide_pants','cropped_wide','pleated'].includes(bottom))?(covered?C.coveredBody:C.newBody):bottom!=='skirt'?C.body:null;
  const extension=bottom==='shorts'&&C.shortsLegs?C.shortsLegs:top==='shirt_dress'||(!t.onePiece&&['cropped_wide','pleated'].includes(bottom))?C.lowerExtension:(!t.onePiece&&(bottom==='shorts'||(t.new&&bottom==='skirt')))?C.extension:null;
  for(const [name,v] of Object.entries({...KIT17.variants})){
   if(!name.includes('_'+basis+'_')||name.includes('__'))continue;
   const template=v.template.replace('_'+basis,'_'+id),source=KIT17.templates[v.template],stack=[],visible=[];
   for(let i=0;i<source.length;i++){
    const original=source[i],e=t.finalized&&original.key==='face'?{...KIT_FINAL_CLOTHES.face}:original;
    if(e.key==='outfit_'+basis){stack.push({...t.layer,key:'outfit_'+id});visible.push(v.visible[i]);if(!t.onePiece){stack.push({...((bottom==='skirt'&&C.skirts[top])?C.skirts[top].layer:(C.bottomFits?.[bottom]?.[top]?.layer||b.layer)),key:'outfit_bottom'});visible.push(v.visible[i]);}}
    else {stack.push(e.key==='body_base'&&body?{...body}:{...e});visible.push(v.visible[i]);if(e.key==='body_base'&&extension){stack.push({...extension,key:'body_extension'});visible.push(v.visible[i]);}if(!t.finalized&&e.key==='face'&&(['tshirt','relaxed'].includes(top)||t.new)){stack.push({...C.neck,key:'neck_extension'});visible.push(v.visible[i]);}}
   }
   if(t.finalized){const fi=stack.findIndex(e=>e.key==='face'),oi=stack.findIndex(e=>e.key==='outfit_'+id);if(fi>=0&&oi>=0&&fi<oi){const [e]=stack.splice(fi,1),[on]=visible.splice(fi,1),at=stack.findIndex(e=>e.key==='outfit_'+id)+1;stack.splice(at,0,e);visible.splice(at,0,on);}}
   KIT17.templates[template]=stack;KIT17.variants[name.replace('_'+basis+'_','_'+id+'_')]={...v,template,visible,dynamic:true};
  }
 }
 return {outfitId:(top,bottom='skirt')=>(C.tops[top]?top:'blouse')+'__'+(C.tops[top]?.onePiece?'skirt':C.bottoms[bottom]?bottom:'skirt')};
})();

