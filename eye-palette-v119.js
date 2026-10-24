/* More iris colors and independently colored screen-left/right eyes.
   The approved blue recolor defines the iris mask; skin, pupils, highlights and alpha stay intact. */
window.EyeColorKit=(()=>{
 const added=[
  {id:'black',name:'くろ',swatch:'#34303b'},{id:'brown',name:'茶色',swatch:'#986b50'},
  {id:'red',name:'赤',swatch:'#c85d65'},{id:'yellow',name:'黄',swatch:'#e2c452'},
  {id:'pink',name:'ピンク',swatch:'#e39cbd'},{id:'grey',name:'グレー',swatch:'#8b8991'},
  {id:'orange',name:'オレンジ',swatch:'#de9656'},{id:'aqua',name:'水色',swatch:'#78cad5'},
  {id:'white',name:'白',swatch:'#ecedf2'},{id:'silver',name:'シルバー',swatch:'#adb8cb'}
 ];
 KIT_EYES.palette.push(...added);
 const colors=new Map(added.map(c=>[c.id,c])),cache=new Map(),pending=new Map(),images=new Map(),irisMasks=new Map();let sequence=1;
 window.normalizeEyeMode=value=>value==='odd'?'odd':'same';
 const b64=a=>{let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s);};
 function hsv(r,g,b){r/=255;g/=255;b/=255;const max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;return [d?((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)+6)%6/6:0,max?d/max:0,max];}
 function rgb(h,s,v){const i=Math.floor(h*6),f=h*6-i,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);return [[v,t,p],[q,v,p],[p,v,t],[p,q,v],[t,p,v],[v,p,q]][i%6].map(x=>x*255);}
 async function picture(part){
  if(images.has(part.id)){const im=images.get(part.id);images.delete(part.id);images.set(part.id,im);return im;}
  let data=kitRuntimePartData[part.id];
  if(!data&&location.protocol==='file:'){
   await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='parts/'+part.id+'.js';s.onload=()=>{s.remove();resolve();};s.onerror=()=>{s.remove();reject(Error('Eye image unavailable'));};document.head.appendChild(s);});
   data=kitPartData[part.id];delete kitPartData[part.id];
  }
  const im=await new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Eye image unavailable'));im.src=data?'data:image/png;base64,'+data:'parts/'+part.id+(KIT_TWIN.webp?.[part.id]?'.webp':'.png');});
  images.set(part.id,im);while(images.size>24)images.delete(images.keys().next().value);return im;
 }
 async function pixels(blob,frame){
  const p=KIT_TWIN.parts[blob],im=await picture(p),c=document.createElement('canvas');c.width=frame.w;c.height=frame.h;
  try{const ctx=c.getContext('2d');ctx.drawImage(im,p.x-frame.x,p.y-frame.y);return ctx.getImageData(0,0,c.width,c.height);}finally{c.width=c.height=0;}
 }
 function irisSupport(source,original,blue,frame){
  if(source.blob!==KIT_EYE_STYLES.round_slim.layer.blob)return null;
  const key=[source.blob,frame.x,frame.y,frame.w,frame.h].join(':');if(irisMasks.has(key))return irisMasks.get(key);
  // Follow the lower edge of each approved curved lid, excluding the lashes above it.
  const result=new Uint8Array(frame.w*frame.h);
  for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++){
   const gx=x+frame.x,gy=y+frame.y,lid=gx<KIT17.width/2?584+.006*(gx-895)**2:554+.0065*(gx-1148)**2;
   result[y*frame.w+x]=gy>=lid&&original[(y*frame.w+x)*4+3]>=250?1:0;
  }
  irisMasks.set(key,result);return result;
 }
 function register(entry,image,frame){
  const blob='ec119'+(sequence++).toString(16).padStart(19,'0'),raw=Uint8Array.from(atob(entry.raw),c=>c.charCodeAt(0)),view=new DataView(raw.buffer),chunks=[];
  const w=view.getInt32(12)-view.getInt32(4),h=view.getInt32(8)-view.getInt32(0),ox=frame.x-view.getInt32(4),oy=frame.y-view.getInt32(0),d=image.data;
  if(view.getUint16(16)!==4||ox<0||oy<0||ox+frame.w>w||oy+frame.h>h)throw Error('Eye channel bounds');
  for(let q=0;q<4;q++){
   const channel=view.getInt16(18+q*6),chunk=new Uint8Array(w*h+2);
   for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++)chunk[2+(y+oy)*w+x+ox]=d[(y*frame.w+x)*4+(channel===-1?3:channel)];
   view.setUint32(20+q*6,chunk.length);chunks.push(chunk);
  }
  const bytes=new Uint8Array(chunks.reduce((n,a)=>n+a.length,0));let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
  const canvas=document.createElement('canvas');canvas.width=frame.w;canvas.height=frame.h;
  try{canvas.getContext('2d').putImageData(image,0,0);kitRuntimePartData[blob]=canvas.toDataURL('image/png').split(',')[1];}finally{canvas.width=canvas.height=0;}
  kitLayerData[blob]=b64(pako.deflate(bytes));KIT_TWIN.parts[blob]={id:blob,x:frame.x,y:frame.y};
  return {...entry,blob,raw:b64(raw)};
 }
 async function generate(source,skin,left,right){
  const key=[source.blob,skin.blob,left,right].join(':');
  if(cache.has(key)){const value=cache.get(key);cache.delete(key);cache.set(key,value);return value;}
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   const p=KIT_TWIN.parts[skin.blob],im=await picture(p),frame={x:p.x,y:p.y,w:im.width,h:im.height};
   const base=await pixels(skin.blob,frame),original=await pixels(source.blob,frame),blue=await pixels(KIT_EYES.layers[source.blob].blue.blob,frame);
   const paints={};for(const id of new Set([left,right]))if(!colors.has(id))paints[id]=id==='original'?original:await pixels(KIT_EYES.layers[source.blob][id].blob,frame);
   const blueHue=hsv(103,154,199)[0],tints={};for(const id of [left,right])if(colors.has(id))tints[id]=hsv(...[1,3,5].map(i=>parseInt(colors.get(id).swatch.slice(i,i+2),16)));
   const d=base.data,o=original.data,b=blue.data,support=irisSupport(source,o,b,frame);
   for(let y=0;y<frame.h;y++)for(let x=0;x<frame.w;x++){
    const j=(y*frame.w+x)*4;if(!o[j+3]||(support&&!support[y*frame.w+x]))continue;
    const id=x+frame.x<KIT17.width/2?left:right;
    if(paints[id]){for(let q=0;q<3;q++)d[j+q]=Math.max(0,Math.min(255,d[j+q]+paints[id].data[j+q]-o[j+q]));continue;}
    if(o[j]===b[j]&&o[j+1]===b[j+1]&&o[j+2]===b[j+2])continue;
    const [,sat,value]=hsv(o[j],o[j+1],o[j+2]),fullBlue=rgb(blueHue,sat,value);let dot=0,norm=0;
    for(let q=0;q<3;q++){const delta=fullBlue[q]-o[j+q];dot+=(b[j+q]-o[j+q])*delta;norm+=delta*delta;}
    const weight=Math.max(0,Math.min(1,norm?dot/norm:0)),[h,s,v]=tints[id];
    const saturation=s<.18?sat*s:Math.min(.95,sat*s/.45),brightness=s<.18||id==='black'?Math.min(.97,value*v/.68):Math.min(.97,value*(.85+.15*v));
    const shifted=rgb(h,saturation,brightness);
    for(let q=0;q<3;q++)d[j+q]=Math.max(0,Math.min(255,Math.round(d[j+q]+(shifted[q]-o[j+q])*weight)));
   }
   const entry=register(skin,base,frame);cache.set(key,entry);
   while(cache.size>24){const first=cache.keys().next().value,e=cache.get(first);cache.delete(first);delete kitLayerData[e.blob];delete kitRuntimePartData[e.blob];delete KIT_TWIN.parts[e.blob];}
   return entry;
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
 }
 async function apply(v,current){
  if(v.eyeColorsApplied)return v;
  const left=v.eyeColor||'original',right=normalizeEyeMode(v.eyeMode)==='odd'?(v.eyeRightColor||'blue'):left;
  if(!KIT_EYES.palette.some(c=>c.id===left)||!KIT_EYES.palette.some(c=>c.id===right))return v;
  if(left===right&&!colors.has(left))return {...v,eyeColor:left};
  const source=KIT17.templates[v.template].find(e=>e.key==='eyes');if(!source||!KIT_EYES.layers[source.blob]?.blue)return v;
  const applied=SkinKit.apply({...v,eyeColor:'original'}),stack=KIT17.templates[applied.template],skin=stack.find(e=>e.key==='eyes');
  if(current&&!current())throw Error('Superseded character request');
  const painted=await generate(source,skin,left,right),template=applied.template+'_eye119_'+painted.blob;
  KIT17.templates[template]=stack.map(e=>e.key==='eyes'?{...painted}:e);
  return {...applied,template,eyeColor:'original',skinApplied:true,eyeColorsApplied:true};
 }
 const preview=ColorKit.preview,build=KitExport.build;
 ColorKit.preview=async(v,color,current)=>preview(await apply(v,current),color,current);
 KitExport.build=async v=>build(await apply(v));
 return {added,apply,modes:['same','odd']};
})();
