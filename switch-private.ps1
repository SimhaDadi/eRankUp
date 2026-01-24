
# Change Network Profile to Private
$wifi = Get-NetConnectionProfile -InterfaceAlias "Wi-Fi"

if ($wifi) {
    Write-Host "Current Profile: $($wifi.NetworkCategory)" -ForegroundColor Yellow
    if ($wifi.NetworkCategory -eq "Public") {
        Write-Host "Switching to Private..." -ForegroundColor Cyan
        Set-NetConnectionProfile -InterfaceAlias "Wi-Fi" -NetworkCategory Private
        Write-Host "✅ Network Profile Changed to Private." -ForegroundColor Green
    } else {
        Write-Host "✅ Already Private." -ForegroundColor Green
    }
} else {
    Write-Host "❌ Wi-Fi Interface not found." -ForegroundColor Red
}
