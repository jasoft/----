# test_create_activity.ps1

Write-Host "Starting PocketBase activity creation test..."

# 登录Admin账号
$loginData = @{
    identity = "admin@example.com"
    password = "adminadmin123"
} | ConvertTo-Json

$adminAuth = $null
Write-Host "Logging in as admin..."
try {
    $adminAuth = Invoke-RestMethod -Uri "http://127.0.0.1:8090/api/admins/auth-with-password" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "Admin login successful. Token: $($adminAuth.token)"
}
catch {
    Write-Host "Admin login failed: $_"
    exit 1
}

# 准备创建活动的数据
$activityData = @{
    title        = "Test Activity from Script"
    content      = "This is a test activity created by an admin via script."
    deadline     = (Get-Date).AddDays(7).ToString("yyyy-MM-dd HH:mm:ss.fffZ") # 设置截止日期为7天后
    winnersCount = 3
} | ConvertTo-Json

$headers = @{
    "Authorization" = "Bearer $($adminAuth.token)"
    "Content-Type"  = "application/json"
}

Write-Host "`nAttempting to create a new activity..."
Write-Host "URL: http://127.0.0.1:8090/api/collections/activities/records"
Write-Host "Headers: $($headers | ConvertTo-Json)"
Write-Host "Body: $activityData"

try {
    $response = Invoke-RestMethod `
        -Uri "http://127.0.0.1:8090/api/collections/activities/records" `
        -Method Post `
        -Headers $headers `
        -Body $activityData

    Write-Host "Activity created successfully!"
    Write-Host "Response: $($response | ConvertTo-Json -Depth 5)"
    Write-Host "`nTest PASSED: Admin can create activities."
}
catch {
    Write-Host "Error creating activity: $($_)"
    Write-Host "Response: $($_.ErrorDetails)"
    if ($_.Exception.Response) {
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
        Write-Host "Response Body: $($_.Exception.Response.GetResponseStream() | StreamReader | Select-Object -ExpandProperty ReadToEnd)"
    }
    Write-Host "`nTest FAILED: Admin could not create activity."
    exit 1
}

Write-Host "`nActivity creation test completed."