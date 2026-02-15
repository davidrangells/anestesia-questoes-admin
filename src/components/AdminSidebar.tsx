"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
      className={[
        "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition",
        active
          ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-[0_12px_30px_rgba(37,99,235,0.28)]"
          : "text-slate-700 hover:bg-slate-100",
      ].join(" ")}
    >
      <span className="text-base">{icon}</span>
      <span className="truncate">{label}</span>
    </Link>
  );
}

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const router = useRouter();

  const handleLogout = async () => {
    await signOut(auth);
    router.replace("/login");
  };

  return (
    <aside className="w-[320px] shrink-0 border-r border-slate-200/70 bg-white min-h-screen sticky top-0 flex flex-col">
      {/* Header */}
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

      {/* Menu */}
      <div className="px-4 py-4">
        <div className="mb-2 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          Navegação
        </div>
        <nav className="flex flex-col gap-2">
          <Item href="/admin" label="Dashboard" icon="🏠" onNavigate={onNavigate} />
          <Item
            href="/admin/questoes"
            label="Banco de Questões"
            icon="🧠"
            onNavigate={onNavigate}
          />
          <Item href="/admin/midias" label="Mídias" icon="🖼️" onNavigate={onNavigate} />
          <Item
            href="/admin/erros-reportados"
            label="Erros reportados"
            icon="🧯"
            onNavigate={onNavigate}
          />
          <Item href="/admin/alunos" label="Alunos" icon="👤" onNavigate={onNavigate} />
          <Item
            href="/admin/assinaturas"
            label="Assinaturas"
            icon="💳"
            onNavigate={onNavigate}
          />
        </nav>
      </div>

      {/* Footer */}
      <div className="mt-auto p-4 border-t border-slate-200/70">
        <button
          onClick={handleLogout}
          className="w-full rounded-2xl px-4 py-3 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 transition shadow-[0_10px_25px_rgba(2,6,23,0.20)]"
        >
          Sair
        </button>
        <div className="mt-3 text-[11px] text-slate-400">
          Versão Admin • ambiente local
        </div>
      </div>
    </aside>
  );
}