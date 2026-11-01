
import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

type NftCategory = "all" | "new" | "trending";

type NftSearch = {
  tab: NftCategory;
  q?: string;
};

export const Route = createFileRoute("/")({
  validateSearch: (
    search: Record<string, unknown>
  ): NftSearch => ({
    // Valida a categoria selecionada.
    tab:
      search.tab === "new" || search.tab === "trending"
        ? search.tab
        : "all",

    // Valida o termo utilizado na pesquisa.
    q:
      typeof search.q === "string" &&
      search.q.length > 0
        ? search.q
        : undefined,
  }),

  component: App,
});
