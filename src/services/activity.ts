import type { Activity, ActivityData } from "~/lib/pb";
import {
  Collections,
  executeAuthenticatedOperation,
  getPocketBaseClientInstance,
} from "~/lib/pb";

type UnsubscribeFunc = () => Promise<void>;

export class ActivityService {
  private pb = getPocketBaseClientInstance();
  private subscriptions = new Map<string, UnsubscribeFunc>();

  /**
   * 订阅活动列表变化
   * @param callback 数据变化时的回调函数
   */
  subscribe(callback: () => void): Promise<UnsubscribeFunc> {
    return new Promise((resolve) => {
      void this.pb
        .collection(Collections.ACTIVITIES)
        .subscribe("*", () => {
          try {
            callback();
          } catch (error) {
            console.error("订阅回调执行失败:", error);
          }
        })
        .then((unsubscribeFunc) => {
          const key = Math.random().toString(36).slice(2, 9);
          this.subscriptions.set(key, unsubscribeFunc);

          resolve(async () => {
            try {
              await unsubscribeFunc();
              this.subscriptions.delete(key);
            } catch (error) {
              console.error("取消订阅失败:", error);
            }
          });
        })
        .catch((error) => {
          console.error("设置订阅失败:", error);
          resolve(async () => {
            console.debug("空订阅的取消操作");
            return Promise.resolve();
          });
        });
    });
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll(): void {
    this.subscriptions.forEach((unsubscribe) => {
      try {
        void unsubscribe();
      } catch (error) {
        console.error("取消订阅失败:", error);
      }
    });
    this.subscriptions.clear();
  }

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
        // 1. 获取活动及其所有报名记录
        const activity = await this.pb
          .collection(Collections.ACTIVITIES)
          .getOne<Activity>(id, {
            expand: "registrations",
          });

        const registrations = activity.expand?.registrations ?? [];

        // 2. 删除所有关联的报名记录
        if (registrations.length > 0) {
          await Promise.all(
            registrations.map((registration) =>
              this.pb
                .collection(Collections.REGISTRATIONS)
                .delete(registration.id),
            ),
          );
        }

        // 3. 删除活动本身
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
        .getOne<Activity>(id, {
          expand: "registrations",
          requestKey: null,
        });
      return record;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`获取活动失败: ${error.message}`);
      }
      throw error;
    }
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
          expand: "registrations",
          filter: "isPublished=true",
          $autoCancel: false,
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
  async getAdminActivityList(userId?: string) {
    return executeAuthenticatedOperation(async () => {
      try {
        const filter = userId ? `creatorId="${userId}"` : "";
        const records = await this.pb
          .collection(Collections.ACTIVITIES)
          .getList<Activity>(1, 100, {
            sort: "-created",
            expand: "registrations",
            filter,
            requestKey: null,
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

  /**
   * 创建报名记录
   */
  async createRegistration(data: FormData) {
    const activityId = data.get("activity") as string;

    return executeAuthenticatedOperation(async () => {
      try {
        console.log(data);
        if (!activityId) {
          throw new Error("活动 ID 不能为空，无法创建报名。");
        }

        // 创建报名记录
        const registrationData = {
          activity: activityId,
          name: data.get("name"),
          phone: data.get("phone"),
        };

        let newRegistration;
        try {
          newRegistration = await this.pb
            .collection(Collections.REGISTRATIONS)
            .create(registrationData);
        } catch (createError) {
          let message = "创建报名实体时出错";
          if (createError instanceof Error) {
            message += `: ${createError.message}`;
          }
          if (
            createError &&
            typeof createError === "object" &&
            "status" in createError &&
            createError.status === 404
          ) {
            message = `关联的活动 (ID: ${activityId}) 未找到。`;
          }
          console.error(
            "Registration entity creation error details:",
            createError,
          );
          throw new Error(
            `创建报名记录失败 (步骤1/2 - 创建报名条目): ${message}`,
          );
        }

        // 更新活动的 registrations 字段
        try {
          await this.pb
            .collection(Collections.ACTIVITIES)
            .update(activityId, { "+registrations": newRegistration.id });
        } catch (updateError) {
          let message = `更新活动 (ID: ${activityId}) 的报名列表时出错`;
          if (updateError instanceof Error) {
            message += `: ${updateError.message}`;
          }
          if (
            updateError &&
            typeof updateError === "object" &&
            "status" in updateError &&
            updateError.status === 404
          ) {
            message = `关联的活动 (ID: ${activityId}) 未找到，无法更新其报名列表。`;
          }
          console.error("Activity update error details:", updateError);
          throw new Error(
            `创建报名记录失败 (步骤2/2 - 更新活动列表): ${message}`,
          );
        }

        return newRegistration;
      } catch (error) {
        if (
          error instanceof Error &&
          (error.message.includes("创建报名记录失败") ||
            error.message.includes("活动 ID 不能为空"))
        ) {
          console.error("Registration processing error:", error.message);
          throw error;
        }
        console.error("Generic error in createRegistration:", error);
        if (error instanceof Error) {
          throw new Error(`创建报名记录时发生意外错误: ${error.message}`);
        }
        throw new Error("创建报名记录时发生未知类型的错误。");
      }
    });
  }

  /**
   * 执行抽签
   * 在指定活动中随机选取报名者作为中签者
   */
  async drawWinners(activityId: string) {
    return executeAuthenticatedOperation(async () => {
      try {
        // 1. 获取活动及其报名信息
        const activity = await this.pb
          .collection(Collections.ACTIVITIES)
          .getOne<Activity>(activityId, {
            expand: "registrations",
          });

        const registrations = activity.expand?.registrations ?? [];
        const winnersCount = Math.min(
          activity.winnersCount,
          registrations.length,
        );

        // 新增步骤：重置所有报名者的中签状态
        if (registrations.length > 0) {
          await Promise.all(
            registrations.map((registration) =>
              this.pb
                .collection(Collections.REGISTRATIONS)
                .update(registration.id, {
                  isWinner: false,
                }),
            ),
          );
        }

        // 2. 随机选取中签者
        const shuffled = [...registrations].sort(() => Math.random() - 0.5);
        const winners = shuffled.slice(0, winnersCount);

        // 3. 更新中签者状态
        await Promise.all(
          winners.map((winner) =>
            this.pb.collection(Collections.REGISTRATIONS).update(winner.id, {
              isWinner: true,
            }),
          ),
        );

        return winners;
      } catch (error) {
        if (error instanceof Error) {
          throw new Error(`执行抽签失败: ${error.message}`);
        }
        throw error;
      }
    });
  }
}

// 导出单例实例
export const activityService = new ActivityService();
