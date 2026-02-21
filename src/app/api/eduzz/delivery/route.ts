export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type AnyObj = Record<string, unknown>;

function encodeEmail(email: string) {
  return encodeURIComponent(email.trim().toLowerCase());
}

function pickFirstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickFirstNumber(...vals: unknown[]): number | null {
  for (const v of vals) {
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

async function readBody(req: NextRequest): Promise<AnyObj> {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const json = (await req.json()) as AnyObj;
    return json ?? {};
  }

  // fallback: form-data / x-www-form-urlencoded
  const fd = await req.formData();
  const obj: AnyObj = {};
  fd.forEach((val, key) => {
    obj[key] = typeof val === "string" ? val : "";
  });
  return obj;
}

/**
 * Eduzz (Developer Hub) costuma mandar:
 * { id, event, data, sentDate }
 * e "data" contém invoice, customer, etc.
 */
export async function POST(req: NextRequest) {
  try {
    const WEBHOOK_SECRET = process.env.EDUZZ_WEBHOOK_SECRET || "";
    const ORIGIN_SECRET = process.env.EDUZZ_ORIGIN_SECRET || ""; // opcional, se você quiser validar os 2
    if (!WEBHOOK_SECRET) {
      return NextResponse.json({ ok: false, error: "Missing EDUZZ_WEBHOOK_SECRET" }, { status: 500 });
    }

    const payload = await readBody(req);

    // ✅ Validação: Eduzz envia um secret (depende do modo).
    // Pelo seu debug anterior, no teste vinha só { id, event, data, sentDate }.
    // Então validamos pelo HEADER ou campo secret (suporta os dois jeitos).
    const headerSecret =
      req.headers.get("x-webhook-secret") ||
      req.headers.get("x-eduzz-secret") ||
      req.headers.get("x-hook-secret") ||
      "";

    const bodySecret = pickFirstString(
      (payload as AnyObj)["secret"],
      (payload as AnyObj)["webhookSecret"],
      (payload as AnyObj)["edz_cli_origin_secret"] // legado
    );

    const secretOk = (headerSecret && headerSecret === WEBHOOK_SECRET) || (bodySecret && bodySecret === WEBHOOK_SECRET);

    if (!secretOk) {
      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          debug: {
            receivedKeys: Object.keys(payload),
            headerSecretPresent: Boolean(headerSecret),
            bodySecretPresent: Boolean(bodySecret),
          },
        },
        { status: 401 }
      );
    }

    const event = pickFirstString(payload["event"]);
    const sentDate = pickFirstString(payload["sentDate"]);
    const pId = pickFirstString(payload["id"]);

    const data = (payload["data"] ?? {}) as AnyObj;

    // tenta pegar email em vários lugares comuns
    const customer = (data["customer"] ?? {}) as AnyObj;
    const customerEmail = pickFirstString(customer["email"], data["email"]);

    const email = customerEmail.trim().toLowerCase();
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email", debug: { event } }, { status: 400 });
    }

    // invoice
    const invoice = (data["invoice"] ?? {}) as AnyObj;
    const invoiceId = pickFirstString(invoice["id"], data["invoiceId"]);
    const invoiceStatus = pickFirstString(invoice["status"], data["invoiceStatus"]); // opened | paid | canceled

    // produto/offer
    const product = (data["product"] ?? {}) as AnyObj;
    const productId = pickFirstString(product["id"], data["productId"]);
    const productTitle = pickFirstString(product["title"], product["name"], data["productTitle"]);

    // ✅ Resolve UID (cria no Auth se não existir)
    let uid = "";
    try {
      const existing = await adminAuth.getUserByEmail(email);
      uid = existing.uid;
    } catch (e: any) {
      if (e?.code === "auth/user-not-found") {
        const created = await adminAuth.createUser({
          email,
          emailVerified: false,
          disabled: false,
        });
        uid = created.uid;

        // ✅ opcional: manda link para definir senha (mais tarde fazemos com Resend)
        // const link = await adminAuth.generatePasswordResetLink(email);
      } else {
        throw e;
      }
    }

    // ✅ Define active/pending com base no evento/status
    // Seu caso: usar eventos myeduzz.invoice_opened / myeduzz.invoice_paid / myeduzz.invoice_canceled
    const ev = event.toLowerCase();

    const isPaid =
      ev.includes("invoice_paid") || invoiceStatus.toLowerCase() === "paid";

    const isCanceled =
      ev.includes("invoice_canceled") || invoiceStatus.toLowerCase() === "canceled";

    const isOpened =
      ev.includes("invoice_opened") || invoiceStatus.toLowerCase() === "opened";

    const active = isPaid && !isCanceled;
    const pending = isOpened && !isPaid && !isCanceled;

    // ✅ escreve no Firestore
    const now = FieldValue.serverTimestamp();

    // log do evento (dedupe por id/invoice)
    const eventId = pickFirstString(pId, invoiceId) || `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await adminDb
      .collection("eduzz_events")
      .doc(eventId)
      .set(
        {
          receivedAt: now,
          sentDate: sentDate || null,
          event: event || null,
          email,
          uid,
          invoiceId: invoiceId || null,
          invoiceStatus: invoiceStatus || null,
          productId: productId || null,
          productTitle: productTitle || null,
          raw: payload,
        },
        { merge: true }
      );

    // users/{uid}
    await adminDb
      .collection("users")
      .doc(uid)
      .set(
        {
          uid,
          email,
          role: "student",
          updatedAt: now,
          createdAt: now, // merge evita sobrescrever se já existir
        },
        { merge: true }
      );

    // entitlements_email_index/{emailEncoded}
    await adminDb
      .collection("entitlements_email_index")
      .doc(encodeEmail(email))
      .set(
        {
          uid,
          email,
          updatedAt: now,
        },
        { merge: true }
      );

    // entitlements/{uid}
    await adminDb
      .collection("entitlements")
      .doc(uid)
      .set(
        {
          uid,
          email,
          active,
          pending,
          source: "eduzz",
          productId: productId || null,
          productTitle: productTitle || null,
          invoiceId: invoiceId || null,
          invoiceStatus: invoiceStatus || null,
          updatedAt: now,
        },
        { merge: true }
      );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Internal error", message: e?.message || "unknown" },
      { status: 500 }
    );
  }
}

// Opcional (GET) só pra teste de URL na Eduzz
export async function GET() {
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}