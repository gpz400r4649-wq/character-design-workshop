window.normalizeSkinTone=value=>['tone7','tone8','tone9','tone10'].includes(value)?'tone6':value||'original';
/* Apply only registered skin layers. Every file keeps its original alpha and position. */
window.SkinKit=(()=>{
 const preview=ColorKit.preview,build=KitExport.build,compositions=new Map();
 function apply(v){
  const skin=normalizeSkinTone(v.skinColor);
  if(skin==='original'||v.skinApplied||!KIT_SKIN.palette.some(x=>x.id===skin))return v;
  if(v.mix&&(v.mix.view!=='normal'||['color','copy'].includes(v.mix.activity)))return v;
  const eye=v.eyeColor||'original',template=v.template+'_skin_'+skin+'_'+eye,sourceStack=KIT17.templates[v.template],cached=compositions.get(template);
  if(cached?.source===sourceStack&&cached.stack===KIT17.templates[template])return {...v,template,skinApplied:true};
  KIT17.templates[template]=sourceStack.map(entry=>{
   const source=entry.key==='eyes'?(KIT_EYES.layers[entry.blob]?.[eye]?.blob||entry.blob):entry.blob;
   const paint=KIT_SKIN.layers[source]?.[skin];
   return paint?{...entry,blob:paint.blob,raw:paint.raw,name:paint.name}:entry;
  });
  compositions.set(template,{source:sourceStack,stack:KIT17.templates[template]});
  while(compositions.size>24)compositions.delete(compositions.keys().next().value);
  return {...v,template,skinApplied:true};
 }
 ColorKit.preview=(v,color,current)=>preview(apply(v),color,current);
 KitExport.build=v=>build(apply(v));
 return {apply};
})();
