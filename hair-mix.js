/* Compose independent front/back choices; never create a file per combination. */
window.kitRuntimePartData=Object.create(null);
window.HairMix=(()=>{
 const legacy={...ColorKit},exportBuild=KitExport.build,prepared=new Map(),practiceHints=new Map(),runtimeRecords=new Map();let serial=Promise.resolve(),sequence=1,clothesDraw=null;
 const W=KIT17.width,H=KIT17.height;
 function valid(front,back){if(!KIT_MIX.front[front]||!KIT_MIX.back[back])throw Error('Unknown hair choice');}
 function variant(activity,front,back,outfit,view='normal',grid=false,hint=true,hintStrength='faint'){
  valid(front,back);hintStrength=activity==='hair_all'&&hintStrength==='clear'?'clear':'faint';
  const basis=KIT_MIX.front[front].baseStyle||'twin',baseActivity=activity==='outfit_practice'?'create':activity,key=`${baseActivity}_${basis}_${outfit}_${view}${grid?'_grid':''}`;
  const original=KIT17.variants[key];if(!original)throw Error('Missing drawing mode '+key);
  const source=KIT17.templates[original.template],stack=[],visible=[];
  const fronts=KIT_MIX.front[front].layers,backs=[...(KIT_MIX.front[front].integratedBack||[]),...KIT_MIX.back[back].layers];
  const hairOn=!['hair_all','copy','color'].includes(activity)&&view!=='lineart'&&view!=='silhouette';
  const hairPractice=activity==='hair_all',clothesPractice=activity==='outfit_practice';
  const blank=source.find(x=>x.key==='draw');
  function hintSlot(role){stack.push({...blank,key:'practice_hint_'+role,name:'線のヒント・'+role});visible.push(hint);}
  let addedFront=false,addedBack=false;
  function insert(list,on){for(const item of list){stack.push({...item});visible.push(on);}}
  for(let i=0;i<source.length;i++){
   const entry=source[i];
   if(clothesPractice&&entry.key==='draw')continue;
   if(hairPractice&&view==='lineart'&&entry.key==='rear_draw'){stack.push({...blank,key:'practice_body_blank'});visible.push(true);}
   const guideKind=view==='space'?'hatch':view==='silhouette'?'silhouette':view==='lineart'?'lineart':null;
   // Hidden guides from the old complete hairstyle would be misleading in a mixed PSD.
   if(['lineart','silhouette','hatch'].includes(entry.key)&&entry.key!==guideKind)continue;
   if(entry.key.startsWith('front_')||entry.key.startsWith('cap_')){
    if(!addedFront){if(hairPractice)hintSlot('front');insert(fronts,hairOn);addedFront=true;}continue;
   }
   if(entry.key.startsWith('back_')){
    if(!addedBack){if(hairPractice)hintSlot('back');insert(backs,hairOn);addedBack=true;}continue;
   }
   if(clothesPractice&&entry.key==='outfit_'+outfit){stack.push({...blank,key:'practice_draw_clothes'});visible.push(true);hintSlot('outfit');stack.push({...entry,key:'practice_clothes_blank'});visible.push(true);stack.push({...entry});visible.push(false);continue;}
   stack.push({...entry});visible.push(original.visible[i]);
  }
  // Copy mode intentionally has no body or hair; its guides are prepared below.
  const template=`mix_${activity}_${front}__${back}_${outfit}_${view}${grid?'_grid':''}_${hint?'hint':'free'}${hairPractice?'_'+hintStrength:''}`;
  KIT17.templates[template]=stack;
  return {...original,template,visible,dynamic:true,mix:{activity,front,back,outfit,view,grid,hint,hintStrength},filename:`${activity}_${front}__${back}_${outfit}_${view}${grid?'_grid':''}${hairPractice||clothesPractice?'_'+(hint?'hint':'free')+(hairPractice?'_'+hintStrength:''):''}_v56.psd`};
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
  const record=b64(raw);runtimeRecords.set(blob,record);
  return {key,name,blob,raw:record,visible:true,runtimePart:part};
 }
 async function picture(v,transparent=false,current){return new Promise(async(resolve,reject)=>{try{const data=await legacy.preview({...v,transparent},'original',current);const im=new Image();im.onload=()=>resolve(im);im.onerror=reject;im.src='data:image/png;base64,'+data;}catch(e){reject(e);}});}
 function canvas(){const c=document.createElement('canvas');c.width=W;c.height=H;return c;}
 // Verify the filter actually paints: Safari may expose/accept the property without applying it.
 let workingBlur;
 function canBlur(){
  if(workingBlur!==undefined)return workingBlur;
  const a=document.createElement('canvas'),b=document.createElement('canvas');a.width=b.width=16;a.height=b.height=16;
  const ac=a.getContext('2d'),bc=b.getContext('2d');ac.fillRect(7,7,2,2);bc.filter='blur(3.2px)';bc.drawImage(a,0,0);
  workingBlur=bc.getImageData(4,7,1,1).data[3]>0;a.width=a.height=b.width=b.height=0;return workingBlur;
 }
 function smooth(image,rgba){
  if(canBlur()){
   const c=canvas(),ctx=c.getContext('2d');ctx.filter='blur(3.2px)';ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,W,H).data;c.width=c.height=0;
   return {rgba:data};
  }
  // Three sliding box passes approximate a 3.2 px Gaussian. No browser filter or extra full-size canvas.
  let a=new Float32Array(W*H),b=new Float32Array(W*H);
  for(let i=0;i<a.length;i++){const j=i*4,alpha=rgba[j+3]/255;a[i]=(.299*rgba[j]+.587*rgba[j+1]+.114*rgba[j+2])*alpha+255*(1-alpha);}
  function pass(radius,vertical){
   const lines=vertical?W:H,length=vertical?H:W,step=vertical?W:1,div=radius*2+1;
   for(let line=0;line<lines;line++){
    const start=vertical?line:line*W;let sum=0;
    for(let k=-radius;k<=radius;k++)sum+=a[start+Math.max(0,Math.min(length-1,k))*step];
    for(let pos=0;pos<length;pos++){
     b[start+pos*step]=sum/div;
     sum+=a[start+Math.min(length-1,pos+radius+1)*step]-a[start+Math.max(0,pos-radius)*step];
    }
   }
   [a,b]=[b,a];
  }
  for(const radius of [2,3,3]){pass(radius,false);pass(radius,true);}
  return {gray:a};
 }
 function light(rgba,j,onWhite){const g=.299*rgba[j]+.587*rgba[j+1]+.114*rgba[j+2];return onWhite?g*rgba[j+3]/255+255*(1-rgba[j+3]/255):g;}
 async function makeGuide(v,current){
  const m=v.mix,kind=m.view==='space'?'hatch':m.view==='silhouette'?'silhouette':'lineart';
  const base=variant(kind==='lineart'&&m.activity!=='color'?m.activity:'create',m.front,m.back,m.outfit,'normal',false,false);
  const image=await picture(base,kind!=='lineart',current);if(current&&!current())throw Error('Superseded');const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(image,0,0);
  const source=ctx.getImageData(0,0,W,H),output=ctx.createImageData(W,H),d=output.data,s=source.data;
  if(kind==='lineart'){
   const blurred=smooth(image,s),b=blurred.rgba;
   for(let i=0;i<W*H;i++){const j=i*4,g=light(s,j,!!blurred.gray),bg=b?light(b,j,false):blurred.gray[i];d[j]=49;d[j+1]=42;d[j+2]=51;d[j+3]=Math.max(0,Math.min(255,(bg-g-3.5)*13));}
  }else for(let y=0;y<H;y++)for(let x=0;x<W;x++){const j=(y*W+x)*4;d[j]=kind==='hatch'?122:255;d[j+1]=kind==='hatch'?124:255;d[j+2]=kind==='hatch'?145:255;d[j+3]=kind==='hatch'?((x+y)%52<4?(255-s[j+3])*65/255:0):s[j+3];}
  ctx.putImageData(output,0,0);const layer=runtimeLayer(kind,kind==='hatch'?'しゃせん・くみあわせ':kind==='silhouette'?'しろぬき・くみあわせ':'せんが・くみあわせ',c);c.width=c.height=0;return layer;
 }
 async function prepare(v,current){
  if(current&&!current())throw Error('Superseded');
  if(v.mix)await preparePractice(v,current);
  if(!v.mix||v.mix.view==='normal')return;
  const key=v.template;
  let layer=prepared.get(key);
  if(!layer){layer=await makeGuide(v,current);prepared.set(key,layer);}
  else{prepared.delete(key);prepared.set(key,layer);}
  const stack=KIT17.templates[key];for(let i=0;i<stack.length;i++)if(stack[i].key===layer.key)stack[i]={...layer};
  while(prepared.size>6){const [old,item]=prepared.entries().next().value;prepared.delete(old);forget(item);}
 }
 function forget(layer){delete kitLayerData[layer.blob];delete kitRuntimePartData[layer.runtimePart];delete KIT_TWIN.parts[layer.blob];runtimeRecords.delete(layer.blob);}
 async function practiceHint(role,m,current){
  const id=role==='front'?m.front:role==='back'?m.back:m.outfit,key=role+':'+id+(role==='back'?':'+m.front:'')+':'+(m.hintStrength||'faint');
  if(practiceHints.has(key)){const layer=practiceHints.get(key);practiceHints.delete(key);practiceHints.set(key,layer);return layer;}
  const layers=role==='outfit'?[KIT17.templates['create_twin_'+m.outfit].find(x=>x.key==='outfit_'+m.outfit)]:role==='back'?[...(KIT_MIX.front[m.front].integratedBack||[]),...KIT_MIX.back[id].layers]:KIT_MIX[role][id].layers;
  const template='practice_source_'+role+'_'+id;KIT17.templates[template]=layers;
  const image=await picture({template,visible:layers.map(()=>true),dynamic:true},false,current);if(current&&!current())throw Error('Superseded');
  const c=canvas(),ctx=c.getContext('2d'),clear=m.hintStrength==='clear';ctx.drawImage(image,0,0);
  const original=ctx.getImageData(0,0,W,H).data,blurred=smooth(image,original),b=blurred.rgba,result=ctx.createImageData(W,H),d=result.data;
  for(let i=0;i<W*H;i++){const j=i*4,g=light(original,j,!!blurred.gray),bg=b?light(b,j,false):blurred.gray[i];d[j]=clear?49:70;d[j+1]=clear?42:63;d[j+2]=clear?51:74;d[j+3]=Math.max(0,Math.min(255,(bg-g-3.5)*13))*(clear?1:.38);}
  ctx.putImageData(result,0,0);const layer=runtimeLayer('practice_hint_'+role,'線のヒント・'+({front:'まえのかみ',back:'うしろのかみ',outfit:'ふく'}[role])+(clear?'・はっきり':'・うすい')+'（けしてOK）',c);c.width=c.height=0;
  practiceHints.set(key,layer);while(practiceHints.size>8){const [old,entry]=practiceHints.entries().next().value;practiceHints.delete(old);forget(entry);}return layer;
 }
 async function preparePractice(v,current){
  const m=v.mix,stack=KIT17.templates[v.template];
  if(!['hair_all','outfit_practice'].includes(m.activity))return;
  for(let i=0;i<stack.length;i++){
   if(stack[i].key.startsWith('practice_hint_'))stack[i]={...await practiceHint(stack[i].key.slice(14),m,current)};
   else if(stack[i].key==='practice_draw_clothes'){
    if(!clothesDraw){const c=canvas();clothesDraw=runtimeLayer('practice_draw_clothes','ここに・ふくを・かく',c);c.width=c.height=0;}
    stack[i]={...clothesDraw};
   }else if(['practice_clothes_blank','practice_body_blank'].includes(stack[i].key)){
    const body=stack[i].key==='practice_body_blank',key=(body?'body-mask:':'mask:')+m.outfit;let layer=practiceHints.get(key);
    if(!layer){
     const source=KIT17.templates['create_twin_'+m.outfit].find(x=>x.key==='outfit_'+m.outfit),template='practice_mask_source_'+m.outfit;KIT17.templates[template]=[source];
     const image=await picture(body?variant('hair_all',m.front,m.back,m.outfit,'normal',false,false):{template,visible:[true],dynamic:true},true,current);if(current&&!current())throw Error('Superseded');
     const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,W,H);for(let j=0;j<pixels.data.length;j+=4)pixels.data[j]=pixels.data[j+1]=pixels.data[j+2]=255;ctx.putImageData(pixels,0,0);
     layer=runtimeLayer(body?'practice_body_blank':'practice_clothes_blank',body?'体の下地（白）':'ふくの下地（白）',c);c.width=c.height=0;practiceHints.set(key,layer);
    }else{practiceHints.delete(key);practiceHints.set(key,layer);}
    stack[i]={...layer};
   }
  }
  while(practiceHints.size>8){const [old,entry]=practiceHints.entries().next().value;practiceHints.delete(old);forget(entry);}
 }
 function queued(fn){const p=serial.then(fn);serial=p.catch(()=>{});return p;}
 ColorKit.preview=(v,color,current)=>v.mix?queued(async()=>{if(current&&!current())throw Error('Superseded');await prepare(v,current);return legacy.preview(v,color,current);}):legacy.preview(v,color,current);
 function packedChannel(data,channel){
  const result=new Uint8Array(2+H*2+H*(W+Math.ceil(W/128)+2)),view=new DataView(result.buffer);result[1]=1;let at=2+H*2;
  for(let y=0;y<H;y++){
   const row=at,base=y*W*4+channel;let x=0;
   while(x<W){
    let run=1;while(run<128&&x+run<W&&data[base+x*4]===data[base+(x+run)*4])run++;
    if(run>=3){result[at++]=257-run;result[at++]=data[base+x*4];x+=run;}
    else{
     const start=x;x+=run;
     while(x<W&&x-start<128){if(x+2<W&&data[base+x*4]===data[base+(x+1)*4]&&data[base+x*4]===data[base+(x+2)*4])break;x++;}
     result[at++]=x-start-1;for(let pos=start;pos<x;pos++)result[at++]=data[base+pos*4];
    }
   }
   view.setUint16(2+y*2,at-row);
  }
  return result.slice(0,at);
 }
 async function materialize(layer){
  if(!layer.runtimePart)return;
  layer.raw=runtimeRecords.get(layer.blob)||layer.raw;if(kitLayerData[layer.blob])return;
  const im=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='data:image/png;base64,'+kitRuntimePartData[layer.runtimePart];});
  const c=canvas(),ctx=c.getContext('2d');ctx.drawImage(im,0,0);const data=ctx.getImageData(0,0,W,H).data,chunks=[0,1,2,3].map(channel=>packedChannel(data,channel));
  const channels=new Uint8Array(chunks.reduce((sum,chunk)=>sum+chunk.length,0));let at=0;for(const chunk of chunks){channels.set(chunk,at);at+=chunk.length;}
  const raw=Uint8Array.from(atob(layer.raw),char=>char.charCodeAt(0)),view=new DataView(raw.buffer);for(let channel=0;channel<4;channel++)view.setUint32(20+channel*6,chunks[channel].length);
  layer.raw=b64(raw);runtimeRecords.set(layer.blob,layer.raw);kitLayerData[layer.blob]=b64(pako.deflate(channels));c.width=c.height=0;
 }
 KitExport.build=async v=>{if(v.mix)await queued(async()=>{await prepare(v);for(const layer of KIT17.templates[v.template])await materialize(layer);});return exportBuild(v);};
 async function reference(front,back,outfit,view,grid,color,thumb=false,current,eyeColor='original',outfitColor='original',skinColor='original'){
  const v={...variant('create',front,back,outfit,view,grid),eyeColor,outfitColor,skinColor};const data=await ColorKit.preview(v,color,current);
  if(!thumb)return 'data:image/png;base64,'+data;
  const im=await new Promise((resolve,reject)=>{const i=new Image();i.onload=()=>resolve(i);i.onerror=reject;i.src='data:image/png;base64,'+data;});
  const c=document.createElement('canvas');c.width=512;c.height=768;c.getContext('2d').drawImage(im,0,0,512,768);const url=c.toDataURL('image/png');c.width=c.height=0;return url;
 }
 return {variant,reference,prepare};
})();
