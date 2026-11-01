
import { useEffect, useState } from "react";
import { useSearch } from "@tanstack/react-router";

import { useCart } from "@/context/CartContext";
import { nfts } from "@/data/nfts";
import { MobileNftCard } from "./MobileNftCard";

// Armazenamento dos favoritos
const FAVORITES_STORAGE_KEY = "kurio:favorites";

const validNftIds = new Set(
  nfts.map((nft) => nft.id)
);

const defaultFavoriteIds = nfts
  .filter((nft) => nft.showFavorite === true)
  .map((nft) => nft.id);

function getInitialFavorites(): string[] {
  if (typeof window === "undefined") {
    return defaultFavoriteIds;
  }

  try {
    const stored = window.localStorage.getItem(
      FAVORITES_STORAGE_KEY
    );

    if (stored === null) {
      return defaultFavoriteIds;
    }

    const parsed: unknown = JSON.parse(stored);

    if (!Array.isArray(parsed)) {
      return defaultFavoriteIds;
    }

    const favorites = parsed.filter(
      (id): id is string =>
        typeof id === "string" &&
        validNftIds.has(id)
    );

    return [...new Set(favorites)];
  } catch {
    return defaultFavoriteIds;
  }
}

export function MobileNftGrid() {
  const { tab, q } = useSearch({
    from: "/",
  });

  // Estado e funções do carrinho compartilhado
  const {
    addToCart,
    removeFromCart,
    isInCart,
    cartCount,
    totalEth,
  } = useCart();

  // Estado dos favoritos
  const [favoriteIds, setFavoriteIds] = useState<string[]>(
    getInitialFavorites
  );

  const isFavoritesView = tab === "favorites";
  const isCartView = tab === "cart";

  const favoriteSet = new Set(favoriteIds);

  // Salva os favoritos
  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds)
      );
    } catch {
      // Mantém o estado em memória.
    }
  }, [favoriteIds]);

  // Alterna o favorito
  function toggleFavorite(nftId: string): void {
    if (!validNftIds.has(nftId)) {
      return;
    }

    setFavoriteIds((current) =>
      current.includes(nftId)
        ? current.filter((id) => id !== nftId)
        : [...current, nftId]
    );
  }

  // Alterna o estado do carrinho
  function toggleCart(nftId: string): void {
    if (!validNftIds.has(nftId)) {
      return;
    }

    if (isInCart(nftId)) {
      removeFromCart(nftId);
    } else {
      addToCart(nftId);
    }
  }

  // Normaliza a pesquisa
  const searchTerm = (q ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");

  // Seleciona os NFTs da visualização atual
  const filteredNfts = nfts.filter((nft) => {
    let matchesCategory: boolean;

    if (tab === "cart") {
      matchesCategory = isInCart(nft.id);
    } else if (tab === "favorites") {
      matchesCategory = favoriteSet.has(nft.id);
    } else if (tab === "all") {
      matchesCategory = true;
    } else {
      matchesCategory = nft.tags.includes(tab);
    }

    const matchesSearch = nft.name
      .toLocaleLowerCase("pt-BR")
      .includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  // Mensagens para listas vazias
  let emptyTitle = "Nenhum NFT encontrado";
  let emptyDescription =
    "Tente pesquisar outro nome ou selecionar uma categoria diferente.";

  if (isCartView) {
    emptyTitle =
      cartCount === 0
        ? "Seu carrinho está vazio"
        : "Nenhum NFT encontrado no carrinho";

    emptyDescription =
      cartCount === 0
        ? "Volte ao catálogo e adicione NFTs ao carrinho."
        : "Tente pesquisar outro nome.";
  } else if (isFavoritesView) {
    emptyTitle =
      favoriteIds.length === 0
        ? "Você ainda não tem favoritos"
        : "Nenhum favorito encontrado";

    emptyDescription =
      favoriteIds.length === 0
        ? "Toque no coração de um NFT para adicioná-lo aos favoritos."
        : "Tente pesquisar outro nome.";
  }

  return (
    <section
      aria-label={
        isCartView
          ? "Meu carrinho"
          : isFavoritesView
            ? "Meus NFTs favoritos"
            : "Catálogo de NFTs"
      }
      className="grid w-full grid-cols-2 items-start gap-x-4 gap-y-6"
    >
      {/* Resumo do carrinho */}
      {isCartView && (
        <div className="col-span-2 flex flex-col gap-2">
          <h2 className="text-[16px] font-bold text-kurio-accent">
            Meu carrinho
          </h2>

          <div className="rounded-[10px] bg-kurio-card p-3">
            <p className="text-[12px] text-kurio-secondary">
              {cartCount} NFT(s) no carrinho
            </p>

            <p className="mt-1 text-[15px] font-bold text-kurio-accent">
              Total: {totalEth.toFixed(2)} ETH
            </p>
          </div>
        </div>
      )}

      {/* Título dos favoritos */}
      {isFavoritesView && (
        <h2 className="col-span-2 text-[16px] font-bold text-kurio-accent">
          Meus favoritos
        </h2>
      )}

      {/* Cards */}
      {filteredNfts.length > 0 ? (
        filteredNfts.map((nft) => (
          <MobileNftCard
            key={nft.id}
            image={nft.image}
            name={nft.name}
            priceEth={nft.priceEth}
            isRare={nft.isRare}
            isFavorite={favoriteSet.has(nft.id)}
            onToggleFavorite={() =>
              toggleFavorite(nft.id)
            }
            isInCart={isInCart(nft.id)}
            onToggleCart={() =>
              toggleCart(nft.id)
            }
          />
        ))
      ) : (
        <div
          role="status"
          className="col-span-2 rounded-[10px] bg-kurio-card px-4 py-8 text-center"
        >
          <p className="text-[14px] font-bold text-kurio-text">
            {emptyTitle}
          </p>

          <p className="mt-2 text-[12px] text-kurio-secondary">
            {emptyDescription}
          </p>
        </div>
      )}
    </section>
  );
}
