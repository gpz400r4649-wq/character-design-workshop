# v141 工房本体への靴組み込み
- 採用素材/靴_確定版_2026-10-26の7PNGをassets/footwear-v141へ無加工コピー。manifest SHA256一致検証済み。原本は維持。
- 服の内側タブをトップス/ボトムス/靴に。元のストラップ靴+確定7種類。独立shoe選択、端末保持、お気に入り（旧データはoriginal）、PNG/PSD filenameに反映。
- footwear-v141.jsはSkinKit.apply後のbody_base/body_extensionを動的にマスク（x630..1460,y1800以降）し、元の上部を残す。確定脚PNGは上部の白い旧裾を隠すためy1795より上を表示せず、衣服より後ろ・既存体より前に同じ2048x3072座標で重ねる。geometry変更なし。
- 肌の色は元の体の肌medianへ、確定PNGの肌maskのみRGB差分で連動。脚の長さ/靴の色/靴形は保持。靴自体の色編集機能は今回追加していない。
- HairMix.runtimeLayerを公開し既存PSD materialize/snapshotを使う。lineart/space/silhouette guideのベースにshoeを渡す。HairMix.reference最終引数shoe。
- 選択元のテンプレートを壊さず、靴用templateとvisibleを複製。originalは従来の経路を保持。
- 確認: 全7種類、肌tone5・original、ワイド/ショートパンツの重なり、既存/新お気に入り、reload保持、PNG/PSDの実保存、PNGとPSD合成の全画素一致、lineartにブーツ反映、390px横はみ出しなし、page errorなし。ショートパンツと脚の隙間も視認確認。
- ローカルレビュー: http://127.0.0.1:8767/index.html?v=141&shoe=long_boots
