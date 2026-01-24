
# Open Ports 3000 and 3001 for Local Network Access
Write-Host "🔓 Opening Ports 3000 & 3001..." -ForegroundColor Cyan

$ports = @(3000, 3001)

foreach ($port in $ports) {
    # Remove existing rules to avoid conflicts
    Remove-NetFirewallRule -DisplayName "eRankUp Port $port" -ErrorAction SilentlyContinue

    # Add new rule allowing ALL inbound traffic on this port
    New-NetFirewallRule -DisplayName "eRankUp Port $port" `
                        -Direction Inbound `
                        -LocalPort $port `
                        -Protocol TCP `
                        -Action Allow `
                        -Profile Any

    Write-Host "✅ Port $port Opened (All Profiles)" -ForegroundColor Green
}

Write-Host "`n⚠️  IMPORTANT: If you have 3rd party antivirus (McAfee, Norton, etc.), you might need to allow Node.js there manually." -ForegroundColor Yellow
Write-Host "Done."
