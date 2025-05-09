# 报名抽签系统

一个基于Next.js和PocketBase的活动报名抽签系统。管理员可以创建活动并设定中签人数，用户无需注册即可报名参加活动，系统在截止时间后自动随机抽取指定数量的中签用户。

## 功能特点

1. 管理员功能
   - 创建和管理活动
   - 设置活动标题、内容、截止时间和中签人数
   - GitHub账号登录验证

2. 用户功能
   - 浏览活动列表
   - 报名参加活动（无需注册）
   - 上传照片
   - 查看抽签结果

3. 系统功能
   - 自动抽签
   - 结果展示
   - 文件存储

## 技术栈

- **前端**:
  - Next.js 14 (React Framework)
  - TypeScript (类型安全)
  - Tailwind CSS (样式)
  - Zustand (状态管理)
  - React Hook Form (表单处理)
  - Zod (数据验证)

- **后端**:
  - PocketBase (后端服务)
    - 数据存储
    - 文件上传
    - 认证授权
    - API访问

## 快速开始

### 环境要求

- Node.js 18+
- PowerShell 7+
- Git

### 安装步骤

1. 克隆项目
```bash
git clone <repository-url>
cd 报名抽签
```

2. 启动开发环境
```bash
pwsh ./start-dev.ps1
```

这个脚本会：
- 创建必要的环境变量文件
- 安装项目依赖
- 下载并启动PocketBase服务
- 启动Next.js开发服务器

3. 配置GitHub OAuth

访问 https://github.com/settings/developers：
- 创建新的OAuth应用
- 设置Homepage URL为 `http://localhost:3000`
- 设置Authorization callback URL为 `http://localhost:3000/api/auth/callback/github`
- 复制Client ID和Client Secret到.env文件中的相应位置

4. 配置PocketBase

访问 `http://127.0.0.1:8090/_/`：
- 创建管理员账号
- 创建两个集合：activities和registrations
- 设置适当的访问权限

### 目录结构

```
src/
  ├── app/          # App Router
  │   ├── admin/    # 管理员路由
  │   ├── api/      # API 路由
  │   └── page.tsx  # 首页
  ├── components/   # UI组件
  │   ├── ui/       # 基础UI组件
  │   └── forms/    # 表单组件
  ├── lib/          # 工具函数
  └── types/        # 类型定义
```

## 使用说明

1. 管理员
   - 访问 `/admin` 登录（使用GitHub账号）
   - 创建新活动
   - 查看报名情况
   - 管理活动信息

2. 用户
   - 访问首页浏览活动列表
   - 点击活动进入详情页
   - 填写姓名并上传照片报名
   - 在截止时间后查看抽签结果

## 开发

### 可用的命令

```bash
# 启动开发环境（包含前后端）
pwsh ./start-dev.ps1

# 仅启动PocketBase服务
pwsh ./start-server.ps1

# 仅启动前端开发服务器
npm run dev

# 构建项目
npm run build

# 运行生产环境
npm start
```

### 环境变量

项目使用以下环境变量：

```env
# PocketBase URL
NEXT_PUBLIC_POCKETBASE_URL="http://127.0.0.1:8090"

# Next Auth
AUTH_SECRET="your-secret-key"

# GitHub OAuth
AUTH_GITHUB_ID="your-github-client-id"
AUTH_GITHUB_SECRET="your-github-client-secret"
```

## 部署

1. 构建前端
```bash
npm run build
```

2. 部署PocketBase
- 下载对应系统的PocketBase版本
- 配置服务器环境
- 设置域名和SSL

3. 部署Next.js应用
- 推荐使用Vercel
- 设置环境变量
- 配置域名
