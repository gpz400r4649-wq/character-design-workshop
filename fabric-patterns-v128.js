/* Procedural fabric motifs shared by live previews, PNG and layered PSD output. */
window.FabricPatterns=(()=>{
 const ids=['outfit-pattern','outfit-pattern-color','bottom-pattern','bottom-pattern-color','outfit-pattern-size','outfit-pattern-weight','bottom-pattern-size','bottom-pattern-weight'];
 const kinds=[{id:'none',name:'無地'},{id:'border',name:'ボーダー'},{id:'stripe',name:'ストライプ'},{id:'dots',name:'水玉'},{id:'gingham',name:'ギンガムチェック'},{id:'flowers',name:'花柄'}];
 const colors=()=>KIT_OUTFIT.palette.filter(c=>c.id!=='original'),defaults=['none','navy','none','navy','3','3','3','3'];
 const options=Object.fromEntries(ids.map((id,i)=>[id,i<4?(i%2?colors().map(c=>c.id):kinds.map(k=>k.id)):['1','2','3','4','5','6','7']]));
 const clean=s=>({...s,...Object.fromEntries(ids.map((id,i)=>[id,options[id].includes(s?.[id])?s[id]:defaults[i]]))});
 const onePiece=v=>!!KIT_CLOTHING.tops[(v.mix?.outfit||v.outfit||'').split('__')[0]]?.onePiece;
 function forVariant(v,bottom=false){const i=bottom?2:0,a=v.fabricPatterns||defaults;return {kind:bottom&&onePiece(v)?'none':options[ids[i]].includes(a[i])?a[i]:'none',color:options[ids[i+1]].includes(a[i+1])?a[i+1]:'navy',size:options[ids[4+i]].includes(a[4+i])?a[4+i]:'3',weight:options[ids[5+i]].includes(a[5+i])?a[5+i]:'3',tune:ColorTune.forVariant(v,bottom?7:6)};}
 const active=v=>forVariant(v).kind!=='none'||forVariant(v,true).kind!=='none';
 const stamp=v=>{if(!active(v))return '';const a=forVariant(v),b=forVariant(v,true),extra=[a,b].some(p=>p.kind!=='none'&&(p.size!=='3'||p.weight!=='3'));return '_pattern_'+a.kind+'_'+b.kind+(extra?'_s'+(a.kind==='none'?'3':a.size)+'w'+(a.kind==='none'?'3':a.weight)+'_s'+(b.kind==='none'?'3':b.size)+'w'+(b.kind==='none'?'3':b.weight):'');};
 const sizes=[.6,.8,1,1.25,1.6,2.4,3.2],weights=[.5,.75,1,1.25,1.5,2.25,3];
 function tile(kind,color,weight='3'){
  const thick=weights[Number(weight)-1]||1;
  const c=document.createElement('canvas');c.width=c.height=['gingham','flowers','dots'].includes(kind)?96:72;if(kind==='border'||kind==='stripe')c.width=c.height=Math.max(72,24*thick+24);if(kind==='gingham'&&thick>1.5)c.width=c.height=48*thick+48;const x=c.getContext('2d');x.fillStyle=color;
  if(kind==='border')x.fillRect(0,0,c.width,24*thick);
  if(kind==='stripe')x.fillRect(0,0,24*thick,c.height);
  if(kind==='dots')for(const [cx,cy] of [[24,24],[72,72]])for(const dx of [-96,0,96])for(const dy of [-96,0,96]){x.beginPath();x.arc(cx+dx,cy+dy,10*thick,0,Math.PI*2);x.fill();}
  if(kind==='gingham'){x.globalAlpha=.48;x.fillRect(0,0,48*thick,c.height);x.fillRect(0,0,c.width,48*thick);}
  if(kind==='flowers')for(const [bx,by] of [[24,24],[72,72]])for(const dx of [-96,0,96])for(const dy of [-96,0,96]){const cx=bx+dx,cy=by+dy;for(let i=0;i<5;i++){const a=i*Math.PI*2/5;x.beginPath();x.ellipse(cx+Math.cos(a)*10,cy+Math.sin(a)*10,9,7*thick,a,0,Math.PI*2);x.fill();}x.save();x.globalCompositeOperation='destination-out';x.beginPath();x.arc(cx,cy,3,0,Math.PI*2);x.fill();x.restore();}
  return c;
 }
 function paint(ctx,kind,color,x,y,w,h,settings={}){if(kind==='none')return;const scale=sizes[Number(settings.size||'3')-1]||1,t=tile(kind,color,settings.weight||'3');ctx.save();ctx.fillStyle=ctx.createPattern(t,'repeat');ctx.translate(-x,-y);ctx.scale(scale,scale);ctx.fillRect(x/scale,y/scale,w/scale,h/scale);ctx.restore();t.width=t.height=0;}
 function raster(kind,color,source,w,h,settings={}){const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');paint(x,kind,color,source.x,source.y,w,h,settings);const data=x.getImageData(0,0,w,h).data;c.width=c.height=0;return data;}
 function swatch(hex,tune){const d=new Uint8ClampedArray([...[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)),255]);ColorTune.pixel(d,0,ColorTune.parse(tune));return '#'+[...d.slice(0,3)].map(n=>n.toString(16).padStart(2,'0')).join('');}
 return {ids,kinds,options,defaults,clean,forVariant,active,stamp,paint,raster,swatch};
})();
