import "~/styles/globals.css";
import { GlobalToast } from "~/components/ui/toast";
import { Nav } from "~/components/nav";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";

export const metadata = {
  title: process.env.NEXT_PUBLIC_SITE_NAME ?? "抽签系统",
  description:
    process.env.NEXT_PUBLIC_SITE_DESCRIPTION ??
    "公平、透明、便捷的在线抽签平台",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const skipAuth = process.env.NEXT_PUBLIC_SKIP_AUTH_IN_TEST === "true";

  const content = (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 防止浏览器自动插入内容 */}
        <meta name="format-detection" content="telephone=no" />
        <meta name="format-detection" content="date=no" />
        <meta name="format-detection" content="address=no" />
        <meta name="format-detection" content="email=no" />
        <meta name="google" content="notranslate" />
      </head>
      <body suppressHydrationWarning className="font-sans">
        <Nav />
        <GlobalToast />
        <main className="container mx-auto my-auto">{children}</main>
      </body>
    </html>
  );

  return skipAuth ? (
    content
  ) : (
    <ClerkProvider localization={zhCN}>{content}</ClerkProvider>
  );
}
