import { adminDb } from "@/lib/firebaseAdmin";

type RecordData = Record<string, unknown>;

export type BlingSettings = {
  enabled: boolean;
  apiBaseUrl: string;
  contactsEndpointPath: string;
  nfseEndpointPath: string;
  serviceCode: string;
  serviceDescription: string;
  serviceNature: string;
  serviceListItem: string;
  cnae: string;
  series: string;
  issRate: number | null;
  defaultComment: string;
  accessToken: string;
  refreshToken: string;
  autoCreateContact: boolean;
  updatedAt?: unknown;
  updatedBy?: string | null;
};

type BlingInvoiceInput = {
  uid: string;
  user: RecordData;
  profile: RecordData;
  entitlement: RecordData;
  invoiceCode: string;
};

type BlingInvoiceResult = {
  provider: "bling";
  providerId: string | null;
  invoiceNumber: string | null;
  status: string;
  link: string | null;
  total: number | null;
  service: string;
  requestPayload: RecordData;
  rawResponse: unknown;
};

const SETTINGS_DOC = adminDb.collection("system_settings").doc("bling");
const DEFAULT_API_BASE = "https://api.bling.com.br";
const DEFAULT_CONTACTS_PATH = "/Api/v3/contatos";
const DEFAULT_CALLBACK_PATH = "/api/admin/configuracoes/bling/oauth/callback";

function pickString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function pickNumber(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(",", ".").trim());
    if (Number.isFinite(parsed)) return parsed;
  }
  return null;
}

function normalizeBool(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function normalizePath(value: string, fallback = "") {
  const path = value.trim();
  if (!path) return fallback;
  return path.startsWith("/") ? path : `/${path}`;
}

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}${normalizePath(path)}`;
}

function requiredEnv(name: string) {
  const value = pickString(process.env[name]);
  if (!value) {
    throw new Error(`Missing env var: ${name}`);
  }
  return value;
}

function getAddressSource(profile: RecordData, user: RecordData, entitlement: RecordData) {
  const profileAddress =
    typeof profile.address === "object" && profile.address !== null
      ? (profile.address as RecordData)
      : {};
  const userAddress =
    typeof user.address === "object" && user.address !== null
      ? (user.address as RecordData)
      : {};
  const entAddress =
    typeof entitlement.address === "object" && entitlement.address !== null
      ? (entitlement.address as RecordData)
      : {};

  const merged = {
    street:
      pickString(profileAddress.street) ||
      pickString((profile as RecordData).street) ||
      pickString(userAddress.street) ||
      pickString(entAddress.street),
    number:
      pickString(profileAddress.number) ||
      pickString((profile as RecordData).number) ||
      pickString(userAddress.number) ||
      pickString(entAddress.number),
    complement:
      pickString(profileAddress.complement) ||
      pickString((profile as RecordData).complement) ||
      pickString(userAddress.complement) ||
      pickString(entAddress.complement),
    neighborhood:
      pickString(profileAddress.neighborhood) ||
      pickString((profile as RecordData).neighborhood) ||
      pickString(userAddress.neighborhood) ||
      pickString(entAddress.neighborhood),
    city:
      pickString(profileAddress.city) ||
      pickString((profile as RecordData).city) ||
      pickString(userAddress.city) ||
      pickString(entAddress.city),
    state:
      pickString(profileAddress.state) ||
      pickString((profile as RecordData).state) ||
      pickString(userAddress.state) ||
      pickString(entAddress.state),
    zipCode:
      pickString(profileAddress.zipCode) ||
      pickString((profile as RecordData).zipCode) ||
      pickString(userAddress.zipCode) ||
      pickString(entAddress.zipCode),
    country:
      pickString(profileAddress.country) ||
      pickString((profile as RecordData).country) ||
      pickString(userAddress.country) ||
      pickString(entAddress.country) ||
      "Brasil",
  };

  return merged;
}

function ensureRequiredAddress(address: ReturnType<typeof getAddressSource>) {
  if (!address.street || !address.city || !address.state || !address.zipCode) {
    throw new Error(
      "Endereço incompleto para emitir a nota. Preencha rua, cidade, estado e CEP no cadastro do aluno."
    );
  }
}

async function readSettingsDoc() {
  const snap = await SETTINGS_DOC.get();
  const data = snap.exists ? (snap.data() as RecordData) : {};

  return {
    enabled: normalizeBool(data.enabled, false),
    apiBaseUrl: pickString(data.apiBaseUrl) || DEFAULT_API_BASE,
    contactsEndpointPath:
      normalizePath(pickString(data.contactsEndpointPath), DEFAULT_CONTACTS_PATH) ||
      DEFAULT_CONTACTS_PATH,
    nfseEndpointPath: normalizePath(pickString(data.nfseEndpointPath), ""),
    serviceCode: pickString(data.serviceCode),
    serviceDescription: pickString(data.serviceDescription),
    serviceNature: pickString(data.serviceNature),
    serviceListItem: pickString(data.serviceListItem),
    cnae: pickString(data.cnae),
    series: pickString(data.series),
    issRate: pickNumber(data.issRate),
    defaultComment: pickString(data.defaultComment),
    accessToken: pickString(data.accessToken) || pickString(process.env.BLING_ACCESS_TOKEN),
    refreshToken: pickString(data.refreshToken) || pickString(process.env.BLING_REFRESH_TOKEN),
    autoCreateContact: normalizeBool(data.autoCreateContact, false),
    updatedAt: data.updatedAt ?? null,
    updatedBy: pickString(data.updatedBy) || null,
  } satisfies BlingSettings;
}

export async function getBlingSettingsSummary() {
  const settings = await readSettingsDoc();
  return {
    ...settings,
    accessToken: "",
    refreshToken: "",
    hasAccessToken: Boolean(settings.accessToken),
    hasRefreshToken: Boolean(settings.refreshToken),
    hasClientCredentials: Boolean(
      pickString(process.env.BLING_CLIENT_ID) && pickString(process.env.BLING_CLIENT_SECRET)
    ),
  };
}

export async function updateBlingSettings(
  input: Partial<Omit<BlingSettings, "issRate">> & {
    issRate?: unknown;
    accessToken?: string;
    refreshToken?: string;
  },
  adminUid: string
) {
  const payload: RecordData = {
    enabled: normalizeBool(input.enabled, false),
    apiBaseUrl: pickString(input.apiBaseUrl) || DEFAULT_API_BASE,
    contactsEndpointPath:
      normalizePath(pickString(input.contactsEndpointPath), DEFAULT_CONTACTS_PATH) ||
      DEFAULT_CONTACTS_PATH,
    nfseEndpointPath: normalizePath(pickString(input.nfseEndpointPath), ""),
    serviceCode: pickString(input.serviceCode),
    serviceDescription: pickString(input.serviceDescription),
    serviceNature: pickString(input.serviceNature),
    serviceListItem: pickString(input.serviceListItem),
    cnae: pickString(input.cnae),
    series: pickString(input.series),
    issRate: pickNumber(input.issRate),
    defaultComment: pickString(input.defaultComment),
    autoCreateContact: normalizeBool(input.autoCreateContact, false),
    updatedAt: new Date(),
    updatedBy: adminUid,
  };

  const nextAccessToken = pickString(input.accessToken);
  const nextRefreshToken = pickString(input.refreshToken);

  if (nextAccessToken) payload.accessToken = nextAccessToken;
  if (nextRefreshToken) payload.refreshToken = nextRefreshToken;

  await SETTINGS_DOC.set(payload, { merge: true });
}

async function refreshBlingAccessToken(settings: BlingSettings) {
  const clientId = pickString(process.env.BLING_CLIENT_ID);
  const clientSecret = pickString(process.env.BLING_CLIENT_SECRET);

  if (!settings.refreshToken || !clientId || !clientSecret) {
    throw new Error(
      "Acesso ao Bling expirado. Configure BLING_CLIENT_ID/BLING_CLIENT_SECRET e salve um refresh token."
    );
  }

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: settings.refreshToken,
  });

  const res = await fetch("https://www.bling.com.br/Api/v3/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as RecordData;

  if (!res.ok) {
    const msg =
      pickString(data.error_description) || pickString(data.error) || "Falha ao renovar o token do Bling.";
    throw new Error(msg);
  }

  const accessToken = pickString(data.access_token);
  const refreshToken = pickString(data.refresh_token) || settings.refreshToken;

  if (!accessToken) {
    throw new Error("O Bling não retornou um access token válido.");
  }

  await SETTINGS_DOC.set(
    {
      accessToken,
      refreshToken,
      updatedAt: new Date(),
    },
    { merge: true }
  );

  return {
    ...settings,
    accessToken,
    refreshToken,
  };
}

export function resolveBlingRedirectUri(origin: string) {
  const envRedirect = pickString(process.env.BLING_REDIRECT_URI);
  if (envRedirect) return envRedirect;
  return `${origin.replace(/\/+$/, "")}${DEFAULT_CALLBACK_PATH}`;
}

export function buildBlingAuthorizeUrl(origin: string, state: string) {
  const clientId = requiredEnv("BLING_CLIENT_ID");
  const redirectUri = resolveBlingRedirectUri(origin);
  const params = new URLSearchParams({
    response_type: "code",
    client_id: clientId,
    redirect_uri: redirectUri,
    state,
  });

  return `https://www.bling.com.br/Api/v3/oauth/authorize?${params.toString()}`;
}

export async function exchangeBlingAuthorizationCode(code: string, origin: string) {
  const clientId = requiredEnv("BLING_CLIENT_ID");
  const clientSecret = requiredEnv("BLING_CLIENT_SECRET");
  const redirectUri = resolveBlingRedirectUri(origin);
  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirectUri,
  });

  const res = await fetch("https://www.bling.com.br/Api/v3/oauth/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
      "enable-jwt": "1",
    },
    body,
  });

  const data = (await res.json().catch(() => ({}))) as RecordData;

  if (!res.ok) {
    const msg =
      pickString(data.error_description) || pickString(data.error) || "Falha ao autorizar o app do Bling.";
    throw new Error(msg);
  }

  const accessToken = pickString(data.access_token);
  const refreshToken = pickString(data.refresh_token);

  if (!accessToken || !refreshToken) {
    throw new Error("O Bling não retornou access token e refresh token válidos.");
  }

  return {
    accessToken,
    refreshToken,
    expiresIn: pickNumber(data.expires_in),
    scope: pickString(data.scope),
  };
}

function extractBlingError(data: unknown) {
  if (!data || typeof data !== "object") return "";
  const obj = data as RecordData;

  return (
    pickString(obj.message) ||
    pickString(obj.error?.toString()) ||
    pickString(obj.description) ||
    (Array.isArray(obj.errors)
      ? obj.errors
          .map((item) =>
            typeof item === "string"
              ? item
              : typeof item === "object" && item !== null
                ? pickString((item as RecordData).message) || JSON.stringify(item)
                : ""
          )
          .filter(Boolean)
          .join(" | ")
      : "")
  );
}

async function blingRequest(
  settings: BlingSettings,
  path: string,
  init: RequestInit
) {
  const attempt = async (token: string) => {
    const res = await fetch(joinUrl(settings.apiBaseUrl, path), {
      ...init,
      headers: {
        Accept: "application/json",
        ...(init.headers ?? {}),
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json().catch(() => null);
    return { res, data };
  };

  let currentSettings = settings;
  let token = currentSettings.accessToken;

  if (!token) {
    currentSettings = await refreshBlingAccessToken(currentSettings);
    token = currentSettings.accessToken;
  }

  let { res, data } = await attempt(token);

  if (res.status === 401 && currentSettings.refreshToken) {
    currentSettings = await refreshBlingAccessToken(currentSettings);
    ({ res, data } = await attempt(currentSettings.accessToken));
  }

  if (!res.ok) {
    const msg = extractBlingError(data) || "O Bling recusou a requisição.";
    throw new Error(msg);
  }

  return data;
}

async function syncBlingContactBestEffort(
  settings: BlingSettings,
  input: BlingInvoiceInput,
  address: ReturnType<typeof getAddressSource>
) {
  if (!settings.autoCreateContact || !settings.contactsEndpointPath) return;

  const payload = {
    nome:
      pickString(input.profile.name) || pickString(input.user.name) || pickString(input.entitlement.name),
    codigo: input.uid,
    email: pickString(input.user.email) || pickString(input.entitlement.email),
    telefone:
      pickString(input.profile.phone) ||
      pickString(input.profile.cellphone) ||
      pickString(input.user.phone),
    celular:
      pickString(input.profile.cellphone) ||
      pickString(input.profile.phone) ||
      pickString(input.user.phone),
    numeroDocumento:
      pickString(input.profile.document) ||
      pickString(input.user.document) ||
      pickString(input.entitlement.document),
    endereco: {
      geral: {
        endereco: address.street,
        numero: address.number,
        complemento: address.complement,
        bairro: address.neighborhood,
        municipio: address.city,
        uf: address.state,
        cep: address.zipCode,
        pais: address.country,
      },
    },
  };

  try {
    await blingRequest(settings, settings.contactsEndpointPath, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch {
    // Não bloqueia a emissão da nota se o sync de contato falhar.
  }
}

function buildInvoicePayload(
  settings: BlingSettings,
  input: BlingInvoiceInput,
  address: ReturnType<typeof getAddressSource>
) {
  const total = pickNumber(input.entitlement.amountPaid);
  const serviceTitle =
    settings.serviceDescription ||
    pickString(input.entitlement.productTitle) ||
    "Assinatura da plataforma";
  const customerName =
    pickString(input.profile.name) ||
    pickString(input.user.name) ||
    pickString(input.entitlement.name) ||
    "Aluno";
  const document =
    pickString(input.profile.document) ||
    pickString(input.user.document) ||
    pickString(input.entitlement.document);

  if (!customerName || !document || total == null) {
    throw new Error(
      "Dados insuficientes para emitir a nota. Verifique nome, documento e valor da fatura."
    );
  }

  ensureRequiredAddress(address);

  const commentBase = settings.defaultComment || "Nota gerada manualmente pelo gestor admin.";

  return {
    referenciaExterna: input.invoiceCode,
    dataEmissao: new Date().toISOString(),
    naturezaOperacao: settings.serviceNature || undefined,
    serie: settings.series || undefined,
    observacoes: commentBase,
    contato: {
      nome: customerName,
      email: pickString(input.user.email) || pickString(input.entitlement.email),
      numeroDocumento: document,
      telefone:
        pickString(input.profile.phone) ||
        pickString(input.profile.cellphone) ||
        pickString(input.user.phone),
      endereco: {
        logradouro: address.street,
        numero: address.number,
        complemento: address.complement,
        bairro: address.neighborhood,
        cidade: address.city,
        uf: address.state,
        cep: address.zipCode,
        pais: address.country,
      },
    },
    servico: {
      codigo: settings.serviceCode || undefined,
      itemListaServico: settings.serviceListItem || undefined,
      descricao: serviceTitle,
      cnae: settings.cnae || undefined,
      aliquotaIss: settings.issRate ?? undefined,
      valor: total,
      quantidade: 1,
    },
    itens: [
      {
        codigo: pickString(input.entitlement.productId) || undefined,
        descricao: serviceTitle,
        valor: total,
        quantidade: 1,
      },
    ],
  };
}

function extractInvoiceMeta(data: unknown, total: number | null, fallbackService: string) {
  if (!data || typeof data !== "object") {
    return {
      providerId: null,
      invoiceNumber: null,
      status: "emitida",
      link: null,
      total,
      service: fallbackService,
      rawResponse: data,
    };
  }

  const obj = data as RecordData;
  const nested =
    (typeof obj.data === "object" && obj.data !== null ? (obj.data as RecordData) : null) ||
    (typeof obj.retorno === "object" && obj.retorno !== null ? (obj.retorno as RecordData) : null) ||
    obj;

  const providerId =
    pickString(nested.id) ||
    pickString(nested.codigo) ||
    pickString(nested.numeroRecibo) ||
    null;
  const invoiceNumber =
    pickString(nested.numero) ||
    pickString(nested.numeroNota) ||
    pickString(nested.numeroDocumento) ||
    providerId;
  const status =
    pickString(nested.status) || pickString(nested.situacao) || "emitida";
  const link =
    pickString(nested.link) || pickString(nested.url) || pickString(nested.linkPDF) || null;

  return {
    providerId,
    invoiceNumber,
    status,
    link,
    total,
    service: fallbackService,
    rawResponse: data,
  };
}

export async function generateBlingServiceInvoice(
  input: BlingInvoiceInput
): Promise<BlingInvoiceResult> {
  const settings = await readSettingsDoc();

  if (!settings.enabled) {
    throw new Error("A integração com o Bling está desativada em Configurações.");
  }

  if (!settings.nfseEndpointPath) {
    throw new Error(
      "Configure o endpoint de NFS-e do Bling em Configurações antes de gerar a nota."
    );
  }

  const address = getAddressSource(input.profile, input.user, input.entitlement);
  await syncBlingContactBestEffort(settings, input, address);

  const requestPayload = buildInvoicePayload(settings, input, address);
  const rawResponse = await blingRequest(settings, settings.nfseEndpointPath, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestPayload),
  });

  const total = pickNumber(input.entitlement.amountPaid);
  const service = settings.serviceDescription || pickString(input.entitlement.productTitle) || "Assinatura";
  const meta = extractInvoiceMeta(rawResponse, total, service);

  return {
    provider: "bling",
    ...meta,
    requestPayload,
  };
}
