// src/app/api/eduzz/delivery/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";

type EduzzEnvelope = {
  id?: string;
  event?: string;
  sentDate?: string;
  data?: any; // payload da Eduzz (varia por evento)
};

function safeJsonParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function timingSafeEqualHex(aHex: string, bHex: string) {
  const a = Buffer.from(aHex, "hex");
  const b = Buffer.from(bHex, "hex");
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function hmacSha256Hex(secret: string, payload: string) {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex");
}

function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function docIdFromEmail(email: string): string {
  // evita caracteres problemáticos
  return encodeURIComponent(email);
}

function pickFirstString(...vals: unknown[]): string {
  for (const v of vals) {
    const s = String(v ?? "").trim();
    if (s) return s;
  }
  return "";
}

function toNumber(v: unknown): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/**
 * GET só pra você abrir no browser e ver que está "vivo"
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

/**
 * POST: valida x-signature (HMAC SHA256 do corpo) com a secret do Developer Hub
 * Docs Eduzz: header x-signature = hmac('sha256', secret, rawBody)
 */
export async function POST(req: NextRequest) {
  const WEBHOOK_SECRET =
    process.env.EDUZZ_WEBHOOK_SECRET ||
    process.env.EDUZZ_ORIGIN_SECRET || // fallback se você ainda estiver usando esse nome
    "";

  if (!WEBHOOK_SECRET) {
    return NextResponse.json(
      { ok: false, error: "Missing EDUZZ_WEBHOOK_SECRET" },
      { status: 500 }
    );
  }

  // Precisamos do RAW BODY pra calcular a assinatura
  const rawBody = await req.text();

  const signature = (req.headers.get("x-signature") || "").trim();

  // Se veio sem assinatura, recusa (é exatamente o que a Eduzz quer que você faça)
  if (!signature) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        debug: {
          reason: "missing x-signature",
          receivedKeys: safeJsonParse<Record<string, unknown>>(rawBody)
            ? Object.keys(safeJsonParse<Record<string, unknown>>(rawBody)!)
            : [],
        },
      },
      { status: 401 }
    );
  }

  // Calcula assinatura esperada
  const expected = hmacSha256Hex(WEBHOOK_SECRET, rawBody);

  // Compara de forma segura
  const okSig = timingSafeEqualHex(expected, signature);
  if (!okSig) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unauthorized",
        debug: {
          reason: "invalid signature",
        },
      },
      { status: 401 }
    );
  }

  // Agora pode parsear o JSON com segurança
  const envelope = safeJsonParse<EduzzEnvelope>(rawBody) ?? {};
  const event = pickFirstString(envelope.event).toLowerCase();

  // --------- EXTRAI DADOS IMPORTANTES (varia por evento) ----------
  // (mantive bem tolerante, porque os formatos mudam conforme o evento)
  const data = envelope.data ?? {};

  const email = normalizeEmail(
    data?.buyer?.email ??
      data?.customer?.email ??
      data?.user?.email ??
      data?.email
  );

  // IDs úteis (se existirem)
  const invoiceId = pickFirstString(
    data?.invoice?.id,
    data?.invoiceId,
    data?.id
  );

  const productId = pickFirstString(
    data?.product?.id,
    data?.productId,
    data?.content?.id
  );

  const productTitle = pickFirstString(
    data?.product?.title,
    data?.productTitle,
    data?.content?.title
  );

  // status (quando houver)
  const invoiceStatus = pickFirstString(data?.invoice?.status, data?.status).toLowerCase();

  // --------- SALVA EVENTO (LOG) ----------
  const eventId =
    pickFirstString(envelope.id, invoiceId) || `${Date.now()}_${Math.random().toString(16).slice(2)}`;

  await adminDb.collection("eduzz_events").doc(eventId).set(
    {
      receivedAt: new Date(),
      event,
      email: email || null,
      invoiceId: invoiceId || null,
      invoiceStatus: invoiceStatus || null,
      productId: productId || null,
      productTitle: productTitle || null,
      raw: envelope,
    },
    { merge: true }
  );

  // Se não tem email, não tem como criar/ativar aluno
  if (!email) {
    return NextResponse.json(
      { ok: true, warning: "No email in payload (event logged only)" },
      { status: 200 }
    );
  }

  // --------- REGRA DE ATIVAÇÃO ----------
  // Para sua assinatura anual sem renovação automática:
  // - invoice_paid => ativa
  // - invoice_canceled => desativa
  // - invoice_opened => pendente (não ativa ainda)
  const isPaidEvent = event.endsWith("invoice_paid") || invoiceStatus === "paid";
  const isCanceledEvent = event.endsWith("invoice_canceled") || invoiceStatus === "canceled";
  const isOpenedEvent = event.endsWith("invoice_opened") || invoiceStatus === "opened";

  const entId = docIdFromEmail(email);
  const entRef = adminDb.collection("entitlements").doc(entId);

  if (isPaidEvent) {
    await entRef.set(
      {
        email,
        active: true,
        pending: false,
        source: "eduzz",
        productId: productId || null,
        productTitle: productTitle || null,
        invoiceId: invoiceId || null,
        invoiceStatus: invoiceStatus || "paid",
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } else if (isCanceledEvent) {
    await entRef.set(
      {
        email,
        active: false,
        pending: false,
        source: "eduzz",
        productId: productId || null,
        productTitle: productTitle || null,
        invoiceId: invoiceId || null,
        invoiceStatus: invoiceStatus || "canceled",
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } else if (isOpenedEvent) {
    await entRef.set(
      {
        email,
        active: false,
        pending: true,
        source: "eduzz",
        productId: productId || null,
        productTitle: productTitle || null,
        invoiceId: invoiceId || null,
        invoiceStatus: invoiceStatus || "opened",
        updatedAt: new Date(),
      },
      { merge: true }
    );
  } else {
    // outros eventos: só loga e marca pendente (safe default)
    await entRef.set(
      {
        email,
        active: false,
        pending: true,
        source: "eduzz",
        productId: productId || null,
        productTitle: productTitle || null,
        invoiceId: invoiceId || null,
        invoiceStatus: invoiceStatus || null,
        updatedAt: new Date(),
      },
      { merge: true }
    );
  }

  return NextResponse.json({ ok: true }, { status: 200 });
}