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

export default properties;
