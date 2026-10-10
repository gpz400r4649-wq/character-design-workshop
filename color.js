/* Exact, precomputed hair-only replacement patches; no remote processing. */
window.kitColorPatches=Object.create(null);
window.kitReferenceData=Object.create(null);
window.ColorKit=(()=>{
 const pending=new Map(),rendered=new Map();let queue=Promise.resolve();
 function keep(key,value){rendered.delete(key);rendered.set(key,value);while(rendered.size>8)rendered.delete(rendered.keys().next().value);return value;}
 function serial(fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}
 function script(kind,id){
  const store=kind==='colors'?kitColorPatches:kitReferenceData;
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
 async function apply(base,key,color,thumb,current){
  if(current&&!current())throw Error('Superseded color request');
  const patch=KIT_HAIR.patches[key]?.[color];
  if(!patch)return base;
  const overlaySource=location.protocol==='file:'?'data:image/png;base64,'+await script('colors',patch.id):'colors/'+patch.id+'.png';
  const canvas=document.createElement('canvas');canvas.width=KIT17.width;canvas.height=KIT17.height;
  const context=canvas.getContext('2d');let original,overlay;
  try{
   original=await image(base);overlay=await image(overlaySource);
   if(current&&!current())throw Error('Superseded color request');
   context.drawImage(original,0,0);context.drawImage(overlay,patch.x,patch.y);
   if(thumb){
    const small=document.createElement('canvas');small.width=300;small.height=450;
    small.getContext('2d').drawImage(canvas,0,0,300,450);
    const result=small.toDataURL('image/png');small.width=small.height=0;return result;
   }
   return canvas.toDataURL('image/png');
  }finally{
   canvas.width=canvas.height=0;
   if(original)original.src='';if(overlay)overlay.src='';
   delete kitColorPatches[patch.id];
  }
 }
 async function preview(variant,color,current){
  const cacheKey=variant.preview+':'+color;if(rendered.has(cacheKey))return rendered.get(cacheKey);
  const base=await KitExport.loadPreview(variant.preview);
  if(color==='original'||!KIT_HAIR.patches[variant.preview]?.[color])return base;
  return serial(async()=>keep(cacheKey,(await apply('data:image/png;base64,'+base,variant.preview,color,false,current)).split(',')[1]));
 }
 function reference(filename,color,thumb=false,current){
  const cacheKey=filename+':'+color+':'+thumb;if(rendered.has(cacheKey))return Promise.resolve(rendered.get(cacheKey));
  if(color==='original'||!KIT_HAIR.patches[filename]?.[color])return Promise.resolve(filename);
  return serial(async()=>{
   if(current&&!current())throw Error('Superseded color request');
   let source=filename;
   if(location.protocol==='file:'){
    const id=filename.slice('references/'.length,-4);
    source='data:image/png;base64,'+await script('color_refs',id);
    try{return keep(cacheKey,await apply(source,filename,color,thumb,current));}finally{delete kitReferenceData[id];}
   }
   return keep(cacheKey,await apply(source,filename,color,thumb,current));
  });
 }
 return {preview,reference};
})();
