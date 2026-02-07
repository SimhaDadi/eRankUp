# update-ip.ps1
# This script detects the current local IPv4 address and updates .env and Flutter config files.

$ErrorActionPreference = "Stop"

function Get-LocalIP {
    # Get all IPv4 addresses for active non-loopback adapters
    $ips = Get-NetIPAddress -AddressFamily IPv4 | Where-Object { 
        $_.InterfaceAlias -match "Wi-Fi|Ethernet" -and $_.IPAddress -notmatch "^127\." 
    }
    
    if ($ips.Count -eq 0) {
        Write-Error "No active Wi-Fi or Ethernet IP found!"
    }
    
    # Prioritize Wi-Fi, then take the first one
    $primaryIp = ($ips | Where-Object { $_.InterfaceAlias -match "Wi-Fi" } | Select-Object -First 1).IPAddress
    if (-not $primaryIp) {
        $primaryIp = $ips[0].IPAddress
    }
    
    return $primaryIp
}

$newIp = Get-LocalIP
Write-Host "Detected Local IP: $newIp" -ForegroundColor Cyan

# 1. Update backend/.env
$envPath = "backend/.env"
if (Test-Path $envPath) {
    Write-Host "Updating $envPath..."
    $content = Get-Content $envPath
    
    # Replace FRONTEND_URL IP
    $content = $content -replace "FRONTEND_URL=http://[0-9.]+:", "FRONTEND_URL=http://$newIp`:"
    
    # Replace ALLOWED_ORIGINS IPs (handles multiple occurrences)
    $content = $content -replace "http://[0-9.]+:", "http://$newIp`:"
    
    Set-Content $envPath $content
}

# 2. Update mobile/lib/config/config.dart
$configPath = "mobile/lib/config/config.dart"
if (Test-Path $configPath) {
    Write-Host "Updating $configPath..."
    $content = Get-Content $configPath
    
    # Replace 'dev' IP
    $content = $content -replace "'dev': 'http://[0-9.]+:", "'dev': 'http://$newIp`:"
    
    Set-Content $configPath $content
}

Write-Host "Successfully updated network configuration to http://$newIp" -ForegroundColor Green
Write-Host "NOTE: If you are using Android Emulator, you may still need 10.0.2.2 or 'adb reverse'."
