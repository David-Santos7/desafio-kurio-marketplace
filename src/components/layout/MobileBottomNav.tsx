
import { Link, useSearch } from "@tanstack/react-router";
import { Heart } from "lucide-react";

// Elementos visuais originais do Figma
import background from "@/assets/mobile/navigation/background.svg";
import circle from "@/assets/mobile/navigation/circle.svg";

import homeIcon from "@/assets/mobile/navigation/home.svg";
import heartIcon from "@/assets/mobile/navigation/heart.svg";
import cartIcon from "@/assets/mobile/navigation/cart.svg";
import userIcon from "@/assets/mobile/navigation/user.svg";

import scan1 from "@/assets/mobile/navigation/scan-1.svg";
import scan2 from "@/assets/mobile/navigation/scan-2.svg";
import scan3 from "@/assets/mobile/navigation/scan-3.svg";
import scan4 from "@/assets/mobile/navigation/scan-4.svg";
import scan5 from "@/assets/mobile/navigation/scan-5.svg";

export function MobileBottomNav() {
  // Identifica a visualização atual pela URL.
  const { tab } = useSearch({
    from: "/",
  });

  const isFavoritesView = tab === "favorites";

  return (
    <nav
      aria-label="Navegação inferior"
      className="fixed inset-x-0 bottom-0 z-50 h-[126px] lg:hidden"
    >
      <div className="relative h-full w-full overflow-hidden">

        {/* Fundo original do Figma */}
        <div className="pointer-events-none absolute inset-[24.6%_0_0.04%_0]">
          <div className="absolute inset-[-42.13%_-7.25%_-21.06%_-7.25%]">
            <img
              src={background}
              alt=""
              className="h-full w-full"
            />
          </div>
        </div>

        {/* Círculo central */}
        <img
          src={circle}
          alt=""
          className="pointer-events-none absolute left-1/2 top-0 h-[65px] w-[65px] -translate-x-1/2"
        />

        {/* Ícone central composto pelos SVGs */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0"
        >
          <img
            src={scan1}
            alt=""
            className="absolute inset-[25.48%_46.66%_73.1%_46.86%] h-auto w-auto"
          />

          <img
            src={scan2}
            alt=""
            className="absolute inset-[27.53%_50.32%_64.29%_47.18%] h-auto w-auto"
          />

          <img
            src={scan3}
            alt=""
            className="absolute inset-[16.73%_46.98%_75.09%_50.51%] h-auto w-auto"
          />

          <img
            src={scan4}
            alt=""
            className="absolute inset-[27.54%_47%_64.33%_50.51%] h-auto w-auto"
          />

          <img
            src={scan5}
            alt=""
            className="absolute inset-[16.67%_50.31%_75.15%_47.18%] h-auto w-auto"
          />
        </div>

        {/* Início: retorna ao catálogo completo */}
        <Link
          to="/"
          search={{
            tab: "all",
            q: undefined,
          }}
          aria-label="Início"
          aria-current={
            isFavoritesView ? undefined : "page"
          }
          className="absolute left-[6%] top-[60px] flex h-11 w-11 items-center justify-center"
        >
          <img
            src={homeIcon}
            alt=""
            className={`h-5 w-5 transition-opacity ${
              isFavoritesView
                ? "opacity-60"
                : "opacity-100"
            }`}
          />
        </Link>

        {/* Favoritos: abre os NFTs favoritados */}
        <Link
          to="/"
          search={{
            tab: "favorites",
            q: undefined,
          }}
          aria-label="Meus favoritos"
          aria-current={
            isFavoritesView ? "page" : undefined
          }
          className="absolute left-[24%] top-[60px] flex h-11 w-11 items-center justify-center transition-transform active:scale-95 focus-visible:rounded-full focus-visible:outline-2 focus-visible:outline-kurio-accent"
        >
          {isFavoritesView ? (
            <Heart
              aria-hidden="true"
              className="h-5 w-5 fill-current text-kurio-accent"
              strokeWidth={2.2}
            />
          ) : (
            <img
              src={heartIcon}
              alt=""
              className="h-5 w-5"
            />
          )}
        </Link>

        {/* Ação central — implementação futura */}
        <button
          type="button"
          disabled
          aria-label="Ação central em implementação"
          className="absolute left-1/2 top-0 h-[65px] w-[65px] -translate-x-1/2 disabled:opacity-100"
        />

        {/* Carrinho — implementação futura */}
        <button
          type="button"
          disabled
          aria-label="Carrinho em implementação"
          className="absolute left-[68%] top-[60px] flex h-11 w-11 items-center justify-center disabled:opacity-100"
        >
          <img
            src={cartIcon}
            alt=""
            className="h-5 w-5"
          />
        </button>

        {/* Perfil — implementação futura */}
        <button
          type="button"
          disabled
          aria-label="Perfil em implementação"
          className="absolute left-[83%] top-[60px] flex h-11 w-11 items-center justify-center disabled:opacity-100"
        >
          <img
            src={userIcon}
            alt=""
            className="h-5 w-5"
          />
        </button>
      </div>
    </nav>
  );
}
