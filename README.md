# みんはやOCR問題リーダー

GitHub Pages に配置できる、Vanilla JavaScript + Vite の静的アプリです。

## ローカル起動

`index.html` をエクスプローラーからダブルクリックして直接起動できます。直接起動用の `direct-app.js` と `direct-app.css` はビルド時に自動生成されます。

```bash
npm install
npm run build
```

ビルド後に `index.html` を開いてください。開発中に自動更新を使う場合は、引き続きViteの開発サーバーを利用できます。

```bash
npm run dev
```

表示された `http://localhost:5173/` または別ポートのURLをブラウザで開きます。

## GitHub Pages

1. GitHub リポジトリの Pages 設定で Source を `GitHub Actions` にする
2. `main` ブランチへ push する
3. `.github/workflows/deploy-pages.yml` が `dist` をビルドして公開する

## OCR設定

右上の歯車から、次のAPIキーを個別に設定できます。

- `Google Cloud Vision API Key`: 画像から文字を抽出します。実OCRに必須です。
- `Gemini API Key`: Gemini 3.6 FlashでOCR結果の誤認識を補正し、問題・解答・ジャンルを構造化します。任意です。

複数画像を選択した場合、Vision OCRは最大16画像ずつ一括送信し、OCR本文を最大8問ずつGeminiで補正します。Geminiには画像ではなくVisionのOCR本文を問題ID付きで渡すため、画像と結果の対応を維持できます。Geminiの応答はJSONスキーマ、件数、ID、ジャンル候補で検証されます。

一時的な通信エラー、HTTP 429、5xxは自動再試行します。Geminiの応答形式が不正な場合はバッチを分割して再試行し、それでも失敗した問題だけ正規表現による一次解析へフォールバックします。Visionで個別画像に失敗した場合は他の画像を継続し、失敗した画像は待機リストに残ります。処理済みの結果はバッチごとに保存されます。

Geminiキーを設定しない場合でも、Vision OCRと正規表現による一次解析は実行できます。どちらのキーも未設定の場合はデモOCRになります。

### Google Cloud Visionの準備

1. Google Cloudプロジェクトを作成します。
2. Cloud Vision APIを有効化します。
3. APIキーを作成します。
4. APIキーにHTTPリファラー制限、API制限、利用量上限を設定します。
5. アプリの設定画面へキーを入力します。

### Geminiの準備

1. Google AI StudioでGemini APIキーを作成します。
2. 利用量上限を設定します。
3. アプリの設定画面へキーを入力します。

### セキュリティ上の注意

このGitHub Pages版はブラウザからGoogle APIを直接呼び出します。そのため、入力したAPIキーはIndexedDB、開発者ツール、通信ログなどから利用者に確認できます。公開サイトや共有端末で秘密情報として扱うことはできません。

個人利用に限定し、APIキーのリファラー制限・API制限・利用量上限を必ず設定してください。公開サービスとして運用する場合は、APIキーをサーバー環境変数で管理するCORS対応の外部バックエンド方式を推奨します。
