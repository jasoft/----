import PocketBase from "pocketbase";

// 创建PocketBase实例
export const pb = new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);

// API响应类型
interface AdminAuthError {
  error: string;
}

interface AdminAuthSuccess {
  token: string;
  model: object;
}

// 认证状态
let authState: {
  isValid: boolean;
  token: string | null;
  lastCheck: number;
} = {
  isValid: false,
  token: null,
  lastCheck: 0,
};

// 检查认证是否过期（15分钟）
const isAuthExpired = () => {
  const now = Date.now();
  return now - authState.lastCheck > 15 * 60 * 1000;
};

// 验证当前认证状态
const validateAuth = async () => {
  if (!authState.isValid || isAuthExpired()) {
    authState.isValid = false;
    authState.token = null;
    throw new Error("认证已过期，请重新登录");
  }
};

// 用于服务端
export const getPocketBaseServerInstance = () => {
  return new PocketBase(process.env.NEXT_PUBLIC_POCKETBASE_URL);
};

// 用于客户端
export const getPocketBaseClientInstance = () => {
  return pb;
};

// 管理员登录
export const loginAsAdmin = async () => {
  try {
    if (authState.isValid && !isAuthExpired()) {
      return pb.authStore.model;
    }

    const res = await fetch("/api/admin/auth", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });

    if (!res.ok) {
      const error = (await res.json()) as AdminAuthError;
      throw new Error(error.error ?? "认证失败");
    }

    const data = (await res.json()) as AdminAuthSuccess;

    if (!data.token || !data.model) {
      throw new Error("认证响应无效");
    }

    // @ts-expect-error - PocketBase的类型定义与实际实现不匹配
    pb.authStore.save(data.token, data.model);

    authState = {
      isValid: true,
      token: data.token,
      lastCheck: Date.now(),
    };

    return data.model;
  } catch (error) {
    console.error("管理员登录失败:", error);

    // 重置认证状态
    authState = {
      isValid: false,
      token: null,
      lastCheck: 0,
    };

    if (error instanceof Error) {
      throw new Error(`认证失败: ${error.message}`);
    }

    throw error;
  }
};

// 检查是否已认证
export const isAuthenticated = () => {
  return authState.isValid && !isAuthExpired();
};

// 登出
export const logout = () => {
  pb.authStore.clear();
  authState = {
    isValid: false,
    token: null,
    lastCheck: 0,
  };
};

// 执行需要认证的操作
export const executeAuthenticatedOperation = async <T>(
  operation: () => Promise<T>,
): Promise<T> => {
  try {
    await validateAuth();
    return await operation();
  } catch (error) {
    if (error instanceof Error && error.message === "认证已过期，请重新登录") {
      // 尝试重新登录
      await loginAsAdmin();
      return await operation();
    }
    throw error;
  }
};

// 通用响应类型
export interface PocketBaseResponse<T extends Model = Model> {
  page: number;
  perPage: number;
  totalPages: number;
  totalItems: number;
  items: Array<T>;
}

// 类型定义
export interface Model {
  id: string;
  created: string;
  updated: string;
}

export interface Activity extends Model {
  title: string;
  content: string;
  deadline: string;
  winnersCount: number;
}

export interface Registration extends Model {
  activityId: string;
  name: string;
  photo: string;
  isWinner: boolean;
}

// 集合名称
export const Collections = {
  ACTIVITIES: "activities",
  REGISTRATIONS: "registrations",
} as const;
