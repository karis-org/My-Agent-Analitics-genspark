// Admin routes for My Agent Analytics
// Operations team only

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { adminMiddleware } from '../middleware/auth';

const admin = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply admin middleware to all admin routes
admin.use('/*', adminMiddleware);

/**
 * Admin Dashboard - User Management
 */
admin.get('/', async (c) => {
  const user = c.get('user');
  
  // Get all users from database
  const usersResult = await c.env.DB.prepare(
    'SELECT id, email, name, role, is_admin, created_at FROM users ORDER BY created_at DESC'
  ).all();
  
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
            <div class="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
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
                            <p class="text-sm text-gray-600 mb-1">管理者アカウント</p>
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
                            <p class="text-sm text-gray-600 mb-1">一般ユーザー</p>
                            <p class="text-3xl font-bold text-gray-900">${users.filter((u: any) => !u.is_admin).length}</p>
                        </div>
                        <div class="text-4xl text-green-500">
                            <i class="fas fa-user"></i>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Users Table -->
            <div class="bg-white rounded-lg shadow">
                <div class="px-6 py-4 border-b border-gray-200">
                    <div class="flex items-center justify-between">
                        <h2 class="text-xl font-bold text-gray-900">
                            <i class="fas fa-users mr-2"></i>登録ユーザー一覧
                        </h2>
                        <div class="flex space-x-2">
                            <button onclick="exportToCSV()" 
                                    class="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <i class="fas fa-file-csv mr-1"></i>CSVエクスポート
                            </button>
                            <button onclick="window.print()" 
                                    class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                                <i class="fas fa-print mr-1"></i>印刷
                            </button>
                        </div>
                    </div>
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
                                    登録日時
                                </th>
                            </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                            ${users.map((u: any) => `
                                <tr class="hover:bg-gray-50">
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
                                            `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
                                                <i class="fas fa-shield-alt mr-1"></i>${u.role === 'super_admin' ? '運営管理者' : '管理者'}
                                            </span>` 
                                            : 
                                            `<span class="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                                                <i class="fas fa-user mr-1"></i>一般ユーザー
                                            </span>`
                                        }
                                    </td>
                                    <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                        ${new Date(u.created_at).toLocaleString('ja-JP')}
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
        </main>

        <script>
            // CSV Export Function
            function exportToCSV() {
                const users = ${JSON.stringify(users)};
                
                // CSV header
                let csv = '\uFEFF'; // UTF-8 BOM for Excel compatibility
                csv += 'ユーザーID,メールアドレス,名前,権限,登録日時\\n';
                
                // CSV data
                users.forEach(user => {
                    const role = user.is_admin ? 
                        (user.role === 'super_admin' ? '運営管理者' : '管理者') : 
                        '一般ユーザー';
                    const createdAt = new Date(user.created_at).toLocaleString('ja-JP');
                    
                    csv += \`"\${user.id}","\${user.email}","\${user.name || ''}","\${role}","\${createdAt}"\\n\`;
                });
                
                // Download
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
        </script>
        
        <style>
            @media print {
                header, button, .no-print {
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
 * API: Get all users as JSON
 */
admin.get('/api/users', async (c) => {
  const usersResult = await c.env.DB.prepare(
    'SELECT id, email, name, role, is_admin, created_at FROM users ORDER BY created_at DESC'
  ).all();
  
  return c.json({
    success: true,
    count: usersResult.results?.length || 0,
    users: usersResult.results || []
  });
});

export default admin;
