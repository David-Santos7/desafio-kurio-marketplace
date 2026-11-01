
import { createFileRoute } from "@tanstack/react-router";
import App from "@/App";

type NftCategory =
  | "all"
  | "new"
  | "trending"
  | "favorites"
  | "cart";

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
      search.tab === "favorites" ||
      search.tab === "cart"
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
