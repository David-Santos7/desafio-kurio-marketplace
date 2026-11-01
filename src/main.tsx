
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import { routeTree } from "./routeTree.gen";
import "./index.css";

// Cria o roteador com as rotas da aplicação
const router = createRouter({
  routeTree,
});

// Registra os tipos para o TypeScript
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Inicializa a aplicação React
createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
