
$baseUrl = "http://localhost:3001"
$email = "admin@erankup.com"
$password = "adminpassword"

# Login
try {
    $loginRes = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body (@{ email = $email; password = $password } | ConvertTo-Json) -ContentType "application/json"
    $token = $loginRes.access_token
} catch {
    Write-Host "Login Failed" -ForegroundColor Red
    exit
}

$headers = @{ Authorization = "Bearer $token" }

# Fetch Exams (which include Question Banks)
try {
    Write-Host "Fetching Exams..." -ForegroundColor Cyan
    $response = Invoke-RestMethod -Uri "$baseUrl/exams" -Method Get -Headers $headers
    
    # Handle { data: [], meta: {} } vs []
    $exams = if ($response.data) { $response.data } else { $response }

    if ($exams.Count -eq 0) {
        Write-Host "No exams found." -ForegroundColor Yellow
    } else {
        Write-Host "Found $($exams.Count) Exams/Banks:" -ForegroundColor Green
        $exams | Format-Table -Property id, title, type, isPublished, createdAt -AutoSize
    }

} catch {
    Write-Host "Error fetching exams: $($_.Exception.Message)" -ForegroundColor Red
}

