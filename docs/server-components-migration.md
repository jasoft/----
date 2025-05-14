# 服务端组件迁移方案

## 总体目标

将所有API路由改写为服务，并将所有页面组件改为服务端组件，移除所有"use client"指令。

## 改造计划

### 第一阶段：服务层改造

#### 1. 认证服务增强
- 扩展`auth.ts`服务，整合现有API路由功能
- 添加cookie处理逻辑
- 实现以下功能：
  * 登录验证
  * 登出处理
  * 认证状态校验
  * 管理员权限验证

#### 2. 删除API路由
- 删除以下路由：
  * `/api/auth/login`
  * `/api/auth/logout`
  * `/api/auth/verify`
  * `/api/admin/logout`

### 第二阶段：组件改造

#### 1. UI组件改造
涉及组件：
- UI基础组件
  * toast
  * dialog
  * alert
  * card
- 表单组件
  * activity-form
  * registration-form
- 导航组件
  * nav-links
  * active-link

改造要点：
- 将客户端事件处理改为Server Actions
- 优化组件渲染策略
- 保持交互体验流畅

#### 2. 页面组件改造
涉及组件：
- 管理员页面
  * login-form
  * activity-container
  * edit-form
- 活动页面
  * result-display

改造要点：
- 移除"use client"指令
- 添加服务端数据获取逻辑
- 实现服务端表单处理
- 优化页面加载性能

## 技术实现细节

### Server Actions 实现
1. 表单处理
```typescript
// 示例：活动创建
async function createActivity(formData: FormData) {
  'use server'

  const title = formData.get('title')
  const description = formData.get('description')
  // ...验证和处理逻辑
}
```

2. 认证处理
```typescript
// 示例：登录处理
async function handleLogin(formData: FormData) {
  'use server'

  const username = formData.get('username')
  const password = formData.get('password')
  // ...认证逻辑
}
```

### 数据获取优化
1. 页面级数据获取
```typescript
// 示例：活动列表页面
async function ActivityListPage() {
  const activities = await getActivities()
  return <ActivityList activities={activities} />
}
```

2. 组件级数据获取
```typescript
// 示例：活动卡片组件
async function ActivityCard({ id }: { id: string }) {
  const activity = await getActivity(id)
  return <Card>{/* 渲染活动信息 */}</Card>
}
```

## 注意事项

1. 性能优化
- 使用Suspense包装异步组件
- 实现页面级缓存策略
- 优化服务端数据获取

2. 错误处理
- 实现全局错误边界
- 添加服务端错误日志
- 优化错误提示体验

3. 类型安全
- 完善服务端函数类型定义
- 确保客户端和服务端数据一致性
- 增强表单数据验证

4. 安全性
- 确保认证逻辑安全性
- 实现CSRF保护
- 控制敏感数据暴露

## 后续优化

1. 性能监控
- 添加性能指标收集
- 监控服务端组件渲染时间
- 分析并优化关键渲染路径

2. 代码质量
- 添加更多单元测试
- 实现端到端测试
- 优化代码复用

3. 开发体验
- 完善错误提示
- 优化开发环境热重载
- 添加开发文档
