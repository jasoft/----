import "~/styles/globals.css";

import { type Metadata } from "next";
import { Nav } from "~/components/nav";

export const metadata: Metadata = {
  title: "报名抽签系统",
  description: "活动报名和抽签系统",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="flex min-h-screen flex-col">
          <Nav />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
