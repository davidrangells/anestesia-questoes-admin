// src/app/api/eduzz/delivery/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { adminDb } from "@/lib/firebaseAdmin";

type EduzzWebhookEnvelope = {
  id?: string;
  event?: string; // "ping", ...
  data?: unknown;
  sentDate?: string;
};

function timingSafeEqual(a: string, b: string) {
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function computeSignature(secret: string, rawBody: string) {
  // Eduzz: hmac('sha256', chave_secreta, corpo_da_requisição) => header x-signature
  return crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
}

export async function GET() {
  // Só pra você testar no browser
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const SECRET = process.env.EDUZZ_WEBHOOK_SECRET || "";
    if (!SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing EDUZZ_WEBHOOK_SECRET" },
        { status: 500 }
      );
    }

    // Precisamos do corpo "cru" pra validar o HMAC
    const rawBody = await req.text();

    const signatureHeader = req.headers.get("x-signature") || "";
    if (!signatureHeader) {
      return NextResponse.json({ ok: false, error: "Missing x-signature" }, { status: 401 });
    }

    const expected = computeSignature(SECRET, rawBody);

    if (!timingSafeEqual(signatureHeader, expected)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Se chegou aqui, é legítimo (inclusive o ping)
    let payload: EduzzWebhookEnvelope = {};
    try {
      payload = (rawBody ? JSON.parse(rawBody) : {}) as EduzzWebhookEnvelope;
    } catch {
      // Se algum dia a Eduzz mandar form/urlencoded, você pode tratar aqui.
      payload = {};
    }

    const event = String(payload.event || "").toLowerCase();

    // ✅ Evento ping: só responder 2xx e pronto
    if (event === "ping") {
      return NextResponse.json({ ok: true, pong: true }, { status: 200 });
    }

    // A partir daqui, é onde você processa os eventos reais (compra, cancelamento, etc.)
    // Por enquanto vamos só logar no Firestore pra você ver chegando.
    const db = adminDb;

    const eventId =
      String(payload.id || "").trim() || `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await db.collection("eduzz_events").doc(eventId).set(
      {
        receivedAt: new Date(),
        event,
        raw: payload,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}