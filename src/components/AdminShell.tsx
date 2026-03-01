// src/components/AdminShell.tsx
"use client";

import React from "react";
import { cn } from "@/lib/cn";

type AdminShellProps = {
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
};

export default function AdminShell({
  title,
  subtitle,
  actions,
  children,
}: AdminShellProps) {
  return (
    <div className="min-h-screen flex-1 min-w-0">
      {/* Topbar */}
      <div className="sticky top-0 z-30 border-b bg-white/80 backdrop-blur">
        <div className="px-4 py-4 pl-24 sm:px-6 sm:pl-24 lg:px-10 lg:pl-10">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              {title ? (
                <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                  {title}
                </h1>
              ) : null}
              {subtitle ? (
                <p className="mt-0.5 break-words text-sm text-slate-500">{subtitle}</p>
              ) : null}
            </div>

            <div
              className={cn(
                "flex shrink-0 flex-wrap items-center gap-3",
                actions ? "w-full md:w-auto" : "hidden"
              )}
            >
              {actions}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="overflow-x-hidden px-4 py-5 sm:px-6 lg:px-10 lg:py-6">
        {/* Esse container é o “segredo” para não colar no sidebar e não esticar demais em telas grandes */}
        <div className="w-full max-w-[1200px] min-w-0">
          {children}
        </div>
      </div>
    </div>
  );
}
