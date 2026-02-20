// src/app/aluno/entrar/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import { isSignInWithEmailLink, signInWithEmailLink } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";

function docIdFromEmail(email: string) {
  return encodeURIComponent(email.trim().toLowerCase());
}

export default function AlunoEntrarPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [status, setStatus] = useState<"carregando" | "ok" | "erro">("carregando");
  const [msg, setMsg] = useState("Confirmando seu acesso...");

  const href = useMemo(() => {
    if (typeof window === "undefined") return "";
    return window.location.href;
  }, []);

  useEffect(() => {
    const run = async () => {
      try {
        if (!href) return;

        const okLink = isSignInWithEmailLink(auth, href);
        if (!okLink) {
          setStatus("erro");
          setMsg("Link inválido ou expirado. Volte e solicite um novo link.");
          return;
        }

        // tenta recuperar email salvo
        let email = localStorage.getItem("aq_magic_email") || "";

        // fallback: se não tem, pede (evita ficar travado)
        if (!email) {
          const promptEmail = window.prompt("Confirme seu e-mail para entrar:");
          email = (promptEmail || "").trim().toLowerCase();
        }

        if (!email) {
          setStatus("erro");
          setMsg("E-mail não informado.");
          return;
        }

        const cred = await signInWithEmailLink(auth, email, href);

        // sincroniza acesso com entitlements
        const entRef = doc(db, "entitlements", docIdFromEmail(email));
        const entSnap = await getDoc(entRef);

        const ent = entSnap.exists() ? (entSnap.data() as any) : null;
        const accessActive = ent?.active === true;

        // cria/atualiza perfil do usuário
        await setDoc(
          doc(db, "users", cred.user.uid),
          {
            email,
            role: "student",
            accessActive,
            accessSource: "eduzz",
            updatedAt: serverTimestamp(),
            createdAt: serverTimestamp(),
          },
          { merge: true }
        );

        localStorage.removeItem("aq_magic_email");

        setStatus("ok");
        setMsg(accessActive ? "Acesso liberado ✅ Redirecionando..." : "Acesso ainda não liberado. Redirecionando...");
        // manda pra área do aluno (você pode trocar depois)
        router.replace(accessActive ? "/aluno" : "/aluno/login");
      } catch {
        setStatus("erro");
        setMsg("Não foi possível confirmar o acesso. Solicite um novo link.");
      }
    };

    void run();
  }, [href, router, searchParams]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white shadow-sm p-6">
        <div className="text-lg font-black text-slate-900">Anestesia Questões</div>
        <div className="mt-2 text-sm text-slate-600">{msg}</div>

        {status === "erro" ? (
          <button
            onClick={() => router.replace("/aluno/login")}
            className="mt-4 w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800"
          >
            Voltar para login
          </button>
        ) : null}
      </div>
    </div>
  );
}