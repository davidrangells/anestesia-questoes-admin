import CatalogManagerPage from "@/components/admin/CatalogManagerPage";

const ITEMS = [
  {
    id: "1",
    code: "1",
    createdAt: "06/09/2022",
    title: "R1",
    status: "ativo" as const,
  },
  {
    id: "2",
    code: "2",
    createdAt: "06/09/2022",
    title: "R2",
    status: "ativo" as const,
  },
  {
    id: "7",
    code: "7",
    createdAt: "06/09/2022",
    title: "R3",
    status: "ativo" as const,
  },
];

export default function NiveisPage() {
  return (
    <CatalogManagerPage
      title="Níveis"
      subtitle="Cadastre os níveis acadêmicos usados na classificação das questões."
      searchPlaceholder="Filtrar níveis..."
      createLabel="Criar nível"
      items={ITEMS}
      emptyMessage="Nenhum nível encontrado."
    />
  );
}
