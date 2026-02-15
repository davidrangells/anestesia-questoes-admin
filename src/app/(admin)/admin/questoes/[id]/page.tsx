"use client";

import AdminShell from "@/components/AdminShell";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  doc,
  getDoc,
  serverTimestamp,
  updateDoc,
  deleteDoc,
  addDoc,
  collection,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

type Option = { id: "A" | "B" | "C" | "D" | "E"; text: string; imageUrl?: string | null };

type QBQuestion = {
  prompt?: string;
  explanation?: string;
  imageUrl?: string | null;
  options?: Option[];
  correctOptionId?: Option["id"];
  examType?: string;
  examYear?: number | null;
  examSource?: string;
  themes?: string[];
  isActive?: boolean;
  createdAt?: any;
  updatedAt?: any;

  // compat
  statement?: string;
  questionText?: string;
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
 */
async function registerMedia(params: {
  url: string;
  path: string;
  origin: "questionsBank" | "midias";
  kind: "prompt" | "option";
  refId: string; // id da questão
  label?: string; // ex: "Alternativa A"
}) {
  await addDoc(collection(db, "midias"), {
    url: params.url,
    path: params.path,
    origin: params.origin,
    kind: params.kind,
    refId: params.refId,
    label: params.label ?? null,
    createdAt: serverTimestamp(),
  });
}

export default function EditarQuestaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);
  const [themeInput, setThemeInput] = useState("");

  const [form, setForm] = useState<{
    prompt: string;
    explanation: string;
    examType: string;
    examYear: string;
    examSource: string;
    themes: string[];
    isActive: boolean;
    imageUrl: string;
    options: Option[];
    correctOptionId: Option["id"];
  } | null>(null);

  const canSave = useMemo(() => {
    if (!form) return false;
    const hasPrompt = form.prompt.trim().length > 0;
    const hasOptions = form.options.every((o) => o.text.trim().length > 0);
    return hasPrompt && hasOptions && !saving;
  }, [form, saving]);

  const load = async () => {
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

      const prompt = (data.prompt ?? data.questionText ?? data.statement ?? "").toString();

      const options: Option[] =
        Array.isArray(data.options) && data.options.length
          ? (data.options as any).map((o: any) => ({
              id: o.id,
              text: o.text ?? "",
              imageUrl: o.imageUrl ?? "",
            }))
          : [
              { id: "A", text: "", imageUrl: "" },
              { id: "B", text: "", imageUrl: "" },
              { id: "C", text: "", imageUrl: "" },
              { id: "D", text: "", imageUrl: "" },
            ];

      setForm({
        prompt,
        explanation: (data.explanation ?? "").toString(),
        examType: (data.examType ?? "TSA").toString(),
        examYear: data.examYear ? String(data.examYear) : "",
        examSource: (data.examSource ?? "").toString(),
        themes: Array.isArray(data.themes) ? (data.themes as any) : [],
        isActive: data.isActive !== false,
        imageUrl: (data.imageUrl ?? "").toString(),
        options,
        correctOptionId: (data.correctOptionId ?? "A") as any,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!id) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const setOption = (oid: Option["id"], patch: Partial<Option>) => {
    setForm((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        options: prev.options.map((o) => (o.id === oid ? { ...o, ...patch } : o)),
      };
    });
  };

  const addThemeFromInput = () => {
    const v = themeInput.trim();
    if (!v || !form) return;
    setForm((p) => (p ? { ...p, themes: p.themes.includes(v) ? p.themes : [...p.themes, v] } : p));
    setThemeInput("");
  };

  const removeTheme = (t: string) => {
    setForm((p) => (p ? { ...p, themes: p.themes.filter((x) => x !== t) } : p));
  };

  const handleUploadPrompt = async (file: File | null) => {
    if (!file || !form) return;
    setUploading("prompt");
    try {
      const folder = `admin_uploads/questionsBank/${id}/prompt`;
      const { url, path } = await uploadImageToStorage(file, folder);

      setForm((p) => (p ? { ...p, imageUrl: url } : p));

      // ✅ registra na galeria já com refId
      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "prompt",
        refId: id,
        label: "Enunciado",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleUploadOption = async (oid: Option["id"], file: File | null) => {
    if (!file || !form) return;
    setUploading(oid);
    try {
      const folder = `admin_uploads/questionsBank/${id}/options/${oid}`;
      const { url, path } = await uploadImageToStorage(file, folder);

      setOption(oid, { imageUrl: url });

      await registerMedia({
        url,
        path,
        origin: "questionsBank",
        kind: "option",
        refId: id,
        label: `Alternativa ${oid}`,
      });
    } finally {
      setUploading(null);
    }
  };

  const save = async () => {
    if (!form || !canSave) return;
    setSaving(true);
    try {
      const examYearNum = form.examYear.trim() ? Number(form.examYear.trim()) : undefined;

      const payload = {
        prompt: form.prompt.trim(),
        explanation: form.explanation.trim(),
        examType: form.examType || "",
        examYear: Number.isFinite(examYearNum) ? examYearNum : null,
        examSource: form.examSource || "",
        themes: form.themes,
        isActive: form.isActive,

        imageUrl: form.imageUrl?.trim() ? form.imageUrl.trim() : null,

        options: form.options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          imageUrl: o.imageUrl?.trim() ? o.imageUrl.trim() : null,
        })),

        correctOptionId: form.correctOptionId,

        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, "questionsBank", id), payload);
      await load();
      alert("Salvo ✅");
    } catch (e: any) {
      alert(e?.message || "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!confirm("Tem certeza que deseja excluir esta questão?")) return;
    try {
      await deleteDoc(doc(db, "questionsBank", id));
      router.replace("/admin/questoes");
    } catch (e: any) {
      alert(e?.message || "Não foi possível excluir.");
    }
  };

  if (loading || !form) {
    return (
      <AdminShell title="Editar questão" subtitle="Carregando...">
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Carregando…</div>
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Coluna esquerda */}
        <div className="lg:col-span-2 space-y-4">
          {/* Enunciado */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-extrabold text-slate-900">Enunciado</div>
                <div className="text-xs text-slate-500">Campo: prompt</div>
              </div>
              <label className="text-xs font-semibold text-slate-700 cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleUploadPrompt(e.target.files?.[0] || null)}
                />
                <span className="rounded-xl border bg-white px-3 py-2 hover:bg-slate-50 inline-flex">
                  {uploading === "prompt" ? "Enviando..." : "Upload imagem"}
                </span>
              </label>
            </div>

            <textarea
              value={form.prompt}
              onChange={(e) => setForm((p) => ({ ...p, prompt: e.target.value }))}
              className="mt-3 w-full min-h-[140px] rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />

            <div className="mt-3">
              <div className="text-xs font-semibold text-slate-600 mb-1">URL da imagem do enunciado (opcional)</div>
              <div className="flex gap-2">
                <input
                  value={form.imageUrl}
                  onChange={(e) => setForm((p) => ({ ...p, imageUrl: e.target.value }))}
                  placeholder="https://firebasestorage.googleapis.com/..."
                  className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, imageUrl: "" }))}
                  className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  Limpar
                </button>
              </div>

              {form.imageUrl?.trim() ? (
                <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                  <div className="text-xs font-extrabold text-slate-700 mb-2">Preview</div>
                  <img
                    src={form.imageUrl}
                    alt="Preview enunciado"
                    className="w-full max-h-[420px] object-contain rounded-xl border bg-white"
                  />
                </div>
              ) : null}
            </div>
          </div>

          {/* Alternativas */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Alternativas</div>
            <div className="text-xs text-slate-500">Campo: options[] + correctOptionId</div>

            <div className="mt-4 space-y-3">
              {form.options.map((opt) => {
                const isCorrect = form.correctOptionId === opt.id;

                return (
                  <div key={opt.id} className="rounded-2xl border p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setForm((p) => ({ ...p, correctOptionId: opt.id }))}
                          className={classNames(
                            "h-9 w-9 rounded-xl border text-sm font-black",
                            isCorrect ? "bg-emerald-600 text-white border-emerald-600" : "bg-white hover:bg-slate-50"
                          )}
                          title="Marcar como correta"
                        >
                          {opt.id}
                        </button>
                        <div className="text-xs text-slate-500">{isCorrect ? "Correta" : "Marcar como correta"}</div>
                      </div>

                      <label className="text-xs font-semibold text-slate-700 cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleUploadOption(opt.id, e.target.files?.[0] || null)}
                        />
                        <span className="rounded-xl border bg-white px-3 py-2 hover:bg-slate-50 inline-flex">
                          {uploading === opt.id ? "Enviando..." : "Upload imagem"}
                        </span>
                      </label>
                    </div>

                    <textarea
                      value={opt.text}
                      onChange={(e) => setOption(opt.id, { text: e.target.value })}
                      className="mt-3 w-full min-h-[70px] rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                    />

                    <div className="mt-3">
                      <div className="text-xs font-semibold text-slate-600 mb-1">
                        URL da imagem da alternativa {opt.id} (opcional)
                      </div>
                      <div className="flex gap-2">
                        <input
                          value={opt.imageUrl ?? ""}
                          onChange={(e) => setOption(opt.id, { imageUrl: e.target.value })}
                          placeholder="https://firebasestorage.googleapis.com/..."
                          className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                        />
                        <button
                          type="button"
                          onClick={() => setOption(opt.id, { imageUrl: "" })}
                          className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                        >
                          Limpar
                        </button>
                      </div>

                      {opt.imageUrl?.trim() ? (
                        <div className="mt-3 rounded-2xl border bg-slate-50 p-3">
                          <div className="text-xs font-extrabold text-slate-700 mb-2">Preview</div>
                          <img
                            src={opt.imageUrl}
                            alt={`Preview alternativa ${opt.id}`}
                            className="w-full max-h-[360px] object-contain rounded-xl border bg-white"
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comentário */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Comentário / Explicação</div>
            <div className="text-xs text-slate-500">Campo: explanation</div>
            <textarea
              value={form.explanation}
              onChange={(e) => setForm((p) => ({ ...p, explanation: e.target.value }))}
              className="mt-3 w-full min-h-[140px] rounded-xl border p-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>
        </div>

        {/* Coluna direita */}
        <div className="space-y-4">
          {/* Meta */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Metadados</div>

            <div className="mt-3 space-y-3">
              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Prova</div>
                <select
                  value={form.examType}
                  onChange={(e) => setForm((p) => ({ ...p, examType: e.target.value }))}
                  className="w-full rounded-xl border px-4 py-3 text-sm bg-white"
                >
                  <option value="TSA">TSA</option>
                  <option value="TEA">TEA</option>
                  <option value="Residência ME">Residência ME</option>
                </select>
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Ano</div>
                <input
                  value={form.examYear}
                  onChange={(e) => setForm((p) => ({ ...p, examYear: e.target.value }))}
                  placeholder="2014"
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div>
                <div className="text-xs font-semibold text-slate-600 mb-1">Fonte (opcional)</div>
                <input
                  value={form.examSource}
                  onChange={(e) => setForm((p) => ({ ...p, examSource: e.target.value }))}
                  placeholder="SBA / banca / prova..."
                  className="w-full rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
                />
              </div>

              <div className="flex items-center justify-between rounded-2xl border p-4 bg-slate-50">
                <div>
                  <div className="text-sm font-extrabold text-slate-900">Ativa</div>
                  <div className="text-xs text-slate-500">Campo: isActive</div>
                </div>
                <button
                  type="button"
                  onClick={() => setForm((p) => ({ ...p, isActive: !p.isActive }))}
                  className={classNames(
                    "rounded-full border px-3 py-2 text-xs font-extrabold",
                    form.isActive
                      ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                      : "bg-amber-50 text-amber-700 border-amber-100"
                  )}
                >
                  {form.isActive ? "● Ativa" : "○ Inativa"}
                </button>
              </div>
            </div>
          </div>

          {/* Temas */}
          <div className="rounded-2xl border bg-white p-5">
            <div className="text-sm font-extrabold text-slate-900">Temas</div>
            <div className="text-xs text-slate-500">Campo: themes[] (Enter para adicionar)</div>

            <div className="mt-3 flex gap-2">
              <input
                value={themeInput}
                onChange={(e) => setThemeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addThemeFromInput();
                  }
                }}
                placeholder="Ex: Vias Aéreas"
                className="flex-1 rounded-xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              />
              <button
                type="button"
                onClick={addThemeFromInput}
                className="rounded-xl border bg-white px-3 py-2 text-sm font-semibold hover:bg-slate-50"
              >
                Add
              </button>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {form.themes.length ? (
                form.themes.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTheme(t)}
                    className="rounded-full border bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                    title="Remover tema"
                  >
                    {t} ✕
                  </button>
                ))
              ) : (
                <div className="text-xs text-slate-500">Sem temas ainda.</div>
              )}
            </div>
          </div>

          {/* Perigo */}
          <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5">
            <div className="text-sm font-extrabold text-rose-900">Zona de risco</div>
            <div className="text-xs text-rose-700 mt-1">Excluir remove a questão do questionsBank.</div>
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