
import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

type NftCategory =
  | "all"
  | "new"
  | "trending"
  | "favorites"
  | "cart";

type NftSort = "price-asc" | "price-desc";

type NftSearch = {
  tab: NftCategory;
  q?: string;
  sort?: NftSort;
};

export const Route = createFileRoute("/")({
  validateSearch: (
    search: Record<string, unknown>
  ): NftSearch => ({
    // Categoria ou visualização atual.
    tab:
      search.tab === "new" ||
      search.tab === "trending" ||
      search.tab === "favorites" ||
      search.tab === "cart"
        ? search.tab
        : "all",

    // Termo de pesquisa.
    q:
      typeof search.q === "string" &&
      search.q.length > 0
        ? search.q
        : undefined,

    // Ordenação dos produtos.
    sort:
      search.sort === "price-asc" ||
      search.sort === "price-desc"
        ? search.sort
        : undefined,
  }),

  component: App,
});
