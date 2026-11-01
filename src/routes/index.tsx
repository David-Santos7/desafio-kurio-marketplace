
import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

// Categorias e visualização de favoritos
type NftCategory =
  | "all"
  | "new"
  | "trending"
  | "favorites";

// Parâmetros aceitos na URL
type NftSearch = {
  tab: NftCategory;
  q?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (
    search: Record<string, unknown>
  ): NftSearch => ({
    tab:
      search.tab === "new" ||
      search.tab === "trending" ||
      search.tab === "favorites"
        ? search.tab
        : "all",

    q:
      typeof search.q === "string" &&
      search.q.length > 0
        ? search.q
        : undefined,
  }),

  component: App,
});
