"use client";

import { forwardRef } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "outline" | "ghost";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "primary", ...props }, ref) => {
    const baseStyles =
      "px-4 py-2 rounded-lg font-medium transition duration-200";
    const variantStyles = {
      primary:
        "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300",
      outline:
        "border border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100 disabled:bg-gray-50",
      ghost:
        "text-gray-700 hover:bg-gray-100 active:bg-gray-200 disabled:bg-gray-50",
    };

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles[variant]} ${className}`}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";
