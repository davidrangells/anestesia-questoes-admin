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
  explicitValidUntil: Date | null;
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
  dueAt: Date | null;
  amountPaid: number | null;
  currency: string;
  paymentMethod: string | null;
  raw: RecordData;
};

type EduzzEventCandidate = {
  email: string;
  name: string;
  phone: string;
  document: string;
  address: EduzzSubscription["address"];
  productId: string | null;
  productTitle: string | null;
  amountPaid: number | null;
  currency: string;
  paymentMethod: string | null;
  paidAt: Date | null;
  validUntil: Date | null;
  invoiceStatus: string;
  invoiceId: string | null;
  subscriptionId: string | null;
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

function timestampLikeToDate(value: unknown) {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "object" && value !== null && "toDate" in value) {
    const timestamp = value as { toDate?: () => Date };
    if (typeof timestamp.toDate === "function") {
      const parsed = timestamp.toDate();
      return parsed instanceof Date && Number.isFinite(parsed.getTime()) ? parsed : null;
    }
  }
  return toDateOrNull(value);
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
    payload.subscriptions,
    payload.data,
    (payload.data as RecordData | undefined)?.items,
    (payload.data as RecordData | undefined)?.subscriptions,
    (payload.data as RecordData | undefined)?.data,
    (payload.result as RecordData | undefined)?.items,
    (payload.result as RecordData | undefined)?.subscriptions,
  ];

  const list = candidates.find((item) => Array.isArray(item));
  return Array.isArray(list) ? (list as RecordData[]) : [];
}

function summarizePayload(payload: RecordData) {
  try {
    const raw = JSON.stringify(payload);
    return raw.length > 500 ? `${raw.slice(0, 497)}...` : raw;
  } catch {
    return "[unserializable payload]";
  }
}

function unwrapRecord(raw: RecordData) {
  if (typeof raw.data === "object" && raw.data !== null) {
    return raw.data as RecordData;
  }
  return raw;
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
  const source = unwrapRecord(raw);
  const student =
    (source.student as RecordData | undefined) ??
    (source.customer as RecordData | undefined) ??
    (source.buyer as RecordData | undefined) ??
    (source.client as RecordData | undefined) ??
    {};
  const buyer =
    (source.buyer as RecordData | undefined) ??
    (source.customer as RecordData | undefined) ??
    (source.client as RecordData | undefined) ??
    {};
  const address = resolveAddressSource(student, buyer, source);
  const items = Array.isArray(source.items) && source.items.length
    ? (source.items[0] as RecordData)
    : null;
  const products = Array.isArray(source.products) && source.products.length
    ? (source.products[0] as RecordData)
    : null;
  const clientPhone =
    typeof (student as RecordData).phone === "object" && (student as RecordData).phone !== null
      ? ((student as RecordData).phone as RecordData)
      : {};

  const email = normalizeEmail(
    student.email ?? buyer.email ?? source.email ?? source.edz_cli_email
  );
  const id = pickString(source.id ?? source.subscription_id ?? source.contractId ?? source.contract_id);
  const status = pickString(source.status ?? source.subscriptionStatus ?? source.situation);

  if (!email || !id) return null;

  return {
    id,
    status,
    createdAt: toDateOrNull(
      source.createdAt ?? source.created_at ?? source.startDate ?? source.start_date
    ),
    updatedAt: toDateOrNull(source.updatedAt ?? source.updated_at),
    explicitValidUntil: toDateOrNull(
      source.endDate ??
        source.end_date ??
        source.expiresAt ??
        source.expires_at ??
        source.expirationDate ??
        source.expiration_date ??
        source.nextChargeDate ??
        source.next_charge_date ??
        source.nextBillingDate ??
        source.next_billing_date ??
        source.renewalDate ??
        source.renewal_date
    ),
    email,
    name: pickString(student.name ?? buyer.name ?? source.name),
    phone:
      pickFirstString(
        student.phone,
        student.cellphone,
        buyer.phone,
        buyer.cellphone,
        source.phone
      ) ||
      [pickString(clientPhone.areaCode), pickString(clientPhone.number)].filter(Boolean).join(" "),
    document: pickString(student.document ?? buyer.document ?? source.document),
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
        (source.product as RecordData | undefined)?.id,
        source.product_id,
        (source.offer as RecordData | undefined)?.id,
        source.offer_id,
        (products as RecordData | null)?.id,
        (items as RecordData | null)?.productId,
        (items as RecordData | null)?.id
      ) || null,
    productTitle:
      pickFirstString(
        (source.product as RecordData | undefined)?.title,
        (source.product as RecordData | undefined)?.name,
        source.product_title,
        (source.offer as RecordData | undefined)?.title,
        source.offer_title,
        (products as RecordData | null)?.title,
        (items as RecordData | null)?.name
      ) || null,
    raw: source,
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
    paidAt: toDateOrNull(
      raw.paidAt ??
        raw.paymentDate ??
        raw.paid_at ??
        raw.approvedAt ??
        raw.approved_at ??
        raw.confirmedAt ??
        raw.confirmed_at
    ),
    createdAt: toDateOrNull(
      raw.createdAt ??
        raw.created_at ??
        raw.updatedAt ??
        raw.updated_at ??
        raw.releasedAt ??
        raw.released_at ??
        raw.date
    ),
    dueAt: toDateOrNull(raw.dueAt ?? raw.due_at ?? raw.dueDate ?? raw.expireDate ?? raw.expire_date),
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
    normalized.includes("refunded") ||
    normalized.includes("chargeback")
  );
}

function isPaidInvoice(status: string) {
  const normalized = status.toLowerCase();
  return (
    normalized.includes("paid") ||
    normalized.includes("pago") ||
    normalized.includes("approved") ||
    normalized.includes("aprov") ||
    normalized.includes("complete") ||
    normalized.includes("conclu") ||
    normalized.includes("success") ||
    normalized.includes("sucesso") ||
    normalized.includes("confirm") ||
    normalized.includes("liberad") ||
    normalized.includes("settled") ||
    normalized.includes("liquid") ||
    normalized.includes("authorized") ||
    normalized.includes("autoriz") ||
    normalized === "2"
  );
}

function hasPaymentEvidence(invoice: EduzzInvoice) {
  return Boolean(invoice.paidAt) || (invoice.amountPaid ?? 0) > 0;
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
  const startDate = addMonths(endDate, -60);

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
    const rawItems = extractArray(payload);
    const batch = rawItems
      .map((item) => mapSubscription(item))
      .filter((item): item is EduzzSubscription => item !== null);

    if (!batch.length) {
      if (page === 1) {
        throw new Error(
          rawItems.length
            ? `A API da Eduzz respondeu com itens, mas não foi possível mapear as assinaturas. Exemplo: ${summarizePayload(rawItems[0] ?? {})}`
            : `A API da Eduzz respondeu sem assinaturas para o período consultado. Payload: ${summarizePayload(payload)}`
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

async function fetchRecentPaidEventCandidates(cutoff: Date) {
  const snap = await adminDb.collection("eduzz_events").where("action", "==", "activate").get();
  const candidates: EduzzEventCandidate[] = [];

  for (const doc of snap.docs) {
    const data = doc.data() as RecordData;
    const receivedAt = timestampLikeToDate(data.receivedAt);
    if (receivedAt && receivedAt.getTime() < cutoff.getTime()) continue;

    const raw =
      typeof data.raw === "object" && data.raw !== null ? (data.raw as RecordData) : {};
    const envelopeData =
      typeof raw.data === "object" && raw.data !== null ? (raw.data as RecordData) : raw;
    const student =
      (envelopeData.student as RecordData | undefined) ??
      (envelopeData.customer as RecordData | undefined) ??
      (envelopeData.buyer as RecordData | undefined) ??
      (envelopeData.client as RecordData | undefined) ??
      {};
    const buyer =
      (envelopeData.buyer as RecordData | undefined) ??
      (envelopeData.customer as RecordData | undefined) ??
      (envelopeData.client as RecordData | undefined) ??
      {};
    const address = resolveAddressSource(student, buyer, envelopeData);
    const items =
      Array.isArray(envelopeData.items) && envelopeData.items.length
        ? (envelopeData.items[0] as RecordData)
        : null;

    const email = normalizeEmail(
      student.email ?? buyer.email ?? envelopeData.email ?? envelopeData.edz_cli_email
    );
    if (!email) continue;

    const paidAt = toDateOrNull(
      envelopeData.paidAt ??
        (envelopeData.payment as RecordData | undefined)?.paidAt ??
        envelopeData.paymentDate
    );
    const dueDate = toDateOrNull(
      envelopeData.dueDate ??
        (envelopeData.contract as RecordData | undefined)?.dueDate
    );
    const validUntil = paidAt
      ? addMonths(paidAt, 12)
      : dueDate
        ? addMonths(dueDate, 12)
        : null;

    candidates.push({
      email,
      name: pickString(student.name ?? buyer.name ?? envelopeData.name),
      phone: pickFirstString(
        student.phone,
        student.cellphone,
        buyer.phone,
        buyer.cellphone,
        envelopeData.phone
      ),
      document: pickString(student.document ?? buyer.document ?? envelopeData.document),
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
          (envelopeData.product as RecordData | undefined)?.id,
          envelopeData.product_id,
          (envelopeData.offer as RecordData | undefined)?.id,
          envelopeData.offer_id,
          envelopeData.edz_cnt_cod,
          (items as RecordData | null)?.productId,
          (items as RecordData | null)?.id
        ) || null,
      productTitle:
        pickFirstString(
          (envelopeData.product as RecordData | undefined)?.title,
          envelopeData.product_title,
          (envelopeData.offer as RecordData | undefined)?.title,
          envelopeData.offer_title,
          envelopeData.edz_cnt_titulo,
          (items as RecordData | null)?.name
        ) || null,
      amountPaid:
        pickNumber(
          ((envelopeData.price as RecordData | undefined)?.paid as RecordData | undefined)?.value
        ) ??
        pickNumber((envelopeData.price as RecordData | undefined)?.value) ??
        pickNumber(envelopeData.value),
      currency:
        pickFirstString(
          ((envelopeData.price as RecordData | undefined)?.paid as RecordData | undefined)?.currency,
          (envelopeData.price as RecordData | undefined)?.currency,
          envelopeData.currency
        ) || "BRL",
      paymentMethod:
        pickFirstString(
          envelopeData.paymentMethod,
          (envelopeData.payment as RecordData | undefined)?.method,
          (envelopeData.invoice as RecordData | undefined)?.paymentMethod
        ) || null,
      paidAt,
      validUntil,
      invoiceStatus:
        pickFirstString(
          (envelopeData.invoice as RecordData | undefined)?.status,
          envelopeData.invoice_status,
          envelopeData.status,
          envelopeData.edz_fat_status
        ) || "paid",
      invoiceId:
        pickFirstString(
          (envelopeData.invoice as RecordData | undefined)?.id,
          envelopeData.invoice_id,
          envelopeData.edz_fat_cod
        ) || null,
      subscriptionId:
        pickFirstString(
          envelopeData.id,
          envelopeData.subscription_id,
          envelopeData.contractId,
          envelopeData.contract_id
        ) || null,
    });
  }

  return candidates;
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
    const eventCandidates = await fetchRecentPaidEventCandidates(addMonths(new Date(), -12));
    const now = new Date();
    let scanned = 0;
    let imported = 0;
    let createdUsers = 0;
    let updatedUsers = 0;
    let skipped = 0;
    let skippedBlockedStatus = 0;
    let skippedWithoutPaidInvoice = 0;
    let skippedExpired = 0;
    let skippedWithoutDate = 0;
    let usedSubscriptionDateFallback = 0;
    let firstExpiredDebug: Record<string, unknown> | null = null;
    const processedEmails = new Set<string>();

    for (const subscription of subscriptions) {
      scanned += 1;

      const invoices = await fetchSubscriptionInvoices(subscription.id, token);
      const latestPaid = invoices
        .filter((invoice) => isPaidInvoice(invoice.status) || hasPaymentEvidence(invoice))
        .sort((a, b) => {
          const aTime = (a.paidAt ?? a.createdAt ?? a.dueAt)?.getTime() ?? 0;
          const bTime = (b.paidAt ?? b.createdAt ?? b.dueAt)?.getTime() ?? 0;
          return bTime - aTime;
        })[0];

      const baseDate =
        latestPaid?.paidAt ??
        latestPaid?.createdAt ??
        latestPaid?.dueAt ??
        (!isInactiveSubscription(subscription.status)
          ? subscription.updatedAt ?? subscription.createdAt
          : null);
      const validUntil =
        subscription.explicitValidUntil && subscription.explicitValidUntil.getTime() > now.getTime()
          ? subscription.explicitValidUntil
          : baseDate
            ? addMonths(baseDate, 12)
            : null;

      if (!baseDate && !subscription.explicitValidUntil) {
        skipped += 1;
        skippedWithoutDate += 1;
        continue;
      }

      if (!latestPaid && isInactiveSubscription(subscription.status)) {
        skipped += 1;
        skippedBlockedStatus += 1;
        continue;
      }

      if (!latestPaid && !subscription.updatedAt && !subscription.createdAt) {
        skipped += 1;
        skippedWithoutPaidInvoice += 1;
        continue;
      }

      if (!validUntil || validUntil.getTime() < now.getTime()) {
        skipped += 1;
        skippedExpired += 1;
        if (!firstExpiredDebug) {
          firstExpiredDebug = {
            subscriptionId: subscription.id,
            subscriptionStatus: subscription.status,
            subscriptionCreatedAt: subscription.createdAt?.toISOString() ?? null,
            subscriptionUpdatedAt: subscription.updatedAt?.toISOString() ?? null,
            subscriptionExplicitValidUntil: subscription.explicitValidUntil?.toISOString() ?? null,
            latestPaidId: latestPaid?.id ?? null,
            latestPaidStatus: latestPaid?.status ?? null,
            latestPaidAt: latestPaid?.paidAt?.toISOString() ?? null,
            latestInvoiceCreatedAt: latestPaid?.createdAt?.toISOString() ?? null,
            latestInvoiceDueAt: latestPaid?.dueAt?.toISOString() ?? null,
            latestInvoiceAmountPaid: latestPaid?.amountPaid ?? null,
            computedBaseDate: baseDate?.toISOString() ?? null,
            computedValidUntil: validUntil?.toISOString() ?? null,
          };
        }
        continue;
      }

      if (!latestPaid) {
        usedSubscriptionDateFallback += 1;
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
      const existingRole =
        userSnap.exists && typeof userSnap.data()?.role === "string"
          ? String(userSnap.data()?.role)
          : null;
      const planMatch = await resolvePlanMatch(subscription.productId, subscription.productTitle);

      await Promise.all([
        userRef.set(
          {
            uid,
            email: subscription.email,
            role: existingRole === "admin" ? "admin" : "student",
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
      processedEmails.add(subscription.email);
    }

    for (const candidate of eventCandidates) {
      if (!candidate.email || processedEmails.has(candidate.email)) continue;

      if (!candidate.validUntil) {
        skipped += 1;
        skippedWithoutDate += 1;
        continue;
      }

      if (candidate.validUntil.getTime() < now.getTime()) {
        skipped += 1;
        skippedExpired += 1;
        continue;
      }

      let uid = "";
      let wasCreated = false;
      try {
        const authUser = await adminAuth.getUserByEmail(candidate.email);
        uid = authUser.uid;
      } catch {
        const created = await adminAuth.createUser({
          email: candidate.email,
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
      const existingRole =
        userSnap.exists && typeof userSnap.data()?.role === "string"
          ? String(userSnap.data()?.role)
          : null;
      const planMatch = await resolvePlanMatch(candidate.productId, candidate.productTitle);

      await Promise.all([
        userRef.set(
          {
            uid,
            email: candidate.email,
            role: existingRole === "admin" ? "admin" : "student",
            name: candidate.name || null,
            updatedAt: now,
            createdAt: userSnap.exists ? userSnap.data()?.createdAt ?? now : now,
          },
          { merge: true }
        ),
        profileRef.set(
          {
            name: candidate.name || null,
            phone: candidate.phone || null,
            document: candidate.document || null,
            address: candidate.address,
            source: "eduzz",
            updatedAt: now,
          },
          { merge: true }
        ),
        entRef.set(
          {
            uid,
            email: candidate.email,
            active: true,
            pending: false,
            source: "eduzz",
            sourceDetail: "eduzz_event_import",
            planId: planMatch.planId,
            productId: candidate.productId,
            productTitle: planMatch.planTitle,
            planMatchedBy: planMatch.matchedBy,
            amountPaid: candidate.amountPaid ?? null,
            paymentMethod: candidate.paymentMethod ?? null,
            currency: candidate.currency || "BRL",
            paidAt: candidate.paidAt ?? null,
            validUntil: candidate.validUntil,
            invoiceStatus: candidate.invoiceStatus || "paid",
            invoiceId: candidate.invoiceId,
            subscriptionId: candidate.subscriptionId,
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
      processedEmails.add(candidate.email);
    }

    return NextResponse.json(
      {
        ok: true,
        scanned,
        imported,
        createdUsers,
        updatedUsers,
        skipped,
        reasons: {
          blockedStatus: skippedBlockedStatus,
          withoutPaidInvoice: skippedWithoutPaidInvoice,
          expired: skippedExpired,
          withoutDate: skippedWithoutDate,
          usedSubscriptionDateFallback,
        },
        debug: {
          firstExpired: firstExpiredDebug,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao sincronizar alunos ativos da Eduzz.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
