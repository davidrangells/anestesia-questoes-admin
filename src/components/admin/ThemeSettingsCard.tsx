"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";

type ThemeMode = "light" | "dark" | "system";

function getEffectiveTheme(mode: ThemeMode) {
  if (mode === "system") {
    return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }
  return mode;
}

function applyTheme(mode: ThemeMode) {
  const effective = getEffectiveTheme(mode);
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  root.classList.add(effective);
  root.setAttribute("data-theme", mode);
  localStorage.setItem("aq-theme", mode);
}

export default function ThemeSettingsCard() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    const stored = localStorage.getItem("aq-theme");
    if (stored === "light" || stored === "dark" || stored === "system") {
      setMode(stored);
      applyTheme(stored);
      return;
    }
    applyTheme("system");
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      if (mode === "system") applyTheme("system");
    };
    media.addEventListener("change", handler);
    return () => media.removeEventListener("change", handler);
  }, [mode]);

  const setTheme = (next: ThemeMode) => {
    setMode(next);
    applyTheme(next);
  };

  return (
    <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
        <div className="text-2xl font-black text-slate-900">Aparência</div>
      </div>
      <div className="p-5">
        <div className="mb-4 text-sm text-slate-500">
          Escolha como o dashboard deve aparecer para este navegador.
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant={mode === "light" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTheme("light")}
          >
            Claro
          </Button>
          <Button
            variant={mode === "dark" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTheme("dark")}
          >
            Escuro
          </Button>
          <Button
            variant={mode === "system" ? "primary" : "secondary"}
            size="sm"
            onClick={() => setTheme("system")}
          >
            Sistema
          </Button>
        </div>
      </div>
    </div>
  );
}
