/* Child-facing labels only. Palette IDs, swatches, saved selections and rendering stay unchanged. */
(()=>{
 const common={original:'はじめの いろ',black:'くろ',white:'しろ',red:'あか',blue:'あお',yellow:'きいろ',green:'みどり',purple:'むらさき',brown:'ちゃいろ',orange:'オレンジ',aqua:'みずいろ',navy:'こんいろ',grey:'はいいろ',silver:'ぎんいろ',pink:'ピンク',mint:'うすみどり',lavender:'うすむらさき'};
 const hair={...common,honey:'はちみついろ',dark_brown:'こげちゃ',light_brown:'あかるい ちゃいろ',blonde:'きんいろ'},eyes={...common,amber:'はちみついろ',rose:'こい ピンク'},outfit={...common,blue:'うすい あお',lemon:'うすい きいろ',beige:'うすい ちゃいろ'};
 for(const [palette,names,groups] of [[KIT_HAIR.palette,hair,['hair-color','hair-accent']],[KIT_EYES.palette,eyes,['eye-color','eye-right','eye-color-right']],[KIT_OUTFIT.palette,outfit,['outfit-color','bottom-color']]]){
  for(const color of palette)if(names[color.id])color.name=names[color.id];
  for(const group of groups){const select=document.getElementById(group);if(select?.options)for(const option of select.options)if(names[option.value])option.textContent=names[option.value];
   for(const color of palette){const radio=document.getElementById(group+'-'+color.id),label=radio?.closest('label')?.querySelector('.color-swatch')?.nextElementSibling;if(label)label.textContent=color.name;}
  }
 }
 const text=(selector,value)=>{const e=document.querySelector(selector);if(e)e.textContent=value;};
 for(const [selector,value] of Object.entries({'.hair-colors > legend':'かみの いろ','.eye-colors > legend':'めの いろ','.outfit-colors > legend':'うえの ふくの いろ','.bottom-colors > legend':'したの ふくの いろ','label[for="hair-pattern"]':'いろの つけかた','label[for="eye-mode"]':'めの いろの つけかた','#hair-accent-panel > p':'もうひとつの いろ','#eye-right-panel > p':'がめんの みぎの め','#hair-colors-swap':'ふたつの いろを いれかえる','#eye-colors-swap':'ひだりと みぎの いろを いれかえる'}))text(selector,value);
 for(const [id,names] of [['hair-pattern',{none:'ひとつの いろにする',tips:'かみの さきだけ いろを かえる',gradient:'だんだん いろを かえる',split:'ひだりと みぎで いろを かえる'}],['eye-mode',{same:'りょうめを おなじ いろにする',odd:'ひだりと みぎを ちがう いろにする'}]])for(const option of document.getElementById(id).options)option.textContent=names[option.value];
})();
