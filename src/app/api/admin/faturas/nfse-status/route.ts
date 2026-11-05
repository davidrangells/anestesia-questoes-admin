export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// A sincronizacao consulta o Bling nota a nota, respeitando 3 requisicoes por segundo.
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/adminRoute";
import { getNfseAlertSummary, syncOpenNfseStatuses } from "@/lib/nfseStatus";

/** Resumo das NFS-e ainda nao autorizadas (so leitura do banco). */
export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const summary = await getNfseAlertSummary();
    return NextResponse.json({ ok: true, summary }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar as NFS-e pendentes.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

/** Consulta no Bling a situacao das notas em aberto e devolve o resumo atualizado. */
export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const sync = await syncOpenNfseStatuses({ limit: 40 });
    const summary = await getNfseAlertSummary();
    return NextResponse.json({ ok: true, sync, summary }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao consultar as NFS-e no Bling.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
