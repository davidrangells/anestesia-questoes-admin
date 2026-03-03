"use client";

import AdminShell from "@/components/AdminShell";
import {
  QuestionEditorForm,
  createEmptyQuestionForm,
} from "@/components/admin/QuestionEditorForm";
import { db } from "@/lib/firebase";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function NovaQuestaoPage() {
  const router = useRouter();

  return (
    <AdminShell
      title="Nova questão"
      subtitle="Criar nova questão no questionsBank"
    >
      <QuestionEditorForm
        mode="create"
        initialValue={createEmptyQuestionForm()}
        onCancel={() => router.push("/admin/questoes")}
        onSubmit={async (payload) => {
          await addDoc(collection(db, "questionsBank"), {
            ...payload,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
          router.push("/admin/questoes");
        }}
      />
    </AdminShell>
  );
}
