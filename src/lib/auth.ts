import { getPocketBaseClientInstance } from "./pb";
import type { RecordModel } from "pocketbase";

// 数据库记录模型
export interface UserRecord extends RecordModel {
  email: string;
  username: string;
  role?: string;
  verified: boolean;
  isAdmin?: boolean;
  tokenExpire?: string;
}

// 用户认证模型
export interface UserAuthModel {
  id: string;
  email: string;
  username: string;
  role?: string;
  verified: boolean;
  tokenExpire?: string;
}

// 认证响应类型
export interface AuthResponse {
  token: string;
  record: UserRecord;
}

// 管理员权限验证类
export class AdminAuth {
  /**
   * 验证用户是否有管理员权限
   * @param user 用户数据，如果不提供则使用当前登录用户
   * @returns boolean
   */
  static isAdmin(user?: UserAuthModel): boolean {
    if (user) {
      // 调试信息
      console.log("[AdminAuth] 验证管理员权限(直接验证):", {
        user: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      });

      return user.role === "admin";
    }

    const pb = getPocketBaseClientInstance();
    const model = pb.authStore.record as UserAuthModel | null;

    // 调试信息
    console.log("[AdminAuth] 验证管理员权限(从authStore):", {
      isValid: pb.authStore.isValid,
      user: model
        ? {
            id: model.id,
            username: model.username,
            role: model.role,
          }
        : null,
    });

    if (!pb.authStore.isValid || !model) {
      return false;
    }

    return model.role === "admin";
  }

  /**
   * 验证用户是否有管理员权限，如果没有则抛出异常
   * @param user 用户数据，如果不提供则使用当前登录用户
   * @throws Error 如果用户没有管理员权限
   */
  static validateAdmin(user?: UserAuthModel): void {
    if (!this.isAdmin(user)) {
      throw new Error("非管理员账户无法访问管理后台");
    }
  }

  /**
   * 验证登录响应数据
   * @param authData 登录响应数据
   * @throws Error 如果验证失败
   */
  static validateLoginResponse(authData: {
    token: string;
    record: UserRecord;
  }): void {
    console.log("[AdminAuth] 验证登录数据:", {
      token: authData?.token ? "存在" : "不存在",
      record: authData?.record
        ? {
            id: authData.record.id,
            username: authData.record.username,
            role: authData.record.role,
            isAdmin: authData.record.isAdmin,
          }
        : null,
    });

    if (!authData?.token || !authData?.record) {
      throw new Error("登录失败：无效的认证数据");
    }

    const userModel: UserAuthModel = {
      id: authData.record.id,
      email: authData.record.email,
      username: authData.record.username,
      role: authData.record.role,
      verified: authData.record.verified,
      tokenExpire: authData.record.tokenExpire,
    };

    // 验证管理员权限
    this.validateAdmin(userModel);
  }
}
