export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";
import { requireAdmin } from "@/lib/adminRoute";

type DetailedQuestion = {
  questionId: string;
  prompt: string;
  selectedOptionId: string;
  correctOptionId: string;
  isCorrect: boolean | null;
  answered: boolean;
};

function getSeconds(value: unknown) {
  if (typeof value === "object" && value !== null && "seconds" in value) {
    return Number((value as { seconds?: number }).seconds ?? 0);
  }

  if (typeof value === "string" || typeof value === "number") {
    const date = new Date(value);
    const time = date.getTime();
    return Number.isFinite(time) ? Math.floor(time / 1000) : 0;
  }

  return 0;
}

function formatDate(value: unknown) {
  const seconds = getSeconds(value);
  if (!seconds) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
    timeZone: "America/Sao_Paulo",
  }).format(new Date(seconds * 1000));
}

function normalizeStatus(session: Record<string, unknown>) {
  const raw = String(session.status ?? session.state ?? "").trim().toLowerCase();
  if (
    raw === "concluido" ||
    raw === "concluído" ||
    raw === "completed" ||
    raw === "done" ||
    raw === "finished"
  ) {
    return "concluido" as const;
  }

  if (getSeconds(session.endedAt ?? session.finishedAt ?? session.completedAt)) {
    return "concluido" as const;
  }

  return "pendente" as const;
}

function normalizeQuestionCount(session: Record<string, unknown>) {
  const direct = Number(
    session.totalQuestions ??
      session.questionsCount ??
      session.total ??
      session.quantity ??
      session.amount
  );

  if (Number.isFinite(direct) && direct > 0) return direct;
  if (Array.isArray(session.questionIds)) return session.questionIds.length;
  if (Array.isArray(session.questions)) return session.questions.length;
  if (Array.isArray(session.items)) return session.items.length;
  return 0;
}

function normalizeScore(session: Record<string, unknown>, totalQuestions: number) {
  const direct = Number(session.scorePercent ?? session.gradePercent ?? session.notePercent);
  if (Number.isFinite(direct)) return direct;

  const maybePercent = Number(session.score ?? session.note ?? session.grade);
  if (Number.isFinite(maybePercent)) {
    if (maybePercent > 0 && maybePercent <= 1) return maybePercent * 100;
    if (maybePercent <= 100) return maybePercent;
  }

  const correctCount = Number(session.correctCount ?? session.hits ?? session.correctAnswers);
  if (Number.isFinite(correctCount) && totalQuestions > 0) {
    return (correctCount / totalQuestions) * 100;
  }

  return 0;
}

function uniqueStrings(values: unknown[]) {
  const set = new Set<string>();

  values.forEach((value) => {
    if (typeof value === "string" && value.trim()) {
      set.add(value.trim());
    }
  });

  return Array.from(set);
}

async function loadQuestions(questionIds: string[]) {
  if (!questionIds.length) return new Map<string, Record<string, unknown>>();

  const refs = questionIds.map((questionId) => adminDb.collection("questionsBank").doc(questionId));
  const snaps = await adminDb.getAll(...refs);

  const map = new Map<string, Record<string, unknown>>();
  snaps.forEach((snap) => {
    if (snap.exists) {
      map.set(snap.id, snap.data() as Record<string, unknown>);
    }
  });

  return map;
}

async function deleteCollectionDocs(
  ref: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>
) {
  const snap = await ref.get();
  if (!snap.size) return;

  const batch = adminDb.batch();
  snap.docs.forEach((docSnap) => {
    batch.delete(docSnap.ref);
  });
  await batch.commit();
}

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ uid: string; sessionId: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const { uid, sessionId } = await context.params;

  try {
    const userRef = adminDb.collection("users").doc(uid);
    const sessionRef = userRef.collection("sessions").doc(sessionId);
    const attemptRef = userRef.collection("attempts").doc(sessionId);

    const [userSnap, profileSnap, sessionSnap, attemptSnap] = await Promise.all([
      userRef.get(),
      userRef.collection("profile").doc("main").get(),
      sessionRef.get(),
      attemptRef.get(),
    ]);

    if (!userSnap.exists) {
      return NextResponse.json({ ok: false, error: "Aluno não encontrado." }, { status: 404 });
    }

    const simuladoSnap = sessionSnap.exists ? sessionSnap : attemptSnap;
    if (!simuladoSnap.exists) {
      return NextResponse.json({ ok: false, error: "Simulado não encontrado." }, { status: 404 });
    }

    const [sessionAnswersSnap, attemptAnswersSnap] = await Promise.all([
      sessionRef.collection("answers").get(),
      attemptRef.collection("answers").get(),
    ]);

    const answersSnap = attemptAnswersSnap.size ? attemptAnswersSnap : sessionAnswersSnap;
    const data = simuladoSnap.data() as Record<string, unknown>;
    const userData = userSnap.data() ?? {};
    const profile = profileSnap.exists ? profileSnap.data() ?? {} : {};
    const totalQuestions = normalizeQuestionCount(data);
    const score = normalizeScore(data, totalQuestions);

    const answerRecords = answersSnap.docs.map((docSnap) => ({
      questionId: docSnap.id,
      data: docSnap.data() as Record<string, unknown>,
    }));

    const sessionQuestionIds = [
      ...(Array.isArray(data.questionIds) ? data.questionIds : []),
      ...(Array.isArray(data.questions)
        ? data.questions
            .map((item) =>
              typeof item === "object" && item !== null ? (item as { id?: unknown }).id ?? "" : ""
            )
            .filter(Boolean)
        : []),
    ];

    const questionIds = uniqueStrings([
      ...answerRecords.map((answer) => answer.questionId),
      ...sessionQuestionIds,
    ]);

    const questionMap = await loadQuestions(questionIds);

    const questions: DetailedQuestion[] = questionIds.map((questionId) => {
      const answer = answerRecords.find((item) => item.questionId === questionId)?.data ?? {};
      const storedQuestion = questionMap.get(questionId) ?? {};
      const embeddedQuestion =
        Array.isArray(data.questions) &&
        data.questions.find(
          (item) =>
            typeof item === "object" &&
            item !== null &&
            String((item as { id?: unknown }).id ?? "").trim() === questionId
        );

      const prompt =
        String(storedQuestion.prompt_text ?? storedQuestion.prompt ?? "").trim() ||
        String(
          typeof embeddedQuestion === "object" && embeddedQuestion !== null
            ? (embeddedQuestion as { prompt?: unknown; prompt_text?: unknown }).prompt_text ??
                (embeddedQuestion as { prompt?: unknown }).prompt ??
                ""
            : ""
        ).trim() ||
        `Questão ${questionId}`;

      const selectedOptionId = String(
        answer.selectedOptionId ??
          answer.answerId ??
          answer.selectedOption ??
          answer.userAnswer ??
          ""
      )
        .trim()
        .toUpperCase();
      const correctOptionId = String(
        storedQuestion.correctOptionId ?? answer.correctOptionId ?? answer.correctAnswer ?? ""
      )
        .trim()
        .toUpperCase();

      let isCorrect: boolean | null = null;
      if (typeof answer.isCorrect === "boolean") {
        isCorrect = answer.isCorrect;
      } else if (selectedOptionId && correctOptionId) {
        isCorrect = selectedOptionId === correctOptionId;
      }

      return {
        questionId,
        prompt,
        selectedOptionId,
        correctOptionId,
        isCorrect,
        answered: Boolean(selectedOptionId),
      };
    });

    const answeredCount = questions.filter((question) => question.answered).length;
    const correctCount = questions.filter((question) => question.isCorrect === true).length;

    return NextResponse.json(
      {
        ok: true,
        simulado: {
          uid,
          sessionId,
          code: sessionId,
          createdAt: formatDate(
            data.createdAt ?? data.startedAt ?? data.startAt ?? data.created_at ?? null
          ),
          endedAt: formatDate(
            data.endedAt ?? data.finishedAt ?? data.completedAt ?? data.closedAt ?? null
          ),
          aluno:
            String(profile.name ?? "").trim() ||
            String(userData.name ?? "").trim() ||
            "Aluno sem nome",
          nota: Number(score.toFixed(1)),
          status: normalizeStatus(data),
          totalQuestions: questions.length || totalQuestions,
          answeredCount,
          correctCount,
          questions,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao carregar o simulado.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ uid: string; sessionId: string }> }
) {
  const authCheck = await requireAdmin(req);
  if ("error" in authCheck) return authCheck.error;

  const { uid, sessionId } = await context.params;

  try {
    const userRef = adminDb.collection("users").doc(uid);
    const sessionRef = userRef.collection("sessions").doc(sessionId);
    const attemptRef = userRef.collection("attempts").doc(sessionId);

    const [sessionSnap, attemptSnap] = await Promise.all([sessionRef.get(), attemptRef.get()]);

    if (sessionSnap.exists) {
      await deleteCollectionDocs(sessionRef.collection("answers"));
      await sessionRef.delete();
    }

    if (attemptSnap.exists) {
      await deleteCollectionDocs(attemptRef.collection("answers"));
      await attemptRef.delete();
    }

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao excluir o simulado.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
