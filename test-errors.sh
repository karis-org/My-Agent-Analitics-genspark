#!/bin/bash

# Error Test Script for My Agent Analytics
# Tests various error scenarios and edge cases

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Base URLs
LOCAL_URL="http://localhost:3000"
PROD_URL="https://15829326.my-agent-analytics.pages.dev"

# Choose test target (default: local)
TEST_URL="${1:-$LOCAL_URL}"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  エラーテスト実行開始${NC}"
echo -e "${BLUE}  Test Target: ${TEST_URL}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Helper function to run a test
run_test() {
    local test_name="$1"
    local test_command="$2"
    local expected_result="$3"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    echo -e "${YELLOW}[TEST $TOTAL_TESTS]${NC} $test_name"
    
    if eval "$test_command"; then
        if [ "$expected_result" = "success" ]; then
            echo -e "${GREEN}✓ PASSED${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ FAILED (expected failure but got success)${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    else
        if [ "$expected_result" = "failure" ]; then
            echo -e "${GREEN}✓ PASSED (correctly handled error)${NC}"
            PASSED_TESTS=$((PASSED_TESTS + 1))
        else
            echo -e "${RED}✗ FAILED${NC}"
            FAILED_TESTS=$((FAILED_TESTS + 1))
        fi
    fi
    echo ""
}

# Test 1: API Health Check (should succeed)
run_test "API Health Check" \
    "curl -s -f \"${TEST_URL}/api/health\" > /dev/null" \
    "success"

# Test 2: Non-existent API endpoint (should fail gracefully)
run_test "Non-existent API endpoint (404)" \
    "curl -s \"${TEST_URL}/api/nonexistent\" | grep -q '404\\|error'" \
    "success"

# Test 3: Invalid property ID (should return 404)
run_test "Invalid property ID" \
    "curl -s \"${TEST_URL}/api/properties/99999\" | grep -q 'not found\\|404'" \
    "success"

# Test 4: Missing required fields in property creation
run_test "Missing required fields (400 Bad Request)" \
    "curl -s -X POST \"${TEST_URL}/api/properties\" -H 'Content-Type: application/json' -d '{}' | grep -q 'error\\|required'" \
    "success"

# Test 5: Invalid JSON payload
run_test "Invalid JSON payload" \
    "curl -s -X POST \"${TEST_URL}/api/properties\" -H 'Content-Type: application/json' -d 'invalid json' 2>&1 | grep -q 'error\\|invalid'" \
    "success"

# Test 6: Unauthorized access without auth (should redirect or return 401)
run_test "Unauthorized access to protected route" \
    "curl -s -w '%{http_code}' \"${TEST_URL}/dashboard\" | grep -q '302\\|401\\|403'" \
    "success"

# Test 7: Static file not found (should return 404)
run_test "Static file not found (404)" \
    "curl -s -I \"${TEST_URL}/static/nonexistent.js\" | grep -q '404'" \
    "success"

# Test 8: Large payload (test payload limit)
run_test "Large payload handling" \
    "dd if=/dev/zero bs=1M count=20 2>/dev/null | curl -s -X POST \"${TEST_URL}/api/properties\" -H 'Content-Type: application/json' --data-binary @- 2>&1 | grep -q 'error\\|too large\\|413'" \
    "success"

# Test 9: SQL injection attempt (should be sanitized)
run_test "SQL injection prevention" \
    "curl -s -X POST \"${TEST_URL}/api/properties/analyze\" -H 'Content-Type: application/json' -d '{\"propertyPrice\":\"DROP TABLE properties\"}' | grep -q 'error\\|invalid'" \
    "success"

# Test 10: XSS attempt (should be escaped)
run_test "XSS prevention" \
    "curl -s \"${TEST_URL}/api/properties\" -H 'Content-Type: application/json' -d '{\"name\":\"<script>alert(1)</script>\"}' | grep -q 'error\\|&lt;script&gt;\\|escaped'" \
    "success"

# Test 11: Rate limiting (make multiple rapid requests)
run_test "Rate limiting test" \
    "for i in {1..110}; do curl -s \"${TEST_URL}/api/health\" > /dev/null & done; wait; curl -s \"${TEST_URL}/api/health\" | grep -q 'rate limit\\|429\\|too many'" \
    "success"

# Test 12: CORS headers presence
run_test "CORS headers check" \
    "curl -s -I \"${TEST_URL}/api/health\" | grep -q 'Access-Control-Allow-Origin'" \
    "success"

# Test 13: Invalid HTTP method (should return 405)
run_test "Invalid HTTP method (405)" \
    "curl -s -X DELETE \"${TEST_URL}/api/health\" 2>&1 | grep -q '405\\|not allowed\\|error'" \
    "success"

# Test 14: Missing Content-Type header
run_test "Missing Content-Type header" \
    "curl -s -X POST \"${TEST_URL}/api/properties\" -d '{\"name\":\"test\"}' | grep -q 'error\\|content-type'" \
    "success"

# Test 15: Timeout test (long-running request)
run_test "Request timeout handling" \
    "timeout 5 curl -s \"${TEST_URL}/api/ai/analyze-market\" -H 'Content-Type: application/json' -d '{\"area\":\"test\"}' 2>&1 | grep -q 'error\\|timeout\\|timed out'" \
    "success"

# Test 16: Empty request body
run_test "Empty request body" \
    "curl -s -X POST \"${TEST_URL}/api/properties/analyze\" -H 'Content-Type: application/json' -d '' | grep -q 'error\\|required\\|invalid'" \
    "success"

# Test 17: Invalid property type
run_test "Invalid property type" \
    "curl -s -X POST \"${TEST_URL}/api/properties\" -H 'Content-Type: application/json' -d '{\"name\":\"test\",\"price\":\"not a number\"}' | grep -q 'error\\|invalid'" \
    "success"

# Test 18: Negative values
run_test "Negative values validation" \
    "curl -s -X POST \"${TEST_URL}/api/properties/analyze\" -H 'Content-Type: application/json' -d '{\"propertyPrice\":-1000000}' | grep -q 'error\\|invalid\\|negative'" \
    "success"

# Test 19: Edit non-existent property
run_test "Edit non-existent property" \
    "curl -s \"${TEST_URL}/properties/99999/edit\" | grep -q '404\\|not found\\|見つかりません'" \
    "success"

# Test 20: Comprehensive analysis with invalid ID
run_test "Comprehensive analysis - invalid property ID" \
    "curl -s \"${TEST_URL}/properties/99999/comprehensive-report\" | grep -q 'error\\|not found\\|見つかりません'" \
    "success"

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  テスト結果サマリー${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
if [ $FAILED_TESTS -gt 0 ]; then
    echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"
else
    echo -e "Failed:       ${FAILED_TESTS}"
fi
echo -e "Success Rate: $(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS/$TOTAL_TESTS)*100}")%"
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
