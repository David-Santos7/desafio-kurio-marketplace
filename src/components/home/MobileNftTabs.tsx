
import {
  useNavigate,
  useSearch,
} from "@tanstack/react-router";

const categories = [
  { label: "Todos os NFTs", value: "all" },
  { label: "Novos lançamentos", value: "new" },
  { label: "Em alta", value: "trending" },
] as const;

export function MobileNftTabs() {
  // Lê a categoria selecionada na URL.
  const { tab: activeCategory } = useSearch({
    from: "/",
  });

  // Permite atualizar a URL.
  const navigate = useNavigate({
    from: "/",
  });

  return (
    <nav aria-label="Categorias de NFTs" className="w-full">
      <div className="flex items-start gap-4 overflow-x-auto">
        {categories.map((category) => {
          const isActive = activeCategory === category.value;

          return (
            <button
              key={category.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => {
                void navigate({
                  to: "/",
                  search: (prev) => ({
                    ...prev,
                    tab: category.value,
                  }),
                  resetScroll: false,
                });
              }}
              className={`relative shrink-0 pb-[6px] text-[14px] leading-4 whitespace-nowrap transition-colors ${
                isActive
                  ? "font-bold text-kurio-accent"
                  : "font-normal text-kurio-text"
              }`}
            >
              {category.label}

              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-kurio-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
