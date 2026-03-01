"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md" | "lg";

type ButtonStyleOptions = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "border border-slate-900 bg-slate-900 text-white shadow-[0_10px_24px_rgba(15,23,42,0.16)] hover:bg-slate-800 hover:border-slate-800",
  secondary:
    "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50",
  ghost:
    "border border-transparent bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
  danger:
    "border border-rose-600 bg-rose-600 text-white hover:bg-rose-700 hover:border-rose-700",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "min-h-9 rounded-xl px-3 py-2 text-sm",
  md: "min-h-11 rounded-2xl px-4 py-3 text-sm",
  lg: "min-h-12 rounded-2xl px-5 py-3.5 text-sm",
};

export function buttonStyles({
  variant = "secondary",
  size = "md",
  block = false,
}: ButtonStyleOptions = {}) {
  return cn(
    "inline-flex items-center justify-center gap-2 font-semibold transition outline-none focus-visible:ring-2 focus-visible:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-60",
    variantStyles[variant],
    sizeStyles[size],
    block && "w-full"
  );
}

type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  ButtonStyleOptions;

export function Button({
  className,
  variant,
  size,
  block,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cn(buttonStyles({ variant, size, block }), className)}
      {...props}
    />
  );
}
