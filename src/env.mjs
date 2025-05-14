import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  /**
   * 服务器端环境变量的验证
   */
  server: {
    NODE_ENV: z.enum(["development", "test", "production"]).optional(),
    CLERK_SECRET_KEY: z.string().min(1),
  },

  /**
   * 客户端环境变量的验证
   */
  client: {
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: z.string().min(1),
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: z.string().min(1),
    NEXT_PUBLIC_POCKETBASE_URL: z.string().min(1),
    NEXT_PUBLIC_SKIP_AUTH_IN_TEST: z.string().optional(),
  },

  /**
   * 环境变量解析规则
   */
  runtimeEnv: {
    NODE_ENV: process.env.NODE_ENV,
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLERK_SIGN_IN_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL,
    NEXT_PUBLIC_CLERK_SIGN_UP_URL: process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL,
    NEXT_PUBLIC_POCKETBASE_URL: process.env.NEXT_PUBLIC_POCKETBASE_URL,
    NEXT_PUBLIC_SKIP_AUTH_IN_TEST: process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST,
  },
});
