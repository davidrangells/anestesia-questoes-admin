"use client";

import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button, buttonStyles } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { auth } from "@/lib/firebase";

type Option = { id: string; text?: string; imageUrl?: string | null };

type QBQuestion = {
  id: string;
  prompt?: string;
  prompt_text?: string;
  statement?: string;
  questionText?: string;
  explanation?: string;
  imageUrl?: string | null;
  options?: Option[];
  correctOptionId?: string;
  shuffleOptions?: boolean;
  examType?: string;
  prova_tipo?: string;
  examYear?: number | null;
  prova_ano?: number | string | null;
  examSource?: string;
  Prova?: string;
  level?: string;
  nivel?: string;
  themes?: string[] | string;
  isActive?: boolean;
  optionA_imageUrl?: string | null;
  optionB_imageUrl?: string | null;
  optionC_imageUrl?: string | null;
  optionD_imageUrl?: string | null;
  optionE_imageUrl?: string | null;
  optionA_text?: string;
  optionB_text?: string;
  optionC_text?: string;
  optionD_text?: string;
  optionE_text?: string;
};

type QuestionsResponse = {
  ok: boolean;
  error?: string;
  items?: QBQuestion[];
  pagination?: {
    page: number;
    pageSize: number;
    totalFiltered: number;
    totalPages: number;
  };
  summary?: {
    total: number;
    commented: number;
    active: number;
    inactive: number;
  };
};

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
      ? "border-[#bfdbfe] bg-[#dbeafe] text-[#1e3a8a]"
      : tone === "green"
      ? "border-[#86efac] bg-[#dcfce7] text-[#14532d]"
      : tone === "amber"
      ? "border-[#f59e0b] bg-[#fef3c7] text-[#78350f]"
      : tone === "red"
      ? "border-[#fecdd3] bg-[#ffe4e6] text-[#881337]"
      : "border-[#cbd5e1] bg-[#e2e8f0] text-[#0f172a]";

  const clickable = !!onClick;
  return (
    <span
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-1 text-xs font-semibold select-none",
        cls,
        clickable ? "cursor-pointer hover:opacity-90" : ""
      )}
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
        <div className="w-full max-w-4xl overflow-hidden rounded-2xl border bg-white shadow-xl">
          <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
            <div className="min-w-0">
              <div className="truncate text-sm font-extrabold text-slate-900">{title}</div>
              <div className="text-xs text-slate-500">Clique fora para fechar</div>
            </div>
            <Button onClick={onClose} variant="secondary" size="sm">
              Fechar
            </Button>
          </div>
          <div className="max-h-[75vh] overflow-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

function hasAnyImage(q: QBQuestion) {
  const questionHas = !!q.imageUrl;
  const optionHas =
    (q.options ?? []).some((o) => !!o.imageUrl) ||
    Boolean(
      q.optionA_imageUrl ||
        q.optionB_imageUrl ||
        q.optionC_imageUrl ||
        q.optionD_imageUrl ||
        q.optionE_imageUrl
    );
  return questionHas || optionHas;
}

function isQuestionActive(q: QBQuestion) {
  return q.isActive !== false;
}

function getEnunciado(q: QBQuestion) {
  const text = (q.prompt_text ?? q.prompt ?? q.questionText ?? q.statement ?? "").trim();
  return text.length ? text : "(sem enunciado)";
}

function getThemes(q: QBQuestion) {
  if (Array.isArray(q.themes)) {
    return q.themes.map((theme) => String(theme ?? "").trim()).filter(Boolean);
  }
  if (typeof q.themes === "string" && q.themes.trim()) {
    return q.themes
      .split(/[;,]/)
      .map((theme) => theme.trim())
      .filter(Boolean);
  }
  return [];
}

function getExamType(q: QBQuestion) {
  return String(q.examType ?? q.prova_tipo ?? "").trim();
}

function getExamYear(q: QBQuestion) {
  const year = q.examYear ?? q.prova_ano ?? null;
  return year == null ? "" : String(year).trim();
}

function getExamLabel(q: QBQuestion) {
  return String(q.Prova ?? q.examSource ?? "").trim();
}

function sanitizeForCopy(q: QBQuestion) {
  const optionFallbacks = [
    {
      id: "A",
      text: q.optionA_text ?? "",
      imageUrl: q.optionA_imageUrl ?? "",
    },
    {
      id: "B",
      text: q.optionB_text ?? "",
      imageUrl: q.optionB_imageUrl ?? "",
    },
    {
      id: "C",
      text: q.optionC_text ?? "",
      imageUrl: q.optionC_imageUrl ?? "",
    },
    {
      id: "D",
      text: q.optionD_text ?? "",
      imageUrl: q.optionD_imageUrl ?? "",
    },
  ];

  const hasOptionE = Boolean(q.optionE_text?.trim() || q.optionE_imageUrl || q.correctOptionId === "E");
  if (hasOptionE) {
    optionFallbacks.push({
      id: "E",
      text: q.optionE_text ?? "",
      imageUrl: q.optionE_imageUrl ?? "",
    });
  }

  const normalizedOptions = Array.isArray(q.options) && q.options.length ? q.options : optionFallbacks;

  const payload: Record<string, unknown> = {
    prompt: (q.prompt_text ?? q.prompt ?? q.questionText ?? q.statement ?? "").toString().trim(),
    explanation: (q.explanation ?? "").toString(),
    imageUrl: (q.imageUrl ?? "").toString(),
    options: normalizedOptions.map((o) => ({
      id: o.id,
      text: (o.text ?? "").toString(),
      imageUrl: (o.imageUrl ?? "").toString(),
    })),
    correctOptionId: q.correctOptionId ?? "A",
    shuffleOptions: q.shuffleOptions !== false,
    examType: getExamType(q),
    examYear: getExamYear(q) ? Number(getExamYear(q)) || getExamYear(q) : null,
    examSource: getExamLabel(q),
    themes: getThemes(q),
    isActive: isQuestionActive(q),
    duplicatedFrom: q.id,
  };

  if (!(payload.options as unknown[]).length) {
    payload.options = [
      { id: "A", text: "", imageUrl: "" },
      { id: "B", text: "", imageUrl: "" },
      { id: "C", text: "", imageUrl: "" },
      { id: "D", text: "", imageUrl: "" },
    ];
  }

  return payload;
}

async function getAuthToken() {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error("Sessão inválida. Faça login novamente.");
  return token;
}

export default function BancoQuestoesPage() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<QBQuestion[]>([]);
  const [search, setSearch] = useState(() => searchParams.get("busca") ?? "");
  const deferredSearch = useDeferredValue(search);
  const [status, setStatus] = useState<"todos" | "ativas" | "inativas">("todos");
  const [themeFilter, setThemeFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<20 | 30 | 50 | 100>(20);
  const [totalFiltered, setTotalFiltered] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [summary, setSummary] = useState({
    total: 0,
    commented: 0,
    active: 0,
    inactive: 0,
  });

  const [openImages, setOpenImages] = useState(false);
  const [selected, setSelected] = useState<QBQuestion | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchPage = async (nextPage = page, nextPageSize = pageSize) => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const query = new URLSearchParams({
        page: String(nextPage),
        pageSize: String(nextPageSize),
      });
      if (deferredSearch.trim()) query.set("search", deferredSearch.trim());
      if (status !== "todos") query.set("status", status);
      if (themeFilter) query.set("theme", themeFilter);

      const res = await fetch(`/api/admin/questions?${query.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      const data = (await res.json()) as QuestionsResponse;
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível carregar questões.");
      }

      setItems(Array.isArray(data.items) ? data.items : []);
      setTotalFiltered(data.pagination?.totalFiltered ?? 0);
      setTotalPages(Math.max(data.pagination?.totalPages ?? 1, 1));
      setPage(data.pagination?.page ?? 1);
      setSummary({
        total: data.summary?.total ?? 0,
        commented: data.summary?.commented ?? 0,
        active: data.summary?.active ?? 0,
        inactive: data.summary?.inactive ?? 0,
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível carregar questões.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const next = searchParams.get("busca") ?? "";
    setSearch(next);
    setPage(1);
  }, [searchParams]);

  useEffect(() => {
    void fetchPage(1, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deferredSearch, status, themeFilter, pageSize]);

  useEffect(() => {
    void fetchPage(page, pageSize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const openImageModal = (q: QBQuestion) => {
    setSelected(q);
    setOpenImages(true);
  };

  const toggleActive = async (q: QBQuestion) => {
    const prev = isQuestionActive(q);
    const next = !prev;
    setTogglingId(q.id);
    setItems((old) => old.map((item) => (item.id === q.id ? { ...item, isActive: next } : item)));

    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ isActive: next }),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Não foi possível atualizar o status.");
      await fetchPage(page, pageSize);
    } catch (error) {
      setItems((old) => old.map((item) => (item.id === q.id ? { ...item, isActive: prev } : item)));
      alert(error instanceof Error ? error.message : "Não foi possível atualizar o status.");
    } finally {
      setTogglingId(null);
    }
  };

  const duplicateQuestion = async (q: QBQuestion) => {
    if (!confirm("Duplicar esta questão? Ela será criada como uma nova questão no questionsBank.")) return;
    setDuplicatingId(q.id);
    try {
      const token = await getAuthToken();
      const payload = sanitizeForCopy(q);
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Não foi possível duplicar.");
      await fetchPage(page, pageSize);
      alert("Duplicado ✅");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível duplicar.");
    } finally {
      setDuplicatingId(null);
    }
  };

  const deleteQuestion = async (q: QBQuestion) => {
    const ok = confirm(`Excluir esta questão?\n\nID: ${q.id}\n\nEssa ação não pode ser desfeita.`);
    if (!ok) return;
    setDeletingId(q.id);

    try {
      const token = await getAuthToken();
      const res = await fetch(`/api/admin/questions/${q.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) throw new Error(data.error || "Não foi possível excluir.");
      await fetchPage(page, pageSize);
      alert("Excluída ✅");
    } catch (error) {
      alert(error instanceof Error ? error.message : "Não foi possível excluir.");
    } finally {
      setDeletingId(null);
    }
  };

  const selectedImages = useMemo(() => {
    if (!selected) return [] as { label: string; url: string }[];
    const imgs: { label: string; url: string }[] = [];
    if (selected.imageUrl) imgs.push({ label: "Enunciado", url: selected.imageUrl });

    (selected.options ?? []).forEach((o) => {
      if (o.imageUrl) imgs.push({ label: `Alternativa ${o.id}`, url: o.imageUrl });
    });

    if (!selected.options?.length) {
      if (selected.optionA_imageUrl) imgs.push({ label: "Alternativa A", url: selected.optionA_imageUrl });
      if (selected.optionB_imageUrl) imgs.push({ label: "Alternativa B", url: selected.optionB_imageUrl });
      if (selected.optionC_imageUrl) imgs.push({ label: "Alternativa C", url: selected.optionC_imageUrl });
      if (selected.optionD_imageUrl) imgs.push({ label: "Alternativa D", url: selected.optionD_imageUrl });
      if (selected.optionE_imageUrl) imgs.push({ label: "Alternativa E", url: selected.optionE_imageUrl });
    }

    return imgs;
  }, [selected]);

  return (
    <AdminShell
      title="Banco de Questões"
      subtitle="Busca em todo o banco, filtros e gestão completa das questões."
      actions={
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <Button onClick={() => void fetchPage(page, pageSize)} variant="secondary" size="sm">
            Atualizar
          </Button>
          <Link href="/admin/questoes/nova" className={buttonStyles({ variant: "primary", size: "sm" })}>
            Nova questão
          </Link>
        </div>
      }
    >
      <div className="mb-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Total cadastradas</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summary.total}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Comentadas</div>
          <div className="mt-2 text-2xl font-black text-slate-900">{summary.commented}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Ativas</div>
          <div className="mt-2 text-2xl font-black text-emerald-700">{summary.active}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4">
          <div className="text-xs font-semibold text-slate-500">Inativas</div>
          <div className="mt-2 text-2xl font-black text-amber-700">{summary.inactive}</div>
        </div>
      </div>

      <div className="mb-4 rounded-2xl border bg-white p-4">
        <div className="grid grid-cols-1 items-end gap-3 lg:grid-cols-6">
          <div className="lg:col-span-3">
            <div className="mb-1 text-xs font-semibold text-slate-600">Buscar</div>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder='Busca livre ou avançada: ano:2017 prova:ME1 tema:pediatria nivel:R1 id:673'
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
            <div className="mt-1 text-[11px] text-slate-500">
              Dica: combine filtros na busca. Ex.: <span className="font-semibold">prova:ME1 ano:2017 tema:pediatria</span>
            </div>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Status</div>
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as "todos" | "ativas" | "inativas");
                setPage(1);
              }}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <option value="todos">Todos</option>
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
            </select>
          </div>

          <div>
            <div className="mb-1 text-xs font-semibold text-slate-600">Por página</div>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value) as 20 | 30 | 50 | 100);
                setPage(1);
              }}
              className="w-full rounded-xl border bg-white px-4 py-3 text-sm"
            >
              <option value={20}>20</option>
              <option value={30}>30</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>

          <div className="text-right text-sm text-slate-600">
            <div>
              Resultados: <b>{totalFiltered}</b>
            </div>
            <div>
              Página <b>{page}</b> de <b>{totalPages}</b>
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <Badge tone="blue">{items.length} exibidas nesta página</Badge>
          {themeFilter ? (
            <span className="ml-1 inline-flex items-center gap-2">
              <Badge tone="amber" title="Filtro de tema ativo">
                Tema: {themeFilter}
              </Badge>
              <button
                onClick={() => {
                  setThemeFilter(null);
                  setPage(1);
                }}
                className="text-xs font-semibold text-slate-600 underline underline-offset-4 hover:text-slate-900"
              >
                limpar tema
              </button>
            </span>
          ) : null}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border bg-white">
        <div className="border-b px-5 py-4">
          <div className="text-sm font-extrabold text-slate-900">Lista de questões</div>
          <div className="mt-0.5 text-xs text-slate-500">
            Agora a busca considera todo o banco, não apenas os itens da tela.
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="border-b bg-slate-50/60 text-xs uppercase text-slate-500">
              <tr>
                <th className="px-5 py-3 text-left">Enunciado</th>
                <th className="px-5 py-3 text-left">Metadados</th>
                <th className="px-5 py-3 text-left">Temas</th>
                <th className="px-5 py-3 text-left">Imagem</th>
                <th className="px-5 py-3 text-left">Status</th>
                <th className="px-5 py-3 text-left">Correta</th>
                <th className="px-5 py-3 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    Carregando…
                  </td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-5 py-6 text-slate-500" colSpan={7}>
                    Nenhuma questão encontrada com esses filtros.
                  </td>
                </tr>
              ) : (
                items.map((q) => {
                  const anyImg = hasAnyImage(q);
                  const isActive = isQuestionActive(q);
                  const themes = getThemes(q);
                  const examType = getExamType(q);
                  const examYear = getExamYear(q);
                  const examLabel = getExamLabel(q);
                  const levelLabel = String(q.level ?? q.nivel ?? "").trim();

                  return (
                    <tr key={q.id} className="question-row transition-colors hover:bg-slate-50/40">
                      <td className="align-top px-5 py-4">
                        <div className="line-clamp-2 max-w-[360px] font-semibold text-slate-900">
                          {getEnunciado(q)}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">ID: {q.id}</div>
                      </td>

                      <td className="align-top px-5 py-4">
                        <div className="font-semibold text-slate-900">
                          {(examType || "—") + (examYear ? ` (${examYear})` : "")}
                        </div>
                        <div className="mt-1 text-xs text-slate-500">{examLabel || "—"}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          {levelLabel ? `Nível ${levelLabel}` : "Sem nível"}
                        </div>
                      </td>

                      <td className="align-top px-5 py-4">
                        {themes.length > 0 ? (
                          <div className="flex max-w-[260px] flex-wrap gap-2">
                            {themes.slice(0, 2).map((t) => (
                              <Badge
                                key={t}
                                tone={themeFilter === t ? "amber" : "slate"}
                                title="Clique para filtrar por este tema"
                                onClick={() => {
                                  setThemeFilter((prev) => (prev === t ? null : t));
                                  setPage(1);
                                }}
                              >
                                {t}
                              </Badge>
                            ))}
                            {themes.length > 2 ? (
                              <Badge tone="slate" title={themes.slice(2).join(", ")}>
                                +{themes.length - 2}
                              </Badge>
                            ) : null}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-500">—</span>
                        )}
                      </td>

                      <td className="align-top px-5 py-4">
                        {anyImg ? (
                          <Badge tone="blue" onClick={() => openImageModal(q)} title="Ver imagens">
                            📷 Sim (ver)
                          </Badge>
                        ) : (
                          <Badge tone="slate">Não</Badge>
                        )}
                      </td>

                      <td className="align-top px-5 py-4">
                        <button
                          onClick={() => void toggleActive(q)}
                          disabled={togglingId === q.id}
                          className={cn(
                            "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-extrabold transition",
                            isActive
                              ? "border-[#86efac] bg-[#dcfce7] text-[#14532d] hover:bg-[#bbf7d0]"
                              : "border-[#f59e0b] bg-[#fef3c7] text-[#78350f] hover:bg-[#fde68a]",
                            togglingId === q.id ? "cursor-wait opacity-60" : ""
                          )}
                        >
                          <span className="text-sm">{isActive ? "●" : "○"}</span>
                          {isActive ? "Ativa" : "Inativa"}
                        </button>
                      </td>

                      <td className="align-top px-5 py-4">
                        <span className="font-extrabold text-slate-900">{q.correctOptionId ?? "—"}</span>
                      </td>

                      <td className="align-top px-5 py-4 text-right">
                        <div className="inline-flex flex-wrap items-center justify-end gap-2">
                          <Link
                            href={`/admin/questoes/${q.id}`}
                            className={buttonStyles({ variant: "secondary", size: "sm" })}
                          >
                            Editar
                          </Link>
                          <button
                            onClick={() => void duplicateQuestion(q)}
                            disabled={duplicatingId === q.id || deletingId === q.id}
                            className={cn(
                              buttonStyles({ variant: "secondary", size: "sm" }),
                              duplicatingId === q.id ? "cursor-wait opacity-60" : ""
                            )}
                          >
                            {duplicatingId === q.id ? "Duplicando..." : "Duplicar"}
                          </button>
                          <button
                            onClick={() => void deleteQuestion(q)}
                            disabled={deletingId === q.id || duplicatingId === q.id}
                            className={cn(
                              buttonStyles({ variant: "danger", size: "sm" }),
                              deletingId === q.id ? "cursor-wait opacity-60" : ""
                            )}
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

        <div className="flex items-center justify-between border-t bg-white px-5 py-4">
          <div className="text-xs text-slate-500">
            Página atual: <b>{page}</b> · Total resultados: <b>{totalFiltered}</b>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
              disabled={loading || page <= 1}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Anterior
            </button>
            <button
              onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
              disabled={loading || page >= totalPages}
              className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              Próxima
            </button>
          </div>
        </div>
      </div>

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
            {selectedImages.map((item) => (
              <div key={`${item.label}-${item.url}`} className="rounded-2xl border p-4">
                <div className="mb-2 text-xs font-extrabold text-slate-700">{item.label}</div>
                <img
                  src={item.url}
                  alt={item.label}
                  className="max-h-[420px] w-full rounded-xl border bg-slate-50 object-contain"
                />
              </div>
            ))}
          </div>
        )}
      </Modal>
    </AdminShell>
  );
}
