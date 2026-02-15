"use client";

import AdminShell from "@/components/AdminShell";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import {
  addDoc,
  collection,
  serverTimestamp,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  getDownloadURL,
  getStorage,
  ref,
  uploadBytes,
} from "firebase/storage";

type Option = { id: "A" | "B" | "C" | "D" | "E"; text: string; imageUrl?: string | null };

type QuestionFormState = {
  prompt: string;
  explanation: string;
  examType: string;
  examYear: string;
  examSource: string;
  themes: string[];
  isActive: boolean;
  imageUrl: string; // imagem do enunciado (downloadURL)
  options: Option[];
  correctOptionId: Option["id"];
};

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function safeExtFromName(name: string) {
  const ext = (name.split(".").pop() || "jpg").toLowerCase();
  if (!/^[a-z0-9]+$/.test(ext)) return "jpg";
  if (ext.length > 6) return "jpg";
  return ext;
}

/**
 * Upload padronizado + retorno do {url, path}
 */
async function uploadImageToStorage(file: File, folder: string) {
  const storage = getStorage();
  const ext = safeExtFromName(file.name);
  const path = `${folder}/${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  return { url, path };
}

/**
 * Registra na galeria (Firestore) para aparecer em /midias
 * Obs: no fluxo de "nova", a questão ainda não existe. Então salvamos uploadGroupId
 * e depois fazemos o "link" para refId (questionId) automaticamente.
 */
async function registerMedia(params: {
  url: string;
  path: string;
  origin: "questionsBank" | "midias";
  kind: "prompt" | "option";
  uploadGroupId: string; // draftId
  refId?: string | null; // id da questão (quando existir)
  label?: string; // ex: "Alternativa A"
}) {
  await addDoc(collection(db, "midias"), {
    url: params.url,
    path: params.path,
    origin: params.origin,
    kind: params.kind,
    uploadGroupId: params.uploadGroupId,
    refId: params.refId ?? null,
    label: params.label ?? null,
    createdAt: serverTimestamp(),
  });
}

export default function NovaQuestaoPage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null); // "prompt" | "A" | "B"...
  const [themeInput, setThemeInput] = useState("");

  // “grupo” para uploads dessa página (até salvar a questão)
  const [draftId] = useState(() => {
    try {
      // @ts-ignore
      return crypto?.randomUUID?.() || `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    } catch {
      return `draft_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    }
  });

  const [form, setForm] = useState<QuestionFormState>({
    prompt: "",
    explanation: "",
    examType: "TSA",
    examYear: "",
    examSource: "",
    themes: [],
    isActive: true,
    imageUrl: "",
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
    const hasCorrect = !!form.correctOptionId;
    return hasPrompt && hasOptions && hasCorrect && !saving;
  }, [form, saving]);

  const setOption = (id: Option["id"], patch: Partial<Option>) => {
    setForm((prev) => ({
      ...prev,
      options: prev.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    }));
  };

  const addThemeFromInput = () => {
    const v = themeInput.trim();
    if (!v) return;
    setForm((prev) => ({
      ...prev,
      themes: Array.from(new Set([...(prev.themes || []), v])),
    }));
    setThemeInput("");
  };

  const removeTheme = (t: string) => {
    setForm((prev) => ({ ...prev, themes: prev.themes.filter((x) => x !== t) }));
  };

  const handleUploadPrompt = async (file: File) => {
    setUploading("prompt");
    try {
      const folder = `admin_uploads/questionsBank/${draftId}/prompt`;
      const { url, path } = await uploadImageToStorage(file, folder);
      setForm((prev) => ({ ...prev, imageUrl: url }));

      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "prompt",
        uploadGroupId: draftId,
        refId: null,
        label: "Enunciado",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadOption = async (optId: Option["id"], file: File) => {
    setUploading(optId);
    try {
      const folder = `admin_uploads/questionsBank/${draftId}/options/${optId}`;
      const { url, path } = await uploadImageToStorage(file, folder);
      setOption(optId, { imageUrl: url });

      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "option",
        uploadGroupId: draftId,
        refId: null,
        label: `Alternativa ${optId}`,
      });
    } finally {
      setUploading(null);
    }
  };

  /**
   * Depois de criar a questão, “linka” todas as midias do draftId
   * para refId = questionId (pra galeria saber que pertence a essa questão).
   */
  const linkDraftMediaToQuestion = async (questionId: string) => {
    const qRef = query(collection(db, "midias"), where("uploadGroupId", "==", draftId));
    const snap = await getDocs(qRef);
    if (snap.empty) return;

    const batch = writeBatch(db);
    snap.docs.forEach((d) => {
      batch.update(d.ref, { refId: questionId });
    });
    await batch.commit();
  };

  const onSave = async () => {
    if (!canSave) return;
    setSaving(true);
    try {
      const payload = {
        prompt: form.prompt.trim(),
        explanation: form.explanation.trim(),
        examType: form.examType || "",
        examYear: form.examYear ? Number(form.examYear) : null,
        examSource: form.examSource || "",
        themes: form.themes || [],
        isActive: form.isActive === true,
        imageUrl: form.imageUrl?.trim() ? form.imageUrl.trim() : null,
        options: form.options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          imageUrl: o.imageUrl?.trim() ? o.imageUrl.trim() : null,
        })),
        correctOptionId: form.correctOptionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        meta: {
          uploadGroupId: draftId,
          createdFrom: "admin",
        },
      };

      const docRef = await addDoc(collection(db, "questionsBank"), payload);

      // ✅ linka as mídias desse draft à questão recém-criada
      await linkDraftMediaToQuestion(docRef.id);

      router.push("/admin/questoes");
    } catch (e: any) {
      alert(e?.message || "Não foi possível salvar a questão.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminShell
      title="Nova questão"
      subtitle="Crie uma questão no questionsBank com imagem opcional no enunciado e nas alternativas."
      actions={
        <div className="flex items-center gap-2">
          <button
            onClick={() => router.push("/admin/questoes")}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </button>
          <button
            onClick={onSave}
            disabled={!canSave}
            className={classNames(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              canSave ? "bg-slate-900 hover:bg-slate-800" : "bg-slate-300 cursor-not-allowed"
            )}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      }
    >
      <div className="space-y-5">
        {/* ENUNCIADO */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-extrabold text-slate-900">Enunciado</div>
          <div className="text-xs text-slate-500 mt-1">Texto principal da pergunta (obrigatório).</div>

          <textarea
            value={form.prompt}
            onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
            className="mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 min-h-[140px]"
            placeholder="Digite o enunciado..."
          />

          <div className="mt-4">
            <div className="text-sm font-extrabold text-slate-900">Imagem do enunciado (opcional)</div>
            <div className="text-xs text-slate-500 mt-1">
              Envie uma imagem (Storage) e o link fica salvo na questão.
            </div>

            <div className="mt-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
              <input
                value={form.imageUrl}
                onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                placeholder="https://..."
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />

              <label className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 cursor-pointer">
                {uploading === "prompt" ? "Enviando..." : "Enviar imagem"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) void handleUploadPrompt(f);
                    e.currentTarget.value = "";
                  }}
                />
              </label>

              {form.imageUrl ? (
                <button
                  onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                  className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                >
                  Remover
                </button>
              ) : null}
            </div>

            {form.imageUrl ? (
              <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                <img
                  src={form.imageUrl}
                  alt="Preview enunciado"
                  className="w-full max-h-[320px] object-contain rounded-xl border bg-white"
                />
              </div>
            ) : null}
          </div>
        </div>

        {/* ALTERNATIVAS */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="text-sm font-extrabold text-slate-900">Alternativas</div>
          <div className="text-xs text-slate-500 mt-1">
            Texto obrigatório. Imagem opcional em cada alternativa.
          </div>

          <div className="mt-4 space-y-4">
            {form.options.map((opt) => {
              const isCorrect = form.correctOptionId === opt.id;

              return (
                <div key={opt.id} className="rounded-2xl border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-extrabold text-slate-900">Alternativa {opt.id}</div>
                    <label className="inline-flex items-center gap-2 text-sm font-semibold">
                      <span className="text-slate-700">Correta</span>
                      <input
                        type="radio"
                        checked={isCorrect}
                        onChange={() => setForm((p) => ({ ...p, correctOptionId: opt.id }))}
                      />
                    </label>
                  </div>

                  <textarea
                    value={opt.text}
                    onChange={(e) => setOption(opt.id, { text: e.target.value })}
                    className="mt-3 w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 min-h-[90px]"
                    placeholder={`Texto da alternativa ${opt.id}...`}
                  />

                  <div className="mt-3 flex flex-col lg:flex-row gap-3 items-start lg:items-center">
                    <input
                      value={opt.imageUrl || ""}
                      onChange={(e) => setOption(opt.id, { imageUrl: e.target.value }))}
                      placeholder="URL da imagem (opcional)"
                      className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    <label className="inline-flex items-center justify-center rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50 cursor-pointer">
                      {uploading === opt.id ? "Enviando..." : "Enviar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (f) void handleUploadOption(opt.id, f);
                          e.currentTarget.value = "";
                        }}
                      />
                    </label>

                    {opt.imageUrl ? (
                      <button
                        onClick={() => setOption(opt.id, { imageUrl: "" })}
                        className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>

                  {opt.imageUrl ? (
                    <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                      <img
                        src={opt.imageUrl}
                        alt={`Preview alternativa ${opt.id}`}
                        className="w-full max-h-[260px] object-contain rounded-xl border bg-white"
                      />
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        {/* META */}
        <div className="rounded-2xl border bg-white p-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Tipo de prova</div>
              <select
                value={form.examType}
                onChange={(e) => setForm((p) => ({ ...p, examType: e.target.value }))}
                className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
              >
                <option value="TSA">TSA</option>
                <option value="TEA">TEA</option>
                <option value="ME">ME</option>
              </select>
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Ano</div>
              <input
                value={form.examYear}
                onChange={(e) => setForm((p) => ({ ...p, examYear: e.target.value }))}
                placeholder="Ex: 2024"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>

            <div>
              <div className="text-xs font-semibold text-slate-600 mb-1">Fonte</div>
              <input
                value={form.examSource}
                onChange={(e) => setForm((p) => ({ ...p, examSource: e.target.value }))}
                placeholder='Ex: "(TSA-2014)"'
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-600 mb-1">Temas</div>
            <div className="flex flex-col lg:flex-row gap-2">
              <input
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                placeholder="Digite um tema e aperte Enter"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addThemeFromInput();
                  }
                }}
              />
              <button
                onClick={addThemeFromInput}
                className="rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50"
              >
                Adicionar
              </button>
            </div>

            {form.themes.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {form.themes.map((t) => (
                  <button
                    key={t}
                    onClick={() => removeTheme(t)}
                    className="inline-flex items-center gap-2 rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    title="Remover tema"
                  >
                    {t} <span className="text-slate-400">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="mt-2 text-xs text-slate-500">Nenhum tema adicionado.</div>
            )}
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-600 mb-1">Ativa?</div>
            <label className="inline-flex items-center gap-2 text-sm font-semibold">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <span className="text-slate-700">Marcar como ativa</span>
            </label>
          </div>

          <div className="mt-4">
            <div className="text-xs font-semibold text-slate-600 mb-1">Explicação / comentário</div>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200 min-h-[120px]"
              placeholder="Comentário/justificativa..."
            />
          </div>
        </div>
      </div>
    </AdminShell>
  );
}