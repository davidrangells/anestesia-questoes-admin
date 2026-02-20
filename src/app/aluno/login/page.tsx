// src/app/aluno/login/page.tsx
"use client";

import { sendSignInLinkToEmail } from "firebase/auth";
import { useState } from "react";
import { auth } from "@/lib/firebase";

const APP_URL = "https://anestesia-questoes-admin.vercel.app";

export default function AlunoLoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const onSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const em = email.trim().toLowerCase();
    if (!em) return;

    setLoading(true);
    try {
      const actionCodeSettings = {
        url: `${APP_URL}/aluno/entrar`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, em, actionCodeSettings);
      localStorage.setItem("aq_magic_email", em);
      setSent(true);
    } catch (err: unknown) {
      alert("Não foi possível enviar o link. Verifique o Firebase Auth e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="text-xl font-black text-slate-900">Anestesia Questões</div>
          <div className="text-sm text-slate-500">Acesso do Aluno (link mágico)</div>
        </div>

        <form onSubmit={onSend} className="p-6 space-y-4">
          {sent ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              Link enviado! Confira seu e-mail e clique para entrar.
            </div>
          ) : null}

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">E-mail</div>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="seuemail@..."
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Enviando..." : "Enviar link de acesso"}
          </button>

          <div className="text-xs text-slate-500">
            Se você comprou pela Eduzz, o acesso será liberado automaticamente após confirmação de pagamento.
          </div>
        </form>
      </div>
    </div>
  );
}