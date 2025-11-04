// Admin routes for My Agent Analytics
// Operations team only

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { adminMiddleware } from '../middleware/auth';

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply admin middleware to all admin routes
admin.use('/*', adminMiddleware);

/**
 * Helper function to create activity log
 */
async function createActivityLog(
  db: D1Database,
  userId: string,
  adminId: string,
  action: string,
  details: string | null = null
) {
  const id = `log-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  await db.prepare(
    'INSERT INTO activity_logs (id, user_id, admin_id, action, details, created_at) VALUES (?, ?, ?, ?, ?, ?)'
  ).bind(id, userId, adminId, action, details, new Date().toISOString()).run();
}

/**
 * Admin Dashboard - User Management
 */
admin.get('/', async (c) => {
  const user = c.get('user');
  
  // Get all users with stats
  const usersResult = await c.env.DB.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.role, 
      u.is_admin, 
      u.is_active,
      u.created_at,
      COUNT(DISTINCT p.id) as property_count,
      COUNT(DISTINCT a.id) as analysis_count
    FROM users u
    LEFT JOIN properties p ON u.id = p.user_id
    LEFT JOIN analysis_results a ON p.id = a.property_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
  `).all();
  
  const users = usersResult.results || [];
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>運営管理画面 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            
            /* Modal styles */
            .modal {
                display: none;
                position: fixed;
                z-index: 1000;
                left: 0;
                top: 0;
                width: 100%;
                height: 100%;
                overflow: auto;
                background-color: rgba(0,0,0,0.6);
            }
            .modal.show {
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .modal-content {
                background-color: #fefefe;
                border-radius: 12px;
                padding: 0;
                width: 90%;
                max-width: 600px;
                max-height: 90vh;
                overflow-y: auto;
                box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b-4 border-red-500">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">
                            <i class="fas fa-shield-alt mr-1"></i>運営管理
                        </div>
                        <h1 class="text-xl font-bold text-gray-900">My Agent Analytics</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="text-sm text-gray-600">
                            <i class="fas fa-user-shield mr-1"></i>${user?.name}
                        </div>
                        <a href="/dashboard" 
                           class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100">
                            <i class="fas fa-arrow-left mr-1"></i>ダッシュボードに戻る
                        </a>
                        <a href="/auth/logout" 
                           class="text-sm text-gray-600 hover:text-gray-900">
                            <i class="fas fa-sign-out-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Stats Cards -->
            <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">総ユーザー数</p>
                            <p class="text-3xl font-bold text-gray-900">${users.length}</p>
                        </div>
                        <div class="text-4xl text-blue-500">
                            <i class="fas fa-users"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">管理者</p>
                            <p class="text-3xl font-bold text-gray-900">${users.filter((u: any) => u.is_admin).length}</p>
                        </div>
                        <div class="text-4xl text-purple-500">
                            <i class="fas fa-user-shield"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">有効ユーザー</p>
                            <p class="text-3xl font-bold text-gray-900">${users.filter((u: any) => u.is_active).length}</p>
                        </div>
                        <div class="text-4xl text-green-500">
                            <i class="fas fa-user-check"></i>
                        </div>
                    </div>
                </div>
                
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between">
                        <div>
                            <p class="text-sm text-gray-600 mb-1">無効ユーザー</p>
                            <p class="text-3xl font-bold text-gray-900">${users.filter((u: any) => !u.is_active).length}</p>
                        </div>
                        <div class="text-4xl text-red-500">
                            <i class="fas fa-user-slash"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Quick Access: Documentation -->
            <div class="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg shadow p-6 mb-8">
                <div class="flex items-center justify-between text-white">
                    <div>
                        <h3 class="text-lg font-bold mb-2">
                            <i class="fas fa-book mr-2"></i>ドキュメントセンター
                        </h3>
                        <p class="text-blue-100 text-sm mb-4">
                            システムマニュアル、運用ガイド、トラブルシューティングをご覧いただけます
                        </p>
                        <a href="/admin/docs" 
                           class="inline-block bg-white text-blue-600 px-6 py-2 rounded-lg font-medium hover:bg-blue-50 transition-colors">
                            <i class="fas fa-arrow-right mr-2"></i>ドキュメントを開く
                        </a>
                    </div>
                    <div class="hidden md:block text-6xl opacity-50">
                        <i class="fas fa-book-open"></i>
                    </div>
                </div>
            </div>

            <!-- Search and Filter -->
            <div class="bg-white rounded-lg shadow p-6 mb-8">
                <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div class="flex-1">
                        <div class="relative">
                            <input type="text" 
                                   id="searchInput" 
                                   placeholder="ユーザーID、メール、名前で検索..."
                                   class="w-full px-4 py-2 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                   onkeyup="filterUsers()">
                            <i class="fas fa-search absolute left-3 top-3 text-gray-400"></i>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <select id="roleFilter" 
                                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onchange="filterUsers()">
                            <option value="">全権限</option>
                            <option value="super_admin">運営管理者</option>
                            <option value="admin">管理者</option>
                            <option value="user">一般ユーザー</option>
                        </select>
                        <select id="statusFilter" 
                                class="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                onchange="filterUsers()">
                            <option value="">全ステータス</option>
                            <option value="1">有効</option>
                            <option value="0">無効</option>
                        </select>
                        <button onclick="resetFilters()" 
                                class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
                            <i class="fas fa-redo mr-1"></i>リセット
                        </button>
                    </div>
                    <div class="flex gap-2">
                        <button onclick="exportToCSV()" 
                                class="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors">
                            <i class="fas fa-file-csv mr-1"></i>CSV
                        </button>
                        <button onclick="window.print()" 
                                class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                            <i class="fas fa-print mr-1"></i>印刷
                        </button>
                    </div>
                </div>
            </div>

            <!-- Users Table -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-users mr-2"></i>登録ユーザー一覧
                        <span id="filteredCount" class="text-sm font-normal text-gray-500 ml-2">
                            (${users.length}件)
                        </span>
                    </h2>
                </div>
                
                <div class="overflow-x-auto">
                    <table class="min-w-full divide-y divide-gray-200" id="usersTable">
                        <thead class="bg-gray-50">
                            <tr>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ユーザーID
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    メールアドレス
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    名前
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    権限
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    ステータス
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    物件数
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    分析数
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    登録日時
                                </th>
                                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider no-print">
                                    操作
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${users.map((u: any) => `
                                <tr class="hover:bg-gray-50 user-row" 
                                    data-user-id="${u.id}"
                                    data-email="${u.email}"
                                    data-name="${u.name || ''}"
                                    data-role="${u.role}"
                                    data-is-active="${u.is_active}">
                                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                        ${u.id}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        ${u.email}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ${u.name || '-'}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        ${u.is_admin ? 
                                            `<span class="px-2 py-1 text-xs font-semibold rounded-full ${u.role === 'super_admin' ? 'bg-red-100 text-red-800' : 'bg-purple-100 text-purple-800'}">
                                                <i class="fas fa-shield-alt mr-1"></i>${u.role === 'super_admin' ? '運営管理者' : '管理者'}
                                            </span>` 
                                            : 
                                            `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                <i class="fas fa-user mr-1"></i>一般ユーザー
                                            </span>`
                                        }
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm">
                                        ${u.is_active ?
                                            '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800"><i class="fas fa-check-circle mr-1"></i>有効</span>'
                                            :
                                            '<span class="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800"><i class="fas fa-ban mr-1"></i>無効</span>'
                                        }
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        ${u.property_count || 0}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        ${u.analysis_count || 0}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        ${new Date(u.created_at).toLocaleString('ja-JP')}
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm no-print">
                                        <div class="flex space-x-2">
                                            <button onclick="viewUserDetails('${u.id}')" 
                                                    class="text-blue-600 hover:text-blue-800"
                                                    title="詳細">
                                                <i class="fas fa-eye"></i>
                                            </button>
                                            ${u.id !== '${user?.id}' ? `
                                                <button onclick="toggleUserStatus('${u.id}', ${u.is_active})" 
                                                        class="${u.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'}"
                                                        title="${u.is_active ? '無効化' : '有効化'}">
                                                    <i class="fas fa-${u.is_active ? 'ban' : 'check-circle'}"></i>
                                                </button>
                                                <button onclick="changeUserRole('${u.id}', '${u.role}')" 
                                                        class="text-purple-600 hover:text-purple-800"
                                                        title="権限変更">
                                                    <i class="fas fa-user-cog"></i>
                                                </button>
                                            ` : ''}
                                        </div>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
                
                ${users.length === 0 ? `
                    <div class="text-center py-12">
                        <div class="text-gray-400 text-5xl mb-4">
                            <i class="fas fa-users-slash"></i>
                        </div>
                        <p class="text-gray-500">登録ユーザーはまだいません</p>
                    </div>
                ` : ''}
            </div>

            <!-- Activity Logs Section -->
            <div class="bg-white rounded-lg shadow mt-8">
                <div class="px-6 py-4 border-b border-gray-200">
                    <h2 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-history mr-2"></i>最近のアクティビティ
                    </h2>
                </div>
                <div id="activityLogs" class="p-6">
                    <p class="text-gray-500 text-center py-4">読み込み中...</p>
                </div>
            </div>
        </main>

        <!-- User Details Modal -->
        <div id="userDetailsModal" class="modal">
            <div class="modal-content">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-blue-50">
                    <h3 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-user-circle mr-2"></i>ユーザー詳細
                    </h3>
                    <button onclick="closeModal('userDetailsModal')" 
                            class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div id="userDetailsContent" class="p-6">
                    <!-- Content will be loaded dynamically -->
                </div>
            </div>
        </div>

        <!-- Change Role Modal -->
        <div id="changeRoleModal" class="modal">
            <div class="modal-content">
                <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-purple-50">
                    <h3 class="text-xl font-bold text-gray-900">
                        <i class="fas fa-user-cog mr-2"></i>権限変更
                    </h3>
                    <button onclick="closeModal('changeRoleModal')" 
                            class="text-gray-500 hover:text-gray-700">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
                <div class="p-6">
                    <form id="changeRoleForm" onsubmit="submitRoleChange(event)">
                        <input type="hidden" id="changeRoleUserId" />
                        <div class="mb-4">
                            <label class="block text-sm font-medium text-gray-700 mb-2">
                                新しい権限を選択
                            </label>
                            <select id="newRole" 
                                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent">
                                <option value="user">一般ユーザー</option>
                                <option value="admin">管理者</option>
                                <option value="super_admin">運営管理者</option>
                            </select>
                        </div>
                        <div class="flex justify-end gap-2">
                            <button type="button" 
                                    onclick="closeModal('changeRoleModal')" 
                                    class="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors">
                                キャンセル
                            </button>
                            <button type="submit" 
                                    class="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
                                <i class="fas fa-check mr-1"></i>変更
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>

        <script>
            const allUsers = ${JSON.stringify(users)};
            
            // Filter users
            function filterUsers() {
                const searchTerm = document.getElementById('searchInput').value.toLowerCase();
                const roleFilter = document.getElementById('roleFilter').value;
                const statusFilter = document.getElementById('statusFilter').value;
                
                const rows = document.querySelectorAll('.user-row');
                let visibleCount = 0;
                
                rows.forEach(row => {
                    const userId = row.dataset.userId.toLowerCase();
                    const email = row.dataset.email.toLowerCase();
                    const name = row.dataset.name.toLowerCase();
                    const role = row.dataset.role;
                    const isActive = row.dataset.isActive;
                    
                    const matchesSearch = !searchTerm || 
                                        userId.includes(searchTerm) || 
                                        email.includes(searchTerm) || 
                                        name.includes(searchTerm);
                    const matchesRole = !roleFilter || role === roleFilter;
                    const matchesStatus = !statusFilter || isActive === statusFilter;
                    
                    if (matchesSearch && matchesRole && matchesStatus) {
                        row.style.display = '';
                        visibleCount++;
                    } else {
                        row.style.display = 'none';
                    }
                });
                
                document.getElementById('filteredCount').textContent = \`(\${visibleCount}件)\`;
            }
            
            // Reset filters
            function resetFilters() {
                document.getElementById('searchInput').value = '';
                document.getElementById('roleFilter').value = '';
                document.getElementById('statusFilter').value = '';
                filterUsers();
            }
            
            // CSV Export
            function exportToCSV() {
                let csv = '\uFEFF'; // UTF-8 BOM
                csv += 'ユーザーID,メールアドレス,名前,権限,ステータス,物件数,分析数,登録日時\\n';
                
                allUsers.forEach(user => {
                    const role = user.is_admin ? 
                        (user.role === 'super_admin' ? '運営管理者' : '管理者') : 
                        '一般ユーザー';
                    const status = user.is_active ? '有効' : '無効';
                    const createdAt = new Date(user.created_at).toLocaleString('ja-JP');
                    
                    csv += \`"\${user.id}","\${user.email}","\${user.name || ''}","\${role}","\${status}","\${user.property_count || 0}","\${user.analysis_count || 0}","\${createdAt}"\\n\`;
                });
                
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                const timestamp = new Date().toISOString().split('T')[0];
                
                link.setAttribute('href', url);
                link.setAttribute('download', \`users_\${timestamp}.csv\`);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            // View user details
            async function viewUserDetails(userId) {
                const modal = document.getElementById('userDetailsModal');
                const content = document.getElementById('userDetailsContent');
                
                content.innerHTML = '<p class="text-center py-4">読み込み中...</p>';
                modal.classList.add('show');
                
                try {
                    const response = await fetch(\`/admin/api/users/\${userId}\`);
                    const data = await response.json();
                    
                    if (data.success) {
                        const u = data.user;
                        const role = u.is_admin ? (u.role === 'super_admin' ? '運営管理者' : '管理者') : '一般ユーザー';
                        const status = u.is_active ? '<span class="text-green-600"><i class="fas fa-check-circle mr-1"></i>有効</span>' : '<span class="text-red-600"><i class="fas fa-ban mr-1"></i>無効</span>';
                        
                        content.innerHTML = \`
                            <div class="space-y-4">
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-600">ユーザーID</p>
                                        <p class="font-medium">\${u.id}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">ステータス</p>
                                        <p class="font-medium">\${status}</p>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">メールアドレス</p>
                                    <p class="font-medium">\${u.email}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">名前</p>
                                    <p class="font-medium">\${u.name || '-'}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">権限</p>
                                    <p class="font-medium">\${role}</p>
                                </div>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <p class="text-sm text-gray-600">物件数</p>
                                        <p class="font-medium text-2xl text-blue-600">\${u.property_count || 0}</p>
                                    </div>
                                    <div>
                                        <p class="text-sm text-gray-600">分析数</p>
                                        <p class="font-medium text-2xl text-green-600">\${u.analysis_count || 0}</p>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">登録日時</p>
                                    <p class="font-medium">\${new Date(u.created_at).toLocaleString('ja-JP')}</p>
                                </div>
                                <div>
                                    <p class="text-sm text-gray-600">最終更新</p>
                                    <p class="font-medium">\${new Date(u.updated_at).toLocaleString('ja-JP')}</p>
                                </div>
                            </div>
                        \`;
                    }
                } catch (error) {
                    content.innerHTML = '<p class="text-red-600 text-center py-4">エラーが発生しました</p>';
                }
            }
            
            // Toggle user status
            async function toggleUserStatus(userId, currentStatus) {
                const newStatus = currentStatus ? 0 : 1;
                const action = newStatus ? '有効化' : '無効化';
                
                if (!confirm(\`このユーザーを\${action}しますか？\`)) return;
                
                try {
                    const response = await fetch(\`/admin/api/users/\${userId}/status\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ is_active: newStatus })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert(\`ユーザーを\${action}しました\`);
                        location.reload();
                    } else {
                        alert('エラーが発生しました');
                    }
                } catch (error) {
                    alert('エラーが発生しました');
                }
            }
            
            // Change user role
            function changeUserRole(userId, currentRole) {
                document.getElementById('changeRoleUserId').value = userId;
                document.getElementById('newRole').value = currentRole;
                document.getElementById('changeRoleModal').classList.add('show');
            }
            
            // Submit role change
            async function submitRoleChange(event) {
                event.preventDefault();
                
                const userId = document.getElementById('changeRoleUserId').value;
                const newRole = document.getElementById('newRole').value;
                
                try {
                    const response = await fetch(\`/admin/api/users/\${userId}/role\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ role: newRole })
                    });
                    
                    const data = await response.json();
                    
                    if (data.success) {
                        alert('権限を変更しました');
                        location.reload();
                    } else {
                        alert('エラーが発生しました');
                    }
                } catch (error) {
                    alert('エラーが発生しました');
                }
            }
            
            // Close modal
            function closeModal(modalId) {
                document.getElementById(modalId).classList.remove('show');
            }
            
            // Load activity logs
            async function loadActivityLogs() {
                try {
                    const response = await fetch('/admin/api/activity-logs');
                    const data = await response.json();
                    
                    if (data.success && data.logs.length > 0) {
                        const logsHtml = data.logs.map(log => {
                            const actionIcon = {
                                'user_disabled': 'fa-ban text-red-600',
                                'user_enabled': 'fa-check-circle text-green-600',
                                'role_changed': 'fa-user-cog text-purple-600',
                                'user_viewed': 'fa-eye text-blue-600'
                            }[log.action] || 'fa-info-circle text-gray-600';
                            
                            return \`
                                <div class="flex items-start space-x-3 py-3 border-b border-gray-100">
                                    <i class="fas \${actionIcon} mt-1"></i>
                                    <div class="flex-1">
                                        <p class="text-sm text-gray-900">
                                            <span class="font-medium">\${log.admin_name}</span>
                                            が
                                            <span class="font-medium">\${log.user_name || log.user_email}</span>
                                            を
                                            \${log.action === 'user_disabled' ? '無効化' : 
                                              log.action === 'user_enabled' ? '有効化' : 
                                              log.action === 'role_changed' ? '権限変更' : 
                                              '閲覧'}
                                            しました
                                        </p>
                                        \${log.details ? \`<p class="text-xs text-gray-500">\${log.details}</p>\` : ''}
                                        <p class="text-xs text-gray-400 mt-1">
                                            \${new Date(log.created_at).toLocaleString('ja-JP')}
                                        </p>
                                    </div>
                                </div>
                            \`;
                        }).join('');
                        
                        document.getElementById('activityLogs').innerHTML = logsHtml;
                    } else {
                        document.getElementById('activityLogs').innerHTML = 
                            '<p class="text-gray-500 text-center py-4">アクティビティはまだありません</p>';
                    }
                } catch (error) {
                    document.getElementById('activityLogs').innerHTML = 
                        '<p class="text-red-500 text-center py-4">読み込みエラー</p>';
                }
            }
            
            // Load activity logs on page load
            loadActivityLogs();
            
            // Close modal when clicking outside
            window.onclick = function(event) {
                if (event.target.classList.contains('modal')) {
                    event.target.classList.remove('show');
                }
            }
        </script>
        
        <style>
            @media print {
                header, .no-print {
                    display: none !important;
                }
                body {
                    background: white;
                }
                table {
                    page-break-inside: auto;
                }
                tr {
                    page-break-inside: avoid;
                    page-break-after: auto;
                }
            }
        </style>
    </body>
    </html>
  `);
});

/**
 * API: Get user details by ID
 */
admin.get('/api/users/:id', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user');
  
  const userResult = await c.env.DB.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.role, 
      u.is_admin, 
      u.is_active,
      u.created_at,
      u.updated_at,
      COUNT(DISTINCT p.id) as property_count,
      COUNT(DISTINCT a.id) as analysis_count
    FROM users u
    LEFT JOIN properties p ON u.id = p.user_id
    LEFT JOIN analysis_results a ON p.id = a.property_id
    WHERE u.id = ?
    GROUP BY u.id
  `).bind(userId).first();
  
  if (!userResult) {
    return c.json({ success: false, error: 'User not found' }, 404);
  }
  
  // Log activity
  await createActivityLog(c.env.DB, userId, adminUser!.id, 'user_viewed', null);
  
  return c.json({ success: true, user: userResult });
});

/**
 * API: Toggle user status (active/inactive)
 */
admin.post('/api/users/:id/status', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user');
  const { is_active } = await c.req.json();
  
  // Prevent self-disabling
  if (userId === adminUser!.id) {
    return c.json({ success: false, error: 'Cannot modify your own status' }, 400);
  }
  
  await c.env.DB.prepare(
    'UPDATE users SET is_active = ?, updated_at = ? WHERE id = ?'
  ).bind(is_active, new Date().toISOString(), userId).run();
  
  // Log activity
  const action = is_active ? 'user_enabled' : 'user_disabled';
  await createActivityLog(c.env.DB, userId, adminUser!.id, action, null);
  
  return c.json({ success: true });
});

/**
 * API: Change user role
 */
admin.post('/api/users/:id/role', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user');
  const { role } = await c.req.json();
  
  // Prevent self-modification
  if (userId === adminUser!.id) {
    return c.json({ success: false, error: 'Cannot modify your own role' }, 400);
  }
  
  // Validate role
  if (!['user', 'admin', 'super_admin'].includes(role)) {
    return c.json({ success: false, error: 'Invalid role' }, 400);
  }
  
  const isAdmin = role === 'admin' || role === 'super_admin' ? 1 : 0;
  
  await c.env.DB.prepare(
    'UPDATE users SET role = ?, is_admin = ?, updated_at = ? WHERE id = ?'
  ).bind(role, isAdmin, new Date().toISOString(), userId).run();
  
  // Log activity
  await createActivityLog(c.env.DB, userId, adminUser!.id, 'role_changed', `New role: ${role}`);
  
  return c.json({ success: true });
});

/**
 * API: Get recent activity logs
 */
admin.get('/api/activity-logs', async (c) => {
  const logsResult = await c.env.DB.prepare(`
    SELECT 
      al.*,
      u.name as user_name,
      u.email as user_email,
      a.name as admin_name
    FROM activity_logs al
    JOIN users u ON al.user_id = u.id
    JOIN users a ON al.admin_id = a.id
    ORDER BY al.created_at DESC
    LIMIT 20
  `).all();
  
  return c.json({ 
    success: true, 
    logs: logsResult.results || [] 
  });
});

/**
 * Documentation Page
 */
admin.get('/docs', async (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ドキュメント - 運営管理画面</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <script src="https://cdn.jsdelivr.net/npm/marked@9.0.0/marked.min.js"></script>
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            
            .markdown-content h1 {
                font-size: 2em;
                font-weight: bold;
                margin-top: 1em;
                margin-bottom: 0.5em;
                padding-bottom: 0.3em;
                border-bottom: 2px solid #e5e7eb;
            }
            .markdown-content h2 {
                font-size: 1.5em;
                font-weight: bold;
                margin-top: 1.5em;
                margin-bottom: 0.5em;
                padding-bottom: 0.2em;
                border-bottom: 1px solid #e5e7eb;
            }
            .markdown-content h3 {
                font-size: 1.25em;
                font-weight: bold;
                margin-top: 1em;
                margin-bottom: 0.5em;
            }
            .markdown-content pre {
                background-color: #1f2937;
                color: #f3f4f6;
                padding: 1em;
                border-radius: 0.5em;
                overflow-x: auto;
                margin: 1em 0;
            }
            .markdown-content code {
                background-color: #f3f4f6;
                padding: 0.2em 0.4em;
                border-radius: 0.25em;
                font-family: 'Courier New', monospace;
                font-size: 0.9em;
            }
            .markdown-content pre code {
                background-color: transparent;
                padding: 0;
            }
            .markdown-content table {
                border-collapse: collapse;
                width: 100%;
                margin: 1em 0;
            }
            .markdown-content th, .markdown-content td {
                border: 1px solid #e5e7eb;
                padding: 0.5em;
                text-align: left;
            }
            .markdown-content th {
                background-color: #f9fafb;
                font-weight: bold;
            }
            .markdown-content ul, .markdown-content ol {
                margin: 0.5em 0;
                padding-left: 2em;
            }
            .markdown-content li {
                margin: 0.25em 0;
            }
            .markdown-content blockquote {
                border-left: 4px solid #3b82f6;
                padding-left: 1em;
                margin: 1em 0;
                color: #6b7280;
            }
        </style>
    </head>
    <body class="bg-gray-50">
        <!-- Header -->
        <header class="bg-white shadow-sm border-b-4 border-red-500">
            <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <div class="bg-red-500 text-white px-3 py-1 rounded font-bold text-sm">
                            <i class="fas fa-shield-alt mr-1"></i>運営管理
                        </div>
                        <h1 class="text-xl font-bold text-gray-900">ドキュメント</h1>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/admin" 
                           class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100">
                            <i class="fas fa-arrow-left mr-1"></i>管理画面に戻る
                        </a>
                        <a href="/dashboard" 
                           class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100">
                            <i class="fas fa-home mr-1"></i>ダッシュボード
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <!-- Sidebar -->
                <div class="lg:col-span-1">
                    <div class="bg-white rounded-lg shadow p-6 sticky top-8">
                        <h3 class="text-lg font-bold text-gray-900 mb-4">
                            <i class="fas fa-book mr-2"></i>ドキュメント一覧
                        </h3>
                        <nav class="space-y-2">
                            <button onclick="loadDoc('USER_MANUAL_V6.7.4')" 
                                    class="doc-nav-btn w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-user-guide mr-2"></i>ユーザーマニュアル
                            </button>
                            <button onclick="loadDoc('OPERATIONS_MANUAL_SPECIFICATIONS')" 
                                    class="doc-nav-btn w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-file-code mr-2"></i>システム仕様書
                            </button>
                            <button onclick="loadDoc('OPERATIONS_MANUAL_ERROR_HANDLING')" 
                                    class="doc-nav-btn w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-exclamation-triangle mr-2"></i>エラー対処法
                            </button>
                            <button onclick="loadDoc('OPERATIONS_MANUAL_GUIDE')" 
                                    class="doc-nav-btn w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-tasks mr-2"></i>運用ガイド
                            </button>
                            <button onclick="loadDoc('MONITORING_SETUP')" 
                                    class="doc-nav-btn w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-chart-line mr-2"></i>監視設定ガイド
                            </button>
                            <button onclick="loadDoc('PRE_RELEASE_CHECKLIST')" 
                                    class="doc-nav-btn w-full text-left px-3 py-2 rounded hover:bg-blue-50 hover:text-blue-600 transition-colors">
                                <i class="fas fa-check-circle mr-2"></i>リリースチェックリスト
                            </button>
                        </nav>
                        
                        <hr class="my-4">
                        
                        <div class="text-sm text-gray-600">
                            <p class="mb-2"><strong>バージョン:</strong> v6.7.4</p>
                            <p><strong>最終更新:</strong> 2025年11月4日</p>
                        </div>
                    </div>
                </div>

                <!-- Content Area -->
                <div class="lg:col-span-3">
                    <div class="bg-white rounded-lg shadow">
                        <!-- Loading State -->
                        <div id="loading" class="p-12 text-center hidden">
                            <i class="fas fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                            <p class="text-gray-600">読み込み中...</p>
                        </div>
                        
                        <!-- Welcome State -->
                        <div id="welcome" class="p-12 text-center">
                            <i class="fas fa-book-open text-6xl text-blue-500 mb-6"></i>
                            <h2 class="text-2xl font-bold text-gray-900 mb-4">ドキュメントセンター</h2>
                            <p class="text-gray-600 mb-6">
                                左のメニューからドキュメントを選択してください。<br>
                                システムの使い方、運用方法、トラブルシューティングなどの情報を確認できます。
                            </p>
                            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                                <div class="p-4 border border-gray-200 rounded-lg">
                                    <i class="fas fa-user-guide text-2xl text-blue-500 mb-2"></i>
                                    <h3 class="font-bold mb-1">ユーザーマニュアル</h3>
                                    <p class="text-sm text-gray-600">エンドユーザー向けの完全ガイド</p>
                                </div>
                                <div class="p-4 border border-gray-200 rounded-lg">
                                    <i class="fas fa-file-code text-2xl text-green-500 mb-2"></i>
                                    <h3 class="font-bold mb-1">システム仕様書</h3>
                                    <p class="text-sm text-gray-600">技術仕様とAPI仕様</p>
                                </div>
                                <div class="p-4 border border-gray-200 rounded-lg">
                                    <i class="fas fa-exclamation-triangle text-2xl text-orange-500 mb-2"></i>
                                    <h3 class="font-bold mb-1">エラー対処法</h3>
                                    <p class="text-sm text-gray-600">トラブルシューティングガイド</p>
                                </div>
                                <div class="p-4 border border-gray-200 rounded-lg">
                                    <i class="fas fa-tasks text-2xl text-purple-500 mb-2"></i>
                                    <h3 class="font-bold mb-1">運用ガイド</h3>
                                    <p class="text-sm text-gray-600">日常運用タスクと手順</p>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Document Content -->
                        <div id="content" class="p-8 markdown-content hidden"></div>
                        
                        <!-- Error State -->
                        <div id="error" class="p-12 text-center hidden">
                            <i class="fas fa-exclamation-circle text-6xl text-red-500 mb-6"></i>
                            <h2 class="text-2xl font-bold text-gray-900 mb-4">読み込みエラー</h2>
                            <p class="text-gray-600 mb-6" id="error-message">
                                ドキュメントの読み込みに失敗しました。
                            </p>
                            <button onclick="location.reload()" 
                                    class="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg">
                                <i class="fas fa-redo mr-2"></i>再読み込み
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>

        <script>
            // Document content mapping
            const docs = {
                'USER_MANUAL_V6.7.4': {
                    title: 'ユーザーマニュアル v6.7.4',
                    file: 'USER_MANUAL_V6.7.4.md'
                },
                'OPERATIONS_MANUAL_SPECIFICATIONS': {
                    title: 'システム仕様書',
                    file: 'OPERATIONS_MANUAL_SPECIFICATIONS.md'
                },
                'OPERATIONS_MANUAL_ERROR_HANDLING': {
                    title: 'エラー対処法',
                    file: 'OPERATIONS_MANUAL_ERROR_HANDLING.md'
                },
                'OPERATIONS_MANUAL_GUIDE': {
                    title: '運用ガイド',
                    file: 'OPERATIONS_MANUAL_GUIDE.md'
                },
                'MONITORING_SETUP': {
                    title: '監視設定ガイド',
                    file: 'MONITORING_SETUP.md'
                },
                'PRE_RELEASE_CHECKLIST': {
                    title: 'リリース前チェックリスト',
                    file: 'PRE_RELEASE_CHECKLIST.md'
                }
            };

            function showElement(id) {
                ['loading', 'welcome', 'content', 'error'].forEach(el => {
                    document.getElementById(el).classList.add('hidden');
                });
                document.getElementById(id).classList.remove('hidden');
            }

            async function loadDoc(docKey) {
                const doc = docs[docKey];
                if (!doc) {
                    showError('ドキュメントが見つかりません');
                    return;
                }

                showElement('loading');

                try {
                    const response = await fetch(\`/admin/api/docs/\${doc.file}\`);
                    if (!response.ok) {
                        throw new Error('ドキュメントの読み込みに失敗しました');
                    }

                    const markdown = await response.text();
                    const html = marked.parse(markdown);
                    
                    document.getElementById('content').innerHTML = html;
                    showElement('content');
                    
                    // Scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                } catch (error) {
                    console.error('Error loading document:', error);
                    showError(error.message);
                }
            }

            function showError(message) {
                document.getElementById('error-message').textContent = message;
                showElement('error');
            }
        </script>
    </body>
    </html>
  `);
});

/**
 * API: Get document content
 */
admin.get('/api/docs/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  // Security: Only allow specific document files
  const allowedFiles = [
    'USER_MANUAL_V6.7.4.md',
    'OPERATIONS_MANUAL_SPECIFICATIONS.md',
    'OPERATIONS_MANUAL_ERROR_HANDLING.md',
    'OPERATIONS_MANUAL_GUIDE.md',
    'MONITORING_SETUP.md',
    'PRE_RELEASE_CHECKLIST.md'
  ];
  
  if (!allowedFiles.includes(filename)) {
    return c.text('File not found', 404);
  }
  
  // In Cloudflare Workers, we need to serve docs from a different approach
  // Since we can't read files directly, we'll return a placeholder
  // In production, these should be uploaded to R2 or KV storage
  
  const docContent = `# ドキュメント: ${filename}

このドキュメントは現在開発中です。

**Note**: Cloudflare Workers環境では、ドキュメントファイルをR2またはKV storageに保存する必要があります。

## 実装オプション

### オプション1: R2 Storage
\`\`\`bash
# ドキュメントをR2にアップロード
npx wrangler r2 object put my-agent-analytics-docs/${filename} --file=docs/${filename}
\`\`\`

### オプション2: KV Storage  
\`\`\`bash
# ドキュメントをKVに保存
npx wrangler kv:key put "${filename}" --path=docs/${filename} --binding=DOCS
\`\`\`

### オプション3: GitHub Pages
- docsディレクトリをGitHub Pagesで公開
- 管理画面から直接リンク

## 一時的な解決策

ドキュメントファイルはGitHubリポジトリで参照できます:
- [ユーザーマニュアル](https://github.com/YOUR_ORG/webapp/blob/main/docs/USER_MANUAL_V6.7.4.md)
- [システム仕様書](https://github.com/YOUR_ORG/webapp/blob/main/docs/OPERATIONS_MANUAL_SPECIFICATIONS.md)
- [エラー対処法](https://github.com/YOUR_ORG/webapp/blob/main/docs/OPERATIONS_MANUAL_ERROR_HANDLING.md)
- [運用ガイド](https://github.com/YOUR_ORG/webapp/blob/main/docs/OPERATIONS_MANUAL_GUIDE.md)
- [監視設定ガイド](https://github.com/YOUR_ORG/webapp/blob/main/docs/MONITORING_SETUP.md)
- [リリースチェックリスト](https://github.com/YOUR_ORG/webapp/blob/main/docs/PRE_RELEASE_CHECKLIST.md)
`;

  return c.text(docContent, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8'
    }
  });
});

export default admin;
