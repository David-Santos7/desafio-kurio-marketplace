
import axios from "axios";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  Check,
  RefreshCw,
  ShoppingCart,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { useNft } from "@/hooks/useNfts";
import { nfts, type Nft } from "@/data/nfts";

// ==========================================
// KURIO — ROTA DINÂMICA DO NFT
// ==========================================

export const Route = createFileRoute("/nft/$nftId")({
  component: NftDetailsPage,
});

// Valida a estrutura recebida da API.
function isValidNft(value: unknown): value is Nft {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const item = value as Partial<Nft>;

  return (
    typeof item.id === "string" &&
    typeof item.name === "string" &&
    typeof item.image === "string" &&
    typeof item.priceEth === "string" &&
    Array.isArray(item.tags)
  );
}

// ==========================================
// PÁGINA DE DETALHES
// ==========================================

// eslint-disable-next-line react-refresh/only-export-components
function NftDetailsPage() {
  // Identificador recebido pela URL.
  const { nftId } = Route.useParams();

  // Consulta do NFT pela API.
  const {
    data,
    isPending,
    isError,
    isFetching,
    error,
    refetch,
  } = useNft(nftId);

  // Catálogo local para recuperação em caso de falha.
  const localNft = nfts.find(
    (item) => item.id === nftId
  );

  // Valida o resultado HTTP.
  const apiNft =
    isValidNft(data) && data.id === nftId
      ? data
      : undefined;

  const nft = apiNft ?? localNft;

  // Identifica a utilização de dados locais.
  const usingLocalFallback =
    !isPending &&
    localNft !== undefined &&
    (
      isError ||
      (data !== undefined && apiNft === undefined)
    );

  // Identifica um erro HTTP 404.
  const isNotFound =
    axios.isAxiosError(error) &&
    error.response?.status === 404;

  // Carrinho compartilhado.
  const {
    addToCart,
    removeFromCart,
    isInCart,
  } = useCart();

  const isSelected = nft
    ? isInCart(nft.id)
    : false;

  // Adiciona ou remove o NFT do carrinho.
  function handleCart(): void {
    if (!nft) {
      return;
    }

    if (isInCart(nft.id)) {
      removeFromCart(nft.id);
      return;
    }

    addToCart(nft.id);
  }

  return (
    <div className="min-h-screen bg-kurio-bg text-kurio-text">

      {/* Header desktop */}
      <div className="hidden pt-6 lg:block">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-[1200px] px-6 pb-20 pt-8 lg:pt-12">

        {/* Voltar ao catálogo */}
        <Link
          to="/"
          search={{ tab: "all" }}
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-kurio-secondary transition-colors hover:text-kurio-accent"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-5 w-5"
          />

          Voltar ao marketplace
        </Link>

        {/* ================================== */}
        {/* ESTADO DE CARREGAMENTO */}
        {/* ================================== */}

        {isPending ? (
          <div
            role="status"
            className="flex min-h-[320px] flex-col items-center justify-center gap-4 rounded-[20px] bg-kurio-card"
          >
            <RefreshCw
              aria-hidden="true"
              className="h-8 w-8 animate-spin text-kurio-accent"
            />

            <p className="text-[14px] text-kurio-secondary">
              Carregando informações do NFT...
            </p>
          </div>

        ) : !nft ? (

          /* ================================== */
          /* NFT NÃO ENCONTRADO OU ERRO DA API */
          /* ================================== */

          <section
            role="status"
            className="flex min-h-[320px] flex-col items-center justify-center gap-5 rounded-[20px] bg-kurio-card px-6 text-center"
          >
            <h1 className="text-[24px] font-bold text-kurio-accent">
              {isNotFound
                ? "NFT não encontrado"
                : isError
                  ? "Não foi possível carregar o NFT"
                  : "NFT não encontrado"}
            </h1>

            <p className="max-w-[400px] text-[14px] leading-6 text-kurio-secondary">
              {isNotFound
                ? "O NFT solicitado não existe no catálogo."
                : isError
                  ? "A API está indisponível no momento."
                  : "Não encontramos informações para este NFT."}
            </p>

            {isError && !isNotFound && (
              <button
                type="button"
                onClick={() => {
                  void refetch();
                }}
                disabled={isFetching}
                className="flex min-h-[44px] items-center justify-center gap-2 rounded-[10px] bg-kurio-primary px-6 text-[13px] font-bold text-kurio-bg disabled:opacity-50"
              >
                <RefreshCw
                  aria-hidden="true"
                  className={`h-4 w-4 ${
                    isFetching ? "animate-spin" : ""
                  }`}
                />

                Tentar novamente
              </button>
            )}
          </section>

        ) : (

          /* ================================== */
          /* INFORMAÇÕES DO NFT */
          /* ================================== */

          <div className="flex flex-col gap-6">

            {/* Aviso de fallback */}
            {usingLocalFallback && (
              <div
                role="alert"
                className="flex flex-col gap-2 rounded-[12px] border border-kurio-border bg-kurio-card p-4 text-[12px] text-kurio-secondary lg:flex-row lg:items-center lg:justify-between"
              >
                <span>
                  API indisponível ou resposta inválida.
                  Exibindo informações locais do NFT.
                </span>

                <button
                  type="button"
                  onClick={() => {
                    void refetch();
                  }}
                  disabled={isFetching}
                  className="font-bold text-kurio-accent disabled:opacity-50"
                >
                  Tentar novamente
                </button>
              </div>
            )}

            <section className="grid grid-cols-1 items-start gap-8 lg:grid-cols-2 lg:gap-12">

              {/* Imagem do NFT */}
              <div className="flex min-h-[350px] items-center justify-center rounded-[24px] bg-gradient-to-br from-kurio-card to-kurio-raised p-4 lg:min-h-[500px] lg:p-6">
                <img
                  src={nft.image}
                  alt={`Arte digital do NFT ${nft.name}`}
                  className="max-h-[460px] w-full rounded-[18px] object-contain"
                />
              </div>

              {/* Dados do NFT */}
              <div className="flex flex-col gap-6">

                <div className="flex flex-wrap items-center gap-3">
                  <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-kurio-secondary">
                    KURIO NFT Marketplace
                  </span>

                  {nft.isRare && (
                    <span className="rounded-[8px] bg-kurio-primary px-3 py-1 text-[12px] font-bold text-kurio-bg">
                      RARO
                    </span>
                  )}
                </div>

                <h1 className="text-[28px] font-bold leading-tight text-kurio-text lg:text-[42px]">
                  {nft.name}
                </h1>

                {/* Categorias */}
                <div className="flex flex-wrap gap-2">
                  {nft.tags.includes("new") && (
                    <span className="rounded-full border border-kurio-border px-3 py-1 text-[12px] text-kurio-secondary">
                      Novo lançamento
                    </span>
                  )}

                  {nft.tags.includes("trending") && (
                    <span className="rounded-full border border-kurio-border px-3 py-1 text-[12px] text-kurio-secondary">
                      Em alta
                    </span>
                  )}
                </div>

                <p className="text-[14px] leading-7 text-kurio-secondary">
                  Explore esta arte digital do catálogo KURIO.
                  Confira suas informações e adicione o NFT
                  ao carrinho para continuar sua experiência
                  no marketplace.
                </p>

                {/* Preço */}
                <div className="flex flex-col gap-2 rounded-[16px] border border-kurio-border bg-kurio-card p-5">
                  <span className="text-[12px] text-kurio-secondary">
                    Preço do NFT
                  </span>

                  <strong className="text-[28px] font-bold text-kurio-accent">
                    {nft.priceEth} ETH
                  </strong>

                  <span className="text-[12px] text-kurio-secondary">
                    Identificador: {nft.id}
                  </span>
                </div>

                {/* Botão de carrinho */}
                <button
                  type="button"
                  onClick={handleCart}
                  aria-pressed={isSelected}
                  className={`flex h-[52px] w-full items-center justify-center gap-3 rounded-[12px] text-[14px] font-bold transition-colors ${
                    isSelected
                      ? "border border-kurio-primary bg-kurio-card text-kurio-accent"
                      : "bg-kurio-primary text-kurio-bg hover:bg-kurio-accent"
                  }`}
                >
                  {isSelected ? (
                    <>
                      <Check
                        aria-hidden="true"
                        className="h-5 w-5"
                      />
                      Remover do carrinho
                    </>
                  ) : (
                    <>
                      <ShoppingCart
                        aria-hidden="true"
                        className="h-5 w-5"
                      />
                      Adicionar ao carrinho
                    </>
                  )}
                </button>

                {/* Acesso ao carrinho */}
                <Link
                  to="/"
                  search={{ tab: "cart" }}
                  className="flex min-h-[44px] items-center justify-center rounded-[12px] border border-kurio-border text-[13px] font-medium text-kurio-text hover:text-kurio-accent"
                >
                  Ver meu carrinho
                </Link>

                <p className="text-center text-[12px] text-kurio-secondary">
                  Marketplace demonstrativo.
                  Nenhuma transação financeira é realizada.
                </p>
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
