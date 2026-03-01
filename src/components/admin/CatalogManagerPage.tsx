"use client";

import { useEffect, useMemo, useState } from "react";
import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type EntityType = "provas" | "niveis" | "temas";

type CatalogDoc = {
  id: string;
  code: string;
  title: string;
  status: "ativo" | "inativo";
  createdAt?: { seconds?: number } | null;
  updatedAt?: { seconds?: number } | null;
  levelId?: string | null;
  levelLabel?: string | null;
};

type CatalogForm = {
  code: string;
  title: string;
  status: "ativo" | "inativo";
  levelId: string;
};

type CatalogManagerPageProps = {
  entity: EntityType;
  title: string;
  singularLabel: string;
  subtitle: string;
  searchPlaceholder: string;
  createLabel: string;
  emptyMessage: string;
  showLevelColumn?: boolean;
};

type LevelOption = {
  id: string;
  title: string;
  status: "ativo" | "inativo";
};

const COLLECTION_BY_ENTITY: Record<EntityType, string> = {
  provas: "catalog_provas",
  niveis: "catalog_niveis",
  temas: "catalog_temas",
};

function formatDate(value?: { seconds?: number } | null) {
  if (!value?.seconds) return "—";
  const date = new Date(value.seconds * 1000);
  return new Intl.DateTimeFormat("pt-BR").format(date);
}

function StatusBadge({ status }: { status: CatalogDoc["status"] }) {
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide",
        status === "ativo"
          ? "bg-emerald-100 text-emerald-700"
          : "bg-amber-100 text-amber-700"
      )}
    >
      {status}
    </span>
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
        <div className="w-full max-w-2xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-lg font-black text-slate-900">{title}</div>
          </div>
          <div className="max-h-[80vh] overflow-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function CatalogManagerPage({
  entity,
  title,
  singularLabel,
  subtitle,
  searchPlaceholder,
  createLabel,
  emptyMessage,
  showLevelColumn = false,
}: CatalogManagerPageProps) {
  const [items, setItems] = useState<CatalogDoc[]>([]);
  const [levels, setLevels] = useState<LevelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<CatalogDoc | null>(null);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [form, setForm] = useState<CatalogForm>({
    code: "",
    title: "",
    status: "ativo",
    levelId: "",
  });

  const collectionName = COLLECTION_BY_ENTITY[entity];

  const loadItems = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, collectionName), orderBy("createdAt", "desc")));
      const rows = snap.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<CatalogDoc, "id">),
      }));
      setItems(rows);
    } finally {
      setLoading(false);
    }
  };

  const loadLevels = async () => {
    if (entity !== "temas") return;

    const snap = await getDocs(query(collection(db, COLLECTION_BY_ENTITY.niveis), orderBy("title", "asc")));
    const rows = snap.docs.map((item) => ({
      id: item.id,
      title: String(item.data().title ?? ""),
      status: (item.data().status as LevelOption["status"]) ?? "ativo",
    }));
    setLevels(rows.filter((item) => item.status === "ativo"));
  };

  useEffect(() => {
    void loadItems();
    void loadLevels();
  }, [entity]);

  const filtered = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    if (!normalizedSearch) return items;

    return items.filter((item) =>
      [
        item.code,
        item.title,
        item.status,
        item.levelLabel ?? "",
        formatDate(item.createdAt),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [items, search]);

  const nextCode = useMemo(() => {
    const nums = items
      .map((item) => Number(item.code))
      .filter((value) => Number.isFinite(value));
    if (!nums.length) return "1";
    return String(Math.max(...nums) + 1);
  }, [items]);

  const resetForm = () => {
    setForm({
      code: nextCode,
      title: "",
      status: "ativo",
      levelId: levels[0]?.id ?? "",
    });
    setEditing(null);
    setErrorMsg(null);
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (item: CatalogDoc) => {
    setEditing(item);
    setForm({
      code: item.code,
      title: item.title,
      status: item.status,
      levelId: item.levelId ?? "",
    });
    setErrorMsg(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    if (saving) return;
    setModalOpen(false);
    setEditing(null);
    setErrorMsg(null);
  };

  const saveItem = async () => {
    const code = form.code.trim();
    const titleValue = form.title.trim();
    const duplicateCode = items.some(
      (item) => item.code === code && item.id !== editing?.id
    );

    if (!code || !titleValue) {
      setErrorMsg("Código e título são obrigatórios.");
      return;
    }

    if (duplicateCode) {
      setErrorMsg("Já existe um registro com esse código.");
      return;
    }

    const level = entity === "temas" ? levels.find((item) => item.id === form.levelId) : null;

    if (entity === "temas" && !level) {
      setErrorMsg("Selecione um nível para o tema.");
      return;
    }

    setSaving(true);
    setErrorMsg(null);

    try {
      const payload = {
        code,
        title: titleValue,
        status: form.status,
        levelId: level?.id ?? null,
        levelLabel: level?.title ?? null,
        updatedAt: serverTimestamp(),
      };

      if (editing) {
        await updateDoc(doc(db, collectionName, editing.id), payload);
      } else {
        await addDoc(collection(db, collectionName), {
          ...payload,
          createdAt: serverTimestamp(),
        });
      }

      await loadItems();
      if (entity === "temas") {
        await loadLevels();
      }
      setModalOpen(false);
      setEditing(null);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Não foi possível salvar o cadastro.";
      setErrorMsg(message);
    } finally {
      setSaving(false);
    }
  };

  const removeItem = async (item: CatalogDoc) => {
    const confirmed = window.confirm(`Excluir "${item.title}"?`);
    if (!confirmed) return;

    setDeletingId(item.id);
    try {
      await deleteDoc(doc(db, collectionName, item.id));
      await loadItems();
      if (entity === "niveis" || entity === "temas") {
        await loadLevels();
      }
    } finally {
      setDeletingId(null);
    }
  };

  const canCreateTheme = entity !== "temas" || levels.length > 0;

  return (
    <AdminShell
      title={title}
      subtitle={subtitle}
      actions={
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[340px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <Button variant="primary" onClick={openCreate} disabled={!canCreateTheme}>
            Criar
          </Button>
        </div>
      }
    >
      <div className="rounded-[28px] border border-slate-200 bg-white shadow-sm overflow-hidden">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
          <div className="text-2xl font-black text-slate-900">{title}</div>
          <div className="mt-1 text-sm text-slate-500">
            {loading
              ? "Carregando..."
              : `${filtered.length} ${filtered.length === 1 ? "registro encontrado" : "registros encontrados"}`}
          </div>
          {!canCreateTheme ? (
            <div className="mt-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Cadastre pelo menos um nível ativo antes de criar temas.
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="border-b bg-slate-100/80 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Cód.</th>
                <th className="px-5 py-4 text-left">Criado em</th>
                <th className="px-5 py-4 text-left">Título</th>
                {showLevelColumn ? <th className="px-5 py-4 text-left">Nível</th> : null}
                <th className="px-5 py-4 text-left">Status</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td
                    colSpan={showLevelColumn ? 6 : 5}
                    className="px-5 py-10 text-center text-sm text-slate-500"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : null}

              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-5 py-5 text-lg font-semibold text-slate-600">{item.code}</td>
                  <td className="px-5 py-5 text-slate-500">{formatDate(item.createdAt)}</td>
                  <td className="px-5 py-5">
                    <div className="font-semibold text-slate-800">{item.title}</div>
                  </td>
                  {showLevelColumn ? (
                    <td className="px-5 py-5 text-slate-600">{item.levelLabel || "—"}</td>
                  ) : null}
                  <td className="px-5 py-5">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Button variant="primary" size="sm" onClick={() => openEdit(item)}>
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        disabled={deletingId === item.id}
                        onClick={() => void removeItem(item)}
                      >
                        {deletingId === item.id ? "Excluindo..." : "Excluir"}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-5 py-4">
          <div className="text-xs text-slate-500">Página 1 de 1</div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" disabled>
              Anterior
            </Button>
            <div className="inline-flex h-10 min-w-10 items-center justify-center rounded-full bg-slate-900 px-3 text-sm font-bold text-white">
              1
            </div>
            <Button variant="secondary" size="sm" disabled>
              Próxima
            </Button>
          </div>
        </div>
      </div>

      <Modal
        open={modalOpen}
        title={editing ? `Editar ${singularLabel}` : createLabel}
        onClose={closeModal}
      >
        <div className="space-y-4">
          {errorMsg ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Código</div>
              <input
                value={form.code}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    code: e.target.value,
                  }))
                }
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Status</div>
              <select
                value={form.status}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    status: e.target.value as CatalogForm["status"],
                  }))
                }
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Título</div>
            <input
              value={form.title}
              onChange={(e) =>
                setForm((prev) => ({
                  ...prev,
                  title: e.target.value,
                }))
              }
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          {entity === "temas" ? (
            <div>
              <div className="mb-1 text-xs font-semibold text-slate-600">Nível</div>
              <select
                value={form.levelId}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    levelId: e.target.value,
                  }))
                }
                className="w-full rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Selecione</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.title}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={() => void saveItem()} disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
