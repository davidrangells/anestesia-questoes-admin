"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import AdminShell from "@/components/AdminShell";
import { buttonStyles } from "@/components/ui/Button";
import { db } from "@/lib/firebase";

type AssinaturaItem = {
  uid: string;
  aluno: string;
  email: string;
  origem: string;
  plano: string;
  status: "ativo" | "pendente" | "inativo";
  validade: string;
};

function formatDate(value: unknown) {
  const seconds =
    typeof value === "object" && value !== null && "seconds" in value
      ? Number((value as { seconds?: number }).seconds ?? 0)
      : 0;

  if (!seconds) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(seconds * 1000));
}

function StatusBadge({ status }: { status: AssinaturaItem["status"] }) {
  const cls =
    status === "ativo"
      ? "bg-emerald-100 text-emerald-700"
      : status === "pendente"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${cls}`}>{status}</span>;
}

export default function AssinaturasPage() {
  const [items, setItems] = useState<AssinaturaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(
          query(collection(db, "users"), where("role", "==", "student"), orderBy("updatedAt", "desc"))
        );

        const rows = await Promise.all(
          snap.docs.map(async (userDoc) => {
            const [profileSnap, entSnap] = await Promise.all([
              getDoc(doc(db, "users", userDoc.id, "profile", "main")),
              getDoc(doc(db, "entitlements", userDoc.id)),
            ]);

            const userData = userDoc.data();
            const profile = profileSnap.exists() ? profileSnap.data() : {};
            const ent = entSnap.exists() ? entSnap.data() : {};
            const status =
              ent?.active === true ? "ativo" : ent?.pending === true ? "pendente" : "inativo";

            return {
              uid: userDoc.id,
              aluno:
                String(profile?.name ?? "").trim() ||
                String(userData.name ?? "").trim() ||
                "Aluno sem nome",
              email: String(userData.email ?? ent?.email ?? "").trim() || "—",
              origem: String(ent?.source ?? "admin").trim() || "admin",
              plano: String(ent?.productTitle ?? "Sem plano"),
              status,
              validade: formatDate(ent?.validUntil ?? null),
            } satisfies AssinaturaItem;
          })
        );

        if (active) setItems(rows);
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((item) =>
      [item.aluno, item.email, item.origem, item.plano, item.status]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [items, search]);

  return (
    <AdminShell
      title="Assinaturas"
      subtitle="Gerencie o acesso dos alunos. Eduzz atualiza automaticamente; alunos manuais podem ser ajustados aqui."
      actions={
        <div className="relative w-full md:w-[340px]">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
            ⌕
          </span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar assinaturas..."
            className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
          />
        </div>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
          <div className="text-2xl font-black text-slate-900">Assinaturas</div>
          <div className="mt-1 text-sm text-slate-500">
            {loading ? "Carregando..." : `${filtered.length} registros`}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[980px] w-full text-sm">
            <thead className="border-b bg-slate-100/80 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Aluno</th>
                <th className="px-5 py-4 text-left">Origem</th>
                <th className="px-5 py-4 text-left">Plano</th>
                <th className="px-5 py-4 text-left">Validade</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-sm text-slate-500">
                    Nenhuma assinatura encontrada.
                  </td>
                </tr>
              ) : null}

              {filtered.map((item) => (
                <tr key={item.uid} className="hover:bg-slate-50/70">
                  <td className="px-5 py-5">
                    <div className="font-semibold text-slate-800">{item.aluno}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.email}</div>
                  </td>
                  <td className="px-5 py-5 text-slate-600 uppercase">{item.origem}</td>
                  <td className="px-5 py-5 text-slate-600">{item.plano}</td>
                  <td className="px-5 py-5 text-slate-600">{item.validade}</td>
                  <td className="px-5 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/assinaturas/${item.uid}`}
                        className={buttonStyles({ variant: "primary", size: "sm" })}
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
