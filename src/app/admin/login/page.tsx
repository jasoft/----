"use client";

import { Suspense } from "react";
import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
      <div className="w-full max-w-md">
        <div className="rounded-lg border border-neutral-200 bg-white p-8 shadow-sm">
          <h1 className="mb-6 text-center text-2xl font-bold text-neutral-900">
            管理员登录
          </h1>
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
