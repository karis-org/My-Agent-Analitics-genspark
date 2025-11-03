import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const factCheck = new Hono();

/**
 * Fact Check Page
 * 分析レポートのファクトチェックページ
 * GET /fact-check
 */
factCheck.get('/', authMiddleware, async (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ファクトチェック - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            .severity-info { @apply bg-blue-100 text-blue-800 border-blue-300; }
            .severity-warning { @apply bg-yellow-100 text-yellow-800 border-yellow-300; }
            .severity-error { @apply bg-red-100 text-red-800 border-red-300; }
            .confidence-high { @apply text-green-600; }
            .confidence-medium { @apply text-yellow-600; }
            .confidence-low { @apply text-red-600; }
        </style>
    </head>
    <body class="bg-gray-50">
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/app-icon.png" alt="Logo" class="h-10 w-10">
                        </a>
                        <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            ファクトチェック - 分析レポート検証
                        </h1>
                    </div>
                    <a href="/dashboard" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-arrow-left mr-2"></i>戻る
                    </a>
                </div>
            </div>
        </header>

        <main class="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Info Banner -->
            <div class="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-info-circle text-blue-400 text-xl"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-blue-700">
                            <span class="font-medium">ファクトチェックとは:</span>
                            AI分析レポートの内容を自動検証し、数値の妥当性、論理の一貫性、情報の完全性をチェックします。
                            信頼性の高いレポートを作成するための重要な機能です。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Input Form -->
            <div class="bg-white rounded-lg shadow p-8 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-file-alt mr-2 text-blue-600"></i>
                    分析レポートを入力
                </h2>
                
                <form id="fact-check-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            レポートタイトル <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="title" required placeholder="例: 渋谷区恵比寿マンション投資分析レポート"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            レポート本文 <span class="text-red-500">*</span>
                        </label>
                        <textarea id="content" required rows="12" placeholder="分析レポートの全文を貼り付けてください...&#10;&#10;例:&#10;物件名: ○○マンション&#10;購入価格: 4,500万円&#10;想定家賃収入: 月25万円（年間300万円）&#10;表面利回り: 6.67%&#10;...（続く）"
                                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"></textarea>
                        <p class="mt-1 text-xs text-gray-500">AIが生成した分析レポートの全文を貼り付けてください</p>
                    </div>
                    
                    <div class="bg-gray-50 border border-gray-200 rounded-lg p-4">
                        <div class="flex items-start">
                            <i class="fas fa-check-circle text-green-600 mt-1 mr-3"></i>
                            <div class="text-sm text-gray-700">
                                <p class="font-medium mb-2">検証項目</p>
                                <ul class="list-disc list-inside space-y-1 text-xs">
                                    <li>数値の妥当性（利回り、キャッシュフロー、投資指標等）</li>
                                    <li>論理の一貫性（主張と根拠の整合性）</li>
                                    <li>情報の完全性（必要な項目の記載漏れ）</li>
                                    <li>リスク評価の適切性（重要なリスクの言及）</li>
                                    <li>表現の正確性（誤解を招く表現の有無）</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-4">
                        <button type="button" onclick="history.back()" 
                                class="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" 
                                class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-search mr-2"></i>ファクトチェック開始
                        </button>
                    </div>
                </form>
            </div>

            <!-- Loading State -->
            <div id="loading" class="hidden">
                <div class="bg-white rounded-lg shadow p-12 text-center">
                    <i class="fas fa-spinner fa-spin text-5xl text-blue-600 mb-4"></i>
                    <p class="text-lg text-gray-700 font-medium mb-2">AI検証を実行中...</p>
                    <p class="text-sm text-gray-500">レポート内容を多角的に分析しています。しばらくお待ちください。</p>
                </div>
            </div>

            <!-- Results -->
            <div id="results" class="hidden space-y-6">
                <!-- Verification Status Card -->
                <div id="status-card" class="bg-white rounded-lg shadow-lg p-8">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">検証結果</h3>
                        <div class="flex items-center gap-3">
                            <span id="verification-badge" class="px-4 py-2 rounded-full text-sm font-semibold"></span>
                            <span id="confidence-score" class="text-3xl font-bold"></span>
                        </div>
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-600 mb-2">検証対象:</p>
                        <p id="target-title" class="text-lg font-semibold text-gray-900"></p>
                        <p class="text-xs text-gray-500 mt-1">検証日時: <span id="checked-at"></span></p>
                    </div>
                    
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div class="bg-blue-50 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600 mb-1">検証済み主張</p>
                            <p id="verified-claims-count" class="text-2xl font-bold text-blue-600">0</p>
                        </div>
                        <div class="bg-yellow-50 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600 mb-1">警告</p>
                            <p id="warnings-count" class="text-2xl font-bold text-yellow-600">0</p>
                        </div>
                        <div class="bg-green-50 rounded-lg p-4 text-center">
                            <p class="text-sm text-gray-600 mb-1">推奨事項</p>
                            <p id="recommendations-count" class="text-2xl font-bold text-green-600">0</p>
                        </div>
                    </div>
                </div>

                <!-- Warnings Section -->
                <div id="warnings-section" class="hidden bg-white rounded-lg shadow p-8">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fas fa-exclamation-triangle text-yellow-600"></i>
                        警告・注意事項
                    </h3>
                    <div id="warnings-list" class="space-y-4"></div>
                </div>

                <!-- Verified Claims Section -->
                <div id="claims-section" class="hidden bg-white rounded-lg shadow p-8">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fas fa-check-circle text-green-600"></i>
                        検証済み主張
                    </h3>
                    <div id="claims-list" class="space-y-3"></div>
                </div>

                <!-- Recommendations Section -->
                <div id="recommendations-section" class="hidden bg-white rounded-lg shadow p-8">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fas fa-lightbulb text-blue-600"></i>
                        改善推奨事項
                    </h3>
                    <div id="recommendations-list" class="space-y-3"></div>
                </div>

                <!-- Actions -->
                <div class="bg-gray-50 rounded-lg p-6 flex justify-center space-x-4">
                    <button onclick="window.print()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-print mr-2"></i>印刷
                    </button>
                    <button onclick="exportResults()" class="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-download mr-2"></i>結果をダウンロード
                    </button>
                    <button onclick="document.getElementById('fact-check-form').scrollIntoView({behavior: 'smooth'})" 
                            class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-redo mr-2"></i>新しい検証
                    </button>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let currentResults = null;

            document.getElementById('fact-check-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    title: document.getElementById('title').value,
                    content: document.getElementById('content').value,
                };
                
                // Show loading
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('results').classList.add('hidden');
                
                try {
                    const response = await axios.post('/api/properties/fact-check', formData);
                    currentResults = response.data;
                    
                    // Hide loading
                    document.getElementById('loading').classList.add('hidden');
                    
                    // Display results
                    displayResults(currentResults);
                    
                    // Show results section
                    document.getElementById('results').classList.remove('hidden');
                    document.getElementById('results').scrollIntoView({ behavior: 'smooth', block: 'start' });
                } catch (error) {
                    document.getElementById('loading').classList.add('hidden');
                    alert('ファクトチェック中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                    console.error('Fact check error:', error);
                }
            });
            
            function displayResults(result) {
                // Status Card
                const isVerified = result.isVerified;
                const confidenceScore = result.confidenceScore || 0;
                
                document.getElementById('target-title').textContent = document.getElementById('title').value;
                document.getElementById('checked-at').textContent = new Date(result.checkedAt).toLocaleString('ja-JP');
                
                // Verification Badge
                const verificationBadge = document.getElementById('verification-badge');
                if (isVerified) {
                    verificationBadge.textContent = '✓ 検証済み';
                    verificationBadge.className = 'px-4 py-2 rounded-full text-sm font-semibold bg-green-100 text-green-800';
                } else {
                    verificationBadge.textContent = '⚠ 要確認';
                    verificationBadge.className = 'px-4 py-2 rounded-full text-sm font-semibold bg-yellow-100 text-yellow-800';
                }
                
                // Confidence Score
                const confidenceSpan = document.getElementById('confidence-score');
                confidenceSpan.textContent = confidenceScore + '点';
                if (confidenceScore >= 80) {
                    confidenceSpan.className = 'text-3xl font-bold confidence-high';
                } else if (confidenceScore >= 60) {
                    confidenceSpan.className = 'text-3xl font-bold confidence-medium';
                } else {
                    confidenceSpan.className = 'text-3xl font-bold confidence-low';
                }
                
                // Counts
                document.getElementById('verified-claims-count').textContent = result.verifiedClaims?.length || 0;
                document.getElementById('warnings-count').textContent = result.warnings?.length || 0;
                document.getElementById('recommendations-count').textContent = result.recommendations?.length || 0;
                
                // Warnings
                if (result.warnings && result.warnings.length > 0) {
                    document.getElementById('warnings-section').classList.remove('hidden');
                    const warningsList = document.getElementById('warnings-list');
                    warningsList.innerHTML = result.warnings.map(warning => \`
                        <div class="border-l-4 p-4 rounded-r-lg severity-\${warning.severity}">
                            <div class="flex items-start">
                                <div class="flex-shrink-0">
                                    <i class="fas fa-exclamation-circle text-lg"></i>
                                </div>
                                <div class="ml-3 flex-1">
                                    <p class="font-semibold mb-1">\${warning.claim}</p>
                                    <p class="text-sm mb-2"><strong>問題:</strong> \${warning.issue}</p>
                                    <p class="text-sm"><strong>推奨:</strong> \${warning.suggestion}</p>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    document.getElementById('warnings-section').classList.add('hidden');
                }
                
                // Verified Claims
                if (result.verifiedClaims && result.verifiedClaims.length > 0) {
                    document.getElementById('claims-section').classList.remove('hidden');
                    const claimsList = document.getElementById('claims-list');
                    claimsList.innerHTML = result.verifiedClaims.map(claim => \`
                        <div class="flex items-start border-l-4 border-green-400 pl-4 py-2">
                            <i class="fas fa-check text-green-600 mt-1 mr-3"></i>
                            <div class="flex-1">
                                <p class="text-gray-700">\${claim.claim}</p>
                                <p class="text-xs text-gray-500 mt-1">検証方法: \${claim.verification}</p>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    document.getElementById('claims-section').classList.add('hidden');
                }
                
                // Recommendations
                if (result.recommendations && result.recommendations.length > 0) {
                    document.getElementById('recommendations-section').classList.remove('hidden');
                    const recommendationsList = document.getElementById('recommendations-list');
                    recommendationsList.innerHTML = result.recommendations.map(rec => \`
                        <div class="flex items-start border-l-4 border-blue-400 pl-4 py-2">
                            <i class="fas fa-lightbulb text-blue-600 mt-1 mr-3"></i>
                            <p class="text-gray-700 flex-1">\${rec}</p>
                        </div>
                    \`).join('');
                } else {
                    document.getElementById('recommendations-section').classList.add('hidden');
                }
            }
            
            function exportResults() {
                if (!currentResults) {
                    alert('エクスポートする結果がありません');
                    return;
                }
                
                const title = document.getElementById('title').value;
                const content = document.getElementById('content').value;
                
                const exportData = {
                    title: title,
                    content: content,
                    factCheckResult: currentResults,
                    exportedAt: new Date().toISOString()
                };
                
                const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = \`fact-check-\${title.replace(/\\s+/g, '-')}-\${new Date().toISOString().split('T')[0]}.json\`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        </script>
    </body>
    </html>
  `);
});

export default factCheck;
