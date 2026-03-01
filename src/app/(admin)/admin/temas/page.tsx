import CatalogManagerPage from "@/components/admin/CatalogManagerPage";

const ITEMS = [
  {
    id: "15",
    code: "15",
    createdAt: "13/09/2022",
    title: "Farmacologia dos Anestésicos Locais",
    level: "R1",
    status: "ativo" as const,
  },
  {
    id: "16",
    code: "16",
    createdAt: "13/09/2022",
    title: "Bloqueios Subaracnóideo e Peridural",
    level: "R1",
    status: "ativo" as const,
  },
  {
    id: "20",
    code: "20",
    createdAt: "14/09/2022",
    title: "Anestésicos Venosos",
    level: "R1",
    status: "ativo" as const,
  },
  {
    id: "21",
    code: "21",
    createdAt: "14/09/2022",
    title: "Complicações da Anestesia",
    level: "R1",
    status: "ativo" as const,
  },
  {
    id: "22",
    code: "22",
    createdAt: "14/09/2022",
    title: "Anestesia para geriatria",
    level: "R3",
    status: "ativo" as const,
  },
  {
    id: "24",
    code: "24",
    createdAt: "14/09/2022",
    title: "Transmissão e Bloqueio Neuromuscular",
    level: "R1",
    status: "ativo" as const,
  },
  {
    id: "25",
    code: "25",
    createdAt: "14/09/2022",
    title: "Bloqueios Periféricos",
    level: "R2",
    status: "ativo" as const,
  },
  {
    id: "26",
    code: "26",
    createdAt: "14/09/2022",
    title: "Farmacologia Geral",
    level: "R1",
    status: "ativo" as const,
  },
];

export default function TemasPage() {
  return (
    <CatalogManagerPage
      title="Temas"
      subtitle="Cadastre os temas que serão usados nas questões e relacione-os com um nível."
      searchPlaceholder="Filtrar temas..."
      createLabel="Criar tema"
      items={ITEMS}
      emptyMessage="Nenhum tema encontrado."
      showLevelColumn
    />
  );
}
