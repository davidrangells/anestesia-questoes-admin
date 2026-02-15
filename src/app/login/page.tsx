"use client";

import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const erro = sp.get("erro");

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async () => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace("/admin");
    } catch (e: any) {
      alert(e?.message || "Erro ao entrar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="bg-white border rounded-2xl shadow-sm p-6">
        <div className="text-2xl font-black text-slate-900">Anestesia Questões</div>
        <div className="text-sm text-slate-500 mt-1">Painel Administrativo</div>

        {erro && (
          <div className="mt-4 text-sm rounded-xl bg-red-50 text-red-700 border border-red-200 p-3">
            {erro === "acesso_negado" ? "Acesso negado: usuário não é admin." : "Erro ao validar admin."}
          </div>
        )}

        <div className="mt-6 space-y-3">
          <input
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            className="w-full border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-200"
            placeholder="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <button
            onClick={onLogin}
            disabled={loading}
            className="w-full rounded-xl bg-slate-900 text-white py-3 font-semibold hover:bg-slate-800 transition disabled:opacity-60"
          >
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </div>
      </div>

      <div className="text-xs text-slate-500 mt-3 text-center">
        Use seu usuário admin para acessar o painel.
      </div>
    </div>
  );
}