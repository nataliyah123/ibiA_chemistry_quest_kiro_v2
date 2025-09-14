#!/bin/bash

# CSS Asset Testing Script
# 
# This script tests CSS asset accessibility through nginx configuration
# and verifies asset paths and MIME types are correct.
# 
# Requirements addressed:
# - 1.1: Verify CSS styling remains consistent after login
# - 2.2: Test CSS accessibility through nginx configuration

set -e

# Configuration
BASE_URL="${BASE_URL:-http://localhost:80}"
TIMEOUT="${TIMEOUT:-10}"
VERBOSE="${VERBOSE:-false}"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

log_verbose() {
    if [ "$VERBOSE" = "true" ]; then
        echo -e "${NC}   $1${NC}"
    fi
}

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Function to run a test
run_test() {
    local test_name="$1"
    local url="$2"
    local expected_status="${3:-200}"
    local expected_content_type="$4"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    
    log_info "Testing: $test_name"
    log_verbose "URL: $url"
    
    # Make HTTP request and capture response
    local response
    local status_code
    local content_type
    local cache_control
    local content_length
    
    if response=$(curl -s -w "%{http_code}|%{content_type}|%{header_cache-control}|%{size_download}" \
                      --max-time "$TIMEOUT" \
                      --connect-timeout 5 \
                      "$url" 2>/dev/null); then
        
        # Parse response
        local body="${response%|*|*|*}"
        local headers="${response##*|}"
        
        # Extract status code and headers
        IFS='|' read -r status_code content_type cache_control content_length <<< "$headers"
        
        log_verbose "Status: $status_code"
        log_verbose "Content-Type: $content_type"
        log_verbose "Cache-Control: $cache_control"
        log_verbose "Content-Length: $content_length"
        
        # Check status code
        if [ "$status_code" = "$expected_status" ]; then
            # Check content type if specified
            if [ -n "$expected_content_type" ]; then
                if [[ "$content_type" == *"$expected_content_type"* ]]; then
                    log_success "$test_name - Status: $status_code, Content-Type: $content_type"
                    PASSED_TESTS=$((PASSED_TESTS + 1))
                    return 0
                else
                    log_error "$test_name - Wrong content type. Expected: $expected_content_type, Got: $content_type"
                    FAILED_TESTS=$((FAILED_TESTS + 1))
                    return 1
                fi
            else
                log_success "$test_name - Status: $status_code"
                PASSED_TESTS=$((PASSED_TESTS + 1))
                return 0
            fi
        else
            log_error "$test_name - Wrong status code. Expected: $expected_status, Got: $status_code"
            FAILED_TESTS=$((FAILED_TESTS + 1))
            return 1
        fi
    else
        log_error "$test_name - Request failed (timeout or connection error)"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        return 1
    fi
}

# Function to extract CSS asset path from index.html
get_css_asset_path() {
    local index_url="$BASE_URL/"
    local css_path
    
    log_info "Extracting CSS asset path from index.html..."
    
    if css_path=$(curl -s --max-time "$TIMEOUT" "$index_url" | grep -o 'href="[^"]*\.css"' | head -1 | sed 's/href="//;s/"//'); then
        if [ -n "$css_path" ]; then
            log_success "Found CSS asset: $css_path"
            echo "$css_path"
            return 0
        fi
    fi
    
    log_warning "Could not extract CSS asset path from index.html, using fallback"
    echo "/assets/index.css"
    return 1
}

# Function to test different routes
test_routes() {
    log_info "Testing CSS accessibility from different routes..."
    
    local routes=("/" "/login" "/register" "/dashboard" "/profile" "/demo" "/content-management")
    
    for route in "${routes[@]}"; do
        local route_name="${route//\//_}"
        [ "$route_name" = "_" ] && route_name="root"
        
        run_test "Route $route" "$BASE_URL$route" "200" "text/html"
    done
}

# Function to test CSS asset directly
test_css_asset() {
    local css_path="$1"
    
    log_info "Testing CSS asset accessibility..."
    
    # Test direct access
    run_test "CSS Asset Direct" "$BASE_URL$css_path" "200" "text/css"
    
    # Test with different variations
    local variations=(
        "${css_path#/}"  # Remove leading slash
        "/client$css_path"  # Add client prefix
        "$css_path?v=1"  # Add version parameter
        "$css_path?cb=$(date +%s)"  # Add cache buster
    )
    
    for variation in "${variations[@]}"; do
        run_test "CSS Asset Variation" "$BASE_URL/$variation" "200" "text/css"
    done
}

# Function to test cache headers
test_cache_headers() {
    local css_path="$1"
    
    log_info "Testing cache headers..."
    
    local response
    if response=$(curl -s -I --max-time "$TIMEOUT" "$BASE_URL$css_path" 2>/dev/null); then
        log_verbose "Response headers:"
        log_verbose "$response"
        
        # Check for expected cache headers
        if echo "$response" | grep -qi "cache-control.*public"; then
            log_success "Cache-Control header contains 'public'"
        else
            log_warning "Cache-Control header missing or doesn't contain 'public'"
        fi
        
        if echo "$response" | grep -qi "cache-control.*immutable"; then
            log_success "Cache-Control header contains 'immutable'"
        else
            log_warning "Cache-Control header missing or doesn't contain 'immutable'"
        fi
        
        if echo "$response" | grep -qi "access-control-allow-origin"; then
            log_success "CORS header present"
        else
            log_warning "CORS header missing"
        fi
    else
        log_error "Failed to get headers for cache test"
    fi
}

# Function to test MIME types
test_mime_types() {
    log_info "Testing MIME types for different asset types..."
    
    local asset_tests=(
        "/assets/test.css:text/css"
        "/assets/test.js:application/javascript"
        "/assets/test.png:image/png"
        "/assets/test.svg:image/svg+xml"
    )
    
    for asset_test in "${asset_tests[@]}"; do
        local asset_path="${asset_test%:*}"
        local expected_mime="${asset_test#*:}"
        
        # Note: These might not exist, so we expect 404 but check the content-type header
        local response
        if response=$(curl -s -I --max-time "$TIMEOUT" "$BASE_URL$asset_path" 2>/dev/null); then
            local content_type
            content_type=$(echo "$response" | grep -i "content-type" | cut -d: -f2 | tr -d ' \r\n')
            
            if [[ "$content_type" == *"$expected_mime"* ]]; then
                log_success "MIME type for $asset_path: $content_type"
            else
                log_warning "MIME type for $asset_path: Expected $expected_mime, Got $content_type"
            fi
        fi
    done
}

# Function to test nginx configuration
test_nginx_config() {
    log_info "Testing nginx configuration..."
    
    # Test gzip compression
    local response
    if response=$(curl -s -H "Accept-Encoding: gzip" -I --max-time "$TIMEOUT" "$BASE_URL/" 2>/dev/null); then
        if echo "$response" | grep -qi "content-encoding.*gzip"; then
            log_success "Gzip compression enabled"
        else
            log_warning "Gzip compression not detected"
        fi
    fi
    
    # Test security headers
    if echo "$response" | grep -qi "x-frame-options"; then
        log_success "X-Frame-Options header present"
    else
        log_warning "X-Frame-Options header missing"
    fi
    
    if echo "$response" | grep -qi "x-content-type-options"; then
        log_success "X-Content-Type-Options header present"
    else
        log_warning "X-Content-Type-Options header missing"
    fi
}

# Main execution
main() {
    echo "🔍 CSS Asset Testing Script"
    echo "=========================="
    echo "Base URL: $BASE_URL"
    echo "Timeout: ${TIMEOUT}s"
    echo ""
    
    # Test if server is reachable
    log_info "Testing server connectivity..."
    if ! curl -s --max-time 5 --connect-timeout 3 "$BASE_URL/" > /dev/null 2>&1; then
        log_error "Server not reachable at $BASE_URL"
        log_info "Make sure the application is running and accessible"
        exit 1
    fi
    log_success "Server is reachable"
    echo ""
    
    # Get CSS asset path
    CSS_ASSET_PATH=$(get_css_asset_path)
    echo ""
    
    # Run tests
    test_routes
    echo ""
    
    test_css_asset "$CSS_ASSET_PATH"
    echo ""
    
    test_cache_headers "$CSS_ASSET_PATH"
    echo ""
    
    test_mime_types
    echo ""
    
    test_nginx_config
    echo ""
    
    # Summary
    echo "📊 Test Summary"
    echo "==============="
    echo "Total Tests: $TOTAL_TESTS"
    echo "Passed: $PASSED_TESTS ✅"
    echo "Failed: $FAILED_TESTS ❌"
    
    if [ $FAILED_TESTS -eq 0 ]; then
        echo ""
        log_success "All tests passed! 🎉"
        exit 0
    else
        echo ""
        log_error "Some tests failed. Check the output above for details."
        exit 1
    fi
}

# Handle command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --url)
            BASE_URL="$2"
            shift 2
            ;;
        --timeout)
            TIMEOUT="$2"
            shift 2
            ;;
        --verbose)
            VERBOSE="true"
            shift
            ;;
        --help)
            echo "Usage: $0 [OPTIONS]"
            echo ""
            echo "Options:"
            echo "  --url URL       Base URL to test (default: http://localhost:80)"
            echo "  --timeout SEC   Request timeout in seconds (default: 10)"
            echo "  --verbose       Enable verbose output"
            echo "  --help          Show this help message"
            echo ""
            echo "Environment variables:"
            echo "  BASE_URL        Same as --url"
            echo "  TIMEOUT         Same as --timeout"
            echo "  VERBOSE         Same as --verbose (set to 'true')"
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Run main function
main