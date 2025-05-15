"use server";

import { getPocketBaseClientInstance } from "~/lib/pb";
import { Collections, type Activity } from "~/lib/pb";
import { isExpired } from "~/lib/utils";

/**
 * 检查手机号是否已在该活动中使用
 */
export async function checkPhoneExists(
  activityId: string,
  phone: string,
): Promise<boolean> {
  try {
    const pb = getPocketBaseClientInstance();
    const records = await pb
      .collection(Collections.REGISTRATIONS)
      .getList(1, 1, {
        filter: `activity="${activityId}" && phone="${phone}"`,
      });

    return records.totalItems > 0;
  } catch (error) {
    console.error("Failed to check phone existence:", error);
    // 如果无法检查，为了安全返回true
    return true;
  }
}

interface RegistrationResponse {
  success: true;
}

/**
 * 提交报名表单
 */
export async function submitRegistration(
  activityId: string,
  formData: FormData,
): Promise<RegistrationResponse> {
  const pb = getPocketBaseClientInstance();

  // 获取并验证表单数据
  const name = formData.get("name");
  const phone = formData.get("phone");

  if (
    !name ||
    !phone ||
    typeof name !== "string" ||
    typeof phone !== "string"
  ) {
    throw new Error("请填写完整的报名信息");
  }

  // 检查手机号是否已被使用
  const exists = await checkPhoneExists(activityId, phone);
  if (exists) {
    throw new Error("该手机号已报名，请勿重复报名");
  }

  // 检查活动是否存在且未截止
  const activity = await pb
    .collection(Collections.ACTIVITIES)
    .getOne<Activity>(activityId);
  if (!activity) {
    throw new Error("活动不存在");
  }

  // 处理deadline，确保是字符串格式
  const deadline =
    typeof activity.deadline === "string"
      ? activity.deadline
      : new Date(activity.deadline).toISOString();

  if (isExpired(deadline)) {
    throw new Error("活动已截止报名");
  }

  // 检查活动是否已发布
  if (!activity.isPublished) {
    throw new Error("活动未发布，无法报名");
  }

  // 检查报名人数是否已满
  const registrationsCount = await pb
    .collection(Collections.REGISTRATIONS)
    .getList(1, 1, {
      filter: `activity="${activityId}"`,
    });

  if (registrationsCount.totalItems >= activity.maxRegistrants) {
    throw new Error("报名人数已满");
  }

  // 创建报名记录
  try {
    const reg = await pb.collection(Collections.REGISTRATIONS).create({
      activity: activityId,
      name,
      phone,
    });

    await pb.collection(Collections.ACTIVITIES).update(activityId, {
      "+registrations": reg.id,
    });
  } catch (error) {
    console.error("Failed to create registration:", error);
    throw new Error("提交报名失败，请稍后重试");
  }

  // 如果成功，不需要返回任何内容
  return {
    success: true,
  };
}

/**
 * 删除活动的所有报名记录
 */
export async function deleteAllRegistrations(
  activityId: string,
): Promise<void> {
  const pb = getPocketBaseClientInstance();

  try {
    // 获取所有报名记录
    const registrations = await pb
      .collection(Collections.REGISTRATIONS)
      .getFullList({
        filter: `activity="${activityId}"`,
      });

    // 删除所有报名记录
    for (const reg of registrations) {
      await pb.collection(Collections.REGISTRATIONS).delete(reg.id);
    }

    // 清空活动的registrations字段
    await pb.collection(Collections.ACTIVITIES).update(activityId, {
      registrations: [],
    });
  } catch (error) {
    console.error("Failed to delete registrations:", error);
    throw new Error("删除报名记录失败，请稍后重试");
  }
}
