/* Exact, precomputed hair and iris patches plus signed fabric deltas; no remote processing. */
window.kitOutfitDeltas=Object.create(null);
window.kitEyePatches=Object.create(null);
window.kitColorPatches=Object.create(null);
window.kitReferenceData=Object.create(null);
window.ColorKit=(()=>{
 const pending=new Map(),rendered=new Map();let queue=Promise.resolve();
 function keep(key,value){rendered.delete(key);rendered.set(key,value);while(rendered.size>8)rendered.delete(rendered.keys().next().value);return value;}
 function serial(fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}
 function script(kind,id){
  const store=kind==='colors'?kitColorPatches:kind==='eye_colors'?kitEyePatches:kind==='outfit_colors'?kitOutfitDeltas:kitReferenceData;
  if(store[id])return Promise.resolve(store[id]);
  const key=kind+'/'+id;if(pending.has(key))return pending.get(key);
  const task=new Promise((resolve,reject)=>{
   const el=document.createElement('script');el.src=key+'.js';
   const timer=setTimeout(()=>{el.remove();reject(Error('Color asset timeout'));},60000);
   el.onload=()=>{clearTimeout(timer);el.remove();store[id]?resolve(store[id]):reject(Error('Missing color asset'));};
   el.onerror=()=>{clearTimeout(timer);el.remove();reject(Error('Color asset unavailable'));};
   document.head.appendChild(el);
  }).finally(()=>pending.delete(key));pending.set(key,task);return task;
 }
 function image(src){return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Color image unavailable'));im.src=src;});}
 async function outfitData(id){
  try{
   let compressed;
   if(location.protocol==='file:'){
    const binary=atob(await script('outfit_colors',id));compressed=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)compressed[i]=binary.charCodeAt(i);
   }else{
    const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
    try{const response=await fetch('outfit_colors/'+id+'.bin',{signal:controller.signal});if(!response.ok)throw Error('Fabric color unavailable');compressed=new Uint8Array(await response.arrayBuffer());}finally{clearTimeout(timer);}
   }
   return pako.inflate(compressed);
  }finally{delete kitOutfitDeltas[id];}
 }
 async function apply(base,key,color,thumb,current,eyeColor,outfitColor){
  if(current&&!current())throw Error('Superseded color request');
  const delta=KIT_OUTFIT.patches[key]?.[outfitColor]?.[color];
  const patches=[['colors',KIT_HAIR.patches[key]?.[color]],['eye_colors',KIT_EYES.patches[key]?.[eyeColor]?.[color]]].filter(x=>x[1]);
  if(!patches.length&&!delta)return base;
  const canvas=document.createElement('canvas');canvas.width=KIT17.width;canvas.height=KIT17.height;
  const context=canvas.getContext('2d');let original,overlay;
  try{
   original=await image(base);
   if(current&&!current())throw Error('Superseded color request');
   context.drawImage(original,0,0);
   for(const [kind,patch] of patches){
    const src=location.protocol==='file:'?'data:image/png;base64,'+await script(kind,patch.id):kind+'/'+patch.id+'.png';
    overlay=await image(src);if(current&&!current())throw Error('Superseded color request');
    context.drawImage(overlay,patch.x,patch.y);overlay.src='';
    delete (kind==='colors'?kitColorPatches:kitEyePatches)[patch.id];
   }
   if(delta){
    const data=await outfitData(delta.id),signed=new DataView(data.buffer,data.byteOffset,data.byteLength),step=delta.dtype==='i16'?2:1;
    if(data.length!==delta.w*delta.h*3*step)throw Error('Invalid fabric color data');
    const values=new Int16Array(delta.w*delta.h*3);
    for(let i=0;i<values.length;i++)values[i]=step===2?signed.getInt16(i*2,true):signed.getInt8(i);
    if(delta.correction){
     const correction=await outfitData(delta.correction),view=new DataView(correction.buffer,correction.byteOffset,correction.byteLength),count=view.getUint32(0,true);
     if(correction.length!==4+count*7)throw Error('Invalid fabric correction data');
     for(let i=0;i<count;i++){
      const pos=4+i*7,pixel=view.getUint32(pos,true);if(pixel>=delta.w*delta.h)throw Error('Invalid fabric correction position');
      for(let c=0;c<3;c++)values[pixel*3+c]+=view.getInt8(pos+4+c);
     }
    }
    if(current&&!current())throw Error('Superseded color request');
    const region=context.getImageData(delta.x,delta.y,delta.w,delta.h);
    for(let pixel=0;pixel<delta.w*delta.h;pixel++)for(let c=0;c<3;c++)region.data[pixel*4+c]+=values[pixel*3+c];
    context.putImageData(region,delta.x,delta.y);delete kitOutfitDeltas[delta.id];
   }
   if(thumb){
    const small=document.createElement('canvas');small.width=1024;small.height=1536;
    small.getContext('2d').drawImage(canvas,0,0,1024,1536);
    const result=small.toDataURL('image/png');small.width=small.height=0;return result;
   }
   return canvas.toDataURL('image/png');
  }finally{
   canvas.width=canvas.height=0;
   if(original)original.src='';if(overlay)overlay.src='';
   for(const [kind,patch] of patches)delete (kind==='colors'?kitColorPatches:kitEyePatches)[patch.id];
  }
 }
 async function preview(variant,color,current){
  const eyeColor=variant.eyeColor||'original',outfitColor=variant.outfitColor||'original';
  const cacheKey=variant.preview+':'+color+':'+eyeColor+':'+outfitColor;if(rendered.has(cacheKey))return rendered.get(cacheKey);
  const base=await KitExport.loadPreview(variant.preview);
  if(!KIT_HAIR.patches[variant.preview]?.[color]&&!KIT_EYES.patches[variant.preview]?.[eyeColor]?.[color]&&!KIT_OUTFIT.patches[variant.preview]?.[outfitColor]?.[color])return base;
  return serial(async()=>keep(cacheKey,(await apply('data:image/png;base64,'+base,variant.preview,color,false,current,eyeColor,outfitColor)).split(',')[1]));
 }
 function reference(filename,color,thumb=false,current,eyeColor='original',outfitColor='original'){
  const cacheKey=filename+':'+color+':'+thumb+':'+eyeColor+':'+outfitColor;if(rendered.has(cacheKey))return Promise.resolve(rendered.get(cacheKey));
  if(!KIT_HAIR.patches[filename]?.[color]&&!KIT_EYES.patches[filename]?.[eyeColor]?.[color]&&!KIT_OUTFIT.patches[filename]?.[outfitColor]?.[color])return Promise.resolve(filename);
  return serial(async()=>{
   if(current&&!current())throw Error('Superseded color request');
   let source=filename;
   if(location.protocol==='file:'){
    const id=filename.slice('references/'.length,-4);
    source='data:image/png;base64,'+await script('color_refs',id);
    try{return keep(cacheKey,await apply(source,filename,color,thumb,current,eyeColor,outfitColor));}finally{delete kitReferenceData[id];}
   }
   return keep(cacheKey,await apply(source,filename,color,thumb,current,eyeColor,outfitColor));
  });
 }
 return {preview,reference};
})();
