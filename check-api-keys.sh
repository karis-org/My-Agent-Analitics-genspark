#!/bin/bash

# APIキー設定確認スクリプト
# Usage: bash check-api-keys.sh

echo "================================================"
echo "  My Agent Analytics - APIキー設定確認"
echo "================================================"
echo ""

# .dev.varsファイルの存在確認
if [ ! -f ".dev.vars" ]; then
    echo "❌ .dev.vars ファイルが見つかりません"
    echo "   プロジェクトルートに .dev.vars ファイルを作成してください"
    exit 1
fi

echo "✅ .dev.vars ファイルが見つかりました"
echo ""

# 各APIキーの設定状況を確認
echo "📋 APIキー設定状況:"
echo "-------------------------------------------"

check_key() {
    local key_name=$1
    local required=$2
    
    if grep -q "^${key_name}=" .dev.vars && ! grep -q "^${key_name}=your-" .dev.vars && ! grep -q "^${key_name}=$" .dev.vars; then
        echo "✅ ${key_name}: 設定済み"
        return 0
    else
        if [ "$required" = "required" ]; then
            echo "❌ ${key_name}: 未設定（必須）"
        else
            echo "⚠️  ${key_name}: 未設定（任意）"
        fi
        return 1
    fi
}

# 必須APIキー
echo ""
echo "【必須】"
check_key "GOOGLE_CLIENT_ID" "required"
check_key "GOOGLE_CLIENT_SECRET" "required"
check_key "REINFOLIB_API_KEY" "required"
check_key "SESSION_SECRET" "required"

echo ""
echo "【任意】"
check_key "OPENAI_API_KEY" "optional"
check_key "ESTAT_API_KEY" "optional"
check_key "ITANDI_API_KEY" "optional"
check_key "REINS_LOGIN_ID" "optional"
check_key "REINS_PASSWORD" "optional"

echo ""
echo "-------------------------------------------"
echo ""

# 推奨アクション
echo "📝 推奨アクション:"
echo ""

if ! grep -q "^GOOGLE_CLIENT_ID=" .dev.vars || grep -q "^GOOGLE_CLIENT_ID=your-" .dev.vars; then
    echo "1. Google OAuth認証を設定してください（ログイン機能に必要）"
    echo "   参照: API_KEY_SETUP.md"
    echo ""
fi

if ! grep -q "^REINFOLIB_API_KEY=" .dev.vars || grep -q "^REINFOLIB_API_KEY=your-" .dev.vars; then
    echo "2. 不動産情報ライブラリAPIキーを設定してください（市場分析に必要）"
    echo "   申請URL: https://www.reinfolib.mlit.go.jp/"
    echo ""
fi

if ! grep -q "^SESSION_SECRET=" .dev.vars || grep -q "^SESSION_SECRET=your-" .dev.vars; then
    echo "3. SESSION_SECRETを生成してください:"
    echo "   openssl rand -base64 32"
    echo ""
fi

echo "================================================"
echo ""
echo "💡 ヒント:"
echo "  - APIキー設定後は pm2 restart my-agent-analytics を実行"
echo "  - 詳細な設定方法は API_KEY_SETUP.md を参照"
echo ""
