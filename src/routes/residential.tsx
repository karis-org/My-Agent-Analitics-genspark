// Residential Property Evaluation Routes
// 実需用不動産評価ページ

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const residential = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply authentication to all routes
residential.use('/*', authMiddleware);

/**
 * Residential Property Evaluation Page
 * 実需用不動産評価ページ
 * GET /residential/evaluate
 */
residential.get('/evaluate', async (c) => {
  const { var: { user } } = c;
  
  if (!user) {
    return c.redirect('/auth/login');
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>実需用不動産評価 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            .dark { background-color: #1a202c; color: #e2e8f0; }
            .dark .bg-white { background-color: #2d3748; }
            .dark .text-gray-700 { color: #cbd5e0; }
            .dark .text-gray-900 { color: #e2e8f0; }
            .dark .border-gray-300 { border-color: #4a5568; }
            .input-group { margin-bottom: 1rem; }
            .section-title { font-size: 1.5rem; font-weight: 600; margin-top: 2rem; margin-bottom: 1rem; color: #2563eb; }
        </style>
    </head>
    <body class="bg-gray-50 min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/dashboard" class="text-blue-600 hover:text-blue-700">
                        <i class="fas fa-arrow-left mr-2"></i>ダッシュボードに戻る
                    </a>
                </div>
                <div class="flex items-center space-x-4">
                    <span class="text-gray-700">
                        <i class="fas fa-user mr-2"></i>${user.name || user.email}
                    </span>
                    <a href="/auth/logout" class="text-red-600 hover:text-red-700">
                        <i class="fas fa-sign-out-alt"></i>
                    </a>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8">
            <h1 class="text-3xl font-bold text-gray-900 mb-8">
                <i class="fas fa-home text-blue-600 mr-3"></i>実需用不動産の資産性評価
            </h1>

            <!-- Evaluation Form -->
            <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                <form id="evaluationForm">
                    <!-- Target Property Information -->
                    <div class="section-title">
                        <i class="fas fa-building mr-2"></i>評価対象物件情報
                    </div>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">物件名</label>
                            <input type="text" id="propertyName" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="恵比寿マンション" required>
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                            <input type="text" id="propertyLocation" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="東京都渋谷区恵比寿">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">専有面積 (㎡)</label>
                            <input type="number" id="propertyArea" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="65" step="0.01" required>
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">築年数 (年)</label>
                            <input type="number" id="propertyAge" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="5" required>
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">駅距離 (分)</label>
                            <input type="number" id="propertyDistance" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="8" required>
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">構造</label>
                            <select id="propertyStructure" class="w-full px-4 py-2 border border-gray-300 rounded-lg">
                                <option value="RC">RC造</option>
                                <option value="SRC">SRC造</option>
                                <option value="Steel">鉄骨造</option>
                                <option value="Wood">木造</option>
                            </select>
                        </div>
                    </div>

                    <!-- Building Specification for Cost Approach -->
                    <div class="section-title">
                        <i class="fas fa-hammer mr-2"></i>原価法評価データ
                    </div>
                    <div class="grid md:grid-cols-2 gap-4">
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">土地面積 (㎡)</label>
                            <input type="number" id="landArea" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="150" step="0.01">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">土地単価 (円/㎡)</label>
                            <input type="number" id="landPricePerSqm" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="850000">
                        </div>
                    </div>

                    <!-- Asset Evaluation Factors -->
                    <div class="section-title">
                        <i class="fas fa-star mr-2"></i>資産性評価スコア (各0-100点)
                    </div>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">立地スコア</label>
                            <input type="number" id="locationScore" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="85" min="0" max="100">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">アクセススコア</label>
                            <input type="number" id="accessibilityScore" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="90" min="0" max="100">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">周辺環境スコア</label>
                            <input type="number" id="neighborhoodScore" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="80" min="0" max="100">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">建物品質スコア</label>
                            <input type="number" id="buildingQualityScore" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="75" min="0" max="100">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">将来性スコア</label>
                            <input type="number" id="futureProspectScore" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="70" min="0" max="100">
                        </div>
                        <div class="input-group">
                            <label class="block text-sm font-medium text-gray-700 mb-2">流動性スコア</label>
                            <input type="number" id="liquidityScore" class="w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="85" min="0" max="100">
                        </div>
                    </div>

                    <!-- OCR Upload Section -->
                    <div class="section-title">
                        <i class="fas fa-file-image mr-2"></i>マイソク・概要書読み取り
                    </div>
                    <div class="bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg p-6 mb-4">
                        <div class="text-center">
                            <i class="fas fa-upload text-4xl text-blue-600 mb-3"></i>
                            <p class="text-sm text-gray-700 mb-3">画像をアップロードすると物件情報を自動で入力します</p>
                            <input type="file" id="mysoku-upload" accept="image/*,.pdf" class="hidden">
                            <button type="button" onclick="document.getElementById('mysoku-upload').click()"
                                    class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                <i class="fas fa-upload mr-2"></i>画像をアップロード
                            </button>
                            <p class="text-xs text-gray-500 mt-2">対応形式: JPG, PNG, PDF</p>
                        </div>
                        <div id="ocr-status" class="mt-4 hidden"></div>
                    </div>

                    <!-- Comparables Section -->
                    <div class="section-title">
                        <i class="fas fa-chart-line mr-2"></i>周辺取引事例
                    </div>
                    <div class="mb-4">
                        <button type="button" id="autoFetchComparablesBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-download mr-2"></i>不動産情報ライブラリから自動取得
                        </button>
                        <span id="comparable-fetch-status" class="ml-3 text-sm text-gray-600"></span>
                    </div>
                    <div id="comparablesContainer" class="space-y-4">
                        <!-- Comparables will be added here dynamically -->
                    </div>
                    <button type="button" id="addComparableBtn" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>取引事例を手動追加
                    </button>

                    <!-- Land Price History Section -->
                    <div class="section-title">
                        <i class="fas fa-chart-area mr-2"></i>地価推移データ（5年分）
                    </div>
                    <div class="mb-4">
                        <button type="button" id="autoFetchLandPricesBtn" class="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg">
                            <i class="fas fa-download mr-2"></i>不動産情報ライブラリから自動取得
                        </button>
                        <span id="landprice-fetch-status" class="ml-3 text-sm text-gray-600"></span>
                    </div>
                    <div id="landPriceContainer" class="space-y-4">
                        <!-- Land price history will be added here -->
                    </div>
                    <button type="button" id="addLandPriceBtn" class="mt-4 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg">
                        <i class="fas fa-plus mr-2"></i>地価データを手動追加
                    </button>

                    <!-- Evaluation Methods -->
                    <div class="section-title">
                        <i class="fas fa-cogs mr-2"></i>評価手法の選択
                    </div>
                    <div class="grid md:grid-cols-2 gap-4">
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="methodComparison" checked class="w-5 h-5">
                            <span>取引事例比較法</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="methodCost" checked class="w-5 h-5">
                            <span>原価法</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="methodTrend" checked class="w-5 h-5">
                            <span>地価推移分析</span>
                        </label>
                        <label class="flex items-center space-x-2">
                            <input type="checkbox" id="methodAsset" checked class="w-5 h-5">
                            <span>総合資産性スコア</span>
                        </label>
                    </div>

                    <!-- Submit Button -->
                    <div class="mt-8">
                        <button type="submit" class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium text-lg">
                            <i class="fas fa-calculator mr-2"></i>評価を実行
                        </button>
                    </div>
                </form>
            </div>

            <!-- Loading Indicator -->
            <div id="loadingIndicator" class="hidden bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <i class="fas fa-spinner fa-spin text-blue-600 text-3xl mb-4"></i>
                <p class="text-blue-800">評価を実行中です...</p>
            </div>

            <!-- Results Container -->
            <div id="resultsContainer" class="hidden">
                <!-- Results will be displayed here -->
            </div>
        </main>

        <script>
            let comparableCount = 0;
            let landPriceCount = 0;

            // OCR Upload Handler
            document.getElementById('mysoku-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const statusDiv = document.getElementById('ocr-status');
                statusDiv.innerHTML = '<div class="flex items-center justify-center space-x-2"><i class="fas fa-spinner fa-spin text-blue-600"></i><span class="text-sm text-gray-700">画像を解析中...</span></div>';
                statusDiv.classList.remove('hidden');
                
                try {
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        try {
                            const response = await axios.post('/api/properties/ocr', {
                                image: event.target.result,
                                filename: file.name
                            });
                            
                            const data = response.data;
                            console.log('OCR Response Data (Residential):', data);
                            
                            // Populate form fields
                            if (data.name) {
                                console.log('Setting name:', data.name);
                                document.getElementById('propertyName').value = data.name;
                            }
                            if (data.location) {
                                console.log('Setting location:', data.location);
                                document.getElementById('propertyLocation').value = data.location;
                            }
                            if (data.total_floor_area) {
                                console.log('Setting total_floor_area:', data.total_floor_area);
                                document.getElementById('propertyArea').value = data.total_floor_area;
                            }
                            if (data.age) {
                                console.log('Setting age:', data.age);
                                document.getElementById('propertyAge').value = data.age;
                            }
                            if (data.distance_from_station) {
                                console.log('Setting distance_from_station:', data.distance_from_station);
                                document.getElementById('propertyDistance').value = data.distance_from_station;
                            }
                            if (data.structure) {
                                console.log('Setting structure:', data.structure);
                                const structureMap = {
                                    'RC造': 'RC',
                                    'SRC造': 'SRC',
                                    '鉄骨造': 'Steel',
                                    '木造': 'Wood'
                                };
                                document.getElementById('propertyStructure').value = structureMap[data.structure] || 'RC';
                            }
                            
                            // 抽出情報の一覧を作成
                            const extractedFields = [];
                            if (data.name) extractedFields.push(\`物件名: \${data.name}\`);
                            if (data.location) extractedFields.push(\`所在地: \${data.location}\`);
                            if (data.total_floor_area) extractedFields.push(\`延床面積: \${data.total_floor_area}㎡\`);
                            if (data.age) extractedFields.push(\`築年数: \${data.age}年\`);
                            if (data.distance_from_station) extractedFields.push(\`駅距離: 徒歩\${data.distance_from_station}分\`);
                            if (data.structure) extractedFields.push(\`構造: \${data.structure}\`);
                            
                            const fieldsSummary = extractedFields.length > 0 
                                ? \`<ul class="mt-2 text-xs text-gray-600 space-y-1">\${extractedFields.map(f => \`<li>✓ \${f}</li>\`).join('')}</ul>\`
                                : '';
                            
                            if (data.mode === 'demonstration') {
                                statusDiv.innerHTML = \`<div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4"><i class="fas fa-info-circle text-yellow-600 mr-2"></i><span class="text-sm text-yellow-800 font-medium">デモモード: サンプルデータを表示しています</span><p class="text-xs text-yellow-700 mt-2">実際のOCR機能を利用するには、OpenAI APIキーを設定してください。</p>\${fieldsSummary}</div>\`;
                            } else {
                                statusDiv.innerHTML = \`<div class="bg-green-50 border border-green-200 rounded-lg p-4"><i class="fas fa-check-circle text-green-600 mr-2"></i><span class="text-sm text-green-800 font-medium">物件情報を自動入力しました</span>\${fieldsSummary}</div>\`;
                            }
                        } catch (error) {
                            console.error('OCR failed:', error);
                            let errorMessage = '画像の読み取りに失敗しました';
                            if (error.response && error.response.data) {
                                errorMessage = error.response.data.error || errorMessage;
                            }
                            statusDiv.innerHTML = \`<div class="bg-red-50 border border-red-200 rounded-lg p-4"><i class="fas fa-exclamation-circle text-red-600 mr-2"></i><span class="text-sm text-red-800">\${errorMessage}</span></div>\`;
                        }
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('File read error:', error);
                    statusDiv.classList.add('hidden');
                }
            });

            // Auto-fetch comparables from Reinfolib API
            document.getElementById('autoFetchComparablesBtn').addEventListener('click', async function() {
                const statusSpan = document.getElementById('comparable-fetch-status');
                statusSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 取得中...';
                
                try {
                    // Get property location to determine city code
                    const location = document.getElementById('propertyLocation').value;
                    const area = parseFloat(document.getElementById('propertyArea').value) || 65;
                    
                    if (!location) {
                        alert('物件の所在地を入力してください');
                        statusSpan.innerHTML = '';
                        return;
                    }
                    
                    // Extract city code from location (simplified - you may need more sophisticated parsing)
                    // For demo, using Tokyo's Shibuya: 13113
                    const cityCode = '13113'; // TODO: Implement proper location to city code mapping
                    
                    const response = await axios.post('/api/market/comparables', {
                        city: cityCode,
                        propertyType: '中古マンション等',
                        minArea: area * 0.85,
                        maxArea: area * 1.15,
                        limit: 10
                    });
                    
                    if (response.data.success && response.data.data && response.data.data.length > 0) {
                        // Clear existing comparables
                        document.getElementById('comparablesContainer').innerHTML = '';
                        
                        // Add fetched comparables
                        response.data.data.slice(0, 5).forEach((comp, index) => {
                            comparableCount++;
                            const container = document.getElementById('comparablesContainer');
                            const comparableDiv = document.createElement('div');
                            comparableDiv.className = 'border border-purple-300 bg-purple-50 rounded-lg p-4';
                            comparableDiv.innerHTML = \`
                                <div class="flex justify-between items-center mb-4">
                                    <h4 class="font-semibold text-purple-800"><i class="fas fa-download mr-2"></i>取引事例 #\${comparableCount} (自動取得)</h4>
                                    <button type="button" class="text-red-600 hover:text-red-700" onclick="this.parentElement.parentElement.remove()">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                                <div class="grid md:grid-cols-3 gap-4">
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">取引価格 (円)</label>
                                        <input type="number" class="comparable-price w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${comp.TradePrice || ''}" readonly>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">面積 (㎡)</label>
                                        <input type="number" class="comparable-area w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${comp.Area || ''}" step="0.01" readonly>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">築年数 (年)</label>
                                        <input type="number" class="comparable-age w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${comp.BuildingYear ? 2025 - parseInt(comp.BuildingYear.replace(/[^0-9]/g, '')) : ''}" readonly>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">駅距離 (分)</label>
                                        <input type="number" class="comparable-distance w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${comp.TimeToNearestStation || ''}" readonly>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">取引時期</label>
                                        <input type="text" class="comparable-date w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${comp.Period || ''}" readonly>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                                        <input type="text" class="comparable-location w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${comp.Municipality || ''}" readonly>
                                    </div>
                                </div>
                            \`;
                            container.appendChild(comparableDiv);
                        });
                        
                        statusSpan.innerHTML = \`<i class="fas fa-check-circle text-green-600"></i> \${response.data.data.length}件取得成功\`;
                        setTimeout(() => statusSpan.innerHTML = '', 3000);
                    } else {
                        statusSpan.innerHTML = '<i class="fas fa-exclamation-circle text-yellow-600"></i> データが見つかりませんでした';
                        setTimeout(() => statusSpan.innerHTML = '', 3000);
                    }
                } catch (error) {
                    console.error('Failed to fetch comparables:', error);
                    statusSpan.innerHTML = '<i class="fas fa-times-circle text-red-600"></i> 取得失敗';
                    setTimeout(() => statusSpan.innerHTML = '', 3000);
                }
            });

            // Auto-fetch land prices from Reinfolib API (last 5 years)
            document.getElementById('autoFetchLandPricesBtn').addEventListener('click', async function() {
                const statusSpan = document.getElementById('landprice-fetch-status');
                statusSpan.innerHTML = '<i class="fas fa-spinner fa-spin"></i> 取得中...';
                
                try {
                    const location = document.getElementById('propertyLocation').value;
                    
                    if (!location) {
                        alert('物件の所在地を入力してください');
                        statusSpan.innerHTML = '';
                        return;
                    }
                    
                    // Extract prefecture code from location (simplified)
                    const prefCode = '13'; // TODO: Implement proper location to pref code mapping
                    
                    // Clear existing land prices
                    document.getElementById('landPriceContainer').innerHTML = '';
                    
                    // Fetch land prices for last 5 years
                    const currentYear = new Date().getFullYear();
                    const years = [currentYear - 4, currentYear - 3, currentYear - 2, currentYear - 1, currentYear];
                    
                    let successCount = 0;
                    for (const year of years) {
                        try {
                            const response = await axios.get(\`/api/market/land-prices?year=\${year}&area=\${prefCode}&division=00\`);
                            
                            if (response.data.success && response.data.data && response.data.data.length > 0) {
                                // Take first land price data point
                                const landData = response.data.data[0];
                                const pricePerSqm = landData.CurrentYearPrice || landData.PreviousYearPrice || 0;
                                
                                if (pricePerSqm > 0) {
                                    landPriceCount++;
                                    const container = document.getElementById('landPriceContainer');
                                    const landPriceDiv = document.createElement('div');
                                    landPriceDiv.className = 'border border-purple-300 bg-purple-50 rounded-lg p-4 flex items-end gap-4';
                                    landPriceDiv.innerHTML = \`
                                        <div class="flex-1">
                                            <label class="block text-sm font-medium text-gray-700 mb-2"><i class="fas fa-download mr-2 text-purple-600"></i>年</label>
                                            <input type="number" class="land-price-year w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${year}" readonly>
                                        </div>
                                        <div class="flex-1">
                                            <label class="block text-sm font-medium text-gray-700 mb-2">地価 (円/㎡)</label>
                                            <input type="number" class="land-price-value w-full px-4 py-2 border border-gray-300 rounded-lg" value="\${pricePerSqm}" readonly>
                                        </div>
                                        <button type="button" class="text-red-600 hover:text-red-700 px-4 py-2" onclick="this.parentElement.remove()">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    \`;
                                    container.appendChild(landPriceDiv);
                                    successCount++;
                                }
                            }
                        } catch (error) {
                            console.error(\`Failed to fetch land price for year \${year}:\`, error);
                        }
                    }
                    
                    if (successCount > 0) {
                        statusSpan.innerHTML = \`<i class="fas fa-check-circle text-green-600"></i> \${successCount}年分取得成功\`;
                    } else {
                        statusSpan.innerHTML = '<i class="fas fa-exclamation-circle text-yellow-600"></i> データが見つかりませんでした';
                    }
                    setTimeout(() => statusSpan.innerHTML = '', 3000);
                } catch (error) {
                    console.error('Failed to fetch land prices:', error);
                    statusSpan.innerHTML = '<i class="fas fa-times-circle text-red-600"></i> 取得失敗';
                    setTimeout(() => statusSpan.innerHTML = '', 3000);
                }
            });

            // Add comparable form
            document.getElementById('addComparableBtn').addEventListener('click', function() {
                comparableCount++;
                const container = document.getElementById('comparablesContainer');
                const comparableDiv = document.createElement('div');
                comparableDiv.className = 'border border-gray-300 rounded-lg p-4';
                comparableDiv.innerHTML = \`
                    <div class="flex justify-between items-center mb-4">
                        <h4 class="font-semibold">取引事例 #\${comparableCount}</h4>
                        <button type="button" class="text-red-600 hover:text-red-700" onclick="this.parentElement.parentElement.remove()">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                    <div class="grid md:grid-cols-3 gap-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">取引価格 (円)</label>
                            <input type="number" class="comparable-price w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="45000000">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">面積 (㎡)</label>
                            <input type="number" class="comparable-area w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="62" step="0.01">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">築年数 (年)</label>
                            <input type="number" class="comparable-age w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="3">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">駅距離 (分)</label>
                            <input type="number" class="comparable-distance w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="5">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">取引時期</label>
                            <input type="month" class="comparable-date w-full px-4 py-2 border border-gray-300 rounded-lg">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                            <input type="text" class="comparable-location w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="渋谷区恵比寿">
                        </div>
                    </div>
                \`;
                container.appendChild(comparableDiv);
            });

            // Add land price data form
            document.getElementById('addLandPriceBtn').addEventListener('click', function() {
                landPriceCount++;
                const container = document.getElementById('landPriceContainer');
                const landPriceDiv = document.createElement('div');
                landPriceDiv.className = 'border border-gray-300 rounded-lg p-4 flex items-end gap-4';
                landPriceDiv.innerHTML = \`
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-2">年</label>
                        <input type="number" class="land-price-year w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="2020">
                    </div>
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-2">地価 (円/㎡)</label>
                        <input type="number" class="land-price-value w-full px-4 py-2 border border-gray-300 rounded-lg" placeholder="800000">
                    </div>
                    <button type="button" class="text-red-600 hover:text-red-700 px-4 py-2" onclick="this.parentElement.remove()">
                        <i class="fas fa-trash"></i>
                    </button>
                \`;
                container.appendChild(landPriceDiv);
            });

            // Form submission
            document.getElementById('evaluationForm').addEventListener('submit', async function(e) {
                e.preventDefault();

                // Show loading
                document.getElementById('loadingIndicator').classList.remove('hidden');
                document.getElementById('resultsContainer').classList.add('hidden');

                // Collect form data
                const targetProperty = {
                    name: document.getElementById('propertyName').value,
                    area: parseFloat(document.getElementById('propertyArea').value),
                    age: parseInt(document.getElementById('propertyAge').value),
                    distanceFromStation: parseFloat(document.getElementById('propertyDistance').value),
                };

                const buildingSpec = {
                    structure: document.getElementById('propertyStructure').value,
                    totalFloorArea: parseFloat(document.getElementById('propertyArea').value),
                    age: parseInt(document.getElementById('propertyAge').value),
                    landArea: parseFloat(document.getElementById('landArea').value) || 0,
                    landPricePerSquareMeter: parseFloat(document.getElementById('landPricePerSqm').value) || 0,
                };

                const assetFactors = {
                    locationScore: parseFloat(document.getElementById('locationScore').value) || 0,
                    accessibilityScore: parseFloat(document.getElementById('accessibilityScore').value) || 0,
                    neighborhoodScore: parseFloat(document.getElementById('neighborhoodScore').value) || 0,
                    buildingQualityScore: parseFloat(document.getElementById('buildingQualityScore').value) || 0,
                    futureProspectScore: parseFloat(document.getElementById('futureProspectScore').value) || 0,
                    liquidityScore: parseFloat(document.getElementById('liquidityScore').value) || 0,
                };

                // Collect comparables
                const comparables = [];
                document.querySelectorAll('#comparablesContainer > div').forEach(div => {
                    const price = div.querySelector('.comparable-price').value;
                    const area = div.querySelector('.comparable-area').value;
                    if (price && area) {
                        comparables.push({
                            price: parseFloat(price),
                            area: parseFloat(area),
                            age: parseInt(div.querySelector('.comparable-age').value) || 0,
                            distanceFromStation: parseFloat(div.querySelector('.comparable-distance').value) || 0,
                            transactionDate: div.querySelector('.comparable-date').value || new Date().toISOString().slice(0,7),
                            location: div.querySelector('.comparable-location').value || '',
                        });
                    }
                });

                // Collect land price history
                const landPriceHistory = [];
                document.querySelectorAll('#landPriceContainer > div').forEach(div => {
                    const year = div.querySelector('.land-price-year').value;
                    const price = div.querySelector('.land-price-value').value;
                    if (year && price) {
                        landPriceHistory.push({
                            year: parseInt(year),
                            pricePerSquareMeter: parseFloat(price),
                        });
                    }
                });

                // Get selected evaluation methods
                const evaluationMethods = [];
                if (document.getElementById('methodComparison').checked) evaluationMethods.push('comparison');
                if (document.getElementById('methodCost').checked) evaluationMethods.push('cost');
                if (document.getElementById('methodTrend').checked) evaluationMethods.push('trend');
                if (document.getElementById('methodAsset').checked) evaluationMethods.push('asset');

                try {
                    const response = await axios.post('/api/properties/residential/evaluate', {
                        targetProperty,
                        comparables,
                        buildingSpec,
                        landPriceHistory,
                        assetFactors,
                        evaluationMethods,
                    });

                    displayResults(response.data);
                } catch (error) {
                    console.error('Evaluation error:', error);
                    alert('評価の実行中にエラーが発生しました: ' + (error.response?.data?.error || error.message));
                } finally {
                    document.getElementById('loadingIndicator').classList.add('hidden');
                }
            });

            function displayResults(data) {
                const container = document.getElementById('resultsContainer');
                const { summary, results } = data;

                let html = \`
                    <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                        <h2 class="text-2xl font-bold text-gray-900 mb-4">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>評価結果
                        </h2>
                        <p class="text-gray-700 mb-2">物件名: <strong>\${summary.propertyName}</strong></p>
                        <p class="text-gray-600 text-sm">評価日時: \${new Date(summary.evaluatedAt).toLocaleString('ja-JP')}</p>
                    </div>
                \`;

                // Comparison Analysis
                if (results.comparisonAnalysis && !results.comparisonAnalysis.error) {
                    const comp = results.comparisonAnalysis;
                    html += \`
                        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 class="text-xl font-bold text-blue-600 mb-4">
                                <i class="fas fa-balance-scale mr-2"></i>取引事例比較法
                            </h3>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-gray-700">推定価格</p>
                                    <p class="text-2xl font-bold text-blue-600">\${comp.estimatedPrice.toLocaleString()}円</p>
                                </div>
                                <div>
                                    <p class="text-gray-700">㎡単価</p>
                                    <p class="text-2xl font-bold text-blue-600">\${comp.pricePerSquareMeter.toLocaleString()}円/㎡</p>
                                </div>
                                <div>
                                    <p class="text-gray-700">信頼度</p>
                                    <p class="text-lg font-semibold \${comp.confidence === 'high' ? 'text-green-600' : comp.confidence === 'medium' ? 'text-yellow-600' : 'text-red-600'}">
                                        \${comp.confidence === 'high' ? '高い' : comp.confidence === 'medium' ? '中程度' : '低い'}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-gray-700">参考事例数</p>
                                    <p class="text-lg font-semibold">\${comp.comparableCount}件</p>
                                </div>
                                <div class="col-span-2">
                                    <p class="text-gray-700">価格レンジ</p>
                                    <p class="text-lg">\${comp.priceRange.min.toLocaleString()}円 〜 \${comp.priceRange.max.toLocaleString()}円</p>
                                </div>
                            </div>
                        </div>
                    \`;
                }

                // Cost Approach
                if (results.costApproach && !results.costApproach.error) {
                    const cost = results.costApproach;
                    html += \`
                        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 class="text-xl font-bold text-green-600 mb-4">
                                <i class="fas fa-hammer mr-2"></i>原価法
                            </h3>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-gray-700">土地価値</p>
                                    <p class="text-2xl font-bold text-green-600">\${cost.landValue.toLocaleString()}円</p>
                                </div>
                                <div>
                                    <p class="text-gray-700">建物価値</p>
                                    <p class="text-2xl font-bold text-green-600">\${cost.buildingValue.toLocaleString()}円</p>
                                </div>
                                <div>
                                    <p class="text-gray-700">総価値</p>
                                    <p class="text-2xl font-bold text-green-600">\${cost.totalValue.toLocaleString()}円</p>
                                </div>
                                <div>
                                    <p class="text-gray-700">減価償却率</p>
                                    <p class="text-lg font-semibold">\${cost.depreciationRate.toFixed(2)}%</p>
                                </div>
                            </div>
                        </div>
                    \`;
                }

                // Land Price Trend
                if (results.landPriceTrend && !results.landPriceTrend.error) {
                    const trend = results.landPriceTrend;
                    html += \`
                        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 class="text-xl font-bold text-purple-600 mb-4">
                                <i class="fas fa-chart-line mr-2"></i>地価推移分析
                            </h3>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-gray-700">現在の地価</p>
                                    <p class="text-2xl font-bold text-purple-600">\${trend.currentPrice.toLocaleString()}円/㎡</p>
                                </div>
                                <div>
                                    <p class="text-gray-700">年平均成長率</p>
                                    <p class="text-lg font-semibold \${trend.averageAnnualGrowthRate > 0 ? 'text-green-600' : 'text-red-600'}">
                                        \${trend.averageAnnualGrowthRate > 0 ? '+' : ''}\${trend.averageAnnualGrowthRate.toFixed(2)}%
                                    </p>
                                </div>
                                <div>
                                    <p class="text-gray-700">トレンド</p>
                                    <p class="text-lg font-semibold \${trend.trend === 'rising' ? 'text-green-600' : trend.trend === 'stable' ? 'text-blue-600' : 'text-red-600'}">
                                        \${trend.trend === 'rising' ? '上昇' : trend.trend === 'stable' ? '安定' : '下落'}
                                    </p>
                                </div>
                                <div>
                                    <p class="text-gray-700">5年後予測価格</p>
                                    <p class="text-lg font-semibold">\${trend.projectedPrice5Years.toLocaleString()}円/㎡</p>
                                </div>
                            </div>
                        </div>
                    \`;
                }

                // Asset Score
                if (results.assetScore && !results.assetScore.error) {
                    const asset = results.assetScore;
                    html += \`
                        <div class="bg-white rounded-lg shadow-md p-6 mb-8">
                            <h3 class="text-xl font-bold text-orange-600 mb-4">
                                <i class="fas fa-star mr-2"></i>総合資産性スコア
                            </h3>
                            <div class="text-center mb-6">
                                <div class="text-6xl font-bold text-orange-600">\${asset.rating}</div>
                                <p class="text-2xl font-semibold mt-2">\${asset.totalScore.toFixed(1)}点 / 100点</p>
                            </div>
                            <div class="grid md:grid-cols-2 gap-4">
                                <div>
                                    <p class="text-gray-700 font-medium">強み</p>
                                    <ul class="list-disc list-inside text-green-600">
                                        \${asset.strengths.map(s => \`<li>\${s}</li>\`).join('')}
                                    </ul>
                                </div>
                                <div>
                                    <p class="text-gray-700 font-medium">弱み</p>
                                    <ul class="list-disc list-inside text-red-600">
                                        \${asset.weaknesses.map(w => \`<li>\${w}</li>\`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    \`;
                }

                container.innerHTML = html;
                container.classList.remove('hidden');

                // Scroll to results
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        </script>
    </body>
    </html>
  `);
});

export default residential;
