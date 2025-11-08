// Property Comparison routes for My Agent Analytics
import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const comparison = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all comparison routes
comparison.use('/*', authMiddleware);

/**
 * Property comparison page
 * Allows users to compare multiple properties side-by-side
 */
comparison.get('/', (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>物件比較 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            
            /* Chart container */
            .chart-container {
                position: relative;
                height: 400px;
                margin-top: 1rem;
            }
            
            /* Comparison table styles */
            .comparison-table {
                overflow-x: auto;
            }
            
            .comparison-table table {
                min-width: 100%;
            }
            
            .comparison-table th {
                position: sticky;
                top: 0;
                background: white;
                z-index: 10;
            }
            
            /* Metric cards */
            .metric-card {
                transition: all 0.3s ease;
            }
            
            .metric-card:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            }
            
            /* Print styles */
            @media print {
                .no-print { display: none !important; }
                body { background: white; }
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm sticky top-0 z-50 no-print">
            <div class="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 sm:space-x-4">
                        <a href="/dashboard" class="touch-manipulation">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-10 w-10 sm:h-12 sm:w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-lg sm:text-2xl font-bold text-gray-900">物件比較</h1>
                    </div>
                    <div class="flex items-center space-x-2 sm:space-x-3">
                        <button onclick="window.print()" class="px-3 py-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base touch-manipulation">
                            <i class="fas fa-print mr-1 sm:mr-2"></i><span class="hidden sm:inline">印刷</span>
                        </button>
                        <button onclick="exportToCSV()" class="px-3 py-2 sm:px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm sm:text-base touch-manipulation">
                            <i class="fas fa-download mr-1 sm:mr-2"></i><span class="hidden sm:inline">CSV</span>
                        </button>
                        <a href="/properties" class="text-gray-600 hover:text-gray-900 p-2 touch-manipulation">
                            <i class="fas fa-arrow-left text-lg sm:text-xl"></i>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-6 sm:py-8 sm:px-6 lg:px-8">
            <!-- Loading State -->
            <div id="loading" class="text-center py-12">
                <i class="fas fa-circle-notch fa-spin text-4xl text-blue-600 mb-4"></i>
                <p class="text-gray-600">物件データを読み込み中...</p>
            </div>

            <!-- No Selection State -->
            <div id="no-selection" class="hidden text-center py-12 bg-white rounded-lg shadow">
                <i class="fas fa-info-circle text-6xl text-gray-300 mb-4"></i>
                <h3 class="text-xl font-bold text-gray-900 mb-2">比較する物件を選択してください</h3>
                <p class="text-gray-600 mb-6">物件一覧ページで比較したい物件にチェックを入れて、「比較」ボタンをクリックしてください</p>
                <a href="/properties" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                    <i class="fas fa-arrow-left mr-2"></i>物件一覧に戻る
                </a>
            </div>

            <!-- Comparison Content -->
            <div id="comparison-content" class="hidden space-y-6">
                <!-- Selected Properties Summary -->
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            選択中の物件: <span id="selected-count" class="text-blue-600">0</span>件
                        </h2>
                        <button onclick="clearSelection()" class="text-sm text-red-600 hover:text-red-700">
                            <i class="fas fa-times mr-1"></i>選択をクリア
                        </button>
                    </div>
                    <div id="selected-properties-list" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        <!-- Selected properties will be inserted here -->
                    </div>
                </div>

                <!-- Comparison Visualization -->
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-chart-radar text-blue-600 mr-2"></i>
                        総合比較チャート
                    </h2>
                    <div class="chart-container">
                        <canvas id="radarChart"></canvas>
                    </div>
                </div>

                <!-- Bar Chart Comparison -->
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-chart-bar text-green-600 mr-2"></i>
                        主要指標比較
                    </h2>
                    <div class="chart-container">
                        <canvas id="barChart"></canvas>
                    </div>
                </div>

                <!-- Detailed Comparison Table -->
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-table text-purple-600 mr-2"></i>
                        詳細比較表
                    </h2>
                    <div class="comparison-table">
                        <table id="comparison-table" class="w-full text-sm">
                            <thead class="bg-gray-50">
                                <tr>
                                    <th class="px-4 py-3 text-left font-semibold text-gray-900 border-b-2">指標</th>
                                    <!-- Property columns will be inserted here -->
                                </tr>
                            </thead>
                            <tbody id="comparison-table-body">
                                <!-- Comparison rows will be inserted here -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Investment Recommendation -->
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <h2 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-lightbulb text-yellow-600 mr-2"></i>
                        投資推奨度分析
                    </h2>
                    <div id="recommendation-content" class="space-y-4">
                        <!-- Recommendation cards will be inserted here -->
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let selectedProperties = [];
            let radarChart = null;
            let barChart = null;

            // Load comparison data from URL parameters or localStorage
            async function loadComparisonData() {
                try {
                    // Get property IDs from URL parameters
                    const urlParams = new URLSearchParams(window.location.search);
                    const idsParam = urlParams.get('ids');
                    
                    if (!idsParam) {
                        // Try to get from localStorage
                        const storedIds = localStorage.getItem('comparisonIds');
                        if (!storedIds) {
                            showNoSelection();
                            return;
                        }
                        selectedProperties = JSON.parse(storedIds);
                    } else {
                        selectedProperties = idsParam.split(',');
                    }

                    if (selectedProperties.length === 0) {
                        showNoSelection();
                        return;
                    }

                    // Fetch property data for all selected properties
                    const propertyPromises = selectedProperties.map(id => 
                        axios.get(\`/api/properties/\${id}/comprehensive-data\`)
                    );

                    const responses = await Promise.all(propertyPromises);
                    const properties = responses.map(res => res.data.data);

                    // Hide loading, show content
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('comparison-content').classList.remove('hidden');

                    // Render comparison
                    renderComparison(properties);
                } catch (error) {
                    console.error('Failed to load comparison data:', error);
                    document.getElementById('loading').innerHTML = \`
                        <div class="text-center py-12">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-600 mb-4"></i>
                            <p class="text-gray-900 font-bold">データの読み込みに失敗しました</p>
                            <p class="text-gray-600 mt-2">\${error.message}</p>
                            <a href="/properties" class="inline-block mt-4 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                                物件一覧に戻る
                            </a>
                        </div>
                    \`;
                }
            }

            function showNoSelection() {
                document.getElementById('loading').classList.add('hidden');
                document.getElementById('no-selection').classList.remove('hidden');
            }

            function renderComparison(properties) {
                // Update selected count
                document.getElementById('selected-count').textContent = properties.length;

                // Render selected properties list
                renderSelectedPropertiesList(properties);

                // Render comparison charts
                renderRadarChart(properties);
                renderBarChart(properties);

                // Render comparison table
                renderComparisonTable(properties);

                // Render recommendations
                renderRecommendations(properties);
            }

            function renderSelectedPropertiesList(properties) {
                const container = document.getElementById('selected-properties-list');
                container.innerHTML = properties.map((prop, index) => {
                    const property = prop.property;
                    const color = ['blue', 'green', 'purple', 'orange', 'pink'][index % 5];
                    return \`
                        <div class="metric-card p-3 border-2 border-\${color}-200 bg-\${color}-50 rounded-lg">
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <h3 class="font-bold text-\${color}-900 text-sm mb-1">\${property.name}</h3>
                                    <p class="text-xs text-\${color}-700">¥\${(property.price || 0).toLocaleString()}</p>
                                </div>
                                <button onclick="removeProperty('\${property.id}')" class="text-red-600 hover:text-red-700 p-1">
                                    <i class="fas fa-times text-xs"></i>
                                </button>
                            </div>
                        </div>
                    \`;
                }).join('');
            }

            function renderRadarChart(properties) {
                const ctx = document.getElementById('radarChart');
                if (!ctx) return;

                // Destroy existing chart
                if (radarChart) {
                    radarChart.destroy();
                }

                // Prepare data
                const colors = [
                    'rgba(59, 130, 246, 0.7)',   // Blue
                    'rgba(34, 197, 94, 0.7)',    // Green
                    'rgba(168, 85, 247, 0.7)',   // Purple
                    'rgba(249, 115, 22, 0.7)',   // Orange
                    'rgba(236, 72, 153, 0.7)'    // Pink
                ];

                const datasets = properties.map((prop, index) => {
                    const property = prop.property;
                    // Normalize values to 0-100 scale for radar chart
                    const grossYield = Math.min((property.gross_yield || 0) * 10, 100);
                    const netYield = Math.min((property.net_yield || 0) * 10, 100);
                    const price = Math.min((property.price || 0) / 100000000 * 100, 100); // 1億円 = 100
                    const noi = Math.min((property.noi || 0) / 10000000 * 100, 100); // 1千万円 = 100
                    const dscr = Math.min((property.dscr || 0) * 50, 100); // DSCR 2.0 = 100

                    return {
                        label: property.name,
                        data: [grossYield, netYield, 100 - price, noi, dscr],
                        backgroundColor: colors[index % colors.length].replace('0.7', '0.2'),
                        borderColor: colors[index % colors.length],
                        borderWidth: 2,
                        pointBackgroundColor: colors[index % colors.length],
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: colors[index % colors.length]
                    };
                });

                radarChart = new Chart(ctx, {
                    type: 'radar',
                    data: {
                        labels: ['表面利回り', '実質利回り', 'コスト効率', 'NOI', 'DSCR'],
                        datasets: datasets
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 12 },
                                    padding: 15
                                }
                            },
                            tooltip: {
                                callbacks: {
                                    label: function(context) {
                                        const label = context.dataset.label || '';
                                        const value = context.parsed.r || 0;
                                        return label + ': ' + value.toFixed(1);
                                    }
                                }
                            }
                        },
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    stepSize: 20
                                }
                            }
                        }
                    }
                });
            }

            function renderBarChart(properties) {
                const ctx = document.getElementById('barChart');
                if (!ctx) return;

                // Destroy existing chart
                if (barChart) {
                    barChart.destroy();
                }

                const colors = [
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(34, 197, 94, 0.8)',
                    'rgba(168, 85, 247, 0.8)',
                    'rgba(249, 115, 22, 0.8)',
                    'rgba(236, 72, 153, 0.8)'
                ];

                const propertyNames = properties.map(p => p.property.name);
                const grossYields = properties.map(p => p.property.gross_yield || 0);
                const netYields = properties.map(p => p.property.net_yield || 0);
                const prices = properties.map(p => (p.property.price || 0) / 100000000); // 億円単位
                const nois = properties.map(p => (p.property.noi || 0) / 10000000); // 千万円単位

                barChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: propertyNames,
                        datasets: [
                            {
                                label: '表面利回り（%）',
                                data: grossYields,
                                backgroundColor: colors[0],
                                borderColor: colors[0].replace('0.8', '1'),
                                borderWidth: 2,
                                yAxisID: 'y'
                            },
                            {
                                label: '実質利回り（%）',
                                data: netYields,
                                backgroundColor: colors[1],
                                borderColor: colors[1].replace('0.8', '1'),
                                borderWidth: 2,
                                yAxisID: 'y'
                            },
                            {
                                label: '価格（億円）',
                                data: prices,
                                backgroundColor: colors[2],
                                borderColor: colors[2].replace('0.8', '1'),
                                borderWidth: 2,
                                yAxisID: 'y1'
                            },
                            {
                                label: 'NOI（千万円）',
                                data: nois,
                                backgroundColor: colors[3],
                                borderColor: colors[3].replace('0.8', '1'),
                                borderWidth: 2,
                                yAxisID: 'y1'
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                position: 'bottom',
                                labels: {
                                    font: { size: 11 },
                                    padding: 12
                                }
                            }
                        },
                        scales: {
                            y: {
                                type: 'linear',
                                display: true,
                                position: 'left',
                                title: {
                                    display: true,
                                    text: '利回り（%）'
                                },
                                ticks: {
                                    callback: function(value) {
                                        return value + '%';
                                    }
                                }
                            },
                            y1: {
                                type: 'linear',
                                display: true,
                                position: 'right',
                                title: {
                                    display: true,
                                    text: '金額'
                                },
                                grid: {
                                    drawOnChartArea: false
                                }
                            }
                        }
                    }
                });
            }

            function renderComparisonTable(properties) {
                const table = document.getElementById('comparison-table');
                const tbody = document.getElementById('comparison-table-body');
                if (!table || !tbody) return;

                // Add property column headers
                const thead = table.querySelector('thead tr');
                properties.forEach((prop, index) => {
                    const color = ['blue', 'green', 'purple', 'orange', 'pink'][index % 5];
                    const th = document.createElement('th');
                    th.className = \`px-4 py-3 text-center font-semibold text-\${color}-900 bg-\${color}-50 border-b-2 border-\${color}-200\`;
                    th.textContent = prop.property.name;
                    thead.appendChild(th);
                });

                // Define comparison metrics
                const metrics = [
                    { label: '価格', key: 'price', format: (v) => '¥' + (v || 0).toLocaleString() },
                    { label: '所在地', key: 'location', format: (v) => v || '未設定' },
                    { label: '構造', key: 'structure', format: (v) => v || '未設定' },
                    { label: '延床面積', key: 'total_floor_area', format: (v) => (v || 0) + '㎡' },
                    { label: '築年数', key: 'age', format: (v) => (v || 0) + '年' },
                    { label: '表面利回り', key: 'gross_yield', format: (v) => (v || 0).toFixed(2) + '%' },
                    { label: '実質利回り', key: 'net_yield', format: (v) => (v || 0).toFixed(2) + '%' },
                    { label: 'NOI', key: 'noi', format: (v) => '¥' + (v || 0).toLocaleString() },
                    { label: 'DSCR', key: 'dscr', format: (v) => (v || 0).toFixed(2) },
                    { label: 'LTV', key: 'ltv', format: (v) => (v || 0).toFixed(2) + '%' }
                ];

                // Create comparison rows
                tbody.innerHTML = metrics.map(metric => {
                    const values = properties.map(prop => {
                        const value = prop.property[metric.key];
                        return \`<td class="px-4 py-3 text-center border-b">\${metric.format(value)}</td>\`;
                    }).join('');

                    return \`
                        <tr class="hover:bg-gray-50">
                            <td class="px-4 py-3 font-medium text-gray-900 border-b">\${metric.label}</td>
                            \${values}
                        </tr>
                    \`;
                }).join('');
            }

            function renderRecommendations(properties) {
                const container = document.getElementById('recommendation-content');
                if (!container) return;

                // Calculate scores for each property
                const scoredProperties = properties.map(prop => {
                    const property = prop.property;
                    let score = 0;
                    const reasons = [];

                    // Score based on yield
                    if ((property.gross_yield || 0) > 8) {
                        score += 30;
                        reasons.push('高利回り（' + (property.gross_yield || 0).toFixed(1) + '%）');
                    } else if ((property.gross_yield || 0) > 5) {
                        score += 20;
                        reasons.push('適正利回り（' + (property.gross_yield || 0).toFixed(1) + '%）');
                    }

                    // Score based on DSCR
                    if ((property.dscr || 0) > 1.5) {
                        score += 25;
                        reasons.push('優良DSCR（' + (property.dscr || 0).toFixed(2) + '）');
                    } else if ((property.dscr || 0) > 1.2) {
                        score += 15;
                        reasons.push('適正DSCR（' + (property.dscr || 0).toFixed(2) + '）');
                    }

                    // Score based on LTV
                    if ((property.ltv || 0) < 70) {
                        score += 20;
                        reasons.push('安全LTV（' + (property.ltv || 0).toFixed(1) + '%）');
                    } else if ((property.ltv || 0) < 80) {
                        score += 10;
                        reasons.push('標準LTV（' + (property.ltv || 0).toFixed(1) + '%）');
                    }

                    // Score based on age
                    if ((property.age || 0) < 10) {
                        score += 15;
                        reasons.push('築浅（築' + (property.age || 0) + '年）');
                    } else if ((property.age || 0) < 20) {
                        score += 10;
                        reasons.push('適正築年数（築' + (property.age || 0) + '年）');
                    }

                    // Score based on NOI
                    if ((property.noi || 0) > 10000000) {
                        score += 10;
                        reasons.push('高NOI（¥' + (property.noi || 0).toLocaleString() + '）');
                    }

                    return { property, score, reasons };
                });

                // Sort by score
                scoredProperties.sort((a, b) => b.score - a.score);

                // Render recommendation cards
                container.innerHTML = scoredProperties.map((item, index) => {
                    const rank = index + 1;
                    const rankColor = rank === 1 ? 'yellow' : rank === 2 ? 'gray' : 'orange';
                    const rankIcon = rank === 1 ? 'crown' : rank === 2 ? 'medal' : 'award';
                    const scoreColor = item.score >= 80 ? 'green' : item.score >= 60 ? 'blue' : item.score >= 40 ? 'yellow' : 'orange';

                    return \`
                        <div class="p-4 border-2 border-\${scoreColor}-200 bg-\${scoreColor}-50 rounded-lg">
                            <div class="flex items-start justify-between mb-3">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <i class="fas fa-\${rankIcon} text-\${rankColor}-600 text-xl"></i>
                                        <h3 class="font-bold text-gray-900">\${rank}位: \${item.property.name}</h3>
                                    </div>
                                    <div class="flex items-center gap-2">
                                        <span class="text-sm font-semibold text-\${scoreColor}-700">総合スコア:</span>
                                        <div class="flex-1 bg-gray-200 rounded-full h-2">
                                            <div class="bg-\${scoreColor}-600 h-2 rounded-full" style="width: \${item.score}%"></div>
                                        </div>
                                        <span class="text-sm font-bold text-\${scoreColor}-900">\${item.score}/100</span>
                                    </div>
                                </div>
                            </div>
                            <div class="space-y-1">
                                <p class="text-sm font-semibold text-gray-700">推奨理由:</p>
                                <ul class="space-y-1">
                                    \${item.reasons.map(reason => \`
                                        <li class="text-sm text-gray-600 flex items-start">
                                            <i class="fas fa-check-circle text-\${scoreColor}-600 mr-2 mt-0.5"></i>
                                            <span>\${reason}</span>
                                        </li>
                                    \`).join('')}
                                </ul>
                            </div>
                        </div>
                    \`;
                }).join('');
            }

            function removeProperty(propertyId) {
                selectedProperties = selectedProperties.filter(id => id !== propertyId);
                
                if (selectedProperties.length === 0) {
                    clearSelection();
                    return;
                }

                // Update URL and reload
                const newUrl = window.location.pathname + '?ids=' + selectedProperties.join(',');
                window.location.href = newUrl;
            }

            function clearSelection() {
                localStorage.removeItem('comparisonIds');
                window.location.href = '/properties';
            }

            function exportToCSV() {
                alert('CSV エクスポート機能は今後実装予定です。現在は印刷機能（Ctrl+P / Cmd+P）をご利用ください。');
            }

            // Load data on page load
            loadComparisonData();
        </script>
    </body>
    </html>
  `);
});

export default comparison;
