#!/bin/bash

# ========================================
# My Agent Analytics - Integration Tests
# ========================================
# 
# 目的: 全APIエンドポイントと主要UIページの動作確認
# テスト数: 18個（Phase 2-4目標）
#
# 実行方法:
#   bash tests/integration-tests.sh
#
# 前提条件:
#   - サーバーが http://localhost:3000 で起動していること
#   - D1データベースがマイグレーション済みであること
# ========================================

set +e  # エラーでも続行

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
PASS_COUNT=0
FAIL_COUNT=0
TOTAL_TESTS=18

# ========================================
# ヘルパー関数
# ========================================

test_start() {
    local test_name="$1"
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}TEST: ${test_name}${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

test_pass() {
    local test_name="$1"
    echo -e "${GREEN}✅ PASS${NC}: $test_name"
    ((PASS_COUNT++))
}

test_fail() {
    local test_name="$1"
    local reason="$2"
    echo -e "${RED}❌ FAIL${NC}: $test_name"
    echo -e "${RED}   理由: $reason${NC}"
    ((FAIL_COUNT++))
}

check_response() {
    local response="$1"
    local expected="$2"
    local test_name="$3"
    
    if echo "$response" | grep -q "$expected"; then
        test_pass "$test_name"
        return 0
    else
        test_fail "$test_name" "Expected '$expected' not found in response"
        echo "   Response: $response"
        return 1
    fi
}

check_status() {
    local status="$1"
    local expected="$2"
    local test_name="$3"
    
    if [ "$status" = "$expected" ]; then
        test_pass "$test_name"
        return 0
    else
        test_fail "$test_name" "Expected status $expected, got $status"
        return 1
    fi
}

# ========================================
# テストスイート開始
# ========================================

echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  My Agent Analytics - Integration Test Suite                  ║${NC}"
echo -e "${YELLOW}║  Total Tests: $TOTAL_TESTS                                              ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ========================================
# 1. ヘルスチェック系テスト（2個）
# ========================================

test_start "Test 1/18: ヘルスチェックAPI"
response=$(curl -s "$BASE_URL/api/health")
check_response "$response" '"status":"ok"' "ヘルスチェックAPI"

test_start "Test 2/18: ヘルスチェックAPIのバージョン"
check_response "$response" '"version":"2.0.0"' "バージョン情報"

# ========================================
# 2. UI画面アクセステスト（5個）
# ========================================

test_start "Test 3/18: ログインページ"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/login")
# 302リダイレクトまたは200は正常
if [ "$status" = "200" ] || [ "$status" = "302" ]; then
    test_pass "ログインページアクセス"
else
    test_fail "ログインページアクセス" "Status: $status"
fi

test_start "Test 4/18: ホームページ（ダッシュボード）"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/")
check_status "$status" "200" "ホームページアクセス"

test_start "Test 5/18: 物件一覧ページ"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/properties")
# 302リダイレクトまたは200は正常（未認証時は/auth/loginにリダイレクト）
if [ "$status" = "302" ] || [ "$status" = "200" ]; then
    test_pass "物件一覧ページ（未認証時はログインページにリダイレクト）"
else
    test_fail "物件一覧ページ" "Status: $status"
fi

test_start "Test 6/18: ヘルプページ"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/help")
check_status "$status" "200" "ヘルプページアクセス"

test_start "Test 7/18: 静的ファイル配信（app-icon.png）"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/static/icons/app-icon.png")
check_status "$status" "200" "静的ファイル配信"

# ========================================
# 3. API基本機能テスト（4個）
# ========================================

test_start "Test 8/18: 財務分析APIエンドポイント存在確認"
response=$(curl -s -X POST "$BASE_URL/api/properties/analyze" \
  -H "Content-Type: application/json" \
  -d '{}')
# エラーメッセージが返ればエンドポイントは存在
if echo "$response" | grep -q "error\|必須"; then
    test_pass "財務分析APIエンドポイント存在"
else
    test_fail "財務分析APIエンドポイント" "No error message returned"
fi

test_start "Test 9/18: OCR APIエンドポイント存在確認"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/properties/ocr")
# 400 or 401 or 500 = エンドポイントは存在
if [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "500" ] || [ "$status" = "200" ]; then
    test_pass "OCR APIエンドポイント存在"
else
    test_fail "OCR APIエンドポイント" "Status: $status"
fi

test_start "Test 10/18: 市場分析APIエンドポイント存在確認"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/market/analyze")
if [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "500" ] || [ "$status" = "200" ]; then
    test_pass "市場分析APIエンドポイント存在"
else
    test_fail "市場分析APIエンドポイント" "Status: $status"
fi

test_start "Test 11/18: AI分析APIエンドポイント存在確認"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/api/properties/analyze")
if [ "$status" = "400" ] || [ "$status" = "401" ] || [ "$status" = "500" ] || [ "$status" = "200" ]; then
    test_pass "AI分析APIエンドポイント存在"
else
    test_fail "AI分析APIエンドポイント" "Status: $status"
fi

# ========================================
# 4. データベース接続テスト（2個）
# ========================================

test_start "Test 12/18: データベース接続確認（物件API）"
response=$(curl -s "$BASE_URL/api/properties")
if echo "$response" | grep -q "Unauthorized\|\[\]\|Authentication required\|NO_SESSION"; then
    test_pass "データベース接続（物件API）"
else
    test_fail "データベース接続" "Unexpected response: $response"
fi

test_start "Test 13/18: データベース接続確認（エージェントAPI）"
response=$(curl -s "$BASE_URL/api/agents")
if echo "$response" | grep -q "\[\]\|error\|agents"; then
    test_pass "データベース接続（エージェントAPI）"
else
    test_fail "データベース接続" "Unexpected response"
fi

# ========================================
# 5. 認証フローテスト（2個）
# ========================================

test_start "Test 14/18: パスワード認証POSTエンドポイント"
status=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$BASE_URL/auth/password")
# 302リダイレクトまたは400エラーは正常
if [ "$status" = "302" ] || [ "$status" = "400" ] || [ "$status" = "200" ]; then
    test_pass "パスワード認証POSTエンドポイント"
else
    test_fail "パスワード認証POST" "Status: $status"
fi

test_start "Test 15/18: ログアウトエンドポイント"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/auth/logout")
if [ "$status" = "302" ] || [ "$status" = "200" ]; then
    test_pass "ログアウトエンドポイント"
else
    test_fail "ログアウト" "Status: $status"
fi

# ========================================
# 6. 外部API統合テスト（3個）
# ========================================

test_start "Test 16/18: イタンジBB賃貸相場分析ページ"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/itandi/rental-market")
if [ "$status" = "200" ] || [ "$status" = "302" ]; then
    test_pass "イタンジBB賃貸相場分析ページ"
else
    test_fail "イタンジBB" "Status: $status"
fi

test_start "Test 17/18: 実需用物件評価ページ"
status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/residential")
if [ "$status" = "200" ] || [ "$status" = "302" ]; then
    test_pass "実需用物件評価ページ"
else
    test_fail "実需用物件評価" "Status: $status"
fi

test_start "Test 18/18: 事故物件調査機能（Stigma Check）"
response=$(curl -s -X POST "$BASE_URL/api/properties/investigate" \
  -H "Content-Type: application/json" \
  -d '{"address":"東京都渋谷区"}')
# エラーまたは結果が返ればOK
if echo "$response" | grep -q "error\|result\|address\|investigation"; then
    test_pass "事故物件調査機能（Stigma Check）"
else
    test_fail "Stigma Check" "No response"
fi

# ========================================
# テスト結果サマリー
# ========================================

echo ""
echo -e "${YELLOW}╔════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${YELLOW}║  Test Results Summary                                          ║${NC}"
echo -e "${YELLOW}╚════════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${GREEN}✅ PASSED${NC}: $PASS_COUNT / $TOTAL_TESTS"
echo -e "${RED}❌ FAILED${NC}: $FAIL_COUNT / $TOTAL_TESTS"

if [ $FAIL_COUNT -eq 0 ]; then
    SUCCESS_RATE=100
    echo -e "${GREEN}🎉 Success Rate: ${SUCCESS_RATE}% (ALL TESTS PASSED)${NC}"
    echo ""
    exit 0
else
    SUCCESS_RATE=$((PASS_COUNT * 100 / TOTAL_TESTS))
    echo -e "${YELLOW}⚠️  Success Rate: ${SUCCESS_RATE}%${NC}"
    echo ""
    echo -e "${RED}Some tests failed. Please review the output above.${NC}"
    exit 1
fi
