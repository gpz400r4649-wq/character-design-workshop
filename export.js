/* Local-only layer loader and PSD writer. No fetch, server or upload. */
window.kitLayerData=Object.create(null);
window.kitPreviewData=Object.create(null);
window.KitExport=(()=>{
 const pending=new Map(),previewOrder=[];
 function bytes(text){const raw=atob(text),out=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);return out;}
 function concat(parts){const result=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;for(const p of parts){result.set(p,at);at+=p.length;}return result;}
 function number(n,size=4){const a=new Uint8Array(size),v=new DataView(a.buffer);if(size===2)v.setUint16(0,n);else v.setUint32(0,n);return a;}
 function load(kind,id){
  const store=kind==='layers'?window.kitLayerData:window.kitPreviewData;
  if(store[id])return Promise.resolve(store[id]);
  if(!/^[a-f0-9]{24}$/.test(id))return Promise.reject(new Error('Invalid local asset'));
  const key=kind+'/'+id;
  if(pending.has(key))return pending.get(key);
  const promise=new Promise((resolve,reject)=>{
   const script=document.createElement('script');script.src=key+'.js';
   const timer=setTimeout(()=>{script.remove();reject(new Error('Local file timeout'));},30000);
   script.onload=()=>{clearTimeout(timer);script.remove();store[id]?resolve(store[id]):reject(new Error('Missing local data'));};
   script.onerror=()=>{clearTimeout(timer);script.remove();reject(new Error('Local file unavailable'));};
   document.head.appendChild(script);
  }).finally(()=>pending.delete(key));pending.set(key,promise);return promise;
 }
 async function loadPreviewPNG(id){
  if(!/^[a-f0-9]{24}$/.test(id))throw new Error('Invalid preview asset');
  if(window.kitPreviewData[id])return window.kitPreviewData[id];
  const key='views/'+id;
  if(pending.has(key))return pending.get(key);
  const promise=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),60000);
   try{
    const response=await fetch(key+'.png',{signal:controller.signal});
    if(!response.ok)throw new Error('Preview unavailable: '+response.status);
    const data=new Uint8Array(await response.arrayBuffer());
    let binary='';
    for(let i=0;i<data.length;i+=32768)binary+=String.fromCharCode(...data.subarray(i,i+32768));
    const result=btoa(binary);window.kitPreviewData[id]=result;return result;
   }finally{clearTimeout(timer);}
  })().finally(()=>pending.delete(key));
  pending.set(key,promise);return promise;
 }
 async function loadPreview(id){
  const result=await loadPreviewPNG(id);
  const index=previewOrder.indexOf(id);if(index>=0)previewOrder.splice(index,1);previewOrder.push(id);
  while(previewOrder.length>6)delete window.kitPreviewData[previewOrder.shift()];
  return result;
 }
 // Decode the local RGB8, non-interlaced PNGs without a canvas or file-origin reads.
 function pngRGB(base64){
  const png=bytes(base64),v=new DataView(png.buffer),idat=[];let p=8,w=0,h=0,components=3;
  while(p<png.length){
   const n=v.getUint32(p),type=String.fromCharCode(...png.subarray(p+4,p+8));
   if(type==='IHDR'){
    w=v.getUint32(p+8);h=v.getUint32(p+12);
    components=png[p+17]===6?4:3;
    if(png[p+16]!==8||![2,6].includes(png[p+17])||png[p+20]!==0)throw new Error('Unsupported local PNG');
   }else if(type==='IDAT')idat.push(png.subarray(p+8,p+8+n));
   p+=12+n;
  }
  const stride=w*components,filtered=pako.inflate(concat(idat)),rgb=new Uint8Array(w*h*components);let input=0;
  if(filtered.length!==(stride+1)*h)throw new Error('PNG dimensions');
  function paeth(a,b,c){const x=a+b-c,da=Math.abs(x-a),db=Math.abs(x-b),dc=Math.abs(x-c);return da<=db&&da<=dc?a:db<=dc?b:c;}
  for(let y=0;y<h;y++){
   const filter=filtered[input++],offset=y*stride;
   for(let x=0;x<stride;x++){
    const a=x>=components?rgb[offset+x-components]:0,b=y?rgb[offset+x-stride]:0,c=y&&x>=components?rgb[offset+x-stride-components]:0;
    let prediction=0;
    if(filter===1)prediction=a;else if(filter===2)prediction=b;else if(filter===3)prediction=(a+b)>>1;else if(filter===4)prediction=paeth(a,b,c);else if(filter!==0)throw new Error('PNG filter');
    rgb[offset+x]=(filtered[input++]+prediction)&255;
   }
  }
  if(components===3)return {w,h,rgb};
  const opaque=new Uint8Array(w*h*3);for(let i=0;i<w*h;i++)opaque.set(rgb.subarray(i*4,i*4+3),i*3);
  return {w,h,rgb:opaque};
 }
 async function build(variant){
  const color=variant.hairColor||'original';
  const source=KIT17.templates[variant.template],ordered=source.map((entry,i)=>{const paint=KIT_HAIR.layers[entry.blob]?.[color];return {...entry,blob:paint?paint.blob:entry.blob,coloredRaw:paint?.raw,visible:variant.visible[i]};}).reverse();
  const loaded=await Promise.all(ordered.map(x=>load('layers',x.blob)));
  const records=[],channels=[];
  for(let i=0;i<ordered.length;i++){
   const raw=bytes(ordered[i].raw),nc=new DataView(raw.buffer).getUint16(16),flag=18+6*nc+10;
   if(ordered[i].coloredRaw){const paint=bytes(ordered[i].coloredRaw);for(let c=0;c<nc;c++)raw.set(paint.subarray(20+6*c,24+6*c),20+6*c);}
   raw[flag]=ordered[i].visible?(raw[flag]&~2):(raw[flag]|2);
   records.push(raw);channels.push(pako.inflate(bytes(loaded[i])));
  }
  let layerInfo=concat([number(ordered.length,2),...records,...channels]);
  if(layerInfo.length&1)layerInfo=concat([layerInfo,new Uint8Array(1)]);
  const section=concat([number(layerInfo.length),layerInfo,number(0)]);
  const image=pngRGB(await ColorKit.preview(variant,color));
  if(image.w!==KIT17.width||image.h!==KIT17.height)throw new Error('Export dimensions');
  const planar=new Uint8Array(image.rgb.length),pixels=image.w*image.h;
  for(let i=0;i<pixels;i++)for(let c=0;c<3;c++)planar[c*pixels+i]=image.rgb[i*3+c];
  const header=concat([new Uint8Array([56,66,80,83]),number(1,2),new Uint8Array(6),number(3,2),number(image.h),number(image.w),number(8,2),number(3,2)]);
  return new Blob([header,number(0),number(0),number(section.length),section,number(0,2),planar],{type:'image/vnd.adobe.photoshop'});
 }
 return {loadPreview,build,pngRGB};
})();
