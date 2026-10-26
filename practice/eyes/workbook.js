/* Print-first workbook. No in-browser drawing or drawing-data storage. */
(()=>{'use strict';
 const el=id=>document.getElementById(id),W=1600,H=2263,G=EyeStrokeGuide,catalog=EyeDrillCatalog;
 let style=catalog.some(c=>c.id===new URLSearchParams(location.search).get('style'))?new URLSearchParams(location.search).get('style'):'default';
 const mm=()=>Number(el('eye-size').value),mono=()=>el('ink-mode').value==='mono';
 function text(c,s,x,y,size=27,color='#344c48',weight=500){c.fillStyle=color;c.font=`${weight} ${size}px "Yu Gothic",Meiryo,sans-serif`;c.textAlign='left';c.textBaseline='alphabetic';c.fillText(s,x,y);}
 function header(canvas,title,sub){const c=canvas.getContext('2d');c.fillStyle='white';c.fillRect(0,0,W,H);text(c,'キャラクターデザイン工房  /  なぞって おぼえる',65,80,24,'#497669',600);text(c,title,65,153,47,'#2a4038',700);text(c,catalog.find(s=>s.id===style).name+'  ・  片目の横幅の目安 '+mm()+'mm',65,205,26);text(c,sub,65,259,27);text(c,'なまえ：____________________    日にち：____ / ____',65,318,26);return c;}
 function footer(c){text(c,'A4・100%で印刷。線の順番は一例です。かきやすい向きでも だいじょうぶ。',65,2130,23,'#536b60');text(c,'この線が 5cmになるように 印刷しよう →',65,2193,24);const x=1000,y=2185,w=50/210*W;c.strokeStyle='#2f413a';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(x+w,y);c.moveTo(x,y-10);c.lineTo(x,y+10);c.moveTo(x+w,y-10);c.lineTo(x+w,y+10);c.stroke();text(c,'5cm',x+w/2-27,y-18,23);}
 function cell(c,x,y,w,h,caption){c.strokeStyle='#c4d0c8';c.lineWidth=2;c.strokeRect(x,y,w,h);text(c,caption,x+20,y+35,23,'#5c7267');}
 function mapped(c,x,y,w,h,fn){c.save();const scale=Math.min(w/480,h/360);c.translate(x+(w-480*scale)/2,y+(h-360*scale)/2);c.scale(scale,scale);fn(c);c.restore();}
 function orderSheet(){const c=header(el('order-sheet'),'目の かく順番（じゅんばん）','①〜⑥の順に線を足そう。矢印は、ペンを動かす向きだよ。');
  for(let i=0;i<6;i++){const col=i%2,row=Math.floor(i/2),x=65+col*755,y=390+row*555,s=G.steps[i],color=mono()?'#343434':s.color;cell(c,x,y,720,515,`${i+1}  ${s.name}（${s.reading}）`);text(c,s.tip,x+20,y+76,24);mapped(c,x+35,y+90,650,390,ctx=>G.draw(ctx,style,{mm:mm()*360/390,through:i,active:i,mono:mono()}));text(c,'● はじめ  →  矢印の向きへ',x+22,y+490,22,color);}
  footer(c);
 }
 function practiceSheet(){const c=header(el('practice-sheet'),'目の なぞり練習（れんしゅう）','まずは大きな線から。細かいひとみの模様は、あとから足そう。');
  const rows=[['1  順番と向きを 見ながら なぞろう','番号と矢印を たしかめて、①から はじめよう。'],['2  目印で かこう','はば・高さ・まん中を、左の見本と そろえよう。'],['3  見本を見て かこう','順番を 思い出しながら、じぶんで かいてみよう。']];
  for(let row=0;row<3;row++){const y=395+row*565;text(c,rows[row][0],65,y,34,'#315e51',700);text(c,rows[row][1],65,y+47,24,'#5b7068');for(let col=0;col<3;col++){const x=65+col*505,top=y+75;cell(c,x,top,480,415,col===0?'見本（みほん）':`れんしゅう ${col}`);mapped(c,x,top+45,480,360,ctx=>{if(col===0)G.draw(ctx,style,{mm:mm(),mono:mono(),arrows:row===0,numbers:row===0});else if(row===0)G.draw(ctx,style,{mm:mm(),mono:mono(),faint:true,arrows:true,numbers:true});else if(row===1)G.marks(ctx,style,mm());});}}
  footer(c);
 }
 function render(){orderSheet();practiceSheet();if(mono())for(const id of ['order-sheet','practice-sheet']){const ctx=el(id).getContext('2d'),data=ctx.getImageData(0,0,W,H);for(let i=0;i<data.data.length;i+=4){const gray=Math.round(.299*data.data[i]+.587*data.data[i+1]+.114*data.data[i+2]);data.data[i]=data.data[i+1]=data.data[i+2]=gray;}ctx.putImageData(data,0,0);}const chosen=el('sheet-kind').value;for(const kind of ['order','practice'])el(kind+'-section').hidden=chosen!=='both'&&chosen!==kind;el('status').textContent=`A4・片目 約${mm()/10}cm。印刷した5cmの線で、大きさをたしかめてね。`;}
 function select(id){style=id;for(const b of el('styles').children)b.setAttribute('aria-pressed',String(b.dataset.style===id));const url=new URL(location.href);url.searchParams.set('style',id);window.history.replaceState(null,'',url);render();}
 function save(kind){render();el(kind+'-sheet').toBlob(blob=>{if(!blob){el('status').textContent='ほぞんできませんでした。もう一度ためしてね。';return;}const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`eye-${kind}_${style}_${mm()}mm_${el('ink-mode').value}.png`;a.click();setTimeout(()=>URL.revokeObjectURL(url),60000);el('status').textContent='シートを PNGでほぞんしたよ。';},'image/png');}
 function preparePrint(){render();el('print-pages').replaceChildren();for(const kind of ['order','practice'])if(!el(kind+'-section').hidden){const img=new Image();img.alt=kind==='order'?'描く順番のシート':'なぞり練習シート';img.src=el(kind+'-sheet').toDataURL('image/png');el('print-pages').append(img);}}
 for(const kind of ['order','practice'])el('save-'+kind).addEventListener('click',()=>save(kind));
 el('print-sheet').addEventListener('click',async()=>{preparePrint();await Promise.all([...el('print-pages').children].map(i=>i.decode()));window.print();});window.addEventListener('beforeprint',preparePrint);
 for(const id of ['eye-size','ink-mode','sheet-kind'])el(id).addEventListener('change',render);
 for(const item of catalog){const b=document.createElement('button');b.type='button';b.className='style-choice';b.dataset.style=item.id;const img=new Image();img.src='assets/'+item.id+'.png';img.alt='';const label=document.createElement('span');label.innerHTML=item.name.replace(/丸目|目/g,w=>w==='丸目'?'<ruby>丸目<rt>まるめ</rt></ruby>':'<ruby>目<rt>め</rt></ruby>');b.append(img,label);b.addEventListener('click',()=>select(item.id));el('styles').append(b);}
 select(style);
})();
