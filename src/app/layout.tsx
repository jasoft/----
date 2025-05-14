import "~/styles/globals.css";
import { Inter } from "next/font/google";
import { GlobalToast } from "~/components/ui/toast";
import { Nav } from "~/components/nav";
import { ClerkProvider } from "@clerk/nextjs";
import { zhCN } from "@clerk/localizations";
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
  return (
    <ClerkProvider localization={zhCN}>
      <html lang="zh-CN">
        <body className={`font-sans ${inter.variable}`}>
          <Nav />
          <GlobalToast />
          <main className="container mx-auto p-4">{children}</main>
        </body>
      </html>
    </ClerkProvider>
  );
}
