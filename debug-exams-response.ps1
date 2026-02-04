
$baseUrl = "http://localhost:3001"
$email = "admin@erankup.com"
$password = "adminpassword"

# Login
try {
    $loginBody = @{ email = $email; password = $password }
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body ($loginBody | ConvertTo-Json) -ContentType "application/json"
    $token = $loginRes.access_token
} catch {
    Write-Host "Login Failed" -ForegroundColor Red
    exit
}

# Get Exams
try {
    $response = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Get -Headers @{ Authorization = "Bearer $token" }
    Write-Host "Response Type: $($response.GetType().Name)" -ForegroundColor Cyan
    Write-Host "Response Keys: $($response.PSObject.Properties.Name -join ', ')" -ForegroundColor Yellow
    
    if ($response.data) {
        Write-Host "Has 'data' property? YES" -ForegroundColor Green
        Write-Host "Data Type: $($response.data.GetType().Name)" -ForegroundColor Green
    } else {
         Write-Host "Has 'data' property? NO" -ForegroundColor Red
    }
} catch {
    Write-Host "Fetch Failed: $($_.Exception.Message)" -ForegroundColor Red
}
