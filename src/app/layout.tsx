import "~/styles/globals.css";
import { GlobalToast } from "~/components/ui/toast";
import { Nav } from "~/components/nav";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
export const metadata = {
  title: "抽签系统",
  description: "抽签系统",
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
