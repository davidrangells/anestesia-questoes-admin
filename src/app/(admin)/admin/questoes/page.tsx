"use client";

import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  endBefore,
  getDoc,
  getDocs,
  limit,
  limitToLast,
  orderBy,
  query,
  QueryDocumentSnapshot,
  DocumentData,
  serverTimestamp,
  startAfter,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Option = { id: string; text?: string; imageUrl?: string | null };

type QBQuestion = {
  id: string;

  // campos possíveis
  prompt?: string;
  statement?: string;
  questionText?: string;

  explanation?: string;

  imageUrl?: string | null;
  options?: Option[];
  correctOptionId?: string;

  examType?: string;
  examYear?: number | null;
  examSource?: string;

  themes?: string[];

  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;
};

const PAGE_SIZE = 20;

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function Badge({
  children,
  tone,
  onClick,
  title,
}: {
  children: React.ReactNode;
  tone: "blue" | "green" | "slate" | "amber" | "red";
  onClick?: () => void;
  title?: string;
}) {
  const cls =
    tone === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : tone === "green"
      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
      : tone === "amber"
      ? "bg-amber-50 text-amber-700 border-amber-100"
      : tone === "red"
      ? "bg-rose-50 text-rose-700 border-rose-100"
      : "bg-slate-50 text-slate-700 border-slate-100";

  const clickable = !!onClick;
  return (
    <span
      onClick={onClick}
      title={title}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold select-none",
        cls,
        clickable ? "cursor-pointer hover:opacity-90" : "",
      ].join(" ")}
    >
      {children}
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
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl rounded-2xl border bg-white shadow-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-5 py-4 border-b">
            <div className="min-w-0">
              <div className="text-sm font-extrabold text-slate-900 truncate">{title}</div>
              <div className="text-xs text-slate-500">Clique fora para fechar</div>
            </div>
            <button
              onClick={onClose}
              className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
            >
              Fechar
            </button>
          </div>

          <div className="p-5 max-h-[75vh] overflow-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}

function hasAnyImage(q: QBQuestion) {
  const questionHas = !!q.imageUrl;
  const optionHas = (q.options ?? []).some((o) => !!o.imageUrl);
  return questionHas || optionHas;
}

function getEnunciado(q: QBQuestion) {
  const text = (q.prompt ?? q.questionText ?? q.statement ?? "").trim();
  return text.length ? text : "(sem enunciado)";
}

function sanitizeForCopy(q: QBQuestion) {
  // cria um payload seguro (não leva id, createdAt, updatedAt antigos)
  const payload: any = {
    prompt: (q.prompt ?? q.questionText ?? q.statement ?? "").toString().trim(),
    explanation: (q.explanation ?? "").toString(),
    imageUrl: (q.imageUrl ?? "").toString(),
    options: Array.isArray(q.options)
      ? q.options.map((o) => ({
          id: o.id,
          text: (o.text ?? "").toString(),
          imageUrl: (o.imageUrl ?? "").toString(),
        }))
      : [],
    correctOptionId: q.correctOptionId ?? "A",
    examType: (q.examType ?? "").toString(),
    examYear: q.examYear ?? null,
    examSource: (q.examSource ?? "").toString(),
    themes: Array.isArray(q.themes) ? q.themes : [],
    isActive: q.isActive !== false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    duplicatedFrom: q.id,
  };

  // fallback mínimo
  if (!payload.options?.length) {
    payload.options = [
      { id: "A", text: "", imageUrl: "" },
      { id: "B", text: "", imageUrl: "" },
      { id: "C", text: "", imageUrl: "" },
      { id: "D", text: "", imageUrl: "" },
    ];
  }

  return payload;
}

export default function BancoQuestoesPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QBQuestion[]>([]);
  const [cursorStack, setCursorStack] = useState<QueryDocumentSnapshot<DocumentData>[]>([]);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"todos" | "ativas" | "inativas">("todos");
  const [themeFilter, setThemeFilter] = useState<string | null>(null);

  // Modal de imagens
  const [openImages, setOpenImages] = useState(false);
  const [selected, setSelected] = useState<QBQuestion | null>(null);

  // Toggle status
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // Ações por linha
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchFirst = async () => {
    setLoading(true);
    try {
      const qRef = query(collection(db, "questionsBank"), orderBy("createdAt", "desc"), limit(PAGE_SIZE));
      const snap = await getDocs(qRef);

      const rows: QBQuestion[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      setItems(rows);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
      setCursorStack([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchNext = async () => {
    if (!lastDoc) return;
    setLoading(true);
    try {
      const qRef = query(
        collection(db, "questionsBank"),
        orderBy("createdAt", "desc"),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snap = await getDocs(qRef);
      const rows: QBQuestion[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      setCursorStack((prev) => [...prev, lastDoc]);
      setItems(rows);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    } finally {
      setLoading(false);
    }
  };

  const fetchPrev = async () => {
    const prevCursor = cursorStack[cursorStack.length - 1];
    if (!prevCursor) return;

    setLoading(true);
    try {
      const qRef = query(
        collection(db, "questionsBank"),
        orderBy("createdAt", "desc"),
        endBefore(prevCursor),
        limitToLast(PAGE_SIZE)
      );
      const snap = await getDocs(qRef);
      const rows: QBQuestion[] = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));

      setCursorStack((prev) => prev.slice(0, -1));
      setItems(rows);
      setLastDoc(snap.docs[snap.docs.length - 1] ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFirst();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();

    return items.filter((q) => {
      const activeOk =
        status === "todos" ? true : status === "ativas" ? q.isActive === true : q.isActive === false;
      if (!activeOk) return false;

      const themeOk = themeFilter ? Array.isArray(q.themes) && q.themes.includes(themeFilter) : true;
      if (!themeOk) return false;

      if (!s) return true;

      const idOk = q.id?.toLowerCase().includes(s);
      const stmtOk = getEnunciado(q).toLowerCase().includes(s);
      const examOk = `${q.examType ?? ""} ${q.examYear ?? ""} ${q.examSource ?? ""}`.toLowerCase().includes(s);
      const themesOk = (q.themes ?? []).join(" ").toLowerCase().includes(s);

      return idOk || stmtOk || examOk || themesOk;
    });
  }, [items, search, status, themeFilter]);

  const openImageModal = (q: QBQuestion) => {
    setSelected(q);
    setOpenImages(true);
  };

  const toggleActive = async (q: QBQuestion) => {
    const next = !(q.isActive === true);
    setTogglingId(q.id);

    setItems((prev) => prev.map((x) => (x.id === q.id ? { ...x, isActive: next } : x)));

    try {
      await updateDoc(doc(db, "questionsBank", q.id), { isActive: next, updatedAt: serverTimestamp() });
    } catch {
      setItems((prev) => prev.map((x) => (x.id === q.id ? { ...x, isActive: q.isActive } : x)));
      alert("Não foi possível atualizar o status. Verifique permissões/regras do Firestore.");
    } finally {
      setTogglingId(null);
    }
  };

  const duplicateQuestion = async (q: QBQuestion) => {
    if (!confirm("Duplicar esta questão? Ela será criada como uma nova questão no questionsBank.")) return;
    setDuplicatingId(q.id);

    try {
      // garantia: pega doc atual do Firestore (evita duplicar uma versão antiga que está só na UI)
      const snap = await getDoc(doc(db, "questionsBank", q.id));
      const data = snap.exists() ? ({ id: snap.id, ...(snap.data() as any) } as QBQuestion) : q;

      const payload = sanitizeForCopy(data);
      const newRef = await addDoc(collection(db, "questionsBank"), payload);

      // refresh (mantém simples e confiável)
      await fetchFirst();
      alert("Duplicado ✅");
      // opcional: ir direto para edição
      // window.location.href = `/admin/questoes/${newRef.id}`;
      void newRef;
    } catch (e: any) {
      alert(e?.message || "Não foi possível duplicar.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const deleteQuestion = async (q: QBQuestion) => {
    const ok = confirm(
      `Excluir esta questão?\n\nID: ${q.id}\n\nEssa ação não pode ser desfeita.`
    );
    if (!ok) return;

    setDeletingId(q.id);

    // otimista (remove da lista primeiro)
    const backup = items;
    setItems((prev) => prev.filter((x) => x.id !== q.id));

    try {
      await deleteDoc(doc(db, "questionsBank", q.id));
      // opcional: refresh para manter paginação consistente
      await fetchFirst();
      alert("Excluída ✅");
    } catch (e: any) {
      setItems(backup);
      alert(e?.message || "Não foi possível excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  const selectedImages = useMemo(() => {
    if (!selected) return [];
    const imgs: { label: string; url: string }[] = [];

    if (selected.imageUrl) imgs.push({ label: "Enunciado", url: selected.imageUrl });

    (selected.options ?? []).forEach((o) => {
      if (o.imageUrl) imgs.push({ label: `Alternativa ${o.id}`, url: o.imageUrl });
    });

    return imgs;
  }, [selected]);

  return (
    <AdminShell
      title="Banco de Questões"
      subtitle="Gerencie questões do questionsBank (criar, editar, ativar, duplicar e excluir)."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={fetchFirst}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Atualizar
          </button>
          <Link
            href="/admin/questoes/nova"
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Nova questão
          </Link>
        </div>
      }
    >
      {/* Cards topo */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Carregadas nesta página</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{items.length}</div>
          <div className="mt-1 text-sm text-slate-500">Limite por página: {PAGE_SIZE}</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Exibidas (após filtros)</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{filtered.length}</div>
          <div className="mt-1 text-sm text-slate-500">Busca + Status + Tema</div>
        </div>

        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Dica</div>
          <div className="mt-2 text-sm text-slate-700">
            Clique num <b>tema</b> para filtrar. Use <b>Duplicar</b> para criar variações rapidamente.
          </div>
        </div>
      </div>

      {/* Filtros */}
      <div className="rounded-2xl border bg-white p-4 mb-4">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-3 items-end">
          <div className="lg:col-span-3">
            <div className="text-xs font-semibold text-slate-600 mb-1">Buscar</div>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ID, enunciado, prova, ano, tema..."
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="lg:col-span-1">
            <div className="text-xs font-semibold text-slate-600 mb-1">Status</div>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
            >
              <option value="todos">Todos</option>
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
            </select>
          </div>

          <div className="lg:col-span-1 flex gap-2">
            <button
              onClick={fetchPrev}
              disabled={loading || cursorStack.length === 0}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={fetchNext}
              disabled={loading || !lastDoc}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm font-semibold disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-2 items-center">
          <Badge tone="blue">{filtered.length} exibidas</Badge>
          <Badge tone="green">{filtered.filter((x) => x.isActive === true).length} ativas (carregadas)</Badge>
          <Badge tone="slate">{items.length} carregadas</Badge>

          {themeFilter ? (
            <span className="ml-1 inline-flex items-center gap-2">
              <Badge tone="amber" title="Filtro de tema ativo">
                Tema: {themeFilter}
              </Badge>
              <button
                onClick={() => setThemeFilter(null)}
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 underline underline-offset-4"
              >
                limpar tema
              </button>
            </span>
          ) : null}
        </div>
      </div>

      {/* Tabela */}
      <div className="rounded-2xl border bg-white overflow-hidden">
        <div className="px-5 py-4 border-b">
          <div className="text-sm font-extrabold text-slate-900">Lista de questões</div>
          <div className="text-xs text-slate-500 mt-0.5">Editar, duplicar ou excluir direto daqui.</div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="text-xs uppercase text-slate-500 border-b bg-slate-50/60">
              <tr>
                <th className="text-left px-5 py-3">Enunciado</th>
                <th className="text-left px-5 py-3">Prova</th>
                <th className="text-left px-5 py-3">Temas</th>
                <th className="text-left px-5 py-3">Imagem</th>
                <th className="text-left px-5 py-3">Status</th>
                <th className="text-left px-5 py-3">Correta</th>
                <th className="text-right px-5 py-3">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    Carregando…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    Nenhuma questão encontrada com esses filtros.
                  </td>
                </tr>
              ) : (
                filtered.map((q) => {
                  const anyImg = hasAnyImage(q);
                  const isActive = q.isActive === true;

                  return (
                    <tr key={q.id} className="hover:bg-slate-50/50">
                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900 line-clamp-2">{getEnunciado(q)}</div>
                        <div className="text-xs text-slate-500 mt-1">ID: {q.id}</div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {(q.examType ?? "—") + (q.examYear ? ` (${q.examYear})` : "")}
                        </div>
                        <div className="text-xs text-slate-500">{q.examSource ?? "—"}</div>
                      </td>

                      <td className="px-5 py-4">
                        {Array.isArray(q.themes) && q.themes.length > 0 ? (
                          <div className="flex flex-wrap gap-2">
                            {q.themes.slice(0, 3).map((t) => (
                              <Badge
                                key={t}
                                tone={themeFilter === t ? "amber" : "slate"}
                                title="Clique para filtrar por este tema"
                                onClick={() => setThemeFilter((prev) => (prev === t ? null : t))}
                              >
                                {t}
                              </Badge>
                            ))}
                            {q.themes.length > 3 ? (
                              <Badge tone="slate" title={q.themes.slice(3).join(", ")}>
                                +{q.themes.length - 3}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        {anyImg ? (
                          <Badge tone="blue" onClick={() => openImageModal(q)} title="Ver imagens">
                            📷 Sim (ver)
                          </Badge>
                        ) : (
                          <Badge tone="slate">Não</Badge>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <button
                          onClick={() => toggleActive(q)}
                          disabled={togglingId === q.id}
                          className={classNames(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition",
                            isActive
                              ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                              : "bg-amber-50 text-amber-700 border-amber-100 hover:bg-amber-100",
                            togglingId === q.id ? "opacity-60 cursor-wait" : ""
                          )}
                          title="Clique para alternar"
                        >
                          <span className="text-sm">{isActive ? "●" : "○"}</span>
                          {isActive ? "Ativa" : "Inativa"}
                        </button>
                      </td>

                      <td className="px-5 py-4">
                        <span className="font-extrabold text-slate-900">{q.correctOptionId ?? "—"}</span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-2">
                          <Link
                            href={`/admin/questoes/${q.id}`}
                            className="inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                          >
                            Editar
                          </Link>

                          <button
                            onClick={() => duplicateQuestion(q)}
                            disabled={duplicatingId === q.id || deletingId === q.id}
                            className={classNames(
                              "inline-flex items-center justify-center rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50",
                              duplicatingId === q.id ? "opacity-60 cursor-wait" : ""
                            )}
                            title="Duplicar questão"
                          >
                            {duplicatingId === q.id ? "Duplicando..." : "Duplicar"}
                          </button>

                          <button
                            onClick={() => deleteQuestion(q)}
                            disabled={deletingId === q.id || duplicatingId === q.id}
                            className={classNames(
                              "inline-flex items-center justify-center rounded-xl border px-3 py-2 text-sm font-semibold",
                              "bg-rose-50 border-rose-100 text-rose-700 hover:bg-rose-100",
                              deletingId === q.id ? "opacity-60 cursor-wait" : ""
                            )}
                            title="Excluir questão"
                          >
                            {deletingId === q.id ? "Excluindo..." : "Excluir"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="px-5 py-4 border-t bg-white flex items-center justify-between">
          <div className="text-xs text-slate-500">
            Página atual: <b>{cursorStack.length + 1}</b>
          </div>

          <div className="flex gap-2">
            <button
              onClick={fetchPrev}
              disabled={loading || cursorStack.length === 0}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={fetchNext}
              disabled={loading || !lastDoc}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

      {/* Modal de imagens */}
      <Modal
        open={openImages}
        title={selected ? `Imagens da questão (${selected.id})` : "Imagens da questão"}
        onClose={() => {
          setOpenImages(false);
          setSelected(null);
        }}
      >
        {!selected || selectedImages.length === 0 ? (
          <div className="text-sm text-slate-500">Nenhuma imagem encontrada.</div>
        ) : (
          <div className="space-y-5">
            {selected.imageUrl ? (
              <div className="rounded-2xl border p-4">
                <div className="text-xs font-extrabold text-slate-700 mb-2">Enunciado</div>
                <img
                  src={selected.imageUrl}
                  alt="Imagem do enunciado"
                  className="w-full rounded-xl border bg-slate-50 object-contain max-h-[420px]"
                />
              </div>
            ) : null}

            {(selected.options ?? [])
              .filter((o) => !!o.imageUrl)
              .map((o) => (
                <div key={o.id} className="rounded-2xl border p-4">
                  <div className="text-xs font-extrabold text-slate-700 mb-2">Alternativa {o.id}</div>
                  <img
                    src={o.imageUrl as string}
                    alt={`Imagem alternativa ${o.id}`}
                    className="w-full rounded-xl border bg-slate-50 object-contain max-h-[420px]"
                  />
                </div>
              ))}
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}