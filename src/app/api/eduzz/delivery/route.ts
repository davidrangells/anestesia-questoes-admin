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

  const fd = await req.formData();
  const obj: AnyObj = {};
  fd.forEach((val, key) => {
    obj[key] = typeof val === "string" ? val : "";
  });
  return obj;
}

export async function GET() {
  return NextResponse.json({ ok: true, service: "eduzz-delivery" }, { status: 200 });
}

export async function POST(req: NextRequest) {
  try {
    const WEBHOOK_SECRET =
      process.env.EDUZZ_WEBHOOK_SECRET ||
      process.env.EDUZZ_ORIGIN_SECRET ||
      "";

    const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
    const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "";
    const APP_URL = process.env.APP_URL || "";

    if (!WEBHOOK_SECRET) {
      return NextResponse.json(
        { ok: false, error: "Missing EDUZZ_WEBHOOK_SECRET env" },
        { status: 500 }
      );
    }

    const raw = await readBody(req);

    const data = (raw?.data as AnyObj) || raw;
    const fields = data as AnyObj;

    // -------------------------------
    // 🔐 SECRET VALIDATION (robusto)
    // -------------------------------

    const secretCandidates: Array<{ key: string; value: string }> = [
      { key: "edz_cli_origin_secret", value: String(fields["edz_cli_origin_secret"] ?? "") },
      { key: "edz_origin_secret", value: String(fields["edz_origin_secret"] ?? "") },
      { key: "origin_secret", value: String(fields["origin_secret"] ?? "") },
      { key: "eduzz_secret", value: String(fields["eduzz_secret"] ?? "") },
      { key: "secret", value: String(fields["secret"] ?? "") },
    ];

    const matched = secretCandidates.find(
      (c) => c.value && c.value === WEBHOOK_SECRET
    );

    if (!matched) {
      const present = secretCandidates
        .filter((c) => !!c.value)
        .map((c) => c.key);

      return NextResponse.json(
        {
          ok: false,
          error: "Unauthorized",
          debug: {
            receivedKeys: Object.keys(fields),
            secretFieldsPresent: present,
          },
        },
        { status: 401 }
      );
    }

    // -------------------------------
    // 📩 EMAIL
    // -------------------------------

    const email = normalizeEmail(
      pickFirstString(
        fields["edz_cli_email"],
        (fields["customer"] as AnyObj)?.email,
        (fields["buyer"] as AnyObj)?.email,
        fields["email"]
      )
    );

    if (!email) {
      return NextResponse.json(
        { ok: false, error: "Missing email in payload" },
        { status: 400 }
      );
    }

    // -------------------------------
    // 📦 EVENT INFO
    // -------------------------------

    const eventName = pickFirstString(
      raw["type"],
      raw["event"],
      fields["event"],
      fields["type"]
    ).toLowerCase();

    const invoiceStatus = pickFirstString(
      fields["edz_fat_status"],
      (fields["invoice"] as AnyObj)?.status
    ).toLowerCase();

    const productId = pickFirstString(
      fields["edz_cnt_cod"],
      (fields["product"] as AnyObj)?.id
    );

    const productTitle = pickFirstString(
      fields["edz_cnt_titulo"],
      (fields["product"] as AnyObj)?.title
    );

    const isPaid =
      eventName.includes("paid") ||
      invoiceStatus === "paid" ||
      invoiceStatus === "3";

    const isCanceled =
      eventName.includes("cancel") ||
      invoiceStatus === "canceled";

    // -------------------------------
    // 📝 LOG EVENT
    // -------------------------------

    const eventId =
      pickFirstString(raw["id"]) ||
      `${Date.now()}_${Math.random().toString(16).slice(2)}`;

    await adminDb.collection("eduzz_events").doc(eventId).set(
      {
        receivedAt: FieldValue.serverTimestamp(),
        eventName,
        email,
        productId,
        productTitle,
        invoiceStatus,
        raw,
      },
      { merge: true }
    );

    // -------------------------------
    // 👤 AUTH USER
    // -------------------------------

    let uid = "";
    let isNewUser = false;

    try {
      const user = await adminAuth.getUserByEmail(email);
      uid = user.uid;
    } catch {
      const randomPass =
        Math.random().toString(36).slice(2) + "A!9";
      const user = await adminAuth.createUser({
        email,
        password: randomPass,
      });
      uid = user.uid;
      isNewUser = true;
    }

    // -------------------------------
    // 📁 USERS COLLECTION
    // -------------------------------

    await adminDb.collection("users").doc(uid).set(
      {
        uid,
        email,
        role: "student",
        updatedAt: FieldValue.serverTimestamp(),
        ...(isNewUser
          ? { createdAt: FieldValue.serverTimestamp() }
          : {}),
      },
      { merge: true }
    );

    // -------------------------------
    // 🎓 ENTITLEMENT
    // -------------------------------

    await adminDb.collection("entitlements").doc(uid).set(
      {
        uid,
        email,
        active: isPaid ? true : false,
        pending: !isPaid && !isCanceled,
        productId,
        productTitle,
        source: "eduzz",
        updatedAt: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // -------------------------------
    // 📧 EMAIL (se pago)
    // -------------------------------

    if (isPaid && RESEND_API_KEY && RESEND_FROM_EMAIL && APP_URL) {
      const resetLink =
        await adminAuth.generatePasswordResetLink(email, {
          url: `${APP_URL}/aluno/entrar`,
        });

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
          html: `
            <h2>Acesso liberado ✅</h2>
            <p>Seu acesso foi liberado.</p>
            <p><a href="${resetLink}">Clique aqui para definir sua senha</a></p>
          `,
        }),
      });
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "Internal error" },
      { status: 500 }
    );
  }
}