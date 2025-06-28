# 删除活动后页面刷新问题修复

## 问题描述

删除活动后，管理界面没有正确刷新，被删除的活动仍然显示在列表中。

## 根本原因

1. **缓存问题**：管理界面现在通过 API 路由获取数据，但删除操作只清除了 `ActivityService` 的缓存，没有考虑到 API 层面的缓存
2. **浏览器缓存**：fetch 请求可能被浏览器缓存，导致获取到旧数据
3. **缓存时间**：`getAdminActivityList` 方法有10秒缓存时间，即使清除缓存，短时间内可能还是返回缓存数据

## 修复方案

### 1. 添加强制刷新机制

**文件**: `src/services/activity.ts`

- 为 `getAdminActivityList` 方法添加 `forceRefresh` 参数
- 当 `forceRefresh=true` 时，跳过缓存直接从数据库获取最新数据

```typescript
async getAdminActivityList(userId?: string, forceRefresh = false) {
  // 如果不是强制刷新，尝试从缓存获取
  if (!forceRefresh) {
    const cached = this.cache.get<Activity[]>(cacheKey);
    if (cached) {
      return cached;
    }
  }
  // ... 从数据库获取数据
}
```

### 2. 修改 API 路由支持强制刷新

**文件**: `src/app/api/admin/activities/route.ts`

- 支持 `?refresh=true` 查询参数
- 添加缓存控制头，防止浏览器缓存

```typescript
export async function GET(request: Request) {
  const url = new URL(request.url);
  const forceRefresh = url.searchParams.get("refresh") === "true";
  
  const activities = await activityService.getAdminActivityList(user.id, forceRefresh);
  
  const response = NextResponse.json({ success: true, activities, userId: user.id });
  response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return response;
}
```

### 3. 修改管理界面支持强制刷新

**文件**: `src/app/admin/page.tsx`

- `loadActivities` 函数接受 `forceRefresh` 参数
- 根据参数决定是否添加 `?refresh=true` 查询参数
- 添加缓存控制头

```typescript
const loadActivities = useCallback(async (forceRefresh = false) => {
  const url = forceRefresh ? "/api/admin/activities?refresh=true" : "/api/admin/activities";
  const response = await fetch(url, {
    cache: "no-store",
    headers: { "Cache-Control": "no-cache" },
  });
  // ...
}, []);
```

### 4. 修改组件回调接口

**文件**: `src/components/manage-activity-list.tsx`

- 修改 `onDeleted` 回调接口，支持强制刷新参数
- 在删除、切换状态、抽签等操作成功后调用强制刷新

```typescript
interface ManageActivityListProps {
  activities: Activity[];
  onDeleted?: (forceRefresh?: boolean) => void;
}

// 删除成功后
await activityService.deleteActivity(activity.id);
onDeleted?.(true); // 强制刷新
```

## 修复效果

1. **立即刷新**：删除活动后立即从数据库获取最新数据
2. **避免缓存**：通过多层缓存控制确保获取最新数据
3. **一致性**：所有修改操作（删除、切换状态、抽签）都使用强制刷新
4. **性能平衡**：正常加载时仍使用缓存，只在必要时强制刷新

## 测试验证

1. **删除测试**：删除活动后，活动立即从列表中消失
2. **缓存测试**：验证强制刷新参数正确工作
3. **API 测试**：验证 API 路由正确处理刷新参数

## 涉及文件

- `src/services/activity.ts` - 添加强制刷新支持
- `src/app/api/admin/activities/route.ts` - API 路由缓存控制
- `src/app/admin/page.tsx` - 管理界面强制刷新
- `src/components/manage-activity-list.tsx` - 组件回调修改
- `src/app/admin/test-delete/page.tsx` - 测试页面（临时）

## 后续建议

1. 考虑实施更细粒度的缓存失效机制
2. 添加乐观更新，提升用户体验
3. 监控 API 调用频率，避免过度刷新
4. 考虑使用 WebSocket 实现实时更新
