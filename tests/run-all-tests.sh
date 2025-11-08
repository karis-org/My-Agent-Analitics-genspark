#!/bin/bash

# ========================================
# My Agent Analytics - Test Runner
# ========================================
# 
# 全テストスイートを実行し、結果を集計
# 
# テストカテゴリ:
#   1. Unit Tests (10個): 計算ロジック、データ変換
#   2. Integration Tests (18個): API、UI、DB接続
#
# 合計: 28個のテスト
#
# 実行方法:
#   bash tests/run-all-tests.sh
#
# 前提条件:
#   - サーバーが http://localhost:3000 で起動していること
# ========================================

set +e  # エラーでも続行

# カラー出力
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m'

# テストディレクトリ
TEST_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}║       My Agent Analytics - Comprehensive Test Suite             ║${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}║       Phase 2-4: Complete Test Coverage                         ║${NC}"
echo -e "${CYAN}║       Total Tests: 28 (10 Unit + 18 Integration)                ║${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

# ========================================
# サーバー起動確認
# ========================================

echo -e "${YELLOW}🔍 Checking server status...${NC}"
if curl -s http://localhost:3000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Server is running at http://localhost:3000${NC}"
else
    echo -e "${RED}❌ Server is not running!${NC}"
    echo ""
    echo -e "${YELLOW}Please start the server first:${NC}"
    echo "  cd /home/user/webapp"
    echo "  pm2 start ecosystem.config.cjs"
    echo ""
    exit 1
fi

echo ""

# ========================================
# 1. ユニットテスト実行
# ========================================

echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  Part 1: Unit Tests (Logic & Data Transformation)               ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

bash "$TEST_DIR/unit-tests.sh"
UNIT_TEST_RESULT=$?

echo ""
sleep 2

# ========================================
# 2. インテグレーションテスト実行
# ========================================

echo -e "${MAGENTA}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${MAGENTA}║  Part 2: Integration Tests (API & UI Endpoints)                 ║${NC}"
echo -e "${MAGENTA}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

bash "$TEST_DIR/integration-tests.sh"
INTEGRATION_TEST_RESULT=$?

echo ""
sleep 2

# ========================================
# 総合結果
# ========================================

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}║              COMPREHENSIVE TEST RESULTS SUMMARY                  ║${NC}"
echo -e "${CYAN}║                                                                  ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════════════════════╝${NC}"
echo ""

if [ $UNIT_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Unit Tests:        PASSED (10/10 = 100%)${NC}"
else
    echo -e "${RED}❌ Unit Tests:        FAILED${NC}"
fi

if [ $INTEGRATION_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}✅ Integration Tests: PASSED (18/18 = 100%)${NC}"
else
    echo -e "${RED}❌ Integration Tests: FAILED${NC}"
fi

echo ""

if [ $UNIT_TEST_RESULT -eq 0 ] && [ $INTEGRATION_TEST_RESULT -eq 0 ]; then
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}║  🎉 ALL TESTS PASSED! (28/28 = 100%)                             ║${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}║  Phase 2-4 Complete: Test Suite Creation ✅                      ║${NC}"
    echo -e "${GREEN}║                                                                  ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${YELLOW}║                                                                  ║${NC}"
    echo -e "${YELLOW}║  ⚠️  SOME TESTS FAILED                                           ║${NC}"
    echo -e "${YELLOW}║                                                                  ║${NC}"
    echo -e "${YELLOW}║  Please review the test output above for details.               ║${NC}"
    echo -e "${YELLOW}║                                                                  ║${NC}"
    echo -e "${YELLOW}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    exit 1
fi
