"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";

type AlunoForm = {
  uid: string;
  email: string;
  password: string;
  confirmPassword: string;
  profile: {
    name: string;
    document: string;
    phone: string;
    cellphone: string;
    address: {
      street: string;
      number: string;
      neighborhood: string;
      complement: string;
      zipCode: string;
      city: string;
      state: string;
    };
  };
};

const ESTADOS = [
  "Acre",
  "Alagoas",
  "Amapá",
  "Amazonas",
  "Bahia",
  "Ceará",
  "Distrito Federal",
  "Espírito Santo",
  "Goiás",
  "Maranhão",
  "Mato Grosso",
  "Mato Grosso do Sul",
  "Minas Gerais",
  "Pará",
  "Paraíba",
  "Paraná",
  "Pernambuco",
  "Piauí",
  "Rio de Janeiro",
  "Rio Grande do Norte",
  "Rio Grande do Sul",
  "Rondônia",
  "Roraima",
  "Santa Catarina",
  "São Paulo",
  "Sergipe",
  "Tocantins",
];

const ESTADO_POR_UF: Record<string, string> = {
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

const ESTADO_NORMALIZADO_MAP = new Map(
  ESTADOS.map((estado) => [
    estado
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase(),
    estado,
  ])
);

function normalizeEstado(value: unknown) {
  const raw = String(value ?? "").trim();
  if (!raw) return "";

  const upper = raw.toUpperCase();
  if (ESTADO_POR_UF[upper]) {
    return ESTADO_POR_UF[upper];
  }

  const normalized = raw
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  return ESTADO_NORMALIZADO_MAP.get(normalized) || raw;
}

function Field({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
      />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-slate-200 pt-6 first:border-t-0 first:pt-0">
      <div className="mb-5 text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
        {children}
      </div>
    </div>
  );
}

export default function EditarAlunoPage() {
  const params = useParams<{ uid: string }>();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<AlunoForm>({
    uid: "",
    email: "",
    password: "",
    confirmPassword: "",
    profile: {
      name: "",
      document: "",
      phone: "",
      cellphone: "",
      address: {
        street: "",
        number: "",
        neighborhood: "",
        complement: "",
        zipCode: "",
        city: "",
        state: "",
      },
    },
  });

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const token = await auth.currentUser?.getIdToken();
        if (!token) {
          throw new Error("Sessão inválida. Faça login novamente.");
        }

        const res = await fetch(`/api/admin/alunos/${params.uid}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        const data = (await res.json()) as {
          ok: boolean;
          error?: string;
          aluno?: {
            uid: string;
            user?: Record<string, unknown>;
            profile?: Record<string, unknown>;
          };
        };

        if (!res.ok || !data.ok || !data.aluno) {
          throw new Error(data.error || "Não foi possível carregar o aluno.");
        }

        const user = data.aluno.user ?? {};
        const profile = data.aluno.profile ?? {};
        const address = (profile.address ?? {}) as Record<string, unknown>;

        if (!active) return;

        setForm({
          uid: data.aluno.uid,
          email: String(user.email ?? ""),
          password: "",
          confirmPassword: "",
          profile: {
            name: String(profile.name ?? ""),
            document: String(profile.document ?? ""),
            phone: String(profile.phone ?? ""),
            cellphone: String(profile.cellphone ?? profile.phone ?? ""),
            address: {
              street: String(address.street ?? profile.street ?? ""),
              number: String(address.number ?? profile.number ?? ""),
              neighborhood: String(address.neighborhood ?? profile.neighborhood ?? ""),
              complement: String(address.complement ?? profile.complement ?? ""),
              zipCode: String(address.zipCode ?? profile.zipCode ?? ""),
              city: String(address.city ?? profile.city ?? ""),
              state: normalizeEstado(address.state ?? profile.state ?? ""),
            },
          },
        });
      } catch (error) {
        if (active) {
          setErrorMsg(error instanceof Error ? error.message : "Erro ao carregar aluno.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, [params.uid]);

  const canSave = useMemo(() => {
    if (saving) return false;
    if (!form.email.trim() || !form.profile.name.trim()) return false;
    if (form.password || form.confirmPassword) {
      return form.password.length >= 6 && form.password === form.confirmPassword;
    }
    return true;
  }, [form, saving]);

  const patchProfile = (patch: Partial<AlunoForm["profile"]>) => {
    setForm((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        ...patch,
      },
    }));
  };

  const patchAddress = (patch: Partial<AlunoForm["profile"]["address"]>) => {
    setForm((prev) => ({
      ...prev,
      profile: {
        ...prev.profile,
        address: {
          ...prev.profile.address,
          ...patch,
        },
      },
    }));
  };

  const onSave = async () => {
    if (!canSave) return;

    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) {
        throw new Error("Sessão inválida. Faça login novamente.");
      }

      const res = await fetch(`/api/admin/alunos/${params.uid}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          profile: {
            name: form.profile.name,
            document: form.profile.document,
            phone: form.profile.phone,
            cellphone: form.profile.cellphone,
            address: form.profile.address,
          },
        }),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível salvar o aluno.");
      }

      setForm((prev) => ({
        ...prev,
        password: "",
        confirmPassword: "",
      }));
      setSuccessMsg("Aluno atualizado com sucesso.");
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao salvar aluno.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Editar aluno"
      subtitle={form.uid ? `Aluno ${form.uid}` : "Carregando dados do aluno"}
      actions={
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => router.push("/admin/alunos")}>
            Voltar
          </Button>
          <Button variant="primary" size="sm" onClick={onSave} disabled={!canSave}>
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      }
    >
      <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        {loading ? (
          <div className="text-sm text-slate-500">Carregando...</div>
        ) : (
          <div className="space-y-6">
            {errorMsg ? (
              <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                {errorMsg}
              </div>
            ) : null}

            {successMsg ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                {successMsg}
              </div>
            ) : null}

            <SectionTitle>Informação principal</SectionTitle>
            <div className="grid gap-4 md:grid-cols-1">
              <Field
                label="Nome"
                value={form.profile.name}
                onChange={(value) => patchProfile({ name: value })}
                placeholder="Nome completo do aluno"
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="CPF"
                value={form.profile.document}
                onChange={(value) => patchProfile({ document: value })}
                placeholder="000.000.000-00"
              />
              <Field
                label="Celular"
                value={form.profile.cellphone}
                onChange={(value) => patchProfile({ cellphone: value })}
                placeholder="(00) 9 9999-9999"
              />
              <Field
                label="Telefone"
                value={form.profile.phone}
                onChange={(value) => patchProfile({ phone: value })}
                placeholder="(00) 9999-9999"
              />
            </div>

            <SectionTitle>Localização</SectionTitle>
            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(180px,1fr)]">
              <Field
                label="Endereço"
                value={form.profile.address.street}
                onChange={(value) => patchAddress({ street: value })}
              />
              <Field
                label="Número"
                value={form.profile.address.number}
                onChange={(value) => patchAddress({ number: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_minmax(220px,1fr)]">
              <Field
                label="Bairro"
                value={form.profile.address.neighborhood}
                onChange={(value) => patchAddress({ neighborhood: value })}
              />
              <Field
                label="Complemento"
                value={form.profile.address.complement}
                onChange={(value) => patchAddress({ complement: value })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="CEP"
                value={form.profile.address.zipCode}
                onChange={(value) => patchAddress({ zipCode: value })}
              />
              <Field
                label="Cidade"
                value={form.profile.address.city}
                onChange={(value) => patchAddress({ city: value })}
              />

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                  Estado
                </div>
                <select
                  value={form.profile.address.state}
                  onChange={(e) => patchAddress({ state: e.target.value })}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
                >
                  <option value="">Selecione</option>
                  {ESTADOS.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <SectionTitle>Dados de acesso</SectionTitle>
            <div className="grid gap-4 md:grid-cols-3">
              <Field
                label="Email"
                value={form.email}
                onChange={(value) => setForm((prev) => ({ ...prev, email: value }))}
                type="email"
                placeholder="aluno@exemplo.com"
              />
              <Field
                label="Senha"
                value={form.password}
                onChange={(value) => setForm((prev) => ({ ...prev, password: value }))}
                type="password"
                placeholder="Nova senha (opcional)"
              />
              <Field
                label="Confirmar senha"
                value={form.confirmPassword}
                onChange={(value) => setForm((prev) => ({ ...prev, confirmPassword: value }))}
                type="password"
                placeholder="Repita a senha"
              />
            </div>

            {(form.password || form.confirmPassword) && form.password !== form.confirmPassword ? (
              <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
                As senhas precisam ser idênticas.
              </div>
            ) : null}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
