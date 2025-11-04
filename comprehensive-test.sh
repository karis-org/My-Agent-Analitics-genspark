#!/bin/bash

# My Agent Analytics - 包括的エラーチェックスクリプト
# Comprehensive Error Check Script

echo "========================================="
echo "  My Agent Analytics"
echo "  包括的エラーチェック"
echo "  Comprehensive Error Check"
echo "========================================="
echo ""

BASE_URL="http://localhost:3000"
PASSED=0
FAILED=0
ERRORS=()

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test function
test_endpoint() {
    local name="$1"
    local method="$2"
    local endpoint="$3"
    local data="$4"
    local expected_status="$5"
    
    echo -n "Testing: $name ... "
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint" 2>&1)
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint" 2>&1)
    fi
    
    status_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$status_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $status_code)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Expected: $expected_status, Got: $status_code)"
        ERRORS+=("$name: Expected $expected_status, Got $status_code")
        ((FAILED++))
        return 1
    fi
}

# Test UI page access
test_page() {
    local name="$1"
    local endpoint="$2"
    
    echo -n "Testing UI: $name ... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL$endpoint" 2>&1)
    
    if [ "$response" = "200" ] || [ "$response" = "302" ]; then
        echo -e "${GREEN}✓ PASS${NC} (Status: $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}✗ FAIL${NC} (Status: $response)"
        ERRORS+=("UI $name: Got $response")
        ((FAILED++))
        return 1
    fi
}

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 1. 基本エンドポイントテスト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_endpoint "ヘルスチェック" "GET" "/api/health" "" "200"
test_endpoint "ルートページ" "GET" "/" "" "200"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 2. UIページアクセステスト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_page "ログインページ" "/auth/login"
test_page "ダッシュボード" "/dashboard"
test_page "物件一覧" "/properties"
test_page "物件新規登録" "/properties/new"
test_page "ヘルプページ" "/help"
test_page "イタンジBB" "/itandi/rental-market"
test_page "事故物件調査" "/stigma/check"
test_page "システム情報" "/settings/info"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 3. 静的ファイルテスト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
test_page "ロゴアイコン" "/static/icons/app-icon.png"
test_page "フルロゴ" "/static/icons/my-agent-analytics-full-logo.png"
test_page "マニフェスト" "/static/manifest.json"
test_page "Service Worker" "/sw.js"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 4. データベース接続テスト"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -n "Testing: データベーステーブル確認 ... "
if npx wrangler d1 execute webapp-production --local --command="SELECT name FROM sqlite_master WHERE type='table';" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ PASS${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ FAIL${NC}"
    ERRORS+=("Database: Cannot access D1 database")
    ((FAILED++))
fi
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo " 5. 未実装機能チェック"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check for integrated report page
echo -n "Checking: 統合レポートページ ... "
if [ -f "src/routes/integrated-report.tsx" ] || grep -q "integrated-report" src/routes/properties.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ERRORS+=("統合レポートページ: 未実装")
    ((FAILED++))
fi

# Check for property analysis page
echo -n "Checking: 物件分析ページ (analyze) ... "
if grep -q "/properties/:id/analyze" src/routes/properties.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ERRORS+=("物件分析ページ: 実装不完全")
    ((FAILED++))
fi

# Check for income input fields
echo -n "Checking: 物件収益入力フォーム ... "
if grep -q "average_rent\|gross_income\|effective_income" src/routes/properties.tsx 2>/dev/null; then
    echo -e "${GREEN}✓ FOUND${NC}"
    ((PASSED++))
else
    echo -e "${RED}✗ NOT FOUND${NC}"
    ERRORS+=("物件収益入力フォーム: 未実装")
    ((FAILED++))
fi

echo ""

echo "========================================="
echo "  テスト結果サマリー"
echo "  Test Results Summary"
echo "========================================="
echo -e "${GREEN}合格: $PASSED${NC}"
echo -e "${RED}失敗: $FAILED${NC}"
echo ""

if [ $FAILED -gt 0 ]; then
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo " エラー詳細"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    for error in "${ERRORS[@]}"; do
        echo -e "${RED}✗${NC} $error"
    done
    echo ""
fi

TOTAL=$((PASSED + FAILED))
PASS_RATE=$((PASSED * 100 / TOTAL))

echo "合格率: $PASS_RATE% ($PASSED/$TOTAL)"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ 全てのテストに合格しました！${NC}"
    exit 0
else
    echo -e "${RED}✗ いくつかのテストが失敗しました${NC}"
    exit 1
fi
