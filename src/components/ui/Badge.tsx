"use client";

import * as React from "react";
import { cn } from "@/lib/cn";

type BadgeTone = "blue" | "green" | "amber" | "red" | "slate" | "emerald" | "indigo";

/*
 * Regra: NUNCA usar modificadores de opacidade (/50, /60 etc.) em dark:
 * O Tailwind JIT não consegue extrair essas classes de strings dinâmicas.
 * Usar sempre cores sólidas.
 */
const toneStyles: Record<BadgeTone, string> = {
  blue:    "border-blue-200    bg-blue-100    text-blue-800    dark:border-blue-800    dark:bg-blue-900    dark:text-blue-200",
  green:   "border-green-200   bg-green-100   text-green-800   dark:border-green-800   dark:bg-green-900   dark:text-green-200",
  emerald: "border-emerald-200 bg-emerald-100 text-emerald-800 dark:border-emerald-800 dark:bg-emerald-900 dark:text-emerald-200",
  amber:   "border-amber-200   bg-amber-100   text-amber-800   dark:border-amber-800   dark:bg-amber-900   dark:text-amber-200",
  red:     "border-red-200     bg-red-100     text-red-800     dark:border-red-800     dark:bg-red-900     dark:text-red-200",
  indigo:  "border-indigo-200  bg-indigo-100  text-indigo-800  dark:border-indigo-800  dark:bg-indigo-900  dark:text-indigo-200",
  slate:   "border-slate-200   bg-slate-100   text-slate-700   dark:border-slate-700   dark:bg-slate-800   dark:text-slate-200",
};

type BadgeProps = {
  tone?: BadgeTone;
  onClick?: () => void;
  title?: string;
  className?: string;
  children: React.ReactNode;
};

export function Badge({ tone = "slate", onClick, title, className, children }: BadgeProps) {
  return (
    <span
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-semibold select-none",
        toneStyles[tone],
        onClick && "cursor-pointer hover:opacity-80 transition-opacity",
        className
      )}
    >
      {children}
    </span>
  );
}
