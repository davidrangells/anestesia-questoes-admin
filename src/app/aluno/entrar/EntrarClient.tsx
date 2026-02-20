"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { sendSignInLinkToEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

function mapErroToMessage(code: string) {
  switch (code) {
    case "link_invalido":
      return "Link inválido ou expirado. Solicite um novo acesso.";
    case "nao_autorizado":
      return "Você ainda não tem acesso. Verifique sua compra.";
    default:
      return "";
  }
}

export default function EntrarClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const erro = searchParams.get("erro") || "";
  const erroMsg = useMemo(() => mapErroToMessage(erro), [erro]);

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const onSendLink = async (e: React.FormEvent) => {
    e.preventDefault();
    const mail = email.trim().toLowerCase();
    if (!mail) return;

    setLoading(true);
    try {
      // Action Code Settings (mágico)
      // ✅ Ajuste a URL para seu domínio final (Vercel)
      const actionCodeSettings = {
        url: `${window.location.origin}/aluno/confirmar`,
        handleCodeInApp: true,
      };

      await sendSignInLinkToEmail(auth, mail, actionCodeSettings);

      // salva email pra confirmar depois
      window.localStorage.setItem("aluno_email_link", mail);

      alert("Enviamos um link de acesso no seu e-mail. ✅");
      router.replace("/aluno/entrar?ok=1");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Não foi possível enviar o link.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white shadow-sm">
        <div className="p-6 border-b">
          <div className="text-xl font-black text-slate-900">Anestesia Questões</div>
          <div className="text-sm text-slate-500">Acesso do Aluno</div>
        </div>

        <form onSubmit={onSendLink} className="p-6 space-y-4">
          {erroMsg ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {erroMsg}
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
            Você vai receber um e-mail com um link para entrar.
          </div>
        </form>
      </div>
    </div>
  );
}