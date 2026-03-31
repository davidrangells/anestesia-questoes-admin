"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

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
  const [uiError, setUiError] = useState("");

  const onLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !senha.trim()) return;
    setUiError("");

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
      setUiError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_10%_0%,rgba(56,189,248,0.18),transparent_45%),radial-gradient(900px_circle_at_100%_20%,rgba(37,99,235,0.24),transparent_42%),linear-gradient(180deg,#020817_0%,#06143a_100%)] p-4 sm:p-6">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[34px] border border-[#d9e2f4]/30 bg-[#e7ebf3] shadow-[0_30px_90px_rgba(2,6,23,0.45)] md:grid-cols-[1.12fr_1fr]">
          <div className="relative hidden flex-col justify-between overflow-hidden border-r border-[#c9d4ea] bg-[linear-gradient(145deg,#d9e7f4_0%,#cfd9ea_100%)] p-9 md:flex">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(900px_circle_at_20%_0%,rgba(255,255,255,0.45),transparent_55%),radial-gradient(700px_circle_at_95%_90%,rgba(59,130,246,0.12),transparent_50%)]" />
            <div className="relative z-10">
              <div className="inline-flex items-center gap-3 rounded-3xl border border-[#d2d9e6] bg-[#f1f4fa] px-6 py-4 shadow-[0_10px_35px_rgba(15,23,42,0.08)]">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#061a44]">
                  <Image
                    src="/logo-icon.png"
                    alt="Logo Anestesia Questões"
                    width={46}
                    height={46}
                    className="h-11 w-11 object-contain"
                  />
                </div>
                <div>
                  <div className="text-[2rem] font-black leading-none text-slate-900">
                    Anestesia Questões
                  </div>
                  <div className="mt-1 text-[1.7rem] font-extrabold leading-none text-slate-700">
                    Painel Administrativo
                  </div>
                </div>
              </div>
            </div>

            <div className="relative z-10 max-w-[540px]">
              <h1 className="text-6xl font-black leading-[1.05] tracking-[-0.02em] text-[#0b1633]">
                Gestão completa,
                <br />
                com foco no que
                <br />
                mais importa.
              </h1>
              <p className="mt-8 text-[2rem] leading-[1.35] text-slate-600">
                Acompanhe alunos, simulados, assinaturas e operação diária da plataforma.
              </p>
            </div>
          </div>

          <div className="bg-[#f2f4f8] p-5 sm:p-8 md:p-10">
            <div className="mb-5 flex items-center gap-3 md:hidden">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-blue-200/30 bg-[#071a3f]">
                <Image
                  src="/logo-icon.png"
                  alt="Logo Anestesia Questões"
                  width={38}
                  height={38}
                  className="h-9 w-9 object-contain"
                />
              </div>
              <div>
                <div className="text-lg font-black text-slate-900">Anestesia Questões</div>
                <div className="text-xs font-semibold text-slate-500">Painel Administrativo</div>
              </div>
            </div>

            <div className="mb-8">
              <div className="text-sm font-bold tracking-[0.2em] text-[#607292]">ACESSO DO ADMIN</div>
              <div className="mt-2 text-3xl font-black leading-tight text-[#0b1633] sm:text-4xl md:text-5xl">
                Entrar no painel
              </div>
            </div>

            <form onSubmit={onLogin} className="space-y-6">
              {erroMsg ? (
                <div className="rounded-2xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  {erroMsg}
                </div>
              ) : null}

              {uiError ? (
                <div className="rounded-2xl border border-rose-300/60 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                  {uiError}
                </div>
              ) : null}

              <div>
                <div className="mb-2 text-lg font-bold text-[#33445f] sm:text-xl md:text-3xl">E-mail</div>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  autoComplete="email"
                  placeholder="seuemail@dominio.com"
                  className="h-16 w-full rounded-3xl border border-[#c8d2e3] bg-[#e0e6f1] px-6 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/45 sm:text-lg md:text-[1.65rem]"
                />
              </div>

              <div>
                <div className="mb-2 text-lg font-bold text-[#33445f] sm:text-xl md:text-3xl">Senha</div>
                <input
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  type="password"
                  autoComplete="current-password"
                  placeholder="Digite sua senha"
                  className="h-16 w-full rounded-3xl border border-[#c8d2e3] bg-[#e0e6f1] px-6 text-base font-medium text-slate-900 outline-none transition placeholder:text-slate-500 focus:border-blue-500 focus:ring-4 focus:ring-blue-200/45 sm:text-lg md:text-[1.65rem]"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-xl font-bold text-white shadow-[0_18px_40px_rgba(37,99,235,0.35)] transition hover:from-blue-500 hover:to-indigo-500 disabled:opacity-60 sm:text-2xl md:text-3xl"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              <div className="rounded-3xl border border-[#d1d9e8] bg-[#eef2f8] px-5 py-4 text-sm text-slate-600 sm:text-base md:text-xl">
                Dica: o usuário precisa ter <b>role = &quot;admin&quot;</b> em <b>users/{`uid`}</b>.
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
