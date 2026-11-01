
import { useQuery } from "@tanstack/react-query";

import { nftService } from "@/services/nftService";

// ==========================================
// KURIO MARKETPLACE — NFT QUERY KEYS
// ==========================================

// Identificadores utilizados pelo cache.
export const nftQueryKeys = {
  all: ["nfts"] as const,

  detail: (nftId: string) =>
    ["nfts", nftId] as const,
};

// ==========================================
// CONSULTAR TODOS OS NFTs
// ==========================================

export function useNfts() {
  return useQuery({
    queryKey: nftQueryKeys.all,

    queryFn: nftService.getAllNfts,
  });
}

// ==========================================
// CONSULTAR UM NFT PELO ID
// ==========================================

export function useNft(nftId: string) {
  return useQuery({
    queryKey: nftQueryKeys.detail(nftId),

    queryFn: () => nftService.getNftById(nftId),

    enabled: nftId.trim().length > 0,
  });
}
