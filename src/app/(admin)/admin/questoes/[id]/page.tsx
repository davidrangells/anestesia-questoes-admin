"use client";

import AdminShell from "@/components/AdminShell";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { db } from "@/lib/firebase";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

type Option = {
  id: "A" | "B" | "C" | "D" | "E";
  text: string;
  imageUrl?: string | null;
};

type Attachment = {
  id: string;
  label: string;
  url: string;
};

type CatalogOption = {
  id: string;
  title: string;
  code: string;
  status: "ativo" | "inativo";
  levelId?: string | null;
  levelLabel?: string | null;
};

type QBQuestion = {
  prompt?: string;
  prompt_text?: string;
  explanation?: string;
  imageUrl?: string | null;
  options?: Option[];
  optionA_text?: string;
  optionA_imageUrl?: string | null;
  optionB_text?: string;
  optionB_imageUrl?: string | null;
  optionC_text?: string;
  optionC_imageUrl?: string | null;
  optionD_text?: string;
  optionD_imageUrl?: string | null;
  correctOptionId?: Option["id"];
  examId?: string | null;
  examType?: string;
  prova_tipo?: string;
  levelId?: string | null;
  level?: string;
  nivel?: string;
  examYear?: number | null;
  prova_ano?: number | null;
  examSource?: string;
  Prova?: string;
  themes?: string[];
  themeIds?: string[];
  isActive?: boolean;
  reference?: string;
  internalNote?: string;
  commentAttachments?: Attachment[];
  createdAt?: unknown;

  statement?: string;
  questionText?: string;
};

type QuestionFormState = {
  prompt: string;
  explanation: string;
  examId: string;
  examType: string;
  levelId: string;
  level: string;
  examYear: string;
  examSource: string;
  themes: string[];
  themeIds: string[];
  isActive: boolean;
  imageUrl: string;
  reference: string;
  internalNote: string;
  commentAttachments: Attachment[];
  options: Option[];
  correctOptionId: Option["id"];
};

function safeExt(name: string) {
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  if (!/^[a-z0-9]+$/.test(ext)) return "jpg";
  if (ext.length > 6) return "jpg";
  return ext;
}

function buildProofLabel(examType: string, examYear: string) {
  const normalizedYear = examYear.trim();
  if (!examType.trim() && !normalizedYear) return "";
  return normalizedYear ? `(${examType}-${normalizedYear})` : `(${examType})`;
}

async function uploadImageToStorage(file: File, folder: string) {
  const storage = getStorage();
  const ext = safeExt(file.name);
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path };
}

export default function EditarQuestaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [exams, setExams] = useState<CatalogOption[]>([]);
  const [levels, setLevels] = useState<CatalogOption[]>([]);
  const [themeOptions, setThemeOptions] = useState<CatalogOption[]>([]);
  const [form, setForm] = useState<QuestionFormState | null>(null);

  const patchForm = (patch: Partial<QuestionFormState>) => {
    setForm((prev) => (prev ? { ...prev, ...patch } : prev));
  };

  const canSave = useMemo(() => {
    if (!form) return false;
    return (
      form.prompt.trim().length > 0 &&
      form.options.every((option) => option.text.trim().length > 0) &&
      !saving
    );
  }, [form, saving]);

  const availableThemes = useMemo(() => {
    if (!themeOptions.length || !form) return [];
    if (!form.levelId) return themeOptions;

    const exactMatches = themeOptions.filter((item) => item.levelId === form.levelId);
    if (exactMatches.length) return exactMatches;

    return themeOptions.filter((item) => item.levelLabel === form.level || !item.levelId);
  }, [form, themeOptions]);

  useEffect(() => {
    let active = true;

    const loadCatalogs = async () => {
      setCatalogLoading(true);
      try {
        const [examSnap, levelSnap, themeSnap] = await Promise.all([
          getDocs(query(collection(db, "catalog_provas"), orderBy("title", "asc"))),
          getDocs(query(collection(db, "catalog_niveis"), orderBy("title", "asc"))),
          getDocs(query(collection(db, "catalog_temas"), orderBy("title", "asc"))),
        ]);

        if (!active) return;

        setExams(
          examSnap.docs
            .map((item) => ({
              id: item.id,
              title: String(item.data().title ?? ""),
              code: String(item.data().code ?? ""),
              status: (item.data().status as CatalogOption["status"]) ?? "ativo",
            }))
            .filter((item) => item.status === "ativo")
        );

        setLevels(
          levelSnap.docs
            .map((item) => ({
              id: item.id,
              title: String(item.data().title ?? ""),
              code: String(item.data().code ?? ""),
              status: (item.data().status as CatalogOption["status"]) ?? "ativo",
            }))
            .filter((item) => item.status === "ativo")
        );

        setThemeOptions(
          themeSnap.docs
            .map((item) => ({
              id: item.id,
              title: String(item.data().title ?? ""),
              code: String(item.data().code ?? ""),
              status: (item.data().status as CatalogOption["status"]) ?? "ativo",
              levelId: (item.data().levelId as string | null) ?? null,
              levelLabel: (item.data().levelLabel as string | null) ?? null,
            }))
            .filter((item) => item.status === "ativo")
        );
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    void loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!id) return;

    const loadQuestion = async () => {
      setLoading(true);
      try {
        const refDoc = doc(db, "questionsBank", id);
        const snap = await getDoc(refDoc);

        if (!snap.exists()) {
          alert("Questão não encontrada.");
          router.replace("/admin/questoes");
          return;
        }

        const data = snap.data() as QBQuestion;
        const prompt = (
          data.prompt ??
          data.prompt_text ??
          data.questionText ??
          data.statement ??
          ""
        ).toString();

        const options: Option[] =
          Array.isArray(data.options) && data.options.length
            ? data.options.map((item) => ({
                id: item.id,
                text: item.text ?? "",
                imageUrl: item.imageUrl ?? "",
              }))
            : [
                { id: "A", text: String(data.optionA_text ?? ""), imageUrl: String(data.optionA_imageUrl ?? "") },
                { id: "B", text: String(data.optionB_text ?? ""), imageUrl: String(data.optionB_imageUrl ?? "") },
                { id: "C", text: String(data.optionC_text ?? ""), imageUrl: String(data.optionC_imageUrl ?? "") },
                { id: "D", text: String(data.optionD_text ?? ""), imageUrl: String(data.optionD_imageUrl ?? "") },
              ];

        setForm({
          prompt,
          explanation: (data.explanation ?? "").toString(),
          examId: (data.examId ?? "").toString(),
          examType: (data.examType ?? data.prova_tipo ?? "").toString(),
          levelId: (data.levelId ?? "").toString(),
          level: (data.level ?? data.nivel ?? "").toString(),
          examYear:
            data.examYear != null
              ? String(data.examYear)
              : data.prova_ano != null
                ? String(data.prova_ano)
                : "",
          examSource: (data.examSource ?? data.Prova ?? "").toString(),
          themes: Array.isArray(data.themes) ? data.themes : [],
          themeIds: Array.isArray(data.themeIds) ? data.themeIds : [],
          isActive: data.isActive !== false,
          imageUrl: (data.imageUrl ?? "").toString(),
          reference: (data.reference ?? "").toString(),
          internalNote: (data.internalNote ?? "").toString(),
          commentAttachments: Array.isArray(data.commentAttachments) ? data.commentAttachments : [],
          options,
          correctOptionId: (data.correctOptionId ?? "A") as Option["id"],
        });
      } finally {
        setLoading(false);
      }
    };

    void loadQuestion();
  }, [id, router]);

  const setOption = (optionId: Option["id"], patch: Partial<Option>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        options: prev.options.map((option) =>
          option.id === optionId ? { ...option, ...patch } : option
        ),
      };
    });
  };

  const addThemeFromCatalog = (theme: CatalogOption) => {
    if (!form) return;
    patchForm({
      themeIds: form.themeIds.includes(theme.id) ? form.themeIds : [...form.themeIds, theme.id],
      themes: form.themes.includes(theme.title) ? form.themes : [...form.themes, theme.title],
    });
  };

  const removeTheme = (themeTitle: string) => {
    if (!form) return;
    patchForm({
      themes: form.themes.filter((item) => item !== themeTitle),
      themeIds: form.themeIds.filter((themeId) => {
        const selected = themeOptions.find((item) => item.id === themeId);
        return selected?.title !== themeTitle;
      }),
    });
  };

  const addAttachment = (label: string, url: string) => {
    if (!form || !url.trim()) return;
    patchForm({
      commentAttachments: [
        ...form.commentAttachments,
        {
          id: crypto.randomUUID(),
          label: label.trim() || "Anexo",
          url: url.trim(),
        },
      ],
    });
  };

  const removeAttachment = (attachmentId: string) => {
    if (!form) return;
    patchForm({
      commentAttachments: form.commentAttachments.filter((item) => item.id !== attachmentId),
    });
  };

  const handleUploadPrompt = async (file: File | null) => {
    if (!file) return;
    setUploading("prompt");
    try {
      const { url } = await uploadImageToStorage(file, "admin_uploads/questionsBank/prompt");
      patchForm({ imageUrl: url });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadOption = async (optionId: Option["id"], file: File | null) => {
    if (!file) return;
    setUploading(optionId);
    try {
      const { url } = await uploadImageToStorage(file, `admin_uploads/questionsBank/options/${optionId}`);
      setOption(optionId, { imageUrl: url });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadAttachment = async (file: File | null) => {
    if (!file) return;
    setUploading("attachment");
    try {
      const { url } = await uploadImageToStorage(file, "admin_uploads/questionsBank/attachments");
      addAttachment(file.name, url);
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!form || !canSave) return;
    setSaving(true);
    try {
      const numericYear = form.examYear.trim() ? Number(form.examYear.trim()) : null;
      const examYear = typeof numericYear === "number" && Number.isFinite(numericYear) ? numericYear : null;
      const normalizedOptions = form.options.map((option) => ({
        id: option.id,
        text: option.text.trim(),
        imageUrl: option.imageUrl?.trim() ? option.imageUrl.trim() : null,
      }));
      const optionMap = Object.fromEntries(
        normalizedOptions.map((option) => [option.id, option])
      ) as Record<Option["id"], { id: string; text: string; imageUrl: string | null }>;
      const proofLabel = buildProofLabel(form.examType, form.examYear);

      await updateDoc(doc(db, "questionsBank", id), {
        prompt: form.prompt.trim(),
        prompt_text: form.prompt.trim(),
        explanation: form.explanation.trim(),
        explanationFormat: "html",
        examId: form.examId || null,
        examType: form.examType,
        prova_tipo: form.examType,
        levelId: form.levelId || null,
        level: form.level,
        nivel: form.level,
        examYear,
        prova_ano: examYear,
        examSource: proofLabel,
        Prova: proofLabel,
        themes: form.themes,
        themeIds: form.themeIds,
        isActive: form.isActive,
        status: form.isActive ? "ativo" : "inativo",
        imageUrl: form.imageUrl.trim() || null,
        options: normalizedOptions,
        optionA_text: optionMap.A?.text ?? "",
        optionA_imageUrl: optionMap.A?.imageUrl ?? null,
        optionB_text: optionMap.B?.text ?? "",
        optionB_imageUrl: optionMap.B?.imageUrl ?? null,
        optionC_text: optionMap.C?.text ?? "",
        optionC_imageUrl: optionMap.C?.imageUrl ?? null,
        optionD_text: optionMap.D?.text ?? "",
        optionD_imageUrl: optionMap.D?.imageUrl ?? null,
        correctOptionId: form.correctOptionId,
        reference: form.reference.trim(),
        internalNote: form.internalNote.trim(),
        commentAttachments: form.commentAttachments,
        updatedAt: serverTimestamp(),
      });

      alert("Salvo.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível salvar.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Tem certeza que deseja excluir esta questão?")) return;
    try {
      await deleteDoc(doc(db, "questionsBank", id));
      router.replace("/admin/questoes");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível excluir.";
      alert(message);
    }
  };

  if (loading || !form) {
    return (
      <AdminShell title="Editar questão" subtitle="Carregando...">
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Carregando...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell
      title="Editar questão"
      subtitle={`questionsBank/${id}`}
      actions={
        <div className="flex items-center gap-2">
          <Link
            href="/admin/questoes"
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Voltar
          </Link>
          <button
            onClick={save}
            disabled={!canSave}
            className={cn(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              canSave ? "bg-slate-900 hover:bg-slate-800" : "cursor-not-allowed bg-slate-300"
            )}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Enunciado</div>
                <div className="text-xs text-slate-500">Compatível com prompt e prompt_text.</div>
              </div>
              <label className="cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => handleUploadPrompt(event.target.files?.[0] || null)}
                />
                <span className="inline-flex rounded-xl border bg-white px-3 py-2 hover:bg-slate-50">
                  {uploading === "prompt" ? "Enviando..." : "Upload imagem"}
                </span>
              </label>
            </div>

            <textarea
              value={form.prompt}
              onChange={(event) => patchForm({ prompt: event.target.value })}
              className="mt-3 min-h-[160px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />

            <div className="mt-3">
              <div className="mb-1 text-xs font-semibold text-slate-600">Imagem do enunciado (opcional)</div>
              <input
                value={form.imageUrl}
                onChange={(event) => patchForm({ imageUrl: event.target.value })}
                placeholder="URL da imagem"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              {form.imageUrl.trim() ? (
                <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                  <img
                    src={form.imageUrl}
                    alt="Preview enunciado"
                    className="max-h-[420px] w-full rounded-xl border bg-white object-contain"
                  />
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Alternativas</div>
            <div className="text-xs text-slate-500">Campos: options[] + correctOptionId.</div>

            <div className="mt-4 space-y-3">
              {form.options.slice(0, 4).map((option) => {
                const isCorrect = form.correctOptionId === option.id;
                return (
                  <div key={option.id} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => patchForm({ correctOptionId: option.id })}
                          className={cn(
                            "h-9 w-9 rounded-xl border text-sm font-black",
                            isCorrect
                              ? "border-emerald-600 bg-emerald-600 text-white"
                              : "bg-white hover:bg-slate-50"
                          )}
                        >
                          {option.id}
                        </button>
                        <div className="text-xs text-slate-500">
                          {isCorrect ? "Correta" : "Marcar como correta"}
                        </div>
                      </div>

                      <label className="cursor-pointer text-xs font-semibold text-slate-700">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => handleUploadOption(option.id, event.target.files?.[0] || null)}
                        />
                        <span className="inline-flex rounded-xl border bg-white px-3 py-2 hover:bg-slate-50">
                          {uploading === option.id ? "Enviando..." : "Upload imagem"}
                        </span>
                      </label>
                    </div>

                    <textarea
                      value={option.text}
                      onChange={(event) => setOption(option.id, { text: event.target.value })}
                      className="mt-3 min-h-[80px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    <div className="mt-3">
                      <div className="mb-1 text-xs font-semibold text-slate-600">
                        Imagem da alternativa {option.id} (opcional)
                      </div>
                      <input
                        value={option.imageUrl ?? ""}
                        onChange={(event) => setOption(option.id, { imageUrl: event.target.value })}
                        placeholder="URL da imagem da alternativa"
                        className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Comentário / Explicação</div>
            <div className="text-xs text-slate-500">Campo: explanation.</div>
            <textarea
              value={form.explanation}
              onChange={(event) => patchForm({ explanation: event.target.value })}
              className="mt-3 min-h-[180px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Metadados</div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Prova</div>
                <select
                  value={form.examId}
                  onChange={(event) => {
                    const nextExam = exams.find((item) => item.id === event.target.value);
                    const nextExamType = nextExam?.title || form.examType;
                    patchForm({
                      examId: event.target.value,
                      examType: nextExamType,
                      examSource: buildProofLabel(nextExamType, form.examYear),
                    });
                  }}
                  className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                >
                  {catalogLoading && exams.length === 0 ? <option value="">Carregando...</option> : null}
                  {exams.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Ano da prova</div>
                <input
                  value={form.examYear}
                  onChange={(event) => {
                    const nextYear = event.target.value.replace(/[^\d]/g, "").slice(0, 4);
                    patchForm({
                      examYear: nextYear,
                      examSource: buildProofLabel(form.examType, nextYear),
                    });
                  }}
                  placeholder="2026"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Nível</div>
                <select
                  value={form.levelId}
                  onChange={(event) => {
                    const nextLevel = levels.find((item) => item.id === event.target.value);
                    setSelectedThemeId("");
                    patchForm({
                      levelId: event.target.value,
                      level: nextLevel?.title || form.level,
                      themeIds: [],
                      themes: [],
                    });
                  }}
                  className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                >
                  {catalogLoading && levels.length === 0 ? <option value="">Carregando...</option> : null}
                  {levels.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="rounded-2xl border bg-slate-50 p-4">
                <div className="text-xs font-semibold text-slate-600">Rótulo gerado</div>
                <div className="mt-1 text-sm font-bold text-slate-900">{form.examSource || "—"}</div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Status</div>
                  <div className="text-xs text-slate-500">{form.isActive ? "Ativo" : "Inativo"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => patchForm({ isActive: !form.isActive })}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-extrabold",
                    form.isActive
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-amber-100 bg-amber-50 text-amber-700"
                  )}
                >
                  {form.isActive ? "● Ativo" : "○ Inativo"}
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Tema</div>
            <div className="mt-1 text-xs text-slate-500">Selecione apenas temas já cadastrados.</div>

            <div className="mt-3 flex gap-2">
              <select
                value={selectedThemeId}
                onChange={(event) => setSelectedThemeId(event.target.value)}
                className="min-w-0 flex-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              >
                <option value="">Selecione um tema</option>
                {availableThemes.map((theme) => (
                  <option key={theme.id} value={theme.id}>
                    {theme.title}
                  </option>
                ))}
              </select>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={!selectedThemeId}
                onClick={() => {
                  const theme = availableThemes.find((item) => item.id === selectedThemeId);
                  if (!theme) return;
                  addThemeFromCatalog(theme);
                  setSelectedThemeId("");
                }}
              >
                Adicionar
              </Button>
            </div>

            <div className="mt-3">
              <div className="mb-2 text-xs font-semibold text-slate-600">Temas cadastrados para o nível selecionado</div>
              <div className="flex flex-wrap gap-2">
                {availableThemes.length ? (
                  availableThemes.map((theme) => {
                    const selected = form.themeIds.includes(theme.id);
                    return (
                      <button
                        key={theme.id}
                        type="button"
                        onClick={() => (selected ? removeTheme(theme.title) : addThemeFromCatalog(theme))}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition",
                          selected
                            ? "border-blue-200 bg-blue-50 text-blue-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        )}
                      >
                        {theme.title}
                      </button>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-500">Nenhum tema ativo para este nível.</div>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {form.themes.length ? (
                form.themes.map((theme) => (
                  <button
                    key={theme}
                    type="button"
                    onClick={() => removeTheme(theme)}
                    className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                  >
                    {theme} x
                  </button>
                ))
              ) : (
                <div className="text-xs text-slate-500">Nenhum tema adicionado.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Referência</div>
            <div className="mt-1 text-xs text-slate-500">Campo bibliográfico para rastrear a origem da questão.</div>
            <textarea
              value={form.reference}
              onChange={(event) => patchForm({ reference: event.target.value })}
              placeholder="Livro, capítulo, artigo, banca, legislação..."
              className="mt-3 min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Nota interna</div>
            <div className="mt-1 text-xs text-slate-500">Visível apenas internamente, não destinada ao aluno final.</div>
            <textarea
              value={form.internalNote}
              onChange={(event) => patchForm({ internalNote: event.target.value })}
              placeholder="Observações do time, pendências, avisos..."
              className="mt-3 min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Anexos do comentário</div>
            <div className="mt-1 text-xs text-slate-500">Use links ou envie arquivos para guardar material de apoio interno.</div>

            <div className="mt-3 space-y-3">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => {
                  const label = window.prompt("Nome do anexo");
                  const url = window.prompt("URL do anexo");
                  if (!url?.trim()) return;
                  addAttachment(label || "Anexo", url);
                }}
              >
                Adicionar link
              </Button>

              <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                {uploading === "attachment" ? "Enviando..." : "Enviar arquivo"}
                <input
                  type="file"
                  className="hidden"
                  onChange={(event) => handleUploadAttachment(event.target.files?.[0] || null)}
                />
              </label>
            </div>

            <div className="mt-4 space-y-2">
              {form.commentAttachments.length ? (
                form.commentAttachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between gap-3 rounded-xl border bg-slate-50 px-3 py-2"
                  >
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className="min-w-0 truncate text-sm font-medium text-blue-700 underline"
                    >
                      {attachment.label}
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeAttachment(attachment.id)}
                    >
                      Remover
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500">Nenhum anexo adicionado.</div>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="text-sm font-extrabold text-rose-900">Zona de risco</div>
            <div className="mt-1 text-xs text-rose-700">Excluir remove a questão do questionsBank.</div>
            <button
              onClick={remove}
              className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
            >
              Excluir questão
            </button>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
