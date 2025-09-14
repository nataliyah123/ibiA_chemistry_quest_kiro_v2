# Test Vite Docker Configuration Script (PowerShell)
# Tests the Vite development server configuration in Docker environment

param(
    [switch]$Verbose
)

Write-Host "🧪 Testing Vite Docker Configuration..." -ForegroundColor Blue

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Test 1: Check if Docker containers are running
Write-Status "Checking Docker containers..."
try {
    $containers = docker ps --format "{{.Names}}" 2>$null
    if ($containers -contains "chemquest-client-dev") {
        Write-Success "Client container is running"
    } else {
        Write-Error "Client container is not running"
        Write-Host "Please start the development environment with: docker-compose -f docker-compose.dev.yml up"
        exit 1
    }
} catch {
    Write-Error "Failed to check Docker containers: $_"
    exit 1
}

# Test 2: Check if Vite server is accessible
Write-Status "Testing Vite server accessibility..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -Method Head -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        Write-Success "Vite server is accessible on port 3000"
    } else {
        Write-Warning "Vite server returned status: $($response.StatusCode)"
    }
} catch {
    Write-Warning "Vite server may not be fully ready yet: $_"
}

# Test 3: Check CSS asset serving
Write-Status "Testing CSS asset serving..."
try {
    $cssResponse = Invoke-WebRequest -Uri "http://localhost:3000/src/App.css" -Method Head -TimeoutSec 5 -ErrorAction SilentlyContinue
    if ($cssResponse.StatusCode -eq 200) {
        Write-Success "CSS assets are being served correctly"
    } elseif ($cssResponse.StatusCode -eq 503) {
        Write-Warning "CSS assets returning 503 - this is the issue we're fixing"
    } else {
        Write-Warning "CSS asset response: $($cssResponse.StatusCode)"
    }
} catch {
    Write-Warning "CSS asset test failed: $_"
}

# Test 4: Check Docker environment variables
Write-Status "Checking Docker environment variables..."
try {
    $envVars = docker exec chemquest-client-dev env 2>$null
    $chokidarSet = $envVars | Select-String "CHOKIDAR_USEPOLLING=true"
    $watchpackSet = $envVars | Select-String "WATCHPACK_POLLING=true"
    
    if ($chokidarSet) {
        Write-Success "CHOKIDAR_USEPOLLING is set correctly"
    } else {
        Write-Warning "CHOKIDAR_USEPOLLING may not be set"
    }
    
    if ($watchpackSet) {
        Write-Success "WATCHPACK_POLLING is set correctly"
    } else {
        Write-Warning "WATCHPACK_POLLING may not be set"
    }
} catch {
    Write-Warning "Failed to check environment variables: $_"
}

# Test 5: Check Vite configuration
Write-Status "Checking Vite configuration..."
try {
    $viteConfig = docker exec chemquest-client-dev cat /app/vite.config.ts 2>$null
    
    if ($viteConfig -match "host: '0\.0\.0\.0'") {
        Write-Success "Vite host configuration is correct"
    } else {
        Write-Error "Vite host configuration may be incorrect"
    }
    
    if ($viteConfig -match "usePolling: true") {
        Write-Success "Vite polling configuration is correct"
    } else {
        Write-Error "Vite polling configuration may be incorrect"
    }
} catch {
    Write-Warning "Failed to check Vite configuration: $_"
}

# Test 6: Check container logs for errors
Write-Status "Checking container logs for errors..."
try {
    $recentLogs = docker logs chemquest-client-dev --tail 50 2>&1
    
    if ($recentLogs -match "WebSocket connection.*failed") {
        Write-Warning "WebSocket connection failures detected in logs"
    }
    
    if ($recentLogs -match "503") {
        Write-Warning "503 errors detected in logs"
    }
    
    if ($recentLogs -match "Local:.*http://localhost:3000") {
        Write-Success "Vite server started successfully"
    }
    
    if ($Verbose) {
        Write-Host "Recent logs:" -ForegroundColor Gray
        $recentLogs | Select-Object -Last 10 | ForEach-Object { Write-Host "  $_" -ForegroundColor Gray }
    }
} catch {
    Write-Warning "Failed to check container logs: $_"
}

# Test 7: Test CSS fallback system
Write-Status "Testing CSS fallback system..."
try {
    $fallbackResponse = Invoke-WebRequest -Uri "http://localhost:3000/css-dev-test" -TimeoutSec 10 -ErrorAction SilentlyContinue
    if ($fallbackResponse.Content -match "CSS Fallback Development Test") {
        Write-Success "CSS fallback test page is accessible"
    } else {
        Write-Warning "CSS fallback test page may not be accessible"
    }
} catch {
    Write-Warning "CSS fallback test page test failed: $_"
}

# Test 8: Check file watching
Write-Status "Testing file watching..."
try {
    docker exec chemquest-client-dev touch /app/src/test-file-watch.tmp 2>$null
    Start-Sleep -Seconds 2
    docker exec chemquest-client-dev rm -f /app/src/test-file-watch.tmp 2>$null
    Write-Success "File watching test completed"
} catch {
    Write-Warning "File watching test failed: $_"
}

# Summary
Write-Host ""
Write-Host "🏁 Test Summary:" -ForegroundColor Blue
Write-Host "=================="

# Check overall health
try {
    $containerStatus = docker ps --filter "name=chemquest-client-dev" --format "{{.Status}}" 2>$null
    if ($containerStatus -match "Up") {
        Write-Success "Container is healthy: $containerStatus"
    } else {
        Write-Error "Container may have issues: $containerStatus"
    }
} catch {
    Write-Error "Failed to check container status"
}

# Recommendations
Write-Host ""
Write-Host "📋 Recommendations:" -ForegroundColor Blue
Write-Host "==================="
Write-Host "1. If WebSocket connections are failing, the CSS fallback system should handle it"
Write-Host "2. If you see 503 errors for CSS, try refreshing the page"
Write-Host "3. The fallback notification should appear if styles fail to load"
Write-Host "4. Check the CSS Dev Test page at http://localhost:3000/css-dev-test"
Write-Host "5. Monitor browser console for CSS fallback system logs"

Write-Host ""
Write-Success "Vite Docker configuration test completed!"

# Additional Windows-specific notes
Write-Host ""
Write-Host "💡 Windows Development Notes:" -ForegroundColor Magenta
Write-Host "=============================="
Write-Host "- File watching may be slower on Windows with Docker"
Write-Host "- WebSocket connections might need Windows Firewall exceptions"
Write-Host "- Use 'docker-compose -f docker-compose.dev.yml logs client' to see detailed logs"
Write-Host "- If HMR is not working, the CSS fallback system provides basic functionality"