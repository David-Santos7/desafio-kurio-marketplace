import { io, type Socket } from "socket.io-client";

// Eventos suportados pelo servidor demonstrativo (MSW).
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

type ServerToClientEvents = {
  "kurio.pong": (data: KurioPongEvent) => void;
  "nft.updated": (data: NftUpdatedEvent) => void;
  "order.updated": (data: OrderUpdatedEvent) => void;
};

type ClientToServerEvents = {
  "kurio.ping": () => void;
  "nft.watch": (nftId: string) => void;
};

export type KurioSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

// Endereço fictício: o MSW intercepta a conexão WebSocket.
const SOCKET_URL = "https://kurio-realtime.example";
let socketInstance: KurioSocket | null = null;

export function getRealtimeSocket(): KurioSocket {
  if (!socketInstance) {
    socketInstance = io(SOCKET_URL, {
      path: "/socket.io/",
      transports: ["websocket"],
      autoConnect: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 1000,
      timeout: 5000,
    });
  }
  return socketInstance;
}

export function connectRealtime(): KurioSocket {
  const socket = getRealtimeSocket();
  if (!socket.connected) socket.connect();
  return socket;
}

export function disconnectRealtime(): void {
  socketInstance?.disconnect();
}

export function pingRealtime(): void {
  const socket = getRealtimeSocket();
  if (socket.connected) socket.emit("kurio.ping");
}

export function watchNft(nftId: string): void {
  if (!nftId.trim()) return;
  const socket = getRealtimeSocket();
  if (socket.connected) socket.emit("nft.watch", nftId);
}
