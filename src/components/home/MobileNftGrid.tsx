
import { MobileNftCard } from "./MobileNftCard";

// Imagens originais do Figma
import emeraldApe from "@/assets/mobile/hero-nft-main.png";
import sageNomad from "@/assets/mobile/hero-nft-secondary.png";
import rareApe from "@/assets/mobile/nft-rare.png";
import goldenApe from "@/assets/mobile/nft-gold.png";

// Dados temporários dos NFTs
// Posteriormente serão fornecidos pela API simulada.
const nfts = [
  {
    id: "nft-1",
    image: emeraldApe,
    name: "Emerald Ape #042",
    priceEth: "1.19",
    showFavorite: true,
  },
  {
    id: "nft-2",
    image: sageNomad,
    name: "Sage Nomad #009",
    priceEth: "1.69",
  },
  {
    id: "nft-3",
    image: rareApe,
    name: "Emerald Ape #042",
    priceEth: "1.19",
    isRare: true,
  },
  {
    id: "nft-4",
    image: goldenApe,
    name: "Sage Nomad #009",
    priceEth: "1.69",
  },
];

export function MobileNftGrid() {
  return (
    <section
      aria-label="NFTs disponíveis"
      className="
        grid
        w-full
        grid-cols-2
        items-start
        gap-x-4
        gap-y-6
      "
    >
      {nfts.map((nft) => (
        <MobileNftCard
          key={nft.id}
          image={nft.image}
          name={nft.name}
          priceEth={nft.priceEth}
          showFavorite={nft.showFavorite}
          isRare={nft.isRare}
        />
      ))}
    </section>
  );
}
