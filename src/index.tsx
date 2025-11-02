import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, Variables } from './types'
import auth from './routes/auth'
import dashboard from './routes/dashboard'
import { cacheMiddleware, CacheStrategy } from './lib/cache'

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>()

// Enable CORS for API routes
app.use('/api/*', cors())

// Apply caching to static assets
app.use('/static/*', cacheMiddleware(CacheStrategy.STATIC))

// Apply caching to API health check
app.use('/api/health', cacheMiddleware(CacheStrategy.API))

// Serve static files from public/static directory
app.use('/static/*', serveStatic({ root: './public' }))

// Serve Service Worker - use serveStatic with rewrite
app.use('/sw.js', serveStatic({ path: 'sw.js', rewriteRequestPath: () => '/sw.js' }))

// Auth routes (no auth middleware needed)
app.route('/auth', auth)

// Dashboard routes (requires authentication)
app.route('/dashboard', dashboard)

// API routes
import apiRoutes from './routes/api'
app.route('/api', apiRoutes)

// Properties routes (requires authentication)
import properties from './routes/properties'
app.route('/properties', properties)

// Settings routes (requires authentication)
import settings from './routes/settings'
app.route('/settings', settings)

// Agents routes (requires authentication)
import agentsRoutes from './routes/agents'
app.route('/agents', agentsRoutes)

// Shared reports routes (public, no auth required)
import sharedRoutes from './routes/shared'
app.route('/shared', sharedRoutes)

// Templates routes (requires authentication)
import templatesRoutes from './routes/templates'
app.route('/templates', templatesRoutes)

// Admin routes (requires admin authentication)
import adminRoutes from './routes/admin'
app.route('/admin', adminRoutes)

// API routes
app.get('/api/health', (c) => {
  return c.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    version: '2.0.2'
  })
})

app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from My Agent Analytics!' })
})

// Home page
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
        <title>My Agent Analytics - 不動産投資分析プラットフォーム</title>
        <meta name="description" content="AIエージェントによる不動産データ分析・可視化プラットフォーム">
        
        <!-- Favicon - Multi-size for all browsers -->
        <link rel="icon" type="image/png" sizes="16x16" href="/static/icons/favicon-16.png">
        <link rel="icon" type="image/png" sizes="32x32" href="/static/icons/favicon-32.png">
        <link rel="icon" type="image/png" sizes="192x192" href="/static/icons/icon-192.png">
        
        <!-- Apple Touch Icon - iOS Safari -->
        <link rel="apple-touch-icon" href="/static/icons/apple-touch-icon.png">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="default">
        <meta name="apple-mobile-web-app-title" content="MAA">
        
        <!-- PWA Manifest -->
        <link rel="manifest" href="/static/manifest.json">
        
        <!-- Theme Color - Multi-OS support (matches logo blue) -->
        <meta name="theme-color" content="#2c5f7f">
        <meta name="msapplication-TileColor" content="#2c5f7f">
        <meta name="msapplication-TileImage" content="/static/icons/icon-192.png">
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body {
                font-family: 'Noto Sans JP', sans-serif;
            }
        </style>
    </head>
    <body class="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen">
        <!-- Header -->
        <header class="bg-white shadow-md">
            <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-4">
                        <img src="/static/icons/header-logo.png" alt="My Agent Analytics" class="h-16" style="height: auto; max-height: 64px;">
                    </div>
                    <a href="/auth/login" class="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors inline-block">
                        <i class="fas fa-sign-in-alt mr-2"></i>ログイン
                    </a>
                </div>
            </div>
        </header>

        <!-- Hero Section -->
        <main class="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
            <div class="text-center mb-12">
                <h2 class="text-4xl font-bold text-gray-900 mb-4">
                    AIを活用した不動産投資分析
                </h2>
                <p class="text-xl text-gray-700 mb-8">
                    物件データを入力するだけで、包括的な市場分析レポートを自動生成
                </p>
                <a href="/auth/login" class="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all transform hover:scale-105 inline-block">
                    <i class="fas fa-rocket mr-2"></i>今すぐ始める
                </a>
            </div>

            <!-- Features Grid -->
            <div class="grid md:grid-cols-3 gap-8 mb-12">
                <!-- Feature 1 -->
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-blue-600 text-4xl mb-4">
                        <i class="fas fa-calculator"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">自動計算</h3>
                    <p class="text-gray-600">
                        NOI、利回り、DSCR、LTVなどの投資指標を自動計算。複雑な計算も一瞬で完了します。
                    </p>
                </div>

                <!-- Feature 2 -->
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-green-600 text-4xl mb-4">
                        <i class="fas fa-chart-line"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">データ可視化</h3>
                    <p class="text-gray-600">
                        インタラクティブなグラフとチャートで、投資リターンとリスクを視覚的に理解できます。
                    </p>
                </div>

                <!-- Feature 3 -->
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-purple-600 text-4xl mb-4">
                        <i class="fas fa-file-pdf"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">PDFレポート</h3>
                    <p class="text-gray-600">
                        プロフェッショナルなPDFレポートを生成。投資家や金融機関への提案資料として活用できます。
                    </p>
                </div>

                <!-- Feature 4 -->
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-orange-600 text-4xl mb-4">
                        <i class="fas fa-chart-area"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">市場分析</h3>
                    <p class="text-gray-600">
                        国土交通省の実取引価格データ・地価公示情報を活用した市場動向分析と価格推定。
                    </p>
                </div>

                <!-- Feature 5 -->
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-red-600 text-4xl mb-4">
                        <i class="fas fa-robot"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">AI分析</h3>
                    <p class="text-gray-600">
                        OpenAI GPT-4を活用した高度な市場分析と投資判断サポート。
                    </p>
                </div>

                <!-- Feature 6 -->
                <div class="bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                    <div class="text-teal-600 text-4xl mb-4">
                        <i class="fas fa-mobile-alt"></i>
                    </div>
                    <h3 class="text-xl font-bold text-gray-900 mb-2">PWA対応</h3>
                    <p class="text-gray-600">
                        スマートフォンにインストール可能。オフラインでも基本機能を利用できます。
                    </p>
                </div>
            </div>

            <!-- Stats Section -->
            <div class="bg-white rounded-xl shadow-lg p-8 mb-12">
                <h3 class="text-2xl font-bold text-gray-900 mb-6 text-center">システムステータス</h3>
                <div class="grid md:grid-cols-4 gap-6 text-center">
                    <div>
                        <div class="text-4xl font-bold text-blue-600 mb-2">99.9%</div>
                        <div class="text-gray-600">稼働率</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-green-600 mb-2">&lt;500ms</div>
                        <div class="text-gray-600">API応答時間</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-purple-600 mb-2">1,000+</div>
                        <div class="text-gray-600">分析済み物件</div>
                    </div>
                    <div>
                        <div class="text-4xl font-bold text-orange-600 mb-2">24/7</div>
                        <div class="text-gray-600">サポート</div>
                    </div>
                </div>
            </div>

            <!-- CTA Section -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-2xl p-12 text-center text-white">
                <h3 class="text-3xl font-bold mb-4">今すぐ無料で始めましょう</h3>
                <p class="text-xl mb-8 opacity-90">
                    アカウント作成は30秒。クレジットカード不要。
                </p>
                <a href="/auth/login" class="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 rounded-lg text-lg font-semibold shadow-lg transition-all transform hover:scale-105 inline-block">
                    <i class="fas fa-user-plus mr-2"></i>無料アカウント作成
                </a>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-gray-900 text-white mt-20">
            <div class="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                <div class="grid md:grid-cols-4 gap-8">
                    <div>
                        <h4 class="text-lg font-bold mb-4">My Agent Analytics</h4>
                        <p class="text-gray-400 text-sm">
                            不動産投資をスマートに。AIを活用した次世代の分析プラットフォーム。
                        </p>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">製品</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" class="hover:text-white">機能一覧</a></li>
                            <li><a href="#" class="hover:text-white">料金プラン</a></li>
                            <li><a href="#" class="hover:text-white">API</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">サポート</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" class="hover:text-white">ヘルプセンター</a></li>
                            <li><a href="#" class="hover:text-white">ドキュメント</a></li>
                            <li><a href="#" class="hover:text-white">お問い合わせ</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-lg font-bold mb-4">企業情報</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="#" class="hover:text-white">会社概要</a></li>
                            <li><a href="#" class="hover:text-white">プライバシーポリシー</a></li>
                            <li><a href="#" class="hover:text-white">利用規約</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; 2025 My Agent Analytics. All rights reserved.</p>
                </div>
            </div>
        </footer>

        <script>
            // Service Worker registration for PWA
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/sw.js')
                        .then(reg => console.log('Service Worker registered:', reg))
                        .catch(err => console.error('Service Worker registration failed:', err));
                });
            }

            // Test API connection
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    console.log('API Health Check:', data);
                })
                .catch(err => console.error('API Error:', err));
        </script>
    </body>
    </html>
  `)
})

export default app
