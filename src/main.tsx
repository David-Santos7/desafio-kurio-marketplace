
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import {
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";

import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import { CartProvider } from "@/context/CartProvider";
import { routeTree } from "./routeTree.gen";

import "./index.css";

// ==========================================
// KURIO — TANSTACK QUERY
// ==========================================

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ==========================================
// KURIO — TANSTACK ROUTER
// ==========================================

const router = createRouter({
  routeTree,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// ==========================================
// KURIO — MSW
// ==========================================

// O MSW ficará ativo também no build
// demonstrativo da aplicação.
//
// Para utilizar futuramente uma API real,
// configure VITE_ENABLE_MSW=false
// antes de gerar o build.

async function enableMocking(): Promise<void> {
  if (import.meta.env.VITE_ENABLE_MSW === "false") {
    return;
  }

  const { worker } = await import("./mocks/browser");

  await worker.start({
    onUnhandledRequest: "bypass",
    serviceWorker: {
      url: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    },
  });
}

// ==========================================
// KURIO — INICIALIZAÇÃO DO REACT
// ==========================================

async function initializeApp(): Promise<void> {
  try {
    // Aguarda a inicialização do MSW.
    await enableMocking();
  } catch (error) {
    console.error(
      "KURIO: falha ao inicializar a API simulada.",
      error
    );
  }

  const rootElement = document.getElementById("root");

  if (!rootElement) {
    throw new Error(
      "KURIO: elemento #root não encontrado."
    );
  }

  createRoot(rootElement).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <CartProvider>
          <RouterProvider router={router} />
        </CartProvider>
      </QueryClientProvider>
    </StrictMode>
  );
}

void initializeApp();
