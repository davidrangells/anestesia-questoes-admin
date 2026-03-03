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
  disabled = false,
  onNavigate,
}: {
  href?: string;
  label: string;
  icon: string;
  disabled?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isDashboard = href === "/admin";

  const active = href && (isDashboard
    ? pathname === "/admin"
    : pathname?.startsWith(href));

  if (!href || disabled) {
    return (
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold",
          "cursor-not-allowed text-slate-400"
        )}
        aria-disabled="true"
      >
        <span className="text-base">{icon}</span>
        <span className="truncate">{label}</span>
      </div>
    );
  }

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

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-5 first:mt-0">
      <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
        {title}
      </div>
      <div className="flex flex-col gap-1">{children}</div>
    </div>
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

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 overscroll-contain">
        <nav>
          <Section title="Navegação">
            <Item href="/admin" label="Dashboard" icon="🏠" onNavigate={handleNavigate} />
          </Section>

          <Section title="Gerenciamento">
            <Item href="/admin/alunos" label="Alunos" icon="👥" onNavigate={handleNavigate} />
            <Item href="/admin/provas" label="Provas" icon="📝" onNavigate={handleNavigate} />
            <Item href="/admin/niveis" label="Níveis" icon="📚" onNavigate={handleNavigate} />
            <Item href="/admin/temas" label="Temas" icon="🏷️" onNavigate={handleNavigate} />
            <Item href="/admin/questoes" label="Questões" icon="🧠" onNavigate={handleNavigate} />
            <Item
              href="/admin/erros-reportados"
              label="Erros Reportados"
              icon="🧯"
              onNavigate={handleNavigate}
            />
            <Item href="/admin/simulados" label="Simulados" icon="🧪" onNavigate={handleNavigate} />
          </Section>

          <Section title="Financeiro">
            <Item
              href="/admin/assinaturas"
              label="Assinaturas"
              icon="💳"
              onNavigate={handleNavigate}
            />
            <Item href="/admin/faturas" label="Faturas" icon="🧾" onNavigate={handleNavigate} />
            <Item href="/admin/planos" label="Planos" icon="📦" onNavigate={handleNavigate} />
          </Section>

          <Section title="CMS">
            <Item href="/admin/midias" label="Galeria de Mídias" icon="🖼️" onNavigate={handleNavigate} />
          </Section>

          <Section title="Sistema">
            <Item
              href="/admin/importador"
              label="Importador / Exportador"
              icon="📥"
              onNavigate={handleNavigate}
            />
            <Item href="/admin/pagamento" label="Pagamento" icon="💰" onNavigate={handleNavigate} />
            <Item
              href="/admin/administradores"
              label="Administradores"
              icon="🛡️"
              onNavigate={handleNavigate}
            />
            <Item
              href="/admin/configuracoes"
              label="Configurações"
              icon="⚙️"
              onNavigate={handleNavigate}
            />
          </Section>
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
          "fixed inset-y-0 left-0 z-40 flex w-[88vw] max-w-[320px] flex-col overflow-hidden border-r border-slate-200/70 bg-white shadow-2xl transition-transform lg:hidden",
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {sidebarContent}
      </aside>

      <aside className="hidden min-h-screen w-[320px] shrink-0 overflow-hidden border-r border-slate-200/70 bg-white sticky top-0 lg:flex lg:flex-col">
        {sidebarContent}
      </aside>
    </>
  );
}
