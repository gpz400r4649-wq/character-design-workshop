/* Small, bounded adjustments shared by preview, reference PNG and PSD generation. */
window.ColorTune=(()=>{
 const ids=['hair-tune','hair-accent-tune','eye-tune','eye-right-tune','outfit-tune','bottom-tune','outfit-pattern-tune','bottom-pattern-tune','shoe-tune'],limits=[180,100,60],zero='[0,0,0]';
 function parse(input){try{const a=typeof input==='string'?JSON.parse(input):input;return limits.map((m,i)=>i===0?0:Array.isArray(a)&&Number.isFinite(a[i])?Math.max(-m,Math.min(m,Math.round(a[i]))):0);}catch{return [0,0,0];}}
 const text=input=>JSON.stringify(parse(input)),active=a=>parse(a).some(Boolean),forVariant=(v,i)=>parse(v.colorTunes?.[i]);
 const preferences=Object.fromEntries(ids.map(id=>[id,{includes:v=>typeof v==='string'&&(()=>{try{const a=JSON.parse(v);return Array.isArray(a)&&a.length===3&&a.every(Number.isFinite);}catch{return false;}})()}]));
 function clean(selection){return {...selection,...Object.fromEntries(ids.map(id=>[id,text(selection?.[id])]))};}
 function any(v){return active(v.colorTunes?.[8])||active(v.colorTunes?.[0])||(v.hairPattern!=='none'&&!!v.hairPattern&&active(v.colorTunes?.[1]))||active(v.colorTunes?.[2])||(v.eyeMode==='odd'&&active(v.colorTunes?.[3]))||active(v.colorTunes?.[4])||(!KIT_CLOTHING.tops[(v.mix?.outfit||v.outfit||'').split('__')[0]]?.onePiece&&active(v.colorTunes?.[5]))||(!!window.FabricPatterns&&FabricPatterns.forVariant(v).kind!=='none'&&active(v.colorTunes?.[6]))||(!!window.FabricPatterns&&FabricPatterns.forVariant(v,true).kind!=='none'&&active(v.colorTunes?.[7]));}
 function pixel(data,i,tune,weight=1){
  if(!weight||!tune.some(Boolean))return;
  const r=data[i]/255,g=data[i+1]/255,b=data[i+2]/255,max=Math.max(r,g,b),min=Math.min(r,g,b),d=max-min;
  let h=d?((max===r?(g-b)/d:max===g?(b-r)/d+2:(r-g)/d+4)+6)%6/6:0;
  h=((h+tune[0]/360)%1+1)%1;
  const s=Math.max(0,Math.min(1,(max?d/max:0)*(1+tune[1]/100))),v=Math.max(0,Math.min(1,max*2**(tune[2]/60)));
  const sector=Math.floor(h*6),f=h*6-sector,p=v*(1-s),q=v*(1-f*s),t=v*(1-(1-f)*s);let rr,gg,bb;
  switch(sector%6){case 0:rr=v;gg=t;bb=p;break;case 1:rr=q;gg=v;bb=p;break;case 2:rr=p;gg=v;bb=t;break;case 3:rr=p;gg=q;bb=v;break;case 4:rr=t;gg=p;bb=v;break;default:rr=v;gg=p;bb=q;}
  data[i]=Math.max(0,Math.min(255,Math.round(data[i]+(rr*255-data[i])*weight)));
  data[i+1]=Math.max(0,Math.min(255,Math.round(data[i+1]+(gg*255-data[i+1])*weight)));
  data[i+2]=Math.max(0,Math.min(255,Math.round(data[i+2]+(bb*255-data[i+2])*weight)));
 }
 function hair(data,tune,original){if(!active(tune))return;for(let i=0;i<data.length;i+=4)if(data[i+3])pixel(data,i,tune,Math.max(0,Math.min(1,(Math.max(original[i],original[i+1],original[i+2])-95)/95)));}
 return {ids,limits,zero,parse,text,active,forVariant,preferences,clean,any,pixel,hair};
})();
