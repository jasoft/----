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
  // 始终调用 useFormStatus，但安全地处理可能的错误状态
  const formStatus = useFormStatus();

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
