# 選択UIのルール v169

子どもが選択肢の存在に気づけるよう、利用者にプルダウンを表示しない。新しい選択UIも、候補が見えるボタン・ラジオ・タブを使う。選択済みを明示し、タッチ対象は44px以上とする。

exposed-choices-v169.jsは元selectを既存状態・イベント用アダプターとして残し、候補をボタンへ変換する。内部状態用aria-hidden selectは対象外。アプリのhidden/disabled/option更新・選択状態を同期し、元change/inputを発火する。固定画面のルート指定はselectの代わりに対応ボタングループを表示。

工房（スマートフォンの従来表示も含む）と目/輪郭/配置の3教材に適用。教材の描画・PNG/PSD/印刷は既存処理を使用。画面に表示されるselectは0。

QA:work/exposed-choices-v169/check.cjsで4ページselect可視0、髪色パターン/追加色/ぬり絵mode/教材シート種別/白黒のボタン選択を検証。work/tablet-layout-v168/check2.cjsで4サイズ全ルートoverflow0/空画面0。条件付きで隠れている設定にもボタンを準備し、表示条件に連動。
