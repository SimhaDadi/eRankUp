# Since we can't easily see passwords via API, we will try to login with a wrong password for each user.
# If we get 401 Unauthorized (Invalid credentials), it means the account exists and handled the password check.
# If we get 500, it means it crashed (which we fixed).
# If we get 429, we are throttled.

$users = @(
    "sivadadi114@gmail.com",
    "sriharigorle.123@gmail.com"
)

$url = "http://localhost:3001/auth/login"

foreach ($email in $users) {
    Write-Host "Checking $email..."
    try {
        $body = @{ email = $email; password = "dummy_password_check" } | ConvertTo-Json
        Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
    } catch {
        $status = $_.Exception.Response.StatusCode.value__
        Write-Host "Status: $status"
        if ($status -eq 401) {
            Write-Host "  -> 401 means backend handled it correctly. User likely has no password or it didn't match." -ForegroundColor Green
        } elseif ($status -eq 429) {
             Write-Host "  -> 429 Throttle! Wait a minute." -ForegroundColor Yellow
        } else {
             Write-Host "  -> Unexpected status: $status" -ForegroundColor Red
        }
    }
    Start-Sleep -Seconds 1
}
