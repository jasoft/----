import type { Activity } from "~/lib/pb";
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
  async createActivity(data: Omit<Activity, "id" | "created" | "updated">) {
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
  async updateActivity(
    id: string,
    data: Partial<Omit<Activity, "id" | "created" | "updated">>,
  ) {
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
    try {
      const record = await this.pb
        .collection(Collections.ACTIVITIES)
        .getOne<Activity>(id);
      return record;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`获取活动失败: ${error.message}`);
      }
      throw error;
    }
  }
}

// 导出单例实例
export const activityService = new ActivityService();
