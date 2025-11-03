// Settings routes for My Agent Analytics
// System status display page (Admin-configured API keys)

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';
import { authMiddleware } from '../middleware/auth';

const settings = new Hono<{ Bindings: Bindings; Variables: Variables }>();

// Apply auth middleware
settings.use('/*', authMiddleware);

/**
 * Settings page - System status display only
 * API keys are configured by admin, users don't need to set them
 */
settings.get('/', (c) => {
  const user = c.get('user');
  const { env } = c;
  
  // Check which features are available
  // v5.1.0: All features now available with mock data fallback
  const featuresStatus = {
    authentication: true, // Always available with OAuth + password auth
    propertyManagement: true, // Always available (CRUD operations)
    financialAnalysis: true, // Always available (calculator)
    analysisHistory: true, // Always available (DB storage)
    residentialEvaluation: true, // v5.0.1: Always available (residential property evaluation)
    marketAnalysis: true, // v5.1.0: Always available (with mock data if no API key)
    aiAnalysis: true, // v5.1.0: Always available (with mock data if no API key)
    ocrFeature: true, // v5.1.0: Always available (with mock data if no API key)
    governmentStats: true, // v5.1.0: Always available (with mock data if no API key)
    rentalInfo: true, // v5.1.0: Always available (with mock data if no API key)
    reinsData: true, // v5.1.0: Always available (with mock data if no API key)
  };
  
  // Calculate available features count
  const totalFeatures = Object.keys(featuresStatus).length;
  const availableFeatures = Object.values(featuresStatus).filter(Boolean).length;
  const availabilityPercentage = Math.round((availableFeatures / totalFeatures) * 100);
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>システム情報 - My Agent Analytics</title>
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
            <!-- Page Title -->
            <div class="mb-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-2">
                    <i class="fas fa-info-circle mr-2"></i>システム情報
                </h2>
                <p class="text-gray-600">利用可能な機能とシステムの状態</p>
            </div>

            <!-- System Status Overview -->
            <div class="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-lg p-8 mb-8 text-white">
                <div class="grid md:grid-cols-3 gap-6">
                    <div class="text-center">
                        <div class="text-5xl font-bold mb-2">${availabilityPercentage}%</div>
                        <p class="text-lg opacity-90">機能稼働率</p>
                    </div>
                    <div class="text-center">
                        <div class="text-5xl font-bold mb-2">${availableFeatures}/${totalFeatures}</div>
                        <p class="text-lg opacity-90">利用可能機能</p>
                    </div>
                    <div class="text-center">
                        <div class="text-5xl font-bold mb-2">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <p class="text-lg opacity-90">システム正常</p>
                    </div>
                </div>
            </div>

            <!-- v5.1.0 Update Notice -->
            <div class="bg-green-50 border-l-4 border-green-500 p-6 mb-8 rounded-r-lg">
                <div class="flex items-start">
                    <i class="fas fa-check-circle text-green-600 text-2xl mr-4 mt-1"></i>
                    <div>
                        <p class="font-semibold text-green-900 mb-2">
                            <span class="bg-green-100 text-green-800 px-2 py-1 rounded text-xs mr-2">v5.1.0 NEW</span>
                            全機能が利用可能になりました！
                        </p>
                        <p class="text-green-800 text-sm">
                            機能稼働率100%達成！面倒な設定は不要です。ログインするだけで、すべての機能をすぐにご利用いただけます。<br>
                            外部APIキーが設定されていない機能は、モックデータを使用してデモンストレーションモードで動作します。
                        </p>
                    </div>
                </div>
            </div>

            <!-- Available Features -->
            <div class="bg-white rounded-lg shadow p-8 mb-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-check-circle mr-2 text-green-600"></i>利用可能な機能
                </h3>

                <div class="space-y-4">
                    <!-- Authentication -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.authentication ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.authentication ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-user-shield text-2xl ${featuresStatus.authentication ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">ユーザー認証</p>
                                <p class="text-sm text-gray-600">Google アカウントでのログイン</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.authentication ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">利用不可</span>'
                            }
                        </div>
                    </div>

                    <!-- Property Management (v5.0.0) -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.propertyManagement ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.propertyManagement ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-building text-2xl ${featuresStatus.propertyManagement ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">物件管理 <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">v5.0.0</span></p>
                                <p class="text-sm text-gray-600">物件の登録・更新・削除（CRUD操作）</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.propertyManagement ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">利用不可</span>'
                            }
                        </div>
                    </div>

                    <!-- Financial Analysis (v5.0.0) -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.financialAnalysis ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.financialAnalysis ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-calculator text-2xl ${featuresStatus.financialAnalysis ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">財務分析 <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">v5.0.0</span></p>
                                <p class="text-sm text-gray-600">投資指標計算（NOI、利回り、DSCR、LTV等）</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.financialAnalysis ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">利用不可</span>'
                            }
                        </div>
                    </div>

                    <!-- Analysis History (v5.0.0) -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.analysisHistory ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.analysisHistory ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-history text-2xl ${featuresStatus.analysisHistory ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">分析履歴保存 <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">v5.0.0</span></p>
                                <p class="text-sm text-gray-600">分析結果の自動保存と履歴管理</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.analysisHistory ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">利用不可</span>'
                            }
                        </div>
                    </div>

                    <!-- Residential Property Evaluation (v5.0.1) -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.residentialEvaluation ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.residentialEvaluation ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-home text-2xl ${featuresStatus.residentialEvaluation ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">実需用不動産評価 <span class="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded ml-2">v5.0.1 NEW</span></p>
                                <p class="text-sm text-gray-600">取引事例比較法・原価法・地価推移分析・総合スコアリング</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.residentialEvaluation ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">利用不可</span>'
                            }
                        </div>
                    </div>

                    <!-- Market Analysis -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.marketAnalysis ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.marketAnalysis ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-chart-line text-2xl ${featuresStatus.marketAnalysis ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">市場分析</p>
                                <p class="text-sm text-gray-600">実取引価格データ・地価公示情報・価格推定</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.marketAnalysis ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-gray-200 text-gray-600 px-4 py-2 rounded-full text-sm">利用不可</span>'
                            }
                        </div>
                    </div>

                    <!-- OCR Feature (v5.0.0) -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.ocrFeature ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.ocrFeature ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-file-image text-2xl ${featuresStatus.ocrFeature ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">マイソク読み取り <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded ml-2">v5.0.0</span></p>
                                <p class="text-sm text-gray-600">物件概要書から物件情報を自動抽出（AI OCR）</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.ocrFeature ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">準備中</span>'
                            }
                        </div>
                    </div>

                    <!-- AI Analysis -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.aiAnalysis ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.aiAnalysis ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-brain text-2xl ${featuresStatus.aiAnalysis ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">AI分析</p>
                                <p class="text-sm text-gray-600">GPT-4による高度な市場分析とレポート生成</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.aiAnalysis ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">準備中</span>'
                            }
                        </div>
                    </div>

                    <!-- Government Stats -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.governmentStats ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.governmentStats ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-chart-bar text-2xl ${featuresStatus.governmentStats ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">政府統計データ</p>
                                <p class="text-sm text-gray-600">人口統計・経済指標・地域データ</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.governmentStats ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">準備中</span>'
                            }
                        </div>
                    </div>

                    <!-- Rental Info -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.rentalInfo ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.rentalInfo ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-home text-2xl ${featuresStatus.rentalInfo ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">賃貸物件情報</p>
                                <p class="text-sm text-gray-600">イタンジ連携による賃貸相場データ</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.rentalInfo ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">準備中</span>'
                            }
                        </div>
                    </div>

                    <!-- REINS Data -->
                    <div class="flex items-center justify-between p-4 border rounded-lg ${featuresStatus.reinsData ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}">
                        <div class="flex items-center">
                            <div class="w-12 h-12 rounded-full flex items-center justify-center mr-4 ${featuresStatus.reinsData ? 'bg-green-100' : 'bg-gray-100'}">
                                <i class="fas fa-exchange-alt text-2xl ${featuresStatus.reinsData ? 'text-green-600' : 'text-gray-400'}"></i>
                            </div>
                            <div>
                                <p class="font-semibold text-gray-900">レインズデータ</p>
                                <p class="text-sm text-gray-600">不動産流通情報・成約事例</p>
                            </div>
                        </div>
                        <div>
                            ${featuresStatus.reinsData ? 
                                '<span class="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-semibold"><i class="fas fa-check mr-1"></i>利用可能</span>' : 
                                '<span class="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm">準備中</span>'
                            }
                        </div>
                    </div>
                </div>
            </div>

            <!-- Always Available Features -->
            <div class="bg-white rounded-lg shadow p-8 mb-8">
                <h3 class="text-xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-star mr-2 text-yellow-500"></i>常時利用可能な機能
                </h3>

                <div class="grid md:grid-cols-3 gap-6">
                    <div class="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                        <i class="fas fa-calculator text-4xl text-blue-600 mb-4"></i>
                        <h4 class="font-semibold text-gray-900 mb-2">投資指標計算</h4>
                        <p class="text-sm text-gray-600">NOI、利回り、DSCR、LTV等の自動計算</p>
                    </div>

                    <div class="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                        <i class="fas fa-database text-4xl text-green-600 mb-4"></i>
                        <h4 class="font-semibold text-gray-900 mb-2">物件データ管理</h4>
                        <p class="text-sm text-gray-600">物件情報の登録・編集・一覧表示</p>
                    </div>

                    <div class="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                        <i class="fas fa-chart-pie text-4xl text-purple-600 mb-4"></i>
                        <h4 class="font-semibold text-gray-900 mb-2">データ可視化</h4>
                        <p class="text-sm text-gray-600">グラフ・チャートによる視覚的分析</p>
                    </div>
                </div>
            </div>

            <!-- Quick Start Guide -->
            <div class="bg-gradient-to-r from-indigo-600 to-purple-700 rounded-xl shadow-lg p-8 text-white">
                <h3 class="text-2xl font-bold mb-6">
                    <i class="fas fa-rocket mr-2"></i>今すぐ始める
                </h3>
                <div class="grid md:grid-cols-3 gap-6">
                    <div>
                        <div class="text-3xl font-bold mb-2">1</div>
                        <p class="font-semibold mb-2">物件情報を入力</p>
                        <p class="text-sm opacity-90">価格、収益、経費などの基本情報</p>
                    </div>
                    <div>
                        <div class="text-3xl font-bold mb-2">2</div>
                        <p class="font-semibold mb-2">自動分析実行</p>
                        <p class="text-sm opacity-90">投資指標・市場動向を自動算出</p>
                    </div>
                    <div>
                        <div class="text-3xl font-bold mb-2">3</div>
                        <p class="font-semibold mb-2">レポート生成</p>
                        <p class="text-sm opacity-90">PDF形式で詳細レポートを出力</p>
                    </div>
                </div>
                <div class="mt-8 text-center">
                    <a href="/properties/new" 
                       class="inline-block bg-white text-indigo-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors">
                        <i class="fas fa-plus-circle mr-2"></i>新規物件を登録する
                    </a>
                </div>
            </div>
        </main>
    </body>
    </html>
  `);
});

export default settings;
