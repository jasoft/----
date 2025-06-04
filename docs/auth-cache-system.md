# 认证缓存系统

## 概述

为了解决 Clerk API 调用缓慢的问题，我们实现了一个基于 PocketBase 的认证缓存系统。该系统通过多层缓存策略显著提高了用户认证的性能。

## 架构设计

### 缓存层级

1. **内存缓存** (5分钟)
   - 最快的访问速度
   - 进程重启后失效
   - 适合频繁访问的场景

2. **PocketBase 数据库缓存** (30分钟)
   - 持久化存储
   - 跨进程共享
   - 本地网络访问，速度较快

3. **Clerk API** (回退方案)
   - 原始数据源
   - 网络延迟较高
   - 仅在缓存未命中时调用

### 工作流程

```
请求用户信息
    ↓
检查内存缓存 (5分钟有效期)
    ↓ (未命中)
检查 PocketBase 缓存 (30分钟有效期)
    ↓ (未命中)
调用 Clerk API
    ↓
更新所有缓存层
    ↓
返回用户信息
```

## 使用方法

### 基本用法

替换原有的 `currentUser()` 调用：

```typescript
// 原来的方式
import { currentUser } from "@clerk/nextjs/server";
const user = await currentUser();

// 新的缓存方式
import { getCachedCurrentUser } from "~/services/auth-cache";
const user = await getCachedCurrentUser();
```

### 缓存管理

```typescript
import { 
  clearUserCache, 
  refreshUserCache 
} from "~/services/auth-cache";

// 清除特定用户的缓存
await clearUserCache("user_123");

// 清除所有用户缓存
await clearUserCache();

// 强制刷新缓存
const user = await refreshUserCache();
```

## 性能测试

访问 `/admin/auth-performance` 页面可以进行性能对比测试：

- **Clerk Direct API**: 直接调用 Clerk API
- **Cached Auth**: 使用缓存系统
- **性能提升**: 显示缓存系统的性能改进百分比

## 数据库结构

### user_cache 表

| 字段 | 类型 | 必需 | 描述 |
|------|------|------|------|
| clerkId | text | 是 | Clerk 用户 ID (唯一) |
| email | email | 是 | 用户邮箱 |
| firstName | text | 否 | 名字 |
| lastName | text | 否 | 姓氏 |
| imageUrl | url | 否 | 头像 URL |
| lastUpdated | date | 是 | 最后更新时间 |

### 索引

- `idx_user_cache_clerk_id`: clerkId 唯一索引
- `idx_user_cache_last_updated`: lastUpdated 索引

## 设置步骤

### 1. 创建数据库表

运行设置脚本：

```bash
npm run setup:user-cache
```

或者手动在 PocketBase 管理界面创建 `user_cache` 集合。

### 2. 更新代码

将现有的 `currentUser()` 调用替换为 `getCachedCurrentUser()`：

```typescript
// src/app/admin/new/page.tsx
import { getCachedCurrentUser } from "~/services/auth-cache";

export default async function CreateActivityPage(props: PageProps) {
  const user = await getCachedCurrentUser();
  // ...
}
```

### 3. 测试性能

1. 访问 `/admin/auth-performance`
2. 点击"开始性能测试"
3. 观察性能改进情况

## 配置选项

可以在 `src/services/auth-cache.ts` 中调整缓存时间：

```typescript
const MEMORY_CACHE_DURATION = 5 * 60 * 1000; // 5分钟内存缓存
const DB_CACHE_DURATION = 30 * 60 * 1000; // 30分钟数据库缓存
```

## 注意事项

### 数据一致性

- 缓存的用户信息可能不是最新的
- 如果用户信息在 Clerk 中更新，需要手动清除缓存
- 建议在用户信息更新后调用 `clearUserCache(userId)`

### 错误处理

- 如果缓存系统失败，会自动回退到 Clerk API
- 所有缓存操作都有错误处理，不会影响主要功能

### 安全考虑

- 缓存的用户信息存储在本地 PocketBase 中
- 确保 PocketBase 的访问权限配置正确
- 敏感信息（如 tokens）不会被缓存

## 监控和调试

### 日志输出

系统会输出详细的性能日志：

```
从内存缓存获取用户信息
从数据库缓存获取用户信息  
从 Clerk API 获取用户信息
Clerk API 调用耗时: 1234.56ms
```

### 性能指标

在 `/admin/new` 页面的控制台中可以看到：

```json
{
  "event": "getCachedCurrentUser_performance",
  "requestId": "abc123",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "duration": 12.34,
  "url": "/admin/new"
}
```

## 故障排除

### 常见问题

1. **缓存未生效**
   - 检查 PocketBase 连接
   - 确认 user_cache 表已创建
   - 查看控制台错误日志

2. **性能提升不明显**
   - 确认网络环境（本地 vs 远程）
   - 检查缓存命中率
   - 调整缓存时间配置

3. **用户信息不一致**
   - 手动清除缓存：`clearUserCache(userId)`
   - 检查缓存更新逻辑
   - 确认 Clerk 用户信息格式

### 调试步骤

1. 检查 PocketBase 连接状态
2. 查看 user_cache 表中的数据
3. 监控控制台日志输出
4. 使用性能测试页面对比结果

## 未来改进

- [ ] 添加缓存预热机制
- [ ] 实现缓存统计和监控
- [ ] 支持批量用户信息缓存
- [ ] 添加缓存失效通知机制
