# 用户切换安全漏洞修复

## 问题描述

在管理界面中发现严重的安全漏洞：当用户切换登录账户时，管理界面仍然显示上一个用户的活动列表，而不是当前用户的活动。

## 根本原因

1. **客户端直接调用服务**：管理界面 (`/src/app/admin/page.tsx`) 是客户端组件，直接调用 `activityService.getAdminActivityList()` 而没有传递用户ID参数
2. **缺少用户验证**：`getAdminActivityList()` 在没有用户ID时返回所有用户的活动
3. **缓存问题**：ActivityService 的缓存机制没有区分不同用户，导致用户切换后显示缓存的错误数据

## 修复方案

### 1. 创建安全的 API 路由

**文件**: `src/app/api/admin/activities/route.ts`

- 使用服务端认证获取当前用户信息
- 只返回当前登录用户创建的活动
- 包含适当的错误处理和类型安全

```typescript
export async function GET() {
  const user = await getCachedCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "未授权访问" }, { status: 401 });
  }
  const activities = await activityService.getAdminActivityList(user.id);
  return NextResponse.json({ success: true, activities, userId: user.id });
}
```

### 2. 修改管理界面

**文件**: `src/app/admin/page.tsx`

- 改为调用安全的 API 路由而不是直接调用 service
- 添加用户切换事件监听
- 改进错误处理和类型安全

### 3. 增强 ActivityService

**文件**: `src/services/activity.ts`

- 添加用户切换检测机制
- 在用户切换时自动清除缓存和订阅
- 确保缓存按用户ID隔离

```typescript
private checkUserSwitch(userId: string): void {
  if (this.currentUserId && this.currentUserId !== userId) {
    console.log(`检测到用户切换: ${this.currentUserId} -> ${userId}`);
    this.clearCache();
    this.unsubscribeAll();
  }
  this.currentUserId = userId;
}
```

### 4. 改进认证缓存系统

**文件**: `src/services/auth-cache-simple.ts`

- 添加用户切换检测
- 发送自定义事件通知其他模块
- 在用户切换时清除所有缓存

```typescript
function checkUserSwitch(user: User): void {
  if (currentUserId && currentUserId !== user.id) {
    userCache.clear();
    window.dispatchEvent(new CustomEvent("userSwitched", {
      detail: { oldUserId: currentUserId, newUserId: user.id }
    }));
  }
  currentUserId = user.id;
}
```

## 安全改进

1. **服务端验证**：所有敏感数据访问都通过服务端 API 路由进行验证
2. **用户隔离**：确保每个用户只能访问自己创建的活动
3. **缓存隔离**：缓存按用户ID进行隔离，防止数据泄露
4. **实时切换检测**：自动检测用户切换并清除相关缓存

## 测试验证

1. **API 路由测试**：验证 `/api/admin/activities` 正确返回当前用户的活动
2. **用户切换测试**：验证用户切换时自动刷新活动列表
3. **缓存测试**：验证缓存正确按用户隔离

## 影响范围

- ✅ 修复了安全漏洞，确保用户只能看到自己的活动
- ✅ 改进了缓存机制，提高了数据一致性
- ✅ 增强了用户体验，用户切换时自动更新界面
- ✅ 保持了现有功能的完整性

## 后续建议

1. 对所有管理功能进行类似的安全审查
2. 考虑实施更严格的权限控制机制
3. 添加更多的安全测试用例
4. 定期进行安全漏洞扫描
