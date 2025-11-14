// Dashboard routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const dashboard = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware to all dashboard routes
dashboard.use('/*', authMiddleware);

/**
 * Helper function to get time ago string
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'たった今';
  if (diffMins < 60) return `${diffMins}分前`;
  if (diffHours < 24) return `${diffHours}時間前`;
  if (diffDays < 7) return `${diffDays}日前`;
  return date.toLocaleDateString('ja-JP');
}

/**
 * Helper function to get activity icon
 */
function getActivityIcon(action: string): string {
  if (action.includes('property_created')) return 'fas fa-plus';
  if (action.includes('property_updated')) return 'fas fa-edit';
  if (action.includes('property_deleted')) return 'fas fa-trash';
  if (action.includes('analysis')) return 'fas fa-chart-line';
  if (action.includes('ocr')) return 'fas fa-camera';
  if (action.includes('itandi')) return 'fas fa-building';
  if (action.includes('stigma')) return 'fas fa-exclamation-triangle';
  if (action.includes('report')) return 'fas fa-file-alt';
  return 'fas fa-info-circle';
}

/**
 * Helper function to get activity color
 */
function getActivityColor(action: string): string {
  if (action.includes('created')) return 'bg-green-500';
  if (action.includes('updated')) return 'bg-blue-500';
  if (action.includes('deleted')) return 'bg-red-500';
  if (action.includes('analysis')) return 'bg-purple-500';
  if (action.includes('stigma')) return 'bg-orange-500';
  return 'bg-gray-500';
}

/**
 * Helper function to get activity label
 */
function getActivityLabel(action: string): string {
  const labels: Record<string, string> = {
    'property_created': '物件登録',
    'property_updated': '物件更新',
    'property_deleted': '物件削除',
    'analysis_completed': '分析完了',
    'ocr_completed': 'OCR実行',
    'itandi_completed': 'イタンジBB検索',
    'stigma_completed': '事故物件調査',
    'report_generated': 'レポート生成',
  };
  return labels[action] || 'アクティビティ';
}

/**
 * Dashboard home page
 */
dashboard.get('/', async (c) => {
  const user = c.get('user');
  const { env } = c;
  
  // データベースから統計情報を取得
  let propertyCount = 0;
  let analysisCount = 0;
  let reportCount = 0;
  let activities: any[] = [];
  
  try {
    // 物件数を取得
    const propertiesResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM properties WHERE user_id = ?'
    ).bind(user.id).first();
    propertyCount = propertiesResult?.count || 0;
    
    // 分析数を取得
    const analysesResult = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM analyses WHERE user_id = ?'
    ).bind(user.id).first();
    analysisCount = analysesResult?.count || 0;
    
    // レポート数を取得（実際には分析があればレポート生成可能なので、分析数と同じとする）
    reportCount = analysisCount;
    
    // アクティビティログを取得
    const activitiesResult = await env.DB.prepare(`
      SELECT action, details, created_at
      FROM activity_logs
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 10
    `).bind(user.id).all();
    activities = activitiesResult.results || [];
    
  } catch (error) {
    console.error('[Dashboard] Failed to fetch stats:', error);
    // エラーが発生してもダッシュボードは表示する
  }
  
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
        <!-- Header - iOS対応のレスポンシブデザイン -->
        <header class="bg-white shadow-sm sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between gap-2">
                    <!-- ロゴ - モバイルでは小さく表示 -->
                    <div class="flex items-center space-x-2 flex-shrink-0">
                        <img src="/static/icons/my-agent-analytics-full-logo.png" 
                             alt="My Agent Analytics" 
                             class="h-8 sm:h-12 object-contain" 
                             onerror="this.style.display='none';">
                        <h1 class="text-base sm:text-2xl font-bold whitespace-nowrap">
                            <span class="text-blue-600">My Agent</span>
                            <span class="text-gray-800 hidden sm:inline">Analytics</span>
                        </h1>
                    </div>
                    
                    <!-- ユーザー情報 - モバイル最適化 -->
                    <div class="flex items-center gap-2">
                        <!-- ユーザーアバターと名前 -->
                        <div class="flex items-center space-x-2">
                            ${user?.picture ? `
                            <img src="${user.picture}" 
                                 alt="${user?.name}" 
                                 class="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover border border-gray-300"
                                 onerror="this.onerror=null; this.src='data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2240%22 height=%2240%22%3E%3Crect fill=%22%236b7280%22 width=%2240%22 height=%2240%22/%3E%3Ctext fill=%22white%22 font-family=%22sans-serif%22 font-size=%2218%22 x=%2250%25%22 y=%2250%25%22 text-anchor=%22middle%22 dy=%22.3em%22%3E${user?.name?.charAt(0) || 'U'}%3C/text%3E%3C/svg%3E';">
                            ` : `
                            <div class="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-500 flex items-center justify-center text-white font-semibold text-sm sm:text-base">
                                ${user?.name?.charAt(0) || 'U'}
                            </div>
                            `}
                            <div class="hidden sm:block">
                                <p class="text-sm font-medium text-gray-900 truncate max-w-[120px]">${user?.name}</p>
                                <p class="text-xs text-gray-500 truncate max-w-[120px]">${user?.email}</p>
                            </div>
                        </div>
                        
                        <!-- モバイル用メニューボタン -->
                        ${user?.is_admin ? `
                        <a href="/admin" 
                           class="bg-red-500 text-white hover:bg-red-600 px-2 py-1.5 sm:px-3 sm:py-2 rounded text-xs sm:text-sm font-medium transition-colors whitespace-nowrap"
                           title="運営管理画面">
                            <i class="fas fa-shield-alt mr-1"></i><span class="hidden sm:inline">管理</span>
                        </a>
                        ` : ''}
                        <a href="/settings" 
                           class="text-gray-600 hover:text-gray-900 p-2 rounded hover:bg-gray-100"
                           title="設定">
                            <i class="fas fa-cog text-base sm:text-lg"></i>
                        </a>
                        <a href="/auth/logout" 
                           class="text-gray-600 hover:text-gray-900 p-2"
                           title="ログアウト">
                            <i class="fas fa-sign-out-alt text-base sm:text-lg"></i>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Welcome Section - モバイル最適化 -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 sm:p-8 mb-6 sm:mb-8 text-white">
                <h2 class="text-2xl sm:text-3xl font-bold mb-2">こんにちは、${user?.name?.split(' ')[0] || 'ユーザー'}さん！</h2>
                <p class="text-base sm:text-xl opacity-90">不動産投資分析を始めましょう</p>
            </div>

            <!-- Stats Grid - モバイルで2列、タブレットで4列 -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-3 sm:mb-4">
                        <div class="text-2xl sm:text-3xl text-blue-600">
                            <i class="fas fa-building"></i>
                        </div>
                        <span class="text-xs sm:text-sm text-gray-500">物件数</span>
                    </div>
                    <p class="text-2xl sm:text-3xl font-bold text-gray-900" id="propertyCount">${propertyCount}</p>
                    <p class="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">登録済み物件</p>
                </div>

                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-3 sm:mb-4">
                        <div class="text-2xl sm:text-3xl text-green-600">
                            <i class="fas fa-chart-line"></i>
                        </div>
                        <span class="text-xs sm:text-sm text-gray-500">分析数</span>
                    </div>
                    <p class="text-2xl sm:text-3xl font-bold text-gray-900" id="analysisCount">${analysisCount}</p>
                    <p class="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">実行済み分析</p>
                </div>

                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-3 sm:mb-4">
                        <div class="text-2xl sm:text-3xl text-purple-600">
                            <i class="fas fa-file-pdf"></i>
                        </div>
                        <span class="text-xs sm:text-sm text-gray-500">レポート</span>
                    </div>
                    <p class="text-2xl sm:text-3xl font-bold text-gray-900" id="reportCount">${reportCount}</p>
                    <p class="text-xs sm:text-sm text-gray-500 mt-1 sm:mt-2">生成済みレポート</p>
                </div>

                <div class="bg-white rounded-lg shadow p-4 sm:p-6">
                    <div class="flex items-center justify-between mb-3 sm:mb-4">
                        <div class="text-2xl sm:text-3xl text-orange-600">
                            <i class="fas fa-clock"></i>
                        </div>
                        <span class="text-xs sm:text-sm text-gray-500">最終ログイン</span>
                    </div>
                    <p class="text-base sm:text-xl font-bold text-gray-900">たった今</p>
                </div>
            </div>

            <!-- Quick Actions - モバイル最適化 -->
            <div class="bg-white rounded-lg shadow p-4 sm:p-8 mb-6 sm:mb-8">
                <h3 class="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">クイックアクション</h3>
                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
                    <a href="/properties/new" 
                       class="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 active:bg-blue-100 transition-colors touch-manipulation">
                        <div class="text-2xl sm:text-3xl text-blue-600 mr-3 sm:mr-4 flex-shrink-0">
                            <i class="fas fa-plus-circle"></i>
                        </div>
                        <div>
                            <p class="text-sm sm:text-base font-semibold text-gray-900">新規物件登録</p>
                            <p class="text-xs sm:text-sm text-gray-500">物件情報を入力</p>
                        </div>
                    </a>

                    <a href="/properties" 
                       class="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 active:bg-green-100 transition-colors touch-manipulation">
                        <div class="text-2xl sm:text-3xl text-green-600 mr-3 sm:mr-4 flex-shrink-0">
                            <i class="fas fa-list"></i>
                        </div>
                        <div>
                            <p class="text-sm sm:text-base font-semibold text-gray-900">物件一覧</p>
                            <p class="text-xs sm:text-sm text-gray-500">登録済み物件を表示</p>
                        </div>
                    </a>

                    <a href="/residential/evaluate" 
                       class="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-orange-500 hover:bg-orange-50 active:bg-orange-100 transition-colors touch-manipulation">
                        <div class="text-2xl sm:text-3xl text-orange-600 mr-3 sm:mr-4 flex-shrink-0">
                            <i class="fas fa-home"></i>
                        </div>
                        <div>
                            <p class="text-sm sm:text-base font-semibold text-gray-900">実需用不動産評価</p>
                            <p class="text-xs sm:text-sm text-gray-500">取引事例比較・原価法</p>
                        </div>
                    </a>

                    <a href="/itandi/rental-market" 
                       class="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 active:bg-indigo-100 transition-colors touch-manipulation">
                        <div class="text-2xl sm:text-3xl text-indigo-600 mr-3 sm:mr-4 flex-shrink-0">
                            <i class="fas fa-building"></i>
                        </div>
                        <div>
                            <p class="text-sm sm:text-base font-semibold text-gray-900">イタンジBB 賃貸相場<span class="ml-2 text-xs bg-indigo-500 text-white px-2 py-1 rounded">NEW</span></p>
                            <p class="text-xs sm:text-sm text-gray-500">賃貸市場分析・推移グラフ</p>
                        </div>
                    </a>

                    <a href="/stigma/check" 
                       class="flex items-center p-3 sm:p-4 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 active:bg-red-100 transition-colors touch-manipulation">
                        <div class="text-2xl sm:text-3xl text-red-600 mr-3 sm:mr-4 flex-shrink-0">
                            <i class="fas fa-exclamation-triangle"></i>
                        </div>
                        <div>
                            <p class="text-sm sm:text-base font-semibold text-gray-900">事故物件調査<span class="ml-2 text-xs bg-red-500 text-white px-2 py-1 rounded">NEW</span></p>
                            <p class="text-xs sm:text-sm text-gray-500">心理的瑕疵・AI調査</p>
                        </div>
                    </a>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="bg-white rounded-lg shadow p-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6">最近のアクティビティ</h3>
                ${activities.length === 0 ? `
                <div class="text-center py-12 text-gray-500">
                    <i class="fas fa-inbox text-6xl mb-4 opacity-50"></i>
                    <p>まだアクティビティがありません</p>
                    <p class="text-sm mt-2">物件を登録して分析を始めましょう</p>
                </div>
                ` : `
                <div class="space-y-4">
                    ${activities.map((activity: any) => {
                      const date = new Date(activity.created_at);
                      const timeAgo = getTimeAgo(date);
                      const icon = getActivityIcon(activity.action);
                      const color = getActivityColor(activity.action);
                      
                      return `
                        <div class="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div class="flex-shrink-0">
                                <div class="${color} rounded-full p-2 w-10 h-10 flex items-center justify-center">
                                    <i class="${icon} text-white"></i>
                                </div>
                            </div>
                            <div class="flex-1 min-w-0">
                                <p class="text-sm font-medium text-gray-900">
                                    ${getActivityLabel(activity.action)}
                                </p>
                                ${activity.details ? `
                                <p class="text-sm text-gray-600 mt-1">
                                    ${activity.details}
                                </p>
                                ` : ''}
                                <p class="text-xs text-gray-400 mt-1">
                                    ${timeAgo}
                                </p>
                            </div>
                        </div>
                      `;
                    }).join('')}
                </div>
                `}
            </div>
        </main>
    </body>
    </html>
  `);
});

export default dashboard;
