"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, doc, getDoc, getDocs, orderBy, query, where } from "firebase/firestore";
import AdminShell from "@/components/AdminShell";
import { Button, buttonStyles } from "@/components/ui/Button";
import { auth, db } from "@/lib/firebase";

type AssinaturaItem = {
  uid: string;
  aluno: string;
  email: string;
  origem: string;
  plano: string;
  planoOrigem: "catalogo" | "eduzz" | "manual" | "sem-plano";
  status: "ativo" | "pendente" | "inativo";
  validade: string;
  planId: string;
  productId: string;
  productTitle: string;
  invoiceStatus: string;
  amountPaid: number | null;
  validUntilRaw: string;
};

function formatDate(value: unknown) {
  const seconds =
    typeof value === "object" && value !== null && "seconds" in value
      ? Number((value as { seconds?: number }).seconds ?? 0)
      : 0;

  if (!seconds) return "—";
  return new Intl.DateTimeFormat("pt-BR").format(new Date(seconds * 1000));
}

function toDateInput(value: unknown) {
  const seconds =
    typeof value === "object" && value !== null && "seconds" in value
      ? Number((value as { seconds?: number }).seconds ?? 0)
      : 0;

  if (!seconds) return "";
  return new Date(seconds * 1000).toISOString().slice(0, 10);
}

function StatusBadge({ status }: { status: AssinaturaItem["status"] }) {
  const cls =
    status === "ativo"
      ? "bg-emerald-100 text-emerald-700"
      : status === "pendente"
      ? "bg-amber-100 text-amber-700"
      : "bg-slate-100 text-slate-600";

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${cls}`}>
      {status}
    </span>
  );
}

function PlanoBadge({ origem }: { origem: AssinaturaItem["planoOrigem"] }) {
  const config = {
    catalogo: { label: "Catálogo", className: "bg-blue-100 text-blue-700" },
    eduzz: { label: "Eduzz", className: "bg-violet-100 text-violet-700" },
    manual: { label: "Manual", className: "bg-slate-100 text-slate-700" },
    "sem-plano": { label: "Sem plano", className: "bg-slate-100 text-slate-500" },
  } as const;

  const item = config[origem];

  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${item.className}`}
    >
      {item.label}
    </span>
  );
}

export default function AssinaturasPage() {
  const [items, setItems] = useState<AssinaturaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);
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
            const planId = String(ent?.planId ?? "").trim();
            const productId = String(ent?.productId ?? "").trim();
            const productTitle = String(ent?.productTitle ?? "").trim();
            const origem = String(ent?.source ?? "admin").trim() || "admin";
            const planoOrigem = planId
              ? "catalogo"
              : productTitle || productId
                ? origem === "eduzz"
                  ? "eduzz"
                  : "manual"
                : "sem-plano";

            return {
              uid: userDoc.id,
              aluno:
                String(profile?.name ?? "").trim() ||
                String(userData.name ?? "").trim() ||
                "Aluno sem nome",
              email: String(userData.email ?? ent?.email ?? "").trim() || "—",
              origem,
              plano: productTitle || "Sem plano",
              planoOrigem,
              status,
              validade: formatDate(ent?.validUntil ?? null),
              planId,
              productId,
              productTitle,
              invoiceStatus: String(ent?.invoiceStatus ?? "").trim(),
              amountPaid:
                typeof ent?.amountPaid === "number" && Number.isFinite(ent.amountPaid)
                  ? ent.amountPaid
                  : null,
              validUntilRaw: toDateInput(ent?.validUntil ?? null),
            } satisfies AssinaturaItem;
          })
        );

        if (active) setItems(rows);
      } catch (error) {
        if (active) {
          setErrorMsg(
            error instanceof Error ? error.message : "Não foi possível carregar as assinaturas."
          );
        }
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
      [item.aluno, item.email, item.origem, item.plano, item.status, item.planoOrigem]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [items, search]);

  const quickUpdateStatus = async (item: AssinaturaItem, nextStatus: "ativo" | "pendente") => {
    setUpdatingUid(item.uid);
    setErrorMsg(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch(`/api/admin/assinaturas/${item.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: item.email === "—" ? "" : item.email,
          active: nextStatus === "ativo",
          pending: nextStatus === "pendente",
          planId: item.planId,
          productId: item.productId,
          productTitle: item.productTitle,
          invoiceStatus: item.invoiceStatus,
          amountPaid: item.amountPaid,
          validUntil: item.validUntilRaw,
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível atualizar a assinatura.");
      }

      setItems((prev) =>
        prev.map((current) =>
          current.uid === item.uid
            ? {
                ...current,
                status: nextStatus,
              }
            : current
        )
      );
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao atualizar a assinatura.");
    } finally {
      setUpdatingUid(null);
    }
  };

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
          {errorMsg ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full text-sm">
            <thead className="border-b bg-slate-100/80 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Aluno</th>
                <th className="px-5 py-4 text-left">Origem</th>
                <th className="px-5 py-4 text-left">Plano</th>
                <th className="px-5 py-4 text-left">Validade</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-left">Ação rápida</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
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
                  <td className="px-5 py-5 text-slate-600">
                    <div className="font-semibold text-slate-700">{item.plano}</div>
                    <div className="mt-2">
                      <PlanoBadge origem={item.planoOrigem} />
                    </div>
                  </td>
                  <td className="px-5 py-5 text-slate-600">{item.validade}</td>
                  <td className="px-5 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant={item.status === "ativo" ? "primary" : "secondary"}
                        disabled={updatingUid === item.uid}
                        onClick={() => quickUpdateStatus(item, "ativo")}
                      >
                        Ativar
                      </Button>
                      <Button
                        size="sm"
                        variant={item.status === "pendente" ? "primary" : "secondary"}
                        disabled={updatingUid === item.uid}
                        onClick={() => quickUpdateStatus(item, "pendente")}
                      >
                        Pendente
                      </Button>
                    </div>
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
