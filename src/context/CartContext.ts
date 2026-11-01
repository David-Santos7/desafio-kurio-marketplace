
import { createContext, useContext } from "react";

// Define os dados e as funções disponíveis no carrinho.
export type CartContextValue = {
  // Identificadores dos NFTs adicionados.
  cartIds: string[];

  // Quantidade total de NFTs no carrinho.
  cartCount: number;

  // Valor total dos produtos em ETH.
  totalEth: number;

  // Adiciona um NFT ao carrinho.
  addToCart: (nftId: string) => void;

  // Remove um NFT do carrinho.
  removeFromCart: (nftId: string) => void;

  // Verifica se determinado NFT está no carrinho.
  isInCart: (nftId: string) => boolean;
};

// Cria o contexto compartilhado do carrinho.
export const CartContext = createContext<CartContextValue | null>(
  null
);

// Hook personalizado para acessar o carrinho.
export function useCart(): CartContextValue {
  const context = useContext(CartContext);

  // Impede o uso fora do CartProvider.
  if (context === null) {
    throw new Error(
      "useCart deve ser utilizado dentro de CartProvider."
    );
  }

  return context;
}
