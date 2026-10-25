/* Procedural fabric motifs shared by live previews, PNG and layered PSD output. */
window.FabricPatterns=(()=>{
 const ids=['outfit-pattern','outfit-pattern-color','bottom-pattern','bottom-pattern-color'];
 const kinds=[{id:'none',name:'無地'},{id:'border',name:'ボーダー'},{id:'stripe',name:'ストライプ'},{id:'dots',name:'水玉'},{id:'gingham',name:'ギンガムチェック'},{id:'flowers',name:'花柄'},{id:'stars',name:'星柄'}];
 const colors=()=>KIT_OUTFIT.palette.filter(c=>c.id!=='original'),defaults=['none','navy','none','navy'];
 const options=Object.fromEntries(ids.map((id,i)=>[id,i%2?colors().map(c=>c.id):kinds.map(k=>k.id)]));
 const clean=s=>({...s,...Object.fromEntries(ids.map((id,i)=>[id,options[id].includes(s?.[id])?s[id]:defaults[i]]))});
 const onePiece=v=>!!KIT_CLOTHING.tops[(v.mix?.outfit||v.outfit||'').split('__')[0]]?.onePiece;
 function forVariant(v,bottom=false){const i=bottom?2:0,a=v.fabricPatterns||defaults;return {kind:bottom&&onePiece(v)?'none':options[ids[i]].includes(a[i])?a[i]:'none',color:options[ids[i+1]].includes(a[i+1])?a[i+1]:'navy'};}
 const active=v=>forVariant(v).kind!=='none'||forVariant(v,true).kind!=='none';
 const stamp=v=>active(v)?'_pattern_'+forVariant(v).kind+'_'+forVariant(v,true).kind:'';
 function tile(kind,color){
  const c=document.createElement('canvas');c.width=c.height=['gingham','flowers','stars'].includes(kind)?96:72;const x=c.getContext('2d');x.fillStyle=color;
  if(kind==='border')x.fillRect(0,0,72,24);
  if(kind==='stripe')x.fillRect(0,0,24,72);
  if(kind==='dots'){x.beginPath();x.arc(36,36,10,0,Math.PI*2);x.fill();}
  if(kind==='gingham'){x.globalAlpha=.48;x.fillRect(0,0,48,96);x.fillRect(0,0,96,48);}
  if(kind==='flowers')for(const [cx,cy] of [[24,24],[72,72]]){for(let i=0;i<5;i++){const a=i*Math.PI*2/5;x.beginPath();x.ellipse(cx+Math.cos(a)*10,cy+Math.sin(a)*10,9,7,a,0,Math.PI*2);x.fill();}x.save();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(cx,cy,3,0,Math.PI*2);x.fill();x.restore();}
  if(kind==='stars')for(const [cx,cy] of [[24,24],[72,72]]){x.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?6:15;x.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);}x.closePath();x.fill();}
  return c;
 }
 function paint(ctx,kind,color,x,y,w,h){if(kind==='none')return;const t=tile(kind,color);ctx.save();ctx.fillStyle=ctx.createPattern(t,'repeat');ctx.translate(-x,-y);ctx.fillRect(x,y,w,h);ctx.restore();t.width=t.height=0;}
 function raster(kind,color,source,w,h){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');paint(x,kind,color,source.x,source.y,w,h);const data=x.getImageData(0,0,w,h).data;c.width=c.height=0;return data;}
 function swatch(hex,tune){const d=new Uint8ClampedArray([...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),255]);ColorTune.pixel(d,0,ColorTune.parse(tune));return '#'+[...d.slice(0,3)].map(n=>n.toString(16).padStart(2,'0')).join('');}
 return {ids,kinds,options,defaults,clean,forVariant,active,stamp,paint,raster,swatch};
})();
