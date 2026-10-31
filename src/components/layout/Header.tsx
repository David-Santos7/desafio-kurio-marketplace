
export function Header() {
  return (
    <header className="w-full border-b border-kurio-border">
      <div className="mx-auto flex h-[45px] w-full max-w-[1200px] items-center justify-between px-6 xl:px-0">

        {/* Logotipo */}
        <a
          href="/"
          className="w-[160px] text-[14px] font-bold tracking-[1.4px] text-kurio-text"
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
            className="font-bold text-kurio-accent"
          >
            Início
          </a>

          <span className="text-kurio-text">Mercado</span>
          <span className="text-kurio-text">Criadores</span>
          <span className="text-kurio-text">Aprenda</span>
        </nav>

        {/* Espaço reservado para as ações do usuário */}
        <div className="hidden w-[160px] lg:block" aria-hidden="true" />

      </div>
    </header>
  );
}
