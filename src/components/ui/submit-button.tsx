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
      disabled={pending}
      className={cn(
        "btn btn-primary w-full",
        pending && "cursor-not-allowed opacity-50",
        className,
      )}
      {...props}
    >
      {pending ? pendingText : children}
    </button>
  );
}
