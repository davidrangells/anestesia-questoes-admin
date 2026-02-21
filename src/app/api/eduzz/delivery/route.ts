// src/app/api/eduzz/delivery/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type AnyRecord = Record<string, unknown>;

function pickFirstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
    if (typeof v === "number" && Number.isFinite(v)) return String(v);
  }
  return "";
}

function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function docIdFromEmail(email: string): string {
  // Firestore docId safe
  return encodeURIComponent(email);
}

function safeJsonParse(str: string): unknown | null {
  try {
    return JSON.parse(str);
  } catch {
    return null;
  }
}

function parseQueryString(str: string): AnyRecord {
  // suporte básico para "a=1&b=2"
  const out: AnyRecord = {};
  const s = str.startsWith("?") ? str.slice(1) : str;
  for (const part of s.split("&")) {
    if (!part) continue;
    const [k, v = ""] = part.split("=");
    const key = decodeURIComponent(k || "").trim();
    if (!key) continue;
    out[key] = decodeURIComponent(v || "");
  }
  return out;
}

async function readBody(req: NextRequest): Promise<AnyRecord> {
  const ct = req.headers.get("content-type") || "";

  // JSON
  if (ct.includes("application/json")) {
    const json = (await req.json()) as AnyRecord;
    return json ?? {};
  }

  // form-data / x-www-form-urlencoded
  const fd = await req.formData();
  const obj: AnyRecord = {};
  fd.forEach((val, key) => {
    obj[key] = typeof val === "string" ? val : "";
  });
  return obj;
}

function extractFields(payload: AnyRecord): AnyRecord {
  /**
   * A Eduzz (Developer Hub) pode enviar:
   * - { message: "..." }
   * - { message: {...} }
   * - ou direto os campos (edz_*)
   */
  const message = payload["message"];

  // 1) message como objeto
  if (message && typeof message === "object" && !Array.isArray(message)) {
    return message as AnyRecord;
  }

  // 2) message como string -> pode ser JSON string OU querystring
  if (typeof message === "string" && message.trim()) {
    const msg = message.trim();

    const asJson = safeJsonParse(msg);
    if (asJson && typeof asJson === "object" && !Array.isArray(asJson)) {
      return asJson as AnyRecord;
    }

    // fallback querystring
    const asQs = parseQueryString(msg);
    if (Object.keys(asQs).length) return asQs;
  }

  // 3) sem message: usa payload inteiro
  return payload;
}

function getExpectedSecret(): string {
  // aceita qualquer um desses nomes no ENV
  return (
    process.env.EDUZZ_ORIGIN_SECRET ||
    process.env.EDUZZ_WEBHOOK_SECRET ||
    process.env.EDUZZ_SECRET ||
    ""
  ).trim();
}

function getIncomingSecret(req: NextRequest, fields: AnyRecord): string {
  // tenta pegar secret em vários lugares
  return pickFirstString(
    fields["edz_cli_origin_secret"],
    fields["origin_secret"],
    fields["secret"],
    req.headers.get("x-eduzz-secret"),
    req.headers.get("x-webhook-secret"),
    req.headers.get("x-signature")
  );
}

export async function GET() {
  // Para "Verificar URL" e healthcheck
  return NextResponse.json(
    { ok: true, service: "eduzz-delivery" },
    { status: 200 }
  );
}

export async function POST(req: NextRequest) {
  try {
    const expectedSecret = getExpectedSecret();
    const payload = await readBody(req);
    const fields = extractFields(payload);

    const incomingSecret = getIncomingSecret(req, fields);

    // ✅ Se não veio secret no TESTE da Eduzz:
    // retorna 200 pra ela aceitar a URL, mas não processa nada.
    if (!incomingSecret || !expectedSecret) {
      return NextResponse.json(
        {
          ok: true,
          ignored: true,
          reason: !expectedSecret
            ? "Missing server secret env (EDUZZ_ORIGIN_SECRET)"
            : "Missing secret in request (test/verify payload)",
          debug: {
            receivedKeys: Object.keys(payload),
            fieldKeys: Object.keys(fields),
          },
        },
        { status: 200 }
      );
    }

    // ✅ valida secret
    if (incomingSecret !== expectedSecret) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          debug: {
            receivedKeys: Object.keys(payload),
            fieldKeys: Object.keys(fields),
          },
        },
        { status: 401 }
      );
    }

    // ---------------------------
    // A PARTIR DAQUI: autorizado
    // ---------------------------

    const email = normalizeEmail(
      fields["edz_cli_email"] ??
        fields["email"] ??
        fields["customer_email"] ??
        fields["buyer_email"]
    );

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing email" },
        { status: 400 }
      );
    }

    // Tipo do evento (depende do que a Eduzz mandar)
    const eventName = pickFirstString(
      fields["event"],
      fields["type"],
      fields["name"]
    ).toLowerCase();

    // Seus eventos selecionados: myeduzz.invoice_opened / paid / canceled
    // Vamos mapear pra estados:
    const invoiceStatus = eventName.includes("paid")
      ? "paid"
      : eventName.includes("canceled") || eventName.includes("cancelled")
      ? "canceled"
      : eventName.includes("opened")
      ? "opened"
      : pickFirstString(fields["edz_fat_status"], fields["invoice_status"]);

    // IDs úteis
    const invoiceId = pickFirstString(
      fields["invoice_id"],
      fields["edz_fat_cod"],
      fields["fatCod"]
    );

    const productId = pickFirstString(
      fields["product_id"],
      fields["edz_cnt_cod"],
      fields["cntCod"]
    );

    const productTitle = pickFirstString(
      fields["product_title"],
      fields["edz_cnt_titulo"],
      fields["cntTitulo"]
    );

    // Firestore
    const db = adminDb;

    // Dedupe do evento
    const eventId =
      pickFirstString(fields["id"], invoiceId) ||
      `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await db.collection("eduzz_events").doc(eventId).set(
      {
        receivedAt: new Date(),
        eventName,
        email,
        invoiceId,
        invoiceStatus,
        productId,
        productTitle,
        raw: { payload, fields },
      },
      { merge: true }
    );

    const entId = docIdFromEmail(email);
    const entRef = db.collection("entitlements").doc(entId);

    // Regras de ativação:
    // - paid => active true
    // - canceled => active false
    // - opened => pending true (boleto aberto etc)
    const shouldActivate = invoiceStatus === "paid";
    const shouldDeactivate = invoiceStatus === "canceled";
    const pending = !shouldActivate && !shouldDeactivate;

    await entRef.set(
      {
        email,
        active: shouldActivate ? true : false,
        pending,
        source: "eduzz",
        productId: productId || null,
        productTitle: productTitle || null,
        invoiceId: invoiceId || null,
        invoiceStatus: invoiceStatus || null,
        updatedAt: new Date(),
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}