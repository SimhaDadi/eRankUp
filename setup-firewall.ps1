
# Auto-Configure Firewall for eRankUp Dev Server
$ports = @(3000, 3001)
$ruleName = "Node.js eRankUp Dev Server"

Write-Host "Checking Firewall Rules..." -ForegroundColor Cyan

foreach ($port in $ports) {
    $exists = Get-NetFirewallRule -DisplayName "$ruleName ($port)" -ErrorAction SilentlyContinue
    if ($exists) {
        Write-Host "✅ Rule exists for Port $port" -ForegroundColor Green
    } else {
        Write-Host "⚠️ No rule for Port $port. Attempting to add..." -ForegroundColor Yellow
        try {
            New-NetFirewallRule -DisplayName "$ruleName ($port)" -Direction Inbound -LocalPort $port -Protocol TCP -Action Allow -Profile Private,Domain
            Write-Host "✅ Created Rule for Port $port" -ForegroundColor Green
        } catch {
            Write-Host "❌ Failed to create rule. Run this script as Administrator." -ForegroundColor Red
        }
    }
}

Write-Host "`nFirewall Check Complete."
