/* One compact editor per category; the selected colors keep independent adjustments. */
window.ColorTuneUI=(()=>{
 const el=id=>document.getElementById(id),groups={hair:[0,1],eye:[2,3]};let timer;
 for(const [group,indices] of Object.entries(groups)){
  const root=document.querySelector(group==='hair'?'.hair-colors':'.eye-colors'),details=document.createElement('details');details.className='color-tune';details.id=group+'-tune-editor';
  details.innerHTML=`<summary>色を 微調整する</summary><label for="${group}-tune-target">調整する 色</label><select id="${group}-tune-target"><option value="0">${group==='hair'?'基本の色':'両目の色'}</option><option value="1">${group==='hair'?'追加の色':'画面の右の目'}</option></select>`;
  for(const [i,label] of ['色あい','あざやかさ','明るさ'].entries()){
   const row=document.createElement('div');row.className='tune-row';row.innerHTML=`<label for="${group}-tune-${i}">${label} <output id="${group}-tune-value-${i}">0</output></label><input type="range" id="${group}-tune-${i}" min="${-ColorTune.limits[i]}" max="${ColorTune.limits[i]}" step="1" value="0">`;details.appendChild(row);
   const input=row.querySelector('input');
   const change=immediate=>{const key=indices[Number(el(group+'-tune-target').value)],id=ColorTune.ids[key],values=ColorTune.parse(el(id).value);values[i]=Number(input.value);el(id).value=ColorTune.text(values);el(group+'-tune-value-'+i).textContent=values[i]>0?'+'+values[i]:String(values[i]);clearTimeout(timer);if(immediate)update();else timer=setTimeout(()=>update(),180);};
   input.addEventListener('input',()=>change(false));input.addEventListener('change',()=>change(true));
  }
  const reset=document.createElement('button');reset.type='button';reset.textContent='この色の 調整を 戻す';reset.id=group+'-tune-reset';reset.addEventListener('click',()=>{clearTimeout(timer);el(ColorTune.ids[indices[Number(el(group+'-tune-target').value)]]).value=ColorTune.zero;update();});details.appendChild(reset);
  const hint=document.createElement('p');hint.className='small';hint.textContent='色を えらんでから、スライダーで 調整しよう。別の 色見本を えらぶと、その色の 調整は 戻るよ。';details.appendChild(hint);
  for(const index of indices){const input=document.createElement('input');input.type='hidden';input.id=ColorTune.ids[index];input.value=ColorTune.zero;details.appendChild(input);}
  root.querySelector('.color-grid').after(details);el(group+'-tune-target').addEventListener('change',()=>sync(selection()));
 }
 function sync(s){
  for(const [group,indices] of Object.entries(groups)){
   const target=el(group+'-tune-target'),second=group==='hair'?s.pattern!=='none':s.eyeMode==='odd';target.options[1].disabled=!second;if(!second)target.value='0';
   if(group==='eye')target.options[0].textContent=second?'画面の左の目':'両目の色';
   const values=ColorTune.parse(el(ColorTune.ids[indices[Number(target.value)]]).value);
   values.forEach((value,i)=>{el(group+'-tune-'+i).value=value;el(group+'-tune-value-'+i).textContent=value>0?'+'+value:String(value);});
   const tuned=ColorTune.active(el(ColorTune.ids[indices[0]]).value)||(second&&ColorTune.active(el(ColorTune.ids[indices[1]]).value));el(group+'-tune-editor').querySelector('summary').textContent='色を 微調整する'+(tuned?'（調整中）':'');
  }
 }
 function preset(group){const index={'hair-color':0,'hair-accent':1,'eye-color':2,'eye-color-right':3}[group];if(index===undefined)return;el(ColorTune.ids[index]).value=ColorTune.zero;el((index<2?'hair':'eye')+'-tune-target').value=String(index%2);clearTimeout(timer);}
 function swap(a,b){const value=el(ColorTune.ids[a]).value;el(ColorTune.ids[a]).value=el(ColorTune.ids[b]).value;el(ColorTune.ids[b]).value=value;clearTimeout(timer);}
 return {sync,preset,swap};
})();
