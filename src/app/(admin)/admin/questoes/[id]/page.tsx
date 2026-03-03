"use client";

import AdminShell from "@/components/AdminShell";
import {
  QuestionEditorForm,
  createEmptyQuestionForm,
  questionDocToForm,
} from "@/components/admin/QuestionEditorForm";
import { db } from "@/lib/firebase";
import { deleteDoc, doc, getDoc, serverTimestamp, updateDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function EditarQuestaoPage() {
  const router = useRouter();
  const params = useParams();
  const id = String(params?.id || "");
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(createEmptyQuestionForm());

  useEffect(() => {
    if (!id) return;

    const loadQuestion = async () => {
      setLoading(true);
      try {
        const snap = await getDoc(doc(db, "questionsBank", id));
        if (!snap.exists()) {
          alert("Questão não encontrada.");
          router.replace("/admin/questoes");
          return;
        }

        setForm(questionDocToForm(snap.data()));
      } finally {
        setLoading(false);
      }
    };

    void loadQuestion();
  }, [id, router]);

  return (
    <AdminShell
      title="Editar questão"
      subtitle={loading ? "Carregando..." : `questionsBank/${id}`}
    >
      {loading ? (
        <div className="rounded-2xl border bg-white p-6 text-sm text-slate-600">Carregando...</div>
      ) : (
        <QuestionEditorForm
          mode="edit"
          initialValue={form}
          onCancel={() => router.push("/admin/questoes")}
          onSubmit={async (payload) => {
            await updateDoc(doc(db, "questionsBank", id), {
              ...payload,
              updatedAt: serverTimestamp(),
            });
          }}
          onDelete={async () => {
            if (!confirm("Tem certeza que deseja excluir esta questão?")) return;
            await deleteDoc(doc(db, "questionsBank", id));
            router.replace("/admin/questoes");
          }}
        />
      )}
    </AdminShell>
  );
}
