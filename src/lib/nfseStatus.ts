import { adminDb } from "@/lib/firebaseAdmin";
import { secondsFromUnknown } from "@/lib/dateValue";
import { createBlingNfseStatusReader, type BlingNfseSnapshot, type NfseStatus } from "@/lib/bling";

/**
 * Situacao real das NFS-e.
 *
 * Gerar a nota pelo admin so a cria no Bling. Ela continua "pendente" ate ser
 * transmitida e aceita pela prefeitura / ambiente nacional, e pode ser
 * rejeitada sem que o admin fique sabendo. Este modulo consulta a situacao no
 * Bling, grava em billing_records/{uid}.invoices[] e resume o que esta aberto.
 */

type InvoiceRecord = Record<string, unknown>;

export type InvoiceNfseStatus = NfseStatus | "nao_verificada";

/** Situacoes que nao mudam mais sozinhas: o cron nao volta a consultar. */
const FINAL_STATUSES = new Set<InvoiceNfseStatus>(["autorizada", "cancelada", "nao_encontrada"]);

/** Nota pendente ha mais tempo que isto vira alerta de atraso. */
const OVERDUE_SECONDS = 24 * 60 * 60;

function pickString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function legacyStatusIsCanceled(invoice: InvoiceRecord) {
  const normalized = pickString(invoice.status).toLowerCase();
  return normalized.includes("cancel") || normalized === "3";
}

export function isBlingInvoice(invoice: InvoiceRecord) {
  return pickString(invoice.provider).toLowerCase() === "bling";
}

export function invoiceNfseStatus(invoice: InvoiceRecord): InvoiceNfseStatus {
  const stored = pickString(invoice.nfseStatus) as InvoiceNfseStatus;
  if (stored) return stored;
  if (legacyStatusIsCanceled(invoice)) return "cancelada";
  return "nao_verificada";
}

/** Nota do Bling que ainda precisa de acompanhamento. */
export function isOpenInvoice(invoice: InvoiceRecord) {
  return isBlingInvoice(invoice) && !FINAL_STATUSES.has(invoiceNfseStatus(invoice));
}

function invoiceBlingId(invoice: InvoiceRecord) {
  return pickString(invoice.providerId) || pickString(invoice.id);
}

function snapshotPatch(snapshot: BlingNfseSnapshot, now: Date): InvoiceRecord {
  return {
    nfseStatus: snapshot.nfseStatus,
    nfseSituacaoRaw: snapshot.nfseSituacaoRaw,
    nfseNumber: snapshot.nfseNumber,
    nfseCheckedAt: now,
    nfseError: null,
    ...(snapshot.nfseLink ? { link: snapshot.nfseLink } : {}),
    ...(snapshot.nfseIssueDate ? { nfseIssueDate: snapshot.nfseIssueDate } : {}),
    // O campo antigo `status` libera a geracao de outra nota quando contem
    // "cancel"; mantemos isso coerente com a situacao real.
    ...(snapshot.nfseStatus === "cancelada" ? { status: "cancelada" } : {}),
  };
}

/** Aplica os patches por id de nota, relendo o documento para nao perder escritas concorrentes. */
async function applyInvoicePatches(uid: string, patches: Map<string, InvoiceRecord>) {
  if (patches.size === 0) return [] as InvoiceRecord[];
  const ref = adminDb.collection("billing_records").doc(uid);

  return adminDb.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const invoices = ensureArray<InvoiceRecord>(snap.data()?.invoices);
    const next = invoices.map((invoice) => {
      const patch = patches.get(pickString(invoice.id));
      return patch ? { ...invoice, ...patch } : invoice;
    });
    tx.set(ref, { invoices: next }, { merge: true });
    return next;
  });
}

type ReadStatus = Awaited<ReturnType<typeof createBlingNfseStatusReader>>;

async function checkInvoice(readStatus: ReadStatus, invoice: InvoiceRecord, now: Date) {
  try {
    const snapshot = await readStatus(invoiceBlingId(invoice));
    return { patch: snapshotPatch(snapshot, now), status: snapshot.nfseStatus as InvoiceNfseStatus, error: null };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Falha ao consultar o Bling.";
    return {
      // Falha de consulta nao muda a situacao conhecida, so registra o erro.
      patch: { nfseCheckedAt: now, nfseError: message.slice(0, 300) } as InvoiceRecord,
      status: null,
      error: message,
    };
  }
}

/** Consulta no Bling todas as notas de um aluno (inclusive as ja autorizadas). */
export async function refreshUserNfseStatuses(uid: string) {
  const snap = await adminDb.collection("billing_records").doc(uid).get();
  const invoices = ensureArray<InvoiceRecord>(snap.data()?.invoices).filter(isBlingInvoice);
  if (invoices.length === 0) return { checked: 0, errors: [] as string[], invoices: [] as InvoiceRecord[] };

  const readStatus = await createBlingNfseStatusReader();
  const now = new Date();
  const patches = new Map<string, InvoiceRecord>();
  const errors: string[] = [];

  for (const invoice of invoices) {
    const result = await checkInvoice(readStatus, invoice, now);
    patches.set(pickString(invoice.id), result.patch);
    if (result.error) errors.push(result.error);
  }

  const updated = await applyInvoicePatches(uid, patches);
  return { checked: invoices.length, errors, invoices: updated };
}

export type NfseSyncSummary = {
  candidates: number;
  checked: number;
  autorizadas: number;
  pendentes: number;
  canceladas: number;
  naoEncontradas: number;
  erros: number;
  firstError: string | null;
};

/**
 * Consulta as notas em aberto de todos os alunos, das verificadas ha mais
 * tempo para as mais recentes. `limit` mantem a execucao dentro do tempo da
 * funcao e do limite de 3 requisicoes por segundo do Bling.
 */
export async function syncOpenNfseStatuses(options: { limit?: number; delayMs?: number } = {}) {
  const limit = options.limit ?? 30;
  const delayMs = options.delayMs ?? 350;
  const summary: NfseSyncSummary = {
    candidates: 0,
    checked: 0,
    autorizadas: 0,
    pendentes: 0,
    canceladas: 0,
    naoEncontradas: 0,
    erros: 0,
    firstError: null,
  };

  const billingSnap = await adminDb.collection("billing_records").get();
  const queue: { uid: string; invoice: InvoiceRecord; checkedAt: number }[] = [];
  billingSnap.docs.forEach((docSnap) => {
    ensureArray<InvoiceRecord>(docSnap.data().invoices).forEach((invoice) => {
      if (!isOpenInvoice(invoice)) return;
      queue.push({ uid: docSnap.id, invoice, checkedAt: secondsFromUnknown(invoice.nfseCheckedAt) });
    });
  });
  summary.candidates = queue.length;
  if (queue.length === 0) return summary;

  // Nunca verificadas (0) primeiro, depois as verificadas ha mais tempo.
  queue.sort((a, b) => a.checkedAt - b.checkedAt);
  const batch = queue.slice(0, limit);

  const readStatus = await createBlingNfseStatusReader();
  const now = new Date();
  const patchesByUid = new Map<string, Map<string, InvoiceRecord>>();

  for (let i = 0; i < batch.length; i += 1) {
    const { uid, invoice } = batch[i]!;
    if (i > 0 && delayMs > 0) await new Promise((resolve) => setTimeout(resolve, delayMs));

    const result = await checkInvoice(readStatus, invoice, now);
    summary.checked += 1;
    if (result.error) {
      summary.erros += 1;
      summary.firstError ??= result.error;
    } else if (result.status === "autorizada") summary.autorizadas += 1;
    else if (result.status === "cancelada") summary.canceladas += 1;
    else if (result.status === "nao_encontrada") summary.naoEncontradas += 1;
    else summary.pendentes += 1;

    const userPatches = patchesByUid.get(uid) ?? new Map<string, InvoiceRecord>();
    userPatches.set(pickString(invoice.id), result.patch);
    patchesByUid.set(uid, userPatches);
  }

  for (const [uid, patches] of patchesByUid) {
    await applyInvoicePatches(uid, patches);
  }

  return summary;
}

export type NfseAlertItem = {
  uid: string;
  aluno: string;
  invoiceNumber: string;
  total: number | null;
  createdAtSeconds: number;
  nfseStatus: InvoiceNfseStatus;
  overdue: boolean;
  checkedAtSeconds: number;
  error: string | null;
};

export type NfseAlertSummary = {
  /** Notas criadas no Bling e ainda nao autorizadas. */
  abertas: number;
  /** Das abertas, as criadas ha mais de 24 horas. */
  atrasadas: number;
  /** Das abertas, as que nunca foram consultadas no Bling. */
  naoVerificadas: number;
  lastCheckedAtSeconds: number;
  items: NfseAlertItem[];
};

/** Resumo so com leitura do Firestore: barato o bastante para o dashboard. */
export async function getNfseAlertSummary(maxItems = 20): Promise<NfseAlertSummary> {
  const billingSnap = await adminDb.collection("billing_records").get();
  const nowSeconds = Math.floor(Date.now() / 1000);
  const items: NfseAlertItem[] = [];
  let lastCheckedAtSeconds = 0;

  billingSnap.docs.forEach((docSnap) => {
    ensureArray<InvoiceRecord>(docSnap.data().invoices).forEach((invoice) => {
      if (!isBlingInvoice(invoice)) return;
      const checkedAtSeconds = secondsFromUnknown(invoice.nfseCheckedAt);
      lastCheckedAtSeconds = Math.max(lastCheckedAtSeconds, checkedAtSeconds);
      if (!isOpenInvoice(invoice)) return;

      const createdAtSeconds = secondsFromUnknown(invoice.createdAt);
      items.push({
        uid: docSnap.id,
        aluno: "",
        invoiceNumber: pickString(invoice.invoiceNumber) || pickString(invoice.id),
        total: typeof invoice.total === "number" ? invoice.total : null,
        createdAtSeconds,
        nfseStatus: invoiceNfseStatus(invoice),
        overdue: createdAtSeconds > 0 && nowSeconds - createdAtSeconds > OVERDUE_SECONDS,
        checkedAtSeconds,
        error: pickString(invoice.nfseError) || null,
      });
    });
  });

  // Mais antigas primeiro: sao as que mais pesam no fechamento do mes.
  items.sort((a, b) => a.createdAtSeconds - b.createdAtSeconds);
  const visible = items.slice(0, maxItems);

  await Promise.all(
    visible.map(async (item) => {
      const userRef = adminDb.collection("users").doc(item.uid);
      const [profileSnap, userSnap] = await Promise.all([
        userRef.collection("profile").doc("main").get(),
        userRef.get(),
      ]);
      item.aluno =
        pickString(profileSnap.data()?.name) || pickString(userSnap.data()?.name) || "Aluno sem nome";
    })
  );

  return {
    abertas: items.length,
    atrasadas: items.filter((item) => item.overdue).length,
    naoVerificadas: items.filter((item) => item.nfseStatus === "nao_verificada").length,
    lastCheckedAtSeconds,
    items: visible,
  };
}
