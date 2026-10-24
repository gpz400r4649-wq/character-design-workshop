/* Additional single hair colors. Original six assets remain untouched.
   Generate only selected hair layers locally; PNG and PSD share the same pixels. */
window.HairPalette=(()=>{
 const added=[{"id":"dark_brown","name":"こげ茶","swatch":"#654737"},{"id":"light_brown","name":"明るい茶","swatch":"#c59a73"},{"id":"blonde","name":"金髪","swatch":"#efcf6c"},{"id":"white","name":"白","swatch":"#eeedf2"},{"id":"silver","name":"シルバー","swatch":"#bdc5d5"},{"id":"grey","name":"グレー","swatch":"#8c8d99"},{"id":"red","name":"赤","swatch":"#c85d63"},{"id":"orange","name":"オレンジ","swatch":"#e99b61"},{"id":"purple","name":"むらさき","swatch":"#9b77c7"},{"id":"blue","name":"青","swatch":"#709cda"},{"id":"aqua","name":"水色","swatch":"#8fd2e5"},{"id":"navy","name":"紺","swatch":"#4f638b"},{"id":"green","name":"緑","swatch":"#71a77e"},{"id":"mint","name":"ミント","swatch":"#9cd5bc"}];
 KIT_HAIR.palette.push(...added);
 const colors=new Map(added.map(c=>[c.id,c])),cache=new Map(),pending=new Map();let sequence=1;
 const b64=a=>{let s='';for(let i=0;i<a.length;i+=32768)s+=String.fromCharCode(...a.subarray(i,i+32768));return btoa(s);};
 async function picture(id){
  let src=kitRuntimePartData[id];
  if(!src&&location.protocol==='file:'){
   await new Promise((resolve,reject)=>{const s=document.createElement('script');s.src='parts/'+id+'.js';s.onload=()=>{s.remove();resolve();};s.onerror=()=>{s.remove();reject(Error('Hair source unavailable'));};document.head.appendChild(s);});
   src=kitPartData[id];delete kitPartData[id];
  }
  return new Promise((resolve,reject)=>{const im=new Image();im.onload=()=>resolve(im);im.onerror=()=>reject(Error('Hair source unavailable'));im.src=src?'data:image/png;base64,'+src:'parts/'+id+(KIT_TWIN.webp?.[id]?'.webp':'.png');});
 }
 async function generate(entry,color){
  const key=entry.blob+':'+color.id;
  if(cache.has(key)){const v=cache.get(key);cache.delete(key);cache.set(key,v);return;}
  if(pending.has(key))return pending.get(key);
  const task=(async()=>{
   const source=KIT_TWIN.parts[entry.blob];if(!source)return;
   const im=await picture(source.id),canvas=document.createElement('canvas');canvas.width=im.width;canvas.height=im.height;
   try{
    const ctx=canvas.getContext('2d');ctx.drawImage(im,0,0);const image=ctx.getImageData(0,0,canvas.width,canvas.height),d=image.data;
    const tint=[1,3,5].map(i=>parseInt(color.swatch.slice(i,i+2),16));
    for(let i=0;i<d.length;i+=4){
     const light=(d[i]+d[i+1]+d[i+2])/3,low=Math.pow(Math.min(light/235,1),1.15),high=Math.pow(Math.max(0,(light-235)/20),1.4)*.22;
     for(let q=0;q<3;q++)d[i+q]=Math.max(0,Math.min(255,Math.round(low*tint[q]*(1-high)+245*high+(d[i+q]-light)*.28)));
    }
    ctx.putImageData(image,0,0);
    const blob='fc114'+(sequence++).toString(16).padStart(19,'0'),part=blob,pixels=canvas.width*canvas.height;
    const raw=Uint8Array.from(atob(entry.raw),c=>c.charCodeAt(0)),view=new DataView(raw.buffer),count=view.getUint16(16),chunks=[];
    if(count!==4)throw Error('Expected four hair channels');
    for(let q=0;q<count;q++){
     const channel=view.getInt16(18+q*6),width=view.getInt32(12)-view.getInt32(4),height=view.getInt32(8)-view.getInt32(0),chunk=new Uint8Array(width*height+2);
     const ox=source.x-view.getInt32(4),oy=source.y-view.getInt32(0);
     for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)chunk[2+(y+oy)*width+x+ox]=d[(y*canvas.width+x)*4+(channel===-1?3:channel)];
     view.setUint32(20+q*6,chunk.length);chunks.push(chunk);
    }
    const bytes=new Uint8Array(chunks.reduce((n,a)=>n+a.length,0));let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
    kitLayerData[blob]=b64(pako.deflate(bytes));kitRuntimePartData[part]=canvas.toDataURL('image/png').split(',')[1];
    KIT_TWIN.parts[blob]={id:part,x:source.x,y:source.y};KIT_HAIR.layers[entry.blob][color.id]={blob,raw:b64(raw)};
    cache.set(key,{blob,part,source:entry.blob,color:color.id});
    while(cache.size>24){const first=cache.keys().next().value,v=cache.get(first);cache.delete(first);delete kitLayerData[v.blob];delete kitRuntimePartData[v.part];delete KIT_TWIN.parts[v.blob];delete KIT_HAIR.layers[v.source][v.color];}
   }finally{canvas.width=canvas.height=0;im.src='';}
  })().finally(()=>pending.delete(key));pending.set(key,task);return task;
 }
 async function prepare(v,color){
  const c=colors.get(color);if(!c)return;
  for(const entry of KIT17.templates[v.template])if(KIT_HAIR.layers[entry.blob])await generate(entry,c);
 }
 const preview=ColorKit.preview,build=KitExport.build;
 ColorKit.preview=async(v,color,current)=>{await prepare(v,color);if(current&&!current())throw Error('Superseded character request');return preview(v,color,current);};
 KitExport.build=async v=>{await prepare(v,v.hairColor);return build(v);};
 return {prepare,added};
})();
