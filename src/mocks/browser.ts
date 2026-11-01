
import { setupWorker } from "msw/browser";
import { handlers } from "./handlers";

// ==========================================
// KURIO MARKETPLACE — MSW BROWSER WORKER
// ==========================================

// Registra os endpoints simulados.
export const worker = setupWorker(...handlers);
