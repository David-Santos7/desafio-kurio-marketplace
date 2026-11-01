
import { http, HttpResponse } from "msw";

import type {
  Wallet,
  WalletNetwork,
  WalletConnectionStatus,
} from "@/services/walletService";

import {
  getAuthenticatedMockUserId,
} from "./authHandlers";

// ==========================================
// KURIO MARKETPLACE — WALLET HANDLERS
// ==========================================

type StoredWallet = Wallet & {
  ownerId: string;
};

const STORAGE_KEY = "kurio:mock-wallets";

// Fallback caso o armazenamento esteja
// indisponível no ambiente de execução.
let memoryWallets: StoredWallet[] = [];

// ==========================================
// VALIDAÇÕES
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

function isValidAddress(
  address: string
): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
}

function isStoredWallet(
  value: unknown
): value is StoredWallet {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.ownerId === "string" &&
    typeof value.label === "string" &&
    typeof value.address === "string" &&
    isValidAddress(value.address) &&
    isNetwork(value.network) &&
    typeof value.isPrimary === "boolean" &&
    (
      value.connectionStatus === "connected" ||
      value.connectionStatus === "disconnected"
    ) &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

// ==========================================
// PERSISTÊNCIA DAS CARTEIRAS
// ==========================================

// Lê o localStorage em cada operação.
//
// Isso evita depender exclusivamente
// de uma variável em memória.
function readWallets(): StoredWallet[] {
  try {
    const stored = localStorage.getItem(
      STORAGE_KEY
    );

    if (stored !== null) {
      const parsed: unknown = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        const validWallets = parsed.filter(
          isStoredWallet
        );

        memoryWallets = validWallets;

        return [...validWallets];
      }
    }
  } catch {
    // Continua utilizando os dados em memória.
  }

  return [...memoryWallets];
}

// Atualiza a memória e o armazenamento
// utilizando uma única função.
function saveWallets(
  wallets: StoredWallet[]
): void {
  memoryWallets = wallets;

  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(wallets)
    );
  } catch {
    // Os dados continuam em memória.
  }
}

// ==========================================
// RESPOSTAS DA API
// ==========================================

function unauthorized() {
  return HttpResponse.json(
    {
      message: "Sessão inválida ou expirada.",
    },
    { status: 401 }
  );
}

function notFound() {
  return HttpResponse.json(
    {
      message: "Carteira não encontrada.",
    },
    { status: 404 }
  );
}

// ==========================================
// CARTEIRA PÚBLICA
// ==========================================

// Impede que ownerId seja retornado
// desnecessariamente na resposta pública.
function toPublicWallet(
  wallet: StoredWallet
): Wallet {
  return {
    id: wallet.id,
    label: wallet.label,
    address: wallet.address,
    network: wallet.network,
    isPrimary: wallet.isPrimary,
    connectionStatus: wallet.connectionStatus,
    createdAt: wallet.createdAt,
    updatedAt: wallet.updatedAt,
  };
}

// ==========================================
// CONSULTAR CARTEIRA DO USUÁRIO
// ==========================================

function findOwnedWallet(
  wallets: StoredWallet[],
  userId: string,
  walletId: string
): StoredWallet | undefined {
  return wallets.find(
    (wallet) =>
      wallet.ownerId === userId &&
      wallet.id === walletId
  );
}

// ==========================================
// IDENTIFICAR CARTEIRA DUPLICADA
// ==========================================

function hasDuplicateWallet(
  wallets: StoredWallet[],
  userId: string,
  address: string,
  network: WalletNetwork,
  excludeWalletId?: string
): boolean {
  return wallets.some(
    (wallet) =>
      wallet.ownerId === userId &&
      wallet.id !== excludeWalletId &&
      wallet.network === network &&
      wallet.address.toLowerCase() ===
        address.toLowerCase()
  );
}

// ==========================================
// DEFINIR CARTEIRA PRINCIPAL
// ==========================================

// Garante que somente uma carteira
// do mesmo usuário fique como principal.
//
// Carteiras de outros usuários
// permanecem inalteradas.
function assignPrimaryWallet(
  wallets: StoredWallet[],
  userId: string,
  walletId: string
): StoredWallet[] {
  const now = new Date().toISOString();

  return wallets.map((wallet) => {
    if (wallet.ownerId !== userId) {
      return wallet;
    }

    const shouldBePrimary =
      wallet.id === walletId;

    if (
      wallet.isPrimary === shouldBePrimary
    ) {
      return wallet;
    }

    return {
      ...wallet,
      isPrimary: shouldBePrimary,
      updatedAt: now,
    };
  });
}

// ==========================================
// CONECTAR / DESCONECTAR
// ==========================================

// Um único mecanismo para os dois
// endpoints evita duplicar a lógica.
function createConnectionHandler(
  action: "connect" | "disconnect",
  connectionStatus: WalletConnectionStatus
) {
  return http.post(
    `/api/wallets/:walletId/${action}`,
    async ({ request, params }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return unauthorized();
      }

      const walletId = String(
        params.walletId ?? ""
      );

      const wallets = readWallets();

      const wallet = findOwnedWallet(
        wallets,
        userId,
        walletId
      );

      if (!wallet) {
        return notFound();
      }

      const updatedWallet: StoredWallet = {
        ...wallet,
        connectionStatus,
        updatedAt: new Date().toISOString(),
      };

      const updatedWallets = wallets.map(
        (item) =>
          item.id === walletId &&
          item.ownerId === userId
            ? updatedWallet
            : item
      );

      saveWallets(updatedWallets);

      return HttpResponse.json(
        toPublicWallet(updatedWallet),
        { status: 200 }
      );
    }
  );
}

// ==========================================
// ENDPOINTS DE CARTEIRAS
// ==========================================

export const walletHandlers = [

  // ========================================
  // GET /api/wallets
  // ========================================

  http.get(
    "/api/wallets",
    async ({ request }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return unauthorized();
      }

      const wallets = readWallets()
        .filter(
          (wallet) =>
            wallet.ownerId === userId
        )
        .map(toPublicWallet);

      return HttpResponse.json(
        wallets,
        { status: 200 }
      );
    }
  ),

  // ========================================
  // POST /api/wallets
  // ========================================

  http.post(
    "/api/wallets",
    async ({ request }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return unauthorized();
      }

      const body: unknown = await request
        .json()
        .catch(() => null);

      if (!isRecord(body)) {
        return HttpResponse.json(
          { message: "Dados inválidos." },
          { status: 400 }
        );
      }

      const label =
        typeof body.label === "string"
          ? body.label.trim()
          : "";

      const address =
        typeof body.address === "string"
          ? body.address.trim()
          : "";

      const network = body.network;
      const isPrimary = body.isPrimary;

      if (
        label.length < 2 ||
        label.length > 50
      ) {
        return HttpResponse.json(
          {
            message:
              "O nome deve ter entre 2 e 50 caracteres.",
          },
          { status: 400 }
        );
      }

      if (!isValidAddress(address)) {
        return HttpResponse.json(
          {
            message:
              "Informe um endereço EVM válido.",
          },
          { status: 400 }
        );
      }

      if (!isNetwork(network)) {
        return HttpResponse.json(
          {
            message: "Rede não suportada.",
          },
          { status: 400 }
        );
      }

      if (typeof isPrimary !== "boolean") {
        return HttpResponse.json(
          {
            message:
              "Informe se a carteira é principal.",
          },
          { status: 400 }
        );
      }

      const wallets = readWallets();

      if (
        hasDuplicateWallet(
          wallets,
          userId,
          address,
          network
        )
      ) {
        return HttpResponse.json(
          {
            message:
              "Esta carteira já está cadastrada nesta rede.",
          },
          { status: 409 }
        );
      }

      const userWallets = wallets.filter(
        (wallet) =>
          wallet.ownerId === userId
      );

      // A primeira carteira será principal.
      const shouldBePrimary =
        isPrimary ||
        userWallets.length === 0;

      const now = new Date().toISOString();

      const newWallet: StoredWallet = {
        id: crypto.randomUUID(),
        ownerId: userId,
        label,
        address,
        network,
        isPrimary: false,
        connectionStatus: "disconnected",
        createdAt: now,
        updatedAt: now,
      };

      let updatedWallets = [
        ...wallets,
        newWallet,
      ];

      if (shouldBePrimary) {
        updatedWallets = assignPrimaryWallet(
          updatedWallets,
          userId,
          newWallet.id
        );
      }

      saveWallets(updatedWallets);

      const createdWallet = findOwnedWallet(
        updatedWallets,
        userId,
        newWallet.id
      );

      return HttpResponse.json(
        toPublicWallet(
          createdWallet ?? newWallet
        ),
        { status: 201 }
      );
    }
  ),

  // ========================================
  // PATCH /api/wallets/:walletId
  // ========================================

  http.patch(
    "/api/wallets/:walletId",
    async ({ request, params }) => {
      const userId =
        await getAuthenticatedMockUserId(
          request
        );

      if (!userId) {
        return unauthorized();
      }

      const walletId = String(
        params.walletId ?? ""
      );

      const wallets = readWallets();

      const wallet = findOwnedWallet(
        wallets,
        userId,
        walletId
      );

      if (!wallet) {
        return notFound();
      }

      const body: unknown = await request
        .json()
        .catch(() => null);

      if (!isRecord(body)) {
        return HttpResponse.json(
          { message: "Dados inválidos." },
          { status: 400 }
        );
      }

      const label =
        body.label === undefined
          ? wallet.label
          : body.label;

      const address =
        body.address === undefined
          ? wallet.address
          : body.address;

      const network =
        body.network === undefined
          ? wallet.network
          : body.network;

      const isPrimary =
        body.isPrimary === undefined
          ? wallet.isPrimary
          : body.isPrimary;

      if (
        typeof label !== "string" ||
        label.trim().length < 2 ||
        label.trim().length > 50
      ) {
        return HttpResponse.json(
          {
            message: "Nome inválido.",
          },
          { status: 400 }
        );
      }

      if (
        typeof address !== "string" ||
        !isValidAddress(address.trim())
      ) {
        return HttpResponse.json(
          {
            message: "Endereço inválido.",
          },
          { status: 400 }
        );
      }

      if (!isNetwork(network)) {
        return HttpResponse.json(
          {
            message: "Rede inválida.",
          },
          { status: 400 }
        );
      }

      if (typeof isPrimary !== "boolean") {
        return HttpResponse.json(
          {
            message:
              "Valor de carteira principal inválido.",
          },
          { status: 400 }
        );
      }

      // Não permite deixar o usuário
      // sem carteira principal ao desmarcar
      // diretamente a principal atual.
      if (
        wallet.isPrimary &&
        !isPrimary
      ) {
        return HttpResponse.json(
          {
            message:
              "Escolha outra carteira principal antes de desmarcar a atual.",
          },
          { status: 409 }
        );
      }

      const normalizedAddress =
        address.trim();

      if (
        hasDuplicateWallet(
          wallets,
          userId,
          normalizedAddress,
          network,
          walletId
        )
      ) {
        return HttpResponse.json(
          {
            message:
              "Esta carteira já está cadastrada nesta rede.",
          },
          { status: 409 }
        );
      }

      const connectionChanged =
        normalizedAddress.toLowerCase() !==
          wallet.address.toLowerCase() ||
        network !== wallet.network;

      const updatedWallet: StoredWallet = {
        ...wallet,
        label: label.trim(),
        address: normalizedAddress,
        network,
        isPrimary,
        connectionStatus: connectionChanged
          ? "disconnected"
          : wallet.connectionStatus,
        updatedAt: new Date().toISOString(),
      };

      let updatedWallets = wallets.map(
        (item) =>
          item.ownerId === userId &&
          item.id === walletId
            ? updatedWallet
            : item
      );

      if (isPrimary) {
        updatedWallets = assignPrimaryWallet(
          updatedWallets,
          userId,
          walletId
        );
      }

      saveWallets(updatedWallets);

      const result = findOwnedWallet(
        updatedWallets,
        userId,
        walletId
      );

      return HttpResponse.json(
        toPublicWallet(
          result ?? updatedWallet
        ),
        { status: 200 }
      );
    }
  ),

  // ========================================
  // POST /api/wallets/:walletId/connect
  // ========================================

  createConnectionHandler(
    "connect",
    "connected"
  ),

  // ========================================
  // POST /api/wallets/:walletId/disconnect
  // ========================================

  createConnectionHandler(
    "disconnect",
    "disconnected"
  ),
];

// ==========================================
// VALIDAÇÃO DA CARTEIRA PARA O CHECKOUT
// ==========================================

// Função utilizada pelos handlers de pedidos.
//
// A carteira somente será retornada se
// pertencer ao usuário informado.
export function getCheckoutWallet(
  userId: string,
  walletId: string
): Wallet | null {
  const wallets = readWallets();

  const wallet = findOwnedWallet(
    wallets,
    userId,
    walletId
  );

  if (!wallet) {
    return null;
  }

  return toPublicWallet(wallet);
}
