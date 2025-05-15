"use server";

import {
  submitRegistration,
  deleteAllRegistrations,
} from "~/services/registration";

interface RegistrationSuccess {
  success: true;
  redirect: string;
}

interface RegistrationError {
  success: false;
  error: string;
}

type RegistrationResult = RegistrationSuccess | RegistrationError;

interface DeleteResult {
  success: boolean;
  error?: string;
}

export async function createRegistration(
  activityId: string,
  formData: FormData,
): Promise<RegistrationResult> {
  try {
    await submitRegistration(activityId, formData);

    // 成功后返回重定向URL
    return {
      success: true,
      redirect: `/activity/${activityId}/result`,
    };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "报名失败，请稍后重试";

    // 失败时返回错误信息
    return {
      success: false,
      error: errorMessage,
    };
  }
}

export async function deleteRegistrations(
  activityId: string,
): Promise<DeleteResult> {
  try {
    await deleteAllRegistrations(activityId);
    return { success: true };
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "删除报名记录失败，请稍后重试";
    return {
      success: false,
      error: errorMessage,
    };
  }
}
