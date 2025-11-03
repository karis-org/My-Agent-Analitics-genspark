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
                            <img src="/static/icons/app-icon.png" alt="Logo" class="h-10 w-10">
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
                            <img src="/static/icons/app-icon.png" alt="Logo" class="h-10 w-10">
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
                    <p class="text-sm text-gray-600 mb-4">画像をアップロードすると自動で物件情報を入力します</p>
                    <input type="file" id="mysoku-upload" accept="image/*,.pdf" class="hidden">
                    <button type="button" onclick="document.getElementById('mysoku-upload').click()"
                            class="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        <i class="fas fa-upload mr-2"></i>画像をアップロード
                    </button>
                    <p class="text-xs text-gray-500 mt-2">対応形式: JPG, PNG, PDF</p>
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

                    <!-- Submit buttons -->
                    <div class="flex items-center justify-end space-x-4">
                        <a href="/properties" 
                           class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
                            キャンセル
                        </a>
                        <button type="submit"
                                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>保存して分析へ
                        </button>
                    </div>
                </form>
            </div>
        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
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
                    // 画像をBase64に変換
                    const reader = new FileReader();
                    reader.onload = async (event) => {
                        const base64Data = event.target.result;
                        
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
                            
                            const fieldsSummary = extractedFields.length > 0 
                                ? \`<ul class="mt-2 text-xs text-gray-600 space-y-1">\${extractedFields.map(f => \`<li>✓ \${f}</li>\`).join('')}</ul>\`
                                : '';
                            
                            // デモモードの警告表示
                            if (data.mode === 'demonstration') {
                                uploadResult.innerHTML = \`
                                    <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                        <i class="fas fa-info-circle text-yellow-600 mr-2"></i>
                                        <span class="text-sm text-yellow-800 font-medium">デモモード: サンプルデータを表示しています</span>
                                        <p class="text-xs text-yellow-700 mt-2">実際のOCR機能を利用するには、OpenAI APIキーを設定してください。</p>
                                        \${fieldsSummary}
                                    </div>
                                \`;
                            } else {
                                uploadResult.innerHTML = \`
                                    <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                                        <i class="fas fa-check-circle text-green-600 mr-2"></i>
                                        <span class="text-sm text-green-800 font-medium">物件情報を自動入力しました</span>
                                        \${fieldsSummary}
                                    </div>
                                \`;
                            }
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
                    };
                    reader.readAsDataURL(file);
                } catch (error) {
                    console.error('File read error:', error);
                    uploadStatus.classList.add('hidden');
                }
            });
            
            document.getElementById('property-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const formData = new FormData(e.target);
                const data = Object.fromEntries(formData.entries());
                
                try {
                    const response = await axios.post('/api/properties', data);
                    const propertyId = response.data.property.id;
                    window.location.href = \`/properties/\${propertyId}/analyze\`;
                } catch (error) {
                    console.error('Failed to create property:', error);
                    alert('物件の登録に失敗しました');
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
                            <img src="/static/icons/app-icon.png" alt="Logo" class="h-10 w-10">
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">物件詳細</h1>
                    </div>
                    <div class="flex items-center space-x-4">
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
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
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
                            <img src="/static/icons/app-icon.png" alt="Logo" class="h-10 w-10">
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
                            <label class="block text-sm font-medium text-gray-700 mb-2">年間経費 (円)</label>
                            <input type="number" id="annualExpenses" value="0"
                                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
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
                    
                    document.getElementById('propertyPrice').value = property.price || 0;
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
                                    <button class="text-xs text-blue-600 hover:text-blue-800" onclick="alert('表面利回り（グロス利回り）\\n\\n計算式: 年間家賃収入 ÷ 物件価格 × 100\\n\\n経費を考慮せず、満室想定の年間家賃収入から算出する利回りです。物件の収益性を簡易的に比較する際に使用します。')">
                                        <i class="fas fa-question-circle"></i>
                                    </button>
                                </div>
                                <p class="text-3xl font-bold text-blue-600">\${(analysis.grossYield || 0).toFixed(2)}%</p>
                            </div>
                            <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-sm text-gray-600">実質利回り</p>
                                    <button class="text-xs text-green-600 hover:text-green-800" onclick="alert('実質利回り（ネット利回り）\\n\\n計算式: NOI ÷ 物件価格 × 100\\n\\n運営費用（管理費、修繕費、固定資産税等）を差し引いた後の利回りです。実際の収益性をより正確に表します。')">
                                        <i class="fas fa-question-circle"></i>
                                    </button>
                                </div>
                                <p class="text-3xl font-bold text-green-600">\${(analysis.netYield || 0).toFixed(2)}%</p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                                <div class="flex items-center justify-between mb-2">
                                    <p class="text-sm text-gray-600">NOI (純収益)</p>
                                    <button class="text-xs text-purple-600 hover:text-purple-800" onclick="alert('NOI (Net Operating Income / 純収益)\\n\\n計算式: 実効収入 - 運営費\\n\\n物件が生み出す純粋な営業利益です。ローン返済前の手取り収入を表します。物件の収益力を評価する重要な指標です。')">
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
                                            <button class="text-xs text-blue-600 hover:text-blue-800" onclick="alert('LTV (Loan to Value / 融資比率)\\n\\n計算式: 借入額 ÷ 物件価格 × 100\\n\\n物件価格に対する借入金の割合です。一般的に80%以下が望ましいとされています。高すぎるとリスクが増加します。')">
                                                <i class="fas fa-question-circle"></i>
                                            </button>
                                        </dt>
                                        <dd class="font-semibold">\${(analysis.ltv || 0).toFixed(1)}%</dd>
                                    </div>
                                    <div class="flex justify-between items-center">
                                        <dt class="text-gray-600 flex items-center gap-2">
                                            DSCR:
                                            <button class="text-xs text-blue-600 hover:text-blue-800" onclick="alert('DSCR (Debt Service Coverage Ratio / 債務償還カバー率)\\n\\n計算式: NOI ÷ 年間返済額\\n\\n収益で返済をカバーできるかを示す指標です。1.2以上が望ましく、1未満の場合は返済が困難になる可能性があります。')">
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
            }
            
            loadProperty();
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
properties.get('/:id/comprehensive-report', async (c) => {
  const user = c.get('user');
  const propertyId = c.req.param('id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>統合分析レポート - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;700;900&display=swap');
            body { 
                font-family: 'Noto Sans JP', sans-serif;
                background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            }
            
            .glass-card {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(10px);
                border: 1px solid rgba(255, 255, 255, 0.3);
            }
            
            .chart-container {
                position: relative;
                height: 300px;
                margin-bottom: 2rem;
            }
            
            .score-ring {
                stroke-dasharray: 282.6;
                transition: stroke-dashoffset 1s ease-in-out;
            }
            
            .rating-S { color: #FFD700; }
            .rating-A { color: #4CAF50; }
            .rating-B { color: #2196F3; }
            .rating-C { color: #FF9800; }
            .rating-D { color: #F44336; }
            
            .metric-card {
                transition: transform 0.2s, box-shadow 0.2s;
            }
            
            .metric-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 24px rgba(0,0,0,0.15);
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .fade-in {
                animation: fadeIn 0.6s ease-out forwards;
            }
            
            .loading-spinner {
                border: 4px solid #f3f3f3;
                border-top: 4px solid #3498db;
                border-radius: 50%;
                width: 60px;
                height: 60px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .progress-bar {
                transition: width 1s ease-in-out;
            }
        </style>
    </head>
    <body class="min-h-screen">
        <!-- ヘッダー -->
        <header class="glass-card shadow-lg sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard">
                            <img src="/static/icons/app-icon.png" alt="Logo" class="h-12 w-12">
                        </a>
                        <div>
                            <h1 class="text-2xl font-bold text-gray-900">統合分析レポート</h1>
                            <p class="text-sm text-gray-600">Comprehensive Property Analysis</p>
                        </div>
                    </div>
                    <div class="flex items-center space-x-3">
                        <button onclick="window.print()" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-print mr-2"></i>印刷
                        </button>
                        <button onclick="downloadPDF()" class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                            <i class="fas fa-file-pdf mr-2"></i>PDF
                        </button>
                        <a href="/properties/\${propertyId}" class="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100">
                            <i class="fas fa-arrow-left mr-2"></i>戻る
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- ローディング画面 -->
        <div id="loading" class="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
            <div class="text-center">
                <div class="loading-spinner mx-auto mb-4"></div>
                <p class="text-xl font-semibold text-gray-700">分析を実行中...</p>
                <p class="text-sm text-gray-500 mt-2">データを収集して統合分析を行っています</p>
            </div>
        </div>

        <!-- メインコンテンツ -->
        <main id="main-content" class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8" style="display: none;">
            
            <!-- エグゼクティブサマリー -->
            <section id="executive-summary" class="glass-card rounded-2xl shadow-2xl p-8 mb-8 fade-in">
                <div class="flex items-center justify-between mb-6">
                    <h2 class="text-3xl font-bold text-gray-900">
                        <i class="fas fa-star text-yellow-500 mr-3"></i>エグゼクティブサマリー
                    </h2>
                    <div id="overall-rating" class="text-6xl font-black"></div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                        <h3 id="property-name" class="text-2xl font-bold text-gray-800 mb-2"></h3>
                        <p id="property-location" class="text-gray-600 mb-4"></p>
                        <div class="flex items-center space-x-4">
                            <div class="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-semibold">
                                <span id="property-type"></span>
                            </div>
                            <div class="text-2xl font-bold text-gray-900">
                                ¥<span id="property-price"></span>
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <div class="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl p-6">
                            <div class="text-sm font-medium mb-2">総合スコア</div>
                            <div class="flex items-end justify-between">
                                <div class="text-5xl font-black" id="total-score"></div>
                                <div class="text-xl opacity-90">/ 100</div>
                            </div>
                            <div class="mt-3 text-sm opacity-90" id="recommendation-badge"></div>
                        </div>
                    </div>
                </div>
                
                <div class="bg-gray-50 rounded-xl p-6">
                    <h4 class="font-semibold text-gray-900 mb-3">AIによる総合評価</h4>
                    <p id="ai-summary" class="text-gray-700 leading-relaxed"></p>
                </div>
            </section>

            <!-- スコアカードダッシュボード -->
            <section id="scorecard" class="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
                <div class="metric-card glass-card rounded-xl shadow-lg p-6">
                    <div class="text-sm font-medium text-gray-600 mb-2">財務指標</div>
                    <div class="text-3xl font-bold text-gray-900 mb-2" id="financial-score"></div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="financial-progress" class="progress-bar bg-blue-600 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="metric-card glass-card rounded-xl shadow-lg p-6">
                    <div class="text-sm font-medium text-gray-600 mb-2">市場ポジション</div>
                    <div class="text-3xl font-bold text-gray-900 mb-2" id="market-score"></div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="market-progress" class="progress-bar bg-green-600 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="metric-card glass-card rounded-xl shadow-lg p-6">
                    <div class="text-sm font-medium text-gray-600 mb-2">立地品質</div>
                    <div class="text-3xl font-bold text-gray-900 mb-2" id="location-score"></div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="location-progress" class="progress-bar bg-purple-600 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="metric-card glass-card rounded-xl shadow-lg p-6">
                    <div class="text-sm font-medium text-gray-600 mb-2">需要予測</div>
                    <div class="text-3xl font-bold text-gray-900 mb-2" id="demand-score"></div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="demand-progress" class="progress-bar bg-orange-600 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
                
                <div class="metric-card glass-card rounded-xl shadow-lg p-6">
                    <div class="text-sm font-medium text-gray-600 mb-2">リスク評価</div>
                    <div class="text-3xl font-bold text-gray-900 mb-2" id="risk-score"></div>
                    <div class="w-full bg-gray-200 rounded-full h-2">
                        <div id="risk-progress" class="progress-bar bg-red-600 h-2 rounded-full" style="width: 0%"></div>
                    </div>
                </div>
            </section>

            <!-- チャートセクション -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <!-- レーダーチャート -->
                <section class="glass-card rounded-2xl shadow-xl p-6 fade-in">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-chart-area text-indigo-600 mr-2"></i>総合評価レーダー
                    </h3>
                    <div class="chart-container">
                        <canvas id="radar-chart"></canvas>
                    </div>
                </section>

                <!-- スコアブレイクダウンバーチャート -->
                <section class="glass-card rounded-2xl shadow-xl p-6 fade-in">
                    <h3 class="text-xl font-bold text-gray-900 mb-4">
                        <i class="fas fa-chart-bar text-green-600 mr-2"></i>スコア内訳
                    </h3>
                    <div class="chart-container">
                        <canvas id="breakdown-chart"></canvas>
                    </div>
                </section>
            </div>

            <!-- 市場分析 -->
            <section class="glass-card rounded-2xl shadow-xl p-8 mb-8 fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-chart-line text-blue-600 mr-3"></i>市場分析
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                    <div class="bg-blue-50 rounded-xl p-6">
                        <div class="text-sm text-blue-600 font-medium mb-2">市場平均価格</div>
                        <div class="text-2xl font-bold text-blue-900" id="market-avg-price"></div>
                        <div class="text-sm text-blue-700 mt-2" id="price-vs-market"></div>
                    </div>
                    
                    <div class="bg-green-50 rounded-xl p-6">
                        <div class="text-sm text-green-600 font-medium mb-2">価格ポジション</div>
                        <div class="text-2xl font-bold text-green-900" id="price-position"></div>
                        <div class="text-sm text-green-700 mt-2" id="price-percentile"></div>
                    </div>
                    
                    <div class="bg-purple-50 rounded-xl p-6">
                        <div class="text-sm text-purple-600 font-medium mb-2">市場競争力</div>
                        <div class="text-2xl font-bold text-purple-900" id="competitiveness"></div>
                        <div class="text-sm text-purple-700 mt-2" id="market-trend"></div>
                    </div>
                </div>
                
                <div class="chart-container">
                    <canvas id="market-trend-chart"></canvas>
                </div>
            </section>

            <!-- 需要予測 -->
            <section class="glass-card rounded-2xl shadow-xl p-8 mb-8 fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-users text-orange-600 mr-3"></i>需要予測
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-4">賃貸需要</h4>
                        <div class="flex items-center mb-4">
                            <div class="flex-1">
                                <div class="flex justify-between mb-2">
                                    <span class="text-sm font-medium text-gray-700">需要スコア</span>
                                    <span class="text-sm font-bold text-gray-900" id="rental-demand-score"></span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3">
                                    <div id="rental-demand-bar" class="bg-orange-500 h-3 rounded-full transition-all duration-1000" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-orange-50 rounded-lg p-4">
                            <div class="font-medium text-orange-900 mb-2">プラス要因</div>
                            <ul id="rental-positive-factors" class="text-sm text-orange-800 space-y-1"></ul>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-4">購入需要</h4>
                        <div class="flex items-center mb-4">
                            <div class="flex-1">
                                <div class="flex justify-between mb-2">
                                    <span class="text-sm font-medium text-gray-700">需要スコア</span>
                                    <span class="text-sm font-bold text-gray-900" id="buyer-demand-score"></span>
                                </div>
                                <div class="w-full bg-gray-200 rounded-full h-3">
                                    <div id="buyer-demand-bar" class="bg-blue-500 h-3 rounded-full transition-all duration-1000" style="width: 0%"></div>
                                </div>
                            </div>
                        </div>
                        <div class="bg-blue-50 rounded-lg p-4">
                            <div class="font-medium text-blue-900 mb-2">プラス要因</div>
                            <ul id="buyer-positive-factors" class="text-sm text-blue-800 space-y-1"></ul>
                        </div>
                    </div>
                </div>
            </section>

            <!-- 物件周辺地図 -->
            <section class="glass-card rounded-2xl shadow-xl p-8 mb-8 fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-map-marked-alt text-red-600 mr-3"></i>物件周辺地図
                </h2>
                
                <div id="maps-container" class="space-y-6">
                    <div id="maps-loading" class="text-center py-12">
                        <i class="fas fa-spinner fa-spin text-4xl text-blue-600 mb-4"></i>
                        <p class="text-gray-600">地図を生成中...</p>
                    </div>
                    
                    <!-- 1kmスケール地図 -->
                    <div id="map-1km-section" class="hidden">
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">
                            周辺地図（1kmスケール）
                        </h3>
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                            <img id="map-1km-image" src="" alt="1km周辺地図" class="w-full h-auto">
                        </div>
                        <p class="text-xs text-gray-500 mt-2">
                            ※ この地図は参考用です。正確な位置情報は現地でご確認ください。
                        </p>
                    </div>
                    
                    <!-- 200mスケール地図 -->
                    <div id="map-200m-section" class="hidden">
                        <h3 class="text-lg font-semibold text-gray-900 mb-3">
                            周辺地図（200mスケール）
                        </h3>
                        <div class="border border-gray-200 rounded-lg overflow-hidden">
                            <img id="map-200m-image" src="" alt="200m周辺地図" class="w-full h-auto">
                        </div>
                        <p class="text-xs text-gray-500 mt-2">
                            ※ この地図は参考用です。正確な位置情報は現地でご確認ください。
                        </p>
                    </div>
                    
                    <div id="maps-error" class="hidden text-center py-8">
                        <i class="fas fa-exclamation-triangle text-yellow-500 text-4xl mb-4"></i>
                        <p class="text-gray-600">地図を生成できませんでした</p>
                        <p class="text-sm text-gray-500 mt-2">Google Maps APIキーが設定されていない可能性があります</p>
                    </div>
                </div>
            </section>

            <!-- 投資推奨 -->
            <section class="glass-card rounded-2xl shadow-xl p-8 mb-8 fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-lightbulb text-yellow-600 mr-3"></i>投資推奨
                </h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <div class="flex items-center justify-between mb-4">
                            <h4 class="font-semibold text-gray-900">最終判断</h4>
                            <div id="final-action-badge" class="px-4 py-2 rounded-full font-bold"></div>
                        </div>
                        <div class="bg-gray-50 rounded-xl p-6 mb-4">
                            <h5 class="font-medium text-gray-700 mb-3">判断理由</h5>
                            <ul id="recommendation-reasoning" class="space-y-2"></ul>
                        </div>
                    </div>
                    
                    <div>
                        <h4 class="font-semibold text-gray-900 mb-4">AIによる投資推奨</h4>
                        <div class="bg-indigo-50 rounded-xl p-6">
                            <p id="ai-recommendation" class="text-gray-700 leading-relaxed"></p>
                        </div>
                    </div>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                    <div class="bg-green-50 rounded-xl p-6">
                        <h5 class="font-semibold text-green-900 mb-3">
                            <i class="fas fa-check-circle mr-2"></i>主な投資機会
                        </h5>
                        <ul id="key-opportunities" class="space-y-2 text-sm text-green-800"></ul>
                    </div>
                    
                    <div class="bg-red-50 rounded-xl p-6">
                        <h5 class="font-semibold text-red-900 mb-3">
                            <i class="fas fa-exclamation-triangle mr-2"></i>主なリスク
                        </h5>
                        <ul id="key-risks" class="space-y-2 text-sm text-red-800"></ul>
                    </div>
                </div>
            </section>

            <!-- 詳細データ -->
            <section class="glass-card rounded-2xl shadow-xl p-8 mb-8 fade-in">
                <h2 class="text-2xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-database text-gray-600 mr-3"></i>詳細データ
                </h2>
                <div id="detailed-data" class="space-y-4"></div>
            </section>

        </main>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            let analysisData = null;
            let charts = {};

            // ページロード時に分析を実行
            async function loadComprehensiveAnalysis() {
                try {
                    // 物件データを取得
                    const propertyResponse = await axios.get('/api/properties/\${propertyId}');
                    const property = propertyResponse.data.property;
                    
                    if (!property) {
                        throw new Error('物件が見つかりません');
                    }
                    
                    // 統合分析を実行
                    const analysisResponse = await axios.post('/api/properties/comprehensive-analysis', {
                        name: property.name,
                        propertyType: 'investment', // TODO: 物件タイプを適切に設定
                        price: property.price,
                        location: property.location || '東京都',
                        area: property.total_floor_area || 65,
                        age: property.age || 5,
                        distanceFromStation: property.distance_from_station || 10,
                        prefCode: '13', // TODO: 都道府県コードを適切に設定
                        cityCode: '13101',
                        structure: property.structure,
                        // 収益物件の場合の追加データ
                        // monthlyRent, grossIncome, etc.
                    });
                    
                    analysisData = analysisResponse.data.analysis;
                    
                    // 地図を生成（並行処理）
                    loadPropertyMaps(property.location, property.latitude, property.longitude);
                    
                    // UIを更新
                    updateUI();
                    
                    // ローディングを非表示、コンテンツを表示
                    document.getElementById('loading').style.display = 'none';
                    document.getElementById('main-content').style.display = 'block';
                    
                    // アニメーション開始
                    setTimeout(() => {
                        animateProgressBars();
                        initializeCharts();
                    }, 100);
                    
                } catch (error) {
                    console.error('Analysis error:', error);
                    document.getElementById('loading').innerHTML = \`
                        <div class="text-center">
                            <i class="fas fa-exclamation-triangle text-red-500 text-6xl mb-4"></i>
                            <p class="text-xl font-semibold text-gray-700">分析に失敗しました</p>
                            <p class="text-sm text-gray-500 mt-2">\${error.response?.data?.error || error.message}</p>
                            <button onclick="window.location.reload()" class="mt-4 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700">
                                再試行
                            </button>
                        </div>
                    \`;
                }
            }

            // 地図生成関数
            async function loadPropertyMaps(address, lat, lng) {
                try {
                    const response = await axios.post('/api/maps/generate', {
                        address: address,
                        lat: lat,
                        lng: lng
                    });

                    if (response.data.success && response.data.maps) {
                        const maps = response.data.maps;
                        
                        // ローディングを非表示
                        document.getElementById('maps-loading').style.display = 'none';
                        
                        // 1km地図を表示
                        const map1kmSection = document.getElementById('map-1km-section');
                        const map1kmImage = document.getElementById('map-1km-image');
                        map1kmImage.src = maps.map1km;
                        map1kmSection.classList.remove('hidden');
                        
                        // 200m地図を表示
                        const map200mSection = document.getElementById('map-200m-section');
                        const map200mImage = document.getElementById('map-200m-image');
                        map200mImage.src = maps.map200m;
                        map200mSection.classList.remove('hidden');
                    } else {
                        throw new Error('Maps data not available');
                    }
                } catch (error) {
                    console.error('Map generation error:', error);
                    
                    // エラー表示
                    document.getElementById('maps-loading').style.display = 'none';
                    document.getElementById('maps-error').classList.remove('hidden');
                }
            }

            function updateUI() {
                if (!analysisData) return;
                
                // エグゼクティブサマリー
                document.getElementById('property-name').textContent = analysisData.propertyName;
                document.getElementById('property-location').textContent = analysisData.marketContext.area || 'N/A';
                document.getElementById('property-type').textContent = analysisData.propertyType === 'investment' ? '収益物件' : '実需物件';
                document.getElementById('property-price').textContent = (analysisData.marketContext.averagePrice || 0).toLocaleString();
                
                // 総合スコアとレーティング
                const rating = analysisData.investmentQuality.rating;
                const totalScore = analysisData.investmentQuality.totalScore;
                document.getElementById('overall-rating').textContent = rating;
                document.getElementById('overall-rating').className = 'text-6xl font-black rating-' + rating;
                document.getElementById('total-score').textContent = totalScore;
                
                // 推奨バッジ
                const action = analysisData.finalRecommendation.action;
                let badgeClass = 'bg-green-100 text-green-800';
                let badgeText = '購入推奨';
                if (action === 'consider') {
                    badgeClass = 'bg-yellow-100 text-yellow-800';
                    badgeText = '検討推奨';
                } else if (action === 'avoid') {
                    badgeClass = 'bg-red-100 text-red-800';
                    badgeText = '回避推奨';
                }
                document.getElementById('recommendation-badge').innerHTML = \`<span class="px-3 py-1 rounded-full \${badgeClass}">\${badgeText}</span>\`;
                
                // AIサマリー
                document.getElementById('ai-summary').textContent = analysisData.aiAnalysis.summary;
                
                // スコアカード
                document.getElementById('financial-score').textContent = analysisData.investmentQuality.financialScore;
                document.getElementById('market-score').textContent = analysisData.investmentQuality.marketScore;
                document.getElementById('location-score').textContent = analysisData.investmentQuality.locationScore;
                document.getElementById('demand-score').textContent = analysisData.investmentQuality.demandScore;
                document.getElementById('risk-score').textContent = analysisData.investmentQuality.riskScore;
                
                // 市場分析
                document.getElementById('market-avg-price').textContent = '¥' + (analysisData.marketContext.averagePrice || 0).toLocaleString();
                document.getElementById('price-vs-market').textContent = \`市場比 \${analysisData.marketPosition.priceVsMarketAverage > 0 ? '+' : ''}\${analysisData.marketPosition.priceVsMarketAverage.toFixed(1)}%\`;
                document.getElementById('price-position').textContent = analysisData.marketPosition.pricePosition === 'low' ? '割安' : 
                    analysisData.marketPosition.pricePosition === 'high' ? '割高' : '平均的';
                document.getElementById('price-percentile').textContent = \`上位\${(100 - analysisData.marketPosition.pricePercentile).toFixed(0)}%\`;
                document.getElementById('competitiveness').textContent = analysisData.marketPosition.competitiveness === 'strong' ? '強い' :
                    analysisData.marketPosition.competitiveness === 'weak' ? '弱い' : '普通';
                document.getElementById('market-trend').textContent = \`変化率 \${analysisData.marketContext.priceTrend.changeRate.toFixed(1)}%\`;
                
                // 需要予測
                document.getElementById('rental-demand-score').textContent = analysisData.demandForecast.rentalDemandScore;
                document.getElementById('buyer-demand-score').textContent = analysisData.demandForecast.buyerDemandScore;
                
                // プラス要因
                const rentalFactors = document.getElementById('rental-positive-factors');
                rentalFactors.innerHTML = analysisData.demandForecast.factors.positive
                    .map(f => \`<li><i class="fas fa-check text-green-600 mr-2"></i>\${f}</li>\`)
                    .join('');
                
                const buyerFactors = document.getElementById('buyer-positive-factors');
                buyerFactors.innerHTML = analysisData.demandForecast.factors.positive
                    .map(f => \`<li><i class="fas fa-check text-blue-600 mr-2"></i>\${f}</li>\`)
                    .join('');
                
                // 投資推奨
                const actionBadge = document.getElementById('final-action-badge');
                actionBadge.textContent = badgeText;
                actionBadge.className = 'px-4 py-2 rounded-full font-bold ' + badgeClass;
                
                document.getElementById('recommendation-reasoning').innerHTML = analysisData.finalRecommendation.reasoning
                    .map(r => \`<li class="flex items-start"><i class="fas fa-circle text-xs text-gray-400 mr-3 mt-2"></i><span class="text-gray-700">\${r}</span></li>\`)
                    .join('');
                
                document.getElementById('ai-recommendation').textContent = analysisData.aiAnalysis.investmentRecommendation;
                
                document.getElementById('key-opportunities').innerHTML = analysisData.finalRecommendation.keyOpportunities
                    .map(o => \`<li class="flex items-start"><i class="fas fa-plus-circle mr-2 mt-1"></i><span>\${o}</span></li>\`)
                    .join('');
                
                document.getElementById('key-risks').innerHTML = analysisData.finalRecommendation.keyRisks
                    .map(r => \`<li class="flex items-start"><i class="fas fa-minus-circle mr-2 mt-1"></i><span>\${r}</span></li>\`)
                    .join('');
                
                // 詳細データ
                const detailedData = document.getElementById('detailed-data');
                detailedData.innerHTML = \`
                    <div class="border-t border-gray-200 pt-4">
                        <h4 class="font-semibold mb-2">分析完了時刻</h4>
                        <p class="text-gray-700">\${new Date(analysisData.analyzedAt).toLocaleString('ja-JP')}</p>
                    </div>
                    <div class="border-t border-gray-200 pt-4">
                        <h4 class="font-semibold mb-2">物件タイプ</h4>
                        <p class="text-gray-700">\${analysisData.propertyType === 'investment' ? '収益用物件' : '実需用物件'}</p>
                    </div>
                \`;
            }

            function animateProgressBars() {
                if (!analysisData) return;
                
                setTimeout(() => {
                    document.getElementById('financial-progress').style.width = analysisData.investmentQuality.financialScore + '%';
                    document.getElementById('market-progress').style.width = analysisData.investmentQuality.marketScore + '%';
                    document.getElementById('location-progress').style.width = analysisData.investmentQuality.locationScore + '%';
                    document.getElementById('demand-progress').style.width = analysisData.investmentQuality.demandScore + '%';
                    document.getElementById('risk-progress').style.width = analysisData.investmentQuality.riskScore + '%';
                    document.getElementById('rental-demand-bar').style.width = analysisData.demandForecast.rentalDemandScore + '%';
                    document.getElementById('buyer-demand-bar').style.width = analysisData.demandForecast.buyerDemandScore + '%';
                }, 300);
            }

            function initializeCharts() {
                if (!analysisData) return;
                
                // レーダーチャート
                const radarCtx = document.getElementById('radar-chart').getContext('2d');
                charts.radar = new Chart(radarCtx, {
                    type: 'radar',
                    data: {
                        labels: ['財務指標', '市場ポジション', '立地品質', '需要予測', 'リスク'],
                        datasets: [{
                            label: '総合評価',
                            data: [
                                analysisData.investmentQuality.financialScore,
                                analysisData.investmentQuality.marketScore,
                                analysisData.investmentQuality.locationScore,
                                analysisData.investmentQuality.demandScore,
                                analysisData.investmentQuality.riskScore
                            ],
                            backgroundColor: 'rgba(54, 162, 235, 0.2)',
                            borderColor: 'rgb(54, 162, 235)',
                            borderWidth: 2,
                            pointBackgroundColor: 'rgb(54, 162, 235)',
                            pointBorderColor: '#fff',
                            pointHoverBackgroundColor: '#fff',
                            pointHoverBorderColor: 'rgb(54, 162, 235)'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            r: {
                                beginAtZero: true,
                                max: 100,
                                ticks: {
                                    stepSize: 20
                                }
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
                
                // スコアブレイクダウンバーチャート
                const breakdownCtx = document.getElementById('breakdown-chart').getContext('2d');
                charts.breakdown = new Chart(breakdownCtx, {
                    type: 'bar',
                    data: {
                        labels: analysisData.investmentQuality.breakdown.map(b => b.category),
                        datasets: [{
                            label: 'スコア',
                            data: analysisData.investmentQuality.breakdown.map(b => b.score),
                            backgroundColor: [
                                'rgba(54, 162, 235, 0.8)',
                                'rgba(75, 192, 192, 0.8)',
                                'rgba(153, 102, 255, 0.8)',
                                'rgba(255, 159, 64, 0.8)',
                                'rgba(255, 99, 132, 0.8)'
                            ],
                            borderColor: [
                                'rgb(54, 162, 235)',
                                'rgb(75, 192, 192)',
                                'rgb(153, 102, 255)',
                                'rgb(255, 159, 64)',
                                'rgb(255, 99, 132)'
                            ],
                            borderWidth: 2
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        scales: {
                            y: {
                                beginAtZero: true,
                                max: 100
                            }
                        },
                        plugins: {
                            legend: {
                                display: false
                            }
                        }
                    }
                });
                
                // 市場トレンドチャート
                const trendCtx = document.getElementById('market-trend-chart').getContext('2d');
                charts.trend = new Chart(trendCtx, {
                    type: 'line',
                    data: {
                        labels: ['前々四半期', '前四半期', '当四半期'],
                        datasets: [{
                            label: '市場平均価格',
                            data: [
                                analysisData.marketContext.priceTrend.previousQuarter * 0.97,
                                analysisData.marketContext.priceTrend.previousQuarter,
                                analysisData.marketContext.priceTrend.currentQuarter
                            ],
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.1)',
                            tension: 0.4,
                            fill: true
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                            legend: {
                                display: false
                            }
                        },
                        scales: {
                            y: {
                                ticks: {
                                    callback: function(value) {
                                        return '¥' + (value / 10000).toFixed(0) + '万';
                                    }
                                }
                            }
                        }
                    }
                });
            }

            function downloadPDF() {
                alert('PDF出力機能は開発中です');
            }

            // ページ読み込み時に実行
            loadComprehensiveAnalysis();
        </script>
    </body>
    </html>
  `);
});

export default properties;
