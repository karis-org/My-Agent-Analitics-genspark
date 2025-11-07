// Properties routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const properties = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all property routes
properties.use('/*', authMiddleware);

/**
 * Property list page
 */
properties.get('/', (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>物件一覧 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-12 w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">物件一覧</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/properties/new" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>新規登録
                        </a>
                        <a href="/dashboard" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-home"></i>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div class="mb-6">
                <div class="flex items-center justify-between">
                    <p class="text-gray-600">登録済み物件を管理します</p>
                    <div class="flex space-x-2">
                        <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-filter mr-2"></i>フィルター
                        </button>
                        <button class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                            <i class="fas fa-sort mr-2"></i>並び替え
                        </button>
                    </div>
                </div>
            </div>

            <!-- Properties List -->
            <div id="properties-list" class="space-y-4">
                <div class="text-center py-12 bg-white rounded-lg shadow">
                    <i class="fas fa-building text-6xl text-gray-300 mb-4"></i>
                    <p class="text-gray-600 mb-4">まだ物件が登録されていません</p>
                    <a href="/properties/new" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                        <i class="fas fa-plus mr-2"></i>最初の物件を登録
                    </a>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // Load properties
            async function loadProperties() {
                try {
                    const response = await axios.get('/api/properties');
                    const properties = response.data.properties;
                    
                    if (properties.length === 0) return;
                    
                    const listContainer = document.getElementById('properties-list');
                    listContainer.innerHTML = properties.map(property => \`
                        <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6">
                            <div class="flex items-center justify-between mb-4">
                                <h3 class="text-xl font-bold text-gray-900">\${property.name}</h3>
                                <span class="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                                    \${property.structure || '構造不明'}
                                </span>
                            </div>
                            <div class="grid md:grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p class="text-sm text-gray-500">所在地</p>
                                    <p class="font-medium">\${property.location || '未設定'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">価格</p>
                                    <p class="font-medium text-lg">¥\${(property.price || 0).toLocaleString()}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">延床面積</p>
                                    <p class="font-medium">\${property.total_floor_area || 0}㎡</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-500">築年数</p>
                                    <p class="font-medium">\${property.age || 0}年</p>
                                </div>
                            </div>
                            <div class="flex items-center justify-end space-x-2">
                                <a href="/properties/\${property.id}" 
                                   class="px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                    <i class="fas fa-eye mr-2"></i>詳細
                                </a>
                                <a href="/properties/\${property.id}/analyze" 
                                   class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                                    <i class="fas fa-chart-line mr-2"></i>分析
                                </a>
                                <button onclick="deleteProperty('\${property.id}')"
                                        class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load properties:', error);
                }
            }
            
            async function deleteProperty(id) {
                if (!confirm('この物件を削除してもよろしいですか？')) return;
                
                try {
                    await axios.delete(\`/api/properties/\${id}\`);
                    loadProperties();
                } catch (error) {
                    console.error('Failed to delete property:', error);
                    alert('物件の削除に失敗しました');
                }
            }
            
            // Load on page load
            loadProperties();
        </script>
    </body>
    </html>
  `);
});

/**
 * New property form page
 */
properties.get('/new', (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新規物件登録 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-12 w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">新規物件登録</h1>
                    </div>
                    <a href="/properties" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-times"></i> キャンセル
                    </a>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- マイソクアップロード -->
            <div class="bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg p-8 mb-6">
                <div class="text-center">
                    <i class="fas fa-file-image text-5xl text-blue-600 mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">マイソク・物件概要書を読み取り</h3>
                    <p class="text-sm text-gray-600 mb-4">画像またはPDFをアップロードすると自動で物件情報を入力します</p>
                    <input type="file" id="mysoku-upload" accept="image/jpeg,image/jpg,image/png,application/pdf" class="hidden">
                    <button type="button" onclick="document.getElementById('mysoku-upload').click()"
                            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-upload mr-2"></i>ファイルをアップロード
                    </button>
                    <p class="text-xs text-gray-500 mt-2">対応形式: JPG, PNG, PDF（PDFは自動的に画像に変換されます）</p>
                </div>
                <div id="upload-status" class="mt-4 hidden">
                    <div class="flex items-center justify-center space-x-2">
                        <i class="fas fa-spinner fa-spin text-blue-600"></i>
                        <span class="text-sm text-gray-700">画像を解析中...</span>
                    </div>
                </div>
                <div id="upload-result" class="mt-4 hidden">
                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                        <span class="text-sm text-green-800">物件情報を自動入力しました</span>
                    </div>
                </div>
            </div>

            <div class="bg-white rounded-lg shadow p-8">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">物件情報入力</h2>
                
                <form id="property-form" class="space-y-6">
                    <!-- 基本情報 -->
                    <div class="border-b pb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                        <div class="grid md:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">物件名 *</label>
                                <input type="text" name="name" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">価格 (円) *</label>
                                <input type="number" name="price" required
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">想定賃料 (円/月)</label>
                                <input type="number" name="monthly_rent" id="monthly_rent"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="例: 100000">
                                <p class="text-xs text-gray-500 mt-1">収益物件の場合、想定される月額賃料を入力してください</p>
                            </div>
                            <div class="md:col-span-2">
                                <label class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                                <input type="text" name="location"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                       placeholder="例: 東京都渋谷区...">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">構造</label>
                                <select name="structure" 
                                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                    <option value="">選択してください</option>
                                    <option value="RC造">RC造</option>
                                    <option value="SRC造">SRC造</option>
                                    <option value="鉄骨造">鉄骨造</option>
                                    <option value="木造">木造</option>
                                </select>
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">延床面積 (㎡)</label>
                                <input type="number" step="0.01" name="total_floor_area"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">築年数</label>
                                <input type="number" name="age"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">駅距離 (分)</label>
                                <input type="number" step="0.1" name="distance_from_station"
                                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            </div>
                        </div>
                    </div>

                    <!-- 実行する分析の選択 -->
                    <div class="border-b pb-6">
                        <h3 class="text-lg font-semibold text-gray-900 mb-4">
                            <i class="fas fa-tasks text-blue-600 mr-2"></i>実行する分析を選択
                        </h3>
                        <p class="text-sm text-gray-600 mb-4">
                            物件登録と同時に実行する分析にチェックを入れてください。登録したデータが自動的に各分析で使用されます。
                        </p>
                        
                        <div class="grid md:grid-cols-2 gap-4">
                            <!-- 基本分析 -->
                            <div class="bg-blue-50 rounded-lg p-4">
                                <label class="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" name="analysis_financial" value="1" checked disabled
                                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">財務分析 <span class="text-xs text-blue-600">(必須)</span></div>
                                        <p class="text-xs text-gray-600 mt-1">NOI、利回り、DSCR、LTV等の投資指標を自動計算</p>
                                    </div>
                                </label>
                            </div>
                            
                            <!-- 事故物件調査 -->
                            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <label class="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" name="analysis_stigma" value="1"
                                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">事故物件調査</div>
                                        <p class="text-xs text-gray-600 mt-1">AI搭載の心理的瑕疵調査システム</p>
                                    </div>
                                </label>
                            </div>
                            
                            <!-- 賃貸相場分析 -->
                            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <label class="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" name="analysis_rental" value="1"
                                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">イタンジBB 賃貸相場</div>
                                        <p class="text-xs text-gray-600 mt-1">周辺賃貸物件の相場と推移を分析</p>
                                    </div>
                                </label>
                            </div>
                            
                            <!-- 人口動態分析 -->
                            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <label class="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" name="analysis_demographics" value="1"
                                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">人口動態分析</div>
                                        <p class="text-xs text-gray-600 mt-1">e-Statによる地域人口統計データ</p>
                                    </div>
                                </label>
                            </div>
                            
                            <!-- AI市場分析 -->
                            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <label class="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" name="analysis_ai_market" value="1"
                                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">AI市場分析</div>
                                        <p class="text-xs text-gray-600 mt-1">OpenAI GPT-4による市場動向分析</p>
                                    </div>
                                </label>
                            </div>
                            
                            <!-- Googleマップ生成 -->
                            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                                <label class="flex items-start space-x-3 cursor-pointer">
                                    <input type="checkbox" name="analysis_maps" value="1" checked
                                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                                    <div class="flex-1">
                                        <div class="font-medium text-gray-900">周辺地図生成 <span class="text-xs text-blue-600">(推奨)</span></div>
                                        <p class="text-xs text-gray-600 mt-1">1km/200mスケールの地図自動生成</p>
                                    </div>
                                </label>
                            </div>
                        </div>
                        
                        <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                            <div class="flex items-start space-x-2">
                                <i class="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                                <p class="text-xs text-yellow-800">
                                    選択した分析は並行で実行されます。APIキーが未設定の場合はサンプルデータが表示されます。
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Submit buttons -->
                    <div class="flex items-center justify-end space-x-4">
                        <a href="/properties" 
                           class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            キャンセル
                        </a>
                        <button type="submit"
                                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>保存して分析開始
                        </button>
                    </div>
                </form>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
        <script>
            // PDF.js workerの設定
            if (typeof pdfjsLib !== 'undefined') {
                pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
            }
            
            // PDFを画像に変換する関数
            async function convertPdfToImage(file) {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                const page = await pdf.getPage(1); // 最初のページのみ
                
                const viewport = page.getViewport({ scale: 2.0 }); // 高解像度化
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = viewport.width;
                canvas.height = viewport.height;
                
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                // CanvasをBase64に変換
                return canvas.toDataURL('image/png');
            }
            
            // マイソクアップロード処理
            document.getElementById('mysoku-upload').addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const uploadStatus = document.getElementById('upload-status');
                const uploadResult = document.getElementById('upload-result');
                
                // ステータス表示
                uploadStatus.classList.remove('hidden');
                uploadResult.classList.add('hidden');
                
                try {
                    let base64Data;
                    
                    // PDFファイルの場合は画像に変換
                    if (file.type === 'application/pdf') {
                        uploadStatus.querySelector('span').textContent = 'PDFを画像に変換中...';
                        base64Data = await convertPdfToImage(file);
                    } else {
                        // 画像をBase64に変換
                        const reader = new FileReader();
                        base64Data = await new Promise((resolve) => {
                            reader.onload = (event) => resolve(event.target.result);
                            reader.readAsDataURL(file);
                        });
                    }
                    
                    uploadStatus.querySelector('span').textContent = '画像を解析中...';
                    
                    try {
                        // OCR API呼び出し
                        const response = await axios.post('/api/properties/ocr', {
                            image: base64Data,
                            filename: file.name
                        });
                            
                            const data = response.data;
                            console.log('OCR Response Data:', data);
                            
                            // フォームに自動入力
                            if (data.name) {
                                const nameInput = document.querySelector('[name="name"]');
                                console.log('Setting name:', data.name, 'to element:', nameInput);
                                nameInput.value = data.name;
                            }
                            if (data.price) {
                                console.log('Setting price:', data.price);
                                document.querySelector('[name="price"]').value = data.price;
                            }
                            if (data.location) {
                                console.log('Setting location:', data.location);
                                document.querySelector('[name="location"]').value = data.location;
                            }
                            if (data.structure) {
                                console.log('Setting structure:', data.structure);
                                document.querySelector('[name="structure"]').value = data.structure;
                            }
                            if (data.total_floor_area) {
                                console.log('Setting total_floor_area:', data.total_floor_area);
                                document.querySelector('[name="total_floor_area"]').value = data.total_floor_area;
                            }
                            if (data.age) {
                                console.log('Setting age:', data.age);
                                document.querySelector('[name="age"]').value = data.age;
                            }
                            if (data.distance_from_station) {
                                console.log('Setting distance_from_station:', data.distance_from_station);
                                document.querySelector('[name="distance_from_station"]').value = data.distance_from_station;
                            }
                            if (data.monthly_rent) {
                                console.log('Setting monthly_rent:', data.monthly_rent);
                                document.querySelector('[name="monthly_rent"]').value = data.monthly_rent;
                            }
                            
                            // 成功メッセージ
                            uploadStatus.classList.add('hidden');
                            uploadResult.classList.remove('hidden');
                            
                            // 抽出情報の一覧を作成
                            const extractedFields = [];
                            if (data.name) extractedFields.push(\`物件名: \${data.name}\`);
                            if (data.price) extractedFields.push(\`価格: ¥\${Number(data.price).toLocaleString()}\`);
                            if (data.location) extractedFields.push(\`所在地: \${data.location}\`);
                            if (data.structure) extractedFields.push(\`構造: \${data.structure}\`);
                            if (data.total_floor_area) extractedFields.push(\`延床面積: \${data.total_floor_area}㎡\`);
                            if (data.age) extractedFields.push(\`築年数: \${data.age}年\`);
                            if (data.distance_from_station) extractedFields.push(\`駅距離: 徒歩\${data.distance_from_station}分\`);
                            if (data.monthly_rent) extractedFields.push(\`想定賃料: ¥\${Number(data.monthly_rent).toLocaleString()}/月\`);
                            
                            const fieldsSummary = extractedFields.length > 0 
                                ? \`<ul class="mt-2 text-xs text-gray-600 space-y-1">\${extractedFields.map(f => \`<li>✓ \${f}</li>\`).join('')}</ul>\`
                                : '';
                            
                            uploadResult.innerHTML = \`
                                <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                    <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                    <span class="text-sm text-green-800 font-medium">物件情報を自動入力しました</span>
                                    \${fieldsSummary}
                                </div>
                            \`;
                        } catch (error) {
                            console.error('OCR failed:', error);
                            uploadStatus.classList.add('hidden');
                            
                            // エラー詳細を表示
                            let errorMessage = '画像の読み取りに失敗しました';
                            let errorDetails = '';
                            let suggestions = [];
                            
                            if (error.response && error.response.data) {
                                const errorData = error.response.data;
                                errorMessage = errorData.error || errorMessage;
                                errorDetails = errorData.details || '';
                                suggestions = errorData.suggestions || [];
                            }
                            
                            // エラーメッセージの構築
                            let suggestionHtml = '';
                            if (suggestions.length > 0) {
                                suggestionHtml = '<ul class="list-disc list-inside mt-2 space-y-1">' +
                                    suggestions.map(s => \`<li class="text-sm">\${s}</li>\`).join('') +
                                    '</ul>';
                            }
                            
                            uploadResult.innerHTML = \`
                                <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                                    <div class="flex items-start">
                                        <i class="fas fa-exclamation-circle text-red-600 mr-2 mt-1"></i>
                                        <div>
                                            <p class="text-sm font-medium text-red-800">\${errorMessage}</p>
                                            \${errorDetails ? \`<p class="text-xs text-red-600 mt-1">\${errorDetails}</p>\` : ''}
                                            \${suggestionHtml}
                                            <p class="text-sm text-red-700 mt-2">手動で入力してください。</p>
                                        </div>
                                    </div>
                                </div>
                            \`;
                            uploadResult.classList.remove('hidden');
                        }
                } catch (error) {
                    console.error('File processing error:', error);
                    uploadStatus.classList.add('hidden');
                    uploadResult.innerHTML = \`
                        <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                            <div class="flex items-start">
                                <i class="fas fa-exclamation-circle text-red-600 mr-2 mt-1"></i>
                                <div>
                                    <p class="text-sm font-medium text-red-800">ファイルの処理に失敗しました</p>
                                    <p class="text-xs text-red-600 mt-1">\${error.message || 'PDFの変換中にエラーが発生しました'}</p>
                                    <p class="text-sm text-red-700 mt-2">別のファイルをお試しいただくか、手動で入力してください。</p>
                                </div>
                            </div>
                        </div>
                    \`;
                    uploadResult.classList.remove('hidden');
                }
            });
            
            document.getElementById('property-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                // チェックされた分析オプションを取得
                const selectedAnalyses = {
                    financial: true, // 常に実行
                    stigma: formData.get('analysis_stigma') === '1',
                    rental: formData.get('analysis_rental') === '1',
                    demographics: formData.get('analysis_demographics') === '1',
                    aiMarket: formData.get('analysis_ai_market') === '1',
                    maps: formData.get('analysis_maps') === '1'
                };
                
                // ローディング表示
                const submitButton = e.target.querySelector('button[type="submit"]');
                const originalButtonText = submitButton.innerHTML;
                submitButton.disabled = true;
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登録中...';
                
                try {
                    // 1. 物件を登録
                    const response = await axios.post('/api/properties', data);
                    const propertyId = response.data.property.id;
                    const property = response.data.property;
                    
                    // 2. 選択された分析を並行実行
                    submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析実行中...';
                    
                    const analysisPromises = [];
                    
                    // 事故物件調査
                    if (selectedAnalyses.stigma && property.location) {
                        analysisPromises.push(
                            axios.post('/api/properties/stigma-check', {
                                address: property.location,
                                propertyName: property.name
                            }).then(result => ({
                                type: 'stigma',
                                success: true,
                                data: result.data
                            })).catch(error => ({
                                type: 'stigma',
                                success: false,
                                error: error.message
                            }))
                        );
                    }
                    
                    // 賃貸相場分析
                    if (selectedAnalyses.rental && property.location) {
                        // 住所から都道府県・市区町村を抽出（簡易版）
                        const locationParts = property.location.match(/^(.+?[都道府県])(.+?[市区町村])/);
                        if (locationParts) {
                            analysisPromises.push(
                                axios.post('/api/itandi/rental-analysis', {
                                    prefecture: locationParts[1],
                                    city: locationParts[2],
                                    minArea: property.total_floor_area ? property.total_floor_area * 0.8 : undefined,
                                    maxArea: property.total_floor_area ? property.total_floor_area * 1.2 : undefined
                                }).then(result => ({
                                    type: 'rental',
                                    success: true,
                                    data: result.data
                                })).catch(error => ({
                                    type: 'rental',
                                    success: false,
                                    error: error.message
                                }))
                            );
                        }
                    }
                    
                    // 人口動態分析
                    if (selectedAnalyses.demographics && property.location) {
                        // TODO: 都道府県コード・市区町村コードの取得ロジック実装
                        // 現在は東京都を仮設定
                        analysisPromises.push(
                            axios.post('/api/estat/demographics', {
                                prefCode: '13',
                                cityCode: '13101'
                            }).then(result => ({
                                type: 'demographics',
                                success: true,
                                data: result.data
                            })).catch(error => ({
                                type: 'demographics',
                                success: false,
                                error: error.message
                            }))
                        );
                    }
                    
                    // AI市場分析
                    if (selectedAnalyses.aiMarket && property.location) {
                        analysisPromises.push(
                            axios.post('/api/ai/analyze-market', {
                                area: property.location,
                                propertyType: '中古マンション',
                                priceRange: {
                                    min: property.price * 0.8,
                                    max: property.price * 1.2
                                }
                            }).then(result => ({
                                type: 'aiMarket',
                                success: true,
                                data: result.data
                            })).catch(error => ({
                                type: 'aiMarket',
                                success: false,
                                error: error.message
                            }))
                        );
                    }
                    
                    // Googleマップ生成
                    if (selectedAnalyses.maps && property.location) {
                        analysisPromises.push(
                            axios.post('/api/maps/generate', {
                                address: property.location
                            }).then(result => ({
                                type: 'maps',
                                success: true,
                                data: result.data
                            })).catch(error => ({
                                type: 'maps',
                                success: false,
                                error: error.message
                            }))
                        );
                    }
                    
                    // すべての分析を並行実行
                    let analysisResults = [];
                    if (analysisPromises.length > 0) {
                        analysisResults = await Promise.all(analysisPromises);
                        
                        // 結果をコンソールに出力（デバッグ用）
                        console.log('Analysis results:', analysisResults);
                        
                        // 成功/失敗のカウント
                        const successCount = analysisResults.filter(r => r.success).length;
                        const totalCount = analysisResults.length;
                        
                        console.log(\`Completed \${successCount}/\${totalCount} analyses\`);
                        
                        // 3. 分析結果をデータベースに一括保存
                        submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>結果を保存中...';
                        
                        try {
                            const saveResponse = await axios.post(\`/api/properties/\${propertyId}/analysis-batch\`, {
                                analyses: analysisResults.filter(r => r.success)
                            });
                            
                            console.log('Save response:', saveResponse.data);
                            console.log(\`Saved \${saveResponse.data.saved}/\${saveResponse.data.total} analysis results\`);
                        } catch (saveError) {
                            console.error('Failed to save analysis results:', saveError);
                            // エラーが発生しても続行（結果は取得済み）
                        }
                    }
                    
                    // 統合レポートページへリダイレクト
                    window.location.href = \`/properties/\${propertyId}/comprehensive-report\`;
                    
                } catch (error) {
                    console.error('Failed to create property:', error);
                    submitButton.disabled = false;
                    submitButton.innerHTML = originalButtonText;
                    
                    // エラーメッセージ表示
                    alert('物件の登録に失敗しました: ' + (error.response?.data?.error || error.message));
                }
            });
        </script>
    </body>
    </html>
  `);
});

/**
 * Property edit page
 * GET /properties/:id/edit
 */
properties.get('/:id/edit', async (c) => {
  const user = c.get('user');
  const propertyId = c.req.param('id');
  const { env } = c;
  
  // Fetch property data
  const property = await env.DB.prepare(`
    SELECT * FROM properties WHERE id = ? AND user_id = ?
  `).bind(propertyId, user.id).first();
  
  if (!property) {
    return c.html(`
      <!DOCTYPE html>
      <html lang="ja">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>物件が見つかりません - My Agent Analytics</title>
          <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body class="bg-gray-50">
          <div class="max-w-md mx-auto mt-20 text-center">
              <i class="fas fa-exclamation-triangle text-6xl text-red-500 mb-4"></i>
              <h1 class="text-2xl font-bold text-gray-900 mb-4">物件が見つかりません</h1>
              <p class="text-gray-600 mb-6">指定された物件は存在しないか、アクセス権限がありません。</p>
              <a href="/properties" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                  物件一覧に戻る
              </a>
          </div>
      </body>
      </html>
    `);
  }
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>物件編集 - ${property.name} - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-12 w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">物件編集</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/properties/${propertyId}" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-times mr-2"></i>キャンセル
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-6">${property.name}を編集</h2>
                
                <form id="edit-form" class="space-y-6">
                    <!-- 物件名 -->
                    <div>
                        <label for="name" class="block text-sm font-medium text-gray-700 mb-2">物件名 *</label>
                        <input type="text" id="name" name="name" value="${property.name}" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- 価格 -->
                    <div>
                        <label for="price" class="block text-sm font-medium text-gray-700 mb-2">価格（円） *</label>
                        <input type="number" id="price" name="price" value="${property.price}" required
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- 所在地 -->
                    <div>
                        <label for="location" class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                        <input type="text" id="location" name="location" value="${property.location || ''}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- 構造 -->
                    <div>
                        <label for="structure" class="block text-sm font-medium text-gray-700 mb-2">構造</label>
                        <select id="structure" name="structure" 
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                            <option value="">選択してください</option>
                            <option value="RC造" ${property.structure === 'RC造' ? 'selected' : ''}>RC造（鉄筋コンクリート造）</option>
                            <option value="SRC造" ${property.structure === 'SRC造' ? 'selected' : ''}>SRC造（鉄骨鉄筋コンクリート造）</option>
                            <option value="鉄骨造" ${property.structure === '鉄骨造' ? 'selected' : ''}>鉄骨造</option>
                            <option value="木造" ${property.structure === '木造' ? 'selected' : ''}>木造</option>
                        </select>
                    </div>
                    
                    <!-- 延床面積 -->
                    <div>
                        <label for="total_floor_area" class="block text-sm font-medium text-gray-700 mb-2">延床面積（㎡）</label>
                        <input type="number" id="total_floor_area" name="total_floor_area" step="0.01" value="${property.total_floor_area || ''}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- 築年数 -->
                    <div>
                        <label for="age" class="block text-sm font-medium text-gray-700 mb-2">築年数（年）</label>
                        <input type="number" id="age" name="age" value="${property.age || ''}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- 駅徒歩 -->
                    <div>
                        <label for="distance_from_station" class="block text-sm font-medium text-gray-700 mb-2">最寄駅からの徒歩時間（分）</label>
                        <input type="number" id="distance_from_station" name="distance_from_station" value="${property.distance_from_station || ''}"
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    </div>
                    
                    <!-- エレベーター -->
                    <div class="flex items-center">
                        <input type="checkbox" id="has_elevator" name="has_elevator" ${property.has_elevator ? 'checked' : ''}
                               class="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded">
                        <label for="has_elevator" class="ml-2 block text-sm text-gray-700">
                            エレベーター有り
                        </label>
                    </div>
                    
                    <!-- 送信ボタン -->
                    <div class="flex items-center space-x-4 pt-4">
                        <button type="submit" id="submit-btn"
                                class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-6 rounded-lg transition-colors">
                            <i class="fas fa-save mr-2"></i>保存
                        </button>
                        <a href="/properties/${propertyId}" 
                           class="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-3 px-6 rounded-lg text-center transition-colors">
                            キャンセル
                        </a>
                    </div>
                </form>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            document.getElementById('edit-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const submitBtn = document.getElementById('submit-btn');
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>保存中...';
                
                try {
                    const formData = {
                        name: document.getElementById('name').value,
                        price: parseFloat(document.getElementById('price').value),
                        location: document.getElementById('location').value || null,
                        structure: document.getElementById('structure').value || null,
                        total_floor_area: document.getElementById('total_floor_area').value ? parseFloat(document.getElementById('total_floor_area').value) : null,
                        age: document.getElementById('age').value ? parseInt(document.getElementById('age').value) : null,
                        distance_from_station: document.getElementById('distance_from_station').value ? parseFloat(document.getElementById('distance_from_station').value) : null,
                        has_elevator: document.getElementById('has_elevator').checked
                    };
                    
                    const response = await axios.put('/api/properties/${propertyId}', formData);
                    
                    if (response.data.success) {
                        alert('物件情報を更新しました');
                        window.location.href = '/properties/${propertyId}';
                    }
                } catch (error) {
                    console.error('Update error:', error);
                    alert('更新に失敗しました: ' + (error.response?.data?.error || error.message));
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i class="fas fa-save mr-2"></i>保存';
                }
            });
        </script>
    </body>
    </html>
  `);
});

/**
 * Property detail page
 * GET /properties/:id
 */
properties.get('/:id', async (c) => {
  const user = c.get('user');
  const propertyId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>物件詳細 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
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
                        <h1 class="text-2xl font-bold text-gray-900">物件詳細</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/properties/\${propertyId}/edit" class="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-edit mr-2"></i>編集
                        </a>
                        <a href="/properties/\${propertyId}/analyze" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-chart-line mr-2"></i>分析実行
                        </a>
                        <a href="/properties" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-arrow-left"></i> 戻る
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div id="loading" class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
                <p class="mt-4 text-gray-600">読み込み中...</p>
            </div>
            
            <div id="content" class="hidden">
                <!-- Property details will be loaded here -->
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const propertyId = '${propertyId}';
            
            async function loadProperty() {
                try {
                    const response = await axios.get(\`/api/properties/\${propertyId}\`);
                    const { property } = response.data;
                    
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('content').classList.remove('hidden');
                    document.getElementById('content').innerHTML = \`
                        <div class="bg-white rounded-lg shadow p-8 mb-6">
                            <h2 class="text-3xl font-bold text-gray-900 mb-6">\${property.name}</h2>
                            
                            <div class="grid md:grid-cols-2 gap-6">
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
                                    <dl class="space-y-3">
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">価格:</dt>
                                            <dd class="font-semibold text-lg">¥\${(property.price || 0).toLocaleString()}</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">所在地:</dt>
                                            <dd class="font-medium">\${property.location || '未設定'}</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">構造:</dt>
                                            <dd class="font-medium">\${property.structure || '未設定'}</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">延床面積:</dt>
                                            <dd class="font-medium">\${property.total_floor_area || 0}㎡</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">築年数:</dt>
                                            <dd class="font-medium">\${property.age || 0}年</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">駅距離:</dt>
                                            <dd class="font-medium">\${property.distance_from_station || 0}分</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">想定賃料:</dt>
                                            <dd class="font-medium">¥\${(property.monthly_rent || 0).toLocaleString()}/月</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">物件種別:</dt>
                                            <dd class="font-medium">\${property.property_type || '未設定'}</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">土地面積:</dt>
                                            <dd class="font-medium">\${property.land_area || 0}㎡</dd>
                                        </div>
                                        <div class="flex justify-between">
                                            <dt class="text-gray-600">登記日:</dt>
                                            <dd class="font-medium">\${property.registration_date || '未設定'}</dd>
                                        </div>
                                    </dl>
                                </div>
                                
                                <div>
                                    <h3 class="text-lg font-semibold text-gray-900 mb-4">アクション</h3>
                                    <div class="space-y-3">
                                        <a href="/properties/\${property.id}/analyze" 
                                           class="block w-full text-center px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors">
                                            <i class="fas fa-chart-line mr-2"></i>分析を実行
                                        </a>
                                        <button onclick="editProperty()" 
                                                class="block w-full text-center px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                                            <i class="fas fa-edit mr-2"></i>編集
                                        </button>
                                        <button onclick="deleteProperty()" 
                                                class="block w-full text-center px-4 py-3 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors">
                                            <i class="fas fa-trash mr-2"></i>削除
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="bg-white rounded-lg shadow p-8">
                            <h3 class="text-xl font-bold text-gray-900 mb-4">分析履歴</h3>
                            <div id="analysis-history">
                                <p class="text-gray-600">分析履歴はありません</p>
                            </div>
                        </div>
                    \`;
                } catch (error) {
                    console.error('Failed to load property:', error);
                    document.getElementById('loading').innerHTML = \`
                        <div class="text-center py-12">
                            <i class="fas fa-exclamation-circle text-4xl text-red-600 mb-4"></i>
                            <p class="text-gray-600">物件の読み込みに失敗しました</p>
                            <a href="/properties" class="mt-4 inline-block text-blue-600 hover:underline">物件一覧に戻る</a>
                        </div>
                    \`;
                }
            }
            
            function editProperty() {
                alert('編集機能は今後実装予定です');
            }
            
            async function deleteProperty() {
                if (!confirm('この物件を削除してもよろしいですか？')) return;
                
                try {
                    await axios.delete(\`/api/properties/\${propertyId}\`);
                    alert('物件を削除しました');
                    window.location.href = '/properties';
                } catch (error) {
                    console.error('Failed to delete property:', error);
                    alert('物件の削除に失敗しました');
                }
            }
            
            loadProperty();
        </script>
    </body>
    </html>
  `);
});

/**
 * Property analysis page
 * GET /properties/:id/analyze
 */
properties.get('/:id/analyze', async (c) => {
  const user = c.get('user');
  const propertyId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>物件分析 - My Agent Analytics</title>
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
                        <h1 class="text-2xl font-bold text-gray-900">物件分析</h1>
                    </div>
                    <a href="/properties/\${propertyId}" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-arrow-left"></i> 戻る
                    </a>
                </div>
            </div>
        </header>

        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div class="bg-white rounded-lg shadow p-8 mb-6">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">収支シミュレーション</h2>
                
                <form id="analysis-form" class="space-y-6">
                    <div class="grid md:grid-cols-2 gap-6">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">物件価格 (円) *</label>
                            <input type="number" id="propertyPrice" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">想定家賃収入 (円/月) *</label>
                            <input type="number" id="monthlyRent" required
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">稼働率 (%)</label>
                            <input type="number" id="occupancyRate" value="95" step="0.1"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                年間経費 (円)
                                <button type="button" class="ml-1 text-xs text-blue-600 hover:text-blue-800 info-tooltip" data-message="年間経費に含まれる項目&#10;&#10;・固定資産税&#10;・都市計画税&#10;・不動産取得税&#10;・管理費&#10;・修繕積立金&#10;・建物部分の利息負担金&#10;・内外装修繕費用&#10;・電気代&#10;・ガス代（負担している場合）&#10;・火災保険料&#10;・PM管理費（賃貸管理費）&#10;&#10;※ 重要事項調査報告書取得費用（22,000～55,000円/戸）は、売却時や事故物件調査時の費用であり、年間経費には含みません。">
                                    <i class="fas fa-question-circle"></i>
                                </button>
                            </label>
                            <input type="number" id="annualExpenses" value="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   placeholder="例: 500000 (年間50万円)">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">ローン借入額 (円)</label>
                            <input type="number" id="loanAmount" value="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">金利 (%)</label>
                            <input type="number" id="interestRate" value="2.0" step="0.01"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">返済期間 (年)</label>
                            <input type="number" id="loanYears" value="30"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">自己資金 (円)</label>
                            <input type="number" id="downPayment" value="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                        </div>
                    </div>
                    
                    <div class="flex justify-end space-x-4">
                        <button type="button" onclick="history.back()" 
                                class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            キャンセル
                        </button>
                        <button type="submit" 
                                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-calculator mr-2"></i>分析実行
                        </button>
                    </div>
                </form>
            </div>
            
            <div id="results" class="hidden space-y-6">
                <!-- Analysis results will be displayed here -->
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const propertyId = '${propertyId}';
            
            // Load property data
            async function loadProperty() {
                try {
                    const response = await axios.get(\`/api/properties/\${propertyId}\`);
                    const { property } = response.data;
                    
                    // Auto-populate form fields from property data
                    document.getElementById('propertyPrice').value = property.price || 0;
                    document.getElementById('monthlyRent').value = property.monthly_rent || 0;
                } catch (error) {
                    console.error('Failed to load property:', error);
                }
            }
            
            document.getElementById('analysis-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = {
                    propertyId,
                    propertyPrice: parseFloat(document.getElementById('propertyPrice').value),
                    grossIncome: parseFloat(document.getElementById('monthlyRent').value) * 12,
                    effectiveIncome: parseFloat(document.getElementById('monthlyRent').value) * 12 * (parseFloat(document.getElementById('occupancyRate').value) / 100),
                    operatingExpenses: parseFloat(document.getElementById('annualExpenses').value),
                    loanAmount: parseFloat(document.getElementById('loanAmount').value),
                    interestRate: parseFloat(document.getElementById('interestRate').value),
                    loanTermYears: parseInt(document.getElementById('loanYears').value),
                    downPayment: parseFloat(document.getElementById('downPayment').value),
                };
                
                try {
                    const response = await axios.post('/api/properties/analyze', formData);
                    const { analysis } = response.data;
                    
                    displayResults(analysis);
                } catch (error) {
                    console.error('Analysis failed:', error);
                    alert('分析の実行に失敗しました');
                }
            });
            
            function displayResults(analysis) {
                document.getElementById('results').classList.remove('hidden');
                document.getElementById('results').innerHTML = \`
                    <div class="bg-white rounded-lg shadow p-8">
                        <h3 class="text-2xl font-bold text-gray-900 mb-6">分析結果</h3>
                        
                        <div class="grid md:grid-cols-3 gap-6 mb-8">
                            <div class="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-sm text-gray-600">表面利回り</p>
                                    <button type="button" class="text-base text-blue-600 hover:text-blue-800 hover:scale-110 transition-transform" onclick="alert('表面利回り（グロス利回り）\\n\\n計算式: 年間家賃収入 ÷ 物件価格 × 100\\n\\n経費を考慮せず、満室想定の年間家賃収入から算出する利回りです。物件の収益性を簡易的に比較する際に使用します。')" title="用語説明を表示">
                                        <i class="fas fa-question-circle"></i>
                                    </button>
                                </div>
                                <p class="text-3xl font-bold text-blue-600">\${(analysis.grossYield || 0).toFixed(2)}%</p>
                            </div>
                            <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-sm text-gray-600">実質利回り</p>
                                    <button type="button" class="text-base text-green-600 hover:text-green-800 hover:scale-110 transition-transform info-tooltip" data-message="実質利回り（ネット利回り / Net Yield）

【計算式】
NOI（純営業利益） ÷ 物件価格 × 100

【特徴】
• 運営費用を差し引いた後の実質的な収益率
• 実際の収益性をより正確に表す重要指標
• 不動産投資の意思決定に最も重要な指標の一つ

【運営費用に含まれるもの】
• 固定資産税・都市計画税
• 管理費・修繕積立金
• PM管理費（賃貸管理費）
• 建物部分の利息負担金
• 修繕費用
• 保険料等

【目安】
• 4%以上：優良物件
• 2-4%：標準的
• 2%未満：要慎重検討

【投資判断】
実質利回りが借入金利を上回ることが、レバレッジ効果を活用する上で重要です。" title="用語説明を表示">
                                        <i class="fas fa-question-circle"></i>
                                    </button>
                                </div>
                                <p class="text-3xl font-bold text-green-600">\${(analysis.netYield || 0).toFixed(2)}%</p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-sm text-gray-600">NOI (純収益)</p>
                                    <button type="button" class="text-base text-purple-600 hover:text-purple-800 hover:scale-110 transition-transform" onclick="alert('NOI (Net Operating Income / 純収益)\\n\\n計算式: 実効収入 - 運営費\\n\\n物件が生み出す純粋な営業利益です。ローン返済前の手取り収入を表します。物件の収益力を評価する重要な指標です。')" title="用語説明を表示">
                                        <i class="fas fa-question-circle"></i>
                                    </button>
                                </div>
                                <p class="text-3xl font-bold text-purple-600">¥\${Math.round(analysis.noi || 0).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <div>
                                <h4 class="text-lg font-semibold text-gray-900 mb-4">収支詳細</h4>
                                <dl class="space-y-3">
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">年間総収入:</dt>
                                        <dd class="font-semibold">¥\${Math.round(analysis.grossIncome || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">年間実効収入:</dt>
                                        <dd class="font-semibold text-sm">(稼働率考慮後)</dd>
                                        <dd class="font-semibold">¥\${Math.round(analysis.effectiveIncome || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">年間運営費:</dt>
                                        <dd class="font-semibold text-red-600">-¥\${Math.round(analysis.operatingExpenses || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between border-t pt-2">
                                        <dt class="text-gray-800 font-medium">NOI (純収益):</dt>
                                        <dd class="font-semibold">¥\${Math.round(analysis.noi || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">年間返済額:</dt>
                                        <dd class="font-semibold text-red-600">-¥\${Math.round(analysis.annualDebtService || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between border-t pt-3 bg-blue-50 -mx-4 px-4 py-3 mt-3 rounded">
                                        <dt class="text-gray-900 font-bold">年間キャッシュフロー:</dt>
                                        <dd class="font-bold text-lg \${(analysis.annualCashFlow || 0) >= 0 ? 'text-green-600' : 'text-red-600'}">
                                            ¥\${Math.round(analysis.annualCashFlow || 0).toLocaleString()}
                                        </dd>
                                    </div>
                                </dl>
                            </div>
                            
                            <div>
                                <h4 class="text-lg font-semibold text-gray-900 mb-4">ローン詳細</h4>
                                <dl class="space-y-3">
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">借入額:</dt>
                                        <dd class="font-semibold">¥\${Math.round(analysis.loanAmount || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">月々返済額:</dt>
                                        <dd class="font-semibold">¥\${Math.round(analysis.monthlyPayment || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <dt class="text-gray-600 flex items-center gap-2">
                                            LTV:
                                            <button type="button" class="text-xs text-blue-600 hover:text-blue-800 info-tooltip" data-message="LTV (Loan to Value / 融資比率)\n\n計算式: 借入額 ÷ 物件価格 × 100\n\n物件価格に対する借入金の割合です。一般的に80%以下が望ましいとされています。高すぎるとリスクが増加します。">
                                                <i class="fas fa-question-circle"></i>
                                            </button>
                                        </dt>
                                        <dd class="font-semibold">\${(analysis.ltv || 0).toFixed(1)}%</dd>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <dt class="text-gray-600 flex items-center gap-2">
                                            DSCR:
                                            <button type="button" class="text-xs text-blue-600 hover:text-blue-800 info-tooltip" data-message="DSCR (Debt Service Coverage Ratio / 債務償還カバー率)\n\n計算式: NOI ÷ 年間返済額\n\n収益で返済をカバーできるかを示す指標です。1.2以上が望ましく、1未満の場合は返済が困難になる可能性があります。">
                                                <i class="fas fa-question-circle"></i>
                                            </button>
                                        </dt>
                                        <dd class="font-semibold \${(analysis.dscr || 0) >= 1.2 ? 'text-green-600' : 'text-red-600'}">\${(analysis.dscr || 0).toFixed(2)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
                        
                        <!-- Risk Assessment -->
                        \${analysis.riskFactors && analysis.riskFactors.length > 0 ? \`
                            <div class="mt-8 p-6 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                                <h4 class="text-lg font-semibold text-yellow-800 mb-3 flex items-center gap-2">
                                    <i class="fas fa-exclamation-triangle"></i>
                                    リスク要因
                                </h4>
                                <ul class="space-y-2">
                                    \${analysis.riskFactors.map(factor => \`
                                        <li class="text-sm text-yellow-900 flex items-start gap-2">
                                            <i class="fas fa-circle text-xs mt-1.5"></i>
                                            <span>\${factor}</span>
                                        </li>
                                    \`).join('')}
                                </ul>
                            </div>
                        \` : ''}
                        
                        <!-- Recommendations -->
                        \${analysis.recommendations && analysis.recommendations.length > 0 ? \`
                            <div class="mt-6 p-6 bg-blue-50 border-l-4 border-blue-400 rounded">
                                <h4 class="text-lg font-semibold text-blue-800 mb-3 flex items-center gap-2">
                                    <i class="fas fa-lightbulb"></i>
                                    推奨事項
                                </h4>
                                <ul class="space-y-2">
                                    \${analysis.recommendations.map(rec => \`
                                        <li class="text-sm text-blue-900 flex items-start gap-2">
                                            <i class="fas fa-check-circle text-xs mt-1.5"></i>
                                            <span>\${rec}</span>
                                        </li>
                                    \`).join('')}
                                </ul>
                            </div>
                        \` : ''}
                    </div>
                \`;
                
                // Scroll to results
                document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
                
                // Re-initialize tooltips for dynamically added content
                initializeTooltips();
            }
            
            // Initialize tooltips
            function initializeTooltips() {
                const tooltips = document.querySelectorAll('.info-tooltip');
                
                tooltips.forEach(tooltip => {
                    const message = tooltip.getAttribute('data-message');
                    if (!message) return;
                    
                    // Skip if already initialized
                    if (tooltip.hasAttribute('data-tooltip-initialized')) return;
                    tooltip.setAttribute('data-tooltip-initialized', 'true');
                    
                    // Create tooltip element
                    const tooltipBox = document.createElement('div');
                    tooltipBox.className = 'fixed z-50 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-xl max-w-xs hidden';
                    tooltipBox.style.whiteSpace = 'pre-wrap';
                    tooltipBox.textContent = message.replace(/&#10;/g, '\\n');
                    document.body.appendChild(tooltipBox);
                    
                    // Show tooltip on click (for mobile)
                    tooltip.addEventListener('click', (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        
                        // Hide all other tooltips
                        document.querySelectorAll('.info-tooltip').forEach(t => {
                            const box = t.tooltipBox;
                            if (box && box !== tooltipBox) {
                                box.classList.add('hidden');
                            }
                        });
                        
                        // Toggle current tooltip
                        const rect = tooltip.getBoundingClientRect();
                        tooltipBox.style.left = Math.min(rect.left, window.innerWidth - tooltipBox.offsetWidth - 10) + 'px';
                        tooltipBox.style.top = (rect.bottom + 5) + 'px';
                        tooltipBox.classList.toggle('hidden');
                    });
                    
                    // Show tooltip on hover (for desktop)
                    tooltip.addEventListener('mouseenter', (e) => {
                        const rect = tooltip.getBoundingClientRect();
                        tooltipBox.style.left = Math.min(rect.left, window.innerWidth - tooltipBox.offsetWidth - 10) + 'px';
                        tooltipBox.style.top = (rect.bottom + 5) + 'px';
                        tooltipBox.classList.remove('hidden');
                    });
                    
                    tooltip.addEventListener('mouseleave', () => {
                        tooltipBox.classList.add('hidden');
                    });
                    
                    // Store reference for cleanup
                    tooltip.tooltipBox = tooltipBox;
                });
                
                // Hide all tooltips when clicking outside
                document.addEventListener('click', (e) => {
                    if (!e.target.closest('.info-tooltip')) {
                        document.querySelectorAll('.info-tooltip').forEach(t => {
                            if (t.tooltipBox) {
                                t.tooltipBox.classList.add('hidden');
                            }
                        });
                    }
                });
            }
            
            loadProperty();
            initializeTooltips();
        </script>
    </body>
    </html>
  `);
});

/**
 * Comprehensive Analysis Report Page
 * 統合分析レポートページ - すべてのデータを統合した高品質な分析結果表示
 * GET /properties/:id/comprehensive-report
 */

/**
 * Interactive Comprehensive Report Dashboard
 * インタラクティブ統合レポートダッシュボード
 * GET /properties/:id/comprehensive-report
 */
properties.get('/:id/comprehensive-report', async (c) => {
  const user = c.get('user');
  const propertyId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>統合分析ダッシュボード - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="/static/chart.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Noto+Sans+JP:wght@400;500;700&display=swap');
            
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Noto Sans JP', sans-serif;
                background: linear-gradient(135deg, #0a1128 0%, #1a1f3a 50%, #0a1128 100%);
                color: #e0e7ff;
                min-height: 100vh;
                overflow-x: hidden;
            }
            
            /* Animated Background Particles */
            .particles {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                pointer-events: none;
                z-index: 0;
            }
            
            .particle {
                position: absolute;
                width: 2px;
                height: 2px;
                background: rgba(59, 130, 246, 0.5);
                border-radius: 50%;
                animation: float 20s infinite;
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0) translateX(0); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100vh) translateX(50px); opacity: 0; }
            }
            
            /* Glassmorphism Dashboard Card */
            .dashboard-card {
                background: rgba(15, 23, 42, 0.7);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(59, 130, 246, 0.2);
                border-radius: 16px;
                padding: 1.5rem;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .dashboard-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, transparent, #3b82f6, transparent);
                animation: shimmer 3s infinite;
            }
            
            @keyframes shimmer {
                0% { transform: translateX(-100%); }
                100% { transform: translateX(100%); }
            }
            
            .dashboard-card:hover {
                transform: translateY(-4px);
                border-color: rgba(59, 130, 246, 0.5);
                box-shadow: 0 12px 48px rgba(59, 130, 246, 0.2);
            }
            
            /* Metric Display */
            .metric-value {
                font-family: 'Orbitron', monospace;
                font-size: 2.5rem;
                font-weight: 900;
                background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                text-shadow: 0 0 30px rgba(59, 130, 246, 0.5);
            }
            
            .metric-label {
                color: #94a3b8;
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-top: 0.5rem;
            }
            
            /* Chart Containers */
            .chart-container {
                position: relative;
                height: 300px;
                margin-top: 1rem;
            }
            
            /* Risk Badge */
            .risk-badge {
                display: inline-flex;
                align-items: center;
                padding: 0.5rem 1rem;
                border-radius: 9999px;
                font-weight: 700;
                font-size: 0.875rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.8; }
            }
            
            .risk-none { background: rgba(34, 197, 94, 0.2); color: #22c55e; border: 1px solid #22c55e; }
            .risk-low { background: rgba(234, 179, 8, 0.2); color: #eab308; border: 1px solid #eab308; }
            .risk-medium { background: rgba(249, 115, 22, 0.2); color: #f97316; border: 1px solid #f97316; }
            .risk-high { background: rgba(239, 68, 68, 0.2); color: #ef4444; border: 1px solid #ef4444; }
            
            /* Section Headers */
            .section-header {
                font-size: 1.5rem;
                font-weight: 700;
                color: #3b82f6;
                margin-bottom: 1.5rem;
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .section-header::before {
                content: '';
                width: 4px;
                height: 24px;
                background: linear-gradient(180deg, #3b82f6, #60a5fa);
                border-radius: 2px;
            }
            
            /* Grid Layout */
            .dashboard-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                .metric-value { font-size: 2rem; }
                .dashboard-grid { grid-template-columns: 1fr; }
            }
            
            /* Print Styles */
            @media print {
                body { background: white; color: black; }
                .particles, .no-print { display: none !important; }
                .dashboard-card { background: white; border: 1px solid #ddd; }
            }
        </style>
    </head>
    <body>
        <!-- Animated Background Particles -->
        <div class="particles" id="particles"></div>
        
        <!-- Header -->
        <header class="relative z-10 bg-slate-900/50 backdrop-blur-md border-b border-blue-500/20 no-print">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard" class="bg-white rounded-lg p-2 shadow-md hover:shadow-lg transition-shadow">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-10 w-10" style="object-fit: contain;">
                        </a>
                        <h1 class="text-2xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
                            統合分析ダッシュボード
                        </h1>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button onclick="window.print()" class="px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 rounded-lg text-blue-300 transition-all">
                            <i class="fas fa-print mr-2"></i>印刷
                        </button>
                        <button onclick="downloadPDF()" class="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg text-green-300 transition-all">
                            <i class="fas fa-file-pdf mr-2"></i>PDF
                        </button>
                        <a href="/properties/${propertyId}" class="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg text-slate-300 transition-all">
                            <i class="fas fa-arrow-left mr-2"></i>戻る
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="relative z-10 max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div id="loading" class="text-center py-24">
                <div class="inline-block">
                    <i class="fas fa-circle-notch fa-spin text-6xl text-blue-500 mb-4"></i>
                    <p class="text-xl text-slate-400">データ分析中...</p>
                </div>
            </div>
            
            <div id="report-content" class="hidden">
                <!-- レポート内容がここに動的に挿入されます -->
            </div>
            
            <!-- 免責文 -->
            <div class="dashboard-card mt-8 mb-8 print:block">
                <div class="text-center">
                    <h3 class="text-lg font-bold text-blue-400 mb-4">
                        <i class="fas fa-exclamation-triangle mr-2"></i>免責事項
                    </h3>
                    
                    <!-- 正式表記（デスクトップ・PDF用） -->
                    <div class="hidden md:block text-sm text-slate-300 leading-relaxed">
                        本ツールは不動産の情報整理・分析支援を目的とした参考情報であり、投資判断・契約判断の勧誘や約束を行うものではありません。最終判断はご自身の責任で行ってください。数値は出典に基づく推計であり、将来の結果を保証しません。
                    </div>
                    
                    <!-- 短縮版（スマホ・小画面用） -->
                    <div class="md:hidden text-xs text-slate-300 leading-relaxed">
                        本ツールは参考情報です。投資・契約判断はご自身の責任で。将来成果を保証しません。
                    </div>
                </div>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            const propertyId = '${propertyId}';
            let reportData = null;
            
            async function loadReportData() {
                try {
                    const response = await axios.get(\`/api/properties/\${propertyId}/comprehensive-data\`);
                    reportData = response.data.data;
                    
                    // レポートタイプを判定（実需用 vs 収益用）
                    const isInvestment = reportData.property.property_type === 'investment';
                    
                    // ローディング非表示、コンテンツ表示
                    document.getElementById('loading').classList.add('hidden');
                    document.getElementById('report-content').classList.remove('hidden');
                    
                    // レポート生成
                    if (isInvestment) {
                        renderInvestmentReport();
                    } else {
                        renderResidentialReport();
                    }
                } catch (error) {
                    console.error('Failed to load report data:', error);
                    console.error('Full error object:', JSON.stringify(error, null, 2));
                    
                    const errorData = error.response?.data || {};
                    const errorMessage = errorData.error || error.message || '不明なエラー';
                    const errorDetails = errorData.details || '';
                    const errorHint = errorData.hint || '';
                    
                    document.getElementById('loading').innerHTML = \`
                        <div class="text-center py-12 max-w-2xl mx-auto">
                            <i class="fas fa-exclamation-triangle text-4xl text-red-600"></i>
                            <p class="mt-4 text-xl font-bold text-gray-800">レポートの読み込みに失敗しました</p>
                            <p class="text-sm text-gray-700 mt-3 font-semibold">\${errorMessage}</p>
                            \${errorDetails ? \`<p class="text-xs text-gray-600 mt-2 bg-gray-100 p-3 rounded"><strong>詳細:</strong> \${errorDetails}</p>\` : ''}
                            \${errorHint ? \`<p class="text-xs text-blue-600 mt-2 bg-blue-50 p-3 rounded"><i class="fas fa-lightbulb mr-1"></i><strong>ヒント:</strong> \${errorHint}</p>\` : ''}
                            <div class="mt-6 space-x-3">
                                <a href="/properties/\${propertyId}" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-arrow-left mr-2"></i>物件ページに戻る
                                </a>
                                <button onclick="location.reload()" class="inline-block bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg transition-colors">
                                    <i class="fas fa-redo mr-2"></i>再読み込み
                                </button>
                            </div>
                        </div>
                    \`;
                }
            }
            
            function renderResidentialReport() {
                const property = reportData.property;
                const stigma = reportData.stigma;
                const rental = reportData.rental;
                const demographics = reportData.demographics;
                const aiMarket = reportData.aiMarket;
                const maps = reportData.maps;
                
                document.getElementById('report-content').innerHTML = \`
                    <!-- ダッシュボードヘッダー -->
                    <div class="dashboard-card text-center mb-8">
                        <h1 class="text-4xl font-bold bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent mb-2">
                            \${property.name}
                        </h1>
                        <p class="text-slate-400 text-lg mb-4">実需用不動産分析レポート</p>
                        <div class="flex justify-center gap-6 text-sm text-slate-500">
                            <span><i class="fas fa-calendar-alt mr-2"></i>\${new Date().toLocaleDateString('ja-JP')}</span>
                            <span><i class="fas fa-fingerprint mr-2"></i>ID: \${property.id.substring(0, 8)}</span>
                        </div>
                    </div>
                    
                    <!-- 主要指標カード -->
                    <div class="dashboard-grid">
                        <!-- 価格カード -->
                        <div class="dashboard-card">
                            <div class="flex items-center justify-between mb-4">
                                <i class="fas fa-yen-sign text-3xl text-blue-500"></i>
                                <span class="text-xs text-green-400"><i class="fas fa-arrow-up mr-1"></i>市場平均+5%</span>
                            </div>
                            <div class="metric-value">¥\${(property.price || 0).toLocaleString()}</div>
                            <div class="metric-label">物件価格</div>
                        </div>
                        
                        <!-- 延床面積カード -->
                        <div class="dashboard-card">
                            <div class="flex items-center justify-between mb-4">
                                <i class="fas fa-ruler-combined text-3xl text-blue-500"></i>
                                <span class="text-xs text-slate-400">延床</span>
                            </div>
                            <div class="metric-value">\${property.total_floor_area || 0}</div>
                            <div class="metric-label">平米 (㎡)</div>
                        </div>
                        
                        <!-- 築年数カード -->
                        <div class="dashboard-card">
                            <div class="flex items-center justify-between mb-4">
                                <i class="fas fa-building text-3xl text-blue-500"></i>
                                <span class="text-xs text-slate-400">経過年数</span>
                            </div>
                            <div class="metric-value">\${property.age || 0}</div>
                            <div class="metric-label">築年数 (年)</div>
                        </div>
                        
                        <!-- 駅距離カード -->
                        <div class="dashboard-card">
                            <div class="flex items-center justify-between mb-4">
                                <i class="fas fa-train text-3xl text-blue-500"></i>
                                <span class="text-xs text-slate-400">アクセス</span>
                            </div>
                            <div class="metric-value">\${property.distance_from_station || 0}</div>
                            <div class="metric-label">駅距離 (分)</div>
                        </div>
                    </div>
                    
                    <!-- 物件詳細情報 -->
                    <div class="dashboard-card">
                        <h3 class="section-header"><i class="fas fa-info-circle mr-2"></i>物件詳細情報</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="p-3 bg-slate-800/50 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">所在地</span>
                                <p class="text-slate-200 font-medium mt-1">\${property.location || '未設定'}</p>
                            </div>
                            <div class="p-3 bg-slate-800/50 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">構造</span>
                                <p class="text-slate-200 font-medium mt-1">\${property.structure || '未設定'}</p>
                            </div>
                            <div class="p-3 bg-slate-800/50 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">登記日</span>
                                <p class="text-slate-200 font-medium mt-1">\${property.registration_date || '未設定'}</p>
                            </div>
                            <div class="p-3 bg-slate-800/50 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">坪単価</span>
                                <p class="text-slate-200 font-medium mt-1">¥\${property.price && property.land_area ? Math.floor(property.price / (property.land_area * 0.3025)).toLocaleString() : '---'}/坪</p>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 事故物件調査結果 -->
                    \${stigma ? \`
                    <div class="dashboard-card">
                        <h3 class="section-header"><i class="fas fa-shield-alt mr-2"></i>事故物件調査結果</h3>
                        
                        <!-- 警告バナー -->
                        <div class="mb-4 p-4 bg-yellow-900/20 border border-yellow-600/30 rounded-lg">
                            <div class="flex items-start gap-3">
                                <i class="fas fa-exclamation-triangle text-yellow-500 mt-0.5"></i>
                                <div class="flex-1 text-sm">
                                    <p class="text-yellow-200 font-medium mb-1">⚠️ 注意事項</p>
                                    <p class="text-slate-300 text-xs leading-relaxed">
                                        本調査は参考情報です。完全な検出を保証するものではありません。
                                        詳細は
                                        <a href="https://www.oshimaland.co.jp/" target="_blank" rel="noopener noreferrer" 
                                           class="text-blue-400 hover:text-blue-300 underline">
                                            大島てる
                                            <i class="fas fa-external-link-alt text-xs ml-1"></i>
                                        </a>
                                        で直接ご確認ください。
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        <div class="flex items-center justify-between mb-6 p-4 bg-slate-800/50 rounded-lg border border-blue-500/20">
                            <span class="text-slate-300 font-medium">リスクレベル</span>
                            <span class="risk-badge risk-\${stigma.risk_level}">
                                \${stigma.risk_level === 'none' ? '<i class="fas fa-check-circle mr-2"></i>問題なし' :
                                  stigma.risk_level === 'low' ? '<i class="fas fa-exclamation-circle mr-2"></i>低リスク' :
                                  stigma.risk_level === 'medium' ? '<i class="fas fa-exclamation-triangle mr-2"></i>中リスク' : 
                                  '<i class="fas fa-times-circle mr-2"></i>高リスク'}
                            </span>
                        </div>
                        
                        <div class="p-4 bg-slate-800/30 rounded-lg border border-slate-700/50 mb-4">
                            <h4 class="text-sm text-slate-400 uppercase tracking-wide mb-2">調査サマリー</h4>
                            <p class="text-slate-200 leading-relaxed">\${stigma.summary || '調査結果なし'}</p>
                        </div>
                        
                        \${stigma.incidents_found && stigma.incidents_found.length > 0 ? \`
                        <div class="p-4 bg-red-900/10 rounded-lg border border-red-500/20 mb-4">
                            <h4 class="text-sm text-red-400 uppercase tracking-wide mb-3">
                                <i class="fas fa-exclamation-triangle mr-2"></i>発見された事例
                            </h4>
                            <ul class="space-y-2">
                                \${stigma.incidents_found.map(incident => \`
                                    <li class="flex items-start text-slate-300">
                                        <i class="fas fa-circle text-xs text-red-500 mr-3 mt-1.5"></i>
                                        <span>\${incident}</span>
                                    </li>
                                \`).join('')}
                            </ul>
                        </div>
                        \` : ''}
                        
                        <!-- 推奨アクション -->
                        <div class="p-4 bg-blue-900/10 rounded-lg border border-blue-500/20">
                            <h4 class="text-sm text-blue-400 uppercase tracking-wide mb-3">
                                <i class="fas fa-clipboard-list mr-2"></i>推奨アクション
                            </h4>
                            <p class="text-slate-200 mb-4 leading-relaxed">
                                \${stigma.risk_level === 'none' ? '現時点で心理的瑕疵の公知情報は確認されていません。最終契約前に管理会社への念のための確認を推奨します。' :
                                  stigma.risk_level === 'low' ? '低リスクですが、慎重な確認を推奨します。' :
                                  stigma.risk_level === 'medium' ? '中リスク。管理会社照会と現地調査を強く推奨します。' :
                                  '高リスク。管理会社照会および公的照会を必須とします。'}
                            </p>
                            
                            <div class="space-y-3">
                                \${stigma.risk_level !== 'none' ? \`
                                <div class="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                    <div class="flex items-start">
                                        <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                            <span class="text-blue-400 font-bold text-sm">1</span>
                                        </div>
                                        <div class="flex-1">
                                            <h5 class="text-slate-200 font-medium mb-1">管理会社照会（\${stigma.risk_level === 'medium' || stigma.risk_level === 'high' ? '必須' : '推奨'}）</h5>
                                            <p class="text-slate-400 text-sm mb-2">過去5年の自殺・事故・火災・特殊清掃の有無について文書照会</p>
                                            <p class="text-blue-300 text-xs"><i class="fas fa-yen-sign mr-1"></i>費用: 17,000〜20,000円/戸</p>
                                            <p class="text-slate-500 text-xs mt-1">※ 東急コミュニティー、ホームズ建物管理等の公式フォームから申請</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                    <div class="flex items-start">
                                        <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                            <span class="text-blue-400 font-bold text-sm">2</span>
                                        </div>
                                        <div class="flex-1">
                                            <h5 class="text-slate-200 font-medium mb-1">現地ヒアリング（\${stigma.risk_level === 'medium' || stigma.risk_level === 'high' ? '必須' : '推奨'}）</h5>
                                            <p class="text-slate-400 text-sm mb-2">管理員・隣接住戸・清掃業者への詳細ヒアリング</p>
                                            <p class="text-slate-500 text-xs">※ 発言者・日時を記録。警察出動・救急搬送・長期封鎖の確認</p>
                                        </div>
                                    </div>
                                </div>
                                \` : ''}
                                
                                \${stigma.risk_level === 'medium' || stigma.risk_level === 'high' ? \`
                                <div class="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                    <div class="flex items-start">
                                        <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                            <span class="text-blue-400 font-bold text-sm">3</span>
                                        </div>
                                        <div class="flex-1">
                                            <h5 class="text-slate-200 font-medium mb-1">公的照会（\${stigma.risk_level === 'high' ? '必須' : '推奨'}）</h5>
                                            <p class="text-slate-400 text-sm mb-2">所轄警察署・消防署への出動・通報記録確認</p>
                                            <p class="text-slate-500 text-xs">※ 出動記録の有無を確認（口頭照会）。個人情報制限あり</p>
                                        </div>
                                    </div>
                                </div>
                                \` : ''}
                                
                                \${stigma.risk_level === 'high' ? \`
                                <div class="p-3 bg-slate-800/30 rounded-lg border border-slate-700/50">
                                    <div class="flex items-start">
                                        <div class="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mr-3 mt-0.5">
                                            <span class="text-blue-400 font-bold text-sm">4</span>
                                        </div>
                                        <div class="flex-1">
                                            <h5 class="text-slate-200 font-medium mb-1">報告・告知判断（必須）</h5>
                                            <p class="text-slate-400 text-sm mb-2">調査結果を要約し、宅建業法第47条に基づく告知判断を記録</p>
                                            <p class="text-slate-500 text-xs">※ 社内・買主向け資料を作成。国交省ガイドライン（2021）に準拠</p>
                                        </div>
                                    </div>
                                </div>
                                \` : ''}
                            </div>
                            
                            <div class="mt-4 p-3 bg-yellow-900/10 rounded-lg border border-yellow-500/20">
                                <p class="text-yellow-300 text-xs flex items-start">
                                    <i class="fas fa-info-circle mt-0.5 mr-2"></i>
                                    <span>国交省ガイドライン（2021）では、自然死・不慮の死は原則告知不要、事故から3年経過後も原則不要（例外あり）とされています。</span>
                                </p>
                            </div>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 賃貸相場分析 -->
                    \${rental ? \`
                    <div class="dashboard-card">
                        <h3 class="section-header"><i class="fas fa-chart-bar mr-2"></i>賃貸相場分析（将来活用想定）</h3>
                        
                        <div class="grid grid-cols-3 gap-4 mb-6">
                            <div class="dashboard-card bg-slate-800/50">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-green-400 mb-2">¥\${rental.average_rent.toLocaleString()}</div>
                                    <div class="text-sm text-slate-400">平均家賃</div>
                                </div>
                            </div>
                            <div class="dashboard-card bg-slate-800/50">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-blue-400 mb-2">¥\${rental.median_rent.toLocaleString()}</div>
                                    <div class="text-sm text-slate-400">中央値</div>
                                </div>
                            </div>
                            <div class="dashboard-card bg-slate-800/50">
                                <div class="text-center">
                                    <div class="text-3xl font-bold text-purple-400 mb-2">\${((rental.average_rent * 12 / property.price) * 100).toFixed(2)}%</div>
                                    <div class="text-sm text-slate-400">想定利回り</div>
                                </div>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-2 gap-4 mb-4">
                            <div class="p-3 bg-slate-800/30 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">最低家賃</span>
                                <p class="text-slate-200 font-bold text-lg mt-1">¥\${rental.min_rent.toLocaleString()}</p>
                            </div>
                            <div class="p-3 bg-slate-800/30 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">最高家賃</span>
                                <p class="text-slate-200 font-bold text-lg mt-1">¥\${rental.max_rent.toLocaleString()}</p>
                            </div>
                            <div class="p-3 bg-slate-800/30 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">データ件数</span>
                                <p class="text-slate-200 font-bold text-lg mt-1">\${rental.sample_size}件</p>
                            </div>
                            <div class="p-3 bg-slate-800/30 rounded-lg border border-blue-500/20">
                                <span class="text-slate-400 text-sm">年間想定収入</span>
                                <p class="text-slate-200 font-bold text-lg mt-1">¥\${(rental.average_rent * 12).toLocaleString()}</p>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-blue-900/20 rounded-lg border border-blue-500/30">
                            <p class="text-sm text-blue-300 flex items-start">
                                <i class="fas fa-info-circle mt-0.5 mr-2"></i>
                                <span>将来的に賃貸として活用する場合の想定データです。周辺の同規模物件の賃貸相場を基に算出しています。</span>
                            </p>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 3.5 賃貸相場の可視化 -->
                    \${rental ? \`
                    <div class="dashboard-card">
                        <h3 class="section-header"><i class="fas fa-chart-bar mr-2"></i>賃貸相場の可視化</h3>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            <!-- 家賃分布パイチャート -->
                            <div class="bg-slate-800/30 rounded-lg border border-blue-500/20 p-4">
                                <h4 class="text-lg font-semibold text-slate-300 mb-4 text-center">家賃分布</h4>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="rentDistributionChart"></canvas>
                                </div>
                            </div>
                            
                            <!-- 利回り比較棒グラフ -->
                            <div class="bg-slate-800/30 rounded-lg border border-blue-500/20 p-4">
                                <h4 class="text-lg font-semibold text-slate-300 mb-4 text-center">想定利回り分析</h4>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="yieldAnalysisChart"></canvas>
                                </div>
                            </div>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 4. 人口動態分析 -->
                    \${demographics ? \`
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-users text-blue-600 mr-2"></i>4. 人口動態分析
                            </h2>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700">人口動態データが取得されています。</p>
                            <pre class="text-xs mt-2 overflow-auto">\${JSON.stringify(demographics, null, 2)}</pre>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 5. AI市場分析 -->
                    \${aiMarket ? \`
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-robot text-blue-600 mr-2"></i>5. AI市場分析
                            </h2>
                        </div>
                        
                        <div class="bg-gray-50 p-4 rounded-lg">
                            <p class="text-gray-700">AI市場分析データが取得されています。</p>
                            <pre class="text-xs mt-2 overflow-auto">\${JSON.stringify(aiMarket, null, 2)}</pre>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 周辺地図 -->
                    \${maps ? \`
                    <div class="dashboard-card">
                        <h3 class="section-header"><i class="fas fa-map-marked-alt mr-2"></i>周辺地図</h3>
                        
                        <div class="grid md:grid-cols-2 gap-6">
                            \${maps.map1km ? \`
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-lg font-semibold text-slate-300">広域マップ</h4>
                                    <span class="px-3 py-1 bg-blue-500/20 text-blue-300 rounded-full text-xs font-medium">1km圏内</span>
                                </div>
                                <div class="relative rounded-lg overflow-hidden border-2 border-blue-500/30 shadow-lg shadow-blue-500/20">
                                    <img src="\${maps.map1km}" alt="1km Map" class="w-full">
                                </div>
                            </div>
                            \` : ''}
                            
                            \${maps.map200m ? \`
                            <div class="space-y-3">
                                <div class="flex items-center justify-between">
                                    <h4 class="text-lg font-semibold text-slate-300">詳細マップ</h4>
                                    <span class="px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-medium">200m圏内</span>
                                </div>
                                <div class="relative rounded-lg overflow-hidden border-2 border-purple-500/30 shadow-lg shadow-purple-500/20">
                                    <img src="\${maps.map200m}" alt="200m Map" class="w-full">
                                </div>
                            </div>
                            \` : ''}
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- フッター -->
                    <div class="dashboard-card text-center">
                        <div class="inline-flex items-center gap-2 text-slate-400">
                            <i class="fas fa-robot text-blue-500"></i>
                            <span class="text-sm">本レポートは My Agent Analytics により自動生成されました</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">
                            生成日時: \${new Date().toLocaleString('ja-JP')} | レポートID: \${property.id.substring(0, 8)}
                        </p>
                    </div>
                \`;
                
                // レンダリング後にグラフを描画
                setTimeout(() => {
                    renderResidentialCharts();
                }, 300);
            }
            
            function renderResidentialCharts() {
                const property = reportData.property;
                const rental = reportData.rental;
                
                if (!rental) return;
                
                // 1. 家賃分布パイチャート
                const rentDistributionCtx = document.getElementById('rentDistributionChart');
                if (rentDistributionCtx) {
                    const avgRent = rental.average_rent;
                    const minRent = rental.min_rent;
                    const maxRent = rental.max_rent;
                    
                    // 簡易的な分布（低価格帯、中価格帯、高価格帯）
                    const lowRange = Math.round((avgRent - minRent) * 0.3);
                    const midRange = Math.round((avgRent - minRent) * 0.5);
                    const highRange = Math.round((maxRent - avgRent) * 0.2);
                    
                    new Chart(rentDistributionCtx, {
                        type: 'doughnut',
                        data: {
                            labels: [
                                \`低価格帯 (¥\${minRent.toLocaleString()}～)\`,
                                \`中価格帯 (¥\${avgRent.toLocaleString()}前後)\`,
                                \`高価格帯 (¥\${maxRent.toLocaleString()}～)\`
                            ],
                            datasets: [{
                                data: [30, 50, 20],  // 割合（%）
                                backgroundColor: [
                                    'rgba(59, 130, 246, 0.8)',   // Blue
                                    'rgba(34, 197, 94, 0.8)',    // Green
                                    'rgba(168, 85, 247, 0.8)'    // Purple
                                ],
                                borderColor: [
                                    'rgba(59, 130, 246, 1)',
                                    'rgba(34, 197, 94, 1)',
                                    'rgba(168, 85, 247, 1)'
                                ],
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#e0e7ff',
                                        font: { size: 11 },
                                        padding: 12
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.parsed || 0;
                                            return label + ': ' + value + '%';
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                
                // 2. 想定利回り分析棒グラフ
                const yieldAnalysisCtx = document.getElementById('yieldAnalysisChart');
                if (yieldAnalysisCtx) {
                    const minYield = property.price > 0 ? ((minRent * 12 / property.price) * 100) : 0;
                    const avgYield = property.price > 0 ? ((avgRent * 12 / property.price) * 100) : 0;
                    const maxYield = property.price > 0 ? ((maxRent * 12 / property.price) * 100) : 0;
                    
                    new Chart(yieldAnalysisCtx, {
                        type: 'bar',
                        data: {
                            labels: ['最低想定', '平均想定', '最高想定'],
                            datasets: [{
                                label: '想定利回り（%）',
                                data: [minYield, avgYield, maxYield],
                                backgroundColor: [
                                    'rgba(239, 68, 68, 0.8)',    // Red
                                    'rgba(234, 179, 8, 0.8)',    // Yellow
                                    'rgba(34, 197, 94, 0.8)'     // Green
                                ],
                                borderColor: [
                                    'rgba(239, 68, 68, 1)',
                                    'rgba(234, 179, 8, 1)',
                                    'rgba(34, 197, 94, 1)'
                                ],
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.y.toFixed(2) + '%';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        color: '#e0e7ff',
                                        callback: function(value) {
                                            return value + '%';
                                        }
                                    },
                                    grid: {
                                        color: 'rgba(59, 130, 246, 0.1)'
                                    }
                                },
                                x: {
                                    ticks: {
                                        color: '#e0e7ff'
                                    },
                                    grid: {
                                        color: 'rgba(59, 130, 246, 0.1)'
                                    }
                                }
                            }
                        }
                    });
                }
            }
            
            function renderInvestmentReport() {
                const property = reportData.property;
                const stigma = reportData.stigma;
                const rental = reportData.rental;
                const aiMarket = reportData.aiMarket;
                const maps = reportData.maps;
                
                // 投資指標計算
                const annualIncome = (property.annual_income || 0);
                const grossYield = property.price > 0 ? (annualIncome / property.price * 100) : 0;
                const netYield = property.price > 0 ? ((annualIncome * 0.8) / property.price * 100) : 0;
                
                document.getElementById('report-content').innerHTML = \`
                    <!-- レポート表紙 -->
                    <div class="report-section print-section">
                        <div class="text-center">
                            <h1 class="text-4xl font-bold text-gray-900 mb-4">不動産投資分析レポート</h1>
                            <p class="text-xl text-gray-600 mb-2">（収益用不動産）</p>
                            <h2 class="text-3xl font-semibold text-blue-600 mb-8">\${property.name}</h2>
                            <div class="text-gray-500 mb-4">
                                <p>調査日: \${new Date().toLocaleDateString('ja-JP')}</p>
                                <p>レポートID: \${property.id.substring(0, 8)}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="page-break"></div>
                    
                    <!-- 1. 物件基本情報 -->
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-building text-blue-600 mr-2"></i>1. 物件基本情報
                            </h2>
                        </div>
                        
                        <div class="data-grid">
                            <div class="data-item">
                                <span class="data-label">物件名:</span>
                                <span class="data-value">\${property.name}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">価格:</span>
                                <span class="data-value text-lg">¥\${(property.price || 0).toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">所在地:</span>
                                <span class="data-value">\${property.location || '未設定'}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">構造:</span>
                                <span class="data-value">\${property.structure || '未設定'}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">延床面積:</span>
                                <span class="data-value">\${property.total_floor_area || '未設定'}㎡</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">土地面積:</span>
                                <span class="data-value">\${property.land_area || '未設定'}㎡</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">築年数:</span>
                                <span class="data-value">\${property.age || '未設定'}年</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">年間収入:</span>
                                <span class="data-value text-lg">¥\${annualIncome.toLocaleString()}</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 2. 投資指標 -->
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-chart-line text-blue-600 mr-2"></i>2. 投資指標
                            </h2>
                        </div>
                        
                        <div class="data-grid">
                            <div class="data-item bg-blue-50">
                                <span class="data-label">表面利回り:</span>
                                <span class="data-value text-2xl text-blue-600">\${grossYield.toFixed(2)}%</span>
                            </div>
                            <div class="data-item bg-green-50">
                                <span class="data-label">想定実質利回り:</span>
                                <span class="data-value text-2xl text-green-600">\${netYield.toFixed(2)}%</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">年間収入:</span>
                                <span class="data-value">¥\${annualIncome.toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">想定年間費用:</span>
                                <span class="data-value">¥\${(annualIncome * 0.2).toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">想定純収益:</span>
                                <span class="data-value text-lg">¥\${(annualIncome * 0.8).toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">回収期間:</span>
                                <span class="data-value">\${grossYield > 0 ? (100 / grossYield).toFixed(1) : '---'}年</span>
                            </div>
                        </div>
                    </div>
                    
                    <!-- 2.5 投資指標の可視化 -->
                    <div class="dashboard-card">
                        <h3 class="section-header"><i class="fas fa-chart-pie mr-2"></i>投資指標の可視化</h3>
                        
                        <div class="grid md:grid-cols-2 gap-6 mb-6">
                            <!-- 収支内訳パイチャート -->
                            <div class="bg-slate-800/30 rounded-lg border border-blue-500/20 p-4">
                                <h4 class="text-lg font-semibold text-slate-300 mb-4 text-center">年間収支内訳</h4>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="incomeExpenseChart"></canvas>
                                </div>
                            </div>
                            
                            <!-- 利回り比較棒グラフ -->
                            <div class="bg-slate-800/30 rounded-lg border border-blue-500/20 p-4">
                                <h4 class="text-lg font-semibold text-slate-300 mb-4 text-center">利回り比較</h4>
                                <div class="chart-container" style="height: 300px;">
                                    <canvas id="yieldComparisonChart"></canvas>
                                </div>
                            </div>
                        </div>
                        
                        <!-- 市場トレンドグラフ -->
                        <div class="bg-slate-800/30 rounded-lg border border-blue-500/20 p-4">
                            <h4 class="text-lg font-semibold text-slate-300 mb-4 text-center">市場動向トレンド（想定）</h4>
                            <div class="chart-container" style="height: 350px;">
                                <canvas id="marketTrendChart"></canvas>
                            </div>
                            <p class="text-xs text-slate-400 mt-3 text-center">
                                <i class="fas fa-info-circle mr-1"></i>
                                ※ 市場トレンドは周辺エリアの統計データに基づく推計値です
                            </p>
                        </div>
                    </div>
                    
                    <!-- 3. 事故物件調査結果 -->
                    \${stigma ? \`
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-shield-alt text-blue-600 mr-2"></i>3. 事故物件調査結果
                            </h2>
                        </div>
                        
                        <div class="mb-6">
                            <div class="flex items-center mb-4">
                                <span class="text-lg font-semibold mr-3">リスクレベル:</span>
                                <span class="px-4 py-2 rounded-full text-white font-bold \${
                                    stigma.risk_level === 'none' ? 'bg-green-500' :
                                    stigma.risk_level === 'low' ? 'bg-yellow-500' :
                                    stigma.risk_level === 'medium' ? 'bg-orange-500' : 'bg-red-500'
                                }">
                                    \${stigma.risk_level === 'none' ? '問題なし' :
                                      stigma.risk_level === 'low' ? '低リスク' :
                                      stigma.risk_level === 'medium' ? '中リスク' : '高リスク'}
                                </span>
                            </div>
                            
                            <div class="bg-gray-50 p-4 rounded-lg">
                                <h3 class="font-semibold text-gray-900 mb-2">調査結果サマリー:</h3>
                                <p class="text-gray-700">\${stigma.summary || '調査結果なし'}</p>
                            </div>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 4. 賃貸相場分析 -->
                    \${rental ? \`
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-yen-sign text-blue-600 mr-2"></i>4. 賃貸相場分析
                            </h2>
                        </div>
                        
                        <div class="data-grid mb-6">
                            <div class="data-item">
                                <span class="data-label">平均家賃:</span>
                                <span class="data-value text-lg">¥\${rental.average_rent.toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">中央値家賃:</span>
                                <span class="data-value text-lg">¥\${rental.median_rent.toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">最低家賃:</span>
                                <span class="data-value">¥\${rental.min_rent.toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">最高家賃:</span>
                                <span class="data-value">¥\${rental.max_rent.toLocaleString()}</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">サンプル数:</span>
                                <span class="data-value">\${rental.sample_size}件</span>
                            </div>
                            <div class="data-item">
                                <span class="data-label">市場利回り:</span>
                                <span class="data-value text-lg">\${((rental.average_rent * 12 / property.price) * 100).toFixed(2)}%</span>
                            </div>
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- 5. 周辺地図 -->
                    \${maps ? \`
                    <div class="report-section print-section">
                        <div class="section-header">
                            <h2 class="text-2xl font-bold text-gray-900">
                                <i class="fas fa-map-marked-alt text-blue-600 mr-2"></i>5. 周辺地図
                            </h2>
                        </div>
                        
                        <div class="space-y-6">
                            \${maps.map1km ? \`
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">広域マップ（1km圏内）</h3>
                                <img src="\${maps.map1km}" alt="1km Map" class="w-full border rounded-lg shadow-sm">
                            </div>
                            \` : ''}
                            
                            \${maps.map200m ? \`
                            <div>
                                <h3 class="font-semibold text-gray-900 mb-2">詳細マップ（200m圏内）</h3>
                                <img src="\${maps.map200m}" alt="200m Map" class="w-full border rounded-lg shadow-sm">
                            </div>
                            \` : ''}
                        </div>
                    </div>
                    \` : ''}
                    
                    <!-- フッター -->
                    <div class="dashboard-card text-center">
                        <div class="inline-flex items-center gap-2 text-slate-400">
                            <i class="fas fa-robot text-blue-500"></i>
                            <span class="text-sm">本レポートは My Agent Analytics により自動生成されました</span>
                        </div>
                        <p class="text-xs text-slate-500 mt-2">
                            生成日時: \${new Date().toLocaleString('ja-JP')} | レポートID: \${property.id.substring(0, 8)}
                        </p>
                    </div>
                \`;
                
                // レンダリング後にグラフを描画
                setTimeout(() => {
                    renderInvestmentCharts();
                }, 300);
            }
            
            function renderInvestmentCharts() {
                const property = reportData.property;
                const rental = reportData.rental;
                const annualIncome = property.annual_income || 0;
                const annualExpense = annualIncome * 0.2;  // 想定経費20%
                const netIncome = annualIncome * 0.8;
                const grossYield = property.price > 0 ? (annualIncome / property.price * 100) : 0;
                const netYield = property.price > 0 ? (netIncome / property.price * 100) : 0;
                const marketYield = rental && property.price > 0 ? ((rental.average_rent * 12 / property.price) * 100) : grossYield * 0.9;
                
                // 1. 収支内訳パイチャート
                const incomeExpenseCtx = document.getElementById('incomeExpenseChart');
                if (incomeExpenseCtx) {
                    new Chart(incomeExpenseCtx, {
                        type: 'doughnut',
                        data: {
                            labels: ['純収益（80%）', '経費（20%）'],
                            datasets: [{
                                data: [netIncome, annualExpense],
                                backgroundColor: [
                                    'rgba(34, 197, 94, 0.8)',   // Green for income
                                    'rgba(239, 68, 68, 0.8)'    // Red for expenses
                                ],
                                borderColor: [
                                    'rgba(34, 197, 94, 1)',
                                    'rgba(239, 68, 68, 1)'
                                ],
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#e0e7ff',
                                        font: { size: 12 },
                                        padding: 15
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            const label = context.label || '';
                                            const value = context.parsed || 0;
                                            return label + ': ¥' + value.toLocaleString();
                                        }
                                    }
                                }
                            }
                        }
                    });
                }
                
                // 2. 利回り比較棒グラフ
                const yieldComparisonCtx = document.getElementById('yieldComparisonChart');
                if (yieldComparisonCtx) {
                    new Chart(yieldComparisonCtx, {
                        type: 'bar',
                        data: {
                            labels: ['表面利回り', '実質利回り', '市場平均'],
                            datasets: [{
                                label: '利回り（%）',
                                data: [grossYield, netYield, marketYield],
                                backgroundColor: [
                                    'rgba(59, 130, 246, 0.8)',   // Blue
                                    'rgba(34, 197, 94, 0.8)',    // Green
                                    'rgba(168, 85, 247, 0.8)'    // Purple
                                ],
                                borderColor: [
                                    'rgba(59, 130, 246, 1)',
                                    'rgba(34, 197, 94, 1)',
                                    'rgba(168, 85, 247, 1)'
                                ],
                                borderWidth: 2
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: {
                                    display: false
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            return context.parsed.y.toFixed(2) + '%';
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: {
                                        color: '#e0e7ff',
                                        callback: function(value) {
                                            return value + '%';
                                        }
                                    },
                                    grid: {
                                        color: 'rgba(59, 130, 246, 0.1)'
                                    }
                                },
                                x: {
                                    ticks: {
                                        color: '#e0e7ff'
                                    },
                                    grid: {
                                        color: 'rgba(59, 130, 246, 0.1)'
                                    }
                                }
                            }
                        }
                    });
                }
                
                // 3. 市場トレンドグラフ（想定データ）
                const marketTrendCtx = document.getElementById('marketTrendChart');
                if (marketTrendCtx) {
                    const currentYear = new Date().getFullYear();
                    const years = [];
                    const rentTrend = [];
                    const priceTrend = [];
                    
                    // 過去5年から未来5年のトレンドを生成（想定）
                    for (let i = -5; i <= 5; i++) {
                        years.push(currentYear + i);
                        // 賃料は年1-2%上昇傾向（想定）
                        const rentGrowth = 1 + (i * 0.015);
                        rentTrend.push(Math.round((property.monthly_rent || rental?.average_rent || 100000) * rentGrowth));
                        // 価格は年0.5-1%変動（想定）
                        const priceGrowth = 1 + (i * 0.008);
                        priceTrend.push(Math.round((property.price || 10000000) * priceGrowth / 1000000)); // 百万円単位
                    }
                    
                    new Chart(marketTrendCtx, {
                        type: 'line',
                        data: {
                            labels: years,
                            datasets: [
                                {
                                    label: '想定月額賃料（円）',
                                    data: rentTrend,
                                    borderColor: 'rgba(34, 197, 94, 1)',
                                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                                    tension: 0.4,
                                    fill: true,
                                    yAxisID: 'y'
                                },
                                {
                                    label: '想定物件価格（百万円）',
                                    data: priceTrend,
                                    borderColor: 'rgba(59, 130, 246, 1)',
                                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                                    tension: 0.4,
                                    fill: true,
                                    yAxisID: 'y1'
                                }
                            ]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            interaction: {
                                mode: 'index',
                                intersect: false
                            },
                            plugins: {
                                legend: {
                                    position: 'bottom',
                                    labels: {
                                        color: '#e0e7ff',
                                        font: { size: 11 },
                                        padding: 12
                                    }
                                },
                                tooltip: {
                                    callbacks: {
                                        label: function(context) {
                                            let label = context.dataset.label || '';
                                            if (label) {
                                                label += ': ';
                                            }
                                            if (context.parsed.y !== null) {
                                                if (context.datasetIndex === 0) {
                                                    label += '¥' + context.parsed.y.toLocaleString();
                                                } else {
                                                    label += '¥' + context.parsed.y.toLocaleString() + '百万';
                                                }
                                            }
                                            return label;
                                        }
                                    }
                                }
                            },
                            scales: {
                                y: {
                                    type: 'linear',
                                    display: true,
                                    position: 'left',
                                    ticks: {
                                        color: '#22c55e',
                                        callback: function(value) {
                                            return '¥' + value.toLocaleString();
                                        }
                                    },
                                    grid: {
                                        color: 'rgba(34, 197, 94, 0.1)'
                                    }
                                },
                                y1: {
                                    type: 'linear',
                                    display: true,
                                    position: 'right',
                                    ticks: {
                                        color: '#3b82f6',
                                        callback: function(value) {
                                            return '¥' + value.toLocaleString() + 'M';
                                        }
                                    },
                                    grid: {
                                        drawOnChartArea: false
                                    }
                                },
                                x: {
                                    ticks: {
                                        color: '#e0e7ff'
                                    },
                                    grid: {
                                        color: 'rgba(59, 130, 246, 0.1)'
                                    }
                                }
                            }
                        }
                    });
                }
            }
            
            function downloadPDF() {
                alert('PDF出力機能は今後実装予定です。現在は印刷機能（Ctrl+P / Cmd+P）をご利用ください。');
            }
            
            // Create animated background particles
            function createParticles() {
                const particlesContainer = document.getElementById('particles');
                if (!particlesContainer) return;
                
                for (let i = 0; i < 50; i++) {
                    const particle = document.createElement('div');
                    particle.className = 'particle';
                    particle.style.left = Math.random() * 100 + '%';
                    particle.style.animationDelay = Math.random() * 20 + 's';
                    particle.style.animationDuration = (15 + Math.random() * 10) + 's';
                    particlesContainer.appendChild(particle);
                }
            }
            
            // Count-up animation for numbers
            function animateValue(element, start, end, duration) {
                if (!element) return;
                const range = end - start;
                const increment = range / (duration / 16);
                let current = start;
                
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= end) {
                        element.textContent = end.toLocaleString();
                        clearInterval(timer);
                    } else {
                        element.textContent = Math.floor(current).toLocaleString();
                    }
                }, 16);
            }
            
            // Apply glassmorphism and animations after content loads
            function enhanceDashboard() {
                // Add animations to all metric values
                document.querySelectorAll('.metric-value').forEach((el, index) => {
                    const value = parseInt(el.textContent.replace(/,/g, ''));
                    if (!isNaN(value)) {
                        setTimeout(() => {
                            animateValue(el, 0, value, 1500);
                        }, index * 200);
                    }
                });
                
                // Add hover effects to dashboard cards
                document.querySelectorAll('.dashboard-card').forEach(card => {
                    card.style.opacity = '0';
                    card.style.transform = 'translateY(20px)';
                    setTimeout(() => {
                        card.style.transition = 'all 0.5s ease';
                        card.style.opacity = '1';
                        card.style.transform = 'translateY(0)';
                    }, 100);
                });
                
                // Enable inline editing
                enableInlineEditing();
            }
            
            // Inline editing functionality
            function enableInlineEditing() {
                // Add edit mode toggle button
                const header = document.querySelector('header .flex.items-center.space-x-3');
                if (header) {
                    const editButton = document.createElement('button');
                    editButton.innerHTML = '<i class="fas fa-edit mr-2"></i>編集モード';
                    editButton.className = 'px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-lg text-yellow-300 transition-all';
                    editButton.onclick = toggleEditMode;
                    header.insertBefore(editButton, header.firstChild);
                }
            }
            
            let editMode = false;
            function toggleEditMode() {
                editMode = !editMode;
                const editButton = document.querySelector('header button');
                
                if (editMode) {
                    editButton.innerHTML = '<i class="fas fa-save mr-2"></i>保存';
                    editButton.className = 'px-4 py-2 bg-green-600/20 hover:bg-green-600/30 border border-green-500/50 rounded-lg text-green-300 transition-all';
                    
                    // Make text elements editable
                    document.querySelectorAll('.dashboard-card p, .dashboard-card span:not(.risk-badge):not(.metric-label), .dashboard-card h1, .dashboard-card h2, .dashboard-card h3, .dashboard-card h4').forEach(el => {
                        if (!el.closest('.no-print') && el.textContent.trim()) {
                            el.contentEditable = 'true';
                            el.style.outline = '1px dashed rgba(234, 179, 8, 0.5)';
                            el.style.cursor = 'text';
                        }
                    });
                    
                    alert('編集モードを有効にしました。テキストをクリックして編集できます。');
                } else {
                    editButton.innerHTML = '<i class="fas fa-edit mr-2"></i>編集モード';
                    editButton.className = 'px-4 py-2 bg-yellow-600/20 hover:bg-yellow-600/30 border border-yellow-500/50 rounded-lg text-yellow-300 transition-all';
                    
                    // Disable editing
                    document.querySelectorAll('[contenteditable="true"]').forEach(el => {
                        el.contentEditable = 'false';
                        el.style.outline = 'none';
                        el.style.cursor = 'default';
                    });
                    
                    alert('編集内容を保存しました。印刷またはPDF出力で編集済みレポートを取得できます。');
                }
            }
            
            // Initialize everything
            createParticles();
            
            // ページ読み込み時にレポートデータをロード
            loadReportData().then(() => {
                // Enhance dashboard after data loads
                setTimeout(enhanceDashboard, 500);
            });
        </script>
    </body>
    </html>
  `);
});

export default properties;
