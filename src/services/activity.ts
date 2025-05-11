import type { Activity, ActivityData } from "~/lib/pb";
import {
  Collections,
  executeAuthenticatedOperation,
  getPocketBaseClientInstance,
} from "~/lib/pb";

export class ActivityService {
  private pb = getPocketBaseClientInstance();

  /**
   * 创建新活动
   */
  async createActivity(data: ActivityData) {
    return executeAuthenticatedOperation(async () => {
      try {
        const record = await this.pb
          .collection(Collections.ACTIVITIES)
          .create<Activity>(data);
        return record;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`创建活动失败: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * 更新活动
   */
  async updateActivity(id: string, data: Partial<ActivityData>) {
    return executeAuthenticatedOperation(async () => {
      try {
        const record = await this.pb
          .collection(Collections.ACTIVITIES)
          .update<Activity>(id, data);
        return record;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`更新活动失败: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * 删除活动
   */
  async deleteActivity(id: string) {
    return executeAuthenticatedOperation(async () => {
      try {
        await this.pb.collection(Collections.ACTIVITIES).delete(id);
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`删除活动失败: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * 获取活动详情
   */
  async getActivity(id: string) {
    return executeAuthenticatedOperation(async () => {
      try {
        const record = await this.pb
          .collection(Collections.ACTIVITIES)
          .getOne<Activity>(id, {
            expand: "registrations_count",
          });
        return record;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`获取活动失败: ${error.message}`);
        }
        throw error;
      }
    });
  }

  /**
   * 获取活动列表 (用于前台展示)
   */
  async getActivityList() {
    try {
      const records = await this.pb
        .collection(Collections.ACTIVITIES)
        .getList<Activity>(1, 50, {
          sort: "-created",
          expand: "registrations_count",
          filter: "isPublished = true",
        });
      return records.items;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`获取活动列表失败: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * 获取完整活动列表 (用于管理后台)
   */
  async getAdminActivityList() {
    return executeAuthenticatedOperation(async () => {
      try {
        const records = await this.pb
          .collection(Collections.ACTIVITIES)
          .getList<Activity>(1, 100, {
            sort: "-created",
            expand: "registrations_count,registrations",
            fields: "*,registrations_count,registrations.*",
          });
        return records.items;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`获取管理列表失败: ${error.message}`);
        }
        throw error;
      }
    });
  }
}

// 导出单例实例
export const activityService = new ActivityService();
