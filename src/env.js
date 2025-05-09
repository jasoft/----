import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * 服务端环境变量的验证规则
   */
  server: {
    AUTH_SECRET: z.string().min(1),
    NODE_ENV: z.enum(["development", "test", "production"]),
    // 暂时允许GitHub OAuth配置为可选
    AUTH_GITHUB_ID: z.string().optional(),
    AUTH_GITHUB_SECRET: z.string().optional(),
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
  },

  /**
   * 在开发环境中是否跳过验证
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
