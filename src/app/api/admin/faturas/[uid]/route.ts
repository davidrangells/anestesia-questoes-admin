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

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function nextEntitlementFlags(status: string) {
  const normalized = status.toLowerCase();
  if (normalized === "ativo") {
    return { active: true, pending: false };
  }
  if (normalized === "pendente") {
    return { active: false, pending: true };
  }
  return { active: false, pending: false };
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const { uid } = await context.params;

  try {
    const [userSnap, profileSnap, entitlementSnap, billingSnap] = await Promise.all([
      adminDb.collection("users").doc(uid).get(),
      adminDb.collection("users").doc(uid).collection("profile").doc("main").get(),
      adminDb.collection("entitlements").doc(uid).get(),
      adminDb.collection("billing_records").doc(uid).get(),
    ]);

    if (!userSnap.exists) {
      return NextResponse.json({ ok: false, error: "Aluno não encontrado." }, { status: 404 });
    }

    const billing = billingSnap.exists ? billingSnap.data() ?? {} : {};

    return NextResponse.json(
      {
        ok: true,
        aluno: {
          uid,
          user: userSnap.data() ?? {},
          profile: profileSnap.exists ? profileSnap.data() ?? {} : {},
          entitlement: entitlementSnap.exists ? entitlementSnap.data() ?? {} : {},
        },
        billing: {
          invoices: ensureArray(billing.invoices),
          movements: ensureArray(billing.movements),
          updatedAt: billing.updatedAt ?? null,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar fatura.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ uid: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const { uid } = await context.params;

  try {
    const body = (await req.json()) as Record<string, unknown>;
    const mode = pickString(body.mode);
    const comment = pickString(body.comment);
    const status = pickString(body.status);

    const entRef = adminDb.collection("entitlements").doc(uid);
    const billingRef = adminDb.collection("billing_records").doc(uid);

    const [entSnap, billingSnap] = await Promise.all([entRef.get(), billingRef.get()]);
    const entitlement = entSnap.exists ? entSnap.data() ?? {} : {};
    const billing = billingSnap.exists ? billingSnap.data() ?? {} : {};
    const invoices = ensureArray<Record<string, unknown>>(billing.invoices);
    const movements = ensureArray<Record<string, unknown>>(billing.movements);
    const now = new Date();

    if (mode === "generate_invoice") {
      const invoiceNumber = `NFSe-${String(invoices.length + 1).padStart(3, "0")}`;
      const invoice = {
        id: `nf_${Date.now().toString(36)}`,
        createdAt: now,
        service: pickString(entitlement.productTitle) || "Assinatura",
        invoiceNumber,
        total: pickNumber(entitlement.amountPaid),
        status: "emitida",
      };

      await billingRef.set(
        {
          uid,
          invoices: [...invoices, invoice],
          movements: [
            ...movements,
            {
              id: `mv_${Date.now().toString(36)}`,
              createdAt: now,
              status: "nota_fiscal_emitida",
              comment: comment || `Nota fiscal ${invoiceNumber} gerada manualmente.`,
            },
          ],
          updatedAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    if (mode === "change_status") {
      if (!status) {
        return NextResponse.json({ ok: false, error: "Status é obrigatório." }, { status: 400 });
      }

      const flags = nextEntitlementFlags(status);

      await Promise.all([
        entRef.set(
          {
            invoiceStatus: status,
            active: flags.active,
            pending: flags.pending,
            updatedAt: now,
          },
          { merge: true }
        ),
        billingRef.set(
          {
            uid,
            movements: [
              ...movements,
              {
                id: `mv_${Date.now().toString(36)}`,
                createdAt: now,
                status,
                comment: comment || "Status alterado manualmente no painel.",
              },
            ],
            updatedAt: now,
          },
          { merge: true }
        ),
      ]);

      return NextResponse.json({ ok: true }, { status: 200 });
    }

    return NextResponse.json({ ok: false, error: "Operação inválida." }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao atualizar fatura.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
