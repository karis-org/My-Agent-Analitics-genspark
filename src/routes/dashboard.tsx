// Dashboard routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all dashboard routes
dashboard.use('/*', authMiddleware);

/**
 * Dashboard home page
 */
dashboard.get('/', (c) => {
  const user = c.get('user');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ダッシュボード - My Agent Analytics</title>
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
                        <img src="/static/icons/header-logo.png" alt="My Agent Analytics" class="h-12" style="height: auto; max-height: 48px;">
                    </div>
                    <div class="flex items-center space-x-4">
                        <div class="flex items-center space-x-3">
                            <img src="${user?.picture || 'https://via.placeholder.com/40'}" 
                                 alt="${user?.name}" 
                                 class="h-10 w-10 rounded-full">
                            <div>
                                <p class="text-sm font-medium text-gray-900">${user?.name}</p>
                                <p class="text-xs text-gray-500">${user?.email}</p>
                            </div>
                        </div>
                        <a href="/settings" 
                           class="text-sm text-gray-600 hover:text-gray-900 px-3 py-2 rounded hover:bg-gray-100"
                           title="設定">
                            <i class="fas fa-cog"></i>
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
            <!-- Welcome Section -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-8 mb-8 text-white">
                <h2 class="text-3xl font-bold mb-2">こんにちは、${user?.name?.split(' ')[0] || 'ユーザー'}さん！</h2>
                <p class="text-xl opacity-90">不動産投資分析を始めましょう</p>
            </div>

            <!-- Stats Grid -->
            <div class="grid md:grid-cols-4 gap-6 mb-8">
                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-3xl text-blue-600">
                            <i class="fas fa-building"></i>
                        </div>
                        <span class="text-sm text-gray-500">物件数</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">0</p>
                    <p class="text-sm text-gray-500 mt-2">登録済み物件</p>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-3xl text-green-600">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <span class="text-sm text-gray-500">分析数</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">0</p>
                    <p class="text-sm text-gray-500 mt-2">実行済み分析</p>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-3xl text-purple-600">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <span class="text-sm text-gray-500">レポート</span>
                    </div>
                    <p class="text-3xl font-bold text-gray-900">0</p>
                    <p class="text-sm text-gray-500 mt-2">生成済みレポート</p>
                </div>

                <div class="bg-white rounded-lg shadow p-6">
                    <div class="flex items-center justify-between mb-4">
                        <div class="text-3xl text-orange-600">
                            <i class="fas fa-clock"></i>
                        </div>
                        <span class="text-sm text-gray-500">最終ログイン</span>
                    </div>
                    <p class="text-xl font-bold text-gray-900">たった今</p>
                </div>
            </div>

            <!-- Quick Actions -->
            <div class="bg-white rounded-lg shadow p-8 mb-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6">クイックアクション</h3>
                <div class="grid md:grid-cols-3 gap-4">
                    <a href="/properties/new" 
                       class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors">
                        <div class="text-3xl text-blue-600 mr-4">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">新規物件登録</p>
                            <p class="text-sm text-gray-500">物件情報を入力</p>
                        </div>
                    </a>

                    <a href="/properties" 
                       class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors">
                        <div class="text-3xl text-green-600 mr-4">
                            <i class="fas fa-list"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">物件一覧</p>
                            <p class="text-sm text-gray-500">登録済み物件を表示</p>
                        </div>
                    </a>

                    <a href="/reports" 
                       class="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors">
                        <div class="text-3xl text-purple-600 mr-4">
                            <i class="fas fa-file-contract"></i>
                        </div>
                        <div>
                            <p class="font-semibold text-gray-900">レポート一覧</p>
                            <p class="text-sm text-gray-500">生成済みレポート</p>
                        </div>
                    </a>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow p-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6">最近のアクティビティ</h3>
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-6xl mb-4 opacity-50"></i>
                    <p>まだアクティビティがありません</p>
                    <p class="text-sm mt-2">物件を登録して分析を始めましょう</p>
                </div>
            </div>
        </main>
    </body>
    </html>
  `);
});

export default dashboard;
