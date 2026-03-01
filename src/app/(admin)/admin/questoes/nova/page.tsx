"use client";

import AdminShell from "@/components/AdminShell";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

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

type MediaGalleryItem = {
  id: string;
  url: string;
  label?: string | null;
  name?: string | null;
};

type QuestionFormState = {
  prompt: string;
  explanation: string;
  examId: string;
  examType: string;
  levelId: string;
  level: "R1" | "R2" | "R3";
  examYear: string;
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

function buildProofLabel(examType: string, examYear: string) {
  const normalizedYear = examYear.trim();
  return normalizedYear ? `(${examType}-${normalizedYear})` : `(${examType})`;
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
    syncValue();
    onPendingImageHandled();
  }, [pendingImageUrl, onPendingImageHandled]);

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
    <div className="overflow-hidden rounded-2xl border bg-white">
      <div className="border-b px-5 py-4">
        <div className="text-sm font-extrabold text-slate-900">{label}</div>
        {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}
      </div>

      <div className="border-b bg-slate-50/70 px-3">
        <div className="flex flex-wrap gap-x-1 text-sm font-medium text-slate-700">
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

      <div className="border-b bg-white px-3 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("undo")}>
            ↶
          </Button>
          <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("redo")}>
            ↷
          </Button>

          <select
            defaultValue="P"
            onChange={(e) => runCommand("formatBlock", e.target.value)}
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

          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => runCommand("insertUnorderedList")}
          >
            • Lista
          </Button>
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => runCommand("insertOrderedList")}
          >
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

function safeExt(name: string) {
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  if (!/^[a-z0-9]+$/.test(ext)) return "jpg";
  if (ext.length > 6) return "jpg";
  return ext;
}

async function uploadImage(file: File, folder: string) {
  const storage = getStorage();
  const ext = safeExt(file.name);
  const path = `${folder}/${Date.now()}-${Math.random()
    .toString(16)
    .slice(2)}.${ext}`;

  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  return { url, path };
}

async function registerMedia(params: {
  url: string;
  path: string;
  origin: string;
  kind: "prompt" | "option" | "attachment";
  label?: string;
}) {
  await addDoc(collection(db, "midias"), {
    url: params.url,
    path: params.path,
    origin: params.origin,
    kind: params.kind,
    label: params.label || null,
    createdAt: serverTimestamp(),
  });
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

export default function NovaQuestaoPage() {
  const router = useRouter();
  const commentImageInputRef = useRef<HTMLInputElement | null>(null);

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("");
  const [exams, setExams] = useState<CatalogOption[]>([]);
  const [levels, setLevels] = useState<CatalogOption[]>([]);
  const [themeOptions, setThemeOptions] = useState<CatalogOption[]>([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const [galleryItems, setGalleryItems] = useState<MediaGalleryItem[]>([]);
  const [commentImageModalOpen, setCommentImageModalOpen] = useState(false);
  const [pendingEditorImageUrl, setPendingEditorImageUrl] = useState<string | null>(null);

  const [form, setForm] = useState<QuestionFormState>({
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
    options: [
      { id: "A", text: "", imageUrl: "" },
      { id: "B", text: "", imageUrl: "" },
      { id: "C", text: "", imageUrl: "" },
      { id: "D", text: "", imageUrl: "" },
    ],
    correctOptionId: "A",
  });

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
            status: (item.data().status as CatalogOption["status"]) ?? "ativo",
          }))
          .filter((item) => item.status === "ativo");

        const nextLevels = levelSnap.docs
          .map((item) => ({
            id: item.id,
            title: String(item.data().title ?? ""),
            code: String(item.data().code ?? ""),
            status: (item.data().status as CatalogOption["status"]) ?? "ativo",
          }))
          .filter((item) => item.status === "ativo");

        const nextThemes = themeSnap.docs
          .map((item) => ({
            id: item.id,
            title: String(item.data().title ?? ""),
            code: String(item.data().code ?? ""),
            status: (item.data().status as CatalogOption["status"]) ?? "ativo",
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
          const allowedThemes = nextThemes.filter(
            (item) => !level?.id || item.levelId === level.id
          );
          const nextThemeIds = prev.themeIds.filter((id) =>
            allowedThemes.some((item) => item.id === id)
          );

          return {
            ...prev,
            examId: exam?.id ?? "",
            examType: exam?.title || prev.examType,
            levelId: level?.id ?? "",
            level: (level?.title as QuestionFormState["level"]) || prev.level,
            themeIds: nextThemeIds,
            themes: nextThemeIds
              .map((id) => allowedThemes.find((item) => item.id === id)?.title || "")
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
    const hasOptions = form.options.every((o) => o.text.trim().length > 0);
    const hasTheme = form.themes.length > 0;
    const hasExam = form.examId.trim().length > 0;
    const hasLevel = form.levelId.trim().length > 0;
    return hasPrompt && hasOptions && hasTheme && hasExam && hasLevel && !saving;
  }, [form, saving]);

  const setOption = (id: Option["id"], patch: Partial<Option>) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) =>
        o.id === id ? { ...o, ...patch } : o
      ),
    }));
  };

  const removeTheme = (t: string) => {
    setForm((p) => ({
      ...p,
      themes: p.themes.filter((x) => x !== t),
      themeIds: p.themeIds.filter((id) => {
        const selected = themeOptions.find((item) => item.id === id);
        return selected?.title !== t;
      }),
    }));
  };

  const availableThemes = useMemo(() => {
    if (!themeOptions.length) return [];
    if (!form.levelId) return themeOptions;

    const exactMatches = themeOptions.filter((item) => item.levelId === form.levelId);
    if (exactMatches.length) return exactMatches;

    const labelMatches = themeOptions.filter(
      (item) => item.levelLabel === form.level || !item.levelId
    );
    return labelMatches;
  }, [form.level, form.levelId, themeOptions]);

  const addThemeFromCatalog = (theme: CatalogOption) => {
    setForm((prev) => {
      if (prev.themeIds.includes(theme.id)) return prev;
      return {
        ...prev,
        themeIds: [...prev.themeIds, theme.id],
        themes: [...prev.themes, theme.title],
      };
    });
  };

  const loadGalleryItems = async () => {
    setGalleryLoading(true);
    try {
      const snap = await getDocs(
        query(collection(db, "midias"), orderBy("createdAt", "desc"), limit(24))
      );
      const rows = snap.docs.map((item) => ({
        id: item.id,
        url: String(item.data().url ?? ""),
        label: (item.data().label as string | null) ?? null,
        name: (item.data().name as string | null) ?? null,
      }));
      setGalleryItems(rows.filter((item) => item.url));
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
    const nextLabel = label.trim();
    const nextUrl = url.trim();
    if (!nextUrl) return;

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

  const removeAttachment = (id: string) => {
    setForm((prev) => ({
      ...prev,
      commentAttachments: prev.commentAttachments.filter((item) => item.id !== id),
    }));
  };

  const handleUploadPrompt = async (file: File) => {
    setUploading("prompt");
    try {
      const { url, path } = await uploadImage(
        file,
        "admin_uploads/questionsBank/prompt"
      );
      setForm((p) => ({ ...p, imageUrl: url }));

      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "prompt",
        label: "Enunciado",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadOption = async (
    optId: Option["id"],
    file: File
  ) => {
    setUploading(optId);
    try {
      const { url, path } = await uploadImage(
        file,
        `admin_uploads/questionsBank/options/${optId}`
      );

      setOption(optId, { imageUrl: url });

      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "option",
        label: `Alternativa ${optId}`,
      });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadAttachment = async (file: File) => {
    setUploading("attachment");
    try {
      const { url, path } = await uploadImage(
        file,
        "admin_uploads/questionsBank/attachments"
      );

      addAttachment(file.name, url);

      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "attachment",
        label: file.name,
      });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadCommentImage = async (file: File) => {
    setUploading("comment-image");
    try {
      const { url, path } = await uploadImage(
        file,
        "admin_uploads/questionsBank/comment-images"
      );

      await registerMedia({
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

  const onSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      const normalizedPrompt = form.prompt.trim();
      const normalizedExplanation = form.explanation.trim();
      const normalizedReference = form.reference.trim();
      const normalizedInternalNote = form.internalNote.trim();
      const normalizedYear = form.examYear.trim();
      const proofYear = normalizedYear ? Number(normalizedYear) : null;
      const proofLabel = buildProofLabel(form.examType, normalizedYear);
      const normalizedOptions = form.options.map((o) => ({
        id: o.id,
        text: o.text.trim(),
        imageUrl: o.imageUrl || null,
      }));
      const optionMap = Object.fromEntries(
        normalizedOptions.map((option) => [option.id, option])
      ) as Record<Option["id"], { id: string; text: string; imageUrl: string | null }>;

      await addDoc(collection(db, "questionsBank"), {
        prompt: normalizedPrompt,
        prompt_text: normalizedPrompt,
        explanation: normalizedExplanation,
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
        imageUrl: form.imageUrl || null,
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
        reference: normalizedReference,
        internalNote: normalizedInternalNote,
        commentAttachments: form.commentAttachments,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/questoes");
    } catch (e: unknown) {
      const error = e as { message?: string };
      alert(error?.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Nova questão"
      subtitle="Criar nova questão no questionsBank"
      actions={
        <div className="flex gap-2">
          <Button onClick={() => router.push("/admin/questoes")} variant="secondary" size="sm">
            Voltar
          </Button>
          <Button onClick={onSave} disabled={!canSave} variant="primary" size="sm">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.7fr)_minmax(320px,0.9fr)]">
          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-bold text-slate-900">Enunciado</div>
              <div className="mt-1 text-xs text-slate-500">
                Campo principal da questão. Compatível com `prompt` e `prompt_text`.
              </div>

              <textarea
                value={form.prompt}
                onChange={(e) =>
                  setForm((p) => ({ ...p, prompt: e.target.value }))
                }
                placeholder="Digite o enunciado completo da questão..."
                className="mt-3 w-full min-h-[180px] rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />

              <div className="mt-4">
                <div className="text-xs font-semibold text-slate-600 mb-1">Imagem do enunciado (opcional)</div>
                <input
                  value={form.imageUrl}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      imageUrl: e.target.value,
                    }))
                  }
                  placeholder="URL da imagem"
                  className="w-full rounded-xl border px-4 py-3 text-sm"
                />

                <label className="mt-3 inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                  {uploading === "prompt" ? "Enviando..." : "Enviar imagem"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleUploadPrompt(f);
                    }}
                  />
                </label>

                {form.imageUrl && (
                  <div className="mt-4 rounded-xl border bg-slate-50 p-3">
                    <img
                      src={form.imageUrl}
                      alt="Preview"
                      className="w-full max-h-[300px] object-contain"
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-6">
              <div className="text-sm font-bold text-slate-900">Alternativas</div>
              <div className="mt-1 text-xs text-slate-500">
                Cadastre as respostas e marque a correta. O formulário salva em estrutura aninhada e nas colunas A-D da importação.
              </div>

              <div className="mt-4 space-y-4">
                {form.options.slice(0, 4).map((opt) => {
                  const isCorrect = form.correctOptionId === opt.id;

                  return (
                    <div key={opt.id} className="rounded-xl border p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="font-semibold">Alternativa {opt.id}</div>

                        <button
                          type="button"
                          onClick={() =>
                            setForm((p) => ({
                              ...p,
                              correctOptionId: opt.id,
                            }))
                          }
                          className={cn(
                            "rounded-full px-3 py-1 text-xs font-bold",
                            isCorrect ? "bg-emerald-600 text-white" : "bg-slate-100"
                          )}
                        >
                          {isCorrect ? "Correta" : "Marcar correta"}
                        </button>
                      </div>

                      <textarea
                        value={opt.text}
                        onChange={(e) =>
                          setOption(opt.id, {
                            text: e.target.value,
                          })
                        }
                        placeholder={`Texto da alternativa ${opt.id}`}
                        className="mt-3 w-full min-h-[90px] rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                      />

                      <div className="mt-3 flex flex-col gap-3">
                        <input
                          value={opt.imageUrl || ""}
                          onChange={(e) =>
                            setOption(opt.id, {
                              imageUrl: e.target.value,
                            })
                          }
                          placeholder="URL da imagem da alternativa"
                          className="rounded-xl border px-4 py-3 text-sm"
                        />

                        <label className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                          {uploading === opt.id ? "Enviando..." : "Enviar imagem"}
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadOption(opt.id, f);
                            }}
                          />
                        </label>

                        {opt.imageUrl && (
                          <div className="rounded-xl border bg-slate-50 p-3">
                            <img
                              src={opt.imageUrl}
                              alt={`Preview ${opt.id}`}
                              className="w-full max-h-[250px] object-contain"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <RichTextEditor
              label="Comentário / Explicação"
              helper="Campo salvo em `explanation` com HTML simples para formatação."
              placeholder="Escreva o comentário interno/pedagógico da questão..."
              value={form.explanation}
              onRequestImage={() => void openCommentImageModal()}
              pendingImageUrl={pendingEditorImageUrl}
              onPendingImageHandled={() => setPendingEditorImageUrl(null)}
              onChange={(value) =>
                setForm((prev) => ({
                  ...prev,
                  explanation: value,
                }))
              }
            />
          </div>

          <div className="space-y-6">
            <div className="rounded-2xl border bg-white p-5">
              <div className="text-sm font-extrabold text-slate-900">Metadados</div>

              <div className="mt-3 space-y-3">
                <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Prova</div>
              <select
                    value={form.examId}
                    onChange={(e) => {
                      const nextExam = exams.find((item) => item.id === e.target.value);
                      setForm((prev) => ({
                        ...prev,
                        examId: e.target.value,
                        examType: nextExam?.title || prev.examType,
                      }));
                    }}
                    className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                  >
                    {catalogLoading && exams.length === 0 ? (
                      <option value="">Carregando...</option>
                    ) : null}
                    {exams.map((option) => (
                      <option key={option.id} value={option.id}>
                        {option.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">Ano da prova</div>
                  <input
                    value={form.examYear}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        examYear: e.target.value.replace(/[^\d]/g, "").slice(0, 4),
                      }))
                    }
                    placeholder="2026"
                    className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                  />
                </div>

              <div>
                  <div className="text-xs font-semibold text-slate-600 mb-1">Nível</div>
                  <select
                    value={form.levelId}
                    onChange={(e) => {
                      const nextLevel = levels.find((item) => item.id === e.target.value);
                      setSelectedThemeId("");
                      setForm((prev) => ({
                        ...prev,
                        levelId: e.target.value,
                        level: (nextLevel?.title as QuestionFormState["level"]) || prev.level,
                        themeIds: [],
                        themes: [],
                      }));
                    }}
                    className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                  >
                    {catalogLoading && levels.length === 0 ? (
                      <option value="">Carregando...</option>
                    ) : null}
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

                <div className="flex items-center justify-between rounded-2xl border p-4 bg-slate-50">
                  <div>
                    <div className="text-sm font-extrabold text-slate-900">Status</div>
                    <div className="text-xs text-slate-500">
                      {form.isActive ? "Ativo" : "Inativo"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({
                        ...prev,
                        isActive: !prev.isActive,
                      }))
                    }
                    className={cn(
                      "rounded-full border px-3 py-2 text-xs font-extrabold",
                      form.isActive
                        ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                        : "bg-amber-50 text-amber-700 border-amber-100"
                    )}
                  >
                    {form.isActive ? "● Ativo" : "○ Inativo"}
                  </button>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-sm font-extrabold text-slate-900">Tema</div>
              <div className="mt-1 text-xs text-slate-500">
                Selecione apenas temas já cadastrados.
              </div>

              <div className="mt-3 flex gap-2">
                <select
                  value={selectedThemeId}
                  onChange={(e) => setSelectedThemeId(e.target.value)}
                  className="flex-1 rounded-xl border bg-white px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
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
                          onClick={() =>
                            selected ? removeTheme(theme.title) : addThemeFromCatalog(theme)
                          }
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
                    <div className="text-xs text-slate-500">
                      Nenhum tema ativo para este nível.
                    </div>
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

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-sm font-extrabold text-slate-900">Referência</div>
              <div className="mt-1 text-xs text-slate-500">
                Campo bibliográfico para rastrear a origem da questão.
              </div>
              <textarea
                value={form.reference}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    reference: e.target.value,
                  }))
                }
                placeholder="Livro, capítulo, artigo, banca, legislação..."
                className="mt-3 min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="rounded-2xl border bg-white p-5">
              <div className="text-sm font-extrabold text-slate-900">Nota interna</div>
              <div className="mt-1 text-xs text-slate-500">
                Visível apenas internamente, não destinada ao aluno final.
              </div>
              <textarea
                value={form.internalNote}
                onChange={(e) =>
                  setForm((prev) => ({
                    ...prev,
                    internalNote: e.target.value,
                  }))
                }
                placeholder="Observações do time, pendências, avisos..."
                className="mt-3 min-h-[110px] w-full rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div className="rounded-2xl border bg-white p-5">
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
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleUploadAttachment(file);
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
          </div>
        </div>
      </div>

      <Modal
        open={commentImageModalOpen}
        title="Adicionar imagem ao comentário"
        onClose={closeCommentImageModal}
      >
        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <Button
              type="button"
              variant="primary"
              onClick={() => commentImageInputRef.current?.click()}
              disabled={uploading === "comment-image"}
            >
              {uploading === "comment-image" ? "Enviando..." : "Selecionar do computador"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void loadGalleryItems()}>
              Atualizar galeria
            </Button>
            <input
              ref={commentImageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  void handleUploadCommentImage(file);
                }
                e.currentTarget.value = "";
              }}
            />
          </div>

          <div>
            <div className="mb-2 text-sm font-bold text-slate-900">Galeria de imagens</div>
            {galleryLoading ? (
              <div className="rounded-2xl border bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Carregando imagens...
              </div>
            ) : galleryItems.length === 0 ? (
              <div className="rounded-2xl border bg-slate-50 px-4 py-6 text-sm text-slate-500">
                Nenhuma imagem encontrada na coleção `midias`.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {galleryItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => insertCommentImage(item.url)}
                    className="overflow-hidden rounded-2xl border text-left transition hover:border-blue-200 hover:shadow-sm"
                  >
                    <div className="aspect-[4/3] bg-slate-50">
                      <img
                        src={item.url}
                        alt={item.label || item.name || "Imagem da galeria"}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="px-3 py-2 text-xs text-slate-600">
                      {item.label || item.name || "Sem título"}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </AdminShell>
  );
}
