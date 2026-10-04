GLORiOSA Event Display - iPad PWA v2

【目的】
iPad Pro 11インチを縦置きし、ネット環境なしのイベント会場で
お品書き自動デモ・同人誌プレビュー・見本誌閲覧・グッズ拡大を行うPWA版です。

【重要】
file:// で直接 index.html を開く方法では、ホーム画面アプリ化・Service Workerのオフライン機能は使えません。
GitHub PagesなどHTTPSで公開してSafariから開いてください。

【iPadへの導入】
1. このフォルダをGitHub Pagesへアップロード。
2. iPadをWi-Fiへ接続しSafariでページを開く。
3. 管理画面 > iPad > 「オフライン用PDF機能を準備」を押す。
4. Safariの共有 > 「ホーム画面に追加」。
5. ホーム画面のGLORiOSAアイコンから起動。
6. 管理画面から本・PDF・画像・イベント情報を登録。
7. 「保存領域を保護」を押す。
8. 機内モードにし、アプリを終了→再起動してデモ・PDF閲覧を確認。

【iPad Pro 11インチ向け】
CSS表示は端末サイズへ自動フィットします。PDF表示はdevicePixelRatioを利用するため、
834×1194 CSS px / DPR 2 の端末では1668×2388相当を基準にレンダリングします。
「iPadトーン補正」と「高精細モード」はブラウザ版から引き継いでいます。

【PDF.jsについて】
PDF.jsは初回Wi-Fi接続時にCDNから取得し、Service Workerへキャッシュします。
イベント前に必ず「オフライン用PDF機能を準備」を実行し、機内モードでPDFを開けることを確認してください。

【データ保存】
設定: localStorage
登録画像/PDF: IndexedDB
端末側のWebサイトデータを削除すると消える可能性があるため、イベント前にデータ確認を推奨します。

Build: iPad PWA v2.0

【v2変更点】
・紹介カードの既定サイズをiPad縦画面幅の78%に拡大。
・管理画面 > デモ設定 > お品書き から60〜85%で調整可能。
・カードの縦寸法も同比率で拡大し、最大で画面高さの約82%に収まるよう自動調整。
・横画面用レイアウトは対象外。manifestのorientationはportrait固定。
