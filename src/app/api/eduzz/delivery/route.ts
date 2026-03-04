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
  const h =
    req.headers.get("x-eduzz-secret") ||
    req.headers.get("x-webhook-secret") ||
    req.headers.get("x-hook-secret") ||
    req.headers.get("authorization") ||
    "";

  const headerSecret = h.startsWith("Bearer ") ? h.slice(7).trim() : h.trim();

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
  if (event.includes("invoice_paid")) return "activate";
  if (event.includes("invoice_canceled") || event.includes("invoice_cancelled")) return "deactivate";
  return "ignore";
}

function toDateOrNull(v: unknown): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  const s = String(v);
  const d = new Date(s);
  return Number.isFinite(d.getTime()) ? d : null;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

const STATE_NAME_BY_UF: Record<string, string> = {
  AC: "Acre",
  AL: "Alagoas",
  AP: "Amapá",
  AM: "Amazonas",
  BA: "Bahia",
  CE: "Ceará",
  DF: "Distrito Federal",
  ES: "Espírito Santo",
  GO: "Goiás",
  MA: "Maranhão",
  MT: "Mato Grosso",
  MS: "Mato Grosso do Sul",
  MG: "Minas Gerais",
  PA: "Pará",
  PB: "Paraíba",
  PR: "Paraná",
  PE: "Pernambuco",
  PI: "Piauí",
  RJ: "Rio de Janeiro",
  RN: "Rio Grande do Norte",
  RS: "Rio Grande do Sul",
  RO: "Rondônia",
  RR: "Roraima",
  SC: "Santa Catarina",
  SP: "São Paulo",
  SE: "Sergipe",
  TO: "Tocantins",
};

const STATE_NAME_BY_NORMALIZED: Record<string, string> = Object.fromEntries(
  Object.values(STATE_NAME_BY_UF).map((name) => [
    name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
    name,
  ])
);

function normalizeStateName(value: unknown): string | null {
  const raw = pickFirstString(value);
  if (!raw) return null;

  const upper = raw.toUpperCase();
  if (STATE_NAME_BY_UF[upper]) {
    return STATE_NAME_BY_UF[upper];
  }

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return STATE_NAME_BY_NORMALIZED[normalized] || raw;
}

function resolveAddressSource(...sources: Array<Record<string, unknown> | null | undefined>) {
  for (const source of sources) {
    if (!source || typeof source !== "object") continue;

    const nested = source.address;
    if (nested && typeof nested === "object") {
      const nestedAddress = nested as Record<string, unknown>;
      const hasNestedValue = [
        nestedAddress.street,
        nestedAddress.number,
        nestedAddress.neighborhood,
        nestedAddress.complement,
        nestedAddress.city,
        nestedAddress.state,
        nestedAddress.zipCode,
        nestedAddress.country,
      ].some((value) => pickFirstString(value));

      if (hasNestedValue) {
        return nestedAddress;
      }
    }

    const flatSource = source as Record<string, unknown>;
    const hasFlatValue = [
      flatSource.street,
      flatSource.number,
      flatSource.neighborhood,
      flatSource.complement,
      flatSource.city,
      flatSource.state,
      flatSource.zipCode,
      flatSource.country,
    ].some((value) => pickFirstString(value));

    if (hasFlatValue) {
      return flatSource;
    }
  }

  return {};
}

async function resolvePlanMatch(params: {
  db: FirebaseFirestore.Firestore;
  productId: string | null;
  productTitle: string | null;
}) {
  const { db, productId, productTitle } = params;

  if (productId) {
    const byProductId = await db
      .collection("catalog_planos")
      .where("productId", "==", productId)
      .limit(1)
      .get();

    if (!byProductId.empty) {
      const doc = byProductId.docs[0];
      return {
        planId: doc.id,
        planTitle: String(doc.data()?.title ?? "").trim() || productTitle || null,
        matchedBy: "productId" as const,
      };
    }
  }

  if (productTitle) {
    const byTitle = await db
      .collection("catalog_planos")
      .where("title", "==", productTitle)
      .limit(1)
      .get();

    if (!byTitle.empty) {
      const doc = byTitle.docs[0];
      return {
        planId: doc.id,
        planTitle: String(doc.data()?.title ?? "").trim() || productTitle,
        matchedBy: "title" as const,
      };
    }
  }

  return {
    planId: null,
    planTitle: productTitle,
    matchedBy: null,
  };
}

function htmlEmail(params: { appName: string; createPasswordUrl: string; loginUrl: string }) {
  const { appName, createPasswordUrl, loginUrl } = params;
  return `
  <div style="font-family: Arial, sans-serif; line-height:1.5; color:#0f172a">
    <h2 style="margin:0 0 12px 0">${appName}</h2>
    <p style="margin:0 0 16px 0">Seu acesso foi liberado ✅</p>
    <p style="margin:0 0 16px 0">Para criar sua senha e entrar, clique no botão abaixo:</p>
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
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  const APP_URL = process.env.APP_URL || "";
  const EDUZZ_WEBHOOK_SECRET =
    process.env.EDUZZ_WEBHOOK_SECRET || process.env.EDUZZ_ORIGIN_SECRET || "";
  const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
  const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "";

  try {
    const rawBody = await readBody(req);
    const { envelopeId, event, data, sentDate } = extractFromEnvelope(rawBody);

    // 1) Validar secret (quando a Eduzz mandar)
    const receivedSecret = getSecretFromRequest(req, rawBody);
    const canValidate = Boolean(EDUZZ_WEBHOOK_SECRET);
    const hasSecret = Boolean(receivedSecret);

    if (canValidate && hasSecret && receivedSecret !== EDUZZ_WEBHOOK_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized", debug: { envelopeId, event } },
        { status: 401 }
      );
    }

    const action = mapEventToAction(event);
    const db = adminDb;

    // 2) Log do evento (sempre salva)
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
      return NextResponse.json(
        { ok: true, processed: false, reason: "ignored_event", event },
        { status: 200 }
      );
    }

    // --------- EXTRAÇÕES (email, plano, valor, vencimento, perfil) ---------
    const email = normalizeEmail(
      (data as any)?.student?.email ??
        (data as any)?.customer?.email ??
        (data as any)?.buyer?.email ??
        (data as any)?.client?.email ??
        (data as any)?.email ??
        (data as any)?.edz_cli_email
    );

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing email", event, envelopeId },
        { status: 400 }
      );
    }

    const invoiceId =
      pickFirstString((data as any)?.invoice?.id, (data as any)?.invoice_id, (data as any)?.edz_fat_cod) || null;

    const invoiceStatus =
      pickFirstString(
        (data as any)?.invoice?.status,
        (data as any)?.invoice_status,
        (data as any)?.status, // alguns payloads têm status no root
        (data as any)?.edz_fat_status
      ) || null;

    // Plano/produto (vários formatos)
    const productFromItems =
      Array.isArray((data as any)?.items) && (data as any)?.items?.length ? (data as any)?.items?.[0] : null;
    const productIdFromItemDiscount =
      Array.isArray((data as any)?.items) && (data as any)?.items?.length
        ? ((data as any).items as Array<any>)
            .map((item) =>
              pickFirstString(
                item?.price?.discount?.productId,
                item?.price?.discount?.productID,
                item?.discount?.productId
              )
            )
            .find(Boolean) || null
        : null;

    const productId =
      pickFirstString(
        (data as any)?.product?.id,
        (data as any)?.product_id,
        (data as any)?.offer?.id,
        (data as any)?.offer_id,
        (data as any)?.edz_cnt_cod,
        productFromItems?.productId,
        productFromItems?.id,
        productIdFromItemDiscount
      ) || null;

    const productTitle =
      pickFirstString(
        (data as any)?.product?.title,
        (data as any)?.product_title,
        (data as any)?.offer?.title,
        (data as any)?.offer_title,
        (data as any)?.edz_cnt_titulo,
        productFromItems?.name
      ) || null;

    // Valor pago (quando existir)
    const currency =
      pickFirstString(
        (data as any)?.price?.paid?.currency,
        (data as any)?.price?.currency,
        (data as any)?.currency
      ) || "BRL";

    const amountPaid =
      (typeof (data as any)?.price?.paid?.value === "number" ? (data as any)?.price?.paid?.value : null) ??
      (typeof (data as any)?.price?.value === "number" ? (data as any)?.price?.value : null) ??
      null;
    const paymentMethod =
      pickFirstString(
        (data as any)?.paymentMethod,
        (data as any)?.payment?.method,
        (data as any)?.invoice?.paymentMethod
      ) || null;

    // Vencimento (até data X) – vem muito como contract.dueDate ou dueDate
    const dueDateRaw = (data as any)?.dueDate || (data as any)?.contract?.dueDate || null;
    const paidAtRaw = (data as any)?.paidAt || (data as any)?.payment?.paidAt || null;

    const paidAt = toDateOrNull(paidAtRaw);
    const dueDate = toDateOrNull(dueDateRaw);
    const validUntil = paidAt
      ? addMonths(paidAt, 12)
      : dueDate
        ? addMonths(dueDate, 12)
        : null;

    // Perfil do aluno: prioriza student para identidade, mas usa fallback de endereço do buyer/customer
    const studentProfile = (data as any)?.student || {};
    const buyerProfile = (data as any)?.buyer || {};
    const customerProfile = (data as any)?.customer || (data as any)?.client || {};
    const profileSource =
      Object.keys(studentProfile).length > 0
        ? studentProfile
        : Object.keys(buyerProfile).length > 0
          ? buyerProfile
          : customerProfile;
    const address = resolveAddressSource(
      profileSource,
      buyerProfile,
      customerProfile,
      (data as any)?.address as Record<string, unknown> | undefined
    );

    const profilePayload = {
      name: pickFirstString(profileSource?.name, (data as any)?.name) || null,
      phone: pickFirstString(
        profileSource?.phone,
        profileSource?.cellphone,
        profileSource?.phone2,
        buyerProfile?.phone,
        buyerProfile?.cellphone
      ) || null,
      document: pickFirstString(profileSource?.document, buyerProfile?.document) || null,
      address: {
        street: pickFirstString(address?.street) || null,
        number: pickFirstString(address?.number) || null,
        complement: pickFirstString(address?.complement) || null,
        neighborhood: pickFirstString(address?.neighborhood) || null,
        city: pickFirstString(address?.city) || null,
        state: normalizeStateName(address?.state),
        zipCode: pickFirstString(address?.zipCode) || null,
        country: pickFirstString(address?.country) || null,
      },
      updatedAt: new Date(),
      source: "eduzz",
    };

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
    const now = new Date();
    const planMatch = await resolvePlanMatch({
      db,
      productId,
      productTitle,
    });

    if (action === "activate") {
      // ✅ ENTITLEMENT com vencimento + plano/valor
      await entRef.set(
        {
          uid,
          email,
          active: true,
          pending: false,
          source: "eduzz",
          planId: planMatch.planId,
          productId,
          productTitle: planMatch.planTitle,
          planMatchedBy: planMatch.matchedBy,
          invoiceId,
          invoiceStatus,
          amountPaid,
          paymentMethod,
          currency,
          paidAt: paidAt ?? null,
          validUntil: validUntil ?? null, // ✅ vencimento até
          updatedAt: now,
          lastEvent: event,
          lastEventId: envelopeId,
        },
        { merge: true }
      );

      // 5) E-mail 1x com link para criar senha (se configurado)
      if (RESEND_API_KEY && RESEND_FROM_EMAIL && APP_URL) {
        try {
          const entSnap = await entRef.get();
          const alreadySent = Boolean(entSnap.exists && entSnap.data()?.welcomeEmailSentAt);

          if (!alreadySent) {
            const actionCodeSettings = {
              url: `${APP_URL}/aluno/entrar?email=${encodeURIComponent(email)}`,
              handleCodeInApp: false,
            };

            let createPasswordUrl = "";
            try {
              createPasswordUrl = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
            } catch (err) {
              console.error("ERROR generating reset link:", err);
              createPasswordUrl = `${APP_URL}/aluno/entrar`;
            }

            try {
              const resend = new Resend(RESEND_API_KEY);

              await resend.emails.send({
                from: `Anestesia Questões <${RESEND_FROM_EMAIL}>`,
                to: email,
                subject: "Seu acesso foi liberado — crie sua senha",
                html: htmlEmail({
                  appName: "Anestesia Questões",
                  createPasswordUrl,
                  loginUrl: `${APP_URL}/aluno/entrar`,
                }),
              });

              await entRef.set(
                {
                  welcomeEmailSentAt: new Date(),
                  welcomeEmailTo: email,
                },
                { merge: true }
              );
            } catch (err) {
              console.error("ERROR sending email via Resend:", err);
            }
          }
        } catch (err) {
          console.error("EMAIL BLOCK ERROR:", err);
        }
      }

      // 6) users/{uid} (portal aluno) + profile em subcoleção
      const userRef = db.collection("users").doc(uid);
      const userSnap = await userRef.get();
      const existingRole =
        userSnap.exists && typeof userSnap.data()?.role === "string"
          ? String(userSnap.data()?.role)
          : null;

      await userRef.set(
        {
          uid,
          email,
          role: existingRole === "admin" ? "admin" : "student",
          updatedAt: now,
          createdAt: userSnap.exists ? userSnap.data()?.createdAt ?? now : now,
        },
        { merge: true }
      );

      // ✅ PERFIL vindo da Eduzz (pra página Perfil do aluno)
      // guarda em users/{uid}/profile/main
      await db
        .collection("users")
        .doc(uid)
        .collection("profile")
        .doc("main")
        .set(profilePayload, { merge: true });

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
        planId: planMatch.planId,
        productId,
        productTitle: planMatch.planTitle,
        planMatchedBy: planMatch.matchedBy,
        invoiceId,
        invoiceStatus,
        amountPaid,
        paymentMethod,
        currency,
        paidAt: paidAt ?? null,
        validUntil: validUntil ?? null,
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
