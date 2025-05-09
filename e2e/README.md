# E2E 测试说明

## 必需的 data-testid 属性

### 表单组件
- `registration-form`: 报名表单容器
- `registration-name`: 报名姓名输入框
- `registration-phone`: 报名手机号输入框
- `submit-registration`: 报名提交按钮
- `activity-form`: 活动表单容器
- `activity-title`: 活动标题输入框
- `activity-content`: 活动内容输入框
- `activity-deadline`: 活动截止时间输入框
- `activity-winners-count`: 活动中签人数输入框

### 抽签结果页面
- `draw-result-dialog`: 抽签结果对话框
- `draw-result-title`: 抽签结果标题
- `result-table`: 结果显示表格
- `winner-row`: 中签者行
- `total-count`: 总报名人数
- `winners-count`: 中签人数
- `win-rate`: 中签率
- `waiting-message`: 等待开奖提示
- `start-draw`: 开始抽签按钮
- `confirm-draw`: 确认抽签结果按钮

### 查询组件
- `query-name`: 查询姓名输入框
- `query-phone`: 查询手机号输入框
- `query-submit`: 查询提交按钮
- `query-result`: 查询结果显示区域
- `error-dialog`: 错误提示对话框
- `error-title`: 错误提示标题
- `error-message`: 错误提示消息

### 活动列表
- `activity-list`: 活动列表容器
- `delete-activity`: 删除活动按钮

## 测试文件说明

- `fixtures.ts`: 测试固定装置和辅助函数
- `activity-management.test.ts`: 活动管理相关测试
- `registration.test.ts`: 报名功能相关测试
- `lucky-draw.test.ts`: 抽签和结果查询相关测试
- `dialogs.test.ts`: 对话框交互相关测试

## 运行测试

```bash
# 运行所有测试
npx playwright test

# 运行特定测试文件
npx playwright test e2e/registration.test.ts

# 在调试模式下运行测试
npx playwright test --debug
```

## 注意事项

1. 运行测试前确保后端服务已启动
2. 每个测试用例应该是独立的，不依赖其他测试的状态
3. 测试数据会在测试完成后自动清理
4. 如遇到超时错误，可以适当调整超时时间
