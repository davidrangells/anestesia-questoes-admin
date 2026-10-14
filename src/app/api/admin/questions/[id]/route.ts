export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Apos salvar/excluir, o snapshot do indice e reconstruido em segundo plano (after());
// o padrao de 10 s cortaria esse trabalho pela metade.
export const maxDuration = 60;

import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminRoute";
import { bumpQuestionsIndexVersion, refreshQuestionsSnapshot } from "@/lib/questionsIndex";

/** Documento completo (explicacao, alternativas, imagens) — a listagem nao o carrega mais. */
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID da questão é obrigatório." }, { status: 400 });
    }
    const snap = await adminDb.collection("questionsBank").doc(id).get();
    if (!snap.exists) {
      return NextResponse.json({ ok: false, error: "Questão não encontrada." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, item: { id: snap.id, ...snap.data() } }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar questão.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}


export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID da questão é obrigatório." }, { status: 400 });
    }

    const body = (await req.json()) as Record<string, unknown>;
    await adminDb.collection("questionsBank").doc(id).set(
      {
        ...body,
        updatedAt: new Date(),
      },
      { merge: true }
    );
    const saved = await adminDb.collection("questionsBank").doc(id).get();
    await bumpQuestionsIndexVersion({ id, data: (saved.data() as Record<string, unknown>) ?? null });
    after(() => refreshQuestionsSnapshot().catch(() => undefined));

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao salvar questão.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const { id } = await context.params;
    if (!id) {
      return NextResponse.json({ ok: false, error: "ID da questão é obrigatório." }, { status: 400 });
    }

    await adminDb.collection("questionsBank").doc(id).delete();
    await bumpQuestionsIndexVersion({ id, data: null });
    after(() => refreshQuestionsSnapshot().catch(() => undefined));
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir questão.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

