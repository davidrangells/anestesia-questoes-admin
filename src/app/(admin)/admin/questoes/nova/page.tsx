"use client";

import AdminShell from "@/components/AdminShell";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  addDoc,
  collection,
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

type QuestionFormState = {
  prompt: string;
  explanation: string;
  examType: string;
  level: "R1" | "R2" | "R3";
  examYear: string;
  themes: string[];
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
};

const EXAM_OPTIONS = ["TSA", "TEA", "ME"] as const;
const LEVEL_OPTIONS = ["R1", "R2", "R3"] as const;

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
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML === value) return;
    editorRef.current.innerHTML = value;
  }, [value]);

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

  const insertImage = () => {
    const url = window.prompt("Cole a URL da imagem");
    if (!url?.trim()) return;

    runCommand(
      "insertHTML",
      `<img src="${escapeHtml(url.trim())}" alt="Imagem adicionada no comentário" />`
    );
  };

  return (
    <div className="rounded-2xl border bg-white p-5">
      <div className="text-sm font-extrabold text-slate-900">{label}</div>
      {helper ? <div className="mt-1 text-xs text-slate-500">{helper}</div> : null}

      <div className="mt-3 flex flex-wrap gap-2">
        <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("bold")}>
          Negrito
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("italic")}>
          Itálico
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => runCommand("insertUnorderedList")}
        >
          Lista
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyLeft")}>
          Esquerda
        </Button>
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => runCommand("justifyCenter")}
        >
          Centro
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyRight")}>
          Direita
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={() => runCommand("justifyFull")}>
          Justificar
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={insertLink}>
          Link
        </Button>
        <Button type="button" variant="secondary" size="sm" onClick={insertImage}>
          Imagem
        </Button>
      </div>

      <div className="relative mt-3">
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
          className="min-h-[180px] rounded-xl border p-4 text-sm outline-none focus-within:ring-2 focus-within:ring-blue-200 [&_img]:max-h-[220px] [&_img]:rounded-xl [&_img]:border [&_img]:bg-slate-50 [&_img]:object-contain [&_img]:p-1 [&_a]:text-blue-700 [&_a]:underline"
        />
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

export default function NovaQuestaoPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [themeInput, setThemeInput] = useState("");

  const [form, setForm] = useState<QuestionFormState>({
    prompt: "",
    explanation: "",
    examType: "TSA",
    level: "R1",
    examYear: "",
    themes: [],
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

  const canSave = useMemo(() => {
    const hasPrompt = form.prompt.trim().length > 0;
    const hasOptions = form.options.every((o) => o.text.trim().length > 0);
    const hasTheme = form.themes.length > 0;
    return hasPrompt && hasOptions && hasTheme && !saving;
  }, [form, saving]);

  const setOption = (id: Option["id"], patch: Partial<Option>) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) =>
        o.id === id ? { ...o, ...patch } : o
      ),
    }));
  };

  const addTheme = () => {
    const v = themeInput.trim();
    if (!v) return;
    setForm((p) => ({
      ...p,
      themes: p.themes.includes(v) ? p.themes : [...p.themes, v],
    }));
    setThemeInput("");
  };

  const removeTheme = (t: string) => {
    setForm((p) => ({
      ...p,
      themes: p.themes.filter((x) => x !== t),
    }));
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
        examType: form.examType,
        prova_tipo: form.examType,
        examYear: proofYear,
        prova_ano: proofYear,
        examSource: proofLabel,
        Prova: proofLabel,
        level: form.level,
        nivel: form.level,
        themes: form.themes,
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
                    value={form.examType}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        examType: e.target.value,
                      }))
                    }
                    className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                  >
                    {EXAM_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
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
                    value={form.level}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        level: e.target.value as QuestionFormState["level"],
                      }))
                    }
                    className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                  >
                    {LEVEL_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
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
                Pelo menos um tema é obrigatório para salvar.
              </div>

              <div className="mt-3 flex gap-2">
                <input
                  value={themeInput}
                  onChange={(e) => setThemeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTheme();
                    }
                  }}
                  placeholder="Ex: Anestesia em Pediatria"
                  className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
                <Button type="button" variant="secondary" size="sm" onClick={addTheme}>
                  Add
                </Button>
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
    </AdminShell>
  );
}
