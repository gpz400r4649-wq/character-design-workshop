window.ClothingKit=(()=>{
 const C=KIT_CLOTHING;
 for(const [top,t] of Object.entries(C.tops))for(const [bottom,b] of Object.entries(C.bottoms)){
  const id=top+'__'+bottom,basis=['blouse','sailor','cardigan'].includes(top)?top:'blouse';
  for(const [name,v] of Object.entries({...KIT17.variants})){
   if(!name.includes('_'+basis+'_')||name.includes('__'))continue;
   const template=v.template.replace('_'+basis,'_'+id),source=KIT17.templates[v.template],stack=[],visible=[];
   for(let i=0;i<source.length;i++){
    const e=source[i];
    if(e.key==='outfit_'+basis){stack.push({...t.layer,key:'outfit_'+id},{...(bottom==='skirt'&&C.skirts[top]?C.skirts[top].layer:(C.bottomFits?.[bottom]?.[top]?.layer||b.layer)),key:'outfit_bottom'});visible.push(v.visible[i],v.visible[i]);}
    else {stack.push(e.key==='body_base'&&bottom!=='skirt'?{...C.body}:{...e});visible.push(v.visible[i]);if(e.key==='body_base'&&bottom==='shorts'){stack.push({...C.extension,key:'body_extension'});visible.push(v.visible[i]);}if(e.key==='face'&&['tshirt','relaxed'].includes(top)){stack.push({...C.neck,key:'neck_extension'});visible.push(v.visible[i]);}}
   }
   KIT17.templates[template]=stack;KIT17.variants[name.replace('_'+basis+'_','_'+id+'_')]={...v,template,visible,dynamic:true};
  }
 }
 return {outfitId:(top,bottom='skirt')=>(C.tops[top]?top:'blouse')+'__'+(C.bottoms[bottom]?bottom:'skirt')};
})();