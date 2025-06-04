import PocketBase from "pocketbase";
import type { AuthRecord } from "pocketbase";

let instance: PocketBase | null = null;

export enum Collections {
  ACTIVITIES = "activities",
  REGISTRATIONS = "registrations",
  USERS = "users",
  USER_CACHE = "user_cache",
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

    // 设置性能优化配置
    const requestTimes = new Map<string, number>();

    instance.beforeSend = function (url, options) {
      const startTime = performance.now();
      const requestId = Math.random().toString(36).slice(2, 9);
      requestTimes.set(requestId, startTime);
      console.log(`PB请求开始: ${url}`);

      // 添加缓存控制头
      options.headers = {
        ...options.headers,
        "Cache-Control": "no-cache",
        "X-Request-ID": requestId,
      };

      return { url, options };
    };

    instance.afterSend = function (response, data: unknown) {
      const endTime = performance.now();
      const requestId = response.headers.get("X-Request-ID");
      const startTime = requestId ? requestTimes.get(requestId) : null;

      if (startTime && requestId) {
        const duration = endTime - startTime;
        console.log(
          `PB请求完成: ${response.url} - 耗时: ${duration.toFixed(2)}ms`,
        );
        requestTimes.delete(requestId);
      }

      return data;
    };

    // 在客户端环境下才初始化认证状态
    if (isClient) {
      // 监听认证状态变化并持久化
      instance.authStore.onChange(() => {
        console.log("Auth state changed", instance?.authStore.isValid);
      });
    }
  }
  return instance;
}

// 认证状态缓存
let authPromise: Promise<void> | null = null;
let lastAuthTime = 0;
const AUTH_CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

/**
 * 确保认证状态有效
 */
async function ensureAuthenticated(): Promise<void> {
  const pb = getPocketBaseClientInstance();
  const now = Date.now();

  // 如果已经有有效的认证状态且在缓存时间内，直接返回
  if (pb.authStore.isValid && now - lastAuthTime < AUTH_CACHE_DURATION) {
    return;
  }

  // 如果正在进行认证，等待完成
  if (authPromise) {
    return authPromise;
  }

  // 开始新的认证流程
  authPromise = (async () => {
    try {
      // 只有在认证无效时才重新登录
      if (!pb.authStore.isValid) {
        await pb
          .collection("users")
          .authWithPassword("admin", "xlu_omKO3lMLPVk");
      }

      // 检查token是否即将过期
      const model = pb.authStore.model as AuthModel | null;
      if (model?.tokenExpire) {
        const tokenExp = new Date(model.tokenExpire);
        if (tokenExp < new Date(Date.now() + 5 * 60 * 1000)) {
          await pb.collection("users").authRefresh();
        }
      }

      lastAuthTime = now;
    } finally {
      authPromise = null;
    }
  })();

  return authPromise;
}

/**
 * 执行需要认证的操作
 * 自动处理token刷新和错误重试
 */
export async function executeAuthenticatedOperation<T>(
  operation: () => Promise<T>,
  retries = 3,
): Promise<T> {
  try {
    await ensureAuthenticated();
    return await operation();
  } catch (error) {
    if (retries > 0 && error instanceof Error) {
      // 如果是认证错误且还有重试次数，清除缓存并重试
      if (
        error.message.includes("认证") ||
        error.message.includes("auth") ||
        error.message.includes("401") ||
        error.message.includes("unauthorized")
      ) {
        lastAuthTime = 0; // 清除认证缓存
        authPromise = null;
        return executeAuthenticatedOperation(operation, retries - 1);
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
