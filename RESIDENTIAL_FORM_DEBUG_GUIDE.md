# 実需用物件評価フォーム リセット問題 デバッグガイド

## 現象
実需用物件評価フォームで「評価を実行」ボタンをクリックすると、フォームがリセットされて評価が実行されない。

## 原因調査のための情報収集

### ステップ1: ブラウザコンソールを開く
1. ブラウザで https://d8221925.my-agent-analytics.pages.dev/ にアクセス
2. **F12キー**（Windows/Linux）または **Cmd+Option+I**（Mac）を押す
3. 「Console」タブをクリック

### ステップ2: コンソールをクリア
1. コンソール内で右クリック
2. 「Clear console」を選択（または Ctrl+L / Cmd+K）

### ステップ3: 実需用不動産評価ページに移動
1. 左サイドバーから「実需用不動産評価」をクリック
2. コンソールに`[Residential] Page loaded`というメッセージが表示されることを確認

### ステップ4: フォームに入力
1. 物件名: テスト物件
2. 所在地: 東京都渋谷区
3. 専有面積: 65
4. 築年数: 10
5. 駅距離: 5

### ステップ5: 「評価を実行」ボタンをクリック
1. ボタンをクリック
2. **何が起きるか観察**:
   - フォームがリセットされるか？
   - ページがリロードされるか？
   - エラーメッセージが表示されるか？

### ステップ6: コンソールログを確認
コンソールに以下のようなメッセージが表示されるはずです：

#### 正常な場合:
```
[Residential] Evaluate button clicked
[Residential] Evaluation methods: ['comparison', 'cost', 'trend', 'asset']
[Residential] Target property: {name: 'テスト物件', area: 65, age: 10, ...}
[Auto-fetch] Comparables: [...]
[Residential] API response: {success: true, ...}
```

#### エラーが発生している場合:
```
[Residential] Evaluate button clicked
[Residential] Evaluation error: ...
[Residential] Error stack: ...
```

#### ボタンイベントが登録されていない場合:
```
（何も表示されない、または）
[Residential] Evaluate button not found!
```

### ステップ7: ネットワークタブを確認
1. コンソールの隣の「Network」タブをクリック
2. 「評価を実行」ボタンをもう一度クリック
3. `/api/properties/residential/evaluate` というリクエストが送信されるか確認
4. リクエストが送信されている場合:
   - ステータスコード（200, 400, 500など）
   - レスポンス内容（Preview/Response タブ）

### ステップ8: 情報をスクリーンショットで保存
以下を含むスクリーンショットを撮影してください：
1. **Consoleタブ全体**（すべてのログメッセージ）
2. **Networkタブ**（/api/properties/residential/evaluate リクエスト）
3. **フォームの状態**（リセット後の画面）

## よくある原因と対処法

### 原因1: JavaScriptエラー
**症状**: コンソールに赤いエラーメッセージが表示される
**対処法**: エラーメッセージ全体をコピーして報告してください

### 原因2: ネットワークエラー
**症状**: Network タブで赤い×印のリクエストが表示される
**対処法**: リクエストをクリックして「Response」タブの内容を確認

### 原因3: イベントリスナーが登録されていない
**症状**: ボタンをクリックしても何も起きない（コンソールに何も表示されない）
**対処法**: ページを再読み込み（Ctrl+R / Cmd+R）して再試行

### 原因4: APIレスポンスが遅い
**症状**: 「評価を実行」後、長時間「読み込み中」が表示される
**対処法**: ネットワークタブで `/api/properties/residential/evaluate` のステータスを確認

### 原因5: フォーム送信が発生している（ページリロード）
**症状**: ボタンクリック直後にページ全体がリロードされる
**対処法**: 
1. Consoleタブで「Preserve log」にチェックを入れる
2. もう一度「評価を実行」ボタンをクリック
3. ページリロード前のログを確認

## 開発者向け追加デバッグ情報

### 想定される問題箇所
1. **residential.tsx Line 452-616**: Evaluate button click handler
2. **residential.tsx Line 445-448**: DOMContentLoaded event listener
3. **api.tsx Line 376-430**: Residential evaluation API endpoint

### 確認すべきポイント
- [ ] `DOMContentLoaded`イベントが発火しているか
- [ ] `evaluateButton`要素が存在するか（`document.getElementById('evaluateButton')`）
- [ ] `e.preventDefault()`が実行されているか
- [ ] API リクエストが正常に送信されているか
- [ ] API レスポンスが正常に返ってきているか
- [ ] `displayResults()`関数が正常に実行されているか

### 直接デバッグコマンド（Consoleで実行）
```javascript
// ボタンが存在するか確認
document.getElementById('evaluateButton')

// イベントリスナーが登録されているか確認（Chrome DevTools）
getEventListeners(document.getElementById('evaluateButton'))

// フォーム要素を確認
document.querySelector('form')
```

## 報告フォーマット
以下の情報を含めて報告してください：

```
【ブラウザ情報】
- ブラウザ名: Chrome / Firefox / Safari
- バージョン: 
- OS: Windows / Mac / Linux

【再現手順】
1. 実需用不動産評価ページにアクセス
2. フォームに入力（具体的な値を記載）
3. 「評価を実行」ボタンをクリック

【観察された現象】
- フォームがリセットされた / ページがリロードされた / エラーが表示された
- その他: 

【Consoleログ】
（スクリーンショットまたはテキストでログをコピー）

【Networkタブ】
- /api/properties/residential/evaluate のステータス: 
- レスポンス内容: 

【スクリーンショット】
（添付）
```

## 次のステップ
上記の情報を収集後、以下のいずれかの方法で報告してください：
1. GitHub Issueを作成
2. メールで開発チームに送信
3. チャットで直接報告

この情報を元に、開発チームが根本原因を特定し、修正を行います。
