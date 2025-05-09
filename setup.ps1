# 停止现有的PocketBase进程
Get-Process | Where-Object { $_.ProcessName -eq "pocketbase" } | Stop-Process -Force
Start-Sleep -Seconds 2

Write-Host "Starting PocketBase server..."
$pbProcess = Start-Process -FilePath ".\pb\pocketbase.exe" -ArgumentList "serve" -PassThru

# 等待服务启动并检查健康状态
$retries = 0
$maxRetries = 10
$isHealthy = $false

while (-not $isHealthy -and $retries -lt $maxRetries) {
    try {
        Write-Host "Checking if PocketBase is running (attempt $($retries + 1))..."
        $health = Invoke-RestMethod -Uri "http://127.0.0.1:8090/api/health" -Method Get
        if ($health.code -eq 200) {
            $isHealthy = $true
            Write-Host "PocketBase is running!"
        }
    }
    catch {
        $retries++
        Start-Sleep -Seconds 2
    }
}

if (-not $isHealthy) {
    Write-Host "Failed to start PocketBase after $maxRetries attempts"
    exit 1
}

# 创建Admin账号
$adminData = @{
    email           = "admin@example.com"
    password        = "adminadmin123"
    passwordConfirm = "adminadmin123"
} | ConvertTo-Json

Write-Host "`nCreating admin account..."
try {
    Invoke-RestMethod -Uri "http://127.0.0.1:8090/api/admins" -Method Post -Body $adminData -ContentType "application/json"
    Write-Host "Admin account created successfully"
}
catch {
    Write-Host "Admin may already exist, continuing..."
}

# 登录Admin账号
$loginData = @{
    identity = "admin@example.com"
    password = "adminadmin123"
} | ConvertTo-Json

Write-Host "`nLogging in as admin..."
try {
    $auth = Invoke-RestMethod -Uri "http://127.0.0.1:8090/api/admins/auth-with-password" -Method Post -Body $loginData -ContentType "application/json"
    Write-Host "Login successful. Token: $($auth.token)"

    $headers = @{
        "Authorization" = "Bearer $($auth.token)"
        "Content-Type"  = "application/json"
    }

    Write-Host "Headers:" $($headers | ConvertTo-Json)

    # 创建activities集合
    Write-Host "`nCreating activities collection..."
    $collection = @{
        name       = "activities"
        type       = "base"
        schema     = @(
            @{
                name     = "title"
                type     = "text"
                required = $true
            }
            @{
                name     = "content"
                type     = "text"
                required = $true
            }
            @{
                name     = "deadline"
                type     = "date"
                required = $true
            }
            @{
                name     = "winnersCount"
                type     = "number"
                required = $true
                min      = 1
            }
        )
        listRule   = $null
        viewRule   = $null
        createRule = $null
        updateRule = $null
        deleteRule = $null
    } | ConvertTo-Json -Depth 10

    try {
        Write-Host "Sending request to create collection..."
        Write-Host "URL: http://127.0.0.1:8090/api/collections"
        Write-Host "Headers: $($headers | ConvertTo-Json)"
        Write-Host "Body: $collection"

        # 先尝试删除已存在的集合
        try {
            Write-Host "Attempting to delete existing collection..."
            Invoke-RestMethod `
                -Uri "http://127.0.0.1:8090/api/collections/activities" `
                -Method Delete `
                -Headers $headers
            Write-Host "Existing collection deleted"
        }
        catch {
            Write-Host "No existing collection to delete"
        }

        # 创建新集合
        $response = Invoke-RestMethod `
            -Uri "http://127.0.0.1:8090/api/collections" `
            -Method Post `
            -Headers $headers `
            -Body $collection

        Write-Host "Collection created successfully"
        Write-Host "Response: $($response | ConvertTo-Json)"

        # 更新权限规则
        $rules = @{
            listRule   = ""
            viewRule   = ""
            createRule = '@request.auth.collectionName = "_admins"'
            updateRule = '@request.auth.collectionName = "_admins"'
            deleteRule = '@request.auth.collectionName = "_admins"'
        } | ConvertTo-Json

        Write-Host "Updating collection rules..."
        $response = Invoke-RestMethod `
            -Uri "http://127.0.0.1:8090/api/collections/activities" `
            -Method Patch `
            -Headers $headers `
            -Body $rules

        Write-Host "Collection rules updated successfully"
    }
    catch {
        Write-Host "Error managing collection: $($_)"
        Write-Host "Response: $($_.ErrorDetails)"
        Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
    }

    Write-Host "`nSetup completed!"
}
catch {
    Write-Host "Setup failed: $_"
    exit 1
}
