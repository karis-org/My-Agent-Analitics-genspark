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
                            
                            // フォームに自動入力
                            if (data.name) document.querySelector('[name="name"]').value = data.name;
                            if (data.price) document.querySelector('[name="price"]').value = data.price;
                            if (data.location) document.querySelector('[name="location"]').value = data.location;
                            if (data.structure) document.querySelector('[name="structure"]').value = data.structure;
                            if (data.total_floor_area) document.querySelector('[name="total_floor_area"]').value = data.total_floor_area;
                            if (data.age) document.querySelector('[name="age"]').value = data.age;
                            if (data.distance_from_station) document.querySelector('[name="distance_from_station"]').value = data.distance_from_station;
                            
                            // 成功メッセージ
                            uploadStatus.classList.add('hidden');
                            uploadResult.classList.remove('hidden');
                        } catch (error) {
                            console.error('OCR failed:', error);
                            alert('画像の読み取りに失敗しました。手動で入力してください。');
                            uploadStatus.classList.add('hidden');
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
                                <p class="text-sm text-gray-600 mb-2">表面利回り</p>
                                <p class="text-3xl font-bold text-blue-600">\${(analysis.grossYield || 0).toFixed(2)}%</p>
                            </div>
                            <div class="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-lg">
                                <p class="text-sm text-gray-600 mb-2">実質利回り</p>
                                <p class="text-3xl font-bold text-green-600">\${(analysis.netYield || 0).toFixed(2)}%</p>
                            </div>
                            <div class="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-lg">
                                <p class="text-sm text-gray-600 mb-2">NOI</p>
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
                                        <dd class="font-semibold">¥\${Math.round(analysis.effectiveIncome || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">年間運営費:</dt>
                                        <dd class="font-semibold">¥\${Math.round(analysis.operatingExpenses || 0).toLocaleString()}</dd>
                                    </div>
                                    <div class="flex justify-between border-t pt-3">
                                        <dt class="text-gray-900 font-semibold">年間キャッシュフロー:</dt>
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
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">LTV:</dt>
                                        <dd class="font-semibold">\${(analysis.ltv || 0).toFixed(1)}%</dd>
                                    </div>
                                    <div class="flex justify-between">
                                        <dt class="text-gray-600">DSCR:</dt>
                                        <dd class="font-semibold">\${(analysis.dscr || 0).toFixed(2)}</dd>
                                    </div>
                                </dl>
                            </div>
                        </div>
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

export default properties;
