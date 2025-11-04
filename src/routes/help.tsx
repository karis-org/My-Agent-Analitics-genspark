// Help and tutorial routes for My Agent Analytics

import { Hono } from 'hono';
import type { Bindings, Variables } from '../types';

const help = new Hono<{ Bindings: Bindings; Variables: Variables }>();

/**
 * Help/Tutorial page
 */
help.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>使い方ガイド - My Agent Analytics</title>
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
                            <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-12 w-12" style="object-fit: contain;">
                        </a>
                        <h1 class="text-2xl font-bold text-gray-900">使い方ガイド</h1>
                    </div>
                    <a href="/dashboard" class="text-gray-600 hover:text-gray-900">
                        <i class="fas fa-home"></i>
                    </a>
                </div>
            </div>
        </header>

        <!-- Main Content -->
        <main class="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
            <!-- Quick Start -->
            <div class="bg-white rounded-lg shadow p-8 mb-6">
                <h2 class="text-3xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-rocket text-blue-600 mr-3"></i>クイックスタート
                </h2>
                <div class="space-y-6">
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            1
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">物件を登録する</h3>
                            <p class="text-gray-600">「新規物件登録」ボタンから物件情報を入力します。マイソクや物件概要書をアップロードすると、自動的に情報が入力されます。</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            2
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">分析を実行する</h3>
                            <p class="text-gray-600">登録した物件の「分析」ボタンをクリックし、収支シミュレーションのパラメータを入力します。</p>
                        </div>
                    </div>
                    
                    <div class="flex items-start space-x-4">
                        <div class="flex-shrink-0 w-10 h-10 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">
                            3
                        </div>
                        <div class="flex-1">
                            <h3 class="text-lg font-semibold text-gray-900 mb-2">結果を確認する</h3>
                            <p class="text-gray-600">利回り、NOI、キャッシュフローなどの投資指標が自動計算され、グラフィカルに表示されます。</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Main Features -->
            <div class="bg-white rounded-lg shadow p-8 mb-6">
                <h2 class="text-3xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-star text-yellow-500 mr-3"></i>主な機能
                </h2>
                <div class="grid md:grid-cols-2 gap-6">
                    <div class="border-l-4 border-blue-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            <i class="fas fa-file-image text-blue-600 mr-2"></i>マイソク読み取り
                        </h3>
                        <p class="text-gray-600">物件概要書をアップロードすると、AIが自動的に物件情報を抽出し、フォームに入力します。</p>
                    </div>
                    
                    <div class="border-l-4 border-green-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            <i class="fas fa-calculator text-green-600 mr-2"></i>投資指標計算
                        </h3>
                        <p class="text-gray-600">利回り、NOI、ROI、DSCR、LTVなど、不動産投資に必要な指標を自動計算します。</p>
                    </div>
                    
                    <div class="border-l-4 border-purple-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            <i class="fas fa-chart-line text-purple-600 mr-2"></i>市場分析
                        </h3>
                        <p class="text-gray-600">実取引価格データ、地価公示、価格推定など、市場データに基づく分析が可能です。</p>
                    </div>
                    
                    <div class="border-l-4 border-red-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            <i class="fas fa-robot text-red-600 mr-2"></i>AI分析
                        </h3>
                        <p class="text-gray-600">GPT-4を活用した高度な市場分析とレポート生成機能を利用できます。</p>
                    </div>
                    
                    <div class="border-l-4 border-yellow-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            <i class="fas fa-database text-yellow-600 mr-2"></i>政府統計データ
                        </h3>
                        <p class="text-gray-600">e-Stat APIを通じて、人口統計、経済指標、地域データなどを取得できます。</p>
                    </div>
                    
                    <div class="border-l-4 border-indigo-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">
                            <i class="fas fa-share-alt text-indigo-600 mr-2"></i>レポート共有
                        </h3>
                        <p class="text-gray-600">分析結果を安全に共有するためのリンクを生成し、アクセス制御を設定できます。</p>
                    </div>
                </div>
            </div>

            <!-- Step-by-Step Guide -->
            <div class="bg-white rounded-lg shadow p-8 mb-6">
                <h2 class="text-3xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-list-ol text-green-600 mr-3"></i>詳細ガイド
                </h2>
                
                <div class="space-y-8">
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">1. 物件登録</h3>
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h4 class="font-semibold text-gray-900 mb-3">方法1: マイソクから自動入力</h4>
                            <ol class="list-decimal list-inside space-y-2 text-gray-700 mb-4">
                                <li>「新規物件登録」ページの画像アップロードエリアをクリック</li>
                                <li>マイソク（JPG、PNG、PDF）を選択</li>
                                <li>自動的に物件情報が入力されます</li>
                                <li>必要に応じて内容を修正</li>
                                <li>「保存して分析へ」ボタンをクリック</li>
                            </ol>
                            
                            <h4 class="font-semibold text-gray-900 mb-3">方法2: 手動入力</h4>
                            <ol class="list-decimal list-inside space-y-2 text-gray-700">
                                <li>物件名と価格を入力（必須）</li>
                                <li>所在地、構造、延床面積などの詳細情報を入力</li>
                                <li>「保存して分析へ」ボタンをクリック</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">2. 収支シミュレーション</h3>
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <ol class="list-decimal list-inside space-y-2 text-gray-700">
                                <li>物件詳細ページから「分析実行」ボタンをクリック</li>
                                <li>以下のパラメータを入力:
                                    <ul class="list-disc list-inside ml-6 mt-2 space-y-1 text-gray-600">
                                        <li>想定家賃収入（月額）</li>
                                        <li>稼働率（デフォルト: 95%）</li>
                                        <li>年間経費（管理費、修繕費など）</li>
                                        <li>ローン借入額</li>
                                        <li>金利</li>
                                        <li>返済期間</li>
                                    </ul>
                                </li>
                                <li>「分析実行」ボタンをクリック</li>
                                <li>利回り、NOI、キャッシュフローなどの指標が表示されます</li>
                            </ol>
                        </div>
                    </div>
                    
                    <div>
                        <h3 class="text-xl font-semibold text-gray-900 mb-4">3. 分析結果の活用</h3>
                        <div class="bg-gray-50 p-6 rounded-lg">
                            <h4 class="font-semibold text-gray-900 mb-3">主要指標の見方</h4>
                            <dl class="space-y-3 text-gray-700">
                                <div>
                                    <dt class="font-semibold">表面利回り:</dt>
                                    <dd class="ml-4 text-gray-600">年間家賃収入 ÷ 物件価格 × 100。経費を考慮しない単純な利回り。</dd>
                                </div>
                                <div>
                                    <dt class="font-semibold">実質利回り:</dt>
                                    <dd class="ml-4 text-gray-600">（年間家賃収入 - 年間経費）÷ 物件価格 × 100。経費を考慮した実際の利回り。</dd>
                                </div>
                                <div>
                                    <dt class="font-semibold">NOI (Net Operating Income):</dt>
                                    <dd class="ml-4 text-gray-600">年間家賃収入 - 年間経費。ローン返済前の純収入。</dd>
                                </div>
                                <div>
                                    <dt class="font-semibold">DSCR (Debt Service Coverage Ratio):</dt>
                                    <dd class="ml-4 text-gray-600">NOI ÷ 年間ローン返済額。1.2以上が望ましい。</dd>
                                </div>
                                <div>
                                    <dt class="font-semibold">LTV (Loan to Value):</dt>
                                    <dd class="ml-4 text-gray-600">借入額 ÷ 物件価格 × 100。80%以下が一般的。</dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tips -->
            <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow p-8 mb-6">
                <h2 class="text-3xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-lightbulb text-yellow-500 mr-3"></i>活用のヒント
                </h2>
                <div class="space-y-4 text-gray-700">
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-600 mt-1"></i>
                        <p><strong>複数物件を比較:</strong> 複数の物件を登録して、利回りやキャッシュフローを比較検討しましょう。</p>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-600 mt-1"></i>
                        <p><strong>保守的な見積もり:</strong> 稼働率は95%程度、経費は想定より多めに設定することで、リスクを抑えた分析ができます。</p>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-600 mt-1"></i>
                        <p><strong>定期的な見直し:</strong> 市場状況や金利の変動に合わせて、定期的に分析を更新しましょう。</p>
                    </div>
                    <div class="flex items-start space-x-3">
                        <i class="fas fa-check-circle text-green-600 mt-1"></i>
                        <p><strong>専門家への相談:</strong> 分析結果はあくまで参考情報です。重要な判断は不動産投資の専門家に相談することをお勧めします。</p>
                    </div>
                </div>
            </div>

            <!-- Support -->
            <div class="bg-white rounded-lg shadow p-8">
                <h2 class="text-3xl font-bold text-gray-900 mb-6">
                    <i class="fas fa-question-circle text-purple-600 mr-3"></i>サポート
                </h2>
                <div class="space-y-4">
                    <div class="border-l-4 border-purple-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">お問い合わせ</h3>
                        <p class="text-gray-600">機能に関するご質問やご要望は、運営チームまでお気軽にお問い合わせください。</p>
                    </div>
                    
                    <div class="border-l-4 border-blue-600 pl-4">
                        <h3 class="text-lg font-semibold text-gray-900 mb-2">アップデート情報</h3>
                        <p class="text-gray-600">新機能や改善点は、ダッシュボードのお知らせ欄でご確認いただけます。</p>
                    </div>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t mt-12">
            <div class="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
                <div class="flex items-center justify-between">
                    <p class="text-sm text-gray-600">© 2024 My Agent Analytics. All rights reserved.</p>
                    <a href="/dashboard" class="text-sm text-blue-600 hover:underline">ダッシュボードに戻る</a>
                </div>
            </div>
        </footer>
    </body>
    </html>
  `);
});

export default help;
