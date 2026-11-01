
import { ws } from "msw";
import { toSocketIo } from "@mswjs/socket.io-binding";

import { nfts } from "@/data/nfts";

// ==========================================
// KURIO — SOCKET.IO MOCK
// ==========================================

// O cliente Socket.IO usará:
// https://kurio-realtime.example
//
// MSW interceptará a conexão WebSocket.
// Não existe servidor externo.
export const realtimeSocket = ws.link(
  "wss://kurio-realtime.example"
);

// Clientes conectados na simulação.
const connectedClients = new Set<
  ReturnType<typeof toSocketIo>["client"]
>();

// ==========================================
// ATUALIZAÇÃO DE PEDIDOS
// ==========================================

// Será chamada pelo POST /api/orders
// depois da confirmação do pedido.
export function publishOrderUpdated(
  orderId: string,
  status: "confirmed"
): void {
  const eventData = {
    orderId,
    status,
    updatedAt: new Date().toISOString(),
  };

  for (const client of connectedClients) {
    client.emit("order.updated", eventData);
  }
}

// ==========================================
// EVENTOS SOCKET.IO
// ==========================================

export const socketHandlers = [
  realtimeSocket.addEventListener(
    "connection",
    (connection) => {
      // Converte a conexão WebSocket
      // para o protocolo Socket.IO.
      const io = toSocketIo(connection);

      const client = io.client;

      connectedClients.add(client);

      // Remove clientes desconectados.
      connection.client.addEventListener(
        "close",
        () => {
          connectedClients.delete(client);
        }
      );

      // ====================================
      // PING / PONG
      // ====================================

      client.on("kurio.ping", () => {
        client.emit("kurio.pong", {
          connected: true,
        });
      });

      // ====================================
      // CONSULTAR ATUALIZAÇÃO DE NFT
      // ====================================

      client.on(
        "nft.watch",
        (_event, nftId: unknown) => {
          if (typeof nftId !== "string") {
            return;
          }

          const nft = nfts.find(
            (item) => item.id === nftId
          );

          if (!nft) {
            return;
          }

          client.emit("nft.updated", {
            nftId: nft.id,
            name: nft.name,
            priceEth: nft.priceEth,
            updatedAt:
              new Date().toISOString(),
          });
        }
      );
    }
  ),
];
