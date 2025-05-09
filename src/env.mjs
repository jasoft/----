import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * 服务端环境变量的验证规则
   */
  server: {
    AUTH_SECRET: z.string().optional(),
    AUTH_GITHUB_ID: z.string().min(1),
    AUTH_GITHUB_SECRET: z.string().min(1),
    NODE_ENV: z.enum(["development", "test", "production"]),
    POCKETBASE_ADMIN_EMAIL: z.string().email("管理员邮箱格式不正确"),
    POCKETBASE_ADMIN_PASSWORD: z.string().min(8, "管理员密码至少需要8个字符"),
  },

  /**
   * 客户端环境变量的验证规则
   */
  client: {
    NEXT_PUBLIC_POCKETBASE_URL: z.string().url(),
  },

  /**
   * 不应该解构的环境变量，通常是前缀
   */
  runtimeEnv: {
    AUTH_SECRET: process.env.AUTH_SECRET,
    AUTH_GITHUB_ID: process.env.AUTH_GITHUB_ID,
    AUTH_GITHUB_SECRET: process.env.AUTH_GITHUB_SECRET,
    NEXT_PUBLIC_POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL,
    NODE_ENV: process.env.NODE_ENV,
    POCKETBASE_ADMIN_EMAIL: process.env.POCKETBASE_ADMIN_EMAIL,
    POCKETBASE_ADMIN_PASSWORD: process.env.POCKETBASE_ADMIN_PASSWORD,
  },

  /**
   * 在开发环境中是否跳过验证
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
