/* Preserve the original wording and add readings to the color controls, including dynamic notes. */
(()=>{
 const readings={'大':'おお','小':'ちい','細':'ほそ','太':'ふと','無地':'むじ','水玉':'みずたま','花柄':'はながら','布地':'ぬのじ','柄':'がら','色見本':'いろみほん','見本':'みほん','調整中':'ちょうせいちゅう','調整':'ちょうせい','基本':'きほん','追加':'ついか','両目':'りょうめ','画面':'がめん','左右':'さゆう','毛先':'けさき','全体':'ぜんたい','別々':'べつべつ','線画':'せんが','手本':'てほん','金髪':'きんぱつ','水色':'みずいろ','茶色':'ちゃいろ','黄色':'きいろ','同じ':'おなじ','少し':'すこし','明':'あか','暗':'くら','戻':'もど','丸':'まる','別':'べつ','色':'いろ','服':'ふく','目':'め','左':'ひだり','右':'みぎ','上':'うえ','下':'した','入':'い','方':'かた','分':'わ','足':'た','見':'み','線':'せん','金':'きん','茶':'ちゃ','白':'しろ','赤':'あか','青':'あお','紺':'こん','緑':'みどり','紫':'むらさき','黄':'き','黒':'くろ','前':'まえ'};
 const pattern=new RegExp(Object.keys(readings).sort((a,b)=>b.length-a.length).join('|'),'g'),optionText=new WeakMap();
 function annotate(root){
  // Native select options cannot render ruby; their readings are shown in parentheses.
  for(const option of root.querySelectorAll('option')){const raw=option.textContent;if(optionText.get(option)===raw)continue;pattern.lastIndex=0;const reading=raw.replace(pattern,word=>readings[word]);const text=reading===raw?raw:raw+'（'+reading+'）';optionText.set(option,text);if(text!==raw)option.textContent=text;}
  const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT),nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
  for(const node of nodes){if(node.parentElement.closest('ruby,rt,select,option,script,style'))continue;const raw=node.textContent;pattern.lastIndex=0;if(!pattern.test(raw))continue;pattern.lastIndex=0;const fragment=document.createDocumentFragment();let at=0;for(const match of raw.matchAll(pattern)){fragment.append(raw.slice(at,match.index));const ruby=document.createElement('ruby'),rt=document.createElement('rt');ruby.append(match[0]);rt.textContent=readings[match[0]];ruby.append(rt);fragment.append(ruby);at=match.index+match[0].length;}fragment.append(raw.slice(at));node.replaceWith(fragment);}
 }
 const roots=[...document.querySelectorAll('.hair-colors,.eye-colors,.outfit-colors,.bottom-colors,[id^=outfit-description-]')];
 for(const root of roots){annotate(root);new MutationObserver(()=>annotate(root)).observe(root,{subtree:true,childList:true,characterData:true});}
})();
