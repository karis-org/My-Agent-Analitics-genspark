/**
 * Properties Form Components
 * 物件登録・編集フォーム
 */

/**
 * 新規物件登録ページ
 * Honoルート: GET /properties/new
 */
export function renderPropertyNewPage(user: any): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>新規物件登録 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        ${renderFormHeader('新規物件登録')}
        ${renderFormContent()}
        ${renderFormScripts()}
    </body>
    </html>
  `;
}

/**
 * 物件編集ページ
 * Honoルート: GET /properties/:id/edit
 */
export function renderPropertyEditPage(user: any, property: any): string {
  return `
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>物件編集 - My Agent Analytics</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap');
            body { font-family: 'Noto Sans JP', sans-serif; }
        </style>
    </head>
    <body class="bg-gray-50">
        ${renderFormHeader('物件編集')}
        ${renderEditFormContent(property)}
        ${renderEditFormScripts(property)}
    </body>
    </html>
  `;
}

/**
 * フォームヘッダー
 */
function renderFormHeader(title: string): string {
  return `
    <header class="bg-white shadow-sm">
        <div class="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
            <div class="flex items-center justify-between">
                <div class="flex items-center space-x-4">
                    <a href="/dashboard">
                        <img src="/static/icons/app-icon.png" alt="My Agent Analytics" class="h-12 w-12" style="object-fit: contain;">
                    </a>
                    <h1 class="text-2xl font-bold text-gray-900">${title}</h1>
                </div>
                <a href="/properties" class="text-gray-600 hover:text-gray-900">
                    <i class="fas fa-times"></i> キャンセル
                </a>
            </div>
        </div>
    </header>
  `;
}

/**
 * 新規登録フォームコンテンツ
 */
function renderFormContent(): string {
  return `
    <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        ${renderOCRUploadSection()}
        ${renderPropertyFormSection()}
    </main>
  `;
}

/**
 * OCRアップロードセクション
 */
function renderOCRUploadSection(): string {
  return `
    <div class="bg-blue-50 border-2 border-blue-200 border-dashed rounded-lg p-8 mb-6">
        <div class="text-center">
            <i class="fas fa-file-image text-5xl text-blue-600 mb-4"></i>
            <h3 class="text-lg font-semibold text-gray-900 mb-2">マイソク・物件概要書を読み取り</h3>
            <p class="text-sm text-gray-600 mb-2">画像またはPDFをアップロードすると自動で物件情報を入力します</p>
            <div class="bg-blue-50 border border-blue-200 rounded p-3 mb-4">
                <p class="text-xs text-blue-800">
                    <i class="fas fa-info-circle mr-1"></i>
                    <strong>推奨:</strong> 文字がはっきり読める高解像度の画像をご使用ください。
                    PDF、JPG、PNG形式に対応。処理には10-30秒程度かかります。
                </p>
            </div>
            <input type="file" id="mysoku-upload" accept="image/jpeg,image/jpg,image/png,application/pdf" class="hidden">
            <button type="button" onclick="document.getElementById('mysoku-upload').click()"
                    class="px-6 py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg font-medium transition-colors touch-manipulation shadow-lg">
                <i class="fas fa-upload mr-2"></i>ファイルをアップロード
            </button>
            <p class="text-xs text-gray-500 mt-2">
                対応形式: JPG, PNG, PDF（PDFは自動的に画像に変換されます）<br>
                <span class="text-blue-600">iPhoneでは「写真ライブラリ」または「写真を撮る」から選択できます</span>
            </p>
        </div>
        <div id="upload-status" class="mt-4 hidden">
            <div class="flex items-center justify-center space-x-2">
                <i class="fas fa-spinner fa-spin text-blue-600"></i>
                <span class="text-sm text-gray-700">画像を解析中...</span>
            </div>
        </div>
        <div id="upload-result" class="mt-4 hidden">
            <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                <i class="fas fa-check-circle text-green-600 mr-2"></i>
                <span class="text-sm text-green-800">物件情報を自動入力しました</span>
            </div>
        </div>
    </div>
  `;
}

/**
 * 物件情報入力フォームセクション
 */
function renderPropertyFormSection(): string {
  return `
    <div class="bg-white rounded-lg shadow p-8">
        <h2 class="text-2xl font-bold text-gray-900 mb-6">物件情報入力</h2>
        
        <form id="property-form" class="space-y-6">
            ${renderBasicInfoSection()}
            ${renderAnalysisOptionsSection()}
            ${renderFormButtons()}
        </form>
    </div>
  `;
}

/**
 * 基本情報入力セクション
 */
function renderBasicInfoSection(): string {
  return `
    <div class="border-b pb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">物件名 *</label>
                <input type="text" name="name" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">価格 (円) *</label>
                <input type="number" name="price" required
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">想定賃料 (円/月)</label>
                <input type="number" name="monthly_rent" id="monthly_rent"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="例: 100000">
                <p class="text-xs text-gray-500 mt-1">収益物件の場合、想定される月額賃料を入力してください</p>
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                <input type="text" name="location"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="例: 東京都渋谷区...">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">構造</label>
                <select name="structure" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">選択してください</option>
                    <option value="RC造">RC造</option>
                    <option value="SRC造">SRC造</option>
                    <option value="鉄骨造">鉄骨造</option>
                    <option value="木造">木造</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">延床面積 (㎡)</label>
                <input type="number" step="0.01" name="total_floor_area"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">築年数</label>
                <input type="number" name="age" min="-5" max="150"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                       placeholder="例: 10">
                <p class="text-xs text-gray-500 mt-1">有効範囲: -5年（新築予定）〜150年</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">駅距離 (分)</label>
                <input type="number" step="0.1" name="distance_from_station"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
        </div>
    </div>
  `;
}

/**
 * 分析オプション選択セクション
 */
function renderAnalysisOptionsSection(): string {
  return `
    <div class="border-b pb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">
            <i class="fas fa-tasks text-blue-600 mr-2"></i>実行する分析を選択
        </h3>
        <p class="text-sm text-gray-600 mb-4">
            物件登録と同時に実行する分析にチェックを入れてください。登録したデータが自動的に各分析で使用されます。
        </p>
        
        <div class="grid md:grid-cols-2 gap-4">
            <div class="bg-blue-50 rounded-lg p-4">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="analysis_financial" value="1" checked disabled
                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">財務分析 <span class="text-xs text-blue-600">(必須)</span></div>
                        <p class="text-xs text-gray-600 mt-1">NOI、利回り、DSCR、LTV等の投資指標を自動計算</p>
                    </div>
                </label>
            </div>
            
            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="analysis_stigma" value="1"
                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">事故物件調査</div>
                        <p class="text-xs text-gray-600 mt-1">AI搭載の心理的瑕疵調査システム</p>
                    </div>
                </label>
            </div>
            
            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="analysis_rental" value="1"
                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">イタンジBB 賃貸相場</div>
                        <p class="text-xs text-gray-600 mt-1">周辺賃貸物件の相場と推移を分析</p>
                    </div>
                </label>
            </div>
            
            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="analysis_demographics" value="1"
                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">人口動態分析</div>
                        <p class="text-xs text-gray-600 mt-1">e-Statによる地域人口統計データ</p>
                    </div>
                </label>
            </div>
            
            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="analysis_ai_market" value="1"
                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">AI市場分析</div>
                        <p class="text-xs text-gray-600 mt-1">OpenAI GPT-4による市場動向分析</p>
                    </div>
                </label>
            </div>
            
            <div class="bg-white border-2 border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                <label class="flex items-start space-x-3 cursor-pointer">
                    <input type="checkbox" name="analysis_maps" value="1" checked
                           class="mt-1 h-5 w-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500">
                    <div class="flex-1">
                        <div class="font-medium text-gray-900">周辺地図生成 <span class="text-xs text-blue-600">(推奨)</span></div>
                        <p class="text-xs text-gray-600 mt-1">1km/200mスケールの地図自動生成</p>
                    </div>
                </label>
            </div>
        </div>
        
        <div class="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div class="flex items-start space-x-2">
                <i class="fas fa-info-circle text-yellow-600 mt-0.5"></i>
                <p class="text-xs text-yellow-800">
                    選択した分析は並行で実行されます。APIキーが未設定の場合はサンプルデータが表示されます。
                </p>
            </div>
        </div>
    </div>
  `;
}

/**
 * フォームボタン
 */
function renderFormButtons(): string {
  return `
    <div class="flex items-center justify-end space-x-4">
        <a href="/properties" 
           class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            キャンセル
        </a>
        <button type="submit"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <i class="fas fa-save mr-2"></i>保存して分析開始
        </button>
    </div>
  `;
}

/**
 * 編集フォームコンテンツ
 */
function renderEditFormContent(property: any): string {
  return `
    <main class="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div class="bg-white rounded-lg shadow p-8">
            <h2 class="text-2xl font-bold text-gray-900 mb-6">物件情報編集</h2>
            
            <form id="property-edit-form" class="space-y-6">
                ${renderEditBasicInfoSection(property)}
                ${renderEditFormButtons()}
            </form>
        </div>
    </main>
  `;
}

/**
 * 編集フォーム基本情報セクション
 */
function renderEditBasicInfoSection(property: any): string {
  return `
    <div class="border-b pb-6">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
        <div class="grid md:grid-cols-2 gap-4">
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">物件名 *</label>
                <input type="text" name="name" required value="${property.name || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">価格 (円) *</label>
                <input type="number" name="price" required value="${property.price || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">想定賃料 (円/月)</label>
                <input type="number" name="monthly_rent" value="${property.monthly_rent || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 mb-2">所在地</label>
                <input type="text" name="location" value="${property.location || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">構造</label>
                <select name="structure" 
                        class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                    <option value="">選択してください</option>
                    <option value="RC造" ${property.structure === 'RC造' ? 'selected' : ''}>RC造</option>
                    <option value="SRC造" ${property.structure === 'SRC造' ? 'selected' : ''}>SRC造</option>
                    <option value="鉄骨造" ${property.structure === '鉄骨造' ? 'selected' : ''}>鉄骨造</option>
                    <option value="木造" ${property.structure === '木造' ? 'selected' : ''}>木造</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">延床面積 (㎡)</label>
                <input type="number" step="0.01" name="total_floor_area" value="${property.total_floor_area || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">築年数</label>
                <input type="number" name="age" min="-5" max="150" value="${property.age || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                <p class="text-xs text-gray-500 mt-1">有効範囲: -5年（新築予定）〜150年</p>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">駅距離 (分)</label>
                <input type="number" step="0.1" name="distance_from_station" value="${property.distance_from_station || ''}"
                       class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent">
            </div>
        </div>
    </div>
  `;
}

/**
 * 編集フォームボタン
 */
function renderEditFormButtons(): string {
  return `
    <div class="flex items-center justify-end space-x-4">
        <a href="/properties" 
           class="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            キャンセル
        </a>
        <button type="submit"
                class="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
            <i class="fas fa-save mr-2"></i>更新
        </button>
    </div>
  `;
}

/**
 * 新規登録フォームスクリプト
 */
function renderFormScripts(): string {
  return `
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js"></script>
    <script>
        // PDF.js workerの設定
        if (typeof pdfjsLib !== 'undefined') {
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js';
        }
        
        // PDFを画像に変換する関数
        async function convertPdfToImage(file) {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
            const page = await pdf.getPage(1);
            
            const viewport = page.getViewport({ scale: 2.0 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            return canvas.toDataURL('image/png');
        }
        
        // OCRアップロード処理（マイソク読み取り）
        document.getElementById('mysoku-upload').addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const uploadStatus = document.getElementById('upload-status');
            const uploadResult = document.getElementById('upload-result');
            
            uploadStatus.classList.remove('hidden');
            uploadResult.classList.add('hidden');
            
            try {
                let base64Data;
                
                if (file.type === 'application/pdf') {
                    uploadStatus.querySelector('span').textContent = 'PDFを画像に変換中...';
                    base64Data = await convertPdfToImage(file);
                } else {
                    const reader = new FileReader();
                    base64Data = await new Promise((resolve) => {
                        reader.onload = (event) => resolve(event.target.result);
                        reader.readAsDataURL(file);
                    });
                }
                
                uploadStatus.querySelector('span').textContent = '画像を解析中...';
                
                const response = await axios.post('/api/properties/ocr', {
                    image: base64Data,
                    filename: file.name
                });
                    
                const data = response.data;
                
                // フォームに自動入力
                if (data.name) document.querySelector('[name="name"]').value = data.name;
                if (data.price) document.querySelector('[name="price"]').value = data.price;
                if (data.location) document.querySelector('[name="location"]').value = data.location;
                if (data.structure) document.querySelector('[name="structure"]').value = data.structure;
                if (data.total_floor_area) document.querySelector('[name="total_floor_area"]').value = data.total_floor_area;
                if (data.age) document.querySelector('[name="age"]').value = data.age;
                if (data.distance_from_station) document.querySelector('[name="distance_from_station"]').value = data.distance_from_station;
                if (data.monthly_rent) document.querySelector('[name="monthly_rent"]').value = data.monthly_rent;
                
                uploadStatus.classList.add('hidden');
                
                // 警告がある場合は表示
                if (data.hasWarnings && data.warnings && data.warnings.length > 0) {
                    uploadResult.innerHTML = \`
                        <div class="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                            <div class="flex items-start">
                                <i class="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                                <div>
                                    <p class="text-sm font-semibold text-yellow-900 mb-1">
                                        物件情報を自動入力しましたが、一部のフィールドを正しく読み取れませんでした
                                    </p>
                                    <p class="text-xs text-yellow-800 mb-2">
                                        以下のフィールドを手動で確認・入力してください:
                                    </p>
                                    <ul class="text-xs text-yellow-800 list-disc list-inside space-y-1">
                                        \${data.warnings.map(warning => \`<li>\${warning}</li>\`).join('')}
                                    </ul>
                                </div>
                            </div>
                        </div>
                    \`;
                } else {
                    uploadResult.innerHTML = \`
                        <div class="bg-green-50 border border-green-200 rounded-lg p-4">
                            <i class="fas fa-check-circle text-green-600 mr-2"></i>
                            <span class="text-sm text-green-800">物件情報を自動入力しました</span>
                        </div>
                    \`;
                }
                uploadResult.classList.remove('hidden');
            } catch (error) {
                console.error('OCR processing error:', error);
                uploadStatus.classList.add('hidden');
                uploadResult.innerHTML = \`
                    <div class="bg-red-50 border border-red-200 rounded-lg p-4">
                        <i class="fas fa-exclamation-circle text-red-600 mr-2"></i>
                        <span class="text-sm text-red-800">画像の読み取りに失敗しました。手動で入力してください。</span>
                    </div>
                \`;
                uploadResult.classList.remove('hidden');
            }
        });
        
        // フォーム送信処理
        document.getElementById('property-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // フロントエンドバリデーション
            const age = parseInt(data.age);
            if (data.age && !isNaN(age)) {
                if (age < -5 || age > 150) {
                    alert('築年数の値が不正です（' + age + '年）。\\n\\n有効範囲: -5年〜150年\\n\\n※価格情報（坪単価など）を築年数に入力していないか確認してください。');
                    return;
                }
            }
            
            const selectedAnalyses = {
                financial: true,
                stigma: formData.get('analysis_stigma') === '1',
                rental: formData.get('analysis_rental') === '1',
                demographics: formData.get('analysis_demographics') === '1',
                aiMarket: formData.get('analysis_ai_market') === '1',
                maps: formData.get('analysis_maps') === '1'
            };
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>登録中...';
            
            try {
                const response = await axios.post('/api/properties', data);
                const propertyId = response.data.property.id;
                const property = response.data.property;
                
                submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>分析実行中...';
                
                const analysisPromises = [];
                
                if (selectedAnalyses.stigma && property.location) {
                    analysisPromises.push(
                        axios.post('/api/properties/stigma-check', {
                            address: property.location,
                            propertyName: property.name
                        }).catch(error => ({ type: 'stigma', success: false, error: error.message }))
                    );
                }
                
                if (selectedAnalyses.rental && property.location) {
                    const locationParts = property.location.match(/^(.+?[都道府県])(.+?[市区町村])/);
                    if (locationParts) {
                        analysisPromises.push(
                            axios.post('/api/itandi/rental-analysis', {
                                prefecture: locationParts[1],
                                city: locationParts[2],
                                minArea: property.total_floor_area ? property.total_floor_area * 0.8 : undefined,
                                maxArea: property.total_floor_area ? property.total_floor_area * 1.2 : undefined
                            }).catch(error => ({ type: 'rental', success: false, error: error.message }))
                        );
                    }
                }
                
                if (selectedAnalyses.demographics && property.location) {
                    analysisPromises.push(
                        axios.post('/api/estat/demographics', {
                            prefCode: '13',
                            cityCode: '13101'
                        }).catch(error => ({ type: 'demographics', success: false, error: error.message }))
                    );
                }
                
                if (selectedAnalyses.aiMarket && property.location) {
                    analysisPromises.push(
                        axios.post('/api/ai/analyze-market', {
                            area: property.location,
                            propertyType: '中古マンション',
                            priceRange: {
                                min: property.price * 0.8,
                                max: property.price * 1.2
                            }
                        }).catch(error => ({ type: 'aiMarket', success: false, error: error.message }))
                    );
                }
                
                if (selectedAnalyses.maps && property.location) {
                    analysisPromises.push(
                        axios.post('/api/maps/generate', {
                            address: property.location
                        }).catch(error => ({ type: 'maps', success: false, error: error.message }))
                    );
                }
                
                if (analysisPromises.length > 0) {
                    await Promise.all(analysisPromises);
                }
                
                window.location.href = \`/properties/\${propertyId}/comprehensive-report\`;
                
            } catch (error) {
                console.error('Failed to create property:', error);
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                alert('物件の登録に失敗しました: ' + (error.response?.data?.error || error.message));
            }
        });
    </script>
  `;
}

/**
 * 編集フォームスクリプト
 */
function renderEditFormScripts(property: any): string {
  return `
    <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
    <script>
        document.getElementById('property-edit-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // フロントエンドバリデーション
            const age = parseInt(data.age);
            if (data.age && !isNaN(age)) {
                if (age < -5 || age > 150) {
                    alert('築年数の値が不正です（' + age + '年）。\\n\\n有効範囲: -5年〜150年\\n\\n※価格情報（坪単価など）を築年数に入力していないか確認してください。');
                    return;
                }
            }
            
            const submitButton = e.target.querySelector('button[type="submit"]');
            const originalButtonText = submitButton.innerHTML;
            submitButton.disabled = true;
            submitButton.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>更新中...';
            
            try {
                await axios.put('/api/properties/${property.id}', data);
                window.location.href = '/properties/${property.id}';
            } catch (error) {
                console.error('Failed to update property:', error);
                submitButton.disabled = false;
                submitButton.innerHTML = originalButtonText;
                alert('物件の更新に失敗しました: ' + (error.response?.data?.error || error.message));
            }
        });
    </script>
  `;
}
