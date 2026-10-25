/* Seven motif samples and independent motif colors for top and bottom garments. */
window.FabricPatternsUI=(()=>{
 const el=id=>document.getElementById(id),groups=['outfit','bottom'];
 for(const [i,group] of groups.entries()){
  const details=document.createElement('details');details.className='fabric-patterns';details.id=group+'-pattern-editor';details.innerHTML='<summary>服の柄を えらぶ</summary><div class="fabric-pattern-grid" role="group" aria-label="服の柄"></div><fieldset class="fabric-pattern-colors"><legend>柄の色</legend><div class="color-grid"></div></fieldset><p class="small">布地の 柄と色を えらぼう。無地にも 戻せるよ。</p>';
  for(const [j,id] of FabricPatterns.ids.slice(i*2,i*2+2).entries()){const input=document.createElement('input');input.type='hidden';input.id=id;input.value=FabricPatterns.defaults[i*2+j];details.appendChild(input);}
  for(const k of FabricPatterns.kinds){const button=document.createElement('button');button.type='button';button.className='fabric-pattern-choice';button.dataset.pattern=k.id;button.setAttribute('aria-pressed',String(k.id==='none'));const canvas=document.createElement('canvas');canvas.width=144;canvas.height=88;canvas.setAttribute('aria-hidden','true');const label=document.createElement('span');label.textContent=k.name;button.append(canvas,label);button.addEventListener('click',()=>{el(group+'-pattern').value=k.id;update();});details.querySelector('.fabric-pattern-grid').appendChild(button);}
  for(const c of KIT_OUTFIT.palette.filter(c=>c.id!=='original')){const label=document.createElement('label');label.className='color-choice';label.innerHTML=`<input type="radio" name="${group}-pattern-color-choice" value="${c.id}" id="${group}-pattern-color-${c.id}"><span class="color-choice-content"><span class="color-swatch" style="background:${c.swatch}"></span><span>${c.name}</span><span class="color-check" aria-hidden="true">✓</span></span>`;label.querySelector('input').addEventListener('change',e=>{if(e.target.checked){el(group+'-pattern-color').value=c.id;update();}});details.querySelector('.color-grid').appendChild(label);}
  document.querySelector('.'+group+'-colors').appendChild(details);
 }
 function sync(s){for(const [i,group] of groups.entries()){
  const root=el(group+'-pattern-editor'),kind=el(group+'-pattern').value,patternColor=el(group+'-pattern-color').value,color=KIT_OUTFIT.palette.find(c=>c.id===patternColor)?.swatch||'#4d6089',base=el(group+'-color').value;
  const hex=base==='original'?(i===0?KIT_OUTFIT.originalSwatches[s.outfit]:KIT_CLOTHING.bottoms[s.bottom].swatch||'#fbead2'):KIT_OUTFIT.palette.find(c=>c.id===base)?.swatch;
  const fill=FabricPatterns.swatch(hex||'#dac5ec',s.tunes[4+i]);
  root.querySelector('summary').textContent='服の柄（'+FabricPatterns.kinds.find(k=>k.id===kind).name+'）';
  root.querySelector('.fabric-pattern-colors').hidden=kind==='none';
  for(const button of root.querySelectorAll('.fabric-pattern-choice')){button.setAttribute('aria-pressed',String(button.dataset.pattern===kind));const canvas=button.querySelector('canvas'),ctx=canvas.getContext('2d');ctx.clearRect(0,0,144,88);ctx.fillStyle=fill;ctx.fillRect(0,0,144,88);FabricPatterns.paint(ctx,button.dataset.pattern,color,0,0,144,88);}
  for(const radio of root.querySelectorAll('input[type=radio]'))radio.checked=radio.value===patternColor;
 }}
 return {sync};
})();
