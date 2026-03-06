"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { buttonStyles } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";

type AlunoListItem = {
  uid: string;
  code: string;
  createdAt: string;
  name: string;
  cpf: string;
  cellphone: string;
  email: string;
  active: boolean;
};

function StatusBadge({ active }: { active: boolean }) {
  return (
    <span
      className={
        active
          ? "inline-flex rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700"
          : "inline-flex rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700"
      }
    >
      {active ? "ativo" : "pendente"}
    </span>
  );
}

export default function AlunosPage() {
  const [items, setItems] = useState<AlunoListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch("/api/admin/alunos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        items?: AlunoListItem[];
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível carregar os alunos.");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Não foi possível carregar os alunos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const syncEduzz = async () => {
    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch("/api/admin/alunos/sync-eduzz", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          startDate: "2025-01-01T00:00:00.000Z",
          endDate: new Date().toISOString(),
        }),
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        scanned?: number;
        imported?: number;
        createdUsers?: number;
        updatedUsers?: number;
        skipped?: number;
        reasons?: {
          blockedStatus?: number;
          withoutPaidInvoice?: number;
          expired?: number;
          withoutDate?: number;
          usedSubscriptionDateFallback?: number;
        };
        addressCoverage?: {
          withAddress?: number;
          withoutAddress?: number;
          sampleWithoutAddressEmails?: string[];
        };
        debug?: {
          firstExpired?: {
            subscriptionId?: string | null;
            subscriptionStatus?: string | null;
            subscriptionCreatedAt?: string | null;
            subscriptionUpdatedAt?: string | null;
            subscriptionExplicitValidUntil?: string | null;
            latestPaidId?: string | null;
            latestPaidStatus?: string | null;
            latestPaidAt?: string | null;
            latestInvoiceCreatedAt?: string | null;
            latestInvoiceDueAt?: string | null;
            latestInvoiceAmountPaid?: number | null;
            computedBaseDate?: string | null;
            computedValidUntil?: string | null;
          } | null;
        };
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível sincronizar os alunos da Eduzz.");
      }

      const reasonParts = [
        (data.reasons?.blockedStatus ?? 0) > 0
          ? `${data.reasons?.blockedStatus ?? 0} bloqueado(s) por estorno/chargeback`
          : null,
        (data.reasons?.withoutPaidInvoice ?? 0) > 0
          ? `${data.reasons?.withoutPaidInvoice ?? 0} sem fatura paga reconhecida`
          : null,
        (data.reasons?.expired ?? 0) > 0
          ? `${data.reasons?.expired ?? 0} vencido(s)`
          : null,
        (data.reasons?.withoutDate ?? 0) > 0
          ? `${data.reasons?.withoutDate ?? 0} sem data base`
          : null,
        (data.reasons?.usedSubscriptionDateFallback ?? 0) > 0
          ? `${data.reasons?.usedSubscriptionDateFallback ?? 0} usando data da assinatura`
          : null,
      ]
        .filter(Boolean)
        .join(" | ");

      const firstExpired = data.debug?.firstExpired;
      const debugPart =
        firstExpired && (data.reasons?.expired ?? 0) > 0
          ? ` Exemplo vencido: assinatura ${firstExpired.subscriptionId ?? "—"} (status ${firstExpired.subscriptionStatus ?? "—"}), base ${firstExpired.computedBaseDate ?? "—"}, validade ${firstExpired.computedValidUntil ?? "—"}, última fatura ${firstExpired.latestPaidStatus ?? "—"} em ${firstExpired.latestPaidAt ?? firstExpired.latestInvoiceCreatedAt ?? firstExpired.latestInvoiceDueAt ?? "—"}.`
          : "";

      setSuccessMsg(
        `Sincronização concluída com sucesso. ${data.imported ?? 0} aluno(s) importado(s), ${data.createdUsers ?? 0} criado(s), ${data.updatedUsers ?? 0} atualizado(s), ${data.skipped ?? 0} ignorado(s).${reasonParts ? ` Motivos: ${reasonParts}.` : ""}${debugPart}${(data.addressCoverage?.withoutAddress ?? 0) > 0 ? ` Endereço: ${data.addressCoverage?.withAddress ?? 0} com endereço, ${data.addressCoverage?.withoutAddress ?? 0} sem endereço${(data.addressCoverage?.sampleWithoutAddressEmails?.length ?? 0) > 0 ? ` (ex.: ${(data.addressCoverage?.sampleWithoutAddressEmails ?? []).join(", ")})` : ""}.` : ""}`
      );
      await load();
    } catch (error) {
      setErrorMsg(
        error instanceof Error ? error.message : "Não foi possível sincronizar os alunos da Eduzz."
      );
    } finally {
      setSyncing(false);
    }
  };

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;

    return items.filter((item) =>
      [item.code, item.name, item.cpf, item.cellphone, item.email]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [items, search]);

  return (
    <AdminShell
      title="Alunos"
      subtitle="Listagem dos alunos sincronizados via Eduzz e dados complementares do portal."
      actions={
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[340px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar resultados..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="button"
            onClick={() => void syncEduzz()}
            disabled={syncing}
            className={buttonStyles({ variant: "secondary" })}
          >
            {syncing ? "Sincronizando..." : "Sincronizar Eduzz"}
          </button>

          <Link href="/admin/alunos/novo" className={buttonStyles({ variant: "primary" })}>
            Criar
          </Link>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
          <div className="text-2xl font-black text-slate-900">Alunos</div>
          <div className="mt-1 text-sm text-slate-500">
            {loading
              ? "Carregando..."
              : `${filtered.length} ${filtered.length === 1 ? "aluno encontrado" : "alunos encontrados"}`}
          </div>
          {errorMsg ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          ) : null}
          {successMsg ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMsg}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="border-b bg-slate-100/80 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Cód.</th>
                <th className="px-5 py-4 text-left">Criado em</th>
                <th className="px-5 py-4 text-left">Nome</th>
                <th className="px-5 py-4 text-left">CPF</th>
                <th className="px-5 py-4 text-left">Celular</th>
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-sm text-slate-500">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              ) : null}

              {filtered.map((item) => (
                <tr key={item.uid} className="hover:bg-slate-50/70">
                  <td className="px-5 py-5 text-lg font-semibold text-slate-600">{item.code}</td>
                  <td className="px-5 py-5 text-slate-500">{item.createdAt}</td>
                  <td className="px-5 py-5">
                    <div className="font-semibold text-slate-800">{item.name}</div>
                    <div className="mt-1 text-xs text-slate-500">{item.email}</div>
                  </td>
                  <td className="px-5 py-5 text-slate-600">{item.cpf}</td>
                  <td className="px-5 py-5 text-slate-600">{item.cellphone}</td>
                  <td className="px-5 py-5">
                    <StatusBadge active={item.active} />
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/alunos/${item.uid}`}
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
