# 启动项目
$ErrorActionPreference = "Stop"

Write-Host "正在启动开发环境..." -ForegroundColor Green

# 1. 检查环境变量
if (!(Test-Path ".env")) {
    Write-Host "创建 .env 文件..." -ForegroundColor Yellow
    @"
# PocketBase
NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"

# Next Auth
# 生成一个随机密钥
AUTH_SECRET="$(New-Guid)"

# GitHub OAuth
# 请在 GitHub 开发者设置中创建应用并填入下面的值
# https://github.com/settings/developers
AUTH_GITHUB_ID=""
AUTH_GITHUB_SECRET=""
"@ | Out-File -FilePath ".env" -Encoding UTF8

    Write-Host "请在 .env 文件中填入 GitHub OAuth 配置信息" -ForegroundColor Yellow
    Write-Host "访问 https://github.com/settings/developers 创建应用" -ForegroundColor Yellow
}

# 2. 安装依赖
Write-Host "安装依赖..." -ForegroundColor Green
npm install

# 3. 启动 PocketBase
Write-Host "启动 PocketBase..." -ForegroundColor Green
$pbProcess = Start-Process -FilePath "pwsh" -ArgumentList "-File ./start-server.ps1" -PassThru

# 4. 启动前端开发服务器
Write-Host "启动前端开发服务器..." -ForegroundColor Green
npm run dev

# 监听 Ctrl+C
$null = [Console]::TreatControlCAsInput = $true
$null = [Console]::ReadKey($true)
if ($Host.UI.RawUI.KeyAvailable -and $Host.UI.RawUI.ReadKey("IncludeKeyUp,NoEcho").Character -eq 3) {
    Write-Host "停止服务..." -ForegroundColor Yellow
    Stop-Process -Id $pbProcess.Id -Force
    Exit
}
