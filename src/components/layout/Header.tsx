
import { LogIn, Search, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Header() {
  // Quantidade ilustrativa utilizada no Figma
  // Futuramente será obtida do estado do carrinho.
  const cartCount = 6;

  return (
    <header className="w-full">
      <div className="mx-auto w-full max-w-[1200px] px-6 xl:px-0">

        {/* Linha principal do cabeçalho */}
        <div className="flex h-[45px] items-center justify-between">

          {/* Logotipo */}
          <a
            href="/"
            className="flex h-[34px] w-[160px] shrink-0 items-center text-[14px] font-bold tracking-[1.4px] text-kurio-text"
          >
            KURIO
          </a>

          {/* Navegação principal */}
          <nav
            aria-label="Navegação principal"
            className="hidden items-center gap-10 lg:flex"
          >
            <a
              href="/"
              aria-current="page"
              className="relative text-[16px] font-bold text-kurio-accent after:absolute after:-bottom-[11px] after:left-0 after:h-[2px] after:w-full after:bg-kurio-primary"
            >
              Início
            </a>

            <span className="text-[16px] text-kurio-text">
              Mercado
            </span>

            <span className="text-[16px] text-kurio-text">
              Criadores
            </span>

            <span className="text-[16px] text-kurio-text">
              Aprenda
            </span>
          </nav>

          {/* Ações do usuário */}
          <div className="hidden items-center gap-7 lg:flex">

            {/* Pesquisa */}
            <button
              type="button"
              aria-label="Pesquisar NFTs"
              className="flex h-8 w-8 items-center justify-center text-kurio-text hover:text-kurio-primary"
            >
              <Search size={20} strokeWidth={1.8} />
            </button>

            {/* Carrinho */}
            <button
              type="button"
              aria-label={`Carrinho com ${cartCount} NFTs`}
              className="relative flex h-8 w-8 items-center justify-center text-kurio-text hover:text-kurio-primary"
            >
              <ShoppingCart size={24} strokeWidth={1.8} />

              <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-kurio-primary px-[3px] text-[10px] font-medium leading-none text-kurio-bg">
                {cartCount}
              </span>
            </button>

            {/* Botão de login */}
            <Button
              type="button"
              className="h-[35px] w-[100px] gap-1 rounded-[6px] bg-kurio-primary px-2 text-[16px] font-medium text-kurio-bg hover:bg-kurio-primary/90"
            >
              <LogIn size={20} />
              Entrar
            </Button>

          </div>
        </div>

        {/* Linha divisória do Header */}
        <div
          className="h-px w-full bg-kurio-border"
          aria-hidden="true"
        />

      </div>
    </header>
  );
}
