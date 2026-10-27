/* Link the first drill to the eye shape currently selected in the workshop. */
window.PracticeDrillUI=(()=>{
 const section=document.createElement('section');section.className='practice-drill-entry';section.style.cssText='padding:18px;margin:18px 0;background:#eef5f1;border:1px solid #cdddce;border-radius:14px';
 section.innerHTML='<h3>なぞって<ruby>描<rt>か</rt></ruby>く ドリル</h3><p>番号と矢印で かく順番を見て、なぞって れんしゅうしよう。</p><p><a class="button" id="eye-drill-open" href="practice/eyes/?v=156"><ruby>目<rt>め</rt></ruby>の<ruby>練習<rt>れんしゅう</rt></ruby>ドリルを ひらく</a></p><p><a class="button" id="face-drill-open" href="practice/face/?v=157">顔の<ruby>輪郭<rt>りんかく</rt></ruby>と<ruby>耳<rt>みみ</rt></ruby>の練習を ひらく</a></p><p class="small">PNG・PSDでほぞん・紙に<ruby>印刷<rt>いんさつ</rt></ruby>して練習できます。</p>';
 document.getElementById('pane-draw').prepend(section);
 function sync(s){document.getElementById('eye-drill-open').href='practice/eyes/?v=156&style='+encodeURIComponent(s.eyeStyle);}
 return {sync};
})();
