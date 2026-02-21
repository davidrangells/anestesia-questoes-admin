// src/app/api/eduzz/delivery/route.ts
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";

type AnyObj = Record<string, unknown>;

function pickFirstString(...vals: unknown[]): string {
  for (const v of vals) {
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

async function readBody(req: NextRequest): Promise<AnyObj> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    const json = (await req.json()) as AnyObj;
    return json ?? {};
  }

  // fallback: x-www-form-urlencoded / multipart
  const fd = await req.formData();
  const obj: AnyObj = {};
  fd.forEach((val, key) => {
    obj[key] = typeof val === "string" ? val : "";
  });
  return obj;
}

/**
 * Eduzz "Verificar URL" às vezes manda POST sem os campos.
 * Pra verificação: sempre retorna 200.
 * Pro evento real: exige EDUZZ_ORIGIN_SECRET bater.
 */
export async function GET() {
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const ORIGIN_SECRET = process.env.EDUZZ_ORIGIN_SECRET || "";
    const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "";
    const APP_URL = process.env.APP_URL || "";

    if (!ORIGIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Missing EDUZZ_ORIGIN_SECRET" }, { status: 500 });
    }

    const raw = await readBody(req);

    // Eduzz pode mandar formatos diferentes (flat ou nested)
    const data = (raw?.data as AnyObj) || (raw?.fields as AnyObj) || raw;

    // Se for só verificação (sem campos), responde 200
    const maybeEmail = pickFirstString(
      data["edz_cli_email"],
      (data["customer"] as AnyObj)?.email,
      (data["buyer"] as AnyObj)?.email
    );
    const originSecret = pickFirstString(data["edz_cli_origin_secret"], data["origin_secret"]);

    if (!maybeEmail && !originSecret) {
      return NextResponse.json({ ok: true, service: "eduzz-delivery", mode: "verify" }, { status: 200 });
    }

    // Segurança: exige origin secret correto
    if (originSecret !== ORIGIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = normalizeEmail(maybeEmail);
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    // Identifica evento
    const eventName = pickFirstString(raw["type"], raw["event"], raw["name"], data["type"], data["event"], data["name"]).toLowerCase();

    // Campos comuns (podem existir ou não)
    const invoiceId = pickFirstString(
      data["edz_fat_cod"],
      (data["invoice"] as AnyObj)?.id,
      data["invoice_id"]
    );

    const invoiceStatus = pickFirstString(
      (data["invoice"] as AnyObj)?.status,
      data["edz_fat_status"],
      data["invoice_status"]
    ).toLowerCase();

    const productId = pickFirstString(
      data["edz_cnt_cod"],
      (data["product"] as AnyObj)?.id,
      data["product_id"]
    );

    const productTitle = pickFirstString(
      data["edz_cnt_titulo"],
      (data["product"] as AnyObj)?.title,
      data["product_title"]
    );

    // Regras de ativação (ajuste conforme a Eduzz mandar)
    const isPaid =
      eventName.includes("invoice_paid") ||
      invoiceStatus === "paid" ||
      invoiceStatus === "pago" ||
      invoiceStatus === "3"; // alguns fluxos usam 3 = pago

    const isCanceled =
      eventName.includes("invoice_canceled") ||
      eventName.includes("invoice_cancelled") ||
      invoiceStatus === "canceled" ||
      invoiceStatus === "cancelado";

    const shouldActivate = isPaid;
    const shouldDeactivate = isCanceled;
    const shouldPending = !shouldActivate && !shouldDeactivate;

    // Log do evento (dedupe simples)
    const eventId =
      pickFirstString(raw["id"], invoiceId, data["edz_fat_cod"]) || `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await adminDb
      .collection("eduzz_events")
      .doc(eventId)
      .set(
        {
          receivedAt: FieldValue.serverTimestamp(),
          eventName: eventName || null,
          email,
          invoiceId: invoiceId || null,
          invoiceStatus: invoiceStatus || null,
          productId: productId || null,
          productTitle: productTitle || null,
          raw,
        },
        { merge: true }
      );

    // 1) Garante usuário no Firebase Auth
    let userUid = "";
    let isNewUser = false;

    try {
      const u = await adminAuth.getUserByEmail(email);
      userUid = u.uid;
    } catch {
      // cria com senha aleatória (usuário vai definir a dele via reset link)
      const randomPass = Math.random().toString(36).slice(2) + "A!9";
      const u = await adminAuth.createUser({ email, password: randomPass, emailVerified: false, disabled: false });
      userUid = u.uid;
      isNewUser = true;
    }

    // 2) users/{uid}
    await adminDb
      .collection("users")
      .doc(userUid)
      .set(
        {
          uid: userUid,
          email,
          role: "student",
          updatedAt: FieldValue.serverTimestamp(),
          ...(isNewUser ? { createdAt: FieldValue.serverTimestamp() } : {}),
        },
        { merge: true }
      );

    // 3) entitlements/{uid}
    await adminDb
      .collection("entitlements")
      .doc(userUid)
      .set(
        {
          uid: userUid,
          email,
          active: shouldActivate ? true : shouldDeactivate ? false : false,
          pending: shouldPending ? true : false,
          source: "eduzz",
          productId: productId || null,
          productTitle: productTitle || null,
          invoiceId: invoiceId || null,
          invoiceStatus: invoiceStatus || null,
          updatedAt: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );

    // 4) E-mail (somente quando ativar)
    if (shouldActivate) {
      if (!RESEND_API_KEY || !RESEND_FROM_EMAIL || !APP_URL) {
        // não quebra o webhook se e-mail ainda não estiver pronto
        return NextResponse.json(
          { ok: true, warning: "Activated, but missing RESEND_* or APP_URL env vars" },
          { status: 200 }
        );
      }

      // link para definir senha (reset link do Firebase = serve para “criar senha” também)
      const resetLink = await adminAuth.generatePasswordResetLink(email, {
        url: `${APP_URL}/aluno/entrar?reset=1`,
      });

      const html = `
        <div style="font-family:Arial,sans-serif;line-height:1.5">
          <h2>Acesso liberado ✅</h2>
          <p>Seu acesso ao <b>Anestesia Questões</b> foi liberado.</p>
          <p>Clique no botão abaixo para <b>definir sua senha</b>:</p>
          <p>
            <a href="${resetLink}" style="display:inline-block;padding:12px 16px;background:#0f172a;color:#fff;text-decoration:none;border-radius:10px">
              Definir minha senha
            </a>
          </p>
          <p style="color:#64748b;font-size:12px">
            Se você não solicitou isso, ignore este e-mail.
          </p>
        </div>
      `;

      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: RESEND_FROM_EMAIL,
          to: [email],
          subject: "Acesso liberado — Anestesia Questões",
          html,
        }),
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (e: unknown) {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}