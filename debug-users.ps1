$loginUrl = "http://localhost:3001/auth/login"
$usersUrl = "http://localhost:3001/users"

try {
    $loginBody = @{
        email = "admin@erankup.com"
        password = "adminpassword"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri $loginUrl -Method Post -Body $loginBody -ContentType "application/json"
    $token = $loginResponse.access_token
    Write-Host "Login successful. Token acquired."

    $headers = @{
        Authorization = "Bearer $token"
    }

    $usersUrl = "http://localhost:3001/users" 
    $usersResponse = Invoke-RestMethod -Uri $usersUrl -Method Get -Headers $headers
    
    # We need to manually inspect the object because the API might not return password fields in the list view (security)
    # But for debugging context, we want to know if they 'exist' or not from the DB perspective if we could see them.
    # Since we can't see passwords in the API response, we will assume standard behavior:
    # If they are social users, they might be missing passwords.
    
    Write-Host "Users found:"
    $usersResponse | Format-Table -Property id, email, role, fullName

} catch {
    Write-Error $_
}
