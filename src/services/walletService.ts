
import axios from "axios";

import { getAccessToken } from "@/services/authService";

// ==========================================
// KURIO — WALLET SERVICE
// ==========================================

// Redes disponíveis na simulação.
export type WalletNetwork =
  | "ethereum"
  | "polygon"
  | "base";

// Estado da conexão simulada.
export type WalletConnectionStatus =
  | "connected"
  | "disconnected";

// Carteira retornada pela API.
export type Wallet = {
  id: string;
  label: string;
  address: string;
  network: WalletNetwork;
  isPrimary: boolean;
  connectionStatus: WalletConnectionStatus;
  createdAt: string;
  updatedAt: string;
};

// Dados para cadastrar uma carteira.
export type CreateWalletInput = {
  label: string;
  address: string;
  network: WalletNetwork;
  isPrimary: boolean;
};

// Dados para atualizar uma carteira.
export type UpdateWalletInput = Partial<CreateWalletInput>;

// ==========================================
// CONFIGURAÇÃO DO AXIOS
// ==========================================

const walletApi = axios.create({
  baseURL: "/api",
  timeout: 10000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

// Inclui a sessão atual nas requisições.
walletApi.interceptors.request.use((config) => {
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
// CONSULTAR CARTEIRAS
// GET /api/wallets
// ==========================================

async function getWallets(): Promise<Wallet[]> {
  const { data } = await walletApi.get<Wallet[]>(
    "/wallets"
  );

  return data;
}

// ==========================================
// CADASTRAR CARTEIRA
// POST /api/wallets
// ==========================================

async function createWallet(
  input: CreateWalletInput
): Promise<Wallet> {
  const { data } = await walletApi.post<Wallet>(
    "/wallets",
    input
  );

  return data;
}

// ==========================================
// ATUALIZAR CARTEIRA
// PATCH /api/wallets/:walletId
// ==========================================

async function updateWallet(
  walletId: string,
  input: UpdateWalletInput
): Promise<Wallet> {
  const { data } = await walletApi.patch<Wallet>(
    `/wallets/${encodeURIComponent(walletId)}`,
    input
  );

  return data;
}

// ==========================================
// CONECTAR CARTEIRA SIMULADA
// POST /api/wallets/:walletId/connect
// ==========================================

async function connectWallet(
  walletId: string
): Promise<Wallet> {
  const { data } = await walletApi.post<Wallet>(
    `/wallets/${encodeURIComponent(walletId)}/connect`
  );

  return data;
}

// ==========================================
// DESCONECTAR CARTEIRA SIMULADA
// POST /api/wallets/:walletId/disconnect
// ==========================================

async function disconnectWallet(
  walletId: string
): Promise<Wallet> {
  const { data } = await walletApi.post<Wallet>(
    `/wallets/${encodeURIComponent(walletId)}/disconnect`
  );

  return data;
}

// ==========================================
// EXPORTAÇÃO
// ==========================================

export const walletService = {
  getWallets,
  createWallet,
  updateWallet,
  connectWallet,
  disconnectWallet,
};
