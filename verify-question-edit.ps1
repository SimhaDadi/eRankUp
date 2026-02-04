
# Script to verify Question Update (Patch)
# Needs an Admin Token. We'll use login first.

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

# 2. Get a random question to edit
try {
    $questions = Invoke-RestMethod -Uri "$baseUrl/questions" -Method Get -Headers $headers
    if ($questions.Count -eq 0) {
        Write-Host "No questions found to test." -ForegroundColor Yellow
        exit
    }
    $q = $questions[0]
    $qid = $q.id
    Write-Host "Testing update on Question ID: $qid" -ForegroundColor Cyan
} catch {
    Write-Host "Failed to fetch questions: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

# 3. Patch the question
try {
    $updateBody = @{
        questionText = "Updated Content via Script " + (Get-Date).ToString("HH:mm:ss")
        options = @("Option A", "Option B", "Option C", "Option D")
        difficultyWeight = 0.8
    } | ConvertTo-Json

    $patchRes = Invoke-RestMethod -Uri "$baseUrl/questions/$qid" -Method Patch -Body $updateBody -ContentType "application/json" -Headers $headers
    
    if ($patchRes.success -eq $true) {
        Write-Host "PATCH Success!" -ForegroundColor Green
        Write-Host "New Content: $($patchRes.data.content)" -ForegroundColor Gray
    } else {
        Write-Host "PATCH returned success=false" -ForegroundColor Red
    }

} catch {
    Write-Host "PATCH Failed: $($_.Exception.Message)" -ForegroundColor Red
    # Print detailed error if available
    try {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Error Body: $($reader.ReadToEnd())" -ForegroundColor Red
    } catch {}
}
