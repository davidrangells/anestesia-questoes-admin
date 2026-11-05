"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/apiClient";
import { Button } from "@/components/ui/Button";
import { NfseStatusBadge } from "@/components/admin/NfseStatusBadge";

type AlertItem = {
  uid: string;
  aluno: string;
  invoiceNumber: string;
  total: number | null;
  createdAtSeconds: number;
  nfseStatus: string;
  overdue: boolean;
  error: string | null;
};

type AlertSummary = {
  abertas: number;
  atrasadas: number;
  naoVerificadas: number;
  lastCheckedAtSeconds: number;
  items: AlertItem[];
};

type SyncResult = { checked: number; autorizadas: number; erros: number; firstError: string | null };

function formatDay(seconds: number) {
  if (!seconds) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
    new Date(seconds * 1000)
  );
}

function formatMoney(value: number | null) {
  if (value == null) return "—";
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

/**
 * Aviso do dashboard para NFS-e criadas no Bling e ainda não autorizadas pela
 * prefeitura. Não aparece quando está tudo em dia.
 */
export function NfseAlertCard() {
  const [summary, setSummary] = useState<AlertSummary | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    api
      .get<{ summary?: AlertSummary }>("/api/admin/faturas/nfse-status")
      .then((data) => {
        if (active) setSummary(data.summary ?? null);
      })
      .catch(() => {
        // O aviso é complementar: falha aqui não deve atrapalhar o dashboard.
      });
    return () => {
      active = false;
    };
  }, []);

  const syncNow = async () => {
    setSyncing(true);
    setMessage(null);
    setErrorMsg(null);
    try {
      const data = await api.post<{ summary?: AlertSummary; sync?: SyncResult }>(
        "/api/admin/faturas/nfse-status",
        {}
      );
      setSummary(data.summary ?? null);
      const sync = data.sync;
      if (sync) {
        setMessage(
          sync.erros > 0
            ? `${sync.checked} nota(s) consultada(s), ${sync.erros} sem resposta do Bling${
                sync.firstError ? `: ${sync.firstError}` : "."
              }`
            : `${sync.checked} nota(s) consultada(s) no Bling, ${sync.autorizadas} autorizada(s).`
        );
      }
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Não foi possível consultar o Bling.");
    } finally {
      setSyncing(false);
    }
  };

  if (!summary || summary.abertas === 0) {
    // Depois de uma consulta manual que zerou as pendências, confirma o resultado.
    return message ? (
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
        Nenhuma NFS-e pendente. {message}
      </div>
    ) : null;
  }

  return (
    <div className="mt-4 rounded-2xl border border-amber-300 bg-amber-50 px-4 py-4 text-amber-900">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-base font-black">
            {summary.abertas === 1
              ? "1 NFS-e ainda não autorizada pela prefeitura"
              : `${summary.abertas} NFS-e ainda não autorizadas pela prefeitura`}
          </div>
          <div className="mt-1 text-sm">
            {summary.atrasadas > 0
              ? `${summary.atrasadas} criada(s) há mais de 24 horas. `
              : ""}
            {summary.naoVerificadas > 0
              ? `${summary.naoVerificadas} nunca consultada(s) no Bling. `
              : ""}
            Envie as notas no Bling e confira se houve rejeição.
          </div>
          <div className="mt-1 text-xs text-amber-800">
            Última consulta ao Bling: {formatDay(summary.lastCheckedAtSeconds)}
          </div>
        </div>
        <Button variant="secondary" size="sm" disabled={syncing} onClick={() => void syncNow()}>
          {syncing ? "Consultando..." : "Consultar Bling agora"}
        </Button>
      </div>

      {message ? <div className="mt-3 text-sm font-semibold">{message}</div> : null}
      {errorMsg ? <div className="mt-3 text-sm font-semibold text-rose-700">{errorMsg}</div> : null}

      <ul className="mt-3 divide-y divide-amber-200 rounded-xl border border-amber-200 bg-white text-sm text-slate-700">
        {summary.items.map((item) => (
          <li
            key={`${item.uid}-${item.invoiceNumber}`}
            className="flex flex-wrap items-center justify-between gap-2 px-3 py-2"
          >
            <div className="min-w-0">
              <span className="font-semibold text-slate-900">{item.aluno}</span>
              <span className="ml-2 text-slate-500">
                {formatDay(item.createdAtSeconds)} · {formatMoney(item.total)}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <NfseStatusBadge status={item.nfseStatus} />
              <Link
                href={`/admin/assinaturas/${item.uid}/fatura`}
                className="font-semibold text-blue-700 hover:underline"
              >
                Abrir fatura
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {summary.abertas > summary.items.length ? (
        <div className="mt-2 text-xs text-amber-800">
          Mostrando as {summary.items.length} mais antigas de {summary.abertas}.
        </div>
      ) : null}
    </div>
  );
}
