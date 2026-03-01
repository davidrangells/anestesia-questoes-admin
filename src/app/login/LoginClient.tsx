"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button } from "@/components/ui/Button";

function mapErroToMessage(code: string) {
  switch (code) {
    case "acesso_negado":
      return "Acesso negado. Sua conta não tem permissão de admin.";
    case "verificacao_admin":
      return "Falha ao verificar permissões de admin. Tente novamente.";
    default:
      return "";
  }
}

export default function LoginClient() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const erro = searchParams.get("erro") || "";
  const erroMsg = useMemo(() => mapErroToMessage(erro), [erro]);

  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;

    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), senha);
      router.replace("/admin");
    } catch (err: unknown) {
      const authError = err as { code?: string; message?: string };
      const msg =
        authError?.code === "auth/invalid-credential"
          ? "E-mail ou senha inválidos."
          : authError?.message || "Não foi possível fazer login.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-6 sm:px-6">
      <div className="w-full max-w-md overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
        <div className="border-b border-slate-100 bg-gradient-to-b from-slate-50 to-white px-5 py-5 sm:px-6">
          <div className="text-xl font-black text-slate-900">Anestesia Questões</div>
          <div className="mt-1 text-sm text-slate-500">Login do Admin</div>
        </div>

        <form onSubmit={onLogin} className="space-y-4 px-5 py-5 sm:px-6 sm:py-6">
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
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <div>
            <div className="text-xs font-semibold text-slate-600 mb-1">Senha</div>
            <input
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              type="password"
              placeholder="••••••••"
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-base outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>

          <Button type="submit" disabled={loading} variant="primary" block>
            {loading ? "Entrando..." : "Entrar"}
          </Button>

          <div className="text-xs text-slate-500">
            Dica: o usuário precisa ter <b>role = &quot;admin&quot;</b> em <b>users/{`uid`}</b>.
          </div>
        </form>
      </div>
    </div>
  );
}
