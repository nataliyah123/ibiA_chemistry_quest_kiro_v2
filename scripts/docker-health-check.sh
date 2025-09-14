#!/bin/bash

# Docker Health Check Script for CSS Assets
# This script is designed to run inside the container to verify asset health

set -e

# Configuration
STATIC_PATH="${STATIC_PATH:-/usr/share/nginx/html}"
ASSETS_PATH="${STATIC_PATH}/assets"
SERVER_URL="${SERVER_URL:-http://localhost:5000}"
CLIENT_URL="${CLIENT_URL:-http://localhost:3000}"
TIMEOUT=10

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Health check results
HEALTH_STATUS="healthy"
ISSUES_COUNT=0
CHECKS_PASSED=0
TOTAL_CHECKS=0

# Function to increment check counters
check_result() {
    local result=$1
    local message=$2
    
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
    
    if [ "$result" = "pass" ]; then
        CHECKS_PASSED=$((CHECKS_PASSED + 1))
        log_info "$message"
    else
        ISSUES_COUNT=$((ISSUES_COUNT + 1))
        HEALTH_STATUS="unhealthy"
        log_error "$message"
    fi
}

# Check if assets directory exists
check_assets_directory() {
    log_info "Checking assets directory..."
    
    if [ -d "$ASSETS_PATH" ]; then
        check_result "pass" "Assets directory exists: $ASSETS_PATH"
    else
        check_result "fail" "Assets directory not found: $ASSETS_PATH"
        return 1
    fi
}

# Check CSS files exist and are readable
check_css_files() {
    log_info "Checking CSS files..."
    
    local css_files_found=0
    local css_files_valid=0
    
    if [ -d "$ASSETS_PATH" ]; then
        for file in "$ASSETS_PATH"/*.css; do
            if [ -f "$file" ]; then
                css_files_found=$((css_files_found + 1))
                
                # Check if file is readable and not empty
                if [ -r "$file" ] && [ -s "$file" ]; then
                    # Basic validation - check if it contains CSS-like content
                    if grep -q -E '\{|\}|:|;' "$file" 2>/dev/null; then
                        css_files_valid=$((css_files_valid + 1))
                        check_result "pass" "Valid CSS file: $(basename "$file") ($(stat -f%z "$file" 2>/dev/null || stat -c%s "$file") bytes)"
                    else
                        check_result "fail" "Invalid CSS content: $(basename "$file")"
                    fi
                else
                    check_result "fail" "CSS file not readable or empty: $(basename "$file")"
                fi
            fi
        done
    fi
    
    if [ $css_files_found -eq 0 ]; then
        check_result "fail" "No CSS files found in assets directory"
    else
        log_info "Found $css_files_found CSS files, $css_files_valid valid"
    fi
}

# Check nginx is serving files correctly
check_nginx_serving() {
    log_info "Checking nginx file serving..."
    
    # Check if we can access a CSS file via HTTP
    local css_file=$(find "$ASSETS_PATH" -name "*.css" -type f | head -1)
    
    if [ -n "$css_file" ]; then
        local css_filename=$(basename "$css_file")
        local css_url="${CLIENT_URL}/assets/${css_filename}"
        
        # Use curl to test HTTP access
        if command -v curl >/dev/null 2>&1; then
            local response=$(curl -s -o /dev/null -w "%{http_code}:%{content_type}" --connect-timeout $TIMEOUT "$css_url" 2>/dev/null || echo "000:")
            local status_code=$(echo "$response" | cut -d: -f1)
            local content_type=$(echo "$response" | cut -d: -f2)
            
            if [ "$status_code" = "200" ]; then
                if [[ "$content_type" == *"text/css"* ]]; then
                    check_result "pass" "CSS file accessible via HTTP: $css_url (Content-Type: $content_type)"
                else
                    check_result "fail" "CSS file has wrong content type: $content_type (expected text/css)"
                fi
            else
                check_result "fail" "CSS file not accessible via HTTP: $css_url (Status: $status_code)"
            fi
        else
            log_warn "curl not available, skipping HTTP check"
        fi
    else
        check_result "fail" "No CSS files available to test HTTP serving"
    fi
}

# Check server health endpoint
check_server_health() {
    log_info "Checking server health endpoint..."
    
    if command -v curl >/dev/null 2>&1; then
        local health_url="${SERVER_URL}/api/health/assets/css"
        local response=$(curl -s --connect-timeout $TIMEOUT "$health_url" 2>/dev/null || echo "")
        
        if [ -n "$response" ]; then
            # Try to parse JSON response (basic check)
            if echo "$response" | grep -q '"status"'; then
                local status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
                if [ "$status" = "healthy" ]; then
                    check_result "pass" "Server health endpoint reports healthy status"
                else
                    check_result "fail" "Server health endpoint reports status: $status"
                fi
            else
                check_result "fail" "Server health endpoint returned invalid response"
            fi
        else
            check_result "fail" "Server health endpoint not accessible: $health_url"
        fi
    else
        log_warn "curl not available, skipping server health check"
    fi
}

# Check file permissions
check_permissions() {
    log_info "Checking file permissions..."
    
    if [ -d "$ASSETS_PATH" ]; then
        # Check directory permissions
        if [ -r "$ASSETS_PATH" ] && [ -x "$ASSETS_PATH" ]; then
            check_result "pass" "Assets directory has correct permissions"
        else
            check_result "fail" "Assets directory permissions issue"
        fi
        
        # Check CSS file permissions
        local permission_issues=0
        for file in "$ASSETS_PATH"/*.css; do
            if [ -f "$file" ]; then
                if [ ! -r "$file" ]; then
                    permission_issues=$((permission_issues + 1))
                    check_result "fail" "CSS file not readable: $(basename "$file")"
                fi
            fi
        done
        
        if [ $permission_issues -eq 0 ]; then
            check_result "pass" "All CSS files have correct permissions"
        fi
    fi
}

# Main health check function
main() {
    echo "🏥 Docker Container CSS Asset Health Check"
    echo "=========================================="
    echo "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
    echo "Static Path: $STATIC_PATH"
    echo "Assets Path: $ASSETS_PATH"
    echo "Client URL: $CLIENT_URL"
    echo "Server URL: $SERVER_URL"
    echo ""
    
    # Run all checks
    check_assets_directory
    check_css_files
    check_permissions
    check_nginx_serving
    check_server_health
    
    # Print summary
    echo ""
    echo "📊 Health Check Summary"
    echo "======================"
    echo "Total Checks: $TOTAL_CHECKS"
    echo "Passed: $CHECKS_PASSED"
    echo "Failed: $ISSUES_COUNT"
    echo "Status: $HEALTH_STATUS"
    
    # Set exit code based on health status
    if [ "$HEALTH_STATUS" = "healthy" ]; then
        log_info "✅ Container CSS assets are healthy"
        exit 0
    else
        log_error "❌ Container CSS assets have issues"
        exit 1
    fi
}

# Run main function
main "$@"