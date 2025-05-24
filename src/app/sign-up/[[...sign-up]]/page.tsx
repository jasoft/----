import { SignUp } from "@clerk/nextjs";
import Image from "next/image";
import Link from "next/link";

export default function Page() {
  const siteName = process.env.NEXT_PUBLIC_SITE_NAME ?? "抽签系统";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-gradient-to-br from-indigo-400/20 to-pink-400/20 blur-3xl"></div>
      </div>

      <div className="relative flex min-h-screen flex-col lg:flex-row">
        {/* Left side - Illustration and branding */}
        <div className="hidden lg:flex lg:w-1/2 lg:flex-col lg:justify-center lg:px-12 lg:py-8">
          <div className="mx-auto max-w-md">
            {/* Site title */}
            <div className="mb-8">
              <div className="mb-4 flex items-center">
                <Image
                  src="/lottery-icon.svg"
                  alt="抽签图标"
                  width={48}
                  height={48}
                  className="mr-3"
                />
                <h1 className="text-4xl font-bold text-gray-900">{siteName}</h1>
              </div>
              <p className="text-lg leading-relaxed text-gray-600">
                公平、透明、便捷的在线抽签平台
              </p>
            </div>

            {/* Illustration */}
            <div className="relative">
              <Image
                src="/login-illustration.svg"
                alt="抽签系统插图"
                width={400}
                height={300}
                className="h-auto w-full"
                priority
              />
            </div>

            {/* Features */}
            <div className="mt-8 space-y-4">
              <div className="flex items-center space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-green-100">
                  <svg
                    className="h-4 w-4 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">
                  安全可靠的抽签机制
                </span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100">
                  <svg
                    className="h-4 w-4 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">实时结果公布</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-purple-100">
                  <svg
                    className="h-4 w-4 text-purple-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                    />
                  </svg>
                </div>
                <span className="text-sm text-gray-600">多人同时参与</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration form */}
        <div className="flex w-full flex-col justify-center px-4 py-8 sm:px-6 lg:w-1/2 lg:px-8 lg:py-12">
          <div className="mx-auto w-full max-w-md">
            {/* Mobile site title */}
            <div className="mb-8 text-center lg:hidden">
              <div className="mb-4 flex items-center justify-center">
                <Image
                  src="/lottery-icon.svg"
                  alt="抽签图标"
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                  {siteName}
                </h1>
              </div>
              <p className="text-gray-600">欢迎注册</p>
            </div>

            {/* Registration card */}
            <div className="rounded-2xl border border-white/20 bg-white/80 p-6 shadow-xl backdrop-blur-sm sm:p-8">
              <div className="mb-6 text-center lg:text-left">
                <h2 className="mb-2 text-xl font-semibold text-gray-900 sm:text-2xl">
                  创建账户
                </h2>
                <p className="text-sm text-gray-600 sm:text-base">
                  填写信息以创建您的账户
                </p>
              </div>

              <div className="overflow-hidden">
                <SignUp
                  appearance={{
                    elements: {
                      formButtonPrimary:
                        "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl w-full",
                      card: "shadow-none bg-transparent w-full",
                      rootBox: "w-full",
                      headerTitle: "hidden",
                      headerSubtitle: "hidden",
                      socialButtonsBlockButton:
                        "border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all duration-200 w-full",
                      dividerLine: "bg-gray-200",
                      dividerText: "text-gray-500 text-sm",
                      formFieldLabel: "text-gray-700 font-medium text-sm",
                      formFieldInput:
                        "border-gray-200 focus:border-blue-500 focus:ring-blue-500 rounded-lg w-full text-sm",
                      footer: { display: "none" },
                      formFieldInputShowPasswordButton:
                        "text-gray-500 hover:text-gray-700",
                      identityPreviewEditButton:
                        "text-blue-600 hover:text-blue-700",
                      formResendCodeLink: "text-blue-600 hover:text-blue-700",
                      footerActionLink: "text-blue-600 hover:text-blue-700",
                    },
                    layout: {
                      logoPlacement: "none",
                    },
                  }}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>
                已有账户？{" "}
                <Link
                  href="/sign-in"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  立即登录
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
