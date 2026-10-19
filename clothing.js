window.ClothingKit=(()=>{
 const C=KIT_CLOTHING;
 for(const [top,t] of Object.entries(C.tops))for(const [bottom,b] of Object.entries(C.bottoms)){
  if(t.onePiece&&bottom!=='skirt')continue;
  const id=top+'__'+bottom,basis=['blouse','sailor','cardigan'].includes(top)?top:'blouse';
  const covered=top==='salopette'||(!t.onePiece&&['trousers','wide_pants'].includes(bottom));
  const longSleeve=t.new&&top!=='salopette';
  const body=longSleeve?(covered?C.longCoveredBody:C.longBody):(t.new||['wide_pants','cropped_wide','pleated'].includes(bottom))?(covered?C.coveredBody:C.newBody):bottom!=='skirt'?C.body:null;
  const extension=top==='shirt_dress'||(!t.onePiece&&['cropped_wide','pleated'].includes(bottom))?C.lowerExtension:(!t.onePiece&&(bottom==='shorts'||(t.new&&bottom==='skirt')))?C.extension:null;
  for(const [name,v] of Object.entries({...KIT17.variants})){
   if(!name.includes('_'+basis+'_')||name.includes('__'))continue;
   const template=v.template.replace('_'+basis,'_'+id),source=KIT17.templates[v.template],stack=[],visible=[];
   for(let i=0;i<source.length;i++){
    const e=source[i];
    if(e.key==='outfit_'+basis){stack.push({...t.layer,key:'outfit_'+id});visible.push(v.visible[i]);if(!t.onePiece){stack.push({...((bottom==='skirt'&&C.skirts[top])?C.skirts[top].layer:(C.bottomFits?.[bottom]?.[top]?.layer||b.layer)),key:'outfit_bottom'});visible.push(v.visible[i]);}}
    else {stack.push(e.key==='body_base'&&body?{...body}:{...e});visible.push(v.visible[i]);if(e.key==='body_base'&&extension){stack.push({...extension,key:'body_extension'});visible.push(v.visible[i]);}if(e.key==='face'&&(['tshirt','relaxed'].includes(top)||t.new)){stack.push({...C.neck,key:'neck_extension'});visible.push(v.visible[i]);}}
   }
   KIT17.templates[template]=stack;KIT17.variants[name.replace('_'+basis+'_','_'+id+'_')]={...v,template,visible,dynamic:true};
  }
 }
 return {outfitId:(top,bottom='skirt')=>(C.tops[top]?top:'blouse')+'__'+(C.tops[top]?.onePiece?'skirt':C.bottoms[bottom]?bottom:'skirt')};
})();
