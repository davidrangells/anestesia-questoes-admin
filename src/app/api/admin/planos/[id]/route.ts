export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

async function requireAdmin(req: NextRequest) {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";

  if (!token) {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }

  try {
    const decoded = await adminAuth.verifyIdToken(token);
    const userSnap = await adminDb.collection("users").doc(decoded.uid).get();
    const role = userSnap.exists ? userSnap.data()?.role : null;

    if (role !== "admin") {
      return { error: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }) };
    }

    return { adminUid: decoded.uid };
  } catch {
    return { error: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }) };
  }
}

function pickString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function sanitizeBody(body: unknown) {
  const payload = (body ?? {}) as Record<string, unknown>;
  return {
    code: pickString(payload.code),
    title: pickString(payload.title),
    productId: pickString(payload.productId),
    status: pickString(payload.status) === "inativo" ? "inativo" : "ativo",
    price: pickNumber(payload.price),
  };
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const { id } = await context.params;

  try {
    const payload = sanitizeBody(await req.json());
    await adminDb.collection("catalog_planos").doc(id).set(
      {
        code: payload.code,
        title: payload.title,
        productId: payload.productId || null,
        status: payload.status,
        price: payload.price,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar plano.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const { id } = await context.params;

  try {
    await adminDb.collection("catalog_planos").doc(id).delete();
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir plano.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
