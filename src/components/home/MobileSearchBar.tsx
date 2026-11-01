
import {
  useNavigate,
  useSearch,
} from "@tanstack/react-router";

import searchIcon from "@/assets/icons/search-mobile.svg";
import filterIcon from "@/assets/icons/filter-mobile.svg";

export function MobileSearchBar() {
  // Obtém o termo de pesquisa atual da URL.
  const { q } = useSearch({
    from: "/",
  });

  // Permite atualizar a URL.
  const navigate = useNavigate({
    from: "/",
  });

  // Atualiza a pesquisa conforme o usuário digita.
  function handleSearch(value: string) {
    void navigate({
      to: "/",

      search: (prev) => ({
        ...prev,
        q: value.length > 0 ? value : undefined,
      }),

      // Não cria um registro no histórico
      // para cada letra digitada.
      replace: true,

      // Mantém a posição atual da página.
      resetScroll: false,
    });
  }

  return (
    <div className="flex h-[45px] w-full items-center gap-2">
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
          onChange={(event) => {
            handleSearch(event.currentTarget.value);
          }}
          className="min-w-0 flex-1 bg-transparent text-[14px] font-bold text-kurio-text outline-none placeholder:text-kurio-secondary"
        />
      </label>

      {/* Botão de filtros — funcionalidade futura */}
      <button
        type="button"
        disabled
        aria-label="Filtros em implementação"
        className="flex h-[45px] w-[45px] shrink-0 items-center justify-center rounded-[14px] bg-kurio-primary disabled:opacity-100"
      >
        <img
          src={filterIcon}
          alt=""
          className="h-[22px] w-[22px]"
        />
      </button>
    </div>
  );
}
