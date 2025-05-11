# 创建pb目录（如果不存在）
if (!(Test-Path "pb")) {
    New-Item -ItemType Directory -Path "pb"
}

# 如果PocketBase不存在，下载并解压
if (!(Test-Path "pb\pocketbase.exe")) {
    Write-Host "下载 PocketBase..."
    $url = "https://github.com/pocketbase/pocketbase/releases/download/v0.27.2/pocketbase_0.27.2_windows_amd64.zip"
    $output = "pb\pocketbase.zip"

    # 下载
    Invoke-WebRequest -Uri $url -OutFile $output

    # 解压
    Expand-Archive -Path $output -DestinationPath "pb" -Force

    # 删除zip
    Remove-Item $output
}

# 检查PocketBase进程
$pbProcess = Get-Process "pocketbase" -ErrorAction SilentlyContinue
if ($pbProcess) {
    Write-Host "PocketBase 服务已在运行..."
    exit 0
}

# 启动PocketBase
try {
    Set-Location pb
    $process = Start-Process -FilePath "pocketbase.exe" -ArgumentList "serve" -PassThru

    # 等待服务启动
    Start-Sleep -Seconds 3

    Set-Location ..

    if (!$process.HasExited) {
        Write-Host "PocketBase 服务已启动..."
    }
    else {
        Write-Error "PocketBase 服务启动失败"
        exit 1
    }
}
catch {
    Write-Error "启动PocketBase时发生错误: $_"
    exit 1
}
