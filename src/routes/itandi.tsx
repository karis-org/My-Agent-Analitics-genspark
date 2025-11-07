import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const itandi = new Hono();

/**
 * Itandi BB Rental Market Analysis Page
 * イタンジBB 賃貸相場分析ページ
 * GET /itandi/rental-market
 */
itandi.get('/rental-market', authMiddleware, async (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>賃貸相場分析 - イタンジBB - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/chart.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
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
                            イタンジBB 賃貸相場分析
                        </h1>
                    </div>
                    <a href="/dashboard" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-arrow-left mr-2"></i>戻る
                    </a>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Demo Mode Banner -->
            <div id="demo-banner" class="hidden bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <i class="fas fa-exclamation-triangle text-yellow-400"></i>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-yellow-700">
                            <strong>デモモード:</strong> イタンジBB API認証情報が未設定のため、サンプルデータを表示しています。
                            実際のデータを取得するには、管理者に環境変数 <code class="bg-yellow-100 px-1 rounded">ITANDI_EMAIL</code> と <code class="bg-yellow-100 px-1 rounded">ITANDI_PASSWORD</code> の設定を依頼してください。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Search Form -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-search mr-2 text-blue-600"></i>
                    エリア賃貸相場検索
                </h2>
                
                <form id="search-form" class="space-y-4">
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">都道府県</label>
                            <select id="prefecture" required class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">選択してください</option>
                                <option value="東京都">東京都</option>
                                <option value="神奈川県">神奈川県</option>
                                <option value="大阪府">大阪府</option>
                                <option value="愛知県">愛知県</option>
                                <option value="福岡県">福岡県</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">市区町村</label>
                            <input type="text" id="city" required placeholder="例: 渋谷区"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">町名（任意）</label>
                            <input type="text" id="town" placeholder="例: 恵比寿"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">間取り</label>
                            <select id="roomType" class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">全て</option>
                                <option value="1R">1R</option>
                                <option value="1K">1K</option>
                                <option value="1DK">1DK</option>
                                <option value="1LDK">1LDK</option>
                                <option value="2K">2K</option>
                                <option value="2DK">2DK</option>
                                <option value="2LDK">2LDK</option>
                                <option value="3LDK">3LDK</option>
                            </select>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">最小面積 (㎡)</label>
                            <input type="number" id="minArea" step="0.1" placeholder="例: 20"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">最大面積 (㎡)</label>
                            <input type="number" id="maxArea" step="0.1" placeholder="例: 80"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        </div>
                    </div>
                    
                    <div class="flex justify-end">
                        <button type="submit" class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-search mr-2"></i>賃貸相場を検索
                        </button>
                    </div>
                </form>
            </div>

            <!-- Loading State -->
            <div id="loading" class="hidden">
                <div class="bg-white rounded-lg shadow p-12 text-center">
                    <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                    <p class="text-gray-600">賃貸相場データを取得中...</p>
                </div>
            </div>

            <!-- Results -->
            <div id="results" class="hidden space-y-6">
                <!-- Summary Cards -->
                <div class="grid md:grid-cols-4 gap-6">
                    <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg shadow">
                        <p class="text-sm text-gray-600 mb-2">平均賃料</p>
                        <p id="avgRent" class="text-3xl font-bold text-blue-600">¥0</p>
                        <p class="text-xs text-gray-500 mt-1">円/月</p>
                    </div>
                    <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg shadow">
                        <p class="text-sm text-gray-600 mb-2">中央値</p>
                        <p id="medianRent" class="text-3xl font-bold text-green-600">¥0</p>
                        <p class="text-xs text-gray-500 mt-1">円/月</p>
                    </div>
                    <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg shadow">
                        <p class="text-sm text-gray-600 mb-2">最小賃料</p>
                        <p id="minRent" class="text-3xl font-bold text-purple-600">¥0</p>
                        <p class="text-xs text-gray-500 mt-1">円/月</p>
                    </div>
                    <div class="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-lg shadow">
                        <p class="text-sm text-gray-600 mb-2">最大賃料</p>
                        <p id="maxRent" class="text-3xl font-bold text-orange-600">¥0</p>
                        <p class="text-xs text-gray-500 mt-1">円/月</p>
                    </div>
                </div>

                <!-- Charts -->
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">賃料推移</h3>
                        <canvas id="trendChart"></canvas>
                    </div>
                    <div class="bg-white rounded-lg shadow p-6">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">賃料分布</h3>
                        <canvas id="distributionChart"></canvas>
                    </div>
                </div>

                <!-- Property List -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">周辺物件一覧</h3>
                    <div id="propertyList" class="space-y-4"></div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let trendChart = null;
            let distributionChart = null;

            document.getElementById('search-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    prefecture: document.getElementById('prefecture').value,
                    city: document.getElementById('city').value,
                    town: document.getElementById('town').value || undefined,
                    roomType: document.getElementById('roomType').value || undefined,
                    minArea: parseFloat(document.getElementById('minArea').value) || undefined,
                    maxArea: parseFloat(document.getElementById('maxArea').value) || undefined,
                };
                
                // Show loading
                document.getElementById('loading').classList.remove('hidden');
                document.getElementById('results').classList.add('hidden');
                
                try {
                    console.log('[DEBUG] Sending request with formData:', formData);
                    
                    // Fetch rental analysis
                    const analysisResponse = await axios.post('/api/itandi/rental-analysis', formData);
                    console.log('[DEBUG] Analysis response received:', analysisResponse);
                    const analysis = analysisResponse.data;
                    console.log('[DEBUG] Analysis data:', analysis);
                    
                    // Fetch rental trend
                    const trendResponse = await axios.post('/api/itandi/rental-trend', {
                        ...formData,
                        months: 12
                    });
                    console.log('[DEBUG] Trend response received:', trendResponse);
                    const trend = trendResponse.data;
                    console.log('[DEBUG] Trend data:', trend);
                    
                    console.log('[DEBUG] Calling displayResults...');
                    displayResults(analysis, trend);
                    console.log('[DEBUG] displayResults completed');
                    
                    // Show demo banner if in demo mode
                    if (analysis.isDemoMode || trend.isDemoMode) {
                        document.getElementById('demo-banner').classList.remove('hidden');
                    }
                } catch (error) {
                    console.error('[ERROR] Analysis failed:', error);
                    console.error('[ERROR] Error details:', error.response ? error.response.data : error.message);
                    
                    // Handle authentication errors
                    if (error.response?.status === 401) {
                        alert('セッションが切れました。ログインページに移動します。');
                        window.location.href = '/auth/login';
                        return;
                    }
                    
                    alert('賃貸相場の取得に失敗しました: ' + (error.response?.data?.error || error.message));
                } finally {
                    document.getElementById('loading').classList.add('hidden');
                }
            });
            
            function displayResults(analysis, trend) {
                console.log('[DEBUG] displayResults called with:', { analysis, trend });
                
                // Show results section
                const resultsElement = document.getElementById('results');
                console.log('[DEBUG] Results element:', resultsElement);
                resultsElement.classList.remove('hidden');
                
                // Update summary cards
                console.log('[DEBUG] Updating summary cards...');
                document.getElementById('avgRent').textContent = \`¥\${Math.round(analysis.averageRent || 0).toLocaleString()}\`;
                document.getElementById('medianRent').textContent = \`¥\${Math.round(analysis.medianRent || 0).toLocaleString()}\`;
                document.getElementById('minRent').textContent = \`¥\${Math.round(analysis.minRent || 0).toLocaleString()}\`;
                document.getElementById('maxRent').textContent = \`¥\${Math.round(analysis.maxRent || 0).toLocaleString()}\`;
                console.log('[DEBUG] Summary cards updated');
                
                // Render trend chart
                console.log('[DEBUG] Rendering trend chart...');
                renderTrendChart(trend.trendData || []);
                
                // Render distribution chart
                console.log('[DEBUG] Rendering distribution chart...');
                renderDistributionChart(analysis.rentDistribution || []);
                
                // Render property list
                console.log('[DEBUG] Rendering property list...');
                renderPropertyList(analysis.properties || []);
                
                // Scroll to results
                console.log('[DEBUG] Scrolling to results...');
                document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
                console.log('[DEBUG] displayResults completed successfully');
            }
            
            function renderTrendChart(trendData) {
                const ctx = document.getElementById('trendChart');
                
                if (trendChart) {
                    trendChart.destroy();
                }
                
                trendChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: trendData.map(d => d.month),
                        datasets: [{
                            label: '平均賃料 (円/月)',
                            data: trendData.map(d => d.averageRent),
                            borderColor: 'rgb(59, 130, 246)',
                            backgroundColor: 'rgba(59, 130, 246, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: true,
                                position: 'top'
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: false,
                                ticks: {
                                    callback: function(value) {
                                        return '¥' + value.toLocaleString();
                                    }
                                }
                            }
                        }
                    }
                });
            }
            
            function renderDistributionChart(distribution) {
                const ctx = document.getElementById('distributionChart');
                
                if (distributionChart) {
                    distributionChart.destroy();
                }
                
                distributionChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: distribution.map(d => d.range),
                        datasets: [{
                            label: '物件数',
                            data: distribution.map(d => d.count),
                            backgroundColor: [
                                'rgba(59, 130, 246, 0.8)',
                                'rgba(16, 185, 129, 0.8)',
                                'rgba(168, 85, 247, 0.8)',
                                'rgba(249, 115, 22, 0.8)',
                                'rgba(239, 68, 68, 0.8)'
                            ]
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                beginAtZero: true,
                                ticks: {
                                    stepSize: 1
                                }
                            }
                        }
                    }
                });
            }
            
            function renderPropertyList(properties) {
                const container = document.getElementById('propertyList');
                
                if (properties.length === 0) {
                    container.innerHTML = '<p class="text-gray-500 text-center py-8">該当する物件が見つかりませんでした</p>';
                    return;
                }
                
                container.innerHTML = properties.map(property => \`
                    <div class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                        <div class="flex justify-between items-start mb-2">
                            <div>
                                <h4 class="font-semibold text-gray-900">\${property.name || '物件名未設定'}</h4>
                                <p class="text-sm text-gray-600">\${property.address}</p>
                            </div>
                            <div class="text-right">
                                <p class="text-2xl font-bold text-blue-600">¥\${Math.round(property.rent).toLocaleString()}</p>
                                <p class="text-xs text-gray-500">円/月</p>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                            <div>
                                <span class="text-gray-500">間取り:</span>
                                <span class="font-medium ml-1">\${property.roomType || '-'}</span>
                            </div>
                            <div>
                                <span class="text-gray-500">面積:</span>
                                <span class="font-medium ml-1">\${property.area || '-'}㎡</span>
                            </div>
                            <div>
                                <span class="text-gray-500">築年数:</span>
                                <span class="font-medium ml-1">\${property.age || '-'}年</span>
                            </div>
                            <div>
                                <span class="text-gray-500">駅徒歩:</span>
                                <span class="font-medium ml-1">\${property.walkMinutes || '-'}分</span>
                            </div>
                        </div>
                    </div>
                \`).join('');
            }
        </script>
    </body>
    </html>
  `);
});

export default itandi;
