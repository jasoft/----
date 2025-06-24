#!/bin/bash

# 创建pb目录（如果不存在）
if [ ! -d "pb" ]; then
    mkdir -p pb
fi

# 如果PocketBase不存在，下载并解压
if [ ! -f "pb/pocketbase" ]; then
    echo "下载 PocketBase..."

    # 检测系统架构
    ARCH=$(uname -m)
    if [ "$ARCH" = "x86_64" ]; then
        ARCH="amd64"
    elif [ "$ARCH" = "aarch64" ] || [ "$ARCH" = "arm64" ]; then
        ARCH="arm64"
    else
        echo "不支持的系统架构: $ARCH"
        exit 1
    fi

    URL="https://github.com/pocketbase/pocketbase/releases/download/v0.28.1/pocketbase_0.28.1_linux_${ARCH}.zip"
    OUTPUT="pb/pocketbase.zip"

    # 下载
    if command -v wget >/dev/null 2>&1; then
        wget -O "$OUTPUT" "$URL"
    elif command -v curl >/dev/null 2>&1; then
        curl -L -o "$OUTPUT" "$URL"
    else
        echo "错误: 需要 wget 或 curl 来下载文件"
        exit 1
    fi

    # 检查下载是否成功
    if [ ! -f "$OUTPUT" ]; then
        echo "下载失败"
        exit 1
    fi

    # 解压
    if command -v unzip >/dev/null 2>&1; then
        unzip -o "$OUTPUT" -d pb/
    else
        echo "错误: 需要 unzip 来解压文件"
        exit 1
    fi

    # 设置执行权限
    chmod +x pb/pocketbase

    # 删除zip文件
    rm "$OUTPUT"

    echo "PocketBase 下载完成"
fi

# 检查PocketBase进程
if pgrep -f "pocketbase" > /dev/null; then
    echo "PocketBase 服务已在运行..."
    exit 0
fi

# 启动PocketBase
echo "启动 PocketBase 服务..."
cd pb || exit 1

# 启动PocketBase服务（后台运行）
nohup ./pocketbase serve \
  --http="0.0.0.0:8090" \
  --origins="https://randpick.fly.dev,https://randpick.soj.myds.me:1443,http://localhost:3000" \
  > pocketbase.log 2>&1 &
PB_PID=$!

# 等待服务启动
sleep 3

# 检查进程是否还在运行
if kill -0 $PB_PID 2>/dev/null; then
    echo "PocketBase 服务已启动... (PID: $PB_PID)"
    echo "日志文件: pb/pocketbase.log"
    echo "要停止服务，请运行: pkill -f pocketbase"
else
    echo "PocketBase 服务启动失败"
    if [ -f "pocketbase.log" ]; then
        echo "错误日志:"
        cat pocketbase.log
    fi
    exit 1
fi

cd ..
