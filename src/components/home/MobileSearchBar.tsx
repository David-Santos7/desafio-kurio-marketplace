
import { useState } from "react";
import { useNavigate, useSearch } from "@tanstack/react-router";

import searchIcon from "@/assets/icons/search-mobile.svg";
import filterIcon from "@/assets/icons/filter-mobile.svg";

// Opções disponíveis de ordenação.
const sortOptions = [
  { value: "default", label: "Ordem original" },
  { value: "price-asc", label: "Menor preço" },
  { value: "price-desc", label: "Maior preço" },
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

export function MobileSearchBar() {
  // Lê a pesquisa e a ordenação da URL.
  const { q, sort } = useSearch({
    from: "/",
  });

  const navigate = useNavigate({
    from: "/",
  });

  // Controla a abertura do menu.
  const [isSortOpen, setIsSortOpen] = useState(false);

  // Atualiza o termo de pesquisa.
  function handleSearch(value: string): void {
    void navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        q: value.length > 0 ? value : undefined,
      }),
      replace: true,
      resetScroll: false,
    });
  }

  // Atualiza a ordenação dos NFTs.
  function handleSort(value: SortOption): void {
    const selectedSort =
      value === "default" ? undefined : value;

    void navigate({
      to: "/",
      search: (prev) => ({
        ...prev,
        sort: selectedSort,
      }),
      resetScroll: false,
    });

    setIsSortOpen(false);
  }

  return (
    <div className="relative z-30 flex h-[45px] w-full items-center gap-2">

      {/* Campo de pesquisa */}
      <label className="flex h-[45px] min-w-0 flex-1 items-center gap-2 rounded-[10px] bg-kurio-card px-3">
        <img
          src={searchIcon}
          alt=""
          className="h-[22px] w-[22px] shrink-0"
        />

        <input
          type="search"
          aria-label="Explorar coleções"
          placeholder="Explorar coleções"
          value={q ?? ""}
          onChange={(event) =>
            handleSearch(event.currentTarget.value)
          }
          className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-kurio-text outline-none placeholder:text-kurio-secondary"
        />
      </label>

      {/* Botão de ordenação */}
      <button
        type="button"
        aria-label="Ordenar NFTs"
        aria-expanded={isSortOpen}
        aria-controls="mobile-sort-options"
        onClick={() =>
          setIsSortOpen((current) => !current)
        }
        className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[14px] bg-kurio-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kurio-accent"
      >
        <img
          src={filterIcon}
          alt=""
          className="h-[22px] w-[22px]"
        />
      </button>

      {/* Opções de ordenação */}
      {isSortOpen && (
        <div
          id="mobile-sort-options"
          role="group"
          aria-label="Opções de ordenação"
          className="absolute right-0 top-[53px] z-40 flex w-[180px] flex-col gap-1 rounded-[12px] border border-kurio-primary bg-kurio-card p-2 shadow-lg"
        >
          {sortOptions.map((option) => {
            const isSelected =
              (sort ?? "default") === option.value;

            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={isSelected}
                onClick={() => handleSort(option.value)}
                className={`rounded-[8px] px-3 py-2 text-left text-[12px] transition-colors ${
                  isSelected
                    ? "bg-kurio-primary font-bold text-kurio-bg"
                    : "text-kurio-text hover:bg-kurio-raised"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
