import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';

const tags = new Hono();

/**
 * Tags management page
 * GET /tags
 */
tags.get('/', authMiddleware, (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>タグ管理 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="/static/styles.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    </head>
    <body class="bg-gray-100">
        <!-- Header -->
        <header class="bg-white shadow">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <a href="/" class="flex items-center space-x-3 hover:opacity-80 transition-opacity">
                            <img src="/static/logo-horizontal-200.png" alt="My Agent Analytics" class="h-8">
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">タグ管理</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <span class="text-gray-600 hidden sm:inline">${user.name}</span>
                        <a href="/dashboard" class="text-blue-600 hover:text-blue-700">
                            <i class="fas fa-home mr-2"></i>ダッシュボード
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Create Tag Section -->
            <div class="bg-white rounded-lg shadow p-6 mb-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-plus-circle text-blue-600 mr-2"></i>
                    新しいタグを作成
                </h2>
                <form id="create-tag-form" class="flex flex-col sm:flex-row gap-4">
                    <div class="flex-1">
                        <label class="block text-sm font-medium text-gray-700 mb-1">タグ名</label>
                        <input type="text" 
                               id="tag-name" 
                               placeholder="例: 要検討、お気に入り" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               required>
                    </div>
                    <div class="w-full sm:w-48">
                        <label class="block text-sm font-medium text-gray-700 mb-1">色</label>
                        <div class="flex items-center gap-2">
                            <input type="color" 
                                   id="tag-color" 
                                   value="#3B82F6" 
                                   class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                            <div class="flex-1">
                                <select id="color-preset" 
                                        onchange="applyColorPreset()" 
                                        class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                    <option value="">カスタム</option>
                                    <option value="#3B82F6">青</option>
                                    <option value="#10B981">緑</option>
                                    <option value="#F59E0B">オレンジ</option>
                                    <option value="#EF4444">赤</option>
                                    <option value="#8B5CF6">紫</option>
                                    <option value="#EC4899">ピンク</option>
                                    <option value="#F59E0B">黄</option>
                                    <option value="#6B7280">グレー</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div class="flex items-end">
                        <button type="submit" 
                                class="w-full sm:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-plus mr-2"></i>作成
                        </button>
                    </div>
                </form>
            </div>

            <!-- Tags List -->
            <div class="bg-white rounded-lg shadow p-6">
                <h2 class="text-xl font-bold text-gray-900 mb-4">
                    <i class="fas fa-tags text-blue-600 mr-2"></i>
                    タグ一覧 (<span id="tags-count">0</span>件)
                </h2>
                <div id="tags-list" class="space-y-3">
                    <!-- Tags will be rendered here -->
                </div>
            </div>
        </main>

        <!-- Edit Tag Modal -->
        <div id="edit-modal" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div class="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-xl font-bold text-gray-900">タグを編集</h3>
                    <button onclick="closeEditModal()" class="text-gray-400 hover:text-gray-600">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <form id="edit-tag-form">
                    <input type="hidden" id="edit-tag-id">
                    <div class="mb-4">
                        <label class="block text-sm font-medium text-gray-700 mb-1">タグ名</label>
                        <input type="text" 
                               id="edit-tag-name" 
                               class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                               required>
                    </div>
                    <div class="mb-6">
                        <label class="block text-sm font-medium text-gray-700 mb-1">色</label>
                        <div class="flex items-center gap-2">
                            <input type="color" 
                                   id="edit-tag-color" 
                                   class="w-12 h-10 border border-gray-300 rounded cursor-pointer">
                            <select id="edit-color-preset" 
                                    onchange="applyEditColorPreset()" 
                                    class="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                                <option value="">カスタム</option>
                                <option value="#3B82F6">青</option>
                                <option value="#10B981">緑</option>
                                <option value="#F59E0B">オレンジ</option>
                                <option value="#EF4444">赤</option>
                                <option value="#8B5CF6">紫</option>
                                <option value="#EC4899">ピンク</option>
                                <option value="#F59E0B">黄</option>
                                <option value="#6B7280">グレー</option>
                            </select>
                        </div>
                    </div>
                    <div class="flex items-center gap-3">
                        <button type="submit" 
                                class="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                            <i class="fas fa-save mr-2"></i>保存
                        </button>
                        <button type="button" 
                                onclick="closeEditModal()" 
                                class="flex-1 px-4 py-2 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg font-medium transition-colors">
                            キャンセル
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <script>
            let allTags = [];

            // Apply color preset (Create form)
            function applyColorPreset() {
                const preset = document.getElementById('color-preset').value;
                if (preset) {
                    document.getElementById('tag-color').value = preset;
                }
            }

            // Apply color preset (Edit form)
            function applyEditColorPreset() {
                const preset = document.getElementById('edit-color-preset').value;
                if (preset) {
                    document.getElementById('edit-tag-color').value = preset;
                }
            }

            // Load tags
            async function loadTags() {
                try {
                    const response = await axios.get('/api/tags');
                    allTags = response.data.tags || [];
                    renderTags();
                } catch (error) {
                    console.error('Failed to load tags:', error);
                    alert('タグの読み込みに失敗しました');
                }
            }

            // Render tags
            function renderTags() {
                const listContainer = document.getElementById('tags-list');
                const countElement = document.getElementById('tags-count');
                
                countElement.textContent = allTags.length;

                if (allTags.length === 0) {
                    listContainer.innerHTML = \`
                        <div class="text-center py-8 text-gray-500">
                            <i class="fas fa-tags text-4xl mb-3"></i>
                            <p>まだタグが作成されていません</p>
                            <p class="text-sm">上のフォームから最初のタグを作成してください</p>
                        </div>
                    \`;
                    return;
                }

                listContainer.innerHTML = allTags.map(tag => \`
                    <div class="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-gray-300 transition-colors">
                        <div class="flex items-center gap-3">
                            <div class="w-6 h-6 rounded-full" style="background-color: \${tag.color}"></div>
                            <span class="font-medium text-gray-900">\${tag.name}</span>
                            <span class="px-2 py-1 text-xs text-gray-600 bg-gray-100 rounded">
                                \${new Date(tag.created_at).toLocaleDateString('ja-JP')}
                            </span>
                        </div>
                        <div class="flex items-center gap-2">
                            <button onclick="openEditModal('\${tag.id}')" 
                                    class="px-3 py-1 text-blue-600 hover:bg-blue-50 rounded transition-colors">
                                <i class="fas fa-edit mr-1"></i>編集
                            </button>
                            <button onclick="deleteTag('\${tag.id}')" 
                                    class="px-3 py-1 text-red-600 hover:bg-red-50 rounded transition-colors">
                                <i class="fas fa-trash mr-1"></i>削除
                            </button>
                        </div>
                    </div>
                \`).join('');
            }

            // Create tag
            document.getElementById('create-tag-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const name = document.getElementById('tag-name').value.trim();
                const color = document.getElementById('tag-color').value;

                if (!name) {
                    alert('タグ名を入力してください');
                    return;
                }

                try {
                    await axios.post('/api/tags', { name, color });
                    
                    // Reset form
                    document.getElementById('tag-name').value = '';
                    document.getElementById('tag-color').value = '#3B82F6';
                    document.getElementById('color-preset').value = '';
                    
                    // Reload tags
                    await loadTags();
                    
                    alert('タグを作成しました');
                } catch (error) {
                    console.error('Failed to create tag:', error);
                    alert(error.response?.data?.error || 'タグの作成に失敗しました');
                }
            });

            // Open edit modal
            function openEditModal(tagId) {
                const tag = allTags.find(t => t.id === tagId);
                if (!tag) return;

                document.getElementById('edit-tag-id').value = tag.id;
                document.getElementById('edit-tag-name').value = tag.name;
                document.getElementById('edit-tag-color').value = tag.color;
                document.getElementById('edit-color-preset').value = '';
                document.getElementById('edit-modal').classList.remove('hidden');
            }

            // Close edit modal
            function closeEditModal() {
                document.getElementById('edit-modal').classList.add('hidden');
            }

            // Update tag
            document.getElementById('edit-tag-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                
                const tagId = document.getElementById('edit-tag-id').value;
                const name = document.getElementById('edit-tag-name').value.trim();
                const color = document.getElementById('edit-tag-color').value;

                if (!name) {
                    alert('タグ名を入力してください');
                    return;
                }

                try {
                    await axios.put(\`/api/tags/\${tagId}\`, { name, color });
                    closeEditModal();
                    await loadTags();
                    alert('タグを更新しました');
                } catch (error) {
                    console.error('Failed to update tag:', error);
                    alert(error.response?.data?.error || 'タグの更新に失敗しました');
                }
            });

            // Delete tag
            async function deleteTag(tagId) {
                if (!confirm('このタグを削除してもよろしいですか？\\n\\n関連する物件からタグが削除されます。')) {
                    return;
                }

                try {
                    await axios.delete(\`/api/tags/\${tagId}\`);
                    await loadTags();
                    alert('タグを削除しました');
                } catch (error) {
                    console.error('Failed to delete tag:', error);
                    alert(error.response?.data?.error || 'タグの削除に失敗しました');
                }
            }

            // Close modal on Escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape') {
                    closeEditModal();
                }
            });

            // Close modal on background click
            document.getElementById('edit-modal').addEventListener('click', (e) => {
                if (e.target.id === 'edit-modal') {
                    closeEditModal();
                }
            });

            // Load tags on page load
            loadTags();
        </script>
    </body>
    </html>
  `);
});

export default tags;
