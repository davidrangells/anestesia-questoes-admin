export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Limpeza + keep-alive do Bling + reconstrucao do indice de questoes: passa de 10 s.
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { runSimuladoRetentionCleanup } from "@/lib/simuladoRetention";
import { keepBlingTokenAlive } from "@/lib/bling";
import { refreshQuestionsSnapshot } from "@/lib/questionsIndex";

function pickBearerToken(req: NextRequest) {
  const auth = req.headers.get("authorization") || "";
  if (!auth.toLowerCase().startsWith("bearer ")) return "";
  return auth.slice(7).trim();
}

function pickMaintenanceToken(req: NextRequest) {
  return (
    req.headers.get("x-maintenance-key")?.trim() ||
    req.headers.get("x-cleanup-key")?.trim() ||
    pickBearerToken(req) ||
    ""
  );
}

function isAuthorized(req: NextRequest) {
  const received = pickMaintenanceToken(req);
  if (!received) return false;

  const allowedTokens = [
    process.env.SIMULADOS_CLEANUP_SECRET,
    process.env.CRON_SECRET,
  ]
    .map((value) => String(value || "").trim())
    .filter(Boolean);

  if (!allowedTokens.length) return false;
  return allowedTokens.includes(received);
}

function parseNumber(value: string | null, fallback: number) {
  const n = Number(value ?? "");
  return Number.isFinite(n) ? n : fallback;
}

async function handle(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const graceDays = parseNumber(searchParams.get("graceDays"), 30);
  const maxUsers = parseNumber(searchParams.get("maxUsers"), 0);
  const dryRun = searchParams.get("dryRun") !== "0";

  try {
    const summary = await runSimuladoRetentionCleanup({
      graceDays,
      dryRun,
      maxUsers: maxUsers > 0 ? maxUsers : undefined,
    });

    // Aproveita o cron diario para renovar o token do Bling (best-effort):
    // o refresh token vence apos 30 dias sem uso. Nao roda em dryRun.
    const bling = dryRun ? { ok: true, skipped: "dryRun" } : await keepBlingTokenAlive();

    // Reconstroi o indice de busca das questoes e o snapshot persistido, para
    // a primeira busca do dia ja encontrar tudo pronto — inclusive questoes
    // importadas por script, que nao passam pela API.
    const questionsIndex = dryRun
      ? { ok: true, skipped: "dryRun" }
      : await refreshQuestionsSnapshot({ bump: true })
          .then((r) => ({ ok: true, ...r }))
          .catch((e: unknown) => ({ ok: false, error: e instanceof Error ? e.message : "falha" }));

    return NextResponse.json({ ok: true, summary, bling, questionsIndex }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro na limpeza de simulados.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  return handle(req);
}

export async function POST(req: NextRequest) {
  return handle(req);
}
