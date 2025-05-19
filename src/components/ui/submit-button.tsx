"use client";

import { useFormStatus } from "react-dom";
import { cn } from "~/lib/utils";

interface SubmitButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  pendingText?: string;
}

export function SubmitButton({
  children,
  className,
  pendingText = "提交中...",
  ...props
}: SubmitButtonProps) {
  const { pending } = useFormStatus();

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
