(()=>{
'use strict';
const base=new URL('.',document.currentScript.src);let promise,data,image;
async function load(){if(!promise)promise=(async()=>{const r=await fetch(new URL('reference.json?v=86',base));if(!r.ok)throw Error('素体の基準データを取得できません');data=await r.json();image=new Image();image.src=new URL(data.image,base).href;await image.decode();return data;})();return promise;}
function draw(ctx,alpha=1){if(!image)return;ctx.save();ctx.globalAlpha=alpha;ctx.drawImage(image,0,0,2048,3072);ctx.restore();}
function guides(ctx,{labels=true,lines=true,points=true,center=true}={}){if(!data)return;ctx.save();ctx.lineWidth=3;ctx.font='26px system-ui,sans-serif';
 if(center){ctx.setLineDash([16,12]);ctx.strokeStyle='#9a8da5';ctx.beginPath();ctx.moveTo(data.center.x,data.center.y1);ctx.lineTo(data.center.x,data.center.y2);ctx.stroke();}
 if(lines)for(const line of data.lines){ctx.strokeStyle=line.color;ctx.setLineDash([16,12]);ctx.beginPath();ctx.moveTo(555,line.y);ctx.lineTo(1490,line.y);ctx.stroke();if(labels){ctx.fillStyle='white';ctx.fillRect(1430,line.y-39,135,36);ctx.fillStyle=line.color;ctx.fillText(line.name,1438,line.y-12);}}
 ctx.setLineDash([]);if(points)for(const p of data.points){const color=data.lines.find(l=>l.id===p.group)?.color||'#687e96';ctx.beginPath();ctx.arc(p.x,p.y,11,0,Math.PI*2);ctx.fillStyle='white';ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=4;ctx.stroke();ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}ctx.restore();}
function json(){return JSON.parse(JSON.stringify(data));}
window.BodyGuide={load,draw,guides,json,svgURL:()=>new URL('reference-body.svg?v=86',base).href};
})();
