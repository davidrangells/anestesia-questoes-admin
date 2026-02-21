// src/app/api/eduzz/delivery/route.ts
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { Resend } from "resend";

type EduzzEnvelope = {
  id?: string;
  event?: string; // ex: "myeduzz.invoice_paid"
  sentDate?: string;
  data?: Record<string, unknown>;
};

// ---------- helpers ----------
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

function safeJson(obj: unknown) {
  try {
    return JSON.parse(JSON.stringify(obj));
  } catch {
    return { raw: String(obj) };
  }
}

function getSecretFromRequest(req: NextRequest, body: any): string {
  // Eduzz pode enviar secret em header (mais comum)
  const h =
    req.headers.get("x-eduzz-secret") ||
    req.headers.get("x-webhook-secret") ||
    req.headers.get("x-hook-secret") ||
    req.headers.get("authorization") || // se vier "Bearer xxx"
    "";

  const headerSecret = h.startsWith("Bearer ") ? h.slice(7).trim() : h.trim();

  // …ou em campos no body (dependendo do modelo)
  const b = body ?? {};
  const bodySecret =
    pickFirstString(
      b?.edz_cli_origin_secret,
      b?.origin_secret,
      b?.webhook_secret,
      b?.secret,
      b?.data?.edz_cli_origin_secret
    ) || "";

  return headerSecret || bodySecret;
}

async function readBody(req: NextRequest): Promise<any> {
  const ct = req.headers.get("content-type") || "";
  if (ct.includes("application/json")) {
    return await req.json();
  }
  // fallback: form-data
  const fd = await req.formData();
  const fields: Record<string, unknown> = {};
  fd.forEach((val, key) => {
    fields[key] = typeof val === "string" ? val : "";
  });
  return fields;
}

function extractFromEnvelope(raw: any): {
  envelopeId: string;
  event: string;
  data: Record<string, unknown>;
  sentDate: string;
} {
  const envelopeId = pickFirstString(raw?.id, raw?.event_id, raw?.nsid, raw?.sid);
  const event = pickFirstString(raw?.event, raw?.type, raw?.name).toLowerCase();

  // Developer Hub manda { id, event, data, sentDate }
  const data = (raw?.data && typeof raw.data === "object" ? raw.data : raw?.fields) as
    | Record<string, unknown>
    | undefined;

  const sentDate = pickFirstString(raw?.sentDate, raw?.sent_date, raw?.createdAt, raw?.created_at);

  return {
    envelopeId: envelopeId || `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    event,
    data: data ?? {},
    sentDate: sentDate || new Date().toISOString(),
  };
}

function mapEventToAction(event: string): "activate" | "deactivate" | "ignore" {
  // Você selecionou: invoice_opened, invoice_paid, invoice_canceled
  // Regra: só ativa no paid. Cancelado desativa. Opened = ignore (ou pendente).
  if (event.includes("invoice_paid")) return "activate";
  if (event.includes("invoice_canceled") || event.includes("invoice_cancelled")) return "deactivate";
  return "ignore";
}

function htmlEmail(params: {
  appName: string;
  createPasswordUrl: string;
  loginUrl: string;
}) {
  const { appName, createPasswordUrl, loginUrl } = params;
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5; color:#0f172a">
    <h2 style="margin:0 0 12px 0">${appName}</h2>
    <p style="margin:0 0 16px 0">
      Seu acesso foi liberado ✅
    </p>
    <p style="margin:0 0 16px 0">
      Para criar sua senha e entrar, clique no botão abaixo:
    </p>
    <p style="margin:0 0 18px 0">
      <a href="${createPasswordUrl}"
         style="display:inline-block; padding:12px 16px; background:#0f172a; color:#fff; text-decoration:none; border-radius:10px; font-weight:700">
        Criar minha senha
      </a>
    </p>

    <p style="margin:0 0 10px 0; font-size:13px; color:#334155">
      Depois de criar a senha, você pode entrar aqui:
      <a href="${loginUrl}">${loginUrl}</a>
    </p>

    <p style="margin:18px 0 0 0; font-size:12px; color:#64748b">
      Se você não solicitou este acesso, pode ignorar este e-mail.
    </p>
  </div>
  `;
}

// ---------- handlers ----------
export async function GET() {
  // Para a Eduzz "Verificar URL" e também pra healthcheck
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const APP_URL = process.env.APP_URL || "";
  const EDUZZ_WEBHOOK_SECRET = process.env.EDUZZ_WEBHOOK_SECRET || process.env.EDUZZ_ORIGIN_SECRET || "";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "";

  try {
    const rawBody = await readBody(req);
    const { envelopeId, event, data, sentDate } = extractFromEnvelope(rawBody);

    // 1) Validar secret (quando a Eduzz mandar)
    const receivedSecret = getSecretFromRequest(req, rawBody);

    // ⚠️ IMPORTANTE:
    // Alguns "testes" da Eduzz podem vir sem secret no body e sem header.
    // A gente responde 200 pra não travar a configuração, MAS NÃO PROCESSA.
    const canValidate = Boolean(EDUZZ_WEBHOOK_SECRET);
    const hasSecret = Boolean(receivedSecret);

    if (canValidate && hasSecret && receivedSecret !== EDUZZ_WEBHOOK_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", debug: { envelopeId, event } },
        { status: 401 }
      );
    }

    const action = mapEventToAction(event);

    // 2) Log do evento (sempre salva)
    const db = adminDb;

    await db.collection("eduzz_events").doc(envelopeId).set(
      {
        receivedAt: new Date(),
        sentDate,
        event,
        action,
        secretPresent: hasSecret,
        raw: safeJson(rawBody),
      },
      { merge: true }
    );

    // 3) Só processa entitlement/usuario no invoice_paid (e invoice_canceled pra desativar)
    if (action === "ignore") {
      return NextResponse.json({ ok: true, processed: false, reason: "ignored_event", event }, { status: 200 });
    }

    // Extrair email (pode variar conforme o payload)
    const email = normalizeEmail(
      (data as any)?.customer?.email ??
        (data as any)?.buyer?.email ??
        (data as any)?.client?.email ??
        (data as any)?.email ??
        (data as any)?.edz_cli_email
    );

    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email", event, envelopeId }, { status: 400 });
    }

    // Extrair algumas infos úteis
    const invoiceId =
      pickFirstString((data as any)?.invoice?.id, (data as any)?.invoice_id, (data as any)?.edz_fat_cod) || null;

    const invoiceStatus =
      pickFirstString((data as any)?.invoice?.status, (data as any)?.invoice_status, (data as any)?.edz_fat_status) ||
      null;

    const productId =
      pickFirstString((data as any)?.product?.id, (data as any)?.product_id, (data as any)?.edz_cnt_cod) || null;

    const productTitle =
      pickFirstString((data as any)?.product?.title, (data as any)?.product_title, (data as any)?.edz_cnt_titulo) ||
      null;

    // 4) Garantir usuário no Firebase Auth
    let uid = "";
    try {
      const u = await adminAuth.getUserByEmail(email);
      uid = u.uid;
    } catch {
      const created = await adminAuth.createUser({
        email,
        emailVerified: true,
      });
      uid = created.uid;
    }

    const entRef = db.collection("entitlements").doc(uid);

    // 5) Atualizar entitlement em entitlements/{uid}
    const now = new Date();

    if (action === "activate") {
      await entRef.set(
        {
          uid,
          email,
          active: true,
          pending: false,
          source: "eduzz",
          productId,
          productTitle,
          invoiceId,
          invoiceStatus,
          updatedAt: now,
          lastEvent: event,
          lastEventId: envelopeId,
        },
        { merge: true }
      );

      // 6) Enviar e-mail 1x com link para criar senha
      // (somente se tiver Resend configurado)
      if (RESEND_API_KEY && RESEND_FROM_EMAIL && APP_URL) {
        const entSnap = await entRef.get();
        const alreadySent = Boolean(entSnap.exists && entSnap.data()?.welcomeEmailSentAt);

        if (!alreadySent) {
          const actionCodeSettings = {
            // após criar senha, manda de volta para o seu app
            url: `${APP_URL}/aluno/entrar?email=${encodeURIComponent(email)}`,
            handleCodeInApp: false,
          };

          const createPasswordUrl = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);

          const resend = new Resend(RESEND_API_KEY);

          const loginUrl = `${APP_URL}/aluno/entrar`;

          await resend.emails.send({
            from: `Anestesia Questões <${RESEND_FROM_EMAIL}>`,
            to: email,
            subject: "Seu acesso foi liberado — crie sua senha",
            html: htmlEmail({
              appName: "Anestesia Questões",
              createPasswordUrl,
              loginUrl,
            }),
          });

          await entRef.set(
            {
              welcomeEmailSentAt: now,
              welcomeEmailTo: email,
            },
            { merge: true }
          );
        }
      }

      // também cria/atualiza doc em users/{uid} (pro portal do aluno)
      await db.collection("users").doc(uid).set(
        {
          uid,
          email,
          role: "student",
          updatedAt: now,
          createdAt: now,
        },
        { merge: true }
      );

      return NextResponse.json({ ok: true, processed: true, action: "activate", uid }, { status: 200 });
    }

    // action === "deactivate"
    await entRef.set(
      {
        uid,
        email,
        active: false,
        pending: false,
        source: "eduzz",
        productId,
        productTitle,
        invoiceId,
        invoiceStatus,
        updatedAt: now,
        lastEvent: event,
        lastEventId: envelopeId,
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, processed: true, action: "deactivate", uid }, { status: 200 });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: "Internal error", message: e?.message || String(e) },
      { status: 500 }
    );
  }
}