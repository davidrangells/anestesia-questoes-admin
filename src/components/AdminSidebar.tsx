"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button, buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

function Item({
  href,
  label,
  icon,
  onNavigate,
}: {
  href: string;
  label: string;
  icon: string;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isDashboard = href === "/admin";

  const active = isDashboard
    ? pathname === "/admin"
    : pathname?.startsWith(href);

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]"
          : "text-slate-700 hover:bg-slate-100",
      )}
    >
      <span className="text-base">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    setMobileOpen(false);
    router.replace("/login");
  };

  const handleNavigate = () => {
    onNavigate?.();
    setMobileOpen(false);
  };

  const sidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-slate-200/70">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-slate-200 flex items-center justify-center font-black text-blue-700">
            AQ
          </div>
          <div>
            <div className="text-lg font-black text-slate-900">
              Anestesia Questões
            </div>
            <div className="text-xs text-slate-500">Painel Administrativo</div>
          </div>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navegação
        </div>
        <nav className="flex flex-col gap-2">
          <Item href="/admin" label="Dashboard" icon="🏠" onNavigate={handleNavigate} />
          <Item
            href="/admin/questoes"
            label="Banco de Questões"
            icon="🧠"
            onNavigate={handleNavigate}
          />
          <Item href="/admin/provas" label="Provas" icon="📝" onNavigate={handleNavigate} />
          <Item href="/admin/niveis" label="Níveis" icon="📚" onNavigate={handleNavigate} />
          <Item href="/admin/temas" label="Temas" icon="🏷️" onNavigate={handleNavigate} />
          <Item href="/admin/midias" label="Mídias" icon="🖼️" onNavigate={handleNavigate} />
          <Item
            href="/admin/erros-reportados"
            label="Erros reportados"
            icon="🧯"
            onNavigate={handleNavigate}
          />
          <Item href="/admin/alunos" label="Alunos" icon="👤" onNavigate={handleNavigate} />
          <Item
            href="/admin/assinaturas"
            label="Assinaturas"
            icon="💳"
            onNavigate={handleNavigate}
          />
        </nav>
      </div>

      <div className="mt-auto p-4 border-t border-slate-200/70">
        <Button onClick={handleLogout} variant="primary" block>
          Sair
        </Button>
        <div className="mt-3 text-[11px] text-slate-400">
          Versão Admin • ambiente local
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        type="button"
        aria-label={mobileOpen ? "Fechar menu" : "Abrir menu"}
        onClick={() => setMobileOpen((prev) => !prev)}
        className={cn(
          buttonStyles({ variant: "secondary", size: "sm" }),
          "fixed left-4 z-50 h-11 w-11 rounded-2xl p-0 shadow-sm lg:hidden",
          "top-[calc(env(safe-area-inset-top)+0.9rem)]"
        )}
      >
        <span className="flex flex-col items-center justify-center gap-1.5" aria-hidden="true">
          <span
            className={cn(
              "block h-0.5 w-5 rounded-full bg-current transition",
              mobileOpen && "translate-y-2 rotate-45"
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-5 rounded-full bg-current transition",
              mobileOpen && "opacity-0"
            )}
          />
          <span
            className={cn(
              "block h-0.5 w-5 rounded-full bg-current transition",
              mobileOpen && "-translate-y-2 -rotate-45"
            )}
          />
        </span>
      </button>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-900/30 backdrop-blur-sm transition lg:hidden",
          mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={() => setMobileOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-[88vw] max-w-[320px] flex-col border-r border-slate-200/70 bg-white shadow-2xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden w-[320px] shrink-0 border-r border-slate-200/70 bg-white min-h-screen sticky top-0 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
