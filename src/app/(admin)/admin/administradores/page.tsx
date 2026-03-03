"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import AdminShell from "@/components/AdminShell";
import { Button, buttonStyles } from "@/components/ui/Button";
import { auth, db } from "@/lib/firebase";

type AdminItem = {
  uid: string;
  code: string;
  name: string;
  email: string;
  isCurrentUser: boolean;
};

export default function AdministradoresPage() {
  const [items, setItems] = useState<AdminItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [deletingUid, setDeletingUid] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const load = async () => {
      setLoading(true);
      setErrorMsg(null);

      try {
        const currentUid = auth.currentUser?.uid ?? "";
        const snap = await getDocs(query(collection(db, "users"), where("role", "==", "admin")));

        const rows = snap.docs
          .map((docSnap) => ({
            uid: docSnap.id,
            name: String(docSnap.data().name ?? "").trim() || "Administrador sem nome",
            email: String(docSnap.data().email ?? "").trim() || "—",
            sortName: String(docSnap.data().name ?? "").trim().toLowerCase(),
            isCurrentUser: docSnap.id === currentUid,
          }))
          .sort((a, b) => a.sortName.localeCompare(b.sortName))
          .map((item, index) => ({
            uid: item.uid,
            code: String(index + 1),
            name: item.name,
            email: item.email,
            isCurrentUser: item.isCurrentUser,
          })) satisfies AdminItem[];

        if (active) setItems(rows);
      } catch (error) {
        if (active) {
          setErrorMsg(
            error instanceof Error ? error.message : "Não foi possível carregar os administradores."
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    void load();

    return () => {
      active = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return items;
    return items.filter((item) =>
      [item.code, item.name, item.email].join(" ").toLowerCase().includes(s)
    );
  }, [items, search]);

  const removeAdmin = async (item: AdminItem) => {
    setDeletingUid(item.uid);
    setErrorMsg(null);

    try {
      const token = await auth.currentUser?.getIdToken();
      if (!token) throw new Error("Sessão inválida. Faça login novamente.");

      const res = await fetch(`/api/admin/administradores/${item.uid}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = (await res.json()) as { ok: boolean; error?: string };
      if (!res.ok || !data.ok) {
        throw new Error(data.error || "Não foi possível excluir o administrador.");
      }

      setItems((prev) => prev.filter((current) => current.uid !== item.uid));
    } catch (error) {
      setErrorMsg(error instanceof Error ? error.message : "Erro ao excluir administrador.");
    } finally {
      setDeletingUid(null);
    }
  };

  return (
    <AdminShell
      title="Administradores"
      subtitle="Gerencie os usuários que têm acesso ao dashboard administrativo."
      actions={
        <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center">
          <div className="relative w-full md:w-[340px]">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              ⌕
            </span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filtrar administradores..."
              className="w-full rounded-2xl border border-slate-200 bg-white px-11 py-3 text-sm outline-none transition focus:border-blue-200 focus:ring-2 focus:ring-blue-200"
            />
          </div>
          <Link href="/admin/administradores/novo" className={buttonStyles({ variant: "primary" })}>
            Criar
          </Link>
        </div>
      }
    >
      <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-200 bg-slate-50/80 px-5 py-5">
          <div className="text-2xl font-black text-slate-900">Administradores</div>
          <div className="mt-1 text-sm text-slate-500">
            {loading ? "Carregando..." : `${filtered.length} registros`}
          </div>
          {errorMsg ? (
            <div className="mt-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {errorMsg}
            </div>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[860px] w-full text-sm">
            <thead className="border-b bg-slate-100/80 text-xs font-bold uppercase tracking-[0.2em] text-slate-500">
              <tr>
                <th className="px-5 py-4 text-left">Cód.</th>
                <th className="px-5 py-4 text-left">Nome</th>
                <th className="px-5 py-4 text-left">E-mail</th>
                <th className="px-5 py-4 text-right">Ações</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-200">
              {!loading && filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm text-slate-500">
                    Nenhum administrador encontrado.
                  </td>
                </tr>
              ) : null}

              {filtered.map((item) => (
                <tr key={item.uid} className="hover:bg-slate-50/70">
                  <td className="px-5 py-5 text-lg font-semibold text-slate-600">{item.code}</td>
                  <td className="px-5 py-5 font-semibold text-slate-800">
                    {item.name}
                    {item.isCurrentUser ? (
                      <span className="ml-2 inline-flex rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                        você
                      </span>
                    ) : null}
                  </td>
                  <td className="px-5 py-5 text-slate-600">{item.email}</td>
                  <td className="px-5 py-5">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/administradores/${item.uid}`}
                        className={buttonStyles({ variant: "primary", size: "sm" })}
                      >
                        Editar
                      </Link>
                      {!item.isCurrentUser ? (
                        <Button
                          size="sm"
                          variant="danger"
                          disabled={deletingUid === item.uid}
                          onClick={() => removeAdmin(item)}
                        >
                          Excluir
                        </Button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}
