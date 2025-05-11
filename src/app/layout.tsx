import "~/styles/globals.css";
import { Inter } from "next/font/google";
import { GlobalToast } from "~/components/ui/toast";
import { Nav } from "~/components/nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

export const metadata = {
  title: "谁是幸运儿",
  description: "抽奖系统",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`font-sans ${inter.variable}`}>
        <Nav />
        <GlobalToast />
        {children}
      </body>
    </html>
  );
}
