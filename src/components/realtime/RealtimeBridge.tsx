import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { X } from "lucide-react";

import { useCart } from "@/context/CartContext";
import type { Nft } from "@/data/nfts";
import { nftQueryKeys } from "@/hooks/useNfts";
import { getAccessToken } from "@/services/authService";
import { orderService } from "@/services/orderService";
import {
  connectRealtime,
  disconnectRealtime,
  getRealtimeSocket,
  type NftUpdatedEvent,
  type OrderUpdatedEvent,
} from "@/services/socketService";

// Sincronização Socket.IO -> TanStack Query -> Interface.
export function RealtimeBridge() {
  const queryClient = useQueryClient();
  const { cartIds } = useCart();
  const [notice, setNotice] = useState<string | null>(null);

  // Evita reaplicar eventos antigos ou duplicados.
  const nftVersions = useRef(new Map<string, number>());
  const observedOrders = useRef(new Set<string>());

  useEffect(() => {
    const socket = getRealtimeSocket();
    let active = true;
    let connectedBefore = false;

    function onConnect() {
      // Na reconexão, a API REST volta a ser a fonte da verdade.
      if (connectedBefore) {
        void queryClient.invalidateQueries({
          queryKey: nftQueryKeys.all,
        });
      }
      connectedBefore = true;
    }

    function onNftUpdated(event: NftUpdatedEvent) {
      if (!event.nftId || !/^\d+(?:\.\d+)?$/.test(event.priceEth)) {
        return;
      }

      const version = Date.parse(event.updatedAt);
      if (!Number.isFinite(version)) return;

      const previousVersion = nftVersions.current.get(event.nftId) ?? -1;
      if (version <= previousVersion) return;
      nftVersions.current.set(event.nftId, version);

      const previous = queryClient.getQueryData<Nft[]>(nftQueryKeys.all);
      const existing = previous?.find((nft) => nft.id === event.nftId)
        ?? queryClient.getQueryData<Nft>(nftQueryKeys.detail(event.nftId));

      // O mock pode responder com o mesmo preço: não exibe um falso aviso.
      if (!existing || existing.priceEth === event.priceEth) return;

      queryClient.setQueryData<Nft[]>(nftQueryKeys.all, (items) =>
        items?.map((item) =>
          item.id === event.nftId
            ? { ...item, priceEth: event.priceEth }
            : item
        )
      );

      queryClient.setQueryData<Nft>(
        nftQueryKeys.detail(event.nftId),
        (item) => item ? { ...item, priceEth: event.priceEth } : item
      );

      setNotice(`NFT atualizado: ${existing.name} — ${event.priceEth} ETH.`);
    }

    function onOrderUpdated(event: OrderUpdatedEvent) {
      if (event.status !== "confirmed" || !event.orderId) return;

      const tokenAtEvent = getAccessToken();
      if (!tokenAtEvent || observedOrders.current.has(event.orderId)) return;

      // Marca antes da consulta para evitar operações duplicadas.
      observedOrders.current.add(event.orderId);

      // O servidor valida o proprietário. Não exibimos pedidos de outra conta.
      void orderService.getOrderById(event.orderId)
        .then((order) => {
          if (!active || getAccessToken() !== tokenAtEvent) return;
          if (order.status !== "confirmed") return;

          queryClient.setQueryData(["orders", order.id], order);
          setNotice(`Pedido ${order.id.slice(0, 8)} confirmado em tempo real.`);
        })
        .catch(() => {
          observedOrders.current.delete(event.orderId);
        });
    }

    socket.on("connect", onConnect);
    socket.on("nft.updated", onNftUpdated);
    socket.on("order.updated", onOrderUpdated);
    connectRealtime();

    return () => {
      active = false;
      socket.off("connect", onConnect);
      socket.off("nft.updated", onNftUpdated);
      socket.off("order.updated", onOrderUpdated);
      disconnectRealtime();
    };
  }, [queryClient]);

  // Acompanha os NFTs ativos no carrinho usando o protocolo Socket.IO.
  useEffect(() => {
    const socket = getRealtimeSocket();

    function watchCart() {
      for (const nftId of cartIds) {
        socket.emit("nft.watch", nftId);
      }
    }

    socket.on("connect", watchCart);
    if (socket.connected) watchCart();

    return () => {
      socket.off("connect", watchCart);
    };
  }, [cartIds]);

  return notice ? (
    <div
      role="status"
      aria-live="polite"
      className="fixed right-4 top-4 z-[100] flex max-w-[350px] items-center gap-3 rounded-xl border border-kurio-border bg-kurio-card px-4 py-3 text-xs text-kurio-text shadow-xl"
    >
      <span>{notice}</span>
      <button
        type="button"
        aria-label="Dispensar notificação"
        onClick={() => setNotice(null)}
        className="shrink-0 rounded p-1 focus-visible:outline-2 focus-visible:outline-kurio-accent"
      >
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  ) : null;
}

