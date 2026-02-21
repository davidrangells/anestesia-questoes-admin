"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

function mapMsg(code: string) {
  switch (code) {
    case "sem_acesso":
      return "Sua assinatura ainda não está ativa. Se acabou de pagar, aguarde alguns minutos.";
    default:
      return "";
  }
}

export default function AlunoLoginClient() {
  const router = useRouter();
  const sp = useSearchParams();

  const msg = useMemo(() => mapMsg(sp.get("msg") || ""), [sp]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;

    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email.trim(), senha);
      const uid = cred.user.uid;

      // Checa entitlement
      const entSnap = await getDoc(doc(db, "entitlements", uid));
      const active = entSnap.exists() && entSnap.data()?.active === true;

      if (!active) {
        router.replace("/aluno/entrar?msg=sem_acesso");
        return;
      }

      router.replace("/aluno/app");
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string };
      const text =
        anyErr?.code === "auth/invalid-credential"
          ? "E-mail ou senha inválidos."
          : anyErr?.message || "Não foi possível entrar.";
      alert(text);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-3xl border bg-white shadow-sm">
        <div className="p-6 border-b">
          <div className="text-xl font-black text-slate-900">Anestesia Questões</div>
          <div className="text-sm text-slate-500">Área do Aluno</div>
        </div>

        <form onSubmit={onLogin} className="p-6 space-y-4">
          {msg ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              {msg}
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

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">Senha</div>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>

          <div className="text-xs text-slate-500">
            Se você comprou agora, verifique seu e-mail para <b>definir a senha</b>.
          </div>
        </form>
      </div>
    </div>
  );
}