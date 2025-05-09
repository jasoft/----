import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import { env } from "~/env";

export const {
  handlers: { GET, POST },
  auth: getServerAuthSession,
} = NextAuth({
  providers: [
    GitHub({
      clientId: String(env.AUTH_GITHUB_ID ?? "temp-id"),
      clientSecret: String(env.AUTH_GITHUB_SECRET ?? "temp-secret"),
    }),
  ],
  pages: {
    signIn: "/auth/signin",
  },
  // 临时禁用认证检查
  callbacks: {
    authorized() {
      return true;
    },
  },
});
