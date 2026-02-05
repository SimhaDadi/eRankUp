
$baseUrl = "http://localhost:3001"
$email = "admin@erankup.com" 
$password = "adminpassword" 

# 1. Login
try {
    $loginBody = @{ email = $email; password = $password } | ConvertTo-Json
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginRes.access_token
    Write-Host "Login Success. Token acquired." -ForegroundColor Green
} catch {
    Write-Host "Login Failed: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

$headers = @{ Authorization = "Bearer $token" }

# 2. Test Parse Questions
try {
    $textToParse = @"
    Q1. What is the value of pi?
    A) 3.14
    B) 2.14
    C) 4.14
    D) 5.14
    Answer: A
"@
    
    $body = @{ text = $textToParse } | ConvertTo-Json

    $response = Invoke-RestMethod -Uri "$baseUrl/ai/parse-questions" -Method Post -Body $body -ContentType "application/json" -Headers $headers
    
    Write-Host "AI Response Received." -ForegroundColor Cyan
    $response.questions | Format-Table

    if ($response.questions.Count -gt 0) {
        Write-Host "Verification PASSED: Questions parsed successfully." -ForegroundColor Green
    } else {
        Write-Host "Verification FAILED: No questions parsed." -ForegroundColor Red
    }

} catch {
    Write-Host "AI Request Failed: $($_.Exception.Message)" -ForegroundColor Red
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Error Body: $($reader.ReadToEnd())" -ForegroundColor Red
    } catch {}
}
