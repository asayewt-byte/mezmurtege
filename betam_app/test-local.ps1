# Quick local server for testing web admin
# Run this script to test the web admin locally

Write-Host "Starting local server for web admin..." -ForegroundColor Green
Write-Host ""

# Check if Python is available
$pythonAvailable = $false
try {
    $pythonVersion = python --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $pythonAvailable = $true
        Write-Host "Found Python: $pythonVersion" -ForegroundColor Cyan
    }
} catch {
    $pythonAvailable = $false
}

# Check if Node.js is available
$nodeAvailable = $false
try {
    $nodeVersion = node --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $nodeAvailable = $true
        Write-Host "Found Node.js: $nodeVersion" -ForegroundColor Cyan
    }
} catch {
    $nodeAvailable = $false
}

Write-Host ""

if ($pythonAvailable) {
    Write-Host "Starting Python HTTP server on port 8000..." -ForegroundColor Yellow
    Write-Host "Open: http://localhost:8000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    Set-Location "public"
    python -m http.server 8000
} elseif ($nodeAvailable) {
    Write-Host "Starting Node.js HTTP server on port 8000..." -ForegroundColor Yellow
    Write-Host "Open: http://localhost:8000" -ForegroundColor Green
    Write-Host "Press Ctrl+C to stop" -ForegroundColor Gray
    Write-Host ""
    Set-Location "public"
    npx http-server -p 8000
} else {
    Write-Host "Error: Python or Node.js is required to run a local server." -ForegroundColor Red
    Write-Host ""
    Write-Host "Options:" -ForegroundColor Yellow
    Write-Host "1. Install Python: https://www.python.org/downloads/" -ForegroundColor Cyan
    Write-Host "2. Install Node.js: https://nodejs.org/" -ForegroundColor Cyan
    Write-Host "3. Use VS Code Live Server extension" -ForegroundColor Cyan
    Write-Host "4. Deploy to Firebase Hosting (see DEPLOY.md)" -ForegroundColor Cyan
    Write-Host ""
    exit 1
}

