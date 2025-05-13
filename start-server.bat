@echo off
echo 启动 PocketBase 服务...

REM 如果不存在pb目录，创建它
if not exist "pb" mkdir pb

REM 如果不存在PocketBase可执行文件，下载它
if not exist "pb\pocketbase.exe" (
    echo 下载 PocketBase...
    curl -L https://github.com/pocketbase/pocketbase/releases/download/v0.28.0/pocketbase_0.28.0_windows_amd64.zip -o pb\pocketbase.zip
    cd pb
    tar -xf pocketbase.zip
    del pocketbase.zip
    cd ..
)

REM 启动PocketBase，监听所有网络接口
cd pb
start pocketbase serve --http="0.0.0.0:8090"
