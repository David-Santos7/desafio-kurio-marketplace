import { useEffect, useRef, useState } from "react";
import axios from "axios";

import {
  createFileRoute,
  Link,
} from "@tanstack/react-router";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import {
  ArrowLeft,
  CheckCircle2,
  CircleAlert,
  LoaderCircle,
  ShoppingCart,
  Trash2,
  Wallet,
  TicketPercent,
} from "lucide-react";

import { Header } from "@/components/layout/Header";
import { useCart } from "@/context/CartContext";
import { nfts } from "@/data/nfts";

import {
  authService,
  getAccessToken,
} from "@/services/authService";

import { walletService } from "@/services/walletService";

import {
  orderService,
  generateOrderIdempotencyKey,
  type CheckoutQuote,
  type CreateQuotePayload,
  type CreateOrderPayload,
  type Order,
} from "@/services/orderService";

// ==========================================
// KURIO — CHECKOUT COM COTAÇÃO
// ==========================================

export const Route = createFileRoute("/checkout")({
  component: CheckoutPage,
});

type QuoteSnapshot = {
  signature: string;
  quote: CheckoutQuote;
};

type OrderAttempt = {
  signature: string;
  idempotencyKey: string;
};

type ConfirmOrderInput = {
  payload: CreateOrderPayload;
  idempotencyKey: string;
};

const ATTEMPT_STORAGE_KEY = "kurio:checkout-attempt";

// Consultar o relógio somente em callbacks ou efeitos,
// nunca durante a renderização do React.
function isQuoteExpired(expiresAt: string): boolean {
  const deadline = new Date(expiresAt).getTime();
  return !Number.isFinite(deadline) || Date.now() >= deadline;
}


// ==========================================
// TRATAMENTO DE ERROS
// ==========================================

function getApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data: unknown = error.response?.data;

    if (
      typeof data === "object" &&
      data !== null &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }

    if (!error.response) {
      return (
        "Falha de comunicação com a API. " +
        "Seu carrinho foi preservado."
      );
    }

    return `Erro HTTP ${error.response.status}.`;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "Não foi possível concluir a operação.";
}

// ==========================================
// PERSISTÊNCIA DA CHAVE DE IDEMPOTÊNCIA
// ==========================================

function loadOrderAttempt(): OrderAttempt | null {
  try {
    const saved = sessionStorage.getItem(
      ATTEMPT_STORAGE_KEY
    );

    if (!saved) return null;

    const parsed: unknown = JSON.parse(saved);

    if (
      typeof parsed !== "object" ||
      parsed === null
    ) {
      return null;
    }

    const attempt = parsed as Partial<OrderAttempt>;

    if (
      typeof attempt.signature !== "string" ||
      typeof attempt.idempotencyKey !== "string" ||
      !attempt.idempotencyKey
    ) {
      return null;
    }

    return {
      signature: attempt.signature,
      idempotencyKey: attempt.idempotencyKey,
    };
  } catch {
    return null;
  }
}

function saveOrderAttempt(
  attempt: OrderAttempt
): void {
  try {
    sessionStorage.setItem(
      ATTEMPT_STORAGE_KEY,
      JSON.stringify(attempt)
    );
  } catch {
    // A tentativa permanece em memória.
  }
}

function clearOrderAttempt(): void {
  try {
    sessionStorage.removeItem(
      ATTEMPT_STORAGE_KEY
    );
  } catch {
    // A confirmação já foi recebida.
  }
}

// ==========================================
// PÁGINA
// ==========================================

// eslint-disable-next-line react-refresh/only-export-components
function CheckoutPage() {
  const queryClient = useQueryClient();

  const {
    cartIds,
    cartCount,
    totalEth,
    removeFromCart,
  } = useCart();

  const token = getAccessToken();

  const [selectedWalletId, setSelectedWalletId] =
    useState("");

  const [couponInput, setCouponInput] =
    useState("");

  const [quoteSnapshot, setQuoteSnapshot] =
    useState<QuoteSnapshot | null>(null);

  // O prazo é controlado por um temporizador, sem
  // consultar Date.now() durante a renderização.
  const [expiredQuoteId, setExpiredQuoteId] =
    useState<string | null>(null);

  const [completedOrder, setCompletedOrder] =
    useState<Order | null>(null);

  const [errorMessage, setErrorMessage] =
    useState("");

  const submittingRef = useRef(false);

  const attemptRef = useRef<OrderAttempt | null>(
    null
  );

  // ========================================
  // AUTENTICAÇÃO
  // ========================================

  const sessionQuery = useQuery({
    queryKey: ["auth", "session"],
    queryFn: authService.getSession,
    enabled: Boolean(token),
    retry: false,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const session = sessionQuery.data;
  const userId = session?.user.id;

  // ========================================
  // CARTEIRAS
  // ========================================

  const walletQuery = useQuery({
    queryKey: ["wallets", userId],
    queryFn: walletService.getWallets,
    enabled: Boolean(userId),
    retry: false,
  });

  const wallets = walletQuery.data ?? [];

  const selectedWallet =
    wallets.find(
      (wallet) => wallet.id === selectedWalletId
    ) ??
    wallets.find((wallet) => wallet.isPrimary) ??
    wallets[0];

  const walletConnected =
    selectedWallet?.connectionStatus === "connected";

  // ========================================
  // PRODUTOS E CUPOM
  // ========================================

  const cartItems = nfts.filter((nft) =>
    cartIds.includes(nft.id)
  );

  const normalizedCoupon =
    couponInput.trim().toUpperCase() || null;

  // A assinatura identifica os dados atuais
  // da compra. Se algo mudar, a cotação
  // anterior não poderá ser reutilizada.
  const checkoutSignature = JSON.stringify({
    userId: userId ?? null,
    walletId: selectedWallet?.id ?? null,
    network: selectedWallet?.network ?? null,
    couponCode: normalizedCoupon,
    items: cartItems
      .map((nft) => ({
        nftId: nft.id,
        quantity: 1,
      }))
      .sort((a, b) =>
        a.nftId.localeCompare(b.nftId)
      ),
  });

  const matchingQuote =
    quoteSnapshot?.signature === checkoutSignature
      ? quoteSnapshot.quote
      : null;

  // Expira automaticamente a cotação, inclusive se o
  // usuário permanecer na tela sem interagir.
  useEffect(() => {
    if (!quoteSnapshot) return;

    const deadline = new Date(
      quoteSnapshot.quote.expiresAt
    ).getTime();

    const remainingMs = Number.isFinite(deadline)
      ? Math.max(0, deadline - Date.now())
      : 0;

    const timeoutId = window.setTimeout(() => {
      setExpiredQuoteId(quoteSnapshot.quote.id);
    }, remainingMs);

    return () => window.clearTimeout(timeoutId);
  }, [quoteSnapshot]);

  const quoteExpired =
    matchingQuote !== null &&
    expiredQuoteId === matchingQuote.id;

  const activeQuote =
    matchingQuote && !quoteExpired
      ? matchingQuote
      : null;

  // ========================================
  // CONECTAR CARTEIRA
  // ========================================

  const connectMutation = useMutation({
    mutationFn: (walletId: string) =>
      walletService.connectWallet(walletId),

    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: ["wallets", userId],
      });

      setErrorMessage("");
    },

    onError: (error: unknown) => {
      setErrorMessage(getApiError(error));
    },
  });

  // ========================================
  // SOLICITAR COTAÇÃO
  // ========================================

  const quoteMutation = useMutation({
    mutationFn: (
      payload: CreateQuotePayload
    ) => orderService.createQuote(payload),

    retry: false,
  });

  // ========================================
  // CONFIRMAR PEDIDO
  // ========================================

  const orderMutation = useMutation({
    mutationFn: ({
      payload,
      idempotencyKey,
    }: ConfirmOrderInput) =>
      orderService.createOrder(
        payload,
        idempotencyKey
      ),

    retry: false,
  });

  const isSubmitting = orderMutation.isPending;

  const isBusy =
    isSubmitting ||
    quoteMutation.isPending ||
    connectMutation.isPending;

  // ========================================
  // REMOVER PRODUTO
  // ========================================

  function handleRemove(nftId: string): void {
    if (isBusy || submittingRef.current) {
      return;
    }

    removeFromCart(nftId);
    setQuoteSnapshot(null);
    setErrorMessage("");
  }

  // ========================================
  // CRIAR COTAÇÃO
  // ========================================

  async function handleCreateQuote(): Promise<void> {
    if (
      isBusy ||
      submittingRef.current ||
      !session ||
      !selectedWallet ||
      !walletConnected ||
      cartItems.length === 0
    ) {
      return;
    }

    setErrorMessage("");
    setQuoteSnapshot(null);

    const payload: CreateQuotePayload = {
      items: cartItems.map((nft) => ({
        nftId: nft.id,
        quantity: 1,
      })),
      walletId: selectedWallet.id,
      network: selectedWallet.network,
      couponCode: normalizedCoupon,
    };

    // Assinatura no momento da solicitação.
    const requestedSignature =
      checkoutSignature;

    try {
      const quote =
        await quoteMutation.mutateAsync(payload);

      if (
        !quote.id ||
        !quote.totalEth ||
        !quote.expiresAt
      ) {
        throw new Error(
          "A API retornou uma cotação inválida."
        );
      }

      setQuoteSnapshot({
        signature: requestedSignature,
        quote,
      });
    } catch (error: unknown) {
      setErrorMessage(getApiError(error));
    }
  }

  // ========================================
  // FINALIZAR COMPRA
  // ========================================

  async function handleCheckout(): Promise<void> {
    if (
      submittingRef.current ||
      isBusy ||
      completedOrder !== null ||
      !session ||
      !selectedWallet ||
      !walletConnected ||
      !activeQuote ||
      cartItems.length === 0
    ) {
      return;
    }

    // Proteção adicional no clique: mesmo que o timer
    // ainda não tenha atualizado a interface, não envia
    // um pedido utilizando uma cotação expirada.
    if (isQuoteExpired(activeQuote.expiresAt)) {
      setQuoteSnapshot(null);
      setErrorMessage(
        "A cotação expirou. Solicite uma nova."
      );
      return;
    }

    submittingRef.current = true;
    setErrorMessage("");

    const payload: CreateOrderPayload = {
      items: cartItems.map((nft) => ({
        nftId: nft.id,
        quantity: 1,
      })),
      walletId: selectedWallet.id,
      network: selectedWallet.network,
      couponCode: normalizedCoupon,
      quoteId: activeQuote.id,
    };

    // Mesma tentativa lógica mantém a chave,
    // mesmo após repetir uma requisição.
    const previous =
      attemptRef.current ?? loadOrderAttempt();

    const attempt: OrderAttempt =
      previous?.signature === checkoutSignature
        ? previous
        : {
            signature: checkoutSignature,
            idempotencyKey:
              generateOrderIdempotencyKey(),
          };

    attemptRef.current = attempt;
    saveOrderAttempt(attempt);

    try {
      // Confere se a carteira ainda está conectada.
      const currentWallets =
        await walletService.getWallets();

      const currentWallet = currentWallets.find(
        (wallet) =>
          wallet.id === selectedWallet.id
      );

      if (
        !currentWallet ||
        currentWallet.connectionStatus !== "connected"
      ) {
        throw new Error(
          "A carteira não está mais conectada."
        );
      }

      const order =
        await orderMutation.mutateAsync({
          payload,
          idempotencyKey:
            attempt.idempotencyKey,
        });

      if (
        order.status !== "confirmed" ||
        !order.id ||
        !order.transactionReference
      ) {
        throw new Error(
          "A API não confirmou o pedido."
        );
      }

      // A confirmação é exibida apenas
      // depois da resposta da API.
      setCompletedOrder(order);

      // Remove somente os NFTs confirmados.
      payload.items.forEach((item) => {
        removeFromCart(item.nftId);
      });

      attemptRef.current = null;
      clearOrderAttempt();
    } catch (error: unknown) {
      setErrorMessage(getApiError(error));
    } finally {
      submittingRef.current = false;
    }
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <div className="min-h-screen bg-kurio-bg text-kurio-text">
      <div className="hidden pt-6 lg:block">
        <Header />
      </div>

      <main className="mx-auto w-full max-w-[1100px] px-6 pb-20 pt-10">

        <Link
          to="/"
          search={{ tab: "cart" }}
          className="mb-8 inline-flex items-center gap-2 text-[13px] text-kurio-secondary hover:text-kurio-accent"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar ao carrinho
        </Link>

        {/* ================================= */}
        {/* PEDIDO CONFIRMADO */}
        {/* ================================= */}

        {completedOrder ? (
          <section
            role="status"
            className="mx-auto max-w-[580px] rounded-[20px] border border-kurio-border bg-kurio-card p-7 text-center"
          >
            <CheckCircle2 className="mx-auto h-16 w-16 text-kurio-accent" />

            <h1 className="mt-6 text-[27px] font-bold">
              Pedido confirmado!
            </h1>

            <p className="mt-4 text-[13px] leading-6 text-kurio-secondary">
              A API simulada confirmou seu pedido.
              Nenhum pagamento real foi realizado.
            </p>

            <div className="mt-7 space-y-5 rounded-[14px] bg-kurio-bg p-5 text-left">
              <div>
                <p className="text-[12px] text-kurio-secondary">
                  Identificador do pedido
                </p>

                <p className="mt-2 break-all text-[12px] font-bold">
                  {completedOrder.id}
                </p>
              </div>

              <div>
                <p className="text-[12px] text-kurio-secondary">
                  Referência demonstrativa
                </p>

                <p className="mt-2 break-all text-[12px] font-bold">
                  {completedOrder.transactionReference}
                </p>
              </div>

              <div>
                <p className="text-[12px] text-kurio-secondary">
                  NFTs confirmados
                </p>

                <p className="mt-1 text-[14px] font-bold">
                  {completedOrder.items.reduce(
                    (count, item) =>
                      count + item.quantity,
                    0
                  )}
                </p>
              </div>

              <div>
                <p className="text-[12px] text-kurio-secondary">
                  Subtotal
                </p>

                <p className="mt-1 text-[14px]">
                  {completedOrder.subtotalEth} ETH
                </p>
              </div>

              <div>
                <p className="text-[12px] text-kurio-secondary">
                  Desconto
                </p>

                <p className="mt-1 text-[14px]">
                  -{completedOrder.discountEth} ETH
                </p>
              </div>

              <div>
                <p className="text-[12px] text-kurio-secondary">
                  Taxa de rede simulada
                </p>

                <p className="mt-1 text-[14px]">
                  {completedOrder.networkFeeEth} ETH
                </p>
              </div>

              <div className="border-t border-kurio-border pt-4">
                <p className="text-[12px] text-kurio-secondary">
                  Total confirmado pela API
                </p>

                <p className="mt-2 text-[26px] font-bold text-kurio-accent">
                  {completedOrder.totalEth} ETH
                </p>
              </div>
            </div>

            <Link
              to="/"
              search={{ tab: "all" }}
              className="mt-7 flex h-[50px] items-center justify-center rounded-[12px] bg-kurio-primary text-[13px] font-bold text-kurio-bg"
            >
              Voltar ao marketplace
            </Link>
          </section>
        ) : (
          <div className="space-y-8">

            <header>
              <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-kurio-accent">
                KURIO MARKETPLACE
              </p>

              <h1 className="mt-3 text-[30px] font-bold">
                Checkout
              </h1>

              <p className="mt-3 text-[13px] text-kurio-secondary">
                Revise seus NFTs, selecione uma carteira
                e solicite a cotação antes de comprar.
              </p>
            </header>

            {/* ================================= */}
            {/* AUTENTICAÇÃO */}
            {/* ================================= */}

            {!token || sessionQuery.isError ? (
              <section className="rounded-[18px] border border-kurio-border bg-kurio-card p-7 text-center">
                <CircleAlert className="mx-auto h-12 w-12 text-kurio-accent" />

                <h2 className="mt-5 text-[19px] font-bold">
                  Faça login para continuar
                </h2>

                <p className="mt-3 text-[12px] leading-6 text-kurio-secondary">
                  Seu carrinho será preservado
                  durante a autenticação.
                </p>

                <Link
                  to="/login"
                  className="mt-6 inline-flex rounded-[12px] bg-kurio-primary px-7 py-3 text-[13px] font-bold text-kurio-bg"
                >
                  Entrar na minha conta
                </Link>
              </section>
            ) : sessionQuery.isPending ? (
              <p role="status" className="text-[13px]">
                Recuperando sessão...
              </p>
            ) : cartCount === 0 ? (
              <section className="rounded-[18px] bg-kurio-card p-8 text-center">
                <ShoppingCart className="mx-auto h-12 w-12 text-kurio-accent" />

                <h2 className="mt-5 text-[19px] font-bold">
                  Seu carrinho está vazio
                </h2>

                <Link
                  to="/"
                  search={{ tab: "all" }}
                  className="mt-6 inline-flex rounded-[12px] bg-kurio-primary px-6 py-3 text-[13px] font-bold text-kurio-bg"
                >
                  Explorar NFTs
                </Link>
              </section>
            ) : (
              <div className="grid gap-8 lg:grid-cols-[1fr_360px]">

                <div className="space-y-6">

                  {/* COLECIONADOR */}

                  <section className="rounded-[18px] border border-kurio-border bg-kurio-card p-6">
                    <h2 className="text-[18px] font-bold">
                      Colecionador
                    </h2>

                    <p className="mt-4 text-[13px] font-bold">
                      {session?.user.name}
                    </p>

                    <p className="mt-2 break-all text-[12px] text-kurio-secondary">
                      {session?.user.email}
                    </p>
                  </section>

                  {/* ================================= */}
                  {/* CARTEIRA */}
                  {/* ================================= */}

                  <section className="rounded-[18px] border border-kurio-border bg-kurio-card p-6">
                    <div className="flex items-center gap-3">
                      <Wallet className="h-6 w-6 text-kurio-accent" />

                      <h2 className="text-[18px] font-bold">
                        Carteira de pagamento
                      </h2>
                    </div>

                    {walletQuery.isPending && (
                      <p role="status" className="mt-5 text-[12px]">
                        Carregando carteiras...
                      </p>
                    )}

                    {walletQuery.isError && (
                      <p role="alert" className="mt-5 text-[12px] text-kurio-accent">
                        {getApiError(walletQuery.error)}
                      </p>
                    )}

                    {walletQuery.isSuccess &&
                      wallets.length === 0 && (
                        <div className="mt-5">
                          <p className="text-[12px] leading-6 text-kurio-secondary">
                            Nenhuma carteira cadastrada.
                          </p>

                          <Link
                            to="/profile"
                            className="mt-4 inline-flex rounded-[10px] bg-kurio-primary px-5 py-3 text-[12px] font-bold text-kurio-bg"
                          >
                            Cadastrar carteira
                          </Link>
                        </div>
                      )}

                    {wallets.length > 0 && (
                      <div className="mt-5 space-y-4">
                        <div>
                          <label
                            htmlFor="checkout-wallet"
                            className="mb-2 block text-[12px] font-bold"
                          >
                            Selecione a carteira
                          </label>

                          <select
                            id="checkout-wallet"
                            value={selectedWallet?.id ?? ""}
                            disabled={isBusy}
                            onChange={(event) => {
                              setSelectedWalletId(
                                event.target.value
                              );
                              setQuoteSnapshot(null);
                              setErrorMessage("");
                            }}
                            className="h-[50px] w-full rounded-[10px] border border-kurio-border bg-kurio-bg px-3 text-[12px]"
                          >
                            {wallets.map((wallet) => (
                              <option
                                key={wallet.id}
                                value={wallet.id}
                              >
                                {wallet.label}
                                {wallet.isPrimary
                                  ? " (Principal)"
                                  : ""}
                                {" — "}
                                {wallet.network}
                              </option>
                            ))}
                          </select>
                        </div>

                        {selectedWallet && (
                          <div className="rounded-[12px] bg-kurio-bg p-4">
                            <p className="text-[12px] font-bold">
                              Rede: {selectedWallet.network}
                            </p>

                            <p className="mt-2 break-all font-mono text-[11px] text-kurio-secondary">
                              {selectedWallet.address}
                            </p>

                            <p className="mt-3 text-[12px]">
                              Status:{" "}
                              {walletConnected
                                ? "Conectada (simulação)"
                                : "Desconectada"}
                            </p>

                            {!walletConnected && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() =>
                                  connectMutation.mutate(
                                    selectedWallet.id
                                  )
                                }
                                className="mt-4 rounded-[10px] bg-kurio-primary px-5 py-3 text-[12px] font-bold text-kurio-bg disabled:opacity-50"
                              >
                                {connectMutation.isPending
                                  ? "Conectando..."
                                  : "Conectar carteira"}
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </section>

                  {/* ================================= */}
                  {/* PRODUTOS */}
                  {/* ================================= */}

                  <section className="space-y-4">
                    <h2 className="text-[18px] font-bold">
                      NFTs selecionados ({cartCount})
                    </h2>

                    {cartItems.map((nft) => (
                      <article
                        key={nft.id}
                        className="flex items-center gap-4 rounded-[16px] border border-kurio-border bg-kurio-card p-3"
                      >
                        <img
                          src={nft.image}
                          alt={`NFT ${nft.name}`}
                          className="h-[90px] w-[90px] rounded-[12px] object-cover"
                        />

                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold">
                            {nft.name}
                          </p>

                          <p className="mt-2 text-[13px] font-bold text-kurio-accent">
                            {nft.priceEth} ETH
                          </p>

                          <button
                            type="button"
                            disabled={isBusy}
                            onClick={() =>
                              handleRemove(nft.id)
                            }
                            className="mt-3 inline-flex items-center gap-2 text-[12px] text-kurio-secondary disabled:opacity-50"
                          >
                            <Trash2 className="h-4 w-4" />
                            Remover
                          </button>
                        </div>
                      </article>
                    ))}
                  </section>
                </div>

                {/* ================================= */}
                {/* RESUMO, CUPOM E COTAÇÃO */}
                {/* ================================= */}

                <section className="h-fit space-y-5 rounded-[18px] border border-kurio-border bg-kurio-card p-6">

                  <h2 className="text-[19px] font-bold">
                    Resumo do pedido
                  </h2>

                  <div className="flex justify-between gap-3 text-[12px] text-kurio-secondary">
                    <span>Quantidade de NFTs</span>
                    <span>{cartCount}</span>
                  </div>

                  {/* CUPOM */}

                  <div>
                    <label
                      htmlFor="checkout-coupon"
                      className="mb-2 flex items-center gap-2 text-[12px] font-bold"
                    >
                      <TicketPercent className="h-4 w-4" />
                      Cupom de desconto
                    </label>

                    <input
                      id="checkout-coupon"
                      type="text"
                      value={couponInput}
                      disabled={isBusy}
                      onChange={(event) => {
                        setCouponInput(event.target.value);
                        setQuoteSnapshot(null);
                        setErrorMessage("");
                      }}
                      placeholder="Ex.: KURIO10"
                      autoComplete="off"
                      className="h-[48px] w-full rounded-[10px] border border-kurio-border bg-kurio-bg px-3 text-[12px] uppercase outline-none"
                    />

                    <p className="mt-2 text-[11px] text-kurio-secondary">
                      Cupom demonstrativo: KURIO10
                    </p>
                  </div>

                  {/* SOLICITAR COTAÇÃO */}

                  <button
                    type="button"
                    disabled={
                      isBusy ||
                      !session ||
                      !walletConnected ||
                      cartItems.length === 0
                    }
                    onClick={() => {
                      void handleCreateQuote();
                    }}
                    className="flex h-[48px] w-full items-center justify-center gap-2 rounded-[10px] border border-kurio-border bg-kurio-bg text-[13px] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {quoteMutation.isPending ? (
                      <>
                        <LoaderCircle className="h-4 w-4 animate-spin" />
                        Calculando...
                      </>
                    ) : activeQuote ? (
                      "Atualizar cotação"
                    ) : (
                      "Solicitar cotação"
                    )}
                  </button>

                  {/* ERROS */}

                  {errorMessage && (
                    <div
                      role="alert"
                      className="rounded-[10px] border border-kurio-border bg-kurio-bg p-4 text-[12px] leading-6 text-kurio-accent"
                    >
                      {errorMessage}
                    </div>
                  )}

                  {/* COTAÇÃO EXPIRADA */}

                  {quoteExpired && (
                    <p
                      role="alert"
                      className="text-[12px] text-kurio-accent"
                    >
                      A cotação expirou. Solicite
                      uma nova para continuar.
                    </p>
                  )}

                  {/* VALORES DA API */}

                  {activeQuote ? (
                    <div
                      role="status"
                      className="space-y-4 rounded-[12px] bg-kurio-bg p-4"
                    >
                      <p className="text-[12px] font-bold text-kurio-accent">
                        Cotação recebida da API
                      </p>

                      <div className="flex justify-between gap-3 text-[12px]">
                        <span>Subtotal</span>
                        <span>
                          {activeQuote.subtotalEth} ETH
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-[12px]">
                        <span>Desconto</span>
                        <span>
                          -{activeQuote.discountEth} ETH
                        </span>
                      </div>

                      <div className="flex justify-between gap-3 text-[12px]">
                        <span>Taxa da rede</span>
                        <span>
                          {activeQuote.networkFeeEth} ETH
                        </span>
                      </div>

                      <div className="border-t border-kurio-border pt-4">
                        <p className="text-[12px] text-kurio-secondary">
                          Total da cotação
                        </p>

                        <p className="mt-2 text-[25px] font-bold text-kurio-accent">
                          {activeQuote.totalEth} ETH
                        </p>
                      </div>

                      <p className="text-[11px] leading-5 text-kurio-secondary">
                        Válida até{" "}
                        {new Date(
                          activeQuote.expiresAt
                        ).toLocaleTimeString("pt-BR")}
                      </p>
                    </div>
                  ) : (
                    <div className="border-t border-kurio-border pt-4">
                      <p className="text-[12px] text-kurio-secondary">
                        Subtotal estimado
                      </p>

                      <p className="mt-2 text-[22px] font-bold">
                        {totalEth.toFixed(2)} ETH
                      </p>

                      <p className="mt-2 text-[11px] leading-5 text-kurio-secondary">
                        Taxas e descontos serão
                        calculados após solicitar
                        a cotação.
                      </p>
                    </div>
                  )}

                  {/* CONFIRMAR */}

                  <button
                    type="button"
                    disabled={
                      isBusy ||
                      !session ||
                      !walletConnected ||
                      !activeQuote
                    }
                    onClick={() => {
                      void handleCheckout();
                    }}
                    className="flex h-[52px] w-full items-center justify-center gap-2 rounded-[12px] bg-kurio-primary text-[13px] font-bold text-kurio-bg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <LoaderCircle className="h-5 w-5 animate-spin" />
                        Confirmando pedido...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="h-5 w-5" />
                        Confirmar pedido
                      </>
                    )}
                  </button>

                  <p className="text-center text-[11px] leading-5 text-kurio-secondary">
                    Compra demonstrativa com API simulada.
                    Nenhuma transação blockchain real
                    será realizada.
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
