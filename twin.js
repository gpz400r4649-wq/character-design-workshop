/* Compose the new hairstyle from reusable local layers, also used by PSD export. */
window.kitPartData=Object.create(null);
(()=>{
 const legacy=window.ColorKit,images=new Map(),pending=new Map(),rendered=new Map();let queue=Promise.resolve();
 function check(current){if(current&&!current())throw Error('Superseded character request');}
 function keep(map,key,value,limit){map.delete(key);map.set(key,value);while(map.size>limit)map.delete(map.keys().next().value);return value;}
 function load(id){
  if(window.kitRuntimePartData?.[id])return Promise.resolve(kitRuntimePartData[id]);
  if(kitPartData[id])return Promise.resolve(kitPartData[id]);
  if(pending.has(id))return pending.get(id);
  if(!/^[a-f0-9]{24}$/.test(id))return Promise.reject(Error('Invalid character part'));
  const task=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src='parts/'+id+'.js';
   const timer=setTimeout(()=>{script.remove();reject(Error('Character part timeout'));},60000);
   script.onload=()=>{clearTimeout(timer);script.remove();kitPartData[id]?resolve(kitPartData[id]):reject(Error('Missing character part'));};
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(Error('Character part unavailable'));};
   document.head.appendChild(script);
  }).finally(()=>pending.delete(id));pending.set(id,task);return task;
 }
 async function image(id,current){
  check(current);
  if(images.has(id)){const value=images.get(id);return keep(images,id,value,12);}
  const src=window.kitRuntimePartData?.[id]?'data:image/png;base64,'+kitRuntimePartData[id]:location.protocol==='file:'?'data:image/png;base64,'+await load(id):'parts/'+id+(KIT_TWIN.webp?.[id]?'.webp':'.png');
  try{return keep(images,id,await new Promise((resolve,reject)=>{const im=new Image(),signal=current?.signal;let timer;
    const cleanup=()=>{clearTimeout(timer);signal?.removeEventListener('abort',abort);im.onload=im.onerror=null;};
    const abort=()=>{cleanup();im.src='';reject(Error('Superseded character request'));};
    im.onload=()=>{cleanup();resolve(im);};im.onerror=()=>{cleanup();reject(Error('Invalid character image'));};
    signal?.addEventListener('abort',abort,{once:true});
    timer=setTimeout(()=>{cleanup();im.src='';reject(Error('Character image timeout'));},180000);
    if(signal?.aborted){abort();return;}im.src=src;}),12);}
  finally{delete kitPartData[id];}
 }
 async function render(variant,color,thumb,current){
  check(current);
  const eye=variant.eyeColor||'original',outfit=variant.outfitColor||'original',bottom=variant.bottomColor||'original';
  const key=variant.template+':'+variant.visible.join('')+':'+color+':'+eye+':'+outfit+':'+bottom+':'+thumb+':'+!!variant.transparent;
  if(rendered.has(key))return rendered.get(key);
  const canvas=document.createElement('canvas');canvas.width=thumb?1024:KIT17.width;canvas.height=thumb?1536:KIT17.height;
  const ctx=canvas.getContext('2d'),scale=canvas.width/KIT17.width;
  if(!variant.transparent){ctx.fillStyle='white';ctx.fillRect(0,0,canvas.width,canvas.height);}ctx.scale(scale,scale);
  try{
   const stack=KIT17.templates[variant.template];
   for(let i=stack.length-1;i>=0;i--){
    if(!variant.visible[i]||stack[i].key==='paper')continue;
    const entry=stack[i],paint=KIT_HAIR.layers[entry.blob]?.[color]||KIT_EYES.layers[entry.blob]?.[eye]||KIT_OUTFIT.layers[entry.blob]?.[entry.key==='outfit_bottom'?bottom:outfit];
    const part=KIT_TWIN.parts[paint?paint.blob:entry.blob];if(part===null)continue;if(!part)throw Error('Missing character layer');
    const im=await image(part.id,current);check(current);ctx.drawImage(im,part.x,part.y);
   }
   check(current);return keep(rendered,key,canvas.toDataURL('image/png').split(',')[1],6);
  }finally{canvas.width=canvas.height=0;}
 }
 function serial(fn){const result=queue.then(fn);queue=result.catch(()=>{});return result;}
 window.ColorKit={
  preview(variant,color,current){return variant.dynamic?serial(()=>render(variant,color,false,current)):legacy.preview(variant,color,current);},
  reference(filename,color,thumb=false,current,eyeColor='original',outfitColor='original'){
   const refKey=filename.startsWith('references/')&&filename.endsWith('.png')?filename.slice(11,-4):'';
   const registered=KIT17.variants['create_'+refKey];
   if(!registered?.dynamic)return legacy.reference(filename,color,thumb,current,eyeColor,outfitColor);
   const variant={...registered,eyeColor,outfitColor};
   return serial(async()=>'data:image/png;base64,'+await render(variant,color,thumb,current));
  }
 };
})();
