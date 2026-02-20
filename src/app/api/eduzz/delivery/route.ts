// src/app/api/eduzz/delivery/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type LegacyFormPayload = {
  type?: string; // "create" | "remove" (pode vir em alguns cenários legados)
  fields?: Record<string, unknown>;
};

type DeveloperHubPayload = {
  id?: string;
  event?: string; // ex: "myeduzz.invoice_paid", etc
  data?: {
    producer?: {
      originSecret?: string; // token segurança do webhook (Developer Hub)
      id?: string;
      email?: string;
      name?: string;
    };
    buyer?: {
      id?: string;
      email?: string;
      name?: string;
      document?: string;
      phone?: string | null;
    };
    invoice?: {
      id?: string;
      status?: string;
      total?: number;
    };
    offer?: {
      id?: string;
      title?: string;
    };
    // outros campos podem existir
    [k: string]: unknown;
  };
  // outros campos podem existir
  [k: string]: unknown;
};

function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function docIdFromEmail(email: string): string {
  return encodeURIComponent(email);
}

function pickFirstString(...vals: unknown[]): string {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

async function readBody(req: NextRequest): Promise<LegacyFormPayload | DeveloperHubPayload> {
  const ct = (req.headers.get("content-type") || "").toLowerCase();

  if (ct.includes("application/json")) {
    const json = (await req.json()) as unknown;
    return (json ?? {}) as DeveloperHubPayload;
  }

  // fallback: form-data (legado)
  const fd = await req.formData();
  const fields: Record<string, unknown> = {};
  fd.forEach((val, key) => {
    fields[key] = typeof val === "string" ? val : "";
  });

  return { type: String(fields["type"] ?? ""), fields };
}

export async function GET() {
  // healthcheck simples
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const ORIGIN_SECRET = process.env.EDUZZ_ORIGIN_SECRET || "";
    if (!ORIGIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Missing EDUZZ_ORIGIN_SECRET" }, { status: 500 });
    }

    const payload = await readBody(req);

    // 1) Captura originSecret no formato novo (Developer Hub)
    const p = payload as DeveloperHubPayload;
    const originSecretNew = pickFirstString(
      (p as any)?.secret,
      (p as any)?.originSecret,
      p?.data?.producer?.originSecret
    );

    // 2) Captura originSecret no formato legado (form-data)
    const legacy = payload as LegacyFormPayload;
    const fields = legacy.fields ?? {};
    const originSecretLegacy = pickFirstString(fields["edz_cli_origin_secret"]);

    const originSecret = originSecretNew || originSecretLegacy;

    if (originSecret !== ORIGIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // ===== Extrair email =====
    // Novo: buyer.email
    const emailNew = normalizeEmail(p?.data?.buyer?.email);

    // Legado: edz_cli_email
    const emailLegacy = normalizeEmail(fields["edz_cli_email"]);

    const email = emailNew || emailLegacy;

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    // ===== Identificar tipo de evento =====
    // Legado: type "create/remove"
    const legacyType = pickFirstString(legacy.type).toLowerCase();

    // Novo: event string
    const eventName = pickFirstString(p?.event).toLowerCase();

    // Regras simples (você pode refinar depois):
    // - "create" quando pago (invoice_paid / invoice_approved etc)
    // - "remove" quando cancelado/estornado
    const isPaidEvent =
      eventName.includes("paid") ||
      eventName.includes("approved") ||
      eventName.includes("invoice_paid") ||
      eventName.includes("invoice_approved");

    const isRemoveEvent =
      eventName.includes("canceled") ||
      eventName.includes("cancelled") ||
      eventName.includes("refund") ||
      eventName.includes("chargeback") ||
      eventName.includes("charge_back") ||
      eventName.includes("revoked");

    const type = legacyType || (isRemoveEvent ? "remove" : isPaidEvent ? "create" : "pending");

    // ===== Dados extras (opcional) =====
    const buyerName = pickFirstString(p?.data?.buyer?.name, fields["edz_cli_nome"]);
    const productTitle = pickFirstString(p?.data?.offer?.title, fields["edz_cnt_titulo"]);
    const productId = pickFirstString(p?.data?.offer?.id, fields["edz_cnt_cod"]);

    // fatura/contrato legados (se existirem)
    const fatCod = pickFirstString(fields["edz_fat_cod"]);
    const fatStatus = Number(fields["edz_fat_status"] ?? 0); // legado: 3 = paga

    // Novo: invoice.id/status (se vier)
    const invoiceId = pickFirstString(p?.data?.invoice?.id);
    const invoiceStatus = pickFirstString(p?.data?.invoice?.status);

    const db = adminDb;

    // Dedupe do evento
    const eventId = pickFirstString(p?.id, invoiceId, fatCod) || `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await db.collection("eduzz_events").doc(eventId).set(
      {
        receivedAt: new Date(),
        type,
        event: eventName || legacyType || null,
        email,
        buyerName: buyerName || null,
        productId: productId || null,
        productTitle: productTitle || null,
        fatCod: fatCod || null,
        fatStatus: Number.isFinite(fatStatus) ? fatStatus : null,
        invoiceId: invoiceId || null,
        invoiceStatus: invoiceStatus || null,
        raw: payload,
      },
      { merge: true }
    );

    // Entitlement por email
    const entId = docIdFromEmail(email);
    const entRef = db.collection("entitlements").doc(entId);

    // Ativação:
    // - Novo: se evento pago => ativa
    // - Legado: create + fatStatus==3 => ativa
    const shouldActivate = (type === "create" && isPaidEvent) || (legacyType === "create" && fatStatus === 3);
    const shouldDeactivate = type === "remove";

    if (shouldActivate) {
      await entRef.set(
        {
          email,
          active: true,
          pending: false,
          source: "eduzz",
          buyerName: buyerName || null,
          productId: productId || null,
          productTitle: productTitle || null,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } else if (shouldDeactivate) {
      await entRef.set(
        {
          email,
          active: false,
          pending: false,
          source: "eduzz",
          buyerName: buyerName || null,
          productId: productId || null,
          productTitle: productTitle || null,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } else {
      // evento não conclusivo (ex: agendado/pendente)
      await entRef.set(
        {
          email,
          active: false,
          pending: true,
          source: "eduzz",
          buyerName: buyerName || null,
          productId: productId || null,
          productTitle: productTitle || null,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}