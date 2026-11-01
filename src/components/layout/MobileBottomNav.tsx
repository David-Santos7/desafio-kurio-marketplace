
import { Link, useSearch } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Heart,
  ShoppingCart,
} from "lucide-react";

import { useCart } from "@/context/CartContext";

import {
  authService,
  getAccessToken,
} from "@/services/authService";

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
  const { tab } = useSearch({
    from: "/",
  });

  const { cartCount } = useCart();

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

  const isFavoritesView = tab === "favorites";
  const isCartView = tab === "cart";

  const isHomeView =
    !isFavoritesView && !isCartView;

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

        {/* Elementos visuais do scanner */}
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

        {/* Início */}
        <Link
          to="/"
          search={{ tab: "all", q: undefined }}
          aria-label="Início"
          aria-current={
            isHomeView ? "page" : undefined
          }
          className="absolute left-[6%] top-[60px] flex h-11 w-11 items-center justify-center"
        >
          <img
            src={homeIcon}
            alt=""
            className={`h-5 w-5 ${
              isHomeView ? "opacity-100" : "opacity-60"
            }`}
          />
        </Link>

        {/* Favoritos */}
        <Link
          to="/"
          search={{ tab: "favorites", q: undefined }}
          aria-label="Meus favoritos"
          aria-current={
            isFavoritesView ? "page" : undefined
          }
          className="absolute left-[24%] top-[60px] flex h-11 w-11 items-center justify-center"
        >
          {isFavoritesView ? (
            <Heart
              aria-hidden="true"
              className="h-5 w-5 fill-current text-kurio-accent"
            />
          ) : (
            <img
              src={heartIcon}
              alt=""
              className="h-5 w-5"
            />
          )}
        </Link>

        {/* Scanner decorativo */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-0 h-[65px] w-[65px] -translate-x-1/2"
        />

        {/* Carrinho */}
        <Link
          to="/"
          search={{ tab: "cart", q: undefined }}
          aria-label={`Meu carrinho: ${cartCount} itens`}
          aria-current={
            isCartView ? "page" : undefined
          }
          className="absolute left-[68%] top-[60px] flex h-11 w-11 items-center justify-center"
        >
          {isCartView ? (
            <ShoppingCart
              aria-hidden="true"
              className="h-5 w-5 text-kurio-accent"
              strokeWidth={2.5}
            />
          ) : (
            <img
              src={cartIcon}
              alt=""
              className="h-5 w-5"
            />
          )}

          {cartCount > 0 && (
            <span
              aria-hidden="true"
              className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-kurio-primary px-1 text-[9px] font-bold text-kurio-bg"
            >
              {cartCount > 99 ? "99+" : cartCount}
            </span>
          )}
        </Link>

        {/* Login / Perfil — agora funcional */}
        <Link
          to={isAuthenticated ? "/profile" : "/login"}
          aria-label={
            isAuthenticated
              ? "Abrir meu perfil"
              : "Entrar na minha conta"
          }
          className="absolute left-[83%] top-[60px] flex h-11 w-11 items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-kurio-accent"
        >
          <img
            src={userIcon}
            alt=""
            className="h-5 w-5"
          />
        </Link>

      </div>
    </nav>
  );
}
