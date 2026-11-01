
import { http, HttpResponse } from "msw";
import { publishOrderUpdated } from "./socketHandlers";

import { nfts } from "@/data/nfts";
import { getAuthenticatedMockUserId } from "./authHandlers";
import { getCheckoutWallet } from "./walletHandlers";

import type {
  WalletNetwork,
} from "@/services/walletService";

// ==========================================
// KURIO — API SIMULADA
// CATÁLOGO, COTAÇÕES E PEDIDOS
// ==========================================

type OrderItemInput = {
  nftId: string;
  quantity: number;
};

type OrderItem = {
  nftId: string;
  name: string;
  quantity: number;
  unitPriceEth: string;
};

type CheckoutInput = {
  items: OrderItemInput[];
  walletId: string;
  network: WalletNetwork;
  couponCode: string | null;
};

type Quote = {
  id: string;
  walletId: string;
  network: WalletNetwork;
  items: OrderItem[];
  subtotalEth: string;
  networkFeeEth: string;
  discountEth: string;
  totalEth: string;
  couponCode: string | null;
  expiresAt: string;
};

type StoredQuote = Quote & {
  userId: string;
  signature: string;
};

type Order = {
  id: string;
  status: "confirmed";
  transactionReference: string;
  walletId: string;
  network: WalletNetwork;
  quoteId: string | null;
  couponCode: string | null;
  items: OrderItem[];
  subtotalEth: string;
  networkFeeEth: string;
  discountEth: string;
  totalEth: string;
  createdAt: string;
};

type StoredOrder = {
  userId: string;
  idempotencyKey: string;
  signature: string;
  order: Order;
};

type ParseResult =
  | {
      ok: true;
      value: CheckoutInput;
    }
  | {
      ok: false;
      response: Response;
    };

// ==========================================
// ARMAZENAMENTO DEMONSTRATIVO
// ==========================================

const ORDERS_KEY = "kurio:mock-orders-v2";
const QUOTES_KEY = "kurio:mock-quotes";

const QUOTE_DURATION_MS = 5 * 60 * 1000;

let memoryOrders: StoredOrder[] = [];
let memoryQuotes: StoredQuote[] = [];

function readStoredList<T>(
  key: string,
  fallback: T[]
): T[] {
  try {
    const stored = localStorage.getItem(key);

    if (stored === null) {
      return fallback;
    }

    const parsed: unknown = JSON.parse(stored);

    if (Array.isArray(parsed)) {
      return parsed as T[];
    }
  } catch {
    // Usa a memória como fallback.
  }

  return fallback;
}

function saveStoredList<T>(
  key: string,
  data: T[]
): void {
  try {
    localStorage.setItem(
      key,
      JSON.stringify(data)
    );
  } catch {
    // A persistência será somente em memória.
  }
}

function readOrders(): StoredOrder[] {
  return readStoredList(
    ORDERS_KEY,
    memoryOrders
  );
}

function saveOrders(
  orders: StoredOrder[]
): void {
  memoryOrders = orders;
  saveStoredList(ORDERS_KEY, orders);
}

function readQuotes(): StoredQuote[] {
  return readStoredList(
    QUOTES_KEY,
    memoryQuotes
  );
}

function saveQuotes(
  quotes: StoredQuote[]
): void {
  memoryQuotes = quotes;
  saveStoredList(QUOTES_KEY, quotes);
}

// ==========================================
// VALIDAÇÃO
// ==========================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function isNetwork(
  value: unknown
): value is WalletNetwork {
  return (
    value === "ethereum" ||
    value === "polygon" ||
    value === "base"
  );
}

function isOrderItems(
  value: unknown
): value is OrderItemInput[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.every(
      (item: unknown) =>
        isRecord(item) &&
        typeof item.nftId === "string" &&
        item.nftId.length > 0 &&
        typeof item.quantity === "number" &&
        Number.isInteger(item.quantity) &&
        item.quantity >= 1 &&
        item.quantity <= 10
    )
  );
}

function apiError(
  status: number,
  message: string
): Response {
  return HttpResponse.json(
    { message },
    { status }
  );
}

function parseCheckout(
  body: unknown
): ParseResult {
  if (!isRecord(body)) {
    return {
      ok: false,
      response: apiError(
        400,
        "Dados do checkout inválidos."
      ),
    };
  }

  if (!isOrderItems(body.items)) {
    return {
      ok: false,
      response: apiError(
        400,
        "Itens ou quantidades inválidos."
      ),
    };
  }

  const uniqueIds = new Set(
    body.items.map((item) => item.nftId)
  );

  if (uniqueIds.size !== body.items.length) {
    return {
      ok: false,
      response: apiError(
        400,
        "Existem NFTs duplicados no pedido."
      ),
    };
  }

  const allItemsExist = body.items.every(
    (item) =>
      nfts.some(
        (nft) => nft.id === item.nftId
      )
  );

  if (!allItemsExist) {
    return {
      ok: false,
      response: apiError(
        404,
        "Um ou mais NFTs não foram encontrados."
      ),
    };
  }

  if (
    typeof body.walletId !== "string" ||
    !body.walletId.trim()
  ) {
    return {
      ok: false,
      response: apiError(
        400,
        "Selecione uma carteira válida."
      ),
    };
  }

  if (!isNetwork(body.network)) {
    return {
      ok: false,
      response: apiError(
        400,
        "Rede de pagamento inválida."
      ),
    };
  }

  if (
    body.couponCode !== undefined &&
    body.couponCode !== null &&
    typeof body.couponCode !== "string"
  ) {
    return {
      ok: false,
      response: apiError(
        400,
        "Cupom inválido."
      ),
    };
  }

  const couponCode =
    typeof body.couponCode === "string"
      ? body.couponCode.trim().toUpperCase()
      : "";

  if (
    couponCode &&
    couponCode !== "KURIO10"
  ) {
    return {
      ok: false,
      response: apiError(
        400,
        "Cupom não encontrado ou inválido."
      ),
    };
  }

  return {
    ok: true,
    value: {
      items: body.items,
      walletId: body.walletId,
      network: body.network,
      couponCode: couponCode || null,
    },
  };
}

// ==========================================
// VALIDAR CARTEIRA AUTENTICADA
// ==========================================

function validateWallet(
  userId: string,
  input: CheckoutInput
): Response | null {
  const wallet = getCheckoutWallet(
    userId,
    input.walletId
  );

  if (!wallet) {
    return apiError(
      404,
      "Carteira não encontrada para este usuário."
    );
  }

  if (wallet.network !== input.network) {
    return apiError(
      400,
      "A rede selecionada não corresponde à carteira."
    );
  }

  if (
    wallet.connectionStatus !== "connected"
  ) {
    return apiError(
      409,
      "Conecte a carteira antes de concluir a compra."
    );
  }

  return null;
}

// ==========================================
// VALORES MONETÁRIOS EM WEI
// ==========================================

// Evita erros de arredondamento com
// operações de ponto flutuante.

const WEI_PER_ETH = 10n ** 18n;

function ethToWei(
  value: string
): bigint {
  const [integer, decimal = ""] =
    value.split(".");

  if (
    !/^\d+$/.test(integer) ||
    !/^\d{0,18}$/.test(decimal)
  ) {
    throw new Error("Valor ETH inválido.");
  }

  return (
    BigInt(integer) * WEI_PER_ETH +
    BigInt(decimal.padEnd(18, "0"))
  );
}

function weiToEth(
  value: bigint
): string {
  const integer = value / WEI_PER_ETH;

  const decimal = (
    value % WEI_PER_ETH
  )
    .toString()
    .padStart(18, "0")
    .replace(/0+$/, "");

  return decimal
    ? `${integer}.${decimal}`
    : `${integer}.00`;
}

// ==========================================
// TAXAS SIMULADAS POR REDE
// ==========================================

const NETWORK_FEES: Record<
  WalletNetwork,
  string
> = {
  ethereum: "0.02",
  polygon: "0.005",
  base: "0.003",
};

// ==========================================
// ASSINATURA LÓGICA DA COMPRA
// ==========================================

function getOrderSignature(
  userId: string,
  input: CheckoutInput
): string {
  return JSON.stringify({
    userId,
    walletId: input.walletId,
    network: input.network,
    couponCode: input.couponCode,
    items: [...input.items].sort(
      (a, b) =>
        a.nftId.localeCompare(b.nftId)
    ),
  });
}

// ==========================================
// GERAR COTAÇÃO AUTORITATIVA
// ==========================================

function calculateQuote(
  input: CheckoutInput
): Quote {
  let subtotalWei = 0n;

  const items: OrderItem[] =
    input.items.map((item) => {
      const nft = nfts.find(
        (entry) => entry.id === item.nftId
      );

      if (!nft) {
        throw new Error(
          "NFT não encontrado."
        );
      }

      subtotalWei +=
        ethToWei(nft.priceEth) *
        BigInt(item.quantity);

      return {
        nftId: nft.id,
        name: nft.name,
        quantity: item.quantity,
        unitPriceEth: nft.priceEth,
      };
    });

  // Cupom demonstrativo: 10% sobre
  // o subtotal, sem incluir a taxa da rede.
  const discountWei =
    input.couponCode === "KURIO10"
      ? subtotalWei / 10n
      : 0n;

  const networkFeeWei = ethToWei(
    NETWORK_FEES[input.network]
  );

  const totalWei =
    subtotalWei -
    discountWei +
    networkFeeWei;

  return {
    id: crypto.randomUUID(),
    walletId: input.walletId,
    network: input.network,
    items,
    subtotalEth: weiToEth(subtotalWei),
    discountEth: weiToEth(discountWei),
    networkFeeEth: weiToEth(networkFeeWei),
    totalEth: weiToEth(totalWei),
    couponCode: input.couponCode,
    expiresAt: new Date(
      Date.now() + QUOTE_DURATION_MS
    ).toISOString(),
  };
}

// ==========================================
// HANDLERS
// ==========================================

export const handlers = [

  // ========================================
  // CATÁLOGO
  // ========================================

  http.get("/api/nfts", () => {
    return HttpResponse.json(
      nfts,
      { status: 200 }
    );
  }),

  http.get(
    "/api/nfts/:nftId",
    ({ params }) => {
      const nftId = String(
        params.nftId ?? ""
      );

      const nft = nfts.find(
        (item) => item.id === nftId
      );

      if (!nft) {
        return apiError(
          404,
          "NFT não encontrado."
        );
      }

      return HttpResponse.json(
        nft,
        { status: 200 }
      );
    }
  ),

  // ========================================
  // COTAÇÃO
  // POST /api/checkout/quote
  // ========================================

  http.post(
    "/api/checkout/quote",
    async ({ request }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return apiError(
          401,
          "Faça login para solicitar a cotação."
        );
      }

      const body: unknown = await request
        .json()
        .catch(() => null);

      const parsed = parseCheckout(body);

      if (!parsed.ok) {
        return parsed.response;
      }

      const input = parsed.value;

      const walletError = validateWallet(
        userId,
        input
      );

      if (walletError) {
        return walletError;
      }

      const quote = calculateQuote(input);

      const signature = getOrderSignature(
        userId,
        input
      );

      const storedQuote: StoredQuote = {
        ...quote,
        userId,
        signature,
      };

      const activeQuotes = readQuotes()
        .filter(
          (item) =>
            new Date(
              item.expiresAt
            ).getTime() > Date.now()
        );

      saveQuotes([
        ...activeQuotes,
        storedQuote,
      ]);

      return HttpResponse.json(
        quote,
        { status: 200 }
      );
    }
  ),

  // ========================================
  // CRIAR PEDIDO
  // POST /api/orders
  // ========================================

  http.post(
    "/api/orders",
    async ({ request }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return apiError(
          401,
          "Faça login para criar o pedido."
        );
      }

      const idempotencyKey = request.headers
        .get("Idempotency-Key")
        ?.trim();

      if (
        !idempotencyKey ||
        idempotencyKey.length > 128
      ) {
        return apiError(
          400,
          "Chave de idempotência inválida."
        );
      }

      const body: unknown = await request
        .json()
        .catch(() => null);

      const parsed = parseCheckout(body);

      if (!parsed.ok) {
        return parsed.response;
      }

      const input = parsed.value;

      const signature = getOrderSignature(
        userId,
        input
      );

      // ====================================
      // IDEMPOTÊNCIA
      // ====================================

      const storedOrders = readOrders();

      const existing = storedOrders.find(
        (item) =>
          item.idempotencyKey ===
          idempotencyKey
      );

      if (existing) {
        if (
          existing.userId !== userId ||
          existing.signature !== signature
        ) {
          return apiError(
            409,
            "Chave de idempotência reutilizada com dados diferentes."
          );
        }

        return HttpResponse.json(
          existing.order,
          { status: 200 }
        );
      }

      // ====================================
      // VALIDAR CARTEIRA
      // ====================================

      const walletError = validateWallet(
        userId,
        input
      );

      if (walletError) {
        return walletError;
      }

      // ====================================
      // COTAÇÃO
      // ====================================

      let quote: Quote;
      let quoteId: string | null = null;

      const rawQuoteId = isRecord(body)
        ? body.quoteId
        : undefined;

      if (
        rawQuoteId !== undefined &&
        rawQuoteId !== null &&
        (
          typeof rawQuoteId !== "string" ||
          !rawQuoteId.trim()
        )
      ) {
        return apiError(
          400,
          "Identificador da cotação inválido."
        );
      }

      if (typeof rawQuoteId === "string") {
        const storedQuote = readQuotes()
          .find(
            (item) =>
              item.id === rawQuoteId
          );

        if (!storedQuote) {
          return apiError(
            409,
            "Cotação não encontrada."
          );
        }

        if (
          storedQuote.userId !== userId ||
          storedQuote.signature !== signature
        ) {
          return apiError(
            409,
            "A cotação não corresponde aos dados da compra."
          );
        }

        if (
          new Date(
            storedQuote.expiresAt
          ).getTime() <= Date.now()
        ) {
          return apiError(
            409,
            "Cotação expirada. Solicite uma nova."
          );
        }

        quote = storedQuote;
        quoteId = storedQuote.id;
      } else {
        // Compatibilidade temporária com
        // o checkout atual.
        //
        // Mesmo sem quoteId, a API calcula
        // preços e taxas por conta própria.
        quote = calculateQuote(input);
      }

      // ====================================
      // CONFIRMAR PEDIDO
      // ====================================

      const order: Order = {
        id: crypto.randomUUID(),
        status: "confirmed",
        transactionReference:
          `KURIO-${crypto.randomUUID()}`,
        walletId: input.walletId,
        network: input.network,
        quoteId,
        couponCode: input.couponCode,
        items: quote.items,
        subtotalEth: quote.subtotalEth,
        networkFeeEth: quote.networkFeeEth,
        discountEth: quote.discountEth,
        totalEth: quote.totalEth,
        createdAt: new Date().toISOString(),
      };

      // Persiste antes de notificar. Repetições idempotentes
      // acima retornam o mesmo pedido sem emitir outro evento.
      saveOrders([
        ...storedOrders,
        {
          userId,
          idempotencyKey,
          signature,
          order,
        },
      ]);

      // Socket.IO é uma notificação auxiliar: uma falha na
      // transmissão não pode invalidar o pedido já confirmado.
      try {
        publishOrderUpdated(order.id, order.status);
      } catch (error) {
        console.warn(
          "[KURIO] Não foi possível emitir order.updated:",
          error
        );
      }

      return HttpResponse.json(
        order,
        { status: 201 }
      );
    }
  ),

  // ========================================
  // CONSULTAR PEDIDO
  // GET /api/orders/:orderId
  // ========================================

  http.get(
    "/api/orders/:orderId",
    async ({ request, params }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return apiError(
          401,
          "Sessão inválida ou expirada."
        );
      }

      const orderId = String(
        params.orderId ?? ""
      );

      const storedOrder = readOrders()
        .find(
          (item) =>
            item.order.id === orderId &&
            item.userId === userId
        );

      if (!storedOrder) {
        return apiError(
          404,
          "Pedido não encontrado."
        );
      }

      return HttpResponse.json(
        storedOrder.order,
        { status: 200 }
      );
    }
  ),
];
