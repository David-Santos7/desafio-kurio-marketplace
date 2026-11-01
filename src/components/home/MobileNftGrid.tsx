
import { useEffect, useState } from "react";
import { Link, useSearch } from "@tanstack/react-router";
import { ArrowRight, RefreshCw, ShoppingCart } from "lucide-react";

import { useCart } from "@/context/CartContext";
import { useNfts } from "@/hooks/useNfts";
import { nfts } from "@/data/nfts";
import { MobileNftCard } from "./MobileNftCard";

// =====================================================
// KURIO — CONFIGURAÇÃO DOS FAVORITOS
// =====================================================

const FAVORITES_STORAGE_KEY = "kurio:favorites";

const validNftIds = new Set(
  nfts.map((nft) => nft.id)
);

const defaultFavoriteIds = nfts
  .filter((nft) => nft.showFavorite === true)
  .map((nft) => nft.id);

// =====================================================
// RECUPERAÇÃO DOS FAVORITOS
// =====================================================

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

    const validFavorites = parsed.filter(
      (id): id is string =>
        typeof id === "string" &&
        validNftIds.has(id)
    );

    return [...new Set(validFavorites)];
  } catch {
    return defaultFavoriteIds;
  }
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function MobileNftGrid() {
  // Parâmetros da URL.
  const { tab, q, sort } = useSearch({
    from: "/",
  });

  // ===================================================
  // API — TANSTACK QUERY + AXIOS + MSW
  // ===================================================

  const {
    data: remoteNfts,
    isPending,
    isError,
    isFetching,
    refetch,
  } = useNfts();

  // Utiliza os dados da API quando disponíveis.
  // Caso contrário, preserva o catálogo local.
  const catalogNfts = remoteNfts ?? nfts;

  const showLoading = isPending && !remoteNfts;
  const showApiError = isError && !remoteNfts;

  // ===================================================
  // CARRINHO COMPARTILHADO
  // ===================================================

  const {
    addToCart,
    removeFromCart,
    isInCart,
    cartCount,
    totalEth,
  } = useCart();

  // ===================================================
  // FAVORITOS
  // ===================================================

  const [favoriteIds, setFavoriteIds] = useState<string[]>(
    getInitialFavorites
  );

  const favoriteSet = new Set(favoriteIds);

  const isFavoritesView = tab === "favorites";
  const isCartView = tab === "cart";

  // Salva os favoritos no navegador.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        FAVORITES_STORAGE_KEY,
        JSON.stringify(favoriteIds)
      );
    } catch {
      // Mantém os favoritos no estado do React.
    }
  }, [favoriteIds]);

  // ===================================================
  // ADICIONAR E REMOVER FAVORITOS
  // ===================================================

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

  // ===================================================
  // ADICIONAR E REMOVER DO CARRINHO
  // ===================================================

  function toggleCart(nftId: string): void {
    if (!validNftIds.has(nftId)) {
      return;
    }

    if (isInCart(nftId)) {
      removeFromCart(nftId);
      return;
    }

    addToCart(nftId);
  }

  // ===================================================
  // PESQUISA
  // ===================================================

  const searchTerm = (q ?? "")
    .trim()
    .toLocaleLowerCase("pt-BR");

  // ===================================================
  // FILTRAGEM DO CATÁLOGO
  // ===================================================

  const filteredNfts = catalogNfts.filter((nft) => {
    let matchesCategory: boolean;

    if (tab === "cart") {
      matchesCategory = isInCart(nft.id);
    } else if (tab === "favorites") {
      matchesCategory = favoriteSet.has(nft.id);
    } else if (tab === "all") {
      matchesCategory = true;
    } else if (tab === "new" || tab === "trending") {
      matchesCategory = nft.tags.includes(tab);
    } else {
      matchesCategory = false;
    }

    const matchesSearch = nft.name
      .toLocaleLowerCase("pt-BR")
      .includes(searchTerm);

    return matchesCategory && matchesSearch;
  });

  // ===================================================
  // ORDENAÇÃO DO CATÁLOGO
  // ===================================================

  const sortedNfts = [...filteredNfts].sort((a, b) => {
    const priceA = Number(a.priceEth);
    const priceB = Number(b.priceEth);

    if (sort === "price-asc") {
      return priceA - priceB;
    }

    if (sort === "price-desc") {
      return priceB - priceA;
    }

    return 0;
  });

  // ===================================================
  // MENSAGENS PARA LISTAS VAZIAS
  // ===================================================

  let emptyTitle = "Nenhum NFT encontrado";

  let emptyDescription =
    "Tente pesquisar outro nome ou selecionar outra categoria.";

  if (isCartView) {
    if (cartCount === 0) {
      emptyTitle = "Seu carrinho está vazio";
      emptyDescription =
        "Explore o catálogo e adicione NFTs ao carrinho.";
    } else {
      emptyTitle = "Nenhum NFT encontrado no carrinho";
      emptyDescription = "Tente pesquisar outro nome.";
    }
  } else if (isFavoritesView) {
    if (favoriteIds.length === 0) {
      emptyTitle = "Você ainda não tem favoritos";
      emptyDescription =
        "Toque no coração de um NFT para adicioná-lo aos favoritos.";
    } else {
      emptyTitle = "Nenhum favorito encontrado";
      emptyDescription = "Tente pesquisar outro nome.";
    }
  }

  // ===================================================
  // INTERFACE
  // ===================================================

  return (
    <section
      aria-label={
        isCartView
          ? "Meu carrinho"
          : isFavoritesView
            ? "Meus NFTs favoritos"
            : "Catálogo de NFTs"
      }
      className="
        grid w-full grid-cols-2 items-start
        gap-x-4 gap-y-6
        lg:grid-cols-4 lg:gap-x-6 lg:gap-y-8
      "
    >
      {/* ============================================= */}
      {/* ESTADO DE CARREGAMENTO DA API */}
      {/* ============================================= */}

      {showLoading && (
        <div
          role="status"
          className="
            col-span-2 flex items-center gap-2
            rounded-[10px] bg-kurio-card
            px-4 py-3 text-[12px]
            text-kurio-secondary lg:col-span-4
          "
        >
          <RefreshCw
            aria-hidden="true"
            className="h-4 w-4 animate-spin"
          />

          Sincronizando catálogo com a API...
        </div>
      )}

      {/* ============================================= */}
      {/* ERRO DA API COM FALLBACK LOCAL */}
      {/* ============================================= */}

      {showApiError && (
        <div
          role="alert"
          className="
            col-span-2 flex flex-col gap-3
            rounded-[10px] border border-kurio-border
            bg-kurio-card px-4 py-3
            lg:col-span-4 lg:flex-row
            lg:items-center lg:justify-between
          "
        >
          <div className="flex flex-col gap-1">
            <p className="text-[12px] font-bold text-kurio-accent">
              API temporariamente indisponível
            </p>

            <p className="text-[12px] text-kurio-secondary">
              Exibindo o catálogo local da KURIO.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void refetch();
            }}
            disabled={isFetching}
            className="
              flex min-h-[40px] items-center
              justify-center gap-2
              rounded-[8px] bg-kurio-primary
              px-4 py-2 text-[12px]
              font-bold text-kurio-bg
              disabled:cursor-not-allowed
              disabled:opacity-50
            "
          >
            <RefreshCw
              aria-hidden="true"
              className={`h-4 w-4 ${
                isFetching ? "animate-spin" : ""
              }`}
            />

            Tentar novamente
          </button>
        </div>
      )}

      {/* ============================================= */}
      {/* RESUMO DO CARRINHO */}
      {/* ============================================= */}

      {isCartView && (
        <div className="col-span-2 flex flex-col gap-4 lg:col-span-4">
          <h2 className="text-[16px] font-bold text-kurio-accent lg:text-[24px]">
            Meu carrinho
          </h2>

          <div
            className="
              flex flex-col gap-4
              rounded-[12px]
              border border-kurio-border
              bg-kurio-card p-4
              lg:flex-row lg:items-center
              lg:justify-between lg:p-6
            "
          >
            <div className="flex flex-col gap-2">
              <span
                className="
                  flex items-center gap-2
                  text-[12px] text-kurio-secondary
                  lg:text-[14px]
                "
              >
                <ShoppingCart
                  aria-hidden="true"
                  className="h-4 w-4"
                />

                {cartCount} NFT(s) no carrinho
              </span>

              <strong className="text-[17px] font-bold text-kurio-accent lg:text-[22px]">
                Total: {totalEth.toFixed(2)} ETH
              </strong>
            </div>

            {cartCount > 0 && (
              <Link
                to="/checkout"
                className="
                  flex min-h-[44px] w-full
                  items-center justify-center gap-2
                  rounded-[10px]
                  bg-kurio-primary px-4 py-3
                  text-[12px] font-bold text-kurio-bg
                  transition-colors
                  hover:bg-kurio-accent
                  focus-visible:outline-2
                  focus-visible:outline-offset-2
                  focus-visible:outline-kurio-accent
                  lg:w-auto lg:text-[14px]
                "
              >
                Finalizar pedido

                <ArrowRight
                  aria-hidden="true"
                  className="h-4 w-4"
                />
              </Link>
            )}
          </div>
        </div>
      )}

      {/* ============================================= */}
      {/* TÍTULO DOS FAVORITOS */}
      {/* ============================================= */}

      {isFavoritesView && (
        <h2
          className="
            col-span-2
            text-[16px] font-bold text-kurio-accent
            lg:col-span-4 lg:text-[24px]
          "
        >
          Meus favoritos
        </h2>
      )}

      {/* ============================================= */}
      {/* CARDS DOS NFTs */}
      {/* ============================================= */}

      {sortedNfts.length > 0 ? (
        sortedNfts.map((nft) => (
          <MobileNftCard
            key={nft.id}
            nftId={nft.id}
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
          className="
            col-span-2
            flex flex-col items-center gap-3
            rounded-[12px] bg-kurio-card
            px-4 py-8 text-center
            lg:col-span-4 lg:py-12
          "
        >
          {isCartView && (
            <ShoppingCart
              aria-hidden="true"
              className="h-8 w-8 text-kurio-accent"
            />
          )}

          <p className="text-[14px] font-bold text-kurio-text lg:text-[18px]">
            {emptyTitle}
          </p>

          <p className="text-[12px] leading-5 text-kurio-secondary lg:text-[14px]">
            {emptyDescription}
          </p>

          {isCartView && cartCount === 0 && (
            <Link
              to="/"
              search={{
                tab: "all",
                q: undefined,
                sort: undefined,
              }}
              className="
                mt-2 rounded-[10px]
                bg-kurio-primary px-5 py-3
                text-[12px] font-bold text-kurio-bg
                transition-colors hover:bg-kurio-accent
              "
            >
              Explorar NFTs
            </Link>
          )}
        </div>
      )}
    </section>
  );
}
