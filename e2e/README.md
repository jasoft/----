# 端到端测试说明

本项目使用 Playwright 进行端到端测试，包括活动管理、用户注册等功能的测试。

## 测试环境设置

1. 创建 `.env.test` 文件，添加以下配置：
   ```env
   NEXT_PUBLIC_POCKETBASE_URL=http://127.0.0.1:8090
   TEST_ADMIN_USERNAME=admin    # 测试管理员用户名
   TEST_ADMIN_PASSWORD=123456   # 测试管理员密码
   ```

2. 安装依赖：
   ```bash
   npm install
   ```

3. 安装 Playwright 浏览器：
   ```bash
   npx playwright install
   ```

## 运行测试

1. 启动 PocketBase 服务器：
   ```bash
   npm run pb:start
   ```

2. 在新的终端中运行测试：
   ```bash
   # 运行所有测试
   npm test

   # 或者单独运行测试步骤
   npm run test:setup     # 创建测试管理员账号
   npm run test:e2e      # 运行端到端测试
   ```

## 测试说明

- `test:setup` 会创建一个具有管理员权限的测试账号
- 所有管理员相关的测试都会使用这个测试账号
- 测试运行时会自动处理登录状态
- 每个测试用例结束后会自动清理测试数据

## 调试

1. 使用 UI 模式运行测试：
   ```bash
   npx playwright test --ui
   ```

2. 查看测试报告：
   ```bash
   npx playwright show-report
   ```

## 注意事项

- 请勿在生产环境使用测试配置
- 测试时会创建和删除数据，请确保使用测试环境
- 每次测试前会重新创建管理员账号（如果不存在）
