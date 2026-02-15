// src/components/AdminShell.tsx
"use client";

import React from "react";

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
        <div className="px-6 lg:px-10 py-4 flex items-center justify-between gap-4">
          <div className="min-w-0">
            {title ? (
              <h1 className="text-xl font-extrabold text-slate-900 leading-tight">
                {title}
              </h1>
            ) : null}
            {subtitle ? (
              <p className="text-sm text-slate-500 mt-0.5 truncate">{subtitle}</p>
            ) : null}
          </div>

          <div className="flex items-center gap-3 shrink-0">{actions}</div>
        </div>
      </div>

      {/* Conteúdo */}
      <div className="px-6 lg:px-10 py-6">
        {/* Esse container é o “segredo” para não colar no sidebar e não esticar demais em telas grandes */}
        <div className="w-full max-w-[1200px]">
          {children}
        </div>
      </div>
    </div>
  );
}