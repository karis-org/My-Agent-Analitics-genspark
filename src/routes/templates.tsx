import { Hono } from 'hono'
import type { Bindings, Variables } from '../types'
import { authMiddleware } from '../middleware/auth'

const templates = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Apply authentication middleware
templates.use('/*', authMiddleware)

// Template management page
templates.get('/', async (c) => {
  const { var: { user } } = c
  
  if (!user) {
    return c.redirect('/auth/login')
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>レポートテンプレート管理 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/dashboard" class="text-blue-600 hover:text-blue-700 flex items-center">
                            <i class="fas fa-arrow-left mr-2"></i>
                            ダッシュボードに戻る
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-700">${user.email}</span>
                        <a href="/auth/logout" class="text-red-600 hover:text-red-700">
                            <i class="fas fa-sign-out-alt mr-1"></i>
                            ログアウト
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <header class="bg-white shadow-sm border-b border-gray-200 mb-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex items-center justify-between">
                    <div>
                        <h1 class="text-3xl font-bold text-gray-900">
                            <i class="fas fa-file-alt text-blue-600 mr-2"></i>
                            レポートテンプレート管理
                        </h1>
                        <p class="text-gray-600 mt-2">カスタムレポートテンプレートの作成・編集・管理</p>
                    </div>
                    <button id="create-template-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                        <i class="fas fa-plus mr-2"></i>
                        新規テンプレート作成
                    </button>
                </div>
            </div>
        </header>

        <!-- メインコンテンツ -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <!-- フィルター -->
            <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
                <div class="flex items-center space-x-4">
                    <label class="text-sm font-medium text-gray-700">カテゴリー:</label>
                    <select id="category-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">すべて</option>
                        <option value="property_analysis">物件分析</option>
                        <option value="market_analysis">市場分析</option>
                        <option value="investment_simulation">投資シミュレーション</option>
                        <option value="area_analysis">エリア分析</option>
                        <option value="custom">カスタム</option>
                    </select>
                    
                    <label class="text-sm font-medium text-gray-700 ml-6">表示:</label>
                    <select id="view-filter" class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="my">マイテンプレート</option>
                        <option value="public">公開テンプレート</option>
                        <option value="all">すべて</option>
                    </select>
                </div>
            </div>

            <!-- テンプレートリスト -->
            <div id="templates-container" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <!-- Loading state -->
                <div class="col-span-full text-center py-12">
                    <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p class="text-gray-600">テンプレートを読み込んでいます...</p>
                </div>
            </div>
        </main>

        <!-- 新規テンプレート作成モーダル -->
        <div id="create-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div class="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-6">
                        <h2 class="text-2xl font-bold text-gray-900">新規テンプレート作成</h2>
                        <button id="close-create-modal" class="text-gray-400 hover:text-gray-600">
                            <i class="fas fa-times text-2xl"></i>
                        </button>
                    </div>
                    
                    <form id="create-template-form" class="space-y-4">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                テンプレート名 <span class="text-red-500">*</span>
                            </label>
                            <input 
                                type="text" 
                                id="template-name"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                placeholder="例: 標準物件分析レポート"
                                required
                            />
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                説明
                            </label>
                            <textarea 
                                id="template-description"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                rows="3"
                                placeholder="テンプレートの説明を入力してください"
                            ></textarea>
                        </div>
                        
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                カテゴリー <span class="text-red-500">*</span>
                            </label>
                            <select 
                                id="template-category"
                                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                required
                            >
                                <option value="">選択してください</option>
                                <option value="property_analysis">物件分析</option>
                                <option value="market_analysis">市場分析</option>
                                <option value="investment_simulation">投資シミュレーション</option>
                                <option value="area_analysis">エリア分析</option>
                                <option value="custom">カスタム</option>
                            </select>
                        </div>
                        
                        <div class="flex items-center space-x-6">
                            <label class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="template-is-default"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span class="text-sm text-gray-700">デフォルトテンプレートに設定</span>
                            </label>
                            
                            <label class="flex items-center">
                                <input 
                                    type="checkbox" 
                                    id="template-is-public"
                                    class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span class="text-sm text-gray-700">公開する</span>
                            </label>
                        </div>
                        
                        <div class="flex space-x-4 pt-4">
                            <button 
                                type="submit"
                                class="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                            >
                                <i class="fas fa-check mr-2"></i>
                                作成
                            </button>
                            <button 
                                type="button"
                                id="cancel-create"
                                class="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                            >
                                <i class="fas fa-times mr-2"></i>
                                キャンセル
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script>
            let templates = [];
            let currentFilter = { category: '', view: 'my' };

            // Load templates
            async function loadTemplates() {
                try {
                    const params = new URLSearchParams();
                    if (currentFilter.category) {
                        params.append('category', currentFilter.category);
                    }

                    let endpoint = '/api/templates';
                    if (currentFilter.view === 'public') {
                        endpoint = '/api/templates/public';
                    }

                    const response = await axios.get(endpoint + '?' + params.toString());
                    templates = response.data.templates;
                    renderTemplates();
                } catch (error) {
                    console.error('Failed to load templates:', error);
                    document.getElementById('templates-container').innerHTML = \`
                        <div class="col-span-full text-center py-12">
                            <i class="fas fa-exclamation-circle text-5xl text-red-500 mb-4"></i>
                            <p class="text-gray-600">テンプレートの読み込みに失敗しました</p>
                        </div>
                    \`;
                }
            }

            // Render templates
            function renderTemplates() {
                const container = document.getElementById('templates-container');

                if (templates.length === 0) {
                    container.innerHTML = \`
                        <div class="col-span-full text-center py-12">
                            <i class="fas fa-inbox text-5xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600">テンプレートがありません</p>
                            <button onclick="showCreateModal()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-plus mr-2"></i>
                                新規作成
                            </button>
                        </div>
                    \`;
                    return;
                }

                container.innerHTML = templates.map(template => \`
                    <div class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-6">
                        <div class="flex items-start justify-between mb-4">
                            <div class="flex-1">
                                <h3 class="text-lg font-bold text-gray-900 mb-1">\${template.name}</h3>
                                <p class="text-sm text-gray-600 line-clamp-2">\${template.description || 'No description'}</p>
                            </div>
                            \${template.isDefault ? '<span class="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">Default</span>' : ''}
                            \${template.isPublic ? '<span class="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded">Public</span>' : ''}
                        </div>
                        
                        <div class="flex items-center text-sm text-gray-500 mb-4">
                            <i class="fas fa-folder mr-2"></i>
                            <span>\${getCategoryLabel(template.category)}</span>
                        </div>
                        
                        <div class="flex space-x-2">
                            <a href="/templates/\${template.id}/edit" class="flex-1 bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors text-center text-sm font-medium">
                                <i class="fas fa-edit mr-1"></i>
                                編集
                            </a>
                            <button onclick="duplicateTemplate('\${template.id}')" class="flex-1 bg-gray-50 text-gray-700 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm font-medium">
                                <i class="fas fa-copy mr-1"></i>
                                複製
                            </button>
                            <button onclick="deleteTemplate('\${template.id}')" class="px-4 bg-red-50 text-red-600 py-2 rounded-lg hover:bg-red-100 transition-colors">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </div>
                \`).join('');
            }

            // Get category label
            function getCategoryLabel(category) {
                const labels = {
                    property_analysis: '物件分析',
                    market_analysis: '市場分析',
                    investment_simulation: '投資シミュレーション',
                    area_analysis: 'エリア分析',
                    custom: 'カスタム'
                };
                return labels[category] || category;
            }

            // Show create modal
            function showCreateModal() {
                document.getElementById('create-modal').classList.remove('hidden');
            }

            // Hide create modal
            function hideCreateModal() {
                document.getElementById('create-modal').classList.add('hidden');
                document.getElementById('create-template-form').reset();
            }

            // Create template
            document.getElementById('create-template-form').addEventListener('submit', async (e) => {
                e.preventDefault();

                const name = document.getElementById('template-name').value;
                const description = document.getElementById('template-description').value;
                const category = document.getElementById('template-category').value;
                const isDefault = document.getElementById('template-is-default').checked;
                const isPublic = document.getElementById('template-is-public').checked;

                try {
                    const response = await axios.post('/api/templates', {
                        name,
                        description,
                        category,
                        isDefault,
                        isPublic
                    });

                    hideCreateModal();
                    
                    // Redirect to edit page
                    window.location.href = '/templates/' + response.data.template.id + '/edit';
                } catch (error) {
                    console.error('Failed to create template:', error);
                    alert('テンプレートの作成に失敗しました');
                }
            });

            // Duplicate template
            async function duplicateTemplate(templateId) {
                const name = prompt('複製したテンプレートの名前を入力してください:');
                if (!name) return;

                try {
                    const response = await axios.post(\`/api/templates/\${templateId}/duplicate\`, { name });
                    alert('テンプレートを複製しました');
                    loadTemplates();
                } catch (error) {
                    console.error('Failed to duplicate template:', error);
                    alert('テンプレートの複製に失敗しました');
                }
            }

            // Delete template
            async function deleteTemplate(templateId) {
                if (!confirm('このテンプレートを削除してもよろしいですか?')) return;

                try {
                    await axios.delete(\`/api/templates/\${templateId}\`);
                    alert('テンプレートを削除しました');
                    loadTemplates();
                } catch (error) {
                    console.error('Failed to delete template:', error);
                    alert('テンプレートの削除に失敗しました');
                }
            }

            // Event listeners
            document.getElementById('create-template-btn').addEventListener('click', showCreateModal);
            document.getElementById('close-create-modal').addEventListener('click', hideCreateModal);
            document.getElementById('cancel-create').addEventListener('click', hideCreateModal);

            document.getElementById('category-filter').addEventListener('change', (e) => {
                currentFilter.category = e.target.value;
                loadTemplates();
            });

            document.getElementById('view-filter').addEventListener('change', (e) => {
                currentFilter.view = e.target.value;
                loadTemplates();
            });

            // Initial load
            loadTemplates();
        </script>
    </body>
    </html>
  `)
})

// Template editor page
templates.get('/:id/edit', async (c) => {
  const { var: { user }, env } = c
  const templateId = c.req.param('id')
  
  if (!user) {
    return c.redirect('/auth/login')
  }

  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>テンプレート編集 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-50">
        <!-- ナビゲーション -->
        <nav class="bg-white shadow-sm border-b border-gray-200">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <div class="flex items-center">
                        <a href="/templates" class="text-blue-600 hover:text-blue-700 flex items-center">
                            <i class="fas fa-arrow-left mr-2"></i>
                            テンプレート一覧に戻る
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-700">${user.email}</span>
                        <a href="/auth/logout" class="text-red-600 hover:text-red-700">
                            <i class="fas fa-sign-out-alt mr-1"></i>
                            ログアウト
                        </a>
                    </div>
                </div>
            </div>
        </nav>

        <!-- ヘッダー -->
        <header class="bg-white shadow-sm border-b border-gray-200 mb-6">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div class="flex items-center justify-between">
                    <div id="header-info">
                        <h1 class="text-3xl font-bold text-gray-900">
                            <i class="fas fa-edit text-blue-600 mr-2"></i>
                            テンプレート編集
                        </h1>
                    </div>
                    <div class="flex space-x-2">
                        <button id="save-template-btn" class="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors">
                            <i class="fas fa-save mr-2"></i>
                            保存
                        </button>
                        <button id="add-section-btn" class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors">
                            <i class="fas fa-plus mr-2"></i>
                            セクション追加
                        </button>
                    </div>
                </div>
            </div>
        </header>

        <!-- メインコンテンツ -->
        <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <!-- 左側: テンプレート設定 -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow-sm p-6 sticky top-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">テンプレート設定</h2>
                        
                        <form id="template-info-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">テンプレート名</label>
                                <input 
                                    type="text" 
                                    id="edit-template-name"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">説明</label>
                                <textarea 
                                    id="edit-template-description"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    rows="3"
                                ></textarea>
                            </div>
                            
                            <div>
                                <label class="block text-sm font-medium text-gray-700 mb-2">カテゴリー</label>
                                <select 
                                    id="edit-template-category"
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="property_analysis">物件分析</option>
                                    <option value="market_analysis">市場分析</option>
                                    <option value="investment_simulation">投資シミュレーション</option>
                                    <option value="area_analysis">エリア分析</option>
                                    <option value="custom">カスタム</option>
                                </select>
                            </div>
                            
                            <div class="space-y-2">
                                <label class="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="edit-template-is-default"
                                        class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span class="text-sm text-gray-700">デフォルトテンプレート</span>
                                </label>
                                
                                <label class="flex items-center">
                                    <input 
                                        type="checkbox" 
                                        id="edit-template-is-public"
                                        class="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <span class="text-sm text-gray-700">公開する</span>
                                </label>
                            </div>
                        </form>
                    </div>
                </div>

                <!-- 右側: セクション編集 -->
                <div class="lg:col-span-2">
                    <div class="bg-white rounded-lg shadow-sm p-6">
                        <h2 class="text-xl font-bold text-gray-900 mb-4">セクション</h2>
                        
                        <div id="sections-container" class="space-y-4">
                            <div class="text-center py-12">
                                <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                                <p class="text-gray-600">セクションを読み込んでいます...</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
            const templateId = '${templateId}';
            let template = null;
            let sections = [];

            // Load template
            async function loadTemplate() {
                try {
                    const response = await axios.get(\`/api/templates/\${templateId}\`);
                    template = response.data.template;
                    sections = template.sections || [];
                    
                    // Update form
                    document.getElementById('edit-template-name').value = template.name;
                    document.getElementById('edit-template-description').value = template.description || '';
                    document.getElementById('edit-template-category').value = template.category;
                    document.getElementById('edit-template-is-default').checked = template.isDefault;
                    document.getElementById('edit-template-is-public').checked = template.isPublic;
                    
                    renderSections();
                } catch (error) {
                    console.error('Failed to load template:', error);
                    alert('テンプレートの読み込みに失敗しました');
                }
            }

            // Render sections
            function renderSections() {
                const container = document.getElementById('sections-container');
                
                if (sections.length === 0) {
                    container.innerHTML = \`
                        <div class="text-center py-12">
                            <i class="fas fa-inbox text-5xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600">セクションがありません</p>
                            <button onclick="addSection()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700">
                                <i class="fas fa-plus mr-2"></i>
                                セクション追加
                            </button>
                        </div>
                    \`;
                    return;
                }
                
                container.innerHTML = sections.map((section, index) => \`
                    <div class="border border-gray-200 rounded-lg p-4">
                        <div class="flex items-start justify-between mb-3">
                            <div class="flex-1">
                                <input 
                                    type="text" 
                                    value="\${section.title}"
                                    onchange="updateSectionTitle('\${section.id}', this.value)"
                                    class="text-lg font-bold text-gray-900 border-b border-transparent hover:border-gray-300 focus:border-blue-500 outline-none w-full"
                                />
                                <span class="text-sm text-gray-500">\${getContentTypeLabel(section.contentType)}</span>
                            </div>
                            <div class="flex items-center space-x-2">
                                <button onclick="moveSection(\${index}, -1)" class="p-2 text-gray-400 hover:text-gray-600" \${index === 0 ? 'disabled' : ''}>
                                    <i class="fas fa-arrow-up"></i>
                                </button>
                                <button onclick="moveSection(\${index}, 1)" class="p-2 text-gray-400 hover:text-gray-600" \${index === sections.length - 1 ? 'disabled' : ''}>
                                    <i class="fas fa-arrow-down"></i>
                                </button>
                                <button onclick="deleteSection('\${section.id}')" class="p-2 text-red-400 hover:text-red-600">
                                    <i class="fas fa-trash"></i>
                                </button>
                            </div>
                        </div>
                        
                        <textarea 
                            onchange="updateSectionContent('\${section.id}', this.value)"
                            class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            rows="4"
                            placeholder="セクションの内容を入力..."
                        >\${section.content}</textarea>
                    </div>
                \`).join('');
            }

            // Get content type label
            function getContentTypeLabel(type) {
                const labels = {
                    text: 'テキスト',
                    table: 'テーブル',
                    chart: 'チャート',
                    image: '画像',
                    calculation: '計算'
                };
                return labels[type] || type;
            }

            // Add section
            async function addSection() {
                try {
                    const response = await axios.post(\`/api/templates/\${templateId}/sections\`, {
                        title: '新しいセクション',
                        contentType: 'text',
                        content: '',
                        displayOrder: sections.length,
                        isVisible: true
                    });
                    
                    sections.push(response.data.section);
                    renderSections();
                } catch (error) {
                    console.error('Failed to add section:', error);
                    alert('セクションの追加に失敗しました');
                }
            }

            // Update section title
            async function updateSectionTitle(sectionId, title) {
                try {
                    await axios.put(\`/api/sections/\${sectionId}\`, { title });
                    const section = sections.find(s => s.id === sectionId);
                    if (section) section.title = title;
                } catch (error) {
                    console.error('Failed to update section:', error);
                }
            }

            // Update section content
            async function updateSectionContent(sectionId, content) {
                try {
                    await axios.put(\`/api/sections/\${sectionId}\`, { content });
                    const section = sections.find(s => s.id === sectionId);
                    if (section) section.content = content;
                } catch (error) {
                    console.error('Failed to update section:', error);
                }
            }

            // Move section
            async function moveSection(index, direction) {
                const newIndex = index + direction;
                if (newIndex < 0 || newIndex >= sections.length) return;

                [sections[index], sections[newIndex]] = [sections[newIndex], sections[index]];

                // Update display orders
                for (let i = 0; i < sections.length; i++) {
                    try {
                        await axios.put(\`/api/sections/\${sections[i].id}\`, { displayOrder: i });
                        sections[i].displayOrder = i;
                    } catch (error) {
                        console.error('Failed to update section order:', error);
                    }
                }

                renderSections();
            }

            // Delete section
            async function deleteSection(sectionId) {
                if (!confirm('このセクションを削除してもよろしいですか?')) return;

                try {
                    await axios.delete(\`/api/sections/\${sectionId}\`);
                    sections = sections.filter(s => s.id !== sectionId);
                    renderSections();
                } catch (error) {
                    console.error('Failed to delete section:', error);
                    alert('セクションの削除に失敗しました');
                }
            }

            // Save template
            async function saveTemplate() {
                try {
                    const name = document.getElementById('edit-template-name').value;
                    const description = document.getElementById('edit-template-description').value;
                    const category = document.getElementById('edit-template-category').value;
                    const isDefault = document.getElementById('edit-template-is-default').checked;
                    const isPublic = document.getElementById('edit-template-is-public').checked;

                    await axios.put(\`/api/templates/\${templateId}\`, {
                        name,
                        description,
                        category,
                        isDefault,
                        isPublic
                    });

                    alert('テンプレートを保存しました');
                } catch (error) {
                    console.error('Failed to save template:', error);
                    alert('テンプレートの保存に失敗しました');
                }
            }

            // Event listeners
            document.getElementById('save-template-btn').addEventListener('click', saveTemplate);
            document.getElementById('add-section-btn').addEventListener('click', addSection);

            // Initial load
            loadTemplate();
        </script>
    </body>
    </html>
  `)
})

export default templates
