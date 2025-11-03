#!/bin/bash

# My Agent Analytics - 機能テストスクリプト
# 実行方法: bash test-features.sh

echo "========================================"
echo "My Agent Analytics - 機能動作確認テスト"
echo "========================================"
echo ""

# カラー定義
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# テスト結果
PASSED=0
FAILED=0
TOTAL=0

# テスト実行関数
run_test() {
    local test_name=$1
    local test_command=$2
    
    echo -e "${BLUE}[TEST]${NC} $test_name"
    TOTAL=$((TOTAL + 1))
    
    if eval "$test_command" > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PASS${NC}"
        PASSED=$((PASSED + 1))
    else
        echo -e "${RED}✗ FAIL${NC}"
        FAILED=$((FAILED + 1))
    fi
    echo ""
}

echo "=== 基本機能テスト ==="
echo ""

# 1. ヘルスチェック
run_test "1. ヘルスチェック" \
    "curl -s http://localhost:3000/api/health | grep -q '\"status\":\"ok\"'"

# 2. ダッシュボードアクセス（認証なし→リダイレクト）
run_test "2. ダッシュボードアクセス" \
    "curl -s -I http://localhost:3000/dashboard | grep -q '302'"

# 3. 事故物件調査ページアクセス
run_test "3. 事故物件調査ページ" \
    "curl -s -I http://localhost:3000/stigma/check | grep -q '302'"

# 4. ファクトチェックページアクセス
run_test "4. ファクトチェックページ" \
    "curl -s -I http://localhost:3000/fact-check | grep -q '302'"

# 5. イタンジBBページアクセス
run_test "5. イタンジBB賃貸相場ページ" \
    "curl -s -I http://localhost:3000/itandi/rental-market | grep -q '302'"

# 6. 静的ファイルアクセス
run_test "6. 静的ファイル（アイコン）" \
    "curl -s -I http://localhost:3000/static/icons/app-icon.png | grep -q '200'"

# 7. ホームページアクセス
run_test "7. ホームページ" \
    "curl -s http://localhost:3000/ | grep -q 'My Agent Analytics'"

echo "========================================"
echo "テスト結果サマリー"
echo "========================================"
echo -e "合計: $TOTAL"
echo -e "${GREEN}成功: $PASSED${NC}"
echo -e "${RED}失敗: $FAILED${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 全てのテストに合格しました！${NC}"
    exit 0
else
    echo -e "${RED}✗ いくつかのテストが失敗しました${NC}"
    exit 1
fi
