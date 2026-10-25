/* Common prompt color families; recolor only the approved fabric mask, not white trim or skin. */
window.OutfitPalette=(()=>{
 const added=[
  {id:'black',name:'黒',swatch:'#454650',prompt:'black'},
  {id:'white',name:'白',swatch:'#f5f3ef',prompt:'white'},
  {id:'grey',name:'グレー',swatch:'#92949e',prompt:'grey'},
  {id:'red',name:'赤',swatch:'#cf5963',prompt:'red'},
  {id:'yellow',name:'黄色',swatch:'#edcc58',prompt:'yellow'},
  {id:'green',name:'緑',swatch:'#66a878',prompt:'green'},
  {id:'purple',name:'紫',swatch:'#9a74bf',prompt:'purple'},
  {id:'brown',name:'茶色',swatch:'#9a7156',prompt:'brown'},
  {id:'orange',name:'オレンジ',swatch:'#e79854',prompt:'orange'},
  {id:'aqua',name:'水色',swatch:'#83cfde',prompt:'aqua'},
  {id:'navy',name:'紺',swatch:'#4d6089',prompt:'navy blue'},
  {id:'beige',name:'ベージュ',swatch:'#d9bf98',prompt:'beige'}
 ];
 KIT_OUTFIT.palette.push(...added);
 const colors=new Map(added.map(c=>[c.id,c])),cache=new Map(),pending=new Map();let sequence=1;
 const b64=a=>{let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s);};
 async function picture(id){
  let src=kitRuntimePartData[id];
  if(!src&&location.protocol==='file:'){
   await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='parts/'+id+'.js';s.onload=()=>{s.remove();resolve();};s.onerror=()=>{s.remove();reject(Error('Fabric source unavailable'));};document.head.appendChild(s);});
   src=kitPartData[id];delete kitPartData[id];
  }
  return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Fabric source unavailable'));im.src=src?'data:image/png;base64,'+src:'parts/'+id+(KIT_TWIN.webp?.[id]?'.webp':'.png');});
 }
 // Close tiny gaps in the approved color mask without bridging the white inset panels.
 function closeMask(input,w,h){
  const pass=(src,radius,horizontal,maximum)=>{const dst=new Uint8Array(src.length);for(let y=0;y<h;y++)for(let x=0;x<w;x++){let value=maximum?0:255;for(let k=-radius;k<=radius;k++){const xx=horizontal?Math.max(0,Math.min(w-1,x+k)):x,yy=horizontal?y:Math.max(0,Math.min(h-1,y+k)),v=src[yy*w+xx];value=maximum?Math.max(value,v):Math.min(value,v);}dst[y*w+x]=value;}return dst;};
  let result=input;for(const maximum of [true,false])for(const horizontal of [true,false])result=pass(result,3,horizontal,maximum);return result;
 }
 async function generate(entry,color,tune,token,pattern){
  const key=entry.blob+':'+token;
  if(cache.has(key)){const v=cache.get(key);cache.delete(key);cache.set(key,v);return;}
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   const source=KIT_TWIN.parts[entry.blob];if(!source)return;
   const blue=KIT_OUTFIT.layers[entry.blob]?.blue,pink=KIT_OUTFIT.layers[entry.blob]?.pink;
   if(!blue||!pink)throw Error('Missing approved fabric mask');
   const im=await picture(source.id),canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;
   const maskCanvas=document.createElement('canvas');maskCanvas.width=im.width;maskCanvas.height=im.height;const mc=maskCanvas.getContext('2d');
   const maskData=[];for(const paint of [blue,pink]){const part=KIT_TWIN.parts[paint.blob],image=await picture(part.id);mc.clearRect(0,0,im.width,im.height);mc.drawImage(image,part.x-source.x,part.y-source.y);maskData.push(mc.getImageData(0,0,im.width,im.height).data);image.src='';}maskCanvas.width=maskCanvas.height=0;
   try{
    const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);let image=ctx.getImageData(0,0,canvas.width,canvas.height),d=image.data;const original=d.slice();
    if(!colors.has(color.id)&&color.id!=='original'){const paint=KIT_OUTFIT.layers[entry.blob][color.id],part=KIT_TWIN.parts[paint.blob],selected=await picture(part.id);ctx.clearRect(0,0,canvas.width,canvas.height);ctx.drawImage(selected,part.x-source.x,part.y-source.y);selected.src='';image=ctx.getImageData(0,0,canvas.width,canvas.height);d=image.data;}
    const tint=[1,3,5].map(i=>parseInt(color.swatch.slice(i,i+2),16));
    const bluePixels=maskData[0],pinkPixels=maskData[1],mask=new Uint8Array(canvas.width*canvas.height);
    for(let p=0;p<mask.length;p++){const i=p*4;mask[p]=Math.min(255,Math.round(Math.max(Math.abs(bluePixels[i]-pinkPixels[i]),Math.abs(bluePixels[i+1]-pinkPixels[i+1]),Math.abs(bluePixels[i+2]-pinkPixels[i+2]))/14*255));}
    // The original pink cardigan contains pink flecks omitted by its old blue mask.
    if(entry.blob===KIT_CLOTHING.tops.cardigan.layer.blob)for(let p=0;p<mask.length;p++){const i=p*4;if(original[i]-original[i+1]>5&&original[i+2]-original[i+1]>3)mask[p]=255;}
    const filled=closeMask(mask,canvas.width,canvas.height);
    for(let i=0;i<d.length;i+=4){
     if(!d[i+3])continue;
     const weight=filled[i/4]/255*Math.max(0,Math.min(1,(Math.max(original[i],original[i+1],original[i+2])-80)/75));
     if(!weight)continue;
     if(colors.has(color.id)){const light=(bluePixels[i]+bluePixels[i+1]+bluePixels[i+2])/3,shade=Math.min(1,light/211),highlight=Math.max(0,(light-211)/44)*.55;
     for(let q=0;q<3;q++){const target=tint[q]*shade*(1-highlight)+255*highlight;d[i+q]=Math.round(d[i+q]+(target-d[i+q])*weight);}}
     ColorTune.pixel(d,i,tune,weight);
    }
    if(pattern.kind!=='none'){
     const hex=FabricPatterns.swatch(KIT_OUTFIT.palette.find(c=>c.id===pattern.color).swatch,pattern.tune),motif=FabricPatterns.raster(pattern.kind,hex,source,canvas.width,canvas.height,pattern);
     for(let i=0;i<d.length;i+=4){if(!d[i+3]||!motif[i+3])continue;const weight=motif[i+3]/255*.88*filled[i/4]/255*Math.max(0,Math.min(1,(Math.max(original[i],original[i+1],original[i+2])-80)/75));if(!weight)continue;const shade=Math.max(.45,Math.min(1.08,(bluePixels[i]+bluePixels[i+1]+bluePixels[i+2])/633));for(let q=0;q<3;q++)d[i+q]=Math.round(d[i+q]+(Math.min(255,motif[i+q]*shade)-d[i+q])*weight);}
    }
    ctx.putImageData(image,0,0);
    // Use the same premultiplied-alpha round trip as the displayed PNG for tuned PSD pixels.
    if(ColorTune.active(tune)||pattern.kind!=='none')d=ctx.getImageData(0,0,canvas.width,canvas.height).data;
    const blob='fc122'+(sequence++).toString(16).padStart(19,'0'),part=blob,pixels=canvas.width*canvas.height;
    const raw=Uint8Array.from(atob(entry.raw),c=>c.charCodeAt(0)),view=new DataView(raw.buffer),count=view.getUint16(16),chunks=[];
    if(count!==4)throw Error('Expected four fabric channels');
    for(let q=0;q<count;q++){
     const channel=view.getInt16(18+q*6),width=view.getInt32(12)-view.getInt32(4),height=view.getInt32(8)-view.getInt32(0),chunk=new Uint8Array(width*height+2);
     const ox=source.x-view.getInt32(4),oy=source.y-view.getInt32(0);
     for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)chunk[2+(y+oy)*width+x+ox]=d[(y*canvas.width+x)*4+(channel===-1?3:channel)];
     view.setUint32(20+q*6,chunk.length);chunks.push(chunk);
    }
    const bytes=new Uint8Array(chunks.reduce((n,a)=>n+a.length,0));let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
    kitLayerData[blob]=b64(pako.deflate(bytes));kitRuntimePartData[part]=canvas.toDataURL('image/png').split(',')[1];
    KIT_TWIN.parts[blob]={id:part,x:source.x,y:source.y};KIT_OUTFIT.layers[entry.blob][token]={blob,raw:b64(raw)};
    cache.set(key,{blob,part,source:entry.blob,color:token});
    while(cache.size>32){const first=cache.keys().next().value,v=cache.get(first);cache.delete(first);delete kitLayerData[v.blob];delete kitRuntimePartData[v.part];delete KIT_TWIN.parts[v.blob];delete KIT_OUTFIT.layers[v.source][v.color];}
   }finally{canvas.width=canvas.height=0;im.src='';}
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
 }
 async function prepare(v){
  if(v.outfitColorsApplied)return v;
  const topTune=ColorTune.forVariant(v,4),bottomTune=ColorTune.forVariant(v,5),top=v.outfitColor||'original',bottom=v.bottomColor||'original';
  const topPattern=FabricPatterns.forVariant(v),bottomPattern=FabricPatterns.forVariant(v,true);
  const token=(id,tune,pattern)=>(ColorTune.active(tune)?id+'__tune_'+tune.join('_'):id)+(pattern.kind!=='none'?'__fp_'+pattern.kind+'_'+pattern.color+(pattern.size!=='3'||pattern.weight!=='3'?'_s'+pattern.size+'w'+pattern.weight:'')+(ColorTune.active(pattern.tune)?'_pt_'+pattern.tune.join('_'):''):'');
  const topToken=token(top,topTune,topPattern),bottomToken=token(bottom,bottomTune,bottomPattern);
  for(const entry of KIT17.templates[v.template]){
   if(!entry.key.startsWith('outfit_')||!KIT_OUTFIT.layers[entry.blob])continue;
   const isBottom=entry.key==='outfit_bottom',id=isBottom?bottom:top,tune=isBottom?bottomTune:topTune,color=KIT_OUTFIT.palette.find(c=>c.id===id);
   if(color&&(colors.has(id)||ColorTune.active(tune)||(isBottom?bottomPattern:topPattern).kind!=='none'))await generate(entry,color,tune,isBottom?bottomToken:topToken,isBottom?bottomPattern:topPattern);
  }
  return topToken===top&&bottomToken===bottom?v:{...v,outfitColor:topToken,bottomColor:bottomToken,outfitColorsApplied:true};
 }
 const preview=ColorKit.preview,build=KitExport.build;
 ColorKit.preview=async(v,color,current)=>{const applied=await prepare(v);if(current&&!current())throw Error('Superseded character request');return preview(applied,color,current);};
 KitExport.build=async v=>build(await prepare(v));
 return {prepare,added};
})();
