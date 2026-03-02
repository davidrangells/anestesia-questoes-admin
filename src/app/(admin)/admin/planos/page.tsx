"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { auth } from "@/lib/firebase";

type Plano = {
  id: string;
  code?: string | null;
  title?: string | null;
  productId?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  moderation?: string | null;
  paymentType?: string | null;
  source?: "manual" | "eduzz";
  status?: "ativo" | "inativo";
  price?: number | null;
  currency?: string | null;
  lastSyncedAt?: unknown;
};

type PlanoForm = {
  code: string;
  title: string;
  productId: string;
  description: string;
  imageUrl: string;
  moderation: string;
  paymentType: string;
  source: "manual" | "eduzz";
  status: "ativo" | "inativo";
  price: string;
};

function formatCurrency(value: number | null | undefined, currency = "BRL") {
  if (value == null || !Number.isFinite(Number(value))) return "—";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(Number(value));
}

function formatDate(value: unknown) {
  const seconds =
    typeof value === "object" && value !== null && "seconds" in value
      ? Number((value as { seconds?: number }).seconds ?? 0)
      : value instanceof Date
        ? Math.floor(value.getTime() / 1000)
        : 0;

  if (!seconds) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(seconds * 1000));
}

function StatusBadge({
  status,
  source,
}: {
  status: Plano["status"];
  source: Plano["source"];
}) {
  const statusClass =
    status === "inativo"
      ? "bg-slate-100 text-slate-600"
      : "bg-emerald-100 text-emerald-700";

  return (
    <div className="flex flex-wrap gap-2">
      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase ${statusClass}`}>
        {status || "ativo"}
      </span>
      <span
        className={
          source === "eduzz"
            ? "inline-flex rounded-full bg-violet-100 px-3 py-1 text-xs font-bold uppercase text-violet-700"
            : "inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600"
        }
      >
        {source === "eduzz" ? "Sincronizado" : "Manual"}
      </span>
    </div>
  );
}

function Modal({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-slate-900/35 backdrop-blur-sm" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-3xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="text-lg font-black text-slate-900">{title}</div>
            <Button variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
          <div className="max-h-[80vh] overflow-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function PlanosPage() {
  const [items, setItems] = useState<Plano[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Plano | null>(null);
  const [saving, setSaving] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [form, setForm] = useState<PlanoForm>({
    code: "",
    title: "",
    productId: "",
    description: "",
    imageUrl: "",
    moderation: "",
    paymentType: "",
    source: "manual",
    status: "ativo",
    price: "",
  });

  const loadItems = async () => {
    setLoading(true);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch("/api/admin/planos", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await res.json()) as { ok: boolean; error?: string; items?: Plano[] };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível carregar os planos.");
      }
      setItems(data.items || []);
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao carregar planos.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadItems();
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((item) =>
      [
        item.code || "",
        item.title || "",
        item.productId || "",
        item.status || "",
        item.moderation || "",
        item.paymentType || "",
      ]
        .join(" ")
        .toLowerCase()
        .includes(s)
    );
  }, [items, search]);

  const openCreate = () => {
    setEditing(null);
    setForm({
      code: String(items.length + 1),
      title: "",
      productId: "",
      description: "",
      imageUrl: "",
      moderation: "",
      paymentType: "",
      source: "manual",
      status: "ativo",
      price: "",
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const openEdit = (item: Plano) => {
    setEditing(item);
    setForm({
      code: item.code || "",
      title: item.title || "",
      productId: item.productId || "",
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      moderation: item.moderation || "",
      paymentType: item.paymentType || "",
      source: item.source === "eduzz" ? "eduzz" : "manual",
      status: item.status || "ativo",
      price: item.price != null ? String(item.price) : "",
    });
    setErrorMsg(null);
    setSuccessMsg(null);
    setModalOpen(true);
  };

  const save = async () => {
    setSaving(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const url = editing ? `/api/admin/planos/${editing.id}` : "/api/admin/planos";
      const method = editing ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível salvar o plano.");
      }

      setModalOpen(false);
      setSuccessMsg("Plano salvo com sucesso.");
      await loadItems();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao salvar plano.");
    } finally {
      setSaving(false);
    }
  };

  const syncEduzz = async () => {
    setSyncing(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch("/api/admin/planos/sync-eduzz", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as {
        ok: boolean;
        error?: string;
        created?: number;
        updated?: number;
        total?: number;
      };

      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível sincronizar os produtos da Eduzz.");
      }

      setSuccessMsg(
        `Sincronização concluída: ${data.total ?? 0} produtos (${data.created ?? 0} novos, ${data.updated ?? 0} atualizados).`
      );
      await loadItems();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao sincronizar a Eduzz.");
    } finally {
      setSyncing(false);
    }
  };

  const remove = async (item: Plano) => {
    const ok = window.confirm(`Excluir o plano "${item.title}"?`);
    if (!ok) return;

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch(`/api/admin/planos/${item.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível excluir o plano.");
      }

      setSuccessMsg("Plano excluído com sucesso.");
      await loadItems();
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao excluir plano.");
    }
  };

  return (
    <AdminShell
      title="Planos"
      subtitle="Cadastre manualmente ou sincronize os produtos da Eduzz para manter o catálogo igual ao MyEduzz."
      actions={
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[340px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar planos..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <Button variant="secondary" onClick={() => void syncEduzz()} disabled={syncing}>
            {syncing ? "Sincronizando..." : "Sincronizar Eduzz"}
          </Button>
          <Button variant="primary" onClick={openCreate}>
            Criar
          </Button>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
          <div className="text-2xl font-black text-slate-900">Planos</div>
          <div className="mt-1 text-sm text-slate-500">
            {loading ? "Carregando..." : `${filtered.length} planos`}
          </div>
          {errorMsg ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          ) : null}
          {successMsg ? (
            <div className="mt-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
              {successMsg}
            </div>
          ) : null}
        </div>

        <div className="divide-y divide-slate-200">
          {!loading && filtered.length === 0 ? (
            <div className="px-5 py-10 text-center text-sm text-slate-500">Nenhum plano encontrado.</div>
          ) : null}

          {filtered.map((item) => (
            <div key={item.id} className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,2.2fr)_160px_160px_220px] md:items-center">
              <div className="min-w-0">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-xs font-bold uppercase text-slate-500">
                    {item.source === "eduzz" ? "E" : "M"}
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-2xl font-bold text-slate-900">{item.title || "—"}</div>
                    <div className="mt-1 text-sm text-slate-500">
                      {item.productId || "Sem ID de produto"} {item.code ? `· cód. ${item.code}` : ""}
                    </div>
                    {item.description ? (
                      <div className="mt-2 line-clamp-2 text-sm text-slate-500">{item.description}</div>
                    ) : null}
                    <div className="mt-3 flex flex-wrap gap-2">
                      <StatusBadge status={item.status} source={item.source} />
                      {item.moderation ? (
                        <span className="inline-flex rounded-full bg-sky-100 px-3 py-1 text-xs font-bold uppercase text-sky-700">
                          {item.moderation}
                        </span>
                      ) : null}
                      {item.paymentType ? (
                        <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-bold uppercase text-slate-600">
                          {item.paymentType}
                        </span>
                      ) : null}
                    </div>
                    {item.lastSyncedAt ? (
                      <div className="mt-2 text-xs text-slate-400">
                        Última sincronização: {formatDate(item.lastSyncedAt)}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Status</div>
                <div className="text-lg font-semibold text-slate-800 capitalize">{item.status || "ativo"}</div>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Preço</div>
                <div className="text-xl font-semibold text-emerald-600">
                  {formatCurrency(item.price, item.currency || "BRL")}
                </div>
              </div>

              <div className="flex flex-wrap justify-start gap-2 md:justify-end">
                <Button variant="primary" size="sm" onClick={() => openEdit(item)}>
                  Editar
                </Button>
                <Button variant="danger" size="sm" onClick={() => void remove(item)}>
                  Excluir
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? "Editar plano" : "Criar plano"}
        onClose={() => !saving && setModalOpen(false)}
      >
        <div className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Código
              </div>
              <input
                value={form.code}
                onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Status
              </div>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as PlanoForm["status"],
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Origem
              </div>
              <select
                value={form.source}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    source: e.target.value === "eduzz" ? "eduzz" : "manual",
                  }))
                }
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="manual">Manual</option>
                <option value="eduzz">Eduzz</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Produto
            </div>
            <input
              value={form.title}
              onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
              Descrição
            </div>
            <textarea
              value={form.description}
              onChange={(e) => setForm((prev) => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                ID produto/oferta Eduzz
              </div>
              <input
                value={form.productId}
                onChange={(e) => setForm((prev) => ({ ...prev, productId: e.target.value }))}
                placeholder="Ex.: P567"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Valor
              </div>
              <input
                value={form.price}
                onChange={(e) => setForm((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="0,00"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Moderação
              </div>
              <input
                value={form.moderation}
                onChange={(e) => setForm((prev) => ({ ...prev, moderation: e.target.value }))}
                placeholder="Aprovado"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                Tipo de cobrança
              </div>
              <input
                value={form.paymentType}
                onChange={(e) => setForm((prev) => ({ ...prev, paymentType: e.target.value }))}
                placeholder="Pagamento único"
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                URL da imagem
              </div>
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-500">
            Para vínculo automático com a compra, o campo <strong>ID produto/oferta Eduzz</strong> deve
            ser exatamente o mesmo código que chega no webhook da Eduzz.
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void save()} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
