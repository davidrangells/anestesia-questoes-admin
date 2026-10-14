export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminRoute";

import {
  bumpQuestionsIndexVersion,
  getQuestionsIndex,
  parseAdvancedSearch,
  searchIndex,
  toListItem,
  toSafeString,
} from "@/lib/questionsIndex";

// A primeira carga do indice (apos deploy ou 10 min sem uso) le a colecao
// inteira; o padrao de 10 s da Vercel era justamente o que derrubava buscas.
export const maxDuration = 30;

function parsePositiveInt(value: string | null, fallback: number) {
  const parsed = Number.parseInt(value ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

const PAGE_SIZES = [10, 20, 25, 30, 50, 100];

export async function GET(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const sp = req.nextUrl.searchParams;
    const searchRaw = toSafeString(sp.get("search")).trim();
    const filters = parseAdvancedSearch(searchRaw);
    const hasSearch = Object.values(filters).some((tokens) => tokens.length > 0);
    const status = toSafeString(sp.get("status")).toLowerCase().trim();
    const theme = toSafeString(sp.get("theme")).trim();
    const page = parsePositiveInt(sp.get("page"), 1);
    const pageSizeRaw = parsePositiveInt(sp.get("pageSize"), 25);
    const pageSize = PAGE_SIZES.includes(pageSizeRaw) ? pageSizeRaw : 25;

    const t0 = Date.now();
    const index = await getQuestionsIndex();
    const filtered = searchIndex(index, { filters, hasSearch, status, theme });

    const totalFiltered = filtered.length;
    const totalPages = Math.max(Math.ceil(totalFiltered / pageSize), 1);
    const safePage = Math.min(page, totalPages);
    const start = (safePage - 1) * pageSize;
    const items = filtered.slice(start, start + pageSize).map(toListItem);

    return NextResponse.json(
      {
        ok: true,
        items,
        pagination: { page: safePage, pageSize, totalFiltered, totalPages },
        summary: index.summary,
        meta: { tookMs: Date.now() - t0, indexBuiltAt: index.builtAt },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao listar questões.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const now = new Date();

    const ref = await adminDb.collection("questionsBank").add({
      ...body,
      createdAt: now,
      updatedAt: now,
    });
    await bumpQuestionsIndexVersion();

    return NextResponse.json({ ok: true, id: ref.id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao criar questão.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
