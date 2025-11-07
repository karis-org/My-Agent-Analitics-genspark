/**
 * Property List Page Component
 * 物件一覧ページ
 */

import { renderLayout, renderLoadingIndicator } from './layout';

export function renderPropertyListPage(user: any): string {
  const additionalHead = `
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
  `;
  
  const content = `
    <main class="max-w-7xl mx-auto px-3 py-6 sm:px-6 lg:px-8">
        <div class="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h2 class="text-xl sm:text-2xl font-bold text-gray-900">登録物件</h2>
                <p class="text-sm sm:text-base text-gray-600 mt-1">物件を管理・分析できます</p>
            </div>
            <a href="/properties/new" 
               class="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation text-center">
                <i class="fas fa-plus mr-2"></i>新規登録
            </a>
        </div>

        <!-- Search and Filter -->
        <div class="bg-white rounded-lg shadow p-4 sm:p-6 mb-6">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">物件名で検索</label>
                    <input type="text" 
                           id="searchName" 
                           placeholder="物件名を入力"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base">
                </div>
                <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">所在地で検索</label>
                    <input type="text" 
                           id="searchLocation" 
                           placeholder="所在地を入力"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base">
                </div>
                <div>
                    <label class="block text-xs sm:text-sm font-medium text-gray-700 mb-2">並び順</label>
                    <select id="sortBy" 
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base">
                        <option value="created_at_desc">登録日（新しい順）</option>
                        <option value="created_at_asc">登録日（古い順）</option>
                        <option value="name_asc">物件名（昇順）</option>
                        <option value="name_desc">物件名（降順）</option>
                    </select>
                </div>
                <div class="flex items-end">
                    <button onclick="searchProperties()" 
                            class="w-full bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation text-sm sm:text-base">
                        <i class="fas fa-search mr-2"></i>検索
                    </button>
                </div>
            </div>
        </div>

        <!-- Properties List -->
        <div id="propertiesList" class="space-y-4">
            <div class="text-center py-12">
                <div class="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p class="text-sm sm:text-base text-gray-600">読み込み中...</p>
            </div>
        </div>

        <!-- Empty State -->
        <div id="emptyState" class="hidden text-center py-12">
            <i class="fas fa-building text-6xl sm:text-8xl text-gray-300 mb-4"></i>
            <h3 class="text-lg sm:text-xl font-semibold text-gray-700 mb-2">物件が登録されていません</h3>
            <p class="text-sm sm:text-base text-gray-500 mb-6">新しい物件を登録して分析を開始しましょう</p>
            <a href="/properties/new" 
               class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors touch-manipulation">
                <i class="fas fa-plus mr-2"></i>最初の物件を登録
            </a>
        </div>
    </main>

    ${renderLoadingIndicator()}

    <script>
        let allProperties = [];

        // Load properties on page load
        document.addEventListener('DOMContentLoaded', function() {
            loadProperties();
        });

        async function loadProperties() {
            try {
                const response = await axios.get('/api/properties');
                allProperties = response.data.properties || [];
                displayProperties(allProperties);
            } catch (error) {
                console.error('Failed to load properties:', error);
                document.getElementById('propertiesList').innerHTML = 
                    '<div class="bg-red-50 border-l-4 border-red-500 p-4"><p class="text-red-700">物件の読み込みに失敗しました</p></div>';
            }
        }

        function displayProperties(properties) {
            const container = document.getElementById('propertiesList');
            const emptyState = document.getElementById('emptyState');

            if (!properties || properties.length === 0) {
                container.innerHTML = '';
                emptyState.classList.remove('hidden');
                return;
            }

            emptyState.classList.add('hidden');
            container.innerHTML = properties.map(property => \`
                <div class="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-4 sm:p-6">
                    <div class="flex flex-col sm:flex-row justify-between gap-4">
                        <div class="flex-1">
                            <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-2">\${property.name}</h3>
                            <div class="space-y-1 text-xs sm:text-sm text-gray-600">
                                <p><i class="fas fa-map-marker-alt mr-2 text-gray-400"></i>\${property.location || '所在地未登録'}</p>
                                <p><i class="fas fa-yen-sign mr-2 text-gray-400"></i>\${property.price ? property.price.toLocaleString() + '円' : '価格未登録'}</p>
                                <p><i class="fas fa-ruler mr-2 text-gray-400"></i>\${property.total_floor_area ? property.total_floor_area + '㎡' : '面積未登録'}</p>
                                <p><i class="fas fa-calendar mr-2 text-gray-400"></i>登録日: \${new Date(property.created_at).toLocaleDateString('ja-JP')}</p>
                            </div>
                        </div>
                        <div class="flex sm:flex-col gap-2">
                            <a href="/properties/\${property.id}" 
                               class="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation text-center text-sm sm:text-base whitespace-nowrap">
                                <i class="fas fa-eye mr-1"></i>詳細
                            </a>
                            <a href="/properties/\${property.id}/edit" 
                               class="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation text-center text-sm sm:text-base whitespace-nowrap">
                                <i class="fas fa-edit mr-1"></i>編集
                            </a>
                            <a href="/properties/\${property.id}/analyze" 
                               class="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-medium transition-colors touch-manipulation text-center text-sm sm:text-base whitespace-nowrap">
                                <i class="fas fa-chart-line mr-1"></i>分析
                            </a>
                        </div>
                    </div>
                </div>
            \`).join('');
        }

        function searchProperties() {
            const searchName = document.getElementById('searchName').value.toLowerCase();
            const searchLocation = document.getElementById('searchLocation').value.toLowerCase();
            const sortBy = document.getElementById('sortBy').value;

            let filtered = allProperties.filter(property => {
                const nameMatch = !searchName || property.name.toLowerCase().includes(searchName);
                const locationMatch = !searchLocation || (property.location && property.location.toLowerCase().includes(searchLocation));
                return nameMatch && locationMatch;
            });

            // Sort
            filtered.sort((a, b) => {
                switch(sortBy) {
                    case 'created_at_desc':
                        return new Date(b.created_at) - new Date(a.created_at);
                    case 'created_at_asc':
                        return new Date(a.created_at) - new Date(b.created_at);
                    case 'name_asc':
                        return a.name.localeCompare(b.name, 'ja');
                    case 'name_desc':
                        return b.name.localeCompare(a.name, 'ja');
                    default:
                        return 0;
                }
            });

            displayProperties(filtered);
        }
    </script>
  `;
  
  return renderLayout({
    title: '物件一覧',
    user,
    additionalHead
  }, content);
}
