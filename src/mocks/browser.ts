
import { setupWorker } from "msw/browser";

import { handlers } from "./handlers";
import { authHandlers } from "./authHandlers";
import { walletHandlers } from "./walletHandlers";
import { socketHandlers } from "./socketHandlers";

// ==========================================
// KURIO MARKETPLACE — MSW
// ==========================================

// Registra todos os handlers da aplicação:
// - NFTs, cotações e pedidos
// - Autenticação
// - Carteiras
// - Socket.IO / WebSocket

export const worker = setupWorker(
  ...handlers,
  ...authHandlers,
  ...walletHandlers,
  ...socketHandlers
);
