"use client";

import { cn } from "@/lib/cn";
import {
  loadQuestionMediaGallery,
  registerQuestionMedia,
  uploadQuestionAsset,
  type QuestionGalleryItem,
} from "@/lib/questionMedia";
import { Button } from "@/components/ui/Button";
import { collection, getDocs, orderBy, query } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useEffect, useMemo, useRef, useState } from "react";

export type QuestionOption = {
  id: "A" | "B" | "C" | "D" | "E";
  text: string;
  imageUrl?: string | null;
};

export type QuestionAttachment = {
  id: string;
  label: string;
  url: string;
};

export type QuestionCatalogOption = {
  id: string;
  title: string;
  code: string;
  status: "ativo" | "inativo";
  levelId?: string | null;
  levelLabel?: string | null;
};

export type QuestionFormState = {
  prompt: string;
  explanation: string;
  examId: string;
  examType: string;
  levelId: string;
  level: string;
  examYear: string;
  themes: string[];
  themeIds: string[];
  isActive: boolean;
  imageUrl: string;
  reference: string;
  internalNote: string;
  commentAttachments: QuestionAttachment[];
  options: QuestionOption[];
  correctOptionId: QuestionOption["id"];
  shuffleOptions: boolean;
};

type QuestionDocLike = {
  prompt?: string;
  prompt_text?: string;
  explanation?: string;
  imageUrl?: string | null;
  options?: QuestionOption[];
  optionA_text?: string;
  optionA_imageUrl?: string | null;
  optionB_text?: string;
  optionB_imageUrl?: string | null;
  optionC_text?: string;
  optionC_imageUrl?: string | null;
  optionD_text?: string;
  optionD_imageUrl?: string | null;
  optionE_text?: string;
  optionE_imageUrl?: string | null;
  correctOptionId?: QuestionOption["id"];
  shuffleOptions?: boolean;
  examId?: string | null;
  examType?: string;
  prova_tipo?: string;
  levelId?: string | null;
  level?: string;
  nivel?: string;
  examYear?: number | null;
  prova_ano?: number | null;
  themes?: string[];
  themeIds?: string[];
  isActive?: boolean;
  reference?: string;
  internalNote?: string;
  commentAttachments?: QuestionAttachment[];
  statement?: string;
  questionText?: string;
};

type QuestionEditorFormProps = {
  mode: "create" | "edit";
  initialValue: QuestionFormState;
  onCancel: () => void;
  onSubmit: (payload: ReturnType<typeof buildQuestionPayload>, form: QuestionFormState) => Promise<void>;
  onDelete?: () => Promise<void> | void;
};

type RichTextEditorProps = {
  label: string;
  helper?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onRequestImage: () => void;
  pendingImageUrl?: string | null;
  onPendingImageHandled: () => void;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function stripHtml(value: string) {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

export function buildProofLabel(examType: string, examYear: string) {
  const normalizedType = examType.trim();
  const normalizedYear = examYear.trim();
  if (!normalizedType && !normalizedYear) return "";
  return normalizedYear ? `(${normalizedType}-${normalizedYear})` : `(${normalizedType})`;
}

const REQUIRED_OPTION_IDS = ["A", "B", "C", "D"] as const;

function createBaseOptions(): QuestionOption[] {
  return REQUIRED_OPTION_IDS.map((id) => ({ id, text: "", imageUrl: "" }));
}

function normalizeQuestionOptions(
  options: QuestionOption[],
  correctOptionId?: QuestionOption["id"]
): QuestionOption[] {
  const optionMap = new Map(
    options.map((option) => [
      option.id,
      {
        id: option.id,
        text: String(option.text ?? ""),
        imageUrl: String(option.imageUrl ?? ""),
      },
    ])
  );

  const normalized = REQUIRED_OPTION_IDS.map(
    (id) => optionMap.get(id) ?? { id, text: "", imageUrl: "" }
  );

  const optionalE = optionMap.get("E");
  const shouldIncludeE =
    Boolean(optionalE?.text?.trim()) ||
    Boolean(optionalE?.imageUrl?.trim()) ||
    correctOptionId === "E";

  if (shouldIncludeE) {
    normalized.push(optionalE ?? { id: "E", text: "", imageUrl: "" });
  }

  return normalized;
}

export function createEmptyQuestionForm(): QuestionFormState {
  return {
    prompt: "",
    explanation: "",
    examId: "",
    examType: "TSA",
    levelId: "",
    level: "R1",
    examYear: "",
    themes: [],
    themeIds: [],
    isActive: true,
    imageUrl: "",
    reference: "",
    internalNote: "",
    commentAttachments: [],
    options: createBaseOptions(),
    correctOptionId: "A",
    shuffleOptions: true,
  };
}

export function questionDocToForm(data: QuestionDocLike): QuestionFormState {
  const prompt = (
    data.prompt ??
    data.prompt_text ??
    data.questionText ??
    data.statement ??
    ""
  ).toString();

  const options: QuestionOption[] =
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
          { id: "E", text: String(data.optionE_text ?? ""), imageUrl: String(data.optionE_imageUrl ?? "") },
        ];

  const correctOptionId = (data.correctOptionId ?? "A") as QuestionOption["id"];

  return {
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
    themes: Array.isArray(data.themes) ? data.themes : [],
    themeIds: Array.isArray(data.themeIds) ? data.themeIds : [],
    isActive: data.isActive !== false,
    imageUrl: (data.imageUrl ?? "").toString(),
    reference: (data.reference ?? "").toString(),
    internalNote: (data.internalNote ?? "").toString(),
    commentAttachments: Array.isArray(data.commentAttachments) ? data.commentAttachments : [],
    options: normalizeQuestionOptions(options, correctOptionId),
    correctOptionId,
    shuffleOptions: data.shuffleOptions !== false,
  };
}

export function buildQuestionPayload(form: QuestionFormState) {
  const normalizedYear = form.examYear.trim();
  const proofYear = normalizedYear ? Number(normalizedYear) : null;
  const proofLabel = buildProofLabel(form.examType, normalizedYear);
  const normalizedOptions = form.options.map((option) => ({
    id: option.id,
    text: option.text.trim(),
    imageUrl: option.imageUrl?.trim() ? option.imageUrl.trim() : null,
  }));
  const optionMap = Object.fromEntries(
    normalizedOptions.map((option) => [option.id, option])
  ) as Record<QuestionOption["id"], { id: string; text: string; imageUrl: string | null }>;

  return {
    prompt: form.prompt.trim(),
    prompt_text: form.prompt.trim(),
    explanation: form.explanation.trim(),
    explanationFormat: "html",
    examId: form.examId || null,
    examType: form.examType,
    prova_tipo: form.examType,
    levelId: form.levelId || null,
    examYear: proofYear,
    prova_ano: proofYear,
    examSource: proofLabel,
    Prova: proofLabel,
    level: form.level,
    nivel: form.level,
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
    optionE_text: optionMap.E?.text ?? "",
    optionE_imageUrl: optionMap.E?.imageUrl ?? null,
    correctOptionId: form.correctOptionId,
    shuffleOptions: form.shuffleOptions,
    reference: form.reference.trim(),
    internalNote: form.internalNote.trim(),
    commentAttachments: form.commentAttachments,
  };
}

function normalizeThemeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function RichTextEditor({
  label,
  helper,
  placeholder,
  value,
  onChange,
  onRequestImage,
  pendingImageUrl,
  onPendingImageHandled,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [previewMode, setPreviewMode] = useState(false);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value;
  }, [value]);

  useEffect(() => {
    if (!pendingImageUrl || !editorRef.current) return;
    editorRef.current.focus();
    document.execCommand(
      "insertHTML",
      false,
      `<img src="${escapeHtml(pendingImageUrl)}" alt="Imagem adicionada no comentário" />`
    );
    onChange(editorRef.current.innerHTML ?? "");
    onPendingImageHandled();
  }, [onChange, onPendingImageHandled, pendingImageUrl]);

  const syncValue = () => {
    onChange(editorRef.current?.innerHTML ?? "");
  };

  const runCommand = (command: string, commandValue?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, commandValue);
    syncValue();
  };

  const insertLink = () => {
    const url = window.prompt("Cole a URL do link");
    if (!url?.trim()) return;

    const labelText = window.prompt("Texto do link (opcional)")?.trim() || url.trim();
    runCommand(
      "insertHTML",
      `<a href="${escapeHtml(url.trim())}" target="_blank" rel="noreferrer">${escapeHtml(labelText)}</a>`
    );
  };

  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-5 py-4">
        <div className="text-sm font-extrabold text-slate-900">{label}</div>
        {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
      </div>

      <div className="overflow-x-auto border-b bg-slate-50/70 px-3">
        <div className="flex flex-wrap gap-x-1 gap-y-1 text-sm font-medium text-slate-700">
          {["Editar", "Inserir", "Visualizar", "Formatar", "Tabela", "Ferramentas"].map((item) => (
            <button
              key={item}
              type="button"
              className="rounded-xl px-3 py-3 transition hover:bg-white hover:text-slate-900"
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto border-b bg-white px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("undo")}>
            ↶
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("redo")}>
            ↷
          </Button>
          <select
            defaultValue="P"
            onChange={(event) => runCommand("formatBlock", event.target.value)}
            className="min-h-9 rounded-xl border border-slate-200 bg-white px-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
          >
            <option value="P">Parágrafo</option>
            <option value="H2">Título</option>
            <option value="H3">Subtítulo</option>
            <option value="BLOCKQUOTE">Citação</option>
          </select>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("bold")}>
            B
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("italic")}>
            I
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyLeft")}>
            ⬅
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyCenter")}>
            ☰
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyRight")}>
            ➡
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyFull")}>
            ≣
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("insertUnorderedList")}>
            • Lista
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("insertOrderedList")}>
            1. Lista
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("outdent")}>
            ⟵
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("indent")}>
            ⟶
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={insertLink}>
            🔗
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={onRequestImage}>
            🖼
          </Button>
          <Button
            type="button"
            variant={previewMode ? "primary" : "secondary"}
            size="sm"
            onClick={() => setPreviewMode((prev) => !prev)}
          >
            ▶
          </Button>
        </div>
      </div>

      <div className="p-5">
        {previewMode ? (
          <div
            className="min-h-[220px] rounded-xl border bg-slate-50 p-4 text-sm [&_img]:max-h-[220px] [&_img]:rounded-xl [&_img]:border [&_img]:bg-white [&_img]:object-contain [&_img]:p-1 [&_a]:text-blue-700 [&_a]:underline"
            dangerouslySetInnerHTML={{
              __html: value || `<p class="text-slate-400">${escapeHtml(placeholder || "Sem conteúdo.")}</p>`,
            }}
          />
        ) : (
          <div className="relative">
            {!stripHtml(value) ? (
              <div className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">
                {placeholder || "Digite aqui..."}
              </div>
            ) : null}
            <div
              ref={editorRef}
              contentEditable
              suppressContentEditableWarning
              onInput={syncValue}
              onBlur={syncValue}
              className="min-h-[220px] rounded-xl border p-4 text-sm outline-none focus-within:ring-2 focus-within:ring-blue-200 [&_img]:max-h-[220px] [&_img]:rounded-xl [&_img]:border [&_img]:bg-slate-50 [&_img]:object-contain [&_img]:p-1 [&_a]:text-blue-700 [&_a]:underline"
            />
          </div>
        )}
      </div>
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
        <div className="w-full max-w-4xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-5 py-4">
            <div className="text-lg font-black text-slate-900">{title}</div>
            <Button type="button" variant="secondary" size="sm" onClick={onClose}>
              Fechar
            </Button>
          </div>
          <div className="max-h-[80vh] overflow-auto p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export function QuestionEditorForm({
  mode,
  initialValue,
  onCancel,
  onSubmit,
  onDelete,
}: QuestionEditorFormProps) {
  const commentImageInputRef = useRef<HTMLInputElement | null>(null);
  const [form, setForm] = useState<QuestionFormState>(initialValue);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [exams, setExams] = useState<QuestionCatalogOption[]>([]);
  const [levels, setLevels] = useState<QuestionCatalogOption[]>([]);
  const [themeOptions, setThemeOptions] = useState<QuestionCatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryItems, setGalleryItems] = useState<QuestionGalleryItem[]>([]);
  const [commentImageModalOpen, setCommentImageModalOpen] = useState(false);
  const [pendingEditorImageUrl, setPendingEditorImageUrl] = useState<string | null>(null);

  useEffect(() => {
    setForm(initialValue);
    setSuccessMsg(null);
  }, [initialValue]);

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

        const nextExams = examSnap.docs
          .map((item) => ({
            id: item.id,
            title: String(item.data().title ?? ""),
            code: String(item.data().code ?? ""),
            status: (item.data().status as QuestionCatalogOption["status"]) ?? "ativo",
          }))
          .filter((item) => item.status === "ativo");

        const nextLevels = levelSnap.docs
          .map((item) => ({
            id: item.id,
            title: String(item.data().title ?? ""),
            code: String(item.data().code ?? ""),
            status: (item.data().status as QuestionCatalogOption["status"]) ?? "ativo",
          }))
          .filter((item) => item.status === "ativo");

        const nextThemes = themeSnap.docs
          .map((item) => ({
            id: item.id,
            title: String(item.data().title ?? ""),
            code: String(item.data().code ?? ""),
            status: (item.data().status as QuestionCatalogOption["status"]) ?? "ativo",
            levelId: (item.data().levelId as string | null) ?? null,
            levelLabel: (item.data().levelLabel as string | null) ?? null,
          }))
          .filter((item) => item.status === "ativo");

        setExams(nextExams);
        setLevels(nextLevels);
        setThemeOptions(nextThemes);

        setForm((prev) => {
          const exam = nextExams.find((item) => item.id === prev.examId) ?? nextExams[0];
          const level = nextLevels.find((item) => item.id === prev.levelId) ?? nextLevels[0];
          const allowedThemes = nextThemes.filter((item) => !level?.id || item.levelId === level.id);
          const persistedThemeIds = prev.themeIds.filter((themeId) =>
            allowedThemes.some((item) => item.id === themeId)
          );
          const fallbackThemeIds = prev.themes
            .map((themeTitle) => {
              const normalizedTheme = normalizeThemeKey(themeTitle);
              const sameLevelMatch =
                allowedThemes.find((item) => normalizeThemeKey(item.title) === normalizedTheme) ?? null;
              if (sameLevelMatch) return sameLevelMatch.id;

              const anyLevelMatch =
                nextThemes.find((item) => normalizeThemeKey(item.title) === normalizedTheme) ?? null;
              return anyLevelMatch?.id ?? "";
            })
            .filter(Boolean);
          const nextThemeIds = Array.from(new Set([...persistedThemeIds, ...fallbackThemeIds]));

          return {
            ...prev,
            examId: prev.examId || exam?.id || "",
            examType: prev.examType || exam?.title || prev.examType,
            levelId: prev.levelId || level?.id || "",
            level: prev.level || level?.title || prev.level,
            themeIds: nextThemeIds,
            themes: nextThemeIds
              .map(
                (themeId) =>
                  allowedThemes.find((item) => item.id === themeId)?.title ||
                  nextThemes.find((item) => item.id === themeId)?.title ||
                  ""
              )
              .filter(Boolean),
          };
        });
      } finally {
        if (active) setCatalogLoading(false);
      }
    };

    void loadCatalogs();

    return () => {
      active = false;
    };
  }, []);

  const canSave = useMemo(() => {
    const hasPrompt = form.prompt.trim().length > 0;
    const hasOptions = REQUIRED_OPTION_IDS.every((optionId) =>
      form.options.find((option) => option.id === optionId)?.text.trim().length
    );
    const hasTheme = form.themes.length > 0;
    const hasExam = form.examId.trim().length > 0;
    const hasLevel = form.levelId.trim().length > 0;
    return hasPrompt && hasOptions && hasTheme && hasExam && hasLevel && !saving;
  }, [form, saving]);

  const availableThemes = useMemo(() => {
    if (!themeOptions.length) return [];
    if (!form.levelId) return themeOptions;

    const exactMatches = themeOptions.filter((item) => item.levelId === form.levelId);
    if (exactMatches.length) return exactMatches;

    return themeOptions.filter((item) => item.levelLabel === form.level || !item.levelId);
  }, [form.level, form.levelId, themeOptions]);

  const setOption = (optionId: QuestionOption["id"], patch: Partial<QuestionOption>) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((option) =>
        option.id === optionId ? { ...option, ...patch } : option
      ),
    }));
  };

  const addOptionalOptionE = () => {
    setForm((prev) => {
      if (prev.options.some((option) => option.id === "E")) return prev;
      return {
        ...prev,
        options: [...prev.options, { id: "E", text: "", imageUrl: "" }],
      };
    });
  };

  const removeOptionalOptionE = () => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.filter((option) => option.id !== "E"),
      correctOptionId: prev.correctOptionId === "E" ? "A" : prev.correctOptionId,
    }));
  };

  const addThemeFromCatalog = (theme: QuestionCatalogOption) => {
    setForm((prev) => {
      if (prev.themeIds.includes(theme.id)) return prev;
      return {
        ...prev,
        themeIds: [...prev.themeIds, theme.id],
        themes: [...prev.themes, theme.title],
      };
    });
  };

  const removeTheme = (themeTitle: string) => {
    setForm((prev) => ({
      ...prev,
      themes: prev.themes.filter((item) => item !== themeTitle),
      themeIds: prev.themeIds.filter((themeId) => {
        const selected = themeOptions.find((item) => item.id === themeId);
        return selected?.title !== themeTitle;
      }),
    }));
  };

  const loadGalleryItems = async () => {
    setGalleryLoading(true);
    try {
      setGalleryItems(await loadQuestionMediaGallery(24));
    } finally {
      setGalleryLoading(false);
    }
  };

  const openCommentImageModal = async () => {
    setCommentImageModalOpen(true);
    await loadGalleryItems();
  };

  const closeCommentImageModal = () => {
    if (uploading === "comment-image") return;
    setCommentImageModalOpen(false);
  };

  const insertCommentImage = (url: string) => {
    setPendingEditorImageUrl(url);
    setCommentImageModalOpen(false);
  };

  const addAttachment = (label: string, url: string) => {
    const nextUrl = url.trim();
    if (!nextUrl) return;
    const nextLabel = label.trim();

    setForm((prev) => ({
      ...prev,
      commentAttachments: [
        ...prev.commentAttachments,
        {
          id: crypto.randomUUID(),
          label: nextLabel || "Anexo",
          url: nextUrl,
        },
      ],
    }));
  };

  const removeAttachment = (attachmentId: string) => {
    setForm((prev) => ({
      ...prev,
      commentAttachments: prev.commentAttachments.filter((item) => item.id !== attachmentId),
    }));
  };

  const handleUploadPrompt = async (file: File) => {
    setUploading("prompt");
    try {
      const { url, path } = await uploadQuestionAsset(file, "admin_uploads/questionsBank/prompt");
      setForm((prev) => ({ ...prev, imageUrl: url }));
      await registerQuestionMedia({ url, path, origin: "questionsBank", kind: "prompt", label: "Enunciado" });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadOption = async (optionId: QuestionOption["id"], file: File) => {
    setUploading(optionId);
    try {
      const { url, path } = await uploadQuestionAsset(file, `admin_uploads/questionsBank/options/${optionId}`);
      setOption(optionId, { imageUrl: url });
      await registerQuestionMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "option",
        label: `Alternativa ${optionId}`,
      });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    setUploading("attachment");
    try {
      const { url, path } = await uploadQuestionAsset(file, "admin_uploads/questionsBank/attachments");
      addAttachment(file.name, url);
      await registerQuestionMedia({ url, path, origin: "questionsBank", kind: "attachment", label: file.name });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadCommentImage = async (file: File) => {
    setUploading("comment-image");
    try {
      const { url, path } = await uploadQuestionAsset(file, "admin_uploads/questionsBank/comment-images");
      await registerQuestionMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "attachment",
        label: `Comentário - ${file.name}`,
      });
      await loadGalleryItems();
      insertCommentImage(url);
    } finally {
      setUploading(null);
    }
  };

  const handleSubmit = async () => {
    if (!canSave) return;
    setSaving(true);
    setSuccessMsg(null);
    try {
      await onSubmit(buildQuestionPayload(form), form);
      setSuccessMsg("Dados salvos com sucesso.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Erro ao salvar.";
      alert(message);
    } finally {
      setSaving(false);
    }
  };

  const titleText = mode === "create" ? "Criar nova questão" : "Salvar alterações";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        <Button onClick={onCancel} variant="secondary" size="sm">
          Voltar
        </Button>
        <Button onClick={handleSubmit} disabled={!canSave} variant="primary" size="sm">
          {saving ? "Salvando..." : titleText}
        </Button>
      </div>

      {successMsg ? (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          {successMsg}
        </div>
      ) : null}

      <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
        <div className="min-w-0 space-y-6">
          <div className="min-w-0 rounded-2xl border bg-white p-6">
            <div className="text-sm font-bold text-slate-900">Enunciado</div>
            <div className="mt-1 break-words text-xs text-slate-500">
              Campo principal da questão. Compatível com prompt e prompt_text.
            </div>

            <textarea
              value={form.prompt}
              onChange={(event) => setForm((prev) => ({ ...prev, prompt: event.target.value }))}
              placeholder="Digite o enunciado completo da questão..."
              className="mt-3 min-h-[180px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />

            <div className="mt-4">
              <div className="mb-1 text-xs font-semibold text-slate-600">Imagem do enunciado (opcional)</div>
              <input
                value={form.imageUrl}
                onChange={(event) => setForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder="URL da imagem"
                className="w-full rounded-xl border px-4 py-3 text-sm"
              />

              <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                {uploading === "prompt" ? "Enviando..." : "Enviar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUploadPrompt(file);
                  }}
                />
              </label>

              {form.imageUrl ? (
                <div className="mt-4 rounded-xl border bg-slate-50 p-3">
                  <img src={form.imageUrl} alt="Preview" className="max-h-[300px] w-full object-contain" />
                </div>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border bg-white p-6">
            <div className="text-sm font-bold text-slate-900">Alternativas</div>
            <div className="mt-1 text-xs text-slate-500">
              Cadastre as respostas e marque a correta. O formulário salva em estrutura aninhada e nas colunas A-D da importação.
            </div>

            <div className="mt-4 space-y-4">
              {form.options.map((option) => {
                const isCorrect = form.correctOptionId === option.id;
                const isOptionalE = option.id === "E";
                return (
                  <div key={option.id} className="rounded-xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="font-semibold">Alternativa {option.id}</div>
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        {isOptionalE ? (
                          <button
                            type="button"
                            onClick={removeOptionalOptionE}
                            className="rounded-full bg-rose-50 px-3 py-1 text-xs font-bold text-rose-700"
                          >
                            Remover
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => setForm((prev) => ({ ...prev, correctOptionId: option.id }))}
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold",
                            isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100"
                          )}
                        >
                          {isCorrect ? "Correta" : "Marcar correta"}
                        </button>
                      </div>
                    </div>

                    <textarea
                      value={option.text}
                      onChange={(event) => setOption(option.id, { text: event.target.value })}
                      placeholder={`Texto da alternativa ${option.id}`}
                      className="mt-3 min-h-[90px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    <div className="mt-3 flex flex-col gap-3">
                      <input
                        value={option.imageUrl || ""}
                        onChange={(event) => setOption(option.id, { imageUrl: event.target.value })}
                        placeholder="URL da imagem da alternativa"
                        className="rounded-xl border px-4 py-3 text-sm"
                      />

                      <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                        {uploading === option.id ? "Enviando..." : "Enviar imagem"}
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(event) => {
                            const file = event.target.files?.[0];
                            if (file) void handleUploadOption(option.id, file);
                          }}
                        />
                      </label>

                      {option.imageUrl ? (
                        <div className="rounded-xl border bg-slate-50 p-3">
                          <img
                            src={option.imageUrl}
                            alt={`Preview ${option.id}`}
                            className="max-h-[250px] w-full object-contain"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>

            {!form.options.some((option) => option.id === "E") ? (
              <button
                type="button"
                onClick={addOptionalOptionE}
                className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-dashed border-slate-300 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Adicionar alternativa E
              </button>
            ) : null}
          </div>

          <div className="min-w-0">
            <RichTextEditor
              label="Comentário / Explicação"
              helper="Campo salvo em `explanation` com HTML simples para formatação."
              placeholder="Escreva o comentário interno/pedagógico da questão..."
              value={form.explanation}
              onRequestImage={() => void openCommentImageModal()}
              pendingImageUrl={pendingEditorImageUrl}
              onPendingImageHandled={() => setPendingEditorImageUrl(null)}
              onChange={(value) => setForm((prev) => ({ ...prev, explanation: value }))}
            />
          </div>

          <div className="min-w-0 rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Referência</div>
            <div className="mt-1 text-xs text-slate-500">
              Campo bibliográfico para rastrear a origem da questão.
            </div>
            <textarea
              value={form.reference}
              onChange={(event) => setForm((prev) => ({ ...prev, reference: event.target.value }))}
              placeholder="Livro, capítulo, artigo, banca, legislação..."
              className="mt-3 min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        <div className="min-w-0 space-y-6">
          <div className="min-w-0 rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Metadados</div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="mb-1 text-xs font-semibold text-slate-600">Prova</div>
                <select
                  value={form.examId}
                  onChange={(event) => {
                    const nextExam = exams.find((item) => item.id === event.target.value);
                    setForm((prev) => ({
                      ...prev,
                      examId: event.target.value,
                      examType: nextExam?.title || prev.examType,
                    }));
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
                  onChange={(event) =>
                    setForm((prev) => ({
                      ...prev,
                      examYear: event.target.value.replace(/[^\d]/g, "").slice(0, 4),
                    }))
                  }
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
                    setForm((prev) => ({
                      ...prev,
                      levelId: event.target.value,
                      level: nextLevel?.title || prev.level,
                      themeIds: [],
                      themes: [],
                    }));
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
                <div className="mt-1 text-sm font-bold text-slate-900">
                  {buildProofLabel(form.examType, form.examYear)}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Status</div>
                  <div className="text-xs text-slate-500">{form.isActive ? "Ativo" : "Inativo"}</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, isActive: !prev.isActive }))}
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

              <div className="flex items-center justify-between rounded-2xl border bg-slate-50 p-4">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Alternativas embaralhadas</div>
                  <div className="text-xs text-slate-500">
                    Ligado por padrão. Desative apenas para questões com ordem fixa.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, shuffleOptions: !prev.shuffleOptions }))}
                  className={cn(
                    "rounded-full border px-3 py-2 text-xs font-extrabold",
                    form.shuffleOptions
                      ? "border-emerald-100 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 bg-white text-slate-700"
                  )}
                >
                  {form.shuffleOptions ? "● Ligado" : "○ Desligado"}
                </button>
              </div>
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Tema</div>
            <div className="mt-1 text-xs text-slate-500">Selecione apenas temas já cadastrados.</div>

            <div className="mt-3 flex min-w-0 gap-2">
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
                    title="Remover tema"
                  >
                    {theme} ✕
                  </button>
                ))
              ) : (
                <div className="text-xs text-slate-500">Nenhum tema adicionado.</div>
              )}
            </div>
          </div>

          <div className="min-w-0 rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Nota interna</div>
            <div className="mt-1 text-xs text-slate-500">
              Visível apenas internamente, não destinada ao aluno final.
            </div>
            <textarea
              value={form.internalNote}
              onChange={(event) => setForm((prev) => ({ ...prev, internalNote: event.target.value }))}
              placeholder="Observações do time, pendências, avisos..."
              className="mt-3 min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div className="min-w-0 rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Anexos do comentário</div>
            <div className="mt-1 text-xs text-slate-500">
              Use links ou envie arquivos para guardar material de apoio interno.
            </div>

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
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) void handleUploadAttachment(file);
                  }}
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

          {onDelete ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
              <div className="text-sm font-extrabold text-rose-900">Zona de risco</div>
              <div className="mt-1 text-xs text-rose-700">
                Excluir remove a questão do questionsBank.
              </div>
              <button
                onClick={() => void onDelete()}
                className="mt-3 w-full rounded-xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white hover:bg-rose-700"
              >
                Excluir questão
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <Modal
        open={commentImageModalOpen}
        title="Adicionar imagem ao comentário"
        onClose={closeCommentImageModal}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={() => commentImageInputRef.current?.click()}
            >
              Selecionar do computador
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={() => void loadGalleryItems()}>
              Atualizar galeria
            </Button>
          </div>

          <input
            ref={commentImageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleUploadCommentImage(file);
              event.currentTarget.value = "";
            }}
          />

          <div>
            <div className="mb-3 text-base font-bold text-slate-900">Galeria de imagens</div>
            {galleryLoading ? (
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-500">Carregando galeria...</div>
            ) : galleryItems.length ? (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertCommentImage(item.url)}
                    className="overflow-hidden rounded-2xl border text-left transition hover:border-blue-300 hover:shadow-sm"
                  >
                    <img src={item.url} alt={item.label || "Imagem da galeria"} className="h-40 w-full object-cover" />
                    <div className="truncate px-3 py-2 text-sm font-medium text-slate-700">
                      {item.label || item.name || "Imagem"}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="rounded-2xl border bg-slate-50 p-4 text-sm text-slate-500">
                Nenhuma imagem encontrada na galeria.
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
