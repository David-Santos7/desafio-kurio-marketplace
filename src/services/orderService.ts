
import axios from "axios";

import {
  getAccessToken,
} from "@/services/authService";

import type {
  WalletNetwork,
} from "@/services/walletService";

// ==========================================
// KURIO MARKETPLACE — ORDER SERVICE
// ==========================================

// ==========================================
// TIPOS DOS ITENS
// ==========================================

export type CreateOrderItem = {
  nftId: string;
  quantity: number;
};

export type OrderItem = {
  nftId: string;
  name: string;
  quantity: number;
  unitPriceEth: string;
};

// ==========================================
// SOLICITAÇÃO DE COTAÇÃO
// ==========================================

export type CreateQuotePayload = {
  items: CreateOrderItem[];
  walletId: string;
  network: WalletNetwork;
  couponCode?: string | null;
};

// ==========================================
// RESPOSTA DA COTAÇÃO
// ==========================================

export type CheckoutQuote = {
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

// ==========================================
// SOLICITAÇÃO DE PEDIDO
// ==========================================

export type CreateOrderPayload = CreateQuotePayload & {
  // Opcional durante a transição:
  // o checkout existente ainda funciona
  // sem enviar o identificador da cotação.
  quoteId?: string | null;
};

// ==========================================
// RESPOSTA DO PEDIDO
// ==========================================

export type Order = {
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

// ==========================================
// CONFIGURAÇÃO DO AXIOS
// ==========================================

const orderApi = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// ==========================================
// AUTENTICAÇÃO
// ==========================================

// Recupera o token atualizado a cada
// requisição enviada à API simulada.
orderApi.interceptors.request.use((config) => {
  const token = getAccessToken();

  if (token) {
    config.headers.set(
      "Authorization",
      `Bearer ${token}`
    );
  }

  return config;
});

// ==========================================
// VALIDAÇÃO DO CHECKOUT
// ==========================================

function validateCheckoutPayload(
  payload: CreateQuotePayload
): void {
  if (
    !Array.isArray(payload.items) ||
    payload.items.length === 0
  ) {
    throw new Error(
      "Adicione pelo menos um NFT ao pedido."
    );
  }

  for (const item of payload.items) {
    if (
      !item.nftId.trim() ||
      !Number.isInteger(item.quantity) ||
      item.quantity < 1 ||
      item.quantity > 10
    ) {
      throw new Error(
        "O pedido contém itens ou quantidades inválidos."
      );
    }
  }

  const uniqueIds = new Set(
    payload.items.map((item) => item.nftId)
  );

  if (uniqueIds.size !== payload.items.length) {
    throw new Error(
      "O pedido contém NFTs duplicados."
    );
  }

  if (!payload.walletId.trim()) {
    throw new Error(
      "Selecione uma carteira de pagamento."
    );
  }

  if (
    payload.network !== "ethereum" &&
    payload.network !== "polygon" &&
    payload.network !== "base"
  ) {
    throw new Error(
      "A rede de pagamento é inválida."
    );
  }
}

// ==========================================
// NORMALIZAÇÃO DO CUPOM
// ==========================================

function normalizeCouponCode(
  couponCode?: string | null
): string | null {
  const normalized = couponCode
    ?.trim()
    .toUpperCase();

  return normalized || null;
}

// ==========================================
// GERAR CHAVE DE IDEMPOTÊNCIA
// ==========================================

// Gere uma chave para cada nova tentativa
// lógica de compra.
//
// Reutilize a mesma chave ao repetir
// a mesma tentativa após uma falha.
export function generateOrderIdempotencyKey(): string {
  return crypto.randomUUID();
}

// ==========================================
// SOLICITAR COTAÇÃO
// POST /api/checkout/quote
// ==========================================

async function createQuote(
  payload: CreateQuotePayload
): Promise<CheckoutQuote> {
  validateCheckoutPayload(payload);

  const normalizedPayload: CreateQuotePayload = {
    ...payload,
    couponCode: normalizeCouponCode(
      payload.couponCode
    ),
  };

  const response =
    await orderApi.post<CheckoutQuote>(
      "/checkout/quote",
      normalizedPayload
    );

  return response.data;
}

// ==========================================
// CRIAR PEDIDO
// POST /api/orders
// ==========================================

async function createOrder(
  payload: CreateOrderPayload,
  idempotencyKey: string
): Promise<Order> {
  validateCheckoutPayload(payload);

  if (
    !idempotencyKey.trim() ||
    idempotencyKey.length > 128
  ) {
    throw new Error(
      "A chave de idempotência é inválida."
    );
  }

  const normalizedPayload: CreateOrderPayload = {
    ...payload,
    couponCode: normalizeCouponCode(
      payload.couponCode
    ),
  };

  const response = await orderApi.post<Order>(
    "/orders",
    normalizedPayload,
    {
      headers: {
        "Idempotency-Key": idempotencyKey,
      },
    }
  );

  return response.data;
}

// ==========================================
// CONSULTAR PEDIDO
// GET /api/orders/:orderId
// ==========================================

async function getOrderById(
  orderId: string
): Promise<Order> {
  if (!orderId.trim()) {
    throw new Error(
      "Informe o identificador do pedido."
    );
  }

  const response = await orderApi.get<Order>(
    `/orders/${encodeURIComponent(
      orderId
    )}`
  );

  return response.data;
}

// ==========================================
// EXPORTAÇÃO DO SERVIÇO
// ==========================================

export const orderService = {
  createQuote,
  createOrder,
  getOrderById,
};
