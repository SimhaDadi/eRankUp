$url = "http://localhost:3001/auth/login"

function Test-Login {
    param($email, $password)
    Write-Host "Testing login for $email..."
    try {
        $body = @{ email = $email; password = $password } | ConvertTo-Json
        $response = Invoke-RestMethod -Uri $url -Method Post -Body $body -ContentType "application/json"
        Write-Host "Success! Token received." -ForegroundColor Green
    } catch {
        if ($_.Exception.Response) {
            $status = $_.Exception.Response.StatusCode.value__
            Write-Host "Failed with status: $status" -ForegroundColor Yellow
            
            $stream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($stream)
            $body = $reader.ReadToEnd()
            Write-Host "Body: $body" -ForegroundColor Gray

            if ($status -eq 500) {
                 Write-Host "CRITICAL: 500 Error persisting!" -ForegroundColor Red
            }
        } else {
            Write-Host "Network Error: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

Test-Login "admin@erankup.com" "adminpassword"
Test-Login "sivadadi114@gmail.com" "randompassword123"
Test-Login "sriharigorle.123@gmail.com" "randompassword123"
