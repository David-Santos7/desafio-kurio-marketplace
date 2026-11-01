
import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";

import { nfts } from "@/data/nfts";
import { MobileNftCard } from "./MobileNftCard";

// Chave utilizada no armazenamento local.
const FAVORITES_STORAGE_KEY = "kurio:favorites";

// IDs válidos do catálogo.
const validNftIds = new Set(nfts.map((nft) => nft.id));

// Favoritos iniciais definidos no catálogo.
const defaultFavoriteIds = nfts
  .filter((nft) => nft.showFavorite === true)
  .map((nft) => nft.id);

// Recupera os favoritos do navegador.
function getInitialFavorites(): string[] {
  if (typeof window === "undefined") {
    return defaultFavoriteIds;
  }

  try {
    const storedFavorites = window.localStorage.getItem(
      FAVORITES_STORAGE_KEY
    );

    if (storedFavorites === null) {
      return defaultFavoriteIds;
    }

    const parsedFavorites: unknown = JSON.parse(
      storedFavorites
    );

    if (!Array.isArray(parsedFavorites)) {
      return defaultFavoriteIds;
    }

    // Remove IDs inválidos e duplicações.
    const validFavorites = parsedFavorites.filter(
      (id): id is string =>
        typeof id === "string" && validNftIds.has(id)
    );

    return [...new Set(validFavorites)];
  } catch {
    return defaultFavoriteIds;
  }
}

export function MobileNftGrid() {
  // Lê a categoria, os favoritos e a busca da URL.
  const { tab, q } = useSearch({
    from: "/",
  });

  // Indica se estamos visualizando os favoritos.
  const isFavoritesView = tab === "favorites";

  // Estado dos favoritos.
  const [favoriteIds, setFavoriteIds] = useState<string[]>(
    getInitialFavorites
  );

  // Salva os favoritos no navegador.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds)
      );
    } catch {
      // Os favoritos continuam funcionando em memória.
    }
  }, [favoriteIds]);

  // Adiciona ou remove um NFT dos favoritos.
  function toggleFavorite(nftId: string): void {
    if (!validNftIds.has(nftId)) {
      return;
    }

    setFavoriteIds((currentFavorites) => {
      if (currentFavorites.includes(nftId)) {
        return currentFavorites.filter(
          (id) => id !== nftId
        );
      }

      return [...currentFavorites, nftId];
    });
  }

  // Normaliza o texto pesquisado.
  const searchTerm = (q ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");

  // Filtra os NFTs conforme a visualização selecionada.
  const filteredNfts = nfts.filter((nft) => {
    let matchesCategory: boolean;

    if (isFavoritesView) {
      // Exibe somente os NFTs favoritados.
      matchesCategory = favoriteIds.includes(nft.id);
    } else if (tab === "all") {
      // Exibe todos os NFTs.
      matchesCategory = true;
    } else {
      // Filtra por Novos lançamentos ou Em alta.
      matchesCategory = nft.tags.includes(tab);
    }

    // A pesquisa funciona também nos favoritos.
    const matchesSearch = nft.name
      .toLocaleLowerCase("pt-BR")
      .includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  return (
    <section
      aria-label={
        isFavoritesView
          ? "Meus NFTs favoritos"
          : "Catálogo de NFTs"
      }
      className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-6"
    >
      {/* Título exibido somente nos favoritos */}
      {isFavoritesView && (
        <h2 className="col-span-2 text-[16px] font-bold text-kurio-accent">
          Meus favoritos
        </h2>
      )}

      {filteredNfts.length > 0 ? (
        filteredNfts.map((nft) => (
          <MobileNftCard
            key={nft.id}
            image={nft.image}
            name={nft.name}
            priceEth={nft.priceEth}
            isRare={nft.isRare}
            isFavorite={favoriteIds.includes(nft.id)}
            onToggleFavorite={() => {
              toggleFavorite(nft.id);
            }}
          />
        ))
      ) : (
        <div
          role="status"
          className="col-span-2 rounded-[10px] bg-kurio-card px-4 py-8 text-center"
        >
          <p className="text-[14px] font-bold text-kurio-text">
            {isFavoritesView
              ? favoriteIds.length === 0
                ? "Você ainda não tem favoritos"
                : "Nenhum favorito encontrado"
              : "Nenhum NFT encontrado"}
          </p>

          <p className="mt-2 text-[12px] text-kurio-secondary">
            {isFavoritesView
              ? favoriteIds.length === 0
                ? "Toque no coração de um NFT para adicioná-lo aos favoritos."
                : "Tente pesquisar outro nome."
              : "Tente pesquisar outro nome ou selecionar uma categoria diferente."}
          </p>
        </div>
      )}
    </section>
  );
}
