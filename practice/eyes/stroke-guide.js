/* Authored teaching paths follow the large contours of the approved eye assets.
   Coordinates refer to the 1040 x 520 eye thumbnails. This is one drawing method,
   not a claim that illustrations have a single mandatory stroke order. */
window.EyeStrokeGuide=(()=>{
 const profiles={
  default:{left:247,right:413,top:280,bottom:440,upper:[413,334,390,275,307,272,247,360],lower:[252,396,285,445,371,448,408,415],iris:[[346,298,305,320,303,417,344,435],[344,435,408,454,438,367,387,305]],light:[375,322,17,17],pupil:[371,365,16,22]},
  round:{left:159,right:392,top:270,bottom:475,upper:[392,329,353,254,216,265,159,391],lower:[180,431,234,475,334,483,391,437],iris:[[290,294,225,322,229,438,285,461],[285,461,380,479,421,348,350,291]],light:[339,325,22,22],pupil:[335,385,20,29]},
  round_slim:{left:158,right:390,top:340,bottom:478,upper:[390,402,340,333,213,325,158,420],lower:[176,446,230,480,335,478,387,454],iris:[[265,352,225,382,238,455,279,471],[279,471,367,490,415,405,348,365]],light:[330,385,20,20],pupil:[325,428,20,26]},
  adopted_21:{left:239,right:451,top:245,bottom:400,upper:[451,297,396,236,299,231,239,288],lower:[252,323,278,381,355,416,423,364],iris:[[349,255,313,275,314,363,349,387],[349,387,422,408,463,304,394,263]],light:[385,274,18,18],pupil:[383,319,16,23]},
  adopted_14:{left:267,right:430,top:195,bottom:350,upper:[430,260,406,183,319,173,267,267],lower:[277,302,311,347,381,359,424,322],iris:[[359,219,321,241,319,311,356,335],[356,335,416,359,450,257,390,213]],light:[382,242,20,20],pupil:[381,285,15,22]},
  adopted_13:{left:265,right:430,top:220,bottom:370,upper:[430,290,396,214,317,207,265,290],lower:[276,326,313,363,385,374,425,337],iris:[[349,242,313,270,319,338,352,357],[352,357,417,381,448,282,388,241]],light:[375,263,20,20],pupil:[374,305,17,23]}
 };
 const steps=[
  {name:'上まぶた',reading:'うわまぶた',tip:'右から 左へ、山を なぞるように。',color:'#b84249',badge:[432,45]},
  {name:'下まぶた',reading:'したまぶた',tip:'左から 右へ、下のカーブを かこう。',color:'#285fb0',badge:[92,330]},
  {name:'黒目の輪',reading:'くろめのわ',tip:'左を下へ、底を通って 右を上へ。',color:'#26794f',badge:[43,225]},
  {name:'光の丸',reading:'ひかりのまる',tip:'小さな丸を かいて、白く のこそう。',color:'#a36300',badge:[437,135]},
  {name:'ひとみ',reading:'ひとみ',tip:'黒目の中に、小さな たて長の丸。',color:'#8056a2',badge:[435,300]},
  {name:'まつ毛',reading:'まつげ',tip:'まぶたから 外へ、短い線を はらおう。',color:'#18788b',badge:[49,74]}
 ];
 function point(p,t){const u=1-t;return [u*u*u*p[0]+3*u*u*t*p[2]+3*u*t*t*p[4]+t*t*t*p[6],u*u*u*p[1]+3*u*u*t*p[3]+3*u*t*t*p[5]+t*t*t*p[7]];}
 function ellipse([cx,cy,rx,ry]){const k=.55228475;return [[cx,cy-ry,cx+rx*k,cy-ry,cx+rx,cy-ry*k,cx+rx,cy],[cx+rx,cy,cx+rx,cy+ry*k,cx+rx*k,cy+ry,cx,cy+ry],[cx,cy+ry,cx-rx*k,cy+ry,cx-rx,cy+ry*k,cx-rx,cy],[cx-rx,cy,cx-rx,cy-ry*k,cx-rx*k,cy-ry,cx,cy-ry]];}
 function paths(p){const lashes=[.5,.68,.83,.95].map((t,i)=>{const a=point(p.upper,t),dx=-7-i*2,dy=-15-i*1.5;return [a[0],a[1],a[0]+dx/3,a[1]+dy/2,a[0]+dx,a[1]+dy,a[0]+dx*1.4,a[1]+dy];});return [[p.upper],[p.lower],p.iris,ellipse(p.light),ellipse(p.pupil),lashes];}
 function mapping(p,mm){const scale=(mm/210*1600)/(p.right-p.left);return ([x,y])=>[240+(x-(p.left+p.right)/2)*scale,180+(y-(p.top+p.bottom)/2)*scale];}
 function curve(ctx,c,map){const a=map(c.slice(0,2)),b=map(c.slice(2,4)),d=map(c.slice(4,6)),e=map(c.slice(6,8));ctx.beginPath();ctx.moveTo(...a);ctx.bezierCurveTo(...b,...d,...e);ctx.stroke();}
 function arrow(ctx,c,map,t=.62){const a=map(point(c,t-.04)),b=map(point(c,t)),angle=Math.atan2(b[1]-a[1],b[0]-a[0]),size=8;ctx.beginPath();ctx.moveTo(b[0]-size*Math.cos(angle-.55),b[1]-size*Math.sin(angle-.55));ctx.lineTo(...b);ctx.lineTo(b[0]-size*Math.cos(angle+.55),b[1]-size*Math.sin(angle+.55));ctx.stroke();}
 function draw(ctx,id,{mm=35,through=5,active=-1,faint=false,arrows=true,numbers=true,mono=false,base=false}={}){
  const p=profiles[id]||profiles.default,map=mapping(p,mm),all=paths(p);ctx.save();ctx.lineCap=ctx.lineJoin='round';
  if(base){ctx.save();ctx.strokeStyle='#d6d6d6';ctx.lineWidth=2;for(const list of all)for(const c of list)curve(ctx,c,map);ctx.restore();}
  for(let i=0;i<=through;i++){const selected=active<0||active===i,color=mono?'#343434':steps[i].color;ctx.strokeStyle=selected?color:'#68746f';ctx.globalAlpha=faint?.22:1;ctx.lineWidth=selected?3.8:2.7;for(const c of all[i])curve(ctx,c,map);ctx.globalAlpha=1;
   if(arrows&&selected){const start=map(all[i][0].slice(0,2));ctx.fillStyle=color;ctx.beginPath();ctx.arc(...start,3.5,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2.8;const list=i===3||i===4?[all[i][2]]:i===5?[all[i][1],all[i][3]]:all[i];for(const c of list)arrow(ctx,c,map,i===5?.86:.65);}
   if(numbers&&selected){const badge=steps[i].badge,target=map(point(all[i][0],.18));ctx.strokeStyle=color;ctx.lineWidth=1.2;ctx.globalAlpha=.6;ctx.beginPath();ctx.moveTo(...badge);ctx.lineTo(...target);ctx.stroke();ctx.globalAlpha=1;ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(...badge,15,0,Math.PI*2);ctx.fill();ctx.strokeStyle=color;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=color;ctx.font='bold 21px "Yu Gothic",sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(i+1),badge[0],badge[1]+1);}
  }ctx.restore();
 }
 function marks(ctx,id,mm){const p=profiles[id]||profiles.default,map=mapping(p,mm),a=map([p.left,p.top]),b=map([p.right,p.bottom]);ctx.save();ctx.strokeStyle='#aebbb6';ctx.lineWidth=1.5;ctx.setLineDash([5,7]);ctx.strokeRect(a[0],a[1],b[0]-a[0],b[1]-a[1]);ctx.beginPath();ctx.moveTo(240,a[1]-12);ctx.lineTo(240,b[1]+12);ctx.stroke();ctx.restore();}
 return {steps,profiles,draw,marks};
})();
