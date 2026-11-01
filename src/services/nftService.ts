
import axios from "axios";
import type { Nft } from "@/data/nfts";

// ==========================================
// KURIO MARKETPLACE — API CLIENT
// ==========================================

// Cliente HTTP centralizado.
const api = axios.create({
  baseURL: "/api",
  timeout: 10000,

  headers: {
    Accept: "application/json",
  },
});

// ==========================================
// CONSULTAR TODOS OS NFTs
// GET /api/nfts
// ==========================================

async function getAllNfts(): Promise<Nft[]> {
  const response = await api.get<Nft[]>("/nfts");

  return response.data;
}

// ==========================================
// CONSULTAR NFT PELO IDENTIFICADOR
// GET /api/nfts/:nftId
// ==========================================

async function getNftById(
  nftId: string
): Promise<Nft> {
  if (!nftId.trim()) {
    throw new Error(
      "É necessário informar o identificador do NFT."
    );
  }

  const response = await api.get<Nft>(
    `/nfts/${encodeURIComponent(nftId)}`
  );

  return response.data;
}

// ==========================================
// SERVIÇO DE NFTs
// ==========================================

export const nftService = {
  getAllNfts,
  getNftById,
};
