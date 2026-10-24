/* Two-color hair masks use shared character coordinates across front/back layers.
   They change RGB only. Original hair silhouettes and single-color assets remain intact. */
window.HairPatterns=(()=>{
 const kinds=['none','tips','gradient','split'],cache=new Map(),pending=new Map(),sourceInfo=new Map();let sequence=1;
 window.normalizeHairPattern=value=>kinds.includes(value)?value:'none';
 const b64=a=>{let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s);};
 const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
 function weight(kind,x,y,bounds){
  const [l,t,r,b]=bounds,w=r-l,h=b-t,v=(y-t)/Math.max(h,1);
  // Reference: the part leans about 2.4 degrees rightward from crown to tips.
  if(kind==='split'){const splitX=KIT17.width/2+(y-KIT17.height*.303)*.0415;return smooth(splitX-2,splitX+2,x);}
  if(kind==='tips')return smooth(.72,.79,v);
  if(kind==='gradient')return smooth(.18,.95,v);
  return 0;
 }
 async function picture(part){
  let data=kitRuntimePartData[part.id];
  if(!data&&location.protocol==='file:'){
   await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='parts/'+part.id+'.js';s.onload=()=>{s.remove();resolve();};s.onerror=()=>{s.remove();reject(Error('Hair image unavailable'));};document.head.appendChild(s);});
   data=kitPartData[part.id];delete kitPartData[part.id];
  }
  return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Hair image unavailable'));im.src=data?'data:image/png;base64,'+data:'parts/'+part.id+(KIT_TWIN.webp?.[part.id]?'.webp':'.png');});
 }
 function canvas(w,h){const c=document.createElement('canvas');c.width=w;c.height=h;return c;}
 async function paint(entry,color,original){
  const descriptor=KIT_HAIR.layers[entry.blob]?.[color],part=KIT_TWIN.parts[descriptor?.blob||entry.blob],im=await picture(part),c=canvas(original.w,original.h);
  try{const ctx=c.getContext('2d');ctx.drawImage(im,part.x-original.x,part.y-original.y);return ctx.getImageData(0,0,c.width,c.height);}finally{c.width=c.height=0;im.src='';}
 }
 function register(entry,image,source,token){
  const blob='fc115'+(sequence++).toString(16).padStart(19,'0'),raw=Uint8Array.from(atob(entry.raw),c=>c.charCodeAt(0)),view=new DataView(raw.buffer);
  const w=view.getInt32(12)-view.getInt32(4),h=view.getInt32(8)-view.getInt32(0),chunks=[],d=image.data;
  const ox=source.x-view.getInt32(4),oy=source.y-view.getInt32(0);
  if(view.getUint16(16)!==4||ox<0||oy<0||ox+source.w>w||oy+source.h>h)throw Error('Hair channel bounds');
  for(let q=0;q<4;q++){
   const channel=view.getInt16(18+q*6),chunk=new Uint8Array(w*h+2);
   for(let y=0;y<source.h;y++)for(let x=0;x<source.w;x++)chunk[2+(y+oy)*w+x+ox]=d[(y*source.w+x)*4+(channel===-1?3:channel)];
   view.setUint32(20+q*6,chunk.length);chunks.push(chunk);
  }
  const bytes=new Uint8Array(chunks.reduce((n,a)=>n+a.length,0));let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  const c=canvas(source.w,source.h);try{c.getContext('2d').putImageData(image,0,0);kitRuntimePartData[blob]=c.toDataURL('image/png').split(',')[1];}finally{c.width=c.height=0;}
  kitLayerData[blob]=b64(pako.deflate(bytes));KIT_TWIN.parts[blob]={id:blob,x:source.x,y:source.y};
  KIT_HAIR.layers[entry.blob][token]={blob,raw:b64(raw)};
  return {blob,source:entry.blob,token};
 }
 async function generate(entry,source,kind,base,accent,bounds,token){
  const key=entry.blob+':'+token;
  if(cache.has(key)){const v=cache.get(key);cache.delete(key);cache.set(key,v);return;}
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   const image=await paint(entry,base,source),other=await paint(entry,accent,source),d=image.data;
   for(let y=0;y<source.h;y++)for(let x=0;x<source.w;x++){
    const i=(y*source.w+x)*4;if(!d[i+3])continue;
    const a=weight(kind,x+source.x,y+source.y,bounds);
    for(let q=0;q<3;q++)d[i+q]=Math.round(d[i+q]*(1-a)+other.data[i+q]*a);
   }
   cache.set(key,register(entry,image,source,token));
   while(cache.size>24){const first=cache.keys().next().value,v=cache.get(first);cache.delete(first);delete kitLayerData[v.blob];delete kitRuntimePartData[v.blob];delete KIT_TWIN.parts[v.blob];delete KIT_HAIR.layers[v.source][v.token];}
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
 }
 async function apply(v,color,current){
  const kind=normalizeHairPattern(v.hairPattern),accent=v.hairAccent||'pink';
  if(v.hairPatternApplied||kind==='none'||!kinds.includes(kind)||color===accent||!KIT_HAIR.palette.some(c=>c.id===color)||!KIT_HAIR.palette.some(c=>c.id===accent))return {variant:v,color};
  if(current&&!current())throw Error('Superseded character request');
  await HairPalette.prepare(v,color);await HairPalette.prepare(v,accent);
  const entries=KIT17.templates[v.template].filter(e=>KIT_HAIR.layers[e.blob]),sources=new Map();
  let l=KIT17.width,t=KIT17.height,r=0,b=0;
  for(const e of entries){
   if(sources.has(e.blob))continue;
   let source=sourceInfo.get(e.blob);
   if(!source){const part=KIT_TWIN.parts[e.blob];if(!part)continue;const im=await picture(part);source={x:part.x,y:part.y,w:im.width,h:im.height};im.src='';sourceInfo.set(e.blob,source);}
   sources.set(e.blob,source);l=Math.min(l,source.x);t=Math.min(t,source.y);r=Math.max(r,source.x+source.w);b=Math.max(b,source.y+source.h);
  }
  if(!sources.size)return {variant:v,color};
  const bounds=[l,t,r,b],token=['hp115',kind,color,accent,...bounds].join('_');
  for(const entry of entries){if(current&&!current())throw Error('Superseded character request');const source=sources.get(entry.blob);if(source)await generate(entry,source,kind,color,accent,bounds,token);}
  return {variant:{...v,hairColor:token,hairPatternApplied:true},color:token};
 }
 const preview=ColorKit.preview,build=KitExport.build;
 ColorKit.preview=async(v,color,current)=>{const a=await apply(v,color,current);return preview(a.variant,a.color,current);};
 KitExport.build=async v=>{const a=await apply(v,v.hairColor||'original');return build(a.variant);};
 return {kinds,weight,apply};
})();
