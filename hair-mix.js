/* Compose independent front/back choices; never create a file per combination. */
window.kitRuntimePartData=Object.create(null);
window.HairMix=(()=>{
 const legacy={...ColorKit},exportBuild=KitExport.build,prepared=new Map();let serial=Promise.resolve(),sequence=1;
 const W=KIT17.width,H=KIT17.height;
 function valid(front,back){if(!KIT_MIX.front[front]||!KIT_MIX.back[back])throw Error('Unknown hair choice');}
 function variant(activity,front,back,outfit,view='normal',grid=false){
  valid(front,back);
  const basis=KIT_MIX.front[front].baseStyle||'twin',key=`${activity}_${basis}_${outfit}_${view}${grid?'_grid':''}`;
  const original=KIT17.variants[key];if(!original)throw Error('Missing drawing mode '+key);
  const source=KIT17.templates[original.template],stack=[],visible=[];
  const fronts=KIT_MIX.front[front].layers,backs=KIT_MIX.back[back].layers;
  const hairOn=!['hair_all','copy','color'].includes(activity)&&view!=='lineart'&&view!=='silhouette';
  let addedFront=false,addedBack=false;
  function insert(list,on){for(const item of list){stack.push({...item});visible.push(on);}}
  for(let i=0;i<source.length;i++){
   const entry=source[i];
   const guideKind=view==='space'?'hatch':view==='silhouette'?'silhouette':view==='lineart'?'lineart':null;
   // Hidden guides from the old complete hairstyle would be misleading in a mixed PSD.
   if(['lineart','silhouette','hatch'].includes(entry.key)&&entry.key!==guideKind)continue;
   if(entry.key.startsWith('front_')||entry.key.startsWith('cap_')){
    if(!addedFront){insert(fronts,hairOn);addedFront=true;}continue;
   }
   if(entry.key.startsWith('back_')){
    if(!addedBack){insert(backs,hairOn);addedBack=true;}continue;
   }
   stack.push({...entry});visible.push(original.visible[i]);
  }
  // Copy mode intentionally has no body or hair; its guides are prepared below.
  const template=`mix_${activity}_${front}__${back}_${outfit}_${view}${grid?'_grid':''}`;
  KIT17.templates[template]=stack;
  return {...original,template,visible,dynamic:true,mix:{activity,front,back,outfit,view,grid},filename:`${activity}_${front}__${back}_${outfit}_${view}${grid?'_grid':''}_v48.psd`};
 }
 const b64=bytes=>{let text='';for(let i=0;i<bytes.length;i+=32768)text+=String.fromCharCode(...bytes.subarray(i,i+32768));return btoa(text);};
 function runtimeLayer(key,name,canvas){
  const pixels=W*H,size=pixels+2;
  const blob=(sequence++).toString(16).padStart(24,'0'),part=(sequence++).toString(16).padStart(24,'0');
  const uni=new Uint8Array(name.length*2);const uv=new DataView(uni.buffer);for(let i=0;i<name.length;i++)uv.setUint16(i*2,name.charCodeAt(i));
  const payload=4+uni.length,extraLength=8+4+8+4+payload+(payload%2),raw=new Uint8Array(58+extraLength),dv=new DataView(raw.buffer);
  dv.setInt32(8,H);dv.setInt32(12,W);dv.setUint16(16,4);
  for(let c=0;c<4;c++){dv.setInt16(18+c*6,c===3?-1:c);dv.setUint32(20+c*6,size);}
  raw.set([56,66,73,77,110,111,114,109,255,0,0,0],42);dv.setUint32(54,extraLength);
  const e=58;raw[e+8]=1;raw[e+9]=63;raw.set([56,66,73,77,108,117,110,105],e+12);dv.setUint32(e+20,payload);dv.setUint32(e+24,name.length);raw.set(uni,e+28);
  KIT_TWIN.parts[blob]={id:part,x:0,y:0};kitRuntimePartData[part]=canvas.toDataURL('image/png').split(',')[1];
  return {key,name,blob,raw:b64(raw),visible:true,runtimePart:part};
 }
 async function picture(v,transparent=false){return new Promise(async(resolve,reject)=>{try{const data=await legacy.preview({...v,transparent},'original');const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='data:image/png;base64,'+data;}catch(e){reject(e);}});}
 function canvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c;}
 async function makeGuide(v,current){
  const m=v.mix,kind=m.view==='space'?'hatch':m.view==='silhouette'?'silhouette':'lineart';
  const base=variant(kind==='lineart'&&m.activity!=='color'?m.activity:'create',m.front,m.back,m.outfit,'normal',false);
  const image=await picture(base,kind!=='lineart');if(current&&!current())throw Error('Superseded');const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  const source=ctx.getImageData(0,0,W,H),output=ctx.createImageData(W,H),d=output.data,s=source.data;
  if(kind==='lineart'){
   const blurred=canvas(),bc=blurred.getContext('2d');bc.filter='blur(3.2px)';bc.drawImage(image,0,0);const b=bc.getImageData(0,0,W,H).data;
   for(let i=0;i<W*H;i++){const j=i*4,g=.299*s[j]+.587*s[j+1]+.114*s[j+2],bg=.299*b[j]+.587*b[j+1]+.114*b[j+2];d[j]=49;d[j+1]=42;d[j+2]=51;d[j+3]=Math.max(0,Math.min(255,(bg-g-3.5)*13));}
   blurred.width=blurred.height=0;
  }else for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=(y*W+x)*4;d[j]=kind==='hatch'?122:255;d[j+1]=kind==='hatch'?124:255;d[j+2]=kind==='hatch'?145:255;d[j+3]=kind==='hatch'?((x+y)%52<4?(255-s[j+3])*65/255:0):s[j+3];}
  ctx.putImageData(output,0,0);const layer=runtimeLayer(kind,kind==='hatch'?'しゃせん・くみあわせ':kind==='silhouette'?'しろぬき・くみあわせ':'せんが・くみあわせ',c);c.width=c.height=0;return layer;
 }
 async function prepare(v,current){
  if(current&&!current())throw Error('Superseded');
  if(!v.mix||v.mix.view==='normal')return;
  const key=v.template;
  let layer=prepared.get(key);
  if(!layer){layer=await makeGuide(v,current);prepared.set(key,layer);}
  else{prepared.delete(key);prepared.set(key,layer);}
  const stack=KIT17.templates[key];for(let i=0;i<stack.length;i++)if(stack[i].key===layer.key)stack[i]={...layer};
  while(prepared.size>6){const [old,item]=prepared.entries().next().value;prepared.delete(old);delete kitLayerData[item.blob];delete kitRuntimePartData[item.runtimePart];delete KIT_TWIN.parts[item.blob];}
 }
 function queued(fn){const p=serial.then(fn);serial=p.catch(()=>{});return p;}
 ColorKit.preview=(v,color,current)=>v.mix?queued(async()=>{if(current&&!current())throw Error('Superseded');await prepare(v,current);return legacy.preview(v,color,current);}):legacy.preview(v,color,current);
 async function materialize(layer){
  if(!layer.runtimePart||kitLayerData[layer.blob])return;
  const im=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='data:image/png;base64,'+kitRuntimePartData[layer.runtimePart];});
  const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(im,0,0);const data=ctx.getImageData(0,0,W,H).data,pixels=W*H,size=pixels+2,channels=new Uint8Array(size*4);
  for(let channel=0;channel<4;channel++)for(let i=0;i<pixels;i++)channels[channel*size+2+i]=data[i*4+channel];
  kitLayerData[layer.blob]=b64(pako.deflate(channels));c.width=c.height=0;
 }
 KitExport.build=async v=>{if(v.mix)await queued(async()=>{await prepare(v);for(const layer of KIT17.templates[v.template])await materialize(layer);});return exportBuild(v);};
 async function reference(front,back,outfit,view,grid,color,thumb=false,current,eyeColor='original',outfitColor='original'){
  const v={...variant('create',front,back,outfit,view,grid),eyeColor,outfitColor};const data=await ColorKit.preview(v,color,current);
  if(!thumb)return 'data:image/png;base64,'+data;
  const im=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='data:image/png;base64,'+data;});
  const c=document.createElement('canvas');c.width=512;c.height=768;c.getContext('2d').drawImage(im,0,0,512,768);const url=c.toDataURL('image/png');c.width=c.height=0;return url;
 }
 return {variant,reference,prepare};
})();
