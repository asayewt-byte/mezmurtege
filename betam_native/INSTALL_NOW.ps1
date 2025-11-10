# Quick Install Script for Ethiopian Radio Native App
# Run this script after connecting your device or starting an emulator

Write-Host "=== Ethiopian Radio - APK Installer ===" -ForegroundColor Green
Write-Host ""

# Check if device is connected
Write-Host "Checking for connected devices..." -ForegroundColor Yellow
$devices = adb devices | Select-String -Pattern "device$" | Measure-Object

if ($devices.Count -eq 0) {
    Write-Host "ERROR: No device or emulator found!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please:" -ForegroundColor Yellow
    Write-Host "1. Connect your Android device via USB and enable USB debugging"
    Write-Host "2. OR start an Android emulator from Android Studio"
    Write-Host "3. Then run this script again"
    Write-Host ""
    Write-Host "To check devices, run: adb devices" -ForegroundColor Cyan
    exit 1
}

Write-Host "Device found! Installing APK..." -ForegroundColor Green
Write-Host ""

# Uninstall previous version if exists
Write-Host "Uninstalling previous version (if exists)..." -ForegroundColor Yellow
adb uninstall com.example.ethiopianradio 2>&1 | Out-Null

# Install debug APK
$apkPath = "app\build\outputs\apk\debug\app-debug.apk"

if (-not (Test-Path $apkPath)) {
    Write-Host "ERROR: APK not found at $apkPath" -ForegroundColor Red
    Write-Host "Please build the app first: .\gradlew.bat assembleDebug" -ForegroundColor Yellow
    exit 1
}

Write-Host "Installing: $apkPath" -ForegroundColor Cyan
Write-Host "APK Size: $([math]::Round((Get-Item $apkPath).Length / 1MB, 2)) MB" -ForegroundColor Cyan
Write-Host ""

$result = adb install -r $apkPath

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "=== SUCCESS! ===" -ForegroundColor Green
    Write-Host "Ethiopian Radio app has been installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Next steps:" -ForegroundColor Yellow
    Write-Host "1. Open the app on your device"
    Write-Host "2. Configure Firebase (if not already done)"
    Write-Host "3. Add stations using the admin screen"
    Write-Host ""
} else {
    Write-Host ""
    Write-Host "=== INSTALLATION FAILED ===" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    Write-Host ""
    Write-Host "Troubleshooting:" -ForegroundColor Yellow
    Write-Host "1. Make sure USB debugging is enabled"
    Write-Host "2. Check if device has enough storage"
    Write-Host "3. Try: adb kill-server && adb start-server"
    Write-Host ""
}

