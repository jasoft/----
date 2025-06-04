export const dynamic = "force-dynamic";
/*现在我理解了问题所在。这涉及到 Next.js 的静态和动态渲染机制：

1. 在 `/user/page.tsx` 中，我们有一个 Server Component，其中包含了数据获取逻辑：
```typescript
const activities = await activityService.getActivityList();
```

2. 查看 `activityService.getActivityList()` 的实现，它是通过 PocketBase SDK 从后端获取数据：
```typescript
async getActivityList() {
  try {
    const records = await this.pb
      .collection(Collections.ACTIVITIES)
      .getList<Activity>(1, 50, {
        sort: "-created",
        expand: "registrations",
        filter: "isPublished=true",
        $autoCancel: false,
      });
    return records.items;
  } catch (error) {
    ...
  }
}
```

3. 这个问题出现的原因是：
   - Next.js 默认会在构建时预渲染页面以优化性能
   - 但在构建时，PocketBase 服务可能无法访问或者返回的是构建时刻的数据
   - 这导致页面被当作静态内容处理，无法实时获取最新数据
*/
import type { Metadata } from "next";
import { ActivityList } from "~/components/activity-list";
import { activityService } from "~/services/activity";

export const metadata: Metadata = {
  title: "活动列表",
  description: "查看所有可报名的活动",
};

function EmptyState() {
  return (
    <div className="rounded-lg border border-neutral-200 p-8 text-center">
      <p className="text-lg text-neutral-600">暂无活动</p>
      <p className="mt-2 text-sm text-neutral-500">请稍后再来查看</p>
    </div>
  );
}

export default async function UserPage() {
  // 数据获取失败会自动被error.tsx处理
  try {
    const activities = await activityService.getActivityList();

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">活动列表</h1>
        {activities.length === 0 ? (
          <EmptyState />
        ) : (
          <ActivityList activities={activities} />
        )}
      </div>
    );
  } catch (_error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold">活动列表</h1>
        <p className="mb-4 text-lg text-red-600">数据加载失败</p>
        <EmptyState />
      </div>
    );
  }
}
