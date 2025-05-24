import PocketBase from "pocketbase";
import type { AuthRecord } from "pocketbase";

let instance: PocketBase | null = null;

export enum Collections {
  ACTIVITIES = "activities",
  REGISTRATIONS = "registrations",
  USERS = "users",
}

// PocketBase 基础记录类型
interface BaseRecord {
  id: string;
  created: string;
  updated: string;
  collectionId: string;
  collectionName: string;
}

// 活动表单字段
export interface ActivityData {
  title: string;
  content: string;
  deadline: string;
  winnersCount: number;
  isPublished: boolean;
  maxRegistrants: number;
  creatorId: string;
}

export interface Activity extends BaseRecord, ActivityData {
  expand?: {
    registrations_count?: number;
    registrations?: Registration[];
  };
}

export interface Registration extends BaseRecord {
  name: string;
  phone: string;
  activity: string;
  isWinner: boolean;
  photo?: string;
  expand?: {
    activity?: Activity;
  };
}

// PocketBase 认证模型
export interface AuthModel extends BaseRecord {
  email: string;
  username: string;
  verified: boolean;
  role?: string;
  isAdmin?: boolean;
  lastResetSentAt: string;
  lastVerificationSentAt: string;
  profile: Record<string, unknown>;
  tokenExpire?: string;
}

interface AuthCookieData {
  token: string;
  model: AuthRecord;
}

function isAuthCookieData(data: unknown): data is AuthCookieData {
  if (typeof data !== "object" || data === null) return false;

  const candidate = data as Partial<AuthCookieData>;
  if (typeof candidate.token !== "string") return false;
  if (typeof candidate.model !== "object" || candidate.model === null)
    return false;

  return true;
}

const isClient = typeof window !== "undefined";

export function getPocketBaseClientInstance() {
  if (!instance) {
    if (process.env.NEXT_PUBLIC_POCKETBASE_URL === undefined) {
      throw new Error("POCKETBASE_URL is not defined");
    }
    instance = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
    instance.autoCancellation(false); // 禁用自动取消请求
    // 在客户端环境下才初始化认证状态
    if (isClient) {
      // 设置持久化认证

      // 监听认证状态变化并持久化
      instance.authStore.onChange(() => {
        console.log("Auth state changed", instance?.authStore.isValid);
      });
    }
  }
  return instance;
}

/**
 * 执行需要认证的操作
 * 自动处理token刷新和错误重试
 */
export async function executeAuthenticatedOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
): Promise<T> {
  const pb = getPocketBaseClientInstance();

  try {
    await pb.collection("users").authWithPassword("admin", "xlu_omKO3lMLPVk");
    // 检查认证状态
    if (!pb.authStore.isValid) {
      throw new Error("未登录或登录已过期");
    }

    // 如果token即将过期，尝试刷新
    const model = pb.authStore.model as AuthModel | null;
    if (model?.tokenExpire) {
      const tokenExp = new Date(model.tokenExpire);
      if (tokenExp < new Date(Date.now() + 5 * 60 * 1000)) {
        await pb.collection("users").authRefresh();
      }
    }

    return await operation();
  } catch (error) {
    if (retries > 0 && error instanceof Error) {
      // 如果是认证错误且还有重试次数，尝试刷新token后重试
      if (error.message.includes("认证") || error.message.includes("auth")) {
        try {
          await pb.collection("users").authRefresh();
          return executeAuthenticatedOperation(operation, retries - 1);
        } catch {
          throw new Error("认证已过期，请重新登录");
        }
      }
    }
    throw error;
  }
}

/**
 * 检查当前用户是否为管理员
 */
export function isAdmin() {
  const pb = getPocketBaseClientInstance();

  try {
    // 尝试从cookie中读取认证数据
    const cookieStr = document.cookie
      .split("; ")
      .find((row) => row.startsWith("pb_auth="));

    if (!cookieStr) return false;

    const cookieValue = cookieStr.split("=")[1];
    if (!cookieValue) return false;

    const parsedData = JSON.parse(decodeURIComponent(cookieValue)) as unknown;
    if (!isAuthCookieData(parsedData)) return false;

    // 恢复认证状态
    pb.authStore.save(parsedData.token, parsedData.model);

    return pb.authStore.record?.role === "admin";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

export function adminLogout() {
  const pb = getPocketBaseClientInstance();
  pb.authStore.clear();
}
