
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

// Contexto responsável pelo carrinho de NFTs
import { CartProvider } from "@/context/CartProvider";

// Rotas geradas automaticamente pelo TanStack Router
import { routeTree } from "./routeTree.gen";

// Estilos globais da aplicação
import "./index.css";

// Cria o roteador com as rotas da aplicação
const router = createRouter({
  routeTree,
});

// Registra os tipos do roteador para o TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Inicializa a aplicação React
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <CartProvider>
      <RouterProvider router={router} />
    </CartProvider>
  </StrictMode>,
);
