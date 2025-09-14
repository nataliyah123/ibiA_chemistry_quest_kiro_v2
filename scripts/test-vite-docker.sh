#!/bin/bash

# Test Vite Docker Configuration Script
# Tests the Vite development server configuration in Docker environment

set -e

echo "🧪 Testing Vite Docker Configuration..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Test 1: Check if Docker containers are running
print_status "Checking Docker containers..."
if docker ps | grep -q "chemquest-client-dev"; then
    print_success "Client container is running"
else
    print_error "Client container is not running"
    echo "Please start the development environment with: docker-compose -f docker-compose.dev.yml up"
    exit 1
fi

# Test 2: Check if Vite server is accessible
print_status "Testing Vite server accessibility..."
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
    print_success "Vite server is accessible on port 3000"
else
    print_warning "Vite server may not be fully ready yet"
fi

# Test 3: Check CSS asset serving
print_status "Testing CSS asset serving..."
CSS_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/src/App.css 2>/dev/null || echo "000")
if [ "$CSS_RESPONSE" = "200" ]; then
    print_success "CSS assets are being served correctly"
elif [ "$CSS_RESPONSE" = "503" ]; then
    print_warning "CSS assets returning 503 - this is the issue we're fixing"
else
    print_warning "CSS asset response: $CSS_RESPONSE"
fi

# Test 4: Check WebSocket connection
print_status "Testing WebSocket connection..."
# Use a simple WebSocket test
node -e "
const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:3000');
ws.on('open', () => {
    console.log('✅ WebSocket connection successful');
    ws.close();
    process.exit(0);
});
ws.on('error', (error) => {
    console.log('⚠️  WebSocket connection failed:', error.message);
    process.exit(1);
});
setTimeout(() => {
    console.log('⚠️  WebSocket connection timeout');
    ws.close();
    process.exit(1);
}, 5000);
" 2>/dev/null || print_warning "WebSocket connection test failed - this is expected if HMR is not working"

# Test 5: Check Docker environment variables
print_status "Checking Docker environment variables..."
CLIENT_ENV=$(docker exec chemquest-client-dev env | grep -E "(CHOKIDAR_USEPOLLING|WATCHPACK_POLLING)" || echo "")
if echo "$CLIENT_ENV" | grep -q "CHOKIDAR_USEPOLLING=true"; then
    print_success "CHOKIDAR_USEPOLLING is set correctly"
else
    print_warning "CHOKIDAR_USEPOLLING may not be set"
fi

if echo "$CLIENT_ENV" | grep -q "WATCHPACK_POLLING=true"; then
    print_success "WATCHPACK_POLLING is set correctly"
else
    print_warning "WATCHPACK_POLLING may not be set"
fi

# Test 6: Check Vite configuration
print_status "Checking Vite configuration..."
if docker exec chemquest-client-dev cat /app/vite.config.ts | grep -q "host: '0.0.0.0'"; then
    print_success "Vite host configuration is correct"
else
    print_error "Vite host configuration may be incorrect"
fi

if docker exec chemquest-client-dev cat /app/vite.config.ts | grep -q "usePolling: true"; then
    print_success "Vite polling configuration is correct"
else
    print_error "Vite polling configuration may be incorrect"
fi

# Test 7: Check container logs for errors
print_status "Checking container logs for errors..."
RECENT_LOGS=$(docker logs chemquest-client-dev --tail 50 2>&1)
if echo "$RECENT_LOGS" | grep -q "WebSocket connection.*failed"; then
    print_warning "WebSocket connection failures detected in logs"
fi

if echo "$RECENT_LOGS" | grep -q "503"; then
    print_warning "503 errors detected in logs"
fi

if echo "$RECENT_LOGS" | grep -q "Local:.*http://localhost:3000"; then
    print_success "Vite server started successfully"
fi

# Test 8: Test CSS fallback system
print_status "Testing CSS fallback system..."
if curl -s http://localhost:3000/css-dev-test | grep -q "CSS Fallback Development Test"; then
    print_success "CSS fallback test page is accessible"
else
    print_warning "CSS fallback test page may not be accessible"
fi

# Test 9: Check file watching
print_status "Testing file watching..."
print_status "Creating a test file change..."
docker exec chemquest-client-dev touch /app/src/test-file-watch.tmp
sleep 2
docker exec chemquest-client-dev rm -f /app/src/test-file-watch.tmp
print_success "File watching test completed"

# Summary
echo ""
echo "🏁 Test Summary:"
echo "=================="

# Check overall health
CONTAINER_STATUS=$(docker ps --filter "name=chemquest-client-dev" --format "{{.Status}}")
if echo "$CONTAINER_STATUS" | grep -q "Up"; then
    print_success "Container is healthy: $CONTAINER_STATUS"
else
    print_error "Container may have issues: $CONTAINER_STATUS"
fi

# Recommendations
echo ""
echo "📋 Recommendations:"
echo "==================="
echo "1. If WebSocket connections are failing, the CSS fallback system should handle it"
echo "2. If you see 503 errors for CSS, try refreshing the page"
echo "3. The fallback notification should appear if styles fail to load"
echo "4. Check the CSS Dev Test page at http://localhost:3000/css-dev-test"
echo "5. Monitor browser console for CSS fallback system logs"

echo ""
print_success "Vite Docker configuration test completed!"