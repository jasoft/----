"use client";

import { useFormStatus } from "react-dom";
import { cn } from "~/lib/utils";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  pendingText?: string;
  pending?: boolean; // 新增：允许外部传入 pending 状态
}

export function SubmitButton({
  children,
  className,
  pendingText = "提交中...",
  pending: externalPending,
  ...props
}: SubmitButtonProps) {
  // 尝试使用 useFormStatus，如果失败则使用外部传入的 pending 状态
  let formStatus;
  try {
    formStatus = useFormStatus();
  } catch {
    // useFormStatus 在非 form action 上下文中会失败，这是正常的
    formStatus = { pending: false };
  }

  const pending = externalPending ?? formStatus.pending;

  return (
    <button
      type="submit"
      data-testid="submit-button"
      disabled={pending}
      className={cn(
        "inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:outline-none",
        pending && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  );
}
