// Settings routes for My Agent Analytics
// API key configuration page

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const settings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware
settings.use('/*', authMiddleware);

/**
 * Settings page with API key configuration
 */
settings.get('/', (c) => {
  const user = c.get('user');
  const { env } = c;
  
  // Check which API keys are configured
  const apiKeysStatus = {
    googleOAuth: !!(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
    reinfolib: !!env.REINFOLIB_API_KEY,
    openai: !!env.OPENAI_API_KEY,
    estat: !!env.ESTAT_API_KEY,
    itandi: !!env.ITANDI_API_KEY,
    reins: !!(env.REINS_LOGIN_ID && env.REINS_PASSWORD),
    session: !!env.SESSION_SECRET,
  };
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>設定 - My Agent Analytics</title>
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
                        <a href="/dashboard">
                            <img src="/static/icons/header-logo.png?v=${Date.now()}" alt="My Agent Analytics" class="h-12" style="height: auto; max-height: 48px;">
                        </a>
                    </div>
                    <div class="flex items-center space-x-4">
                        <a href="/dashboard" class="text-gray-600 hover:text-gray-900">
                            <i class="fas fa-home mr-2"></i>ダッシュボード
                        </a>
                        <div class="flex items-center space-x-3">
                            <img src="${user?.picture || 'https://via.placeholder.com/40'}" 
                                 alt="${user?.name}" 
                                 class="h-10 w-10 rounded-full">
                            <div>
                                <p class="text-sm font-medium text-gray-900">${user?.name}</p>
                            </div>
                        </div>
                        <a href="/auth/logout" class="text-sm text-gray-600 hover:text-gray-900">
                            <i class="fas fa-sign-out-alt"></i>
                        </a>
                    </div>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">
                    <i class="fas fa-cog mr-2"></i>設定
                </h2>
                <p class="text-gray-600">APIキーとアプリケーション設定</p>
            </div>

            <!-- API Keys Section -->
            <div class="bg-white rounded-lg shadow p-8 mb-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-key mr-2"></i>APIキー設定状況
                </h3>

                <div class="mb-6 p-4 bg-blue-50 border-l-4 border-blue-500 text-blue-700">
                    <p class="font-semibold mb-2">
                        <i class="fas fa-info-circle mr-2"></i>注意
                    </p>
                    <p class="text-sm">
                        セキュリティ上の理由から、APIキーの値は表示されません。<br>
                        本番環境では<strong>Cloudflare Dashboard</strong>または<strong>Wrangler CLI</strong>で設定してください。
                    </p>
                </div>

                <!-- Required API Keys -->
                <div class="mb-8">
                    <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                        <span class="bg-red-100 text-red-800 text-xs px-2 py-1 rounded mr-2">必須</span>
                        必須APIキー
                    </h4>
                    
                    <div class="space-y-4">
                        <!-- Google OAuth -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.googleOAuth ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-google text-2xl mr-4 ${apiKeysStatus.googleOAuth ? 'text-green-600' : 'text-red-600'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">Google OAuth</p>
                                    <p class="text-sm text-gray-600">ログイン認証に必要</p>
                                </div>
                            </div>
                            <div class="flex items-center">
                                ${apiKeysStatus.googleOAuth ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-times mr-1"></i>未設定</span>'
                                }
                            </div>
                        </div>

                        <!-- REINFOLIB -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.reinfolib ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-building text-2xl mr-4 ${apiKeysStatus.reinfolib ? 'text-green-600' : 'text-red-600'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">不動産情報ライブラリAPI</p>
                                    <p class="text-sm text-gray-600">市場分析・取引価格データに必要</p>
                                </div>
                            </div>
                            <div class="flex items-center">
                                ${apiKeysStatus.reinfolib ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-times mr-1"></i>未設定</span>'
                                }
                            </div>
                        </div>

                        <!-- Session Secret -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.session ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-lock text-2xl mr-4 ${apiKeysStatus.session ? 'text-green-600' : 'text-red-600'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">Session Secret</p>
                                    <p class="text-sm text-gray-600">セッション管理に必要</p>
                                </div>
                            </div>
                            <div class="flex items-center">
                                ${apiKeysStatus.session ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-red-100 text-red-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-times mr-1"></i>未設定</span>'
                                }
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Optional API Keys -->
                <div>
                    <h4 class="font-semibold text-gray-900 mb-4 flex items-center">
                        <span class="bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded mr-2">任意</span>
                        任意APIキー
                    </h4>
                    
                    <div class="space-y-4">
                        <!-- OpenAI -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.openai ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-brain text-2xl mr-4 ${apiKeysStatus.openai ? 'text-green-600' : 'text-gray-400'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">OpenAI API</p>
                                    <p class="text-sm text-gray-600">AI分析機能に必要</p>
                                </div>
                            </div>
                            <div>
                                ${apiKeysStatus.openai ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">未設定</span>'
                                }
                            </div>
                        </div>

                        <!-- e-Stat -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.estat ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-chart-bar text-2xl mr-4 ${apiKeysStatus.estat ? 'text-green-600' : 'text-gray-400'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">e-Stat API</p>
                                    <p class="text-sm text-gray-600">政府統計データに必要</p>
                                </div>
                            </div>
                            <div>
                                ${apiKeysStatus.estat ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">未設定</span>'
                                }
                            </div>
                        </div>

                        <!-- Itandi -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.itandi ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-home text-2xl mr-4 ${apiKeysStatus.itandi ? 'text-green-600' : 'text-gray-400'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">イタンジAPI</p>
                                    <p class="text-sm text-gray-600">賃貸物件情報に必要</p>
                                </div>
                            </div>
                            <div>
                                ${apiKeysStatus.itandi ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">未設定</span>'
                                }
                            </div>
                        </div>

                        <!-- REINS -->
                        <div class="flex items-center justify-between p-4 border rounded-lg ${apiKeysStatus.reins ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                            <div class="flex items-center">
                                <i class="fas fa-exchange-alt text-2xl mr-4 ${apiKeysStatus.reins ? 'text-green-600' : 'text-gray-400'}"></i>
                                <div>
                                    <p class="font-semibold text-gray-900">レインズ</p>
                                    <p class="text-sm text-gray-600">不動産流通情報に必要</p>
                                </div>
                            </div>
                            <div>
                                ${apiKeysStatus.reins ? 
                                    '<span class="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>設定済み</span>' : 
                                    '<span class="bg-gray-200 text-gray-600 px-3 py-1 rounded-full text-sm">未設定</span>'
                                }
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Setup Instructions -->
            <div class="grid md:grid-cols-2 gap-8">
                <!-- Local Development -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">
                        <i class="fas fa-laptop-code mr-2 text-blue-600"></i>ローカル開発環境
                    </h3>
                    <div class="space-y-4">
                        <div class="bg-gray-50 rounded p-4">
                            <p class="text-sm font-semibold mb-2">1. .dev.vars ファイルを編集</p>
                            <pre class="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto"><code>REINFOLIB_API_KEY=your-api-key-here
GOOGLE_CLIENT_ID=your-client-id
SESSION_SECRET=$(openssl rand -base64 32)</code></pre>
                        </div>
                        <div class="bg-gray-50 rounded p-4">
                            <p class="text-sm font-semibold mb-2">2. サービスを再起動</p>
                            <pre class="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto"><code>pm2 restart my-agent-analytics</code></pre>
                        </div>
                        <a href="https://github.com/koki-187/My-Agent-Analitics-genspark/blob/main/API_KEY_SETUP.md" 
                           target="_blank"
                           class="block text-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition-colors">
                            <i class="fas fa-book mr-2"></i>詳細ガイドを見る
                        </a>
                    </div>
                </div>

                <!-- Production -->
                <div class="bg-white rounded-lg shadow p-6">
                    <h3 class="text-lg font-bold text-gray-900 mb-4">
                        <i class="fas fa-cloud mr-2 text-orange-600"></i>本番環境 (Cloudflare)
                    </h3>
                    <div class="space-y-4">
                        <div class="bg-gray-50 rounded p-4">
                            <p class="text-sm font-semibold mb-2">Wrangler CLIで設定</p>
                            <pre class="text-xs bg-gray-900 text-green-400 p-3 rounded overflow-x-auto"><code>npx wrangler pages secret put \\
  REINFOLIB_API_KEY \\
  --project-name webapp</code></pre>
                        </div>
                        <div class="bg-gray-50 rounded p-4">
                            <p class="text-sm font-semibold mb-2">または Cloudflare Dashboard</p>
                            <p class="text-xs text-gray-600">Workers & Pages → webapp → Settings → Environment variables</p>
                        </div>
                        <a href="https://dash.cloudflare.com/" 
                           target="_blank"
                           class="block text-center bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded transition-colors">
                            <i class="fas fa-external-link-alt mr-2"></i>Cloudflare Dashboard
                        </a>
                    </div>
                </div>
            </div>

            <!-- Quick Links -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-lg shadow-lg p-8 mt-8 text-white">
                <h3 class="text-xl font-bold mb-4">
                    <i class="fas fa-link mr-2"></i>APIキー取得方法
                </h3>
                <div class="grid md:grid-cols-3 gap-4">
                    <a href="https://console.cloud.google.com/" target="_blank" 
                       class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded p-4 transition-all">
                        <p class="font-semibold mb-1">Google Cloud Console</p>
                        <p class="text-sm opacity-90">OAuth認証情報を取得</p>
                    </a>
                    <a href="https://www.reinfolib.mlit.go.jp/" target="_blank" 
                       class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded p-4 transition-all">
                        <p class="font-semibold mb-1">不動産情報ライブラリ</p>
                        <p class="text-sm opacity-90">APIキーを申請</p>
                    </a>
                    <a href="https://platform.openai.com/" target="_blank" 
                       class="bg-white bg-opacity-20 hover:bg-opacity-30 rounded p-4 transition-all">
                        <p class="font-semibold mb-1">OpenAI Platform</p>
                        <p class="text-sm opacity-90">APIキーを生成</p>
                    </a>
                </div>
            </div>
        </main>
    </body>
    </html>
  `);
});

export default settings;
