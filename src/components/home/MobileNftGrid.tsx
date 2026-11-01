
import { useSearch } from "@tanstack/react-router";

import { MobileNftCard } from "./MobileNftCard";

// Imagens originais do projeto
import emeraldApe from "@/assets/mobile/hero-nft-main.png";
import sageNomad from "@/assets/mobile/hero-nft-secondary.png";
import rareApe from "@/assets/mobile/nft-rare.png";
import goldenApe from "@/assets/mobile/nft-gold.png";

// Categorias disponíveis
type NftTag = "new" | "trending";

// Estrutura de dados de um NFT
type Nft = {
  id: string;
  image: string;
  name: string;
  priceEth: string;
  tags: NftTag[];
  showFavorite?: boolean;
  isRare?: boolean;
};

// Catálogo temporário
const nfts: Nft[] = [
  {
    id: "nft-1",
    image: emeraldApe,
    name: "Emerald Ape #042",
    priceEth: "1.19",
    showFavorite: true,
    tags: ["new"],
  },
  {
    id: "nft-2",
    image: sageNomad,
    name: "Sage Nomad #009",
    priceEth: "1.69",
    tags: ["trending"],
  },
  {
    id: "nft-3",
    image: rareApe,
    name: "Emerald Ape #042",
    priceEth: "1.19",
    isRare: true,
    tags: ["trending"],
  },
  {
    id: "nft-4",
    image: goldenApe,
    name: "Sage Nomad #009",
    priceEth: "1.69",
    tags: ["new", "trending"],
  },
];

export function MobileNftGrid() {
  // Obtém categoria e pesquisa da URL.
  const { tab, q } = useSearch({
    from: "/",
  });

  // Normaliza a pesquisa para facilitar a comparação.
  const searchTerm = (q ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");

  // Aplica os filtros de categoria e nome.
  const filteredNfts = nfts.filter((nft) => {
    // Verifica se o NFT pertence à categoria.
    const matchesCategory =
      tab === "all" || nft.tags.includes(tab);

    // Verifica se o nome contém o termo pesquisado.
    const matchesSearch = nft.name
      .toLocaleLowerCase("pt-BR")
      .includes(searchTerm);

    // O NFT precisa atender aos dois critérios.
    return matchesCategory && matchesSearch;
  });

  return (
    <section
      aria-label="Catálogo de NFTs"
      className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-6"
    >
      {filteredNfts.length > 0 ? (
        filteredNfts.map((nft) => (
          <MobileNftCard
            key={nft.id}
            image={nft.image}
            name={nft.name}
            priceEth={nft.priceEth}
            showFavorite={nft.showFavorite}
            isRare={nft.isRare}
          />
        ))
      ) : (
        <div
          role="status"
          className="col-span-2 rounded-[10px] bg-kurio-card px-4 py-8 text-center"
        >
          <p className="text-[14px] font-bold text-kurio-text">
            Nenhum NFT encontrado
          </p>

          <p className="mt-2 text-[12px] text-kurio-secondary">
            Tente pesquisar outro nome ou selecionar
            uma categoria diferente.
          </p>
        </div>
      )}
    </section>
  );
}
