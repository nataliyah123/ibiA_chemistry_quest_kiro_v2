#!/bin/bash

# Post-Deployment Verification Script
# Runs all deployment verification checks for CSS loading fix
# Requirements: 4.1, 4.2, 4.3

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL=${BASE_URL:-"http://localhost:3000"}
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="${SCRIPT_DIR}/../deployment-verification.log"

# Initialize log file
echo "=== Deployment Verification Started at $(date) ===" > "$LOG_FILE"

print_header() {
    echo -e "\n${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

run_check() {
    local check_name="$1"
    local command="$2"
    local log_section="$3"
    
    echo -e "\n--- Running $check_name ---" >> "$LOG_FILE"
    
    if eval "$command" >> "$LOG_FILE" 2>&1; then
        print_success "$check_name passed"
        return 0
    else
        print_error "$check_name failed"
        echo "Check the log file for details: $LOG_FILE"
        return 1
    fi
}

# Main verification function
main() {
    print_header "🚀 Post-Deployment Verification"
    
    echo "Base URL: $BASE_URL"
    echo "Log file: $LOG_FILE"
    echo ""
    
    local exit_code=0
    
    # 1. Nginx Configuration Check
    print_header "🔧 Nginx Configuration Check"
    if ! run_check "Nginx Configuration" "node '$SCRIPT_DIR/nginx-config-check.js'" "nginx-config"; then
        exit_code=1
    fi
    
    # 2. Container Health Check
    print_header "🐳 Container Health Check"
    if ! run_check "Container Health" "node '$SCRIPT_DIR/container-health-check.js' --baseUrl '$BASE_URL'" "container-health"; then
        exit_code=1
    fi
    
    # 3. Comprehensive Deployment Verification
    print_header "📋 Deployment Verification"
    if ! run_check "Deployment Verification" "node '$SCRIPT_DIR/deployment-verification.js' --baseUrl '$BASE_URL'" "deployment-verification"; then
        exit_code=1
    fi
    
    # 4. CSS Asset Diagnostic (existing script)
    print_header "🎨 CSS Asset Diagnostic"
    if [ -f "$SCRIPT_DIR/comprehensive-css-diagnostic.js" ]; then
        if ! run_check "CSS Asset Diagnostic" "node '$SCRIPT_DIR/comprehensive-css-diagnostic.js'" "css-diagnostic"; then
            print_warning "CSS diagnostic failed but continuing..."
        fi
    else
        print_warning "CSS diagnostic script not found, skipping..."
    fi
    
    # 5. Docker Health Check (existing script)
    print_header "🏥 Docker Health Check"
    if [ -f "$SCRIPT_DIR/docker-health-check.sh" ]; then
        if ! run_check "Docker Health Check" "bash '$SCRIPT_DIR/docker-health-check.sh'" "docker-health"; then
            print_warning "Docker health check failed but continuing..."
        fi
    else
        print_warning "Docker health check script not found, skipping..."
    fi
    
    # Summary
    print_header "📊 Verification Summary"
    
    if [ $exit_code -eq 0 ]; then
        print_success "All critical checks passed!"
        echo -e "\n${GREEN}🎉 Deployment verification completed successfully!${NC}"
        echo -e "${GREEN}Your CSS loading fix deployment is ready.${NC}\n"
    else
        print_error "Some critical checks failed!"
        echo -e "\n${RED}💥 Deployment verification failed!${NC}"
        echo -e "${RED}Please review the issues above and check the log file:${NC}"
        echo -e "${RED}$LOG_FILE${NC}\n"
        
        # Show recent errors from log
        echo -e "${YELLOW}Recent errors from log:${NC}"
        tail -20 "$LOG_FILE" | grep -E "(ERROR|FAIL|❌)" || echo "No specific errors found in recent log entries"
    fi
    
    echo "=== Deployment Verification Completed at $(date) ===" >> "$LOG_FILE"
    
    return $exit_code
}

# Help function
show_help() {
    echo "Post-Deployment Verification Script"
    echo ""
    echo "Usage: $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -u, --url URL     Base URL for the application (default: http://localhost:3000)"
    echo "  -h, --help        Show this help message"
    echo "  --nginx-only      Run only nginx configuration check"
    echo "  --container-only  Run only container health check"
    echo "  --assets-only     Run only asset verification"
    echo ""
    echo "Environment Variables:"
    echo "  BASE_URL          Base URL for the application"
    echo ""
    echo "Examples:"
    echo "  $0                                    # Run all checks with default URL"
    echo "  $0 -u http://localhost:8080          # Run all checks with custom URL"
    echo "  $0 --nginx-only                      # Run only nginx checks"
    echo "  BASE_URL=https://myapp.com $0        # Run with environment variable"
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -u|--url)
            BASE_URL="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        --nginx-only)
            print_header "🔧 Nginx Configuration Check Only"
            node "$SCRIPT_DIR/nginx-config-check.js"
            exit $?
            ;;
        --container-only)
            print_header "🐳 Container Health Check Only"
            node "$SCRIPT_DIR/container-health-check.js" --baseUrl "$BASE_URL"
            exit $?
            ;;
        --assets-only)
            print_header "📋 Asset Verification Only"
            node "$SCRIPT_DIR/deployment-verification.js" --baseUrl "$BASE_URL"
            exit $?
            ;;
        *)
            echo "Unknown option: $1"
            show_help
            exit 1
            ;;
    esac
done

# Run main function
main
exit $?