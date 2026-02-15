"use client";

import AdminShell from "@/components/AdminShell";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
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

type Option = {
  id: "A" | "B" | "C" | "D" | "E";
  text: string;
  imageUrl?: string | null;
};

type QuestionFormState = {
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
};

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
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
  kind: "prompt" | "option";
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
    return hasPrompt && hasOptions && !saving;
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

  const onSave = async () => {
    if (!canSave) return;

    setSaving(true);
    try {
      await addDoc(collection(db, "questionsBank"), {
        prompt: form.prompt.trim(),
        explanation: form.explanation.trim(),
        examType: form.examType,
        examYear: form.examYear
          ? Number(form.examYear)
          : null,
        examSource: form.examSource,
        themes: form.themes,
        isActive: form.isActive,
        imageUrl: form.imageUrl || null,
        options: form.options.map((o) => ({
          id: o.id,
          text: o.text.trim(),
          imageUrl: o.imageUrl || null,
        })),
        correctOptionId: form.correctOptionId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      router.push("/admin/questoes");
    } catch (e: any) {
      alert(e?.message || "Erro ao salvar.");
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
          <button
            onClick={() => router.push("/admin/questoes")}
            className="rounded-xl border bg-white px-4 py-2 text-sm font-semibold hover:bg-slate-50"
          >
            Voltar
          </button>
          <button
            onClick={onSave}
            disabled={!canSave}
            className={classNames(
              "rounded-xl px-4 py-2 text-sm font-semibold text-white",
              canSave
                ? "bg-slate-900 hover:bg-slate-800"
                : "bg-slate-300 cursor-not-allowed"
            )}
          >
            {saving ? "Salvando..." : "Salvar"}
          </button>
        </div>
      }
    >
      <div className="space-y-6">

        {/* ENUNCIADO */}
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-bold text-slate-900">
            Enunciado
          </div>

          <textarea
            value={form.prompt}
            onChange={(e) =>
              setForm((p) => ({ ...p, prompt: e.target.value }))
            }
            className="mt-3 w-full min-h-[140px] rounded-xl border p-3 text-sm focus:ring-2 focus:ring-blue-200"
          />

          <div className="mt-4">
            <input
              value={form.imageUrl}
              onChange={(e) =>
                setForm((p) => ({
                  ...p,
                  imageUrl: e.target.value,
                }))
              }
              placeholder="URL da imagem (opcional)"
              className="w-full rounded-xl border px-4 py-3 text-sm"
            />

            <label className="mt-3 inline-flex cursor-pointer rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50">
              {uploading === "prompt"
                ? "Enviando..."
                : "Enviar imagem"}
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

        {/* ALTERNATIVAS */}
        <div className="rounded-2xl border bg-white p-6">
          <div className="text-sm font-bold text-slate-900">
            Alternativas
          </div>

          <div className="mt-4 space-y-4">
            {form.options.map((opt) => {
              const isCorrect =
                form.correctOptionId === opt.id;

              return (
                <div
                  key={opt.id}
                  className="rounded-xl border p-4"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">
                      Alternativa {opt.id}
                    </div>

                    <button
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          correctOptionId: opt.id,
                        }))
                      }
                      className={classNames(
                        "rounded-full px-3 py-1 text-xs font-bold",
                        isCorrect
                          ? "bg-emerald-600 text-white"
                          : "bg-slate-100"
                      )}
                    >
                      {isCorrect
                        ? "Correta"
                        : "Marcar correta"}
                    </button>
                  </div>

                  <textarea
                    value={opt.text}
                    onChange={(e) =>
                      setOption(opt.id, {
                        text: e.target.value,
                      })
                    }
                    className="mt-3 w-full min-h-[80px] rounded-xl border p-3 text-sm"
                  />

                  <div className="mt-3 flex flex-col gap-3">
                    <input
                      value={opt.imageUrl || ""}
                      onChange={(e) =>
                        setOption(opt.id, {
                          imageUrl: e.target.value,
                        })
                      }
                      placeholder="URL da imagem"
                      className="rounded-xl border px-4 py-3 text-sm"
                    />

                    <label className="inline-flex cursor-pointer rounded-xl border bg-white px-4 py-3 text-sm font-semibold hover:bg-slate-50">
                      {uploading === opt.id
                        ? "Enviando..."
                        : "Enviar imagem"}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const f =
                            e.target.files?.[0];
                          if (f)
                            handleUploadOption(
                              opt.id,
                              f
                            );
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
      </div>
    </AdminShell>
  );
}