"use client";

import { useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

type CatalogItem = {
  id: string;
  code: string;
  createdAt: string;
  title: string;
  status: "ativo" | "inativo";
  level?: string;
};

type CatalogManagerPageProps = {
  title: string;
  subtitle: string;
  searchPlaceholder: string;
  createLabel: string;
  items: CatalogItem[];
  emptyMessage: string;
  showLevelColumn?: boolean;
};

function StatusBadge({ status }: { status: CatalogItem["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        status === "ativo"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      )}
    >
      {status}
    </span>
  );
}

export default function CatalogManagerPage({
  title,
  subtitle,
  searchPlaceholder,
  createLabel,
  items,
  emptyMessage,
  showLevelColumn = false,
}: CatalogManagerPageProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return items;

    return items.filter((item) => {
      return [
        item.code,
        item.createdAt,
        item.title,
        item.status,
        item.level ?? "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch);
    });
  }, [items, search]);

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      actions={
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[340px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <Button
            variant="primary"
            onClick={() => alert(`${createLabel} será ligado ao cadastro em seguida.`)}
          >
            Criar
          </Button>
        </div>
      }
    >
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
          <div className="text-2xl font-black text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">
            {filtered.length} {filtered.length === 1 ? "registro encontrado" : "registros encontrados"}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-100/80 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Cód.</th>
                <th className="px-5 py-4 text-left">Criado em</th>
                <th className="px-5 py-4 text-left">Título</th>
                {showLevelColumn ? (
                  <th className="px-5 py-4 text-left">Nível</th>
                ) : null}
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={showLevelColumn ? 6 : 5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="px-5 py-5 text-lg font-semibold text-slate-600">{item.code}</td>
                    <td className="px-5 py-5 text-slate-500">{item.createdAt}</td>
                    <td className="px-5 py-5">
                      <div className="font-semibold text-slate-800">{item.title}</div>
                    </td>
                    {showLevelColumn ? (
                      <td className="px-5 py-5 text-slate-600">{item.level || "—"}</td>
                    ) : null}
                    <td className="px-5 py-5">
                      <StatusBadge status={item.status} />
                    </td>
                    <td className="px-5 py-5">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => alert(`Edição de ${title.toLowerCase()} será ligada em seguida.`)}
                        >
                          Editar
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => alert(`Exclusão de ${title.toLowerCase()} será ligada em seguida.`)}
                        >
                          Excluir
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
          <div className="text-xs text-slate-500">
            Página 1 de 1
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>
              Anterior
            </Button>
            <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-bold text-white">
              1
            </div>
            <Button variant="secondary" size="sm" disabled>
              Próxima
            </Button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
