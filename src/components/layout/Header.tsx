
import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  Link,
  useNavigate,
} from "@tanstack/react-router";

import { useQuery } from "@tanstack/react-query";

import {
  LogIn,
  Search,
  ShoppingCart,
  UserRound,
  X,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

import {
  authService,
  getAccessToken,
} from "@/services/authService";

// ==========================================
// KURIO MARKETPLACE — HEADER DESKTOP
// ==========================================

export function Header() {
  const navigate = useNavigate();

  const { cartCount } = useCart();

  const [isSearchOpen, setIsSearchOpen] =
    useState(false);

  const [searchTerm, setSearchTerm] =
    useState("");

  const searchInputRef =
    useRef<HTMLInputElement>(null);

  // ========================================
  // AUTENTICAÇÃO
  // ========================================

  const token = getAccessToken();

  const { data: session } = useQuery({
    queryKey: ["auth", "session"],
    queryFn: authService.getSession,
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  const isAuthenticated = Boolean(
    token && session?.user
  );

  // ========================================
  // FOCO AUTOMÁTICO NA BUSCA
  // ========================================

  useEffect(() => {
    if (isSearchOpen) {
      searchInputRef.current?.focus();
    }
  }, [isSearchOpen]);

  // ========================================
  // ABRIR / FECHAR BUSCA
  // ========================================

  function toggleSearch(): void {
    setIsSearchOpen((previous) => !previous);
  }

  // ========================================
  // PESQUISAR NFTs
  // ========================================

  function handleSearch(
    event: FormEvent<HTMLFormElement>
  ): void {
    event.preventDefault();

    const query = searchTerm.trim();

    setIsSearchOpen(false);

    void navigate({
      to: "/",
      search: {
        tab: "all",
        ...(query ? { q: query } : {}),
      },
    });
  }

  // ========================================
  // INTERFACE
  // ========================================

  return (
    <header className="w-full">
      <div className="mx-auto w-full max-w-[1200px] px-6 xl:px-0">

        {/* LINHA PRINCIPAL */}

        <div className="relative flex h-[45px] items-center justify-between">

          {/* LOGOTIPO */}

          <Link
            to="/"
            search={{ tab: "all" }}
            aria-label="KURIO — Página inicial"
            className="flex h-[34px] w-[160px] shrink-0 items-center text-[14px] font-bold tracking-[1.4px] text-kurio-text hover:text-kurio-accent"
          >
            KURIO
          </Link>

          {/* NAVEGAÇÃO PRINCIPAL */}

          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-10 lg:flex"
          >

            <Link
              to="/"
              search={{ tab: "all" }}
              className="relative text-[16px] font-bold text-kurio-accent after:absolute after:-bottom-[11px] after:left-0 after:h-[2px] after:w-full after:bg-kurio-primary"
            >
              Início
            </Link>

            <Link
              to="/"
              search={{ tab: "all" }}
              className="text-[16px] text-kurio-text transition-colors hover:text-kurio-accent"
            >
              Mercado
            </Link>

            <span
              title="Área de criadores em desenvolvimento"
              className="text-[16px] text-kurio-text"
            >
              Criadores
            </span>

            <span
              title="Área de aprendizado em desenvolvimento"
              className="text-[16px] text-kurio-text"
            >
              Aprenda
            </span>

          </nav>

          {/* AÇÕES DO USUÁRIO */}

          <div className="hidden items-center gap-7 lg:flex">

            {/* PESQUISA */}

            <button
              type="button"
              aria-label={
                isSearchOpen
                  ? "Fechar pesquisa"
                  : "Pesquisar NFTs"
              }
              aria-expanded={isSearchOpen}
              aria-controls="desktop-nft-search"
              onClick={toggleSearch}
              className="flex h-8 w-8 items-center justify-center text-kurio-text transition-colors hover:text-kurio-primary"
            >
              {isSearchOpen ? (
                <X
                  size={20}
                  strokeWidth={1.8}
                />
              ) : (
                <Search
                  size={20}
                  strokeWidth={1.8}
                />
              )}
            </button>

            {/* CARRINHO */}

            <Link
              to="/"
              search={{ tab: "cart" }}
              aria-label={`Abrir carrinho com ${cartCount} NFTs`}
              className="relative flex h-8 w-8 items-center justify-center text-kurio-text transition-colors hover:text-kurio-primary"
            >
              <ShoppingCart
                size={24}
                strokeWidth={1.8}
              />

              {cartCount > 0 && (
                <span
                  aria-hidden="true"
                  className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-kurio-primary px-[3px] text-[10px] font-medium leading-none text-kurio-bg"
                >
                  {cartCount > 99
                    ? "99+"
                    : cartCount}
                </span>
              )}
            </Link>

            {/* LOGIN / PERFIL */}

            {isAuthenticated ? (
              <Link
                to="/profile"
                aria-label="Abrir meu perfil"
                className="flex h-[35px] min-w-[100px] items-center justify-center gap-1 rounded-[6px] bg-kurio-primary px-3 text-[14px] font-medium text-kurio-bg transition-colors hover:bg-kurio-primary/90"
              >
                <UserRound size={19} />
                Perfil
              </Link>
            ) : (
              <Link
                to="/login"
                className="flex h-[35px] w-[100px] items-center justify-center gap-1 rounded-[6px] bg-kurio-primary px-2 text-[16px] font-medium text-kurio-bg transition-colors hover:bg-kurio-primary/90"
              >
                <LogIn size={20} />
                Entrar
              </Link>
            )}

          </div>

          {/* ================================= */}
          {/* PAINEL DE BUSCA */}
          {/* ================================= */}

          {isSearchOpen && (
            <form
              id="desktop-nft-search"
              role="search"
              onSubmit={handleSearch}
              className="absolute right-0 top-[52px] z-50 flex w-[360px] max-w-[calc(100vw-3rem)] items-center gap-2 rounded-[12px] border border-kurio-border bg-kurio-card p-3 shadow-xl"
            >
              <Search
                size={18}
                className="shrink-0 text-kurio-accent"
              />

              <input
                ref={searchInputRef}
                type="search"
                value={searchTerm}
                onChange={(event) =>
                  setSearchTerm(
                    event.target.value
                  )
                }
                onKeyDown={(event) => {
                  if (event.key === "Escape") {
                    setIsSearchOpen(false);
                  }
                }}
                placeholder="Pesquisar NFTs..."
                aria-label="Nome do NFT"
                className="h-[36px] min-w-0 flex-1 bg-transparent text-[13px] text-kurio-text outline-none placeholder:text-kurio-secondary"
              />

              <button
                type="submit"
                className="h-[36px] rounded-[7px] bg-kurio-primary px-3 text-[12px] font-bold text-kurio-bg hover:bg-kurio-primary/90"
              >
                Buscar
              </button>
            </form>
          )}

        </div>

        {/* LINHA DIVISÓRIA */}

        <div
          className="h-px w-full bg-kurio-border"
          aria-hidden="true"
        />

      </div>
    </header>
  );
}
