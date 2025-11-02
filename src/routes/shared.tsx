import { Hono } from 'hono'
import { getSharedReport, verifySharedReportAccess, logSharedReportAccess } from '../lib/sharing'

type Bindings = {
  DB: D1Database;
}

const shared = new Hono<{ Bindings: Bindings }>()

// 共有レポート表示ページ
shared.get('/:token', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    // 共有レポート情報を取得
    const sharedReport = await getSharedReport(env.DB, token)
    
    if (!sharedReport) {
      return c.html(renderErrorPage('共有レポートが見つかりません', '指定された共有リンクは存在しないか、削除されました。'))
    }
    
    // パスワード保護がある場合はパスワード入力ページを表示
    if (sharedReport.passwordHash) {
      return c.html(renderPasswordPage(token, sharedReport))
    }
    
    // アクセス検証（パスワードなし）
    const verification = await verifySharedReportAccess(env.DB, token)
    
    if (!verification.allowed) {
      return c.html(renderErrorPage('アクセスできません', verification.reason || '不明なエラー'))
    }
    
    // アクセスログ記録
    await logSharedReportAccess(env.DB, token, {
      ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown'
    })
    
    // レポート表示ページ
    return c.html(renderSharedReportPage(sharedReport))
    
  } catch (error) {
    console.error('Shared report error:', error)
    return c.html(renderErrorPage('エラーが発生しました', 'レポートの読み込み中にエラーが発生しました。'))
  }
})

// パスワード検証API
shared.post('/:token/verify', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  const { password } = await c.req.json()
  
  try {
    const verification = await verifySharedReportAccess(env.DB, token, password)
    
    if (!verification.allowed) {
      return c.json({ success: false, message: verification.reason || '不明なエラー' }, 403)
    }
    
    // アクセスログ記録
    await logSharedReportAccess(env.DB, token, {
      ipAddress: c.req.header('CF-Connecting-IP') || 'unknown',
      userAgent: c.req.header('User-Agent') || 'unknown'
    })
    
    // 共有レポート情報を返す
    const sharedReport = await getSharedReport(env.DB, token)
    
    return c.json({ 
      success: true, 
      report: sharedReport 
    })
    
  } catch (error) {
    console.error('Password verification error:', error)
    return c.json({ success: false, message: 'エラーが発生しました' }, 500)
  }
})

// エラーページのレンダリング
function renderErrorPage(title: string, message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center px-4">
            <div class="max-w-md w-full">
                <div class="bg-white rounded-lg shadow-lg p-8 text-center">
                    <div class="mb-6">
                        <i class="fas fa-exclamation-circle text-6xl text-red-500"></i>
                    </div>
                    <h1 class="text-2xl font-bold text-gray-900 mb-4">${title}</h1>
                    <p class="text-gray-600 mb-6">${message}</p>
                    <a href="/" class="inline-block bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-home mr-2"></i>
                        トップページへ
                    </a>
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}

// パスワード入力ページのレンダリング
function renderPasswordPage(token: string, sharedReport: any): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>パスワード入力 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <div class="min-h-screen flex items-center justify-center px-4">
            <div class="max-w-md w-full">
                <div class="bg-white rounded-lg shadow-lg p-8">
                    <div class="text-center mb-8">
                        <div class="mb-4">
                            <i class="fas fa-lock text-5xl text-blue-600"></i>
                        </div>
                        <h1 class="text-2xl font-bold text-gray-900 mb-2">
                            ${sharedReport.title || '共有レポート'}
                        </h1>
                        ${sharedReport.description ? `<p class="text-gray-600">${sharedReport.description}</p>` : ''}
                    </div>
                    
                    <div id="error-message" class="hidden mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p class="text-red-800 text-sm"></p>
                    </div>
                    
                    <form id="password-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                <i class="fas fa-key mr-2"></i>
                                パスワード
                            </label>
                            <input 
                                type="password" 
                                id="password-input"
                                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                placeholder="パスワードを入力してください"
                                required
                            />
                        </div>
                        
                        <button 
                            type="submit"
                            class="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                        >
                            <i class="fas fa-unlock mr-2"></i>
                            レポートを表示
                        </button>
                    </form>
                    
                    ${sharedReport.expiresAt ? `
                        <div class="mt-6 pt-6 border-t border-gray-200">
                            <p class="text-sm text-gray-500 text-center">
                                <i class="far fa-clock mr-2"></i>
                                有効期限: ${new Date(sharedReport.expiresAt).toLocaleString('ja-JP')}
                            </p>
                        </div>
                    ` : ''}
                </div>
            </div>
        </div>
        
        <script>
            document.getElementById('password-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const password = document.getElementById('password-input').value;
                const errorDiv = document.getElementById('error-message');
                const errorText = errorDiv.querySelector('p');
                
                try {
                    const response = await fetch('/shared/${token}/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ password })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        // パスワード検証成功 - レポートデータを保存して表示ページへ
                        sessionStorage.setItem('sharedReport_${token}', JSON.stringify(data.report));
                        window.location.href = '/shared/${token}/view';
                    } else {
                        errorDiv.classList.remove('hidden');
                        errorText.textContent = data.message || 'パスワードが正しくありません';
                    }
                } catch (error) {
                    errorDiv.classList.remove('hidden');
                    errorText.textContent = 'エラーが発生しました。もう一度お試しください。';
                }
            });
        </script>
    </body>
    </html>
  `
}

// 共有レポート表示ページのレンダリング
function renderSharedReportPage(sharedReport: any): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${sharedReport.title || '共有レポート'} - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    </head>
    <body class="bg-gray-50">
        <!-- ヘッダー -->
        <header class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-2xl font-bold text-gray-900">
                            <i class="fas fa-share-alt text-blue-600 mr-2"></i>
                            ${sharedReport.title || '共有レポート'}
                        </h1>
                        ${sharedReport.description ? `<p class="text-gray-600 mt-1">${sharedReport.description}</p>` : ''}
                    </div>
                    <div class="text-right">
                        <div class="text-sm text-gray-500">
                            <i class="far fa-calendar mr-1"></i>
                            ${new Date(sharedReport.createdAt).toLocaleDateString('ja-JP')}
                        </div>
                        ${sharedReport.expiresAt ? `
                            <div class="text-sm text-gray-500 mt-1">
                                <i class="far fa-clock mr-1"></i>
                                有効期限: ${new Date(sharedReport.expiresAt).toLocaleDateString('ja-JP')}
                            </div>
                        ` : ''}
                    </div>
                </div>
            </div>
        </header>
        
        <!-- メインコンテンツ -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div id="report-content" class="bg-white rounded-lg shadow-lg p-8">
                <div class="text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">レポートを読み込んでいます...</p>
                </div>
            </div>
        </main>
        
        <!-- フッター -->
        <footer class="bg-white border-t border-gray-200 mt-12">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="text-center text-gray-500 text-sm">
                    <p>Powered by <strong>My Agent Analytics</strong></p>
                    <p class="mt-2">
                        <i class="fas fa-shield-alt mr-1"></i>
                        このレポートは共有リンクによってアクセスされています
                    </p>
                </div>
            </div>
        </footer>
        
        <script>
            const sharedReport = ${JSON.stringify(sharedReport)};
            
            // レポートデータを取得して表示
            async function loadReport() {
                try {
                    const response = await fetch('/api/reports/' + sharedReport.reportId);
                    const report = await response.json();
                    
                    renderReport(report, sharedReport.reportType);
                } catch (error) {
                    console.error('Report load error:', error);
                    document.getElementById('report-content').innerHTML = \`
                        <div class="text-center py-12">
                            <i class="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                            <p class="text-gray-600">レポートの読み込みに失敗しました</p>
                        </div>
                    \`;
                }
            }
            
            // レポートタイプに応じた表示
            function renderReport(report, reportType) {
                const container = document.getElementById('report-content');
                
                if (reportType === 'property_analysis') {
                    renderPropertyAnalysis(container, report);
                } else if (reportType === 'market_analysis') {
                    renderMarketAnalysis(container, report);
                } else if (reportType === 'investment_simulation') {
                    renderInvestmentSimulation(container, report);
                } else if (reportType === 'area_analysis') {
                    renderAreaAnalysis(container, report);
                } else {
                    renderGenericReport(container, report);
                }
            }
            
            // 物件分析レポート表示
            function renderPropertyAnalysis(container, report) {
                container.innerHTML = \`
                    <div class="space-y-8">
                        <!-- 物件概要 -->
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <i class="fas fa-building text-blue-600 mr-2"></i>
                                物件概要
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">住所</div>
                                    <div class="font-medium">\${report.address || '-'}</div>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">価格</div>
                                    <div class="font-medium text-lg">\${(report.price || 0).toLocaleString()}円</div>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">面積</div>
                                    <div class="font-medium">\${report.area || '-'}㎡</div>
                                </div>
                                <div class="bg-gray-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">築年数</div>
                                    <div class="font-medium">\${report.age || '-'}年</div>
                                </div>
                            </div>
                        </section>
                        
                        <!-- 評価スコア -->
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <i class="fas fa-star text-yellow-500 mr-2"></i>
                                総合評価
                            </h2>
                            <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg text-center">
                                <div class="text-5xl font-bold text-blue-600 mb-2">
                                    \${report.overallScore || 0}
                                </div>
                                <div class="text-gray-600">/ 100点</div>
                            </div>
                        </section>
                        
                        <!-- 詳細分析 -->
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4 flex items-center">
                                <i class="fas fa-chart-line text-green-600 mr-2"></i>
                                詳細分析
                            </h2>
                            <div class="prose max-w-none">
                                \${report.analysis || '<p class="text-gray-500">分析データがありません</p>'}
                            </div>
                        </section>
                    </div>
                \`;
            }
            
            // 市場分析レポート表示
            function renderMarketAnalysis(container, report) {
                container.innerHTML = \`
                    <div class="space-y-8">
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4">
                                <i class="fas fa-chart-bar text-blue-600 mr-2"></i>
                                市場分析結果
                            </h2>
                            <div class="prose max-w-none">
                                \${report.analysis || '<p class="text-gray-500">分析データがありません</p>'}
                            </div>
                        </section>
                    </div>
                \`;
            }
            
            // 投資シミュレーションレポート表示
            function renderInvestmentSimulation(container, report) {
                container.innerHTML = \`
                    <div class="space-y-8">
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4">
                                <i class="fas fa-calculator text-green-600 mr-2"></i>
                                投資シミュレーション結果
                            </h2>
                            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                                <div class="bg-blue-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">想定利回り</div>
                                    <div class="text-2xl font-bold text-blue-600">\${(report.yield || 0).toFixed(2)}%</div>
                                </div>
                                <div class="bg-green-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">年間収益</div>
                                    <div class="text-2xl font-bold text-green-600">\${(report.annualIncome || 0).toLocaleString()}円</div>
                                </div>
                                <div class="bg-purple-50 p-4 rounded-lg">
                                    <div class="text-sm text-gray-600 mb-1">投資回収期間</div>
                                    <div class="text-2xl font-bold text-purple-600">\${(report.paybackYears || 0).toFixed(1)}年</div>
                                </div>
                            </div>
                            <div class="prose max-w-none">
                                \${report.analysis || '<p class="text-gray-500">分析データがありません</p>'}
                            </div>
                        </section>
                    </div>
                \`;
            }
            
            // エリア分析レポート表示
            function renderAreaAnalysis(container, report) {
                container.innerHTML = \`
                    <div class="space-y-8">
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4">
                                <i class="fas fa-map-marked-alt text-red-600 mr-2"></i>
                                エリア分析結果
                            </h2>
                            <div class="prose max-w-none">
                                \${report.analysis || '<p class="text-gray-500">分析データがありません</p>'}
                            </div>
                        </section>
                    </div>
                \`;
            }
            
            // 汎用レポート表示
            function renderGenericReport(container, report) {
                container.innerHTML = \`
                    <div class="space-y-8">
                        <section>
                            <h2 class="text-xl font-bold text-gray-900 mb-4">
                                <i class="fas fa-file-alt text-gray-600 mr-2"></i>
                                レポート内容
                            </h2>
                            <div class="prose max-w-none">
                                <pre class="bg-gray-50 p-4 rounded-lg overflow-x-auto">\${JSON.stringify(report, null, 2)}</pre>
                            </div>
                        </section>
                    </div>
                \`;
            }
            
            // ページ読み込み時に実行
            loadReport();
        </script>
    </body>
    </html>
  `
}

// パスワード検証後の表示ページ
shared.get('/:token/view', async (c) => {
  const { env } = c
  const token = c.req.param('token')
  
  try {
    const sharedReport = await getSharedReport(env.DB, token)
    
    if (!sharedReport) {
      return c.html(renderErrorPage('共有レポートが見つかりません', '指定された共有リンクは存在しないか、削除されました。'))
    }
    
    return c.html(renderSharedReportPage(sharedReport))
    
  } catch (error) {
    console.error('Shared report view error:', error)
    return c.html(renderErrorPage('エラーが発生しました', 'レポートの読み込み中にエラーが発生しました。'))
  }
})

export default shared
