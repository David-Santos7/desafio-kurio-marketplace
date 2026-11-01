
import {
  io,
  type Socket,
} from "socket.io-client";

// ==========================================
// KURIO MARKETPLACE — SOCKET SERVICE
// ==========================================

// ==========================================
// EVENTOS RECEBIDOS
// ==========================================

export type NftUpdatedEvent = {
  nftId: string;
  name: string;
  priceEth: string;
  updatedAt: string;
};

export type OrderUpdatedEvent = {
  orderId: string;
  status: "confirmed";
  updatedAt: string;
};

export type KurioPongEvent = {
  connected: boolean;
};

// ==========================================
// TIPAGEM DOS EVENTOS SOCKET.IO
// ==========================================

type ServerToClientEvents = {
  "kurio.pong": (
    data: KurioPongEvent
  ) => void;

  "nft.updated": (
    data: NftUpdatedEvent
  ) => void;

  "order.updated": (
    data: OrderUpdatedEvent
  ) => void;
};

type ClientToServerEvents = {
  "kurio.ping": () => void;

  "nft.watch": (
    nftId: string
  ) => void;
};

export type KurioSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

// ==========================================
// CONFIGURAÇÃO
// ==========================================

// Endereço fictício usado exclusivamente
// na simulação com MSW.
const SOCKET_URL =
  "https://kurio-realtime.example";

// Mantém uma única instância do Socket.IO
// durante a utilização da aplicação.
let socketInstance: KurioSocket | null = null;

// ==========================================
// OBTER SOCKET
// ==========================================

export function getRealtimeSocket(): KurioSocket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      path: "/socket.io/",
      transports: ["websocket"],

      // Conectaremos somente depois
      // que o MSW estiver inicializado.
      autoConnect: false,

      // Evita tentativas intermináveis
      // contra o endereço demonstrativo.
      reconnection: false,

      timeout: 5000,
    });
  }

  return socketInstance;
}

// ==========================================
// CONECTAR
// ==========================================

export function connectRealtime(): KurioSocket {
  const socket = getRealtimeSocket();

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

// ==========================================
// DESCONECTAR
// ==========================================

export function disconnectRealtime(): void {
  if (socketInstance) {
    socketInstance.disconnect();
  }
}

// ==========================================
// PING DE TESTE
// ==========================================

export function pingRealtime(): void {
  const socket = getRealtimeSocket();

  if (socket.connected) {
    socket.emit("kurio.ping");
  }
}

// ==========================================
// ACOMPANHAR NFT
// ==========================================

export function watchNft(
  nftId: string
): void {
  if (!nftId.trim()) {
    return;
  }

  const socket = getRealtimeSocket();

  if (socket.connected) {
    socket.emit(
      "nft.watch",
      nftId
    );
  }
}
