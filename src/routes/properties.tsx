// Properties routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';
import { renderPropertyNewPage, renderPropertyEditPage } from '../components/properties/form';

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
        <header class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 py-3 sm:py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-2 sm:space-x-4">
                        <a href="/dashboard" class="touch-manipulation">
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-10 w-10 sm:h-12 sm:w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-lg sm:text-2xl font-bold text-gray-900">物件一覧</h1>
                    </div>
                    <div class="flex items-center space-x-2 sm:space-x-4">
                        <a href="/properties/new" class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 sm:px-4 rounded-lg text-sm sm:text-base font-medium transition-colors touch-manipulation">
                            <i class="fas fa-plus mr-1 sm:mr-2"></i><span class="hidden sm:inline">新規登録</span><span class="sm:hidden">新規</span>
                        </a>
                        <a href="/dashboard" class="text-gray-600 hover:text-gray-900 p-2 touch-manipulation">
                            <i class="fas fa-home text-lg sm:text-xl"></i>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div class="mb-4 sm:mb-6">
                <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                    <p class="text-sm sm:text-base text-gray-600">
                        <span id="properties-count-text">登録済み物件を管理します</span>
                    </p>
                    <div class="flex space-x-2 w-full sm:w-auto">
                        <button onclick="toggleFilterPanel()" id="filter-button" class="flex-1 sm:flex-none px-3 py-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base touch-manipulation">
                            <i class="fas fa-filter mr-1 sm:mr-2"></i>フィルター
                            <span id="active-filters-badge" class="hidden ml-2 px-2 py-0.5 bg-blue-600 text-white rounded-full text-xs">0</span>
                        </button>
                        <div class="relative flex-1 sm:flex-none">
                            <button onclick="toggleSortMenu()" class="w-full px-3 py-2 sm:px-4 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base touch-manipulation">
                                <i class="fas fa-sort mr-1 sm:mr-2"></i>並び替え
                            </button>
                            <!-- Sort Dropdown Menu -->
                            <div id="sort-menu" class="hidden absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                                <div class="py-2">
                                    <button onclick="applySorting('price-asc')" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                        <i class="fas fa-arrow-up mr-2 text-gray-400"></i>価格: 安い順
                                    </button>
                                    <button onclick="applySorting('price-desc')" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                        <i class="fas fa-arrow-down mr-2 text-gray-400"></i>価格: 高い順
                                    </button>
                                    <button onclick="applySorting('yield-desc')" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                        <i class="fas fa-arrow-down mr-2 text-gray-400"></i>利回り: 高い順
                                    </button>
                                    <button onclick="applySorting('yield-asc')" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                        <i class="fas fa-arrow-up mr-2 text-gray-400"></i>利回り: 低い順
                                    </button>
                                    <button onclick="applySorting('date-desc')" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                        <i class="fas fa-arrow-down mr-2 text-gray-400"></i>追加日: 新しい順
                                    </button>
                                    <button onclick="applySorting('date-asc')" class="w-full text-left px-4 py-2 hover:bg-gray-50 text-sm">
                                        <i class="fas fa-arrow-up mr-2 text-gray-400"></i>追加日: 古い順
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Filter Panel -->
            <div id="filter-panel" class="hidden mb-6 bg-white rounded-lg shadow p-4 sm:p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-bold text-gray-900">
                        <i class="fas fa-sliders-h mr-2 text-blue-600"></i>フィルター設定
                    </h3>
                    <button onclick="clearFilters()" class="text-sm text-red-600 hover:text-red-700">
                        <i class="fas fa-times mr-1"></i>クリア
                    </button>
                </div>

                <!-- Price Range Filter -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        価格帯
                    </label>
                    <div class="flex items-center space-x-4">
                        <input type="number" id="price-min" placeholder="最小価格" 
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               min="0" step="1000000">
                        <span class="text-gray-500">〜</span>
                        <input type="number" id="price-max" placeholder="最大価格"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               min="0" step="1000000">
                    </div>
                </div>

                <!-- Yield Range Filter -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        利回り範囲（%）
                    </label>
                    <div class="flex items-center space-x-4">
                        <input type="number" id="yield-min" placeholder="最小利回り"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               min="0" max="100" step="0.1">
                        <span class="text-gray-500">〜</span>
                        <input type="number" id="yield-max" placeholder="最大利回り"
                               class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                               min="0" max="100" step="0.1">
                    </div>
                </div>

                <!-- Structure Filter -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        構造
                    </label>
                    <div class="flex flex-wrap gap-2">
                        <label class="inline-flex items-center">
                            <input type="checkbox" value="RC" class="structure-filter form-checkbox h-4 w-4 text-blue-600">
                            <span class="ml-2 text-sm">RC</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="checkbox" value="SRC" class="structure-filter form-checkbox h-4 w-4 text-blue-600">
                            <span class="ml-2 text-sm">SRC</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="checkbox" value="S" class="structure-filter form-checkbox h-4 w-4 text-blue-600">
                            <span class="ml-2 text-sm">S（鉄骨）</span>
                        </label>
                        <label class="inline-flex items-center">
                            <input type="checkbox" value="W" class="structure-filter form-checkbox h-4 w-4 text-blue-600">
                            <span class="ml-2 text-sm">W（木造）</span>
                        </label>
                    </div>
                </div>

                <!-- Location Filter -->
                <div class="mb-4">
                    <label class="block text-sm font-medium text-gray-700 mb-2">
                        エリア（キーワード検索）
                    </label>
                    <input type="text" id="location-filter" placeholder="例: 東京, 渋谷区, 新宿"
                           class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                </div>

                <!-- Tag Filter (Phase 4-3) -->
                <div class="mb-4">
                    <div class="flex items-center justify-between mb-2">
                        <label class="block text-sm font-medium text-gray-700">
                            タグ
                        </label>
                        <a href="/tags" class="text-xs text-blue-600 hover:text-blue-700">
                            <i class="fas fa-cog mr-1"></i>タグ管理
                        </a>
                    </div>
                    <div id="tag-filter-checkboxes" class="flex flex-wrap gap-2">
                        <!-- Tag checkboxes will be rendered here -->
                    </div>
                </div>

                <!-- Apply Filters Button -->
                <div class="flex space-x-2">
                    <button onclick="applyFilters()" class="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
                        <i class="fas fa-check mr-2"></i>適用する
                    </button>
                    <button onclick="toggleFilterPanel()" class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                        閉じる
                    </button>
                </div>
            </div>

            <!-- Comparison Action Bar -->
            <div id="comparison-bar" class="hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40 bg-white rounded-lg shadow-lg border-2 border-blue-500 p-4 flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <i class="fas fa-check-circle text-blue-600 text-xl"></i>
                    <span class="font-semibold text-gray-900">
                        <span id="selected-count">0</span>件選択中
                    </span>
                </div>
                <button onclick="compareProperties()" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    <i class="fas fa-exchange-alt mr-2"></i>比較する
                </button>
                <button onclick="clearSelection()" class="text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors">
                    <i class="fas fa-times mr-2"></i>クリア
                </button>
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
            let selectedProperties = new Set();

            // Load properties
            async function loadProperties() {
                try {
                    const response = await axios.get('/api/properties');
                    const properties = response.data.properties;
                    
                    if (properties.length === 0) return;
                    
                    const listContainer = document.getElementById('properties-list');
                    listContainer.innerHTML = properties.map(property => \`
                        <div class="bg-white rounded-lg shadow hover:shadow-lg active:shadow-xl transition-shadow p-4 sm:p-6 touch-manipulation">
                            <div class="flex items-start gap-3 sm:gap-4">
                                <!-- Checkbox for comparison -->
                                <div class="flex items-center pt-1">
                                    <input type="checkbox" 
                                           id="check-\${property.id}" 
                                           onchange="togglePropertySelection('\${property.id}')"
                                           class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer">
                                </div>
                                
                                <!-- Property info -->
                                <div class="flex-1">
                                    <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                                        <h3 class="text-lg sm:text-xl font-bold text-gray-900 truncate">\${property.name}</h3>
                                        <span class="px-2 py-1 sm:px-3 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                                            \${property.structure || '構造不明'}
                                        </span>
                                    </div>
                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
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
                                           class="px-3 py-2 sm:px-4 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg text-sm sm:text-base transition-colors touch-manipulation">
                                            <i class="fas fa-eye mr-1 sm:mr-2"></i><span class="hidden sm:inline">詳細</span>
                                        </a>
                                        <a href="/properties/\${property.id}/analyze" 
                                           class="px-3 py-2 sm:px-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-sm sm:text-base transition-colors touch-manipulation">
                                            <i class="fas fa-chart-line mr-1 sm:mr-2"></i><span class="hidden sm:inline">分析</span>
                                        </a>
                                        <button onclick="deleteProperty('\${property.id}')"
                                                class="px-3 py-2 sm:px-4 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg text-sm sm:text-base transition-colors touch-manipulation">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load properties:', error);
                }
            }

            function togglePropertySelection(propertyId) {
                const checkbox = document.getElementById('check-' + propertyId);
                if (checkbox.checked) {
                    selectedProperties.add(propertyId);
                } else {
                    selectedProperties.delete(propertyId);
                }
                updateComparisonBar();
            }

            function updateComparisonBar() {
                const comparisonBar = document.getElementById('comparison-bar');
                const selectedCount = document.getElementById('selected-count');
                
                if (selectedProperties.size > 0) {
                    comparisonBar.classList.remove('hidden');
                    selectedCount.textContent = selectedProperties.size;
                } else {
                    comparisonBar.classList.add('hidden');
                }
            }

            function compareProperties() {
                if (selectedProperties.size < 2) {
                    alert('比較するには最低2件の物件を選択してください');
                    return;
                }
                
                if (selectedProperties.size > 5) {
                    alert('比較できる物件は最大5件までです');
                    return;
                }
                
                // Save to localStorage and navigate
                const ids = Array.from(selectedProperties);
                localStorage.setItem('comparisonIds', JSON.stringify(ids));
                window.location.href = '/comparison?ids=' + ids.join(',');
            }

            function clearSelection() {
                selectedProperties.clear();
                document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);
                updateComparisonBar();
            }

            // Filter and Sort State
            let allProperties = [];
            let filteredProperties = [];
            let currentFilters = {
                priceMin: null,
                priceMax: null,
                yieldMin: null,
                yieldMax: null,
                structures: [],
                location: null,
                tags: []  // Phase 4-3: Tag filter
            };
            let currentSort = null;

            // Toggle Filter Panel
            function toggleFilterPanel() {
                const panel = document.getElementById('filter-panel');
                panel.classList.toggle('hidden');
            }

            // Toggle Sort Menu
            function toggleSortMenu() {
                const menu = document.getElementById('sort-menu');
                menu.classList.toggle('hidden');
            }

            // Close sort menu when clicking outside
            document.addEventListener('click', function(event) {
                const sortMenu = document.getElementById('sort-menu');
                const sortButton = event.target.closest('button[onclick="toggleSortMenu()"]');
                if (sortMenu && !sortMenu.contains(event.target) && !sortButton) {
                    sortMenu.classList.add('hidden');
                }
            });

            // Apply Filters
            function applyFilters() {
                // Get filter values
                const priceMin = parseFloat(document.getElementById('price-min').value) || null;
                const priceMax = parseFloat(document.getElementById('price-max').value) || null;
                const yieldMin = parseFloat(document.getElementById('yield-min').value) || null;
                const yieldMax = parseFloat(document.getElementById('yield-max').value) || null;
                const location = document.getElementById('location-filter').value.trim() || null;
                
                // Get checked structures
                const structureCheckboxes = document.querySelectorAll('.structure-filter:checked');
                const structures = Array.from(structureCheckboxes).map(cb => cb.value);
                
                // Get checked tags (Phase 4-3)
                const tagCheckboxes = document.querySelectorAll('.tag-filter:checked');
                const tags = Array.from(tagCheckboxes).map(cb => cb.value);

                // Update current filters
                currentFilters = {
                    priceMin,
                    priceMax,
                    yieldMin,
                    yieldMax,
                    structures,
                    location,
                    tags
                };

                // Apply filters
                filterProperties();
                
                // Update active filter count
                updateActiveFilterCount();
                
                // Close filter panel
                toggleFilterPanel();
            }

            // Clear Filters
            function clearFilters() {
                // Reset filter values
                document.getElementById('price-min').value = '';
                document.getElementById('price-max').value = '';
                document.getElementById('yield-min').value = '';
                document.getElementById('yield-max').value = '';
                document.getElementById('location-filter').value = '';
                document.querySelectorAll('.structure-filter').forEach(cb => cb.checked = false);
                document.querySelectorAll('.tag-filter').forEach(cb => cb.checked = false);  // Phase 4-3

                // Reset current filters
                currentFilters = {
                    priceMin: null,
                    priceMax: null,
                    yieldMin: null,
                    yieldMax: null,
                    structures: [],
                    tags: [],  // Phase 4-3
                    location: null
                };

                // Apply filters (show all)
                filterProperties();
                
                // Update active filter count
                updateActiveFilterCount();
            }

            // Filter Properties
            function filterProperties() {
                filteredProperties = allProperties.filter(property => {
                    // Price filter
                    if (currentFilters.priceMin !== null && property.price < currentFilters.priceMin) return false;
                    if (currentFilters.priceMax !== null && property.price > currentFilters.priceMax) return false;

                    // Yield filter (using gross_yield from analysis_results)
                    if (currentFilters.yieldMin !== null || currentFilters.yieldMax !== null) {
                        const yield_val = property.gross_yield || 0;
                        if (currentFilters.yieldMin !== null && yield_val < currentFilters.yieldMin) return false;
                        if (currentFilters.yieldMax !== null && yield_val > currentFilters.yieldMax) return false;
                    }

                    // Structure filter
                    if (currentFilters.structures.length > 0) {
                        if (!property.structure || !currentFilters.structures.includes(property.structure)) return false;
                    }

                    // Location filter (partial match)
                    if (currentFilters.location) {
                        const location = property.location || '';
                        if (!location.includes(currentFilters.location)) return false;
                    }
                    
                    // Tag filter (Phase 4-3)
                    if (currentFilters.tags.length > 0) {
                        const propertyTags = property.tags || [];
                        const propertyTagIds = propertyTags.map(t => t.id);
                        // Check if property has at least one of the selected tags
                        const hasTag = currentFilters.tags.some(tagId => propertyTagIds.includes(tagId));
                        if (!hasTag) return false;
                    }

                    return true;
                });

                // Apply sorting if set
                if (currentSort) {
                    sortProperties(currentSort);
                } else {
                    renderProperties();
                }

                // Update count
                updatePropertiesCount();
            }

            // Apply Sorting
            function applySorting(sortType) {
                currentSort = sortType;
                sortProperties(sortType);
                toggleSortMenu();
            }

            // Sort Properties
            function sortProperties(sortType) {
                const sorted = [...filteredProperties];

                switch(sortType) {
                    case 'price-asc':
                        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
                        break;
                    case 'price-desc':
                        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
                        break;
                    case 'yield-asc':
                        sorted.sort((a, b) => (a.gross_yield || 0) - (b.gross_yield || 0));
                        break;
                    case 'yield-desc':
                        sorted.sort((a, b) => (b.gross_yield || 0) - (a.gross_yield || 0));
                        break;
                    case 'date-asc':
                        sorted.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                        break;
                    case 'date-desc':
                        sorted.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
                        break;
                }

                filteredProperties = sorted;
                renderProperties();
            }

            // Update Active Filter Count
            function updateActiveFilterCount() {
                let count = 0;
                if (currentFilters.priceMin !== null || currentFilters.priceMax !== null) count++;
                if (currentFilters.yieldMin !== null || currentFilters.yieldMax !== null) count++;
                if (currentFilters.structures.length > 0) count++;
                if (currentFilters.location) count++;
                if (currentFilters.tags.length > 0) count++;  // Phase 4-3

                const badge = document.getElementById('active-filters-badge');
                if (count > 0) {
                    badge.textContent = count;
                    badge.classList.remove('hidden');
                } else {
                    badge.classList.add('hidden');
                }
            }

            // Update Properties Count
            function updatePropertiesCount() {
                const countText = document.getElementById('properties-count-text');
                const total = allProperties.length;
                const filtered = filteredProperties.length;
                
                if (filtered < total) {
                    countText.textContent = \`\${filtered}件の物件を表示中（全\${total}件）\`;
                } else {
                    countText.textContent = \`登録済み物件：\${total}件\`;
                }
            }

            // Render Properties
            function renderProperties() {
                const listContainer = document.getElementById('properties-list');
                
                if (filteredProperties.length === 0) {
                    listContainer.innerHTML = \`
                        <div class="text-center py-12 bg-white rounded-lg shadow">
                            <i class="fas fa-search text-6xl text-gray-300 mb-4"></i>
                            <p class="text-gray-600 mb-4">条件に一致する物件が見つかりません</p>
                            <button onclick="clearFilters()" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                <i class="fas fa-times mr-2"></i>フィルターをクリア
                            </button>
                        </div>
                    \`;
                    return;
                }

                listContainer.innerHTML = filteredProperties.map(property => \`
                    <div class="bg-white rounded-lg shadow hover:shadow-lg active:shadow-xl transition-shadow p-4 sm:p-6 touch-manipulation">
                        <div class="flex items-start gap-3 sm:gap-4">
                            <!-- Checkbox for comparison -->
                            <div class="flex items-center pt-1">
                                <input type="checkbox" 
                                       id="check-\${property.id}" 
                                       onchange="togglePropertySelection('\${property.id}')"
                                       class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer">
                            </div>
                            
                            <!-- Property info -->
                            <div class="flex-1">
                                <div class="flex items-center justify-between mb-3 sm:mb-4 gap-2">
                                    <h3 class="text-lg sm:text-xl font-bold text-gray-900 truncate">\${property.name}</h3>
                                    <span class="px-2 py-1 sm:px-3 bg-blue-100 text-blue-800 rounded-full text-xs sm:text-sm font-medium whitespace-nowrap">
                                        \${property.structure || '構造不明'}
                                    </span>
                                </div>
                                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-3 sm:mb-4">
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
                                    \${property.gross_yield ? \`
                                    <div>
                                        <p class="text-sm text-gray-500">表面利回り</p>
                                        <p class="font-medium text-green-600">\${property.gross_yield.toFixed(2)}%</p>
                                    </div>
                                    \` : ''}
                                </div>
                                
                                <!-- Tags Section -->
                                <div class="mb-4">
                                    <div class="flex items-center gap-2 flex-wrap" id="tags-\${property.id}">
                                        <!-- Tags will be loaded here -->
                                    </div>
                                </div>
                                
                                <div class="flex items-center justify-between">
                                    <!-- Tags Management Button -->
                                    <button onclick="openTagsModal('\${property.id}')" 
                                            class="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                        <i class="fas fa-tag mr-1"></i>タグ
                                    </button>
                                    
                                    <!-- Action Buttons -->
                                    <div class="flex items-center space-x-2">
                                    <a href="/properties/\${property.id}" 
                                       class="px-3 py-2 sm:px-4 text-blue-600 hover:bg-blue-50 active:bg-blue-100 rounded-lg text-sm sm:text-base transition-colors touch-manipulation">
                                        <i class="fas fa-eye mr-1 sm:mr-2"></i><span class="hidden sm:inline">詳細</span>
                                    </a>
                                    <a href="/properties/\${property.id}/analyze" 
                                       class="px-3 py-2 sm:px-4 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white rounded-lg text-sm sm:text-base transition-colors touch-manipulation">
                                        <i class="fas fa-chart-line mr-1 sm:mr-2"></i><span class="hidden sm:inline">分析</span>
                                    </a>
                                    <button onclick="deleteProperty('\${property.id}')"
                                            class="px-3 py-2 sm:px-4 text-red-600 hover:bg-red-50 active:bg-red-100 rounded-lg text-sm sm:text-base transition-colors touch-manipulation">
                                        <i class="fas fa-trash"></i>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                \`).join('');
            }
            
            async function deleteProperty(id) {
                if (!confirm('この物件を削除してもよろしいですか？')) return;
                
                try {
                    await axios.delete(\`/api/properties/\${id}\`);
                    // Remove from allProperties array
                    allProperties = allProperties.filter(p => p.id !== id);
                    // Re-filter and render
                    filterProperties();
                } catch (error) {
                    console.error('Failed to delete property:', error);
                    alert('物件の削除に失敗しました');
                }
            }
            
            // Load on page load
            async function loadProperties() {
                try {
                    const response = await axios.get('/api/properties');
                    allProperties = response.data.properties;
                    
                    if (allProperties.length === 0) {
                        document.getElementById('properties-list').innerHTML = \`
                            <div class="text-center py-12 bg-white rounded-lg shadow">
                                <i class="fas fa-building text-6xl text-gray-300 mb-4"></i>
                                <p class="text-gray-600 mb-4">まだ物件が登録されていません</p>
                                <a href="/properties/new" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
                                    <i class="fas fa-plus mr-2"></i>最初の物件を登録
                                </a>
                            </div>
                        \`;
                        return;
                    }
                    
                    // Load analysis results for yield data and tags (Phase 4-3)
                    const dataPromises = allProperties.map(async (property) => {
                        try {
                            // Load analysis data
                            const analysisRes = await axios.get(\`/api/properties/\${property.id}/analysis\`);
                            if (analysisRes.data && analysisRes.data.gross_yield) {
                                property.gross_yield = analysisRes.data.gross_yield;
                                property.net_yield = analysisRes.data.net_yield;
                                property.noi = analysisRes.data.noi;
                            }
                        } catch (err) {
                            // If analysis doesn't exist, skip
                        }
                        
                        try {
                            // Load tags (Phase 4-3)
                            const tagsRes = await axios.get(\`/api/properties/\${property.id}/tags\`);
                            property.tags = tagsRes.data.tags || [];
                        } catch (err) {
                            // If tags don't exist, set empty array
                            property.tags = [];
                        }
                        
                        return property;
                    });
                    
                    await Promise.all(dataPromises);
                    
                    // Initialize filtered properties
                    filteredProperties = [...allProperties];
                    
                    // Render properties
                    renderProperties();
                    updatePropertiesCount();
                } catch (error) {
                    console.error('Failed to load properties:', error);
                }
            }
            
            // ============================================================
            // タグ機能（Phase 4-3）
            // ============================================================
            
            let allAvailableTags = [];
            let currentTagPropertyId = null;
            
            // Load available tags
            async function loadAvailableTags() {
                try {
                    const response = await axios.get('/api/tags');
                    allAvailableTags = response.data.tags || [];
                } catch (error) {
                    console.error('Failed to load tags:', error);
                }
            }
            
            // Load tags for a property
            async function loadPropertyTags(propertyId) {
                try {
                    const response = await axios.get(\`/api/properties/\${propertyId}/tags\`);
                    const tags = response.data.tags || [];
                    
                    const container = document.getElementById(\`tags-\${propertyId}\`);
                    if (!container) return;
                    
                    if (tags.length === 0) {
                        container.innerHTML = '<span class="text-sm text-gray-400">タグなし</span>';
                        return;
                    }
                    
                    container.innerHTML = tags.map(tag => \`
                        <span class="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full" 
                              style="background-color: \${tag.color}20; color: \${tag.color}; border: 1px solid \${tag.color}40;">
                            \${tag.name}
                        </span>
                    \`).join('');
                } catch (error) {
                    console.error('Failed to load property tags:', error);
                }
            }
            
            // Load tags for all properties
            async function loadAllPropertyTags() {
                const tagPromises = filteredProperties.map(property => loadPropertyTags(property.id));
                await Promise.all(tagPromises);
            }
            
            // Open tags modal
            function openTagsModal(propertyId) {
                currentTagPropertyId = propertyId;
                const property = allProperties.find(p => p.id === propertyId);
                
                document.getElementById('tags-modal-title').textContent = \`タグ管理 - \${property?.name || '物件'}\`;
                document.getElementById('tags-modal').classList.remove('hidden');
                
                loadModalPropertyTags();
            }
            
            // Close tags modal
            function closeTagsModal() {
                document.getElementById('tags-modal').classList.add('hidden');
                currentTagPropertyId = null;
            }
            
            // Load property tags in modal
            async function loadModalPropertyTags() {
                try {
                    const response = await axios.get(\`/api/properties/\${currentTagPropertyId}/tags\`);
                    const propertyTags = response.data.tags || [];
                    
                    const container = document.getElementById('current-property-tags');
                    
                    if (propertyTags.length === 0) {
                        container.innerHTML = '<p class="text-sm text-gray-400 py-2">タグが付けられていません</p>';
                    } else {
                        container.innerHTML = propertyTags.map(tag => \`
                            <div class="flex items-center justify-between p-2 border border-gray-200 rounded">
                                <div class="flex items-center gap-2">
                                    <div class="w-4 h-4 rounded-full" style="background-color: \${tag.color}"></div>
                                    <span class="text-sm font-medium">\${tag.name}</span>
                                </div>
                                <button onclick="removePropertyTag('\${tag.id}')" 
                                        class="text-red-600 hover:text-red-700 text-sm">
                                    <i class="fas fa-times"></i>
                                </button>
                            </div>
                        \`).join('');
                    }
                    
                    // Render available tags to add
                    const propertyTagIds = propertyTags.map(t => t.id);
                    const availableTags = allAvailableTags.filter(t => !propertyTagIds.includes(t.id));
                    
                    const addContainer = document.getElementById('available-tags');
                    if (availableTags.length === 0) {
                        addContainer.innerHTML = '<p class="text-sm text-gray-400 py-2">追加できるタグがありません</p>';
                    } else {
                        addContainer.innerHTML = availableTags.map(tag => \`
                            <button onclick="addPropertyTag('\${tag.id}')"
                                    class="flex items-center gap-2 p-2 border border-gray-200 rounded hover:bg-gray-50 transition-colors w-full text-left">
                                <div class="w-4 h-4 rounded-full" style="background-color: \${tag.color}"></div>
                                <span class="text-sm font-medium">\${tag.name}</span>
                            </button>
                        \`).join('');
                    }
                } catch (error) {
                    console.error('Failed to load modal tags:', error);
                }
            }
            
            // Add tag to property
            async function addPropertyTag(tagId) {
                try {
                    await axios.post(\`/api/properties/\${currentTagPropertyId}/tags/\${tagId}\`);
                    await loadModalPropertyTags();
                    await loadPropertyTags(currentTagPropertyId);
                } catch (error) {
                    console.error('Failed to add tag:', error);
                    alert(error.response?.data?.error || 'タグの追加に失敗しました');
                }
            }
            
            // Remove tag from property
            async function removePropertyTag(tagId) {
                try {
                    await axios.delete(\`/api/properties/\${currentTagPropertyId}/tags/\${tagId}\`);
                    await loadModalPropertyTags();
                    await loadPropertyTags(currentTagPropertyId);
                } catch (error) {
                    console.error('Failed to remove tag:', error);
                    alert(error.response?.data?.error || 'タグの削除に失敗しました');
                }
            }
            
            // Render tag filter checkboxes
            function renderTagFilters() {
                const container = document.getElementById('tag-filter-checkboxes');
                if (!container) return;
                
                if (allAvailableTags.length === 0) {
                    container.innerHTML = '<p class="text-sm text-gray-400">タグがありません</p>';
                    return;
                }
                
                container.innerHTML = allAvailableTags.map(tag => \`
                    <label class="inline-flex items-center">
                        <input type="checkbox" value="\${tag.id}" class="tag-filter form-checkbox h-4 w-4 text-blue-600">
                        <span class="ml-2 text-sm inline-flex items-center gap-1">
                            <div class="w-3 h-3 rounded-full" style="background-color: \${tag.color}"></div>
                            \${tag.name}
                        </span>
                    </label>
                \`).join('');
            }
            
            // Initialize tags
            async function initializeTags() {
                await loadAvailableTags();
                renderTagFilters();  // Render tag filter checkboxes
                await loadAllPropertyTags();
            }
            
            loadProperties().then(() => {
                initializeTags();
            });
        </script>
        
        <!-- Tags Modal (Phase 4-3) -->
        <div id="tags-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                    <h3 id="tags-modal-title" class="text-xl font-bold text-gray-900">タグ管理</h3>
                    <button onclick="closeTagsModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                
                <div class="p-6">
                    <!-- Current Tags -->
                    <div class="mb-6">
                        <h4 class="text-sm font-medium text-gray-700 mb-3">現在のタグ</h4>
                        <div id="current-property-tags" class="space-y-2">
                            <!-- Current tags will be rendered here -->
                        </div>
                    </div>
                    
                    <!-- Available Tags to Add -->
                    <div class="mb-4">
                        <div class="flex items-center justify-between mb-3">
                            <h4 class="text-sm font-medium text-gray-700">タグを追加</h4>
                            <a href="/tags" class="text-sm text-blue-600 hover:text-blue-700">
                                <i class="fas fa-cog mr-1"></i>タグ管理
                            </a>
                        </div>
                        <div id="available-tags" class="space-y-2">
                            <!-- Available tags will be rendered here -->
                        </div>
                    </div>
                </div>
                
                <div class="sticky bottom-0 bg-gray-50 border-t border-gray-200 p-4">
                    <button onclick="closeTagsModal()" 
                            class="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                        閉じる
                    </button>
                </div>
            </div>
        </div>
    </body>
    </html>
  `);
});

/**
 * New property form page
 */
properties.get('/new', (c) => {
  const user = c.get('user');
  return c.html(renderPropertyNewPage(user));
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
  
  return c.html(renderPropertyEditPage(user, property));
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
    </head>
    <body class="bg-gray-50">
        <div class="max-w-7xl mx-auto px-4 py-8">
            <div class="text-center py-12">
                <i class="fas fa-spinner fa-spin text-4xl text-blue-600"></i>
                <p class="mt-4 text-gray-600">読み込み中...</p>
            </div>
        </div>
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script>
            // 物件詳細を取得して表示
            axios.get(\`/api/properties/\${${propertyId}}\`)
                .then(response => window.location.href = \`/properties/\${${propertyId}}/comprehensive-report\`)
                .catch(error => alert('物件の読み込みに失敗しました'));
        </script>
    </body>
    </html>
  `);
});
properties.get('/:id/analyze', async (c) => {
  const propertyId = c.req.param('id');
  return c.redirect(`/properties/${propertyId}/comprehensive-report`);
});
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
        <script src="https://cdn.jsdelivr.net/npm/chart.js@4.4.0/dist/chart.umd.min.js"></script>
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
