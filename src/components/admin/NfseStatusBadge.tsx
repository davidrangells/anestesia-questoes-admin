"use client";

import { Badge } from "@/components/ui/Badge";

/** Situacao real da NFS-e na prefeitura (ver src/lib/nfseStatus.ts). */
export type NfseStatusValue =
  | "pendente"
  | "autorizada"
  | "cancelada"
  | "nao_encontrada"
  | "desconhecido"
  | "nao_verificada";

const LABELS: Record<NfseStatusValue, { label: string; tone: "emerald" | "amber" | "red" | "slate"; hint: string }> = {
  autorizada: {
    label: "Autorizada",
    tone: "emerald",
    hint: "A prefeitura aceitou a nota.",
  },
  pendente: {
    label: "Pendente na prefeitura",
    tone: "amber",
    hint: "A nota existe no Bling, mas ainda não foi autorizada. Envie-a no Bling e confira se houve rejeição.",
  },
  nao_verificada: {
    label: "Não verificada",
    tone: "amber",
    hint: "A situação desta nota ainda não foi consultada no Bling.",
  },
  cancelada: {
    label: "Cancelada",
    tone: "slate",
    hint: "A nota foi cancelada no Bling.",
  },
  nao_encontrada: {
    label: "Não encontrada no Bling",
    tone: "red",
    hint: "A nota não existe mais no Bling. Pode ter sido excluída.",
  },
  desconhecido: {
    label: "Situação desconhecida",
    tone: "amber",
    hint: "O Bling devolveu uma situação que o admin não reconhece. Confira a nota no Bling.",
  },
};

export function nfseStatusLabel(status: string | null | undefined) {
  return LABELS[(status || "nao_verificada") as NfseStatusValue]?.label ?? LABELS.desconhecido.label;
}

export function NfseStatusBadge({ status }: { status: string | null | undefined }) {
  const entry = LABELS[(status || "nao_verificada") as NfseStatusValue] ?? LABELS.desconhecido;
  return (
    <Badge tone={entry.tone} title={entry.hint}>
      {entry.label}
    </Badge>
  );
}
