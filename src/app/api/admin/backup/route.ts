export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/admin/backup
 *
 * Dispara a exportação nativa do Firestore para o bucket do Firebase Storage.
 * Os arquivos ficam em: gs://<bucket>/firestore-backups/YYYY-MM-DD/
 *
 * Autenticado por CRON_SECRET (Vercel cron) ou BACKUP_SECRET (manual).
 * A exportação é assíncrona no lado do Google — essa rota só dispara e retorna.
 */

import { NextRequest, NextResponse } from "next/server";

const PROJECT_ID = process.env.FIREBASE_ADMIN_PROJECT_ID ?? "estudoquiz-e23ef";
// Bucket padrão do Firebase Storage (já existe no projeto)
const GCS_BUCKET = `gs://${PROJECT_ID}.appspot.com`;
const FIRESTORE_EXPORT_URL = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default):exportDocuments`;

// ─── Auth ─────────────────────────────────────────────────────────────────────

function isAuthorized(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ")
    ? auth.slice(7).trim()
    : req.headers.get("x-backup-key")?.trim() ?? "";

  if (!token) return false;

  const allowed = [
    process.env.CRON_SECRET,
    process.env.BACKUP_SECRET,
  ]
    .map((v) => String(v ?? "").trim())
    .filter(Boolean);

  return allowed.length > 0 && allowed.includes(token);
}

// ─── Access token via Service Account JWT ────────────────────────────────────

async function getAccessToken(): Promise<string> {
  // Usa google-auth-library que já está disponível como dep do firebase-admin
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { GoogleAuth } = require("google-auth-library") as typeof import("google-auth-library");

  const privateKey = (process.env.FIREBASE_ADMIN_PRIVATE_KEY ?? "").replace(/\\n/g, "\n");
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL ?? "";

  if (!privateKey || !clientEmail) {
    throw new Error("Credenciais do Firebase Admin não configuradas (FIREBASE_ADMIN_PRIVATE_KEY / FIREBASE_ADMIN_CLIENT_EMAIL).");
  }

  const auth = new GoogleAuth({
    credentials: { client_email: clientEmail, private_key: privateKey },
    scopes: ["https://www.googleapis.com/auth/datastore"],
  });

  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  const token = tokenResponse.token;
  if (!token) throw new Error("Não foi possível obter access token do Google.");
  return token;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }

  try {
    const dateLabel = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
    const outputUriPrefix = `${GCS_BUCKET}/firestore-backups/${dateLabel}`;

    const accessToken = await getAccessToken();

    const response = await fetch(FIRESTORE_EXPORT_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ outputUriPrefix }),
    });

    const data = await response.json() as Record<string, unknown>;

    if (!response.ok) {
      const errMsg = (data as { error?: { message?: string } }).error?.message ?? "Exportação falhou.";
      console.error("[backup] Firestore export error:", errMsg);
      return NextResponse.json({ ok: false, error: errMsg }, { status: 500 });
    }

    // data é um google.longrunning.Operation — a exportação continua em background
    console.log(`[backup] Exportação iniciada para ${outputUriPrefix}`, data.name);

    return NextResponse.json({
      ok: true,
      message: `Exportação iniciada com sucesso.`,
      outputPath: outputUriPrefix,
      operationName: data.name,
      date: dateLabel,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro inesperado ao iniciar backup.";
    console.error("[backup] Erro:", message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

// GET para verificação manual no browser (retorna status)
export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ ok: false, error: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.json({
    ok: true,
    message: "Rota de backup ativa. Use POST para iniciar uma exportação.",
    bucket: GCS_BUCKET,
    path: `${GCS_BUCKET}/firestore-backups/YYYY-MM-DD/`,
  });
}
