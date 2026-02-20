// src/app/api/eduzz/delivery/route.ts
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

type EduzzPayload = {
  type?: string; // "create" | "remove"
  fields?: Record<string, unknown>;
  sid?: string;
  nsid?: string;
};

function normalizeEmail(v: unknown): string {
  return String(v ?? "").trim().toLowerCase();
}

function docIdFromEmail(email: string): string {
  return encodeURIComponent(email);
}

async function readBody(req: NextRequest): Promise<EduzzPayload> {
  const ct = req.headers.get("content-type") || "";

  if (ct.includes("application/json")) {
    const json = (await req.json()) as EduzzPayload;
    return json ?? {};
  }

  // fallback: form-data
  const fd = await req.formData();
  const fields: Record<string, unknown> = {};
  fd.forEach((val, key) => {
    fields[key] = typeof val === "string" ? val : "";
  });

  return { type: String(fields["type"] ?? ""), fields };
}

export async function POST(req: NextRequest) {
  try {
    const ORIGIN_SECRET = process.env.EDUZZ_ORIGIN_SECRET || "";
    if (!ORIGIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Missing EDUZZ_ORIGIN_SECRET" }, { status: 500 });
    }

    const payload = await readBody(req);
    const type = String(payload.type ?? "").toLowerCase();
    const fields = payload.fields ?? {};

    const originSecret = String(fields["edz_cli_origin_secret"] ?? "");
    if (originSecret !== ORIGIN_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const email = normalizeEmail(fields["edz_cli_email"]);
    if (!email) {
      return NextResponse.json({ ok: false, error: "Missing email" }, { status: 400 });
    }

    const fatStatus = Number(fields["edz_fat_status"] ?? 0); // 3 = paga
    const fatCod = String(fields["edz_fat_cod"] ?? "");
    const productId = String(fields["edz_cnt_cod"] ?? "");
    const productTitle = String(fields["edz_cnt_titulo"] ?? "");
    const contractId = String(fields["edz_con_cod"] ?? "");
    const contractStatus = String(fields["edz_con_status"] ?? "");
    const contractStatusCod = String(fields["edz_con_status_cod"] ?? "");

    const db = adminDb();

    // Dedupe simples: fatura + type
    const eventId = fatCod ? `${fatCod}_${type}` : `${Date.now()}_${type}`;

    await db.collection("eduzz_events").doc(eventId).set(
      {
        receivedAt: new Date(),
        type,
        email,
        fatCod,
        fatStatus,
        productId,
        productTitle,
        contractId,
        contractStatus,
        contractStatusCod,
        raw: payload,
      },
      { merge: true }
    );

    const entId = docIdFromEmail(email);
    const entRef = db.collection("entitlements").doc(entId);

    const shouldActivate = type === "create" && fatStatus === 3;
    const shouldDeactivate = type === "remove";

    if (shouldActivate) {
      await entRef.set(
        {
          email,
          active: true,
          pending: false,
          source: "eduzz",
          productId,
          productTitle,
          contractId,
          contractStatus,
          contractStatusCod,
          fatCod,
          fatStatus,
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
          productId,
          productTitle,
          contractId,
          contractStatus,
          contractStatusCod,
          fatCod,
          fatStatus,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    } else {
      // eventos "não pagos ainda" (ex: status diferente de 3)
      await entRef.set(
        {
          email,
          active: false,
          pending: true,
          source: "eduzz",
          productId,
          productTitle,
          contractId,
          contractStatus,
          contractStatusCod,
          fatCod,
          fatStatus,
          updatedAt: new Date(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ ok: false, error: "Internal error" }, { status: 500 });
  }
}