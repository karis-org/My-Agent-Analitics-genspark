/**
 * Properties Layout Components
 * 物件ページ共通レイアウト
 */

export interface LayoutOptions {
  title: string;
  user: any;
  additionalHead?: string;
  bodyClass?: string;
}

/**
 * 基本HTMLレイアウト
 */
export function renderLayout(options: LayoutOptions, content: string): string {
  const { title, user, additionalHead = '', bodyClass = 'bg-gray-50' } = options;
  
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title} - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
            .touch-manipulation { touch-action: manipulation; }
        </style>
        ${additionalHead}
    </head>
    <body class="${bodyClass}">
        ${renderHeader(user, title)}
        ${content}
    </body>
    </html>
  `;
}

/**
 * ヘッダーコンポーネント（iOS対応）
 */
export function renderHeader(user: any, pageTitle: string): string {
  return `
    <header class="bg-white shadow-sm sticky top-0 z-50">
        <div class="max-w-7xl mx-auto px-3 py-3 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between gap-2">
                <div class="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                    <a href="/dashboard" class="flex-shrink-0">
                        <img src="/static/icons/app-icon.png" 
                             alt="My Agent Analytics" 
                             class="h-8 w-8 sm:h-12 sm:w-12 object-contain">
                    </a>
                    <h1 class="text-lg sm:text-2xl font-bold text-gray-900">${pageTitle}</h1>
                </div>
                <div class="flex items-center gap-2">
                    ${renderHeaderActions()}
                    <a href="/dashboard" 
                       class="text-gray-600 hover:text-gray-900 p-2"
                       title="ダッシュボード">
                        <i class="fas fa-home text-base sm:text-lg"></i>
                    </a>
                </div>
            </div>
        </div>
    </header>
  `;
}

/**
 * ヘッダーアクション（ページによって異なる）
 */
function renderHeaderActions(): string {
  // デフォルトでは空
  // 各ページで上書き可能
  return '';
}

/**
 * ローディングインジケーター
 */
export function renderLoadingIndicator(): string {
  return `
    <div id="loadingIndicator" class="hidden fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg p-6 sm:p-8 flex flex-col items-center">
            <div class="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-2 border-blue-600 mb-4"></div>
            <p class="text-sm sm:text-base text-gray-700">処理中...</p>
        </div>
    </div>
  `;
}

/**
 * エラーメッセージ表示
 */
export function renderErrorMessage(message: string): string {
  return `
    <div class="bg-red-50 border-l-4 border-red-500 p-4 mb-4">
        <div class="flex items-center">
            <i class="fas fa-exclamation-circle text-red-500 mr-3"></i>
            <p class="text-sm sm:text-base text-red-700">${message}</p>
        </div>
    </div>
  `;
}

/**
 * 成功メッセージ表示
 */
export function renderSuccessMessage(message: string): string {
  return `
    <div class="bg-green-50 border-l-4 border-green-500 p-4 mb-4">
        <div class="flex items-center">
            <i class="fas fa-check-circle text-green-500 mr-3"></i>
            <p class="text-sm sm:text-base text-green-700">${message}</p>
        </div>
    </div>
  `;
}
