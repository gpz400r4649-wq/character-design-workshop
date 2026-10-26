/* Small, dependency-free RGB8 PSD writer. All worksheet layers use normal blend.
   Layer records are serialized bottom-first; Unicode names, active layer and resolution are included. */
window.WorkbookExport=(()=>{
 const cat=parts=>{const out=new Uint8Array(parts.reduce((s,p)=>s+p.length,0));let at=0;for(const p of parts){out.set(p,at);at+=p.length;}return out;};
 const ascii=s=>Uint8Array.from(s,c=>c.charCodeAt(0));
 function n(v,size=4){const out=new Uint8Array(size),d=new DataView(out.buffer);size===2?d.setUint16(0,v):d.setUint32(0,v);return out;}
 function unicode(s){const out=new Uint8Array(4+s.length*2),d=new DataView(out.buffer);d.setUint32(0,s.length);for(let i=0;i<s.length;i++)d.setUint16(4+i*2,s.charCodeAt(i));return out;}
 function block(tag,data){return cat([ascii('8BIM'+tag),n(data.length),data,data.length%2?new Uint8Array(1):new Uint8Array()]);}
 function resource(id,data){return cat([ascii('8BIM'),n(id,2),n(0,2),n(data.length),data,data.length%2?new Uint8Array(1):new Uint8Array()]);}
 function packRow(data,start,width,step){const out=[];let x=0;while(x<width){let run=1;while(run<128&&x+run<width&&data[start+x*step]===data[start+(x+run)*step])run++;if(run>=3){out.push(257-run,data[start+x*step]);x+=run;continue;}const begin=x;x+=run;while(x<width&&x-begin<128){if(x+2<width&&data[start+x*step]===data[start+(x+1)*step]&&data[start+x*step]===data[start+(x+2)*step])break;x++;}if(x-begin>128)x=begin+128;out.push(x-begin-1);for(let i=begin;i<x;i++)out.push(data[start+i*step]);}return Uint8Array.from(out);}
 function channel(data,w,h,q){const rows=[],counts=new Uint8Array(h*2),d=new DataView(counts.buffer);for(let y=0;y<h;y++){const row=packRow(data,y*w*4+q,w,4);d.setUint16(y*2,row.length);rows.push(row);}const bytes=cat([n(1,2),counts,...rows]);return {counts,rows,bytes};}
 function pixels(canvas,width,height){const data=new Uint8Array(width*height*4);if(canvas.width===width&&canvas.height===height)data.set(canvas.getContext('2d',{willReadFrequently:true}).getImageData(0,0,width,height).data);return {left:0,top:0,w:width,h:height,data};}
 function layerChannel(data,w,h,q){const bytes=new Uint8Array(2+w*h);for(let i=0;i<w*h;i++)bytes[i+2]=data[i*4+q];return {bytes};}
 const breathe=()=>new Promise(r=>setTimeout(r,0));
 async function psd({width,height,widthMM,heightMM,layers,merged}){
  layers=[...layers].reverse();
  const records=[],channels=[];
  for(let i=0;i<layers.length;i++){
   const layer=layers[i],p=layer.key==='Practice'?{left:0,top:0,w:width,h:height,data:new Uint8Array(width*height*4)}:pixels(layer.canvas,width,height),packed=[0,1,2,3].map(q=>layerChannel(p.data,p.w,p.h,q)),fallback=ascii(layer.key||'Layer '+(i+1)),pascal=cat([Uint8Array.of(fallback.length),fallback,new Uint8Array((4-(fallback.length+1)%4)%4)]),extra=cat([n(0),n(0),pascal,block('luni',unicode(layer.name))]);
   records.push(cat([n(p.top),n(p.left),n(p.top+p.h),n(p.left+p.w),n(4,2),...packed.flatMap((c,q)=>[n(q===3?65535:q,2),n(c.bytes.length)]),ascii('8BIMnorm'),Uint8Array.of(255,0,layer.visible===false?2:0,0),n(extra.length),extra]));channels.push(...packed.map(c=>c.bytes));await breathe();
  }
  let info=cat([n(layers.length,2),...records,...channels]);if(info.length%2)info=cat([info,new Uint8Array(1)]);
  const section=cat([n(info.length),info,n(0)]),resolution=cat([n(Math.round(width/widthMM*25.4*65536)),n(1,2),n(2,2),n(Math.round(height/heightMM*25.4*65536)),n(1,2),n(2,2)]),resources=cat([resource(1005,resolution),resource(1024,n(layers.length-1,2))]),data=merged.getContext('2d').getImageData(0,0,width,height).data,planes=[];
  for(let q=0;q<3;q++){planes.push(channel(data,width,height,q));await breathe();}
  const header=cat([ascii('8BPS'),n(1,2),new Uint8Array(6),n(3,2),n(height),n(width),n(8,2),n(3,2)]);
  return new Blob([header,n(0),n(resources.length),resources,n(section.length),section,n(1,2),...planes.map(p=>p.counts),...planes.flatMap(p=>p.rows)],{type:'image/vnd.adobe.photoshop'});
 }
 const crcTable=Uint32Array.from({length:256},(_,i)=>{let c=i;for(let k=0;k<8;k++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
 function chunk(type,data){const bytes=cat([ascii(type),data]);let crc=0xffffffff;for(const b of bytes)crc=crcTable[(crc^b)&255]^(crc>>>8);return cat([n(data.length),bytes,n((crc^0xffffffff)>>>0)]);}
 async function png(canvas,widthMM,heightMM){const blob=await new Promise(r=>canvas.toBlob(r,'image/png'));if(!blob)throw Error('PNG unavailable');const raw=new Uint8Array(await blob.arrayBuffer()),d=new DataView(raw.buffer),physical=cat([n(Math.round(canvas.width/widthMM*1000)),n(Math.round(canvas.height/heightMM*1000)),Uint8Array.of(1)]),parts=[raw.slice(0,8)];let at=8;while(at<raw.length){const size=d.getUint32(at),tag=String.fromCharCode(...raw.subarray(at+4,at+8));if(tag!=='pHYs')parts.push(raw.slice(at,at+12+size));if(tag==='IHDR')parts.push(chunk('pHYs',physical));at+=size+12;}return new Blob(parts,{type:'image/png'});}
 return {psd,png};
})();
