/* Discrete, previewed levels for younger users; each selected color stays independent. */
window.ColorTuneUI=(()=>{
 const el=id=>document.getElementById(id),groups={hair:[0,1],eye:[2,3]},levels={1:[-100,-50,0,50,100],2:[-40,-20,0,20,40]},names={1:['とても おだやか','おだやか','そのまま','あざやか','とても あざやか'],2:['とても 暗い','暗い','そのまま','明るい','とても 明るい']};
 for(const [group,indices] of Object.entries(groups)){
  const root=document.querySelector(group==='hair'?'.hair-colors':'.eye-colors'),details=document.createElement('details');details.className='color-tune';details.id=group+'-tune-editor';
  details.innerHTML=`<summary>色を 調整する</summary><label for="${group}-tune-target">調整する 色</label><select id="${group}-tune-target"><option value="0">${group==='hair'?'基本の色':'両目の色'}</option><option value="1">${group==='hair'?'追加の色':'画面の右の目'}</option></select>`;
  for(const [i,title] of [[1,'あざやかさ'],[2,'明るさ']]){const field=document.createElement('fieldset');field.className='tune-row';field.innerHTML=`<legend>${title}</legend><div class="tune-levels" data-axis="${i}" role="group" aria-label="${title}"></div>`;details.appendChild(field);}
  const reset=document.createElement('button');reset.type='button';reset.textContent='この色の 調整を 戻す';reset.id=group+'-tune-reset';reset.addEventListener('click',()=>{el(ColorTune.ids[indices[Number(el(group+'-tune-target').value)]]).value=ColorTune.zero;update();});details.appendChild(reset);
  const hint=document.createElement('p');hint.className='small';hint.textContent='丸い 色見本を えらぼう。別の 色を えらぶと、その色の 調整は 戻るよ。';details.appendChild(hint);
  for(const index of indices){const input=document.createElement('input');input.type='hidden';input.id=ColorTune.ids[index];input.value=ColorTune.zero;details.appendChild(input);}
  root.querySelector('.color-grid').after(details);el(group+'-tune-target').addEventListener('change',()=>sync(selection()));
 }
 function swatch(hex,tune){const c=document.createElement('canvas').getContext('2d');c.fillStyle=hex;c.fillRect(0,0,1,1);const d=c.getImageData(0,0,1,1).data;ColorTune.pixel(d,0,tune);return `rgb(${d[0]},${d[1]},${d[2]})`;}
 function sync(s){
  for(const [group,indices] of Object.entries(groups)){
   const target=el(group+'-tune-target'),second=group==='hair'?s.pattern!=='none':s.eyeMode==='odd';target.options[1].disabled=!second;if(!second)target.value='0';if(group==='eye')target.options[0].textContent=second?'画面の左の目':'両目の色';
   const index=indices[Number(target.value)],id=ColorTune.ids[index],values=ColorTune.parse(el(id).value);el(id).value=ColorTune.text(values);
   const palette=group==='hair'?KIT_HAIR.palette:KIT_EYES.palette,colorId=el(index===0?'hair-color':index===1?'hair-accent':index===2?'eye-color':'eye-color-right').value,hex=palette.find(c=>c.id===colorId)?.swatch||'#986b50';
   for(const i of [1,2]){const row=el(group+'-tune-editor').querySelector(`[data-axis="${i}"]`),options=levels[i].includes(values[i])?levels[i]:[...levels[i],values[i]].sort((a,b)=>a-b);row.replaceChildren();
    for(const value of options){const button=document.createElement('button');button.type='button';button.className='tune-choice';button.dataset.value=value;const label=names[i][levels[i].indexOf(value)]||'前の 調整';button.setAttribute('aria-label',label);button.setAttribute('aria-pressed',String(values[i]===value));const tune=[...values];tune[i]=value;const circle=document.createElement('span');circle.className='tune-swatch';circle.style.backgroundColor=swatch(hex,tune);circle.setAttribute('aria-hidden','true');const caption=document.createElement('span');caption.textContent=label;button.append(circle,caption);button.addEventListener('click',()=>{const next=ColorTune.parse(el(id).value);next[i]=value;el(id).value=ColorTune.text(next);update();});row.appendChild(button);}
   }
   const tuned=ColorTune.active(el(ColorTune.ids[indices[0]]).value)||(second&&ColorTune.active(el(ColorTune.ids[indices[1]]).value));el(group+'-tune-editor').querySelector('summary').textContent='色を 調整する'+(tuned?'（調整中）':'');
  }
 }
 function preset(group){const index={'hair-color':0,'hair-accent':1,'eye-color':2,'eye-color-right':3}[group];if(index===undefined)return;el(ColorTune.ids[index]).value=ColorTune.zero;el((index<2?'hair':'eye')+'-tune-target').value=String(index%2);}
 function swap(a,b){const value=el(ColorTune.ids[a]).value;el(ColorTune.ids[a]).value=el(ColorTune.ids[b]).value;el(ColorTune.ids[b]).value=value;}
 return {sync,preset,swap};
})();
