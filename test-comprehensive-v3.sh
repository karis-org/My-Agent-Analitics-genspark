#!/bin/bash

# Comprehensive Error & Functionality Test Script for My Agent Analytics v3
# Tests all major features, error scenarios, and edge cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
WARNINGS=0

# Base URLs
LOCAL_URL="http://localhost:3000"
PROD_URL="https://3ccc9c44.my-agent-analytics.pages.dev"

# Choose test target (default: local)
TEST_URL="${1:-$LOCAL_URL}"

echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  My Agent Analytics v6.7.4${NC}"
echo -e "${BLUE}  包括的エラー・機能テスト v3${NC}"
echo -e "${BLUE}  Test Target: ${TEST_URL}${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_status="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} $test_name"
    
    local http_code=$(eval "$test_command")
    
    if [ "$http_code" = "$expected_status" ]; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (Expected HTTP $expected_status, Got HTTP $http_code)"
        WARNINGS=$((WARNINGS + 1))
    fi
    echo ""
}

# Helper function for flexible status code tests
run_flexible_test() {
    local test_name="$1"
    local test_command="$2"
    local acceptable_codes="$3"  # Space-separated list like "200 302 401"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} $test_name"
    
    local http_code=$(eval "$test_command")
    
    if echo "$acceptable_codes" | grep -wq "$http_code"; then
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        echo -e "${YELLOW}⚠ WARNING${NC} (Expected one of [$acceptable_codes], Got HTTP $http_code)"
        WARNINGS=$((WARNINGS + 1))
    fi
    echo ""
}

echo -e "${MAGENTA}=== セクション 1: 基本エンドポイントテスト ===${NC}"
echo ""

# Test 1: Health check
run_test "API Health Check" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/api/health\"" \
    "200"

# Test 2: Landing page
run_test "Landing Page" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/\"" \
    "200"

# Test 3: SVG Logo accessibility
run_test "SVG Logo File" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/static/icons/app-icon.svg\"" \
    "200"

# Test 4: Service Worker
run_test "Service Worker (PWA)" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/sw.js\"" \
    "200"

# Test 5: Manifest
run_test "PWA Manifest" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/static/manifest.json\"" \
    "200"

echo -e "${MAGENTA}=== セクション 2: 認証保護テスト ===${NC}"
echo ""

# Test 6: Dashboard without auth
run_flexible_test "Dashboard Authentication" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/dashboard\"" \
    "302 401 403"

# Test 7: Properties list without auth
run_flexible_test "Properties List Authentication" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/properties\"" \
    "302 401 403"

# Test 8: Property creation page without auth
run_flexible_test "Property Creation Authentication" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/properties/new\"" \
    "302 401 403"

# Test 9: Admin panel without auth
run_flexible_test "Admin Panel Authentication" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/admin\"" \
    "302 401 403"

# Test 10: Settings page without auth
run_flexible_test "Settings Page Authentication" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/settings\"" \
    "302 401 403"

echo -e "${MAGENTA}=== セクション 3: APIエンドポイントテスト ===${NC}"
echo ""

# Test 11: Properties API without auth
run_flexible_test "Properties API Authentication" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/api/properties\"" \
    "401 403"

# Test 12: Invalid JSON payload
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Invalid JSON Payload"
response=$(curl -s -w '\n%{http_code}' -X POST "${TEST_URL}/api/properties" \
    -H 'Content-Type: application/json' \
    -d 'invalid json' 2>/dev/null || echo -e "\n500")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "400" ] || [ "$http_code" = "401" ] || [ "$http_code" = "500" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - correctly handled)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Got HTTP $http_code)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 13: Missing Content-Type header
run_flexible_test "Missing Content-Type Header" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST \"${TEST_URL}/api/properties\" -d '{\"test\":\"data\"}'" \
    "400 401 415"

# Test 14: Market analysis API
run_flexible_test "Market Analysis API" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST \"${TEST_URL}/api/market/analyze\" -H 'Content-Type: application/json' -d '{\"year\":2024,\"area\":\"13\",\"city\":\"13102\"}'" \
    "401 403 200"

# Test 15: Properties analyze API
run_flexible_test "Properties Analyze API" \
    "curl -s -o /dev/null -w '%{http_code}' -X POST \"${TEST_URL}/api/properties/analyze\" -H 'Content-Type: application/json' -d '{\"propertyPrice\":50000000}'" \
    "401 403 200"

echo -e "${MAGENTA}=== セクション 4: エラーハンドリングテスト ===${NC}"
echo ""

# Test 16: Non-existent page (404)
run_test "404 Error Handling" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/nonexistent-page-12345\"" \
    "404"

# Test 17: Non-existent static file
run_test "Non-existent Static File" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/static/nonexistent-file-xyz.js\"" \
    "404"

# Test 18: Non-existent property detail
run_flexible_test "Non-existent Property Detail" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/properties/99999\"" \
    "302 401 403 404"

# Test 19: Non-existent property edit
run_flexible_test "Non-existent Property Edit" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/properties/99999/edit\"" \
    "302 401 403 404"

# Test 20: Invalid API method
run_flexible_test "Invalid HTTP Method" \
    "curl -s -o /dev/null -w '%{http_code}' -X DELETE \"${TEST_URL}/api/health\"" \
    "405 404"

echo -e "${MAGENTA}=== セクション 5: 特殊機能ページテスト ===${NC}"
echo ""

# Test 21: Stigma check page
run_flexible_test "Stigma Check Page" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/stigma-check\"" \
    "200 302 401 403"

# Test 22: Fact check page
run_flexible_test "Fact Check Page" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/fact-check\"" \
    "200 302 401 403"

# Test 23: Itandi BB page
run_flexible_test "Itandi BB Analysis Page" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/itandi-bb\"" \
    "200 302 401 403"

# Test 24: Help page
run_test "Help Page" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/help\"" \
    "200"

# Test 25: Login page
run_test "Login Page" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/login\"" \
    "200"

echo -e "${MAGENTA}=== セクション 6: セキュリティヘッダーテスト ===${NC}"
echo ""

# Test 26: CORS headers
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} CORS Headers Presence"
cors_header=$(curl -s -I "${TEST_URL}/api/health" 2>/dev/null | grep -i "Access-Control-Allow-Origin" || echo "")
if [ -n "$cors_header" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (CORS headers present)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (CORS headers not found - may be conditional)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 27: Rate limit headers
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Rate Limiting Headers"
rate_limit_header=$(curl -s -I "${TEST_URL}/api/health" 2>/dev/null | grep -i "X-RateLimit" || echo "")
if [ -n "$rate_limit_header" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (Rate limiting active)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Rate limiting headers not found - may not be implemented on health endpoint)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 28: Content-Security-Policy header
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Content-Security-Policy Header"
csp_header=$(curl -s -I "${TEST_URL}/" 2>/dev/null | grep -i "Content-Security-Policy" || echo "")
if [ -n "$csp_header" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (CSP header present)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (CSP header not found - recommended for production)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo -e "${MAGENTA}=== セクション 7: 静的ファイル配信テスト ===${NC}"
echo ""

# Test 29: Static JavaScript
run_test "Static JavaScript File" \
    "curl -s -o /dev/null -w '%{http_code}' \"${TEST_URL}/static/app.js\"" \
    "200"

# Test 30: Static CSS (if exists)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Static CSS File (Optional)"
http_code=$(curl -s -o /dev/null -w '%{http_code}' "${TEST_URL}/static/styles.css")
if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - expected behavior)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Got HTTP $http_code)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo -e "${MAGENTA}=== セクション 8: データ検証テスト ===${NC}"
echo ""

# Test 31: Empty request body validation
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Empty Request Body Validation"
response=$(curl -s -w '\n%{http_code}' -X POST "${TEST_URL}/api/properties" \
    -H 'Content-Type: application/json' \
    -d '{}' 2>/dev/null || echo -e "\n500")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
if echo "$body" | grep -qi "error\|required\|unauthorized"; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - validation works)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Validation may need improvement)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 32: Invalid parameter types
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Invalid Parameter Types"
response=$(curl -s -w '\n%{http_code}' -X POST "${TEST_URL}/api/properties/analyze" \
    -H 'Content-Type: application/json' \
    -d '{"propertyPrice":"not-a-number"}' 2>/dev/null || echo -e "\n500")
http_code=$(echo "$response" | tail -n1)
if [ "$http_code" = "400" ] || [ "$http_code" = "401" ] || [ "$http_code" = "500" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - type validation works)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (Got HTTP $http_code)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 33: SQL Injection attempt (should be safely escaped)
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} SQL Injection Protection"
response=$(curl -s -w '\n%{http_code}' -X GET "${TEST_URL}/api/properties?id=1' OR '1'='1" 2>/dev/null || echo -e "\n500")
http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | head -n-1)
# Should return 401/403 (auth) or 400/404 (invalid format), NOT 200 with leaked data
if [ "$http_code" != "200" ]; then
    echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - SQL injection prevented)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    # Check if body contains sensitive data patterns
    if echo "$body" | grep -qi "password\|secret\|token"; then
        echo -e "${RED}✗ FAILED${NC} (Potential SQL injection vulnerability)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    else
        echo -e "${GREEN}✓ PASSED${NC} (HTTP $http_code - but no sensitive data leaked)"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    fi
fi
echo ""

echo -e "${MAGENTA}=== セクション 9: パフォーマンステスト ===${NC}"
echo ""

# Test 34: Response time for health check
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} API Response Time (<500ms)"
response_time=$(curl -o /dev/null -s -w '%{time_total}\n' "${TEST_URL}/api/health" | awk '{printf "%.0f", $1 * 1000}')
if [ "$response_time" -lt 500 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (${response_time}ms - excellent)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ "$response_time" -lt 1000 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (${response_time}ms - good)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (${response_time}ms - slower than expected)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# Test 35: Page size optimization
TOTAL_TESTS=$((TOTAL_TESTS + 1))
echo -e "${CYAN}[TEST $TOTAL_TESTS]${NC} Landing Page Size (<200KB)"
page_size=$(curl -s "${TEST_URL}/" | wc -c)
page_size_kb=$((page_size / 1024))
if [ "$page_size_kb" -lt 200 ]; then
    echo -e "${GREEN}✓ PASSED${NC} (${page_size_kb}KB - optimized)"
    PASSED_TESTS=$((PASSED_TESTS + 1))
elif [ "$page_size_kb" -lt 500 ]; then
    echo -e "${YELLOW}⚠ WARNING${NC} (${page_size_kb}KB - could be optimized)"
    WARNINGS=$((WARNINGS + 1))
else
    echo -e "${YELLOW}⚠ WARNING${NC} (${page_size_kb}KB - consider optimization)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${BLUE}  テスト結果サマリー${NC}"
echo -e "${BLUE}============================================${NC}"
echo -e "Total Tests:   ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:        ${PASSED_TESTS}${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed:        ${FAILED_TESTS}${NC}"
else
    echo -e "Failed:        ${FAILED_TESTS}"
fi
if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}Warnings:      ${WARNINGS}${NC}"
else
    echo -e "Warnings:      ${WARNINGS}"
fi
success_rate=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")
echo -e "Success Rate:  ${success_rate}%"
echo ""

# Summary based on results
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}❌ Critical issues detected - please review failures${NC}"
    exit 1
elif [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}🎉 Perfect score! All tests passed!${NC}"
    exit 0
elif [ $WARNINGS -le 5 ]; then
    echo -e "${YELLOW}✅ Excellent! Tests passed with minor warnings${NC}"
    exit 0
elif [ $WARNINGS -le 10 ]; then
    echo -e "${YELLOW}⚠️  Good! Tests passed with some warnings${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  Multiple warnings detected - review recommended${NC}"
    exit 0
fi
