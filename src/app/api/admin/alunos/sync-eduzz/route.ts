export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminRoute";

type RecordData = Record<string, unknown>;

type EduzzSubscription = {
  id: string;
  status: string;
  createdAt: Date | null;
  updatedAt: Date | null;
  email: string;
  name: string;
  phone: string;
  document: string;
  address: {
    street: string | null;
    number: string | null;
    complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zipCode: string | null;
    country: string | null;
  };
  productId: string | null;
  productTitle: string | null;
  raw: RecordData;
};

type EduzzInvoice = {
  id: string;
  status: string;
  paidAt: Date | null;
  createdAt: Date | null;
  amountPaid: number | null;
  currency: string;
  paymentMethod: string | null;
  raw: RecordData;
};

function pickString(value: unknown) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function pickFirstString(...values: unknown[]) {
  for (const value of values) {
    const next = pickString(value);
    if (next) return next;
  }
  return "";
}

function pickNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const normalized = value.replace(",", ".").trim();
    const parsed = Number(normalized);
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeEmail(value: unknown) {
  return pickString(value).toLowerCase();
}

function toDateOrNull(value: unknown) {
  const raw = pickString(value);
  if (!raw) return null;
  const parsed = new Date(raw);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

function addMonths(date: Date, months: number) {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
}

function formatEduzzDateTime(date: Date) {
  return date.toISOString();
}

function normalizeStateName(value: unknown): string | null {
  const raw = pickString(value);
  if (!raw) return null;

  const map: Record<string, string> = {
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

  const upper = raw.toUpperCase();
  if (map[upper]) return map[upper];
  return raw;
}

function extractArray(payload: RecordData): RecordData[] {
  const candidates = [
    payload.items,
    payload.data,
    payload.subscriptions,
    (payload.data as RecordData | undefined)?.items,
    (payload.data as RecordData | undefined)?.subscriptions,
  ];

  const list = candidates.find((item) => Array.isArray(item));
  return Array.isArray(list) ? (list as RecordData[]) : [];
}

function resolveAddressSource(...sources: Array<RecordData | null | undefined>) {
  for (const source of sources) {
    if (!source) continue;

    const nested =
      typeof source.address === "object" && source.address !== null
        ? (source.address as RecordData)
        : null;

    if (nested) {
      const hasNested = [
        nested.street,
        nested.number,
        nested.neighborhood,
        nested.complement,
        nested.city,
        nested.state,
        nested.zipCode,
      ].some((value) => pickString(value));
      if (hasNested) return nested;
    }

    const hasFlat = [
      source.street,
      source.number,
      source.neighborhood,
      source.complement,
      source.city,
      source.state,
      source.zipCode,
    ].some((value) => pickString(value));
    if (hasFlat) return source;
  }

  return {};
}

function mapSubscription(raw: RecordData): EduzzSubscription | null {
  const student =
    (raw.student as RecordData | undefined) ??
    (raw.customer as RecordData | undefined) ??
    (raw.buyer as RecordData | undefined) ??
    (raw.client as RecordData | undefined) ??
    {};
  const buyer =
    (raw.buyer as RecordData | undefined) ??
    (raw.customer as RecordData | undefined) ??
    (raw.client as RecordData | undefined) ??
    {};
  const address = resolveAddressSource(student, buyer, raw);
  const items = Array.isArray(raw.items) && raw.items.length
    ? (raw.items[0] as RecordData)
    : null;
  const products = Array.isArray(raw.products) && raw.products.length
    ? (raw.products[0] as RecordData)
    : null;
  const clientPhone =
    typeof (student as RecordData).phone === "object" && (student as RecordData).phone !== null
      ? ((student as RecordData).phone as RecordData)
      : {};

  const email = normalizeEmail(
    student.email ?? buyer.email ?? raw.email ?? raw.edz_cli_email
  );
  const id = pickString(raw.id ?? raw.subscription_id ?? raw.contractId ?? raw.contract_id);
  const status = pickString(raw.status ?? raw.subscriptionStatus ?? raw.situation);

  if (!email || !id) return null;

  return {
    id,
    status,
    createdAt: toDateOrNull(raw.createdAt ?? raw.created_at ?? raw.startDate ?? raw.start_date),
    updatedAt: toDateOrNull(raw.updatedAt ?? raw.updated_at),
    email,
    name: pickString(student.name ?? buyer.name ?? raw.name),
    phone:
      pickFirstString(
        student.phone,
        student.cellphone,
        buyer.phone,
        buyer.cellphone,
        raw.phone
      ) ||
      [pickString(clientPhone.areaCode), pickString(clientPhone.number)].filter(Boolean).join(" "),
    document: pickString(student.document ?? buyer.document ?? raw.document),
    address: {
      street: pickString((address as RecordData).street) || null,
      number: pickString((address as RecordData).number) || null,
      complement: pickString((address as RecordData).complement) || null,
      neighborhood: pickString((address as RecordData).neighborhood) || null,
      city: pickString((address as RecordData).city) || null,
      state: normalizeStateName((address as RecordData).state),
      zipCode: pickString((address as RecordData).zipCode) || null,
      country: pickString((address as RecordData).country) || "Brasil",
    },
    productId:
      pickFirstString(
        (raw.product as RecordData | undefined)?.id,
        raw.product_id,
        (raw.offer as RecordData | undefined)?.id,
        raw.offer_id,
        (products as RecordData | null)?.id,
        (items as RecordData | null)?.productId,
        (items as RecordData | null)?.id
      ) || null,
    productTitle:
      pickFirstString(
        (raw.product as RecordData | undefined)?.title,
        (raw.product as RecordData | undefined)?.name,
        raw.product_title,
        (raw.offer as RecordData | undefined)?.title,
        raw.offer_title,
        (products as RecordData | null)?.title,
        (items as RecordData | null)?.name
      ) || null,
    raw,
  };
}

function mapInvoice(raw: RecordData): EduzzInvoice | null {
  const id = pickString(raw.id ?? raw.invoice_id ?? raw.edz_fat_cod);
  if (!id) return null;
  const priceNode =
    typeof raw.price === "object" && raw.price !== null ? (raw.price as RecordData) : {};
  const paidNode =
    typeof priceNode.paid === "object" && priceNode.paid !== null
      ? (priceNode.paid as RecordData)
      : {};

  return {
    id,
    status: pickString(raw.status ?? raw.invoiceStatus ?? raw.edz_fat_status),
    paidAt: toDateOrNull(raw.paidAt ?? raw.paymentDate ?? raw.paid_at),
    createdAt: toDateOrNull(raw.createdAt ?? raw.created_at ?? raw.date),
    amountPaid:
      pickNumber(paidNode.value) ??
      pickNumber(priceNode.value) ??
      pickNumber(raw.amountPaid ?? raw.total ?? raw.value),
    currency:
      pickString(paidNode.currency) ||
      pickString(priceNode.currency) ||
      "BRL",
    paymentMethod:
      pickString(raw.paymentMethod ?? (raw.payment as RecordData | undefined)?.method) || null,
    raw,
  };
}

function isInactiveSubscription(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("cancel") ||
    normalized.includes("finish") ||
    normalized.includes("suspend") ||
    normalized.includes("expire") ||
    normalized.includes("inactive") ||
    normalized.includes("refunded") ||
    normalized.includes("chargeback")
  );
}

function isPaidInvoice(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("paid") ||
    normalized.includes("approved") ||
    normalized.includes("complete") ||
    normalized === "2"
  );
}

async function eduzzRequest(path: string, token: string) {
  const baseUrl = process.env.EDUZZ_API_BASE_URL || "https://api.eduzz.com";
  const url = new URL(path, baseUrl);

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Eduzz API error (${res.status}): ${text || "sem detalhe"}`);
  }

  return (await res.json()) as RecordData;
}

async function fetchAllSubscriptions(token: string) {
  const subscriptions: EduzzSubscription[] = [];
  const endDate = new Date();
  const startDate = addMonths(endDate, -12);

  for (let page = 1; page <= 20; page += 1) {
    const params = new URLSearchParams({
      page: String(page),
      itemsPerPage: "100",
      startDate: formatEduzzDateTime(startDate),
      endDate: formatEduzzDateTime(endDate),
      filterBy: "creation",
    });
    const path = `/myeduzz/v1/subscriptions?${params.toString()}`;
    const payload = await eduzzRequest(path, token);
    const batch = extractArray(payload)
      .map((item) => mapSubscription(item))
      .filter((item): item is EduzzSubscription => item !== null);

    if (!batch.length) {
      if (page === 1) {
        throw new Error(
          "A API da Eduzz respondeu, mas não retornou assinaturas em um formato reconhecido."
        );
      }
      break;
    }

    subscriptions.push(...batch);

    const totalPages = pickNumber(
      payload.pages ??
        (payload.pagination as RecordData | undefined)?.totalPages ??
        (payload.meta as RecordData | undefined)?.totalPages
    );

    if (totalPages && page >= totalPages) break;
  }

  return subscriptions;
}

async function fetchSubscriptionInvoices(subscriptionId: string, token: string) {
  const payload = await eduzzRequest(`/myeduzz/v1/subscriptions/${subscriptionId}/invoices`, token);
  return extractArray(payload)
    .map((item) => mapInvoice(item))
    .filter((item): item is EduzzInvoice => item !== null);
}

async function resolvePlanMatch(productId: string | null, productTitle: string | null) {
  if (productId) {
    const byProductId = await adminDb
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
    const byTitle = await adminDb
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

export async function POST(req: NextRequest) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const token =
    process.env.EDUZZ_USER_TOKEN ||
    process.env.EDUZZ_PERSONAL_TOKEN ||
    process.env.EDUZZ_API_TOKEN ||
    process.env.EDUZZ_BEARER_TOKEN ||
    "";

  if (!token) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Configure EDUZZ_USER_TOKEN (ou EDUZZ_PERSONAL_TOKEN / EDUZZ_API_TOKEN) no ambiente para sincronizar os alunos.",
      },
      { status: 400 }
    );
  }

  try {
    const subscriptions = await fetchAllSubscriptions(token);
    const now = new Date();
    let scanned = 0;
    let imported = 0;
    let createdUsers = 0;
    let updatedUsers = 0;
    let skipped = 0;

    for (const subscription of subscriptions) {
      scanned += 1;

      if (isInactiveSubscription(subscription.status)) {
        skipped += 1;
        continue;
      }

      const invoices = await fetchSubscriptionInvoices(subscription.id, token);
      const latestPaid = invoices
        .filter((invoice) => isPaidInvoice(invoice.status))
        .sort((a, b) => {
          const aTime = (a.paidAt ?? a.createdAt)?.getTime() ?? 0;
          const bTime = (b.paidAt ?? b.createdAt)?.getTime() ?? 0;
          return bTime - aTime;
        })[0];

      const baseDate = latestPaid?.paidAt ?? latestPaid?.createdAt ?? subscription.createdAt;
      if (!baseDate) {
        skipped += 1;
        continue;
      }

      const validUntil = addMonths(baseDate, 12);
      if (validUntil.getTime() < now.getTime()) {
        skipped += 1;
        continue;
      }

      let uid = "";
      let wasCreated = false;
      try {
        const authUser = await adminAuth.getUserByEmail(subscription.email);
        uid = authUser.uid;
      } catch {
        const created = await adminAuth.createUser({
          email: subscription.email,
          emailVerified: true,
        });
        uid = created.uid;
        wasCreated = true;
        createdUsers += 1;
      }

      const userRef = adminDb.collection("users").doc(uid);
      const profileRef = userRef.collection("profile").doc("main");
      const entRef = adminDb.collection("entitlements").doc(uid);
      const userSnap = await userRef.get();
      const planMatch = await resolvePlanMatch(subscription.productId, subscription.productTitle);

      await Promise.all([
        userRef.set(
          {
            uid,
            email: subscription.email,
            role: "student",
            name: subscription.name || null,
            updatedAt: now,
            createdAt: userSnap.exists ? userSnap.data()?.createdAt ?? now : now,
          },
          { merge: true }
        ),
        profileRef.set(
          {
            name: subscription.name || null,
            phone: subscription.phone || null,
            document: subscription.document || null,
            address: subscription.address,
            source: "eduzz",
            updatedAt: now,
          },
          { merge: true }
        ),
        entRef.set(
          {
            uid,
            email: subscription.email,
            active: true,
            pending: false,
            source: "eduzz",
            sourceDetail: "eduzz_import",
            planId: planMatch.planId,
            productId: subscription.productId,
            productTitle: planMatch.planTitle,
            planMatchedBy: planMatch.matchedBy,
            amountPaid: latestPaid?.amountPaid ?? null,
            paymentMethod: latestPaid?.paymentMethod ?? null,
            currency: latestPaid?.currency ?? "BRL",
            paidAt: latestPaid?.paidAt ?? baseDate,
            validUntil,
            invoiceStatus: latestPaid?.status || subscription.status || "paid",
            subscriptionId: subscription.id,
            updatedAt: now,
            lastSyncAt: now,
          },
          { merge: true }
        ),
      ]);

      if (!wasCreated) {
        updatedUsers += 1;
      }
      imported += 1;
    }

    return NextResponse.json(
      {
        ok: true,
        scanned,
        imported,
        createdUsers,
        updatedUsers,
        skipped,
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sincronizar alunos ativos da Eduzz.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
