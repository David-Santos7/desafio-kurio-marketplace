
import emeraldApe from "@/assets/mobile/hero-nft-main.png";
import sageNomad from "@/assets/mobile/hero-nft-secondary.png";
import rareApe from "@/assets/mobile/nft-rare.png";
import goldenApe from "@/assets/mobile/nft-gold.png";

// Categorias utilizadas no catálogo
export type NftTag = "new" | "trending";

// Estrutura de dados de cada NFT
export type Nft = {
  id: string;
  image: string;
  name: string;
  priceEth: string;
  tags: NftTag[];
  showFavorite?: boolean;
  isRare?: boolean;
};

// Catálogo simulado de NFTs
export const nfts: Nft[] = [
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
