
import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  ShoppingCart,
  Trash2,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { nfts } from "@/data/nfts";

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

type CompletedOrder = {
  itemCount: number;
  totalEth: number;
};

// eslint-disable-next-line react-refresh/only-export-components
function CheckoutPage() {
  const {
    cartIds,
    cartCount,
    totalEth,
    removeFromCart,
  } = useCart();

  const [completedOrder, setCompletedOrder] =
    useState<CompletedOrder | null>(null);

  // Recupera os NFTs adicionados ao carrinho.
  const cartItems = nfts.filter((nft) =>
    cartIds.includes(nft.id)
  );

  // Finaliza apenas o pedido demonstrativo.
  function handleCheckout(): void {
    if (cartCount === 0 || completedOrder) {
      return;
    }

    // Preserva os dados da confirmação.
    setCompletedOrder({
      itemCount: cartCount,
      totalEth,
    });

    // Esvazia o carrinho após a confirmação.
    cartIds.forEach((nftId) => {
      removeFromCart(nftId);
    });
  }

  return (
    <div className="min-h-screen bg-kurio-bg text-kurio-text">
      {/* Header desktop */}
      <div className="hidden pt-6 lg:block">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-[1100px] px-6 pb-20 pt-10">
        {/* Voltar ao carrinho */}
        <Link
          to="/"
          search={{ tab: "cart" }}
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-kurio-secondary transition-colors hover:text-kurio-accent"
        >
          <ArrowLeft
            aria-hidden="true"
            className="h-5 w-5"
          />
          Voltar ao carrinho
        </Link>

        {/* Pedido confirmado */}
        {completedOrder ? (
          <section
            role="status"
            className="mx-auto flex max-w-[560px] flex-col items-center gap-6 rounded-[20px] border border-kurio-border bg-kurio-card px-6 py-12 text-center"
          >
            <CheckCircle2
              aria-hidden="true"
              className="h-16 w-16 text-kurio-accent"
            />

            <h1 className="text-[24px] font-bold text-kurio-text lg:text-[32px]">
              Pedido demonstrativo concluído!
            </h1>

            <p className="text-[14px] leading-7 text-kurio-secondary">
              Sua simulação de checkout foi concluída.
              Nenhuma compra real ou transação financeira
              foi realizada.
            </p>

            <div className="w-full rounded-[12px] bg-kurio-bg p-5">
              <p className="text-[13px] text-kurio-secondary">
                {completedOrder.itemCount} NFT(s) selecionado(s)
              </p>

              <p className="mt-2 text-[24px] font-bold text-kurio-accent">
                {completedOrder.totalEth.toFixed(2)} ETH
              </p>
            </div>

            <Link
              to="/"
              search={{ tab: "all" }}
              className="flex h-[48px] w-full items-center justify-center rounded-[12px] bg-kurio-primary px-6 text-[14px] font-bold text-kurio-bg"
            >
              Voltar ao marketplace
            </Link>
          </section>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Título */}
            <div>
              <span className="text-[12px] font-bold uppercase tracking-[0.15em] text-kurio-accent">
                KURIO NFT Marketplace
              </span>

              <h1 className="mt-3 text-[28px] font-bold lg:text-[40px]">
                Checkout
              </h1>

              <p className="mt-2 text-[14px] text-kurio-secondary">
                Revise seus NFTs antes de confirmar
                o pedido demonstrativo.
              </p>
            </div>

            {cartCount === 0 ? (
              /* Carrinho vazio */
              <section className="flex flex-col items-center gap-5 rounded-[16px] bg-kurio-card px-6 py-12 text-center">
                <ShoppingCart
                  aria-hidden="true"
                  className="h-12 w-12 text-kurio-accent"
                />

                <h2 className="text-[20px] font-bold">
                  Seu carrinho está vazio
                </h2>

                <p className="text-[13px] text-kurio-secondary">
                  Adicione NFTs ao carrinho antes
                  de finalizar seu pedido.
                </p>

                <Link
                  to="/"
                  search={{ tab: "all" }}
                  className="rounded-[12px] bg-kurio-primary px-6 py-3 text-[13px] font-bold text-kurio-bg"
                >
                  Explorar NFTs
                </Link>
              </section>
            ) : (
              /* Conteúdo do checkout */
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[1fr_360px]">
                {/* Produtos */}
                <section
                  aria-labelledby="checkout-items-title"
                  className="flex flex-col gap-4"
                >
                  <h2
                    id="checkout-items-title"
                    className="text-[18px] font-bold"
                  >
                    NFTs selecionados ({cartCount})
                  </h2>

                  {cartItems.map((nft) => (
                    <article
                      key={nft.id}
                      className="flex items-center gap-4 rounded-[16px] border border-kurio-border bg-kurio-card p-3"
                    >
                      <Link
                        to="/nft/$nftId"
                        params={{ nftId: nft.id }}
                        aria-label={`Ver detalhes de ${nft.name}`}
                        className="shrink-0"
                      >
                        <img
                          src={nft.image}
                          alt={`NFT ${nft.name}`}
                          className="h-[90px] w-[90px] rounded-[12px] object-cover lg:h-[110px] lg:w-[110px]"
                        />
                      </Link>

                      <div className="flex min-w-0 flex-1 flex-col gap-2">
                        <Link
                          to="/nft/$nftId"
                          params={{ nftId: nft.id }}
                          className="truncate text-[14px] font-bold hover:text-kurio-accent lg:text-[16px]"
                        >
                          {nft.name}
                        </Link>

                        <p className="text-[14px] font-bold text-kurio-accent">
                          {nft.priceEth} ETH
                        </p>

                        <button
                          type="button"
                          onClick={() => removeFromCart(nft.id)}
                          aria-label={`Remover ${nft.name} do carrinho`}
                          className="flex items-center gap-2 self-start text-[12px] text-kurio-secondary hover:text-kurio-accent"
                        >
                          <Trash2
                            aria-hidden="true"
                            className="h-4 w-4"
                          />
                          Remover
                        </button>
                      </div>
                    </article>
                  ))}
                </section>

                {/* Resumo do pedido */}
                <section
                  aria-labelledby="checkout-summary-title"
                  className="flex flex-col gap-5 rounded-[20px] border border-kurio-border bg-kurio-card p-6"
                >
                  <h2
                    id="checkout-summary-title"
                    className="text-[19px] font-bold"
                  >
                    Resumo do pedido
                  </h2>

                  <div className="flex justify-between gap-4 text-[13px] text-kurio-secondary">
                    <span>Quantidade de NFTs</span>
                    <span>{cartCount}</span>
                  </div>

                  <div className="flex justify-between gap-4 text-[13px] text-kurio-secondary">
                    <span>Subtotal</span>
                    <span>{totalEth.toFixed(2)} ETH</span>
                  </div>

                  <div className="border-t border-kurio-border pt-5">
                    <div className="flex items-center justify-between gap-4">
                      <strong className="text-[15px]">
                        Total
                      </strong>

                      <strong className="text-[22px] text-kurio-accent">
                        {totalEth.toFixed(2)} ETH
                      </strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleCheckout}
                    disabled={cartCount === 0}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-kurio-primary text-[14px] font-bold text-kurio-bg transition-colors hover:bg-kurio-accent disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <CheckCircle2
                      aria-hidden="true"
                      className="h-5 w-5"
                    />
                    Confirmar pedido
                  </button>

                  <p className="text-center text-[11px] leading-5 text-kurio-secondary">
                    Checkout demonstrativo.
                    Não há cobrança, transferência de ETH
                    ou emissão real de NFTs.
                  </p>
                </section>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
