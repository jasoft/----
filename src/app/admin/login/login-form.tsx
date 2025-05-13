"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getPocketBaseClientInstance } from "~/lib/pb";
import { Dialog } from "~/components/ui/dialog";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const pb = getPocketBaseClientInstance();
      await pb.collection("users").authWithPassword(username, password);

      // 手动设置cookie以确保服务器端可以读取
      if (pb.authStore.isValid) {
        document.cookie = `pb_auth=${JSON.stringify({
          token: pb.authStore.token,
          model: pb.authStore.record,
        })}; path=/`;
      }

      // 登录成功后重定向
      const from = searchParams.get("from") ?? "/admin";
      router.replace(from);
    } catch (err) {
      let message = "登录失败";
      if (err instanceof Error) {
        if (err.message.includes("password")) {
          message = "用户名或密码错误";
        } else {
          message = err.message;
        }
      }
      setError(message);
      await Dialog.error("登录失败", message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="username"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          用户名
        </label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="input input-bordered w-full"
          required
          autoComplete="username"
          disabled={isLoading}
          data-testid="username"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="mb-1 block text-sm font-medium text-neutral-700"
        >
          密码
        </label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="input input-bordered w-full"
          required
          autoComplete="current-password"
          disabled={isLoading}
          data-testid="password"
        />
      </div>

      {error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-600">
          {error}
        </div>
      )}

      <button
        type="submit"
        className={`btn btn-primary w-full ${isLoading ? "loading" : ""}`}
        disabled={isLoading}
        data-testid="submit"
      >
        {isLoading ? "登录中..." : "登录"}
      </button>
    </form>
  );
}
