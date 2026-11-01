
import { http, HttpResponse } from "msw";
import { nfts } from "@/data/nfts";

// ==========================================
// KURIO MARKETPLACE — MOCK API HANDLERS
// ==========================================

// Endpoints simulados da API REST.
export const handlers = [
  // ========================================
  // GET /api/nfts
  // Retorna todos os NFTs do catálogo.
  // ========================================

  http.get("/api/nfts", () => {
    return HttpResponse.json(nfts, {
      status: 200,
    });
  }),

  // ========================================
  // GET /api/nfts/:nftId
  // Retorna os dados de um NFT específico.
  // ========================================

  http.get("/api/nfts/:nftId", ({ params }) => {
    const nftId = String(params.nftId ?? "");

    const nft = nfts.find(
      (item) => item.id === nftId
    );

    // NFT não encontrado.
    if (!nft) {
      return HttpResponse.json(
        {
          message: "NFT não encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    // NFT encontrado.
    return HttpResponse.json(nft, {
      status: 200,
    });
  }),
];
