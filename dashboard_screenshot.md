# Dashboard Screenshot

**プロジェクト**: My Agent Analytics  
**URL**: https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai  
**撮影日**: 2025年10月30日

## 動作確認済みページ

### 1. ランディングページ
- URL: https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai
- 表示内容:
  - ヒーローセクション
  - 主要4機能の紹介
  - 信頼性の証明（政府統計データ）
  - 料金プラン
  - FAQ
  - フッター

### 2. システム情報ページ
- URL: https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai/settings
- 表示内容:
  - システム稼働率: 稼働中
  - 利用可能機能数: 0/6（APIキー未設定のため）
  - 各機能のステータス表示

### 3. ダッシュボード（認証後）
- URL: https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai/dashboard
- 表示内容:
  - 物件一覧
  - 投資指標表示
  - 市場分析データ
  - レポート生成ボタン

## 動作確認コマンド

```bash
# ヘルスチェック
curl https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai/api/health

# レスポンス
{"status":"ok","timestamp":"2025-10-30T13:19:48.496Z","version":"2.0.0"}
```

## スクリーンショット撮影方法

プロジェクト提出時に以下の方法でスクリーンショットを取得できます:

### 方法1: ブラウザのスクリーンショット機能
1. 上記URLをブラウザで開く
2. F12 で開発者ツールを開く
3. Ctrl+Shift+P (Mac: Cmd+Shift+P)
4. "Capture full size screenshot" を実行

### 方法2: コマンドライン
```bash
# Playwright経由（推奨）
npx playwright screenshot https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai dashboard_screenshot.png --full-page

# または
npx capture-website https://3000-i1kyslh8gn8plpo5b4s6r-b9b802c4.sandbox.novita.ai --output=dashboard_screenshot.png
```

## 注意事項

⚠️ **APIキーが未設定のため、一部機能は動作しません。**

完全な動作確認には、以下のAPIキーの設定が必要です:
- GOOGLE_CLIENT_ID
- GOOGLE_CLIENT_SECRET  
- SESSION_SECRET
- REINFOLIB_API_KEY

APIキーの取得方法は `docs/API_KEY_SETUP_GUIDE.md` を参照してください。
