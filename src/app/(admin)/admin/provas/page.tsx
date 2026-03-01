import CatalogManagerPage from "@/components/admin/CatalogManagerPage";

const ITEMS = [
  {
    id: "11",
    code: "11",
    createdAt: "13/09/2022",
    title: "TSA - Título Superior em Anestesiologia",
    status: "ativo" as const,
  },
  {
    id: "12",
    code: "12",
    createdAt: "13/09/2022",
    title: "TEA - Título de Especialista em Anestesiologia",
    status: "ativo" as const,
  },
  {
    id: "14",
    code: "14",
    createdAt: "13/09/2022",
    title: "Residência ME - Médicos em Especialização",
    status: "ativo" as const,
  },
];

export default function ProvasPage() {
  return (
    <CatalogManagerPage
      title="Provas"
      subtitle="Cadastre e organize as provas disponíveis para classificação das questões."
      searchPlaceholder="Filtrar provas..."
      createLabel="Criar prova"
      items={ITEMS}
      emptyMessage="Nenhuma prova encontrada."
    />
  );
}
