import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const stigma = new Hono();

/**
 * Stigmatized Property Check Page
 * 事故物件（心理的瑕疵）調査ページ
 * GET /stigma/check
 */
stigma.get('/check', authMiddleware, async (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>事故物件調査 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            .risk-badge-none { @apply bg-green-100 text-green-800; }
            .risk-badge-low { @apply bg-blue-100 text-blue-800; }
            .risk-badge-medium { @apply bg-yellow-100 text-yellow-800; }
            .risk-badge-high { @apply bg-red-100 text-red-800; }
        </style>
    </head>
    <body class="bg-gray-50">
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-12 w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent">
                            事故物件（心理的瑕疵）調査
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
                            <span class="font-medium">事故物件（心理的瑕疵）とは:</span>
                            過去に自殺、他殺、孤独死、火災などの事件・事故があった物件のことです。
                            購入前に事前調査を行うことで、後のトラブルを避けることができます。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Search Form -->
            <div class="bg-white rounded-lg shadow p-8 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-search mr-2 text-red-600"></i>
                    物件情報を入力
                </h2>
                
                <form id="stigma-form" class="space-y-6">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            住所 <span class="text-red-500">*</span>
                        </label>
                        <input type="text" id="address" required placeholder="例: 東京都渋谷区恵比寿1-1-1"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <p class="mt-1 text-xs text-gray-500">できるだけ詳細な住所を入力してください</p>
                    </div>
                    
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-2">
                            物件名（任意）
                        </label>
                        <input type="text" id="propertyName" placeholder="例: 恵比寿マンション"
                               class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        <p class="mt-1 text-xs text-gray-500">マンション名・ビル名がある場合は入力してください</p>
                    </div>
                    
                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div class="flex items-start">
                            <i class="fas fa-exclamation-triangle text-yellow-600 mt-1 mr-3"></i>
                            <div class="text-sm text-yellow-800">
                                <p class="font-medium mb-1">調査範囲について</p>
                                <ul class="list-disc list-inside space-y-1 text-xs">
                                    <li>Google News、Yahoo!ニュースなどのオンラインニュース</li>
                                    <li>事故物件公示サイト（大島てる等）</li>
                                    <li>警察庁・消防庁の統計情報</li>
                                    <li>その他公開情報</li>
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
                                class="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-search mr-2"></i>調査を開始
                        </button>
                    </div>
                </form>
            </div>

            <!-- Loading State -->
            <div id="loading" class="hidden">
                <div class="bg-white rounded-lg shadow p-12 text-center">
                    <i class="fas fa-spinner fa-spin text-5xl text-blue-600 mb-4"></i>
                    <p class="text-lg text-gray-700 font-medium mb-2">AI調査を実行中...</p>
                    <p class="text-sm text-gray-500">複数の情報源を確認しています。しばらくお待ちください。</p>
                </div>
            </div>

            <!-- Results -->
            <div id="results" class="hidden space-y-6">
                <!-- Risk Level Card -->
                <div id="risk-card" class="bg-white rounded-lg shadow-lg p-8">
                    <div class="flex items-center justify-between mb-6">
                        <h3 class="text-2xl font-bold text-gray-900">調査結果</h3>
                        <span id="risk-badge" class="px-4 py-2 rounded-full text-sm font-semibold"></span>
                    </div>
                    
                    <div class="mb-6">
                        <p class="text-gray-600 mb-2">調査対象:</p>
                        <p id="target-address" class="text-lg font-semibold text-gray-900"></p>
                        <p id="target-property" class="text-md text-gray-700"></p>
                    </div>
                    
                    <div class="border-t pt-6">
                        <h4 class="font-semibold text-gray-900 mb-3">総合評価</h4>
                        <p id="summary" class="text-gray-700 whitespace-pre-line leading-relaxed"></p>
                    </div>
                </div>

                <!-- Findings -->
                <div id="findings-section" class="hidden bg-white rounded-lg shadow p-8">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fas fa-exclamation-circle text-red-600"></i>
                        発見された情報
                    </h3>
                    <div id="findings-list" class="space-y-4"></div>
                </div>

                <!-- Sources Checked -->
                <div class="bg-white rounded-lg shadow p-8">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fas fa-database text-blue-600"></i>
                        確認した情報源
                    </h3>
                    <div id="sources-list" class="grid md:grid-cols-2 gap-4"></div>
                </div>

                <!-- Recommended Actions -->
                <div id="recommended-actions" class="bg-white rounded-lg shadow p-8">
                    <h3 class="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                        <i class="fas fa-clipboard-list text-green-600"></i>
                        推奨アクション
                    </h3>
                    <div id="actions-content">
                        <!-- Default content: Cost information -->
                        <div class="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-lg">
                            <h4 class="font-semibold text-blue-900 mb-3">
                                <i class="fas fa-file-alt mr-2"></i>重要事項調査報告書の取得
                            </h4>
                            <p class="text-blue-800 mb-4">
                                物件購入前に、管理会社から重要事項調査報告書を取得することを強く推奨します。
                                この報告書には、過去の事故や修繕履歴、管理状況などの重要情報が含まれます。
                            </p>
                            <div class="bg-white p-4 rounded border border-blue-200">
                                <div class="flex items-start gap-3">
                                    <i class="fas fa-yen-sign text-blue-600 text-xl mt-1"></i>
                                    <div>
                                        <p class="font-medium text-gray-900 mb-1">調査費用の目安</p>
                                        <p class="text-gray-700 text-sm mb-2">
                                            <span class="font-semibold text-blue-600">22,000〜55,000円/戸</span>
                                            <span class="text-gray-600">（管理会社により異なります）</span>
                                        </p>
                                        <p class="text-sm text-gray-600">
                                            <i class="fas fa-info-circle mr-1"></i>
                                            詳細な費用については、調査対象の建物管理会社にお問い合わせください。
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Actions -->
                <div class="bg-gray-50 rounded-lg p-6 flex justify-center space-x-4">
                    <button onclick="window.print()" class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-print mr-2"></i>印刷
                    </button>
                    <button onclick="document.getElementById('stigma-form').scrollIntoView({behavior: 'smooth'})" 
                            class="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-redo mr-2"></i>新しい調査
                    </button>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('stigma-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    address: document.getElementById('address').value,
                    propertyName: document.getElementById('propertyName').value || undefined,
                };
                
                // Show loading
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('results').classList.add('hidden');
                
                try {
                    const response = await axios.post('/api/properties/stigma-check', formData);
                    const result = response.data;
                    
                    displayResults(result);
                } catch (error) {
                    console.error('Stigma check failed:', error);
                    alert('調査の実行に失敗しました。もう一度お試しください。');
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            });
            
            function displayResults(result) {
                document.getElementById('results').classList.remove('hidden');
                
                // Risk level badge
                const riskBadge = document.getElementById('risk-badge');
                const riskLevels = {
                    'none': { text: 'リスクなし', class: 'risk-badge-none' },
                    'low': { text: '低リスク', class: 'risk-badge-low' },
                    'medium': { text: '中リスク', class: 'risk-badge-medium' },
                    'high': { text: '高リスク', class: 'risk-badge-high' }
                };
                const riskInfo = riskLevels[result.riskLevel] || riskLevels['none'];
                riskBadge.textContent = riskInfo.text;
                riskBadge.className = \`px-4 py-2 rounded-full text-sm font-semibold \${riskInfo.class}\`;
                
                // Target info
                document.getElementById('target-address').textContent = result.address || document.getElementById('address').value;
                const propertyName = result.propertyName || document.getElementById('propertyName').value;
                if (propertyName) {
                    document.getElementById('target-property').textContent = \`物件名: \${propertyName}\`;
                }
                
                // Summary
                document.getElementById('summary').textContent = result.summary || '調査結果の概要はありません。';
                
                // Findings
                if (result.findings && result.findings.length > 0) {
                    document.getElementById('findings-section').classList.remove('hidden');
                    const findingsList = document.getElementById('findings-list');
                    findingsList.innerHTML = result.findings.map(finding => \`
                        <div class="border border-red-200 bg-red-50 rounded-lg p-4">
                            <div class="flex justify-between items-start mb-2">
                                <h4 class="font-semibold text-red-900">\${finding.title}</h4>
                                <span class="text-xs bg-red-200 text-red-800 px-2 py-1 rounded">\${getCategoryLabel(finding.category)}</span>
                            </div>
                            <p class="text-sm text-red-800 mb-2">\${finding.content}</p>
                            <div class="flex justify-between items-center text-xs text-red-600">
                                <span><i class="fas fa-calendar-alt mr-1"></i>\${finding.date || '日付不明'}</span>
                                <a href="\${finding.sourceUrl}" target="_blank" class="hover:underline">
                                    <i class="fas fa-external-link-alt mr-1"></i>\${finding.source}
                                </a>
                            </div>
                            <div class="mt-2">
                                <span class="text-xs text-gray-600">関連性: </span>
                                <div class="inline-block w-32 bg-gray-200 rounded-full h-2">
                                    <div class="bg-red-600 h-2 rounded-full" style="width: \${finding.relevance}%"></div>
                                </div>
                                <span class="text-xs text-gray-600 ml-2">\${finding.relevance}%</span>
                            </div>
                        </div>
                    \`).join('');
                } else {
                    document.getElementById('findings-section').classList.add('hidden');
                }
                
                // Sources checked
                const sourcesList = document.getElementById('sources-list');
                sourcesList.innerHTML = result.sourcesChecked.map(source => \`
                    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg \${source.checked ? 'bg-green-50' : 'bg-gray-50'}">
                        <div class="flex items-center gap-3">
                            <i class="fas fa-\${source.checked ? 'check-circle text-green-600' : 'times-circle text-gray-400'} text-xl"></i>
                            <div>
                                <p class="font-medium text-gray-900">\${source.name}</p>
                                <a href="\${source.url}" target="_blank" class="text-xs text-blue-600 hover:underline">
                                    \${source.url}
                                </a>
                            </div>
                        </div>
                        \${source.foundIssues > 0 ? \`
                            <span class="text-sm bg-red-100 text-red-800 px-3 py-1 rounded-full font-semibold">
                                \${source.foundIssues}件
                            </span>
                        \` : \`
                            <span class="text-sm text-gray-500">問題なし</span>
                        \`}
                    </div>
                \`).join('');
                
                // Recommended Actions
                const actionsContent = document.getElementById('actions-content');
                const riskLevel = result.riskLevel;
                
                const actionsByRisk = {
                    'none': {
                        title: '現時点で心理的瑕疵の公知情報は確認されていません。',
                        steps: [
                            { number: 1, title: '最終確認', description: '最終契約前に管理会社への念のための確認を推奨します。', note: '口頭確認で十分です。' }
                        ]
                    },
                    'low': {
                        title: '低リスクですが、慎重な確認を推奨します。',
                        steps: [
                            { number: 1, title: '管理会社照会（推奨）', description: '過去5年の自殺・事故・火災・特殊清掃の有無について文書照会', cost: '17,000〜20,000円/戸', note: '東急コミュニティー、ホームズ建物管理等の公式フォームから申請' },
                            { number: 2, title: '現地ヒアリング（推奨）', description: '管理員または隣接住戸への詳細ヒアリング', note: '警察出動、救急搬送、長期封鎖などの事実確認' }
                        ]
                    },
                    'medium': {
                        title: '中リスク。管理会社照会と現地調査を強く推奨します。',
                        steps: [
                            { number: 1, title: '管理会社照会（必須）', description: '過去5年の自殺・事故・火災・特殊清掃の有無について文書照会', cost: '17,000〜20,000円/戸', note: '東急コミュニティー、ホームズ建物管理等の公式フォームから申請' },
                            { number: 2, title: '現地ヒアリング（必須）', description: '管理員・隣接住戸・清掃業者への詳細ヒアリング', note: '発言者・日時を記録。警察出動・救急搬送・長期封鎖の確認' },
                            { number: 3, title: '公的照会（推奨）', description: '所轄警察署・消防署への出動記録確認', note: '口頭照会。個人情報制限あり' }
                        ]
                    },
                    'high': {
                        title: '高リスク。管理会社照会および公的照会を必須とします。',
                        steps: [
                            { number: 1, title: '管理会社照会（必須）', description: '過去5年の自殺・事故・火災・特殊清掃の有無について文書照会', cost: '17,000〜20,000円/戸', note: '東急コミュニティー、ホームズ建物管理等の公式フォームから申請' },
                            { number: 2, title: '現地ヒアリング（必須）', description: '管理員・隣接住戸・清掃業者への詳細ヒアリング', note: '発言者・日時を記録。警察出動・救急搬送・長期封鎖の確認' },
                            { number: 3, title: '公的照会（必須）', description: '所轄警察署・消防署への出動・通報記録確認', note: '出動記録の有無を確認（口頭照会）。個人情報制限あり' },
                            { number: 4, title: '報告・告知判断（必須）', description: '調査結果を要約し、宅建業法第47条に基づく告知判断を記録', note: '社内・買主向け資料を作成。国交省ガイドライン（2021）に準拠' }
                        ]
                    }
                };
                
                const actions = actionsByRisk[riskLevel] || actionsByRisk['none'];
                
                actionsContent.innerHTML = \`
                    <div class="mb-6">
                        <p class="text-gray-700 leading-relaxed">\${actions.title}</p>
                    </div>
                    
                    <div class="space-y-4">
                        \${actions.steps.map(step => \`
                            <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                                <div class="flex items-start gap-4">
                                    <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span class="text-blue-600 font-bold">\${step.number}</span>
                                    </div>
                                    <div class="flex-1">
                                        <h4 class="font-semibold text-gray-900 mb-2">\${step.title}</h4>
                                        <p class="text-sm text-gray-600 mb-2">\${step.description}</p>
                                        \${step.cost ? \`<p class="text-sm text-blue-600 mb-1"><i class="fas fa-yen-sign mr-1"></i>費用: \${step.cost}</p>\` : ''}
                                        \${step.note ? \`<p class="text-xs text-gray-500 mt-2">※ \${step.note}</p>\` : ''}
                                    </div>
                                </div>
                            </div>
                        \`).join('')}
                    </div>
                    
                    <div class="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <p class="text-sm text-yellow-800 flex items-start">
                            <i class="fas fa-info-circle mt-0.5 mr-2"></i>
                            <span>国交省ガイドライン（2021）では、自然死・不慮の死は原則告知不要、事故から3年経過後も原則不要（例外あり）とされています。</span>
                        </p>
                    </div>
                \`;
                
                // Scroll to results
                document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
            }
            
            function getCategoryLabel(category) {
                const labels = {
                    'death': '死亡事故',
                    'crime': '犯罪',
                    'fire': '火災',
                    'disaster': '災害',
                    'other': 'その他'
                };
                return labels[category] || 'その他';
            }
        </script>
    </body>
    </html>
  `);
});

export default stigma;
