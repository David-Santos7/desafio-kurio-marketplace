
import { useEffect, useState, type ReactNode } from "react";

import { nfts } from "@/data/nfts";
import { CartContext } from "./CartContext";

// Identificador utilizado no localStorage.
const CART_STORAGE_KEY = "kurio:cart";

// IDs válidos dos NFTs do catálogo.
const validNftIds = new Set(
  nfts.map((nft) => nft.id)
);

// Recupera os NFTs salvos no carrinho.
function getInitialCart(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedCart = window.localStorage.getItem(
      CART_STORAGE_KEY
    );

    if (storedCart === null) {
      return [];
    }

    const parsedCart: unknown = JSON.parse(storedCart);

    if (!Array.isArray(parsedCart)) {
      return [];
    }

    // Remove IDs inválidos e duplicações.
    const validCart = parsedCart.filter(
      (id): id is string =>
        typeof id === "string" &&
        validNftIds.has(id)
    );

    return [...new Set(validCart)];
  } catch {
    return [];
  }
}

// Tipagem das propriedades do Provider.
type CartProviderProps = {
  children: ReactNode;
};

// Exporta o componente para o main.tsx.
export function CartProvider({
  children,
}: CartProviderProps) {
  // Estado compartilhado do carrinho.
  const [cartIds, setCartIds] = useState<string[]>(
    getInitialCart
  );

  // Persiste os itens no navegador.
  useEffect(() => {
    try {
      window.localStorage.setItem(
        CART_STORAGE_KEY,
        JSON.stringify(cartIds)
      );
    } catch {
      // Mantém o carrinho em memória.
    }
  }, [cartIds]);

  // Adiciona um NFT ao carrinho.
  function addToCart(nftId: string): void {
    if (!validNftIds.has(nftId)) {
      return;
    }

    setCartIds((currentCart) => {
      if (currentCart.includes(nftId)) {
        return currentCart;
      }

      return [...currentCart, nftId];
    });
  }

  // Remove um NFT do carrinho.
  function removeFromCart(nftId: string): void {
    setCartIds((currentCart) =>
      currentCart.filter((id) => id !== nftId)
    );
  }

  // Verifica se o NFT está no carrinho.
  function isInCart(nftId: string): boolean {
    return cartIds.includes(nftId);
  }

  // Calcula a quantidade de itens.
  const cartCount = cartIds.length;

  // Calcula o valor total em ETH.
  const totalEth = nfts.reduce((total, nft) => {
    if (cartIds.includes(nft.id)) {
      return total + Number(nft.priceEth);
    }

    return total;
  }, 0);

  return (
    <CartContext.Provider
      value={{
        cartIds,
        cartCount,
        totalEth,
        addToCart,
        removeFromCart,
        isInCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
