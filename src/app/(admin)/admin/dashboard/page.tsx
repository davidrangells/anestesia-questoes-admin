export default function DashboardPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500 mt-1">
          Visão geral do Anestesia Questões.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4">
          <div className="text-xs text-slate-500">Questões no banco</div>
          <div className="text-2xl font-extrabold mt-1">—</div>
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <div className="text-xs text-slate-500">Alunos ativos</div>
          <div className="text-2xl font-extrabold mt-1">—</div>
        </div>

        <div className="bg-white border rounded-2xl p-4">
          <div className="text-xs text-slate-500">Erros reportados</div>
          <div className="text-2xl font-extrabold mt-1">—</div>
        </div>
      </div>

      <div className="bg-white border rounded-2xl p-4">
        <div className="text-sm font-semibold text-slate-900">Próximos passos</div>
        <ul className="list-disc pl-5 mt-2 text-sm text-slate-600 space-y-1">
          <li>Conectar página “Banco de Questões” no <code>questionsBank</code></li>
          <li>Adicionar upload/URL de imagem (question + opções)</li>
          <li>Página “Erros reportados” lendo <code>erros_reportados</code></li>
        </ul>
      </div>
    </div>
  );
}