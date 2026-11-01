
import { Link } from "@tanstack/react-router";
import { Check, Heart, ShoppingCart } from "lucide-react";

type MobileNftCardProps = {
  nftId: string;
  image: string;
  name: string;
  priceEth: string;
  isRare?: boolean;

  isFavorite: boolean;
  onToggleFavorite: () => void;

  isInCart: boolean;
  onToggleCart: () => void;
};

export function MobileNftCard({
  nftId,
  image,
  name,
  priceEth,
  isRare = false,
  isFavorite,
  onToggleFavorite,
  isInCart,
  onToggleCart,
}: MobileNftCardProps) {
  return (
    <article className="flex min-w-0 flex-col gap-2 lg:gap-3">
      {/* Imagem do NFT */}
      <div
        className="
          relative flex h-[200px] w-full
          items-center justify-center
          rounded-[20px]
          bg-gradient-to-br
          from-kurio-card to-kurio-raised
          lg:h-[270px]
        "
      >
        {/* Navegação para detalhes */}
        <Link
          to="/nft/$nftId"
          params={{ nftId }}
          aria-label={`Ver detalhes de ${name}`}
          className="
            flex h-full w-full
            items-center justify-center
            rounded-[20px]
            focus-visible:outline-2
            focus-visible:outline-kurio-accent
          "
        >
          <img
            src={image}
            alt={`Arte digital do NFT ${name}`}
            loading="lazy"
            className="
              h-[168px] w-[calc(100%-8px)]
              rounded-[16px] object-cover
              lg:h-[238px]
            "
          />
        </Link>

        {/* Favoritos */}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remover ${name} dos favoritos`
              : `Adicionar ${name} aos favoritos`
          }
          className="
            absolute right-0 top-1 z-10
            flex h-11 w-11
            items-center justify-center
            rounded-full
            transition-transform active:scale-95
            focus-visible:outline-2
            focus-visible:outline-kurio-accent
          "
        >
          <span
            className={`
              flex h-7 w-7
              items-center justify-center
              rounded-full bg-kurio-card/90
              ${
                isFavorite
                  ? "text-kurio-accent"
                  : "text-kurio-secondary"
              }
            `}
          >
            <Heart
              aria-hidden="true"
              className="h-[18px] w-[18px]"
              fill={isFavorite ? "currentColor" : "none"}
              strokeWidth={2.2}
            />
          </span>
        </button>

        {/* Selo de raridade */}
        {isRare && (
          <span
            className="
              pointer-events-none
              absolute left-0 top-4 z-10
              flex h-8 w-[68px]
              items-center
              bg-kurio-primary pl-2
              text-[13px] font-medium
              text-kurio-bg
            "
          >
            RARO
          </span>
        )}

        {/* Carrinho */}
        <button
          type="button"
          onClick={onToggleCart}
          aria-pressed={isInCart}
          aria-label={
            isInCart
              ? `Remover ${name} do carrinho`
              : `Adicionar ${name} ao carrinho`
          }
          className={`
            absolute bottom-4 right-2 z-10
            flex h-11 w-11
            items-center justify-center
            rounded-full
            transition-colors duration-200
            active:scale-95
            focus-visible:outline-2
            focus-visible:outline-kurio-accent
            ${
              isInCart
                ? "bg-kurio-primary text-kurio-bg"
                : "bg-kurio-card/90 text-kurio-secondary"
            }
          `}
        >
          {isInCart ? (
            <Check
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2.5}
            />
          ) : (
            <ShoppingCart
              aria-hidden="true"
              className="h-5 w-5"
              strokeWidth={2}
            />
          )}
        </button>
      </div>

      {/* Informações do NFT */}
      <div className="flex flex-col gap-1 pl-2">
        <h3
          className="
            truncate text-[15px]
            font-normal leading-5
            text-kurio-text
            lg:text-[17px] lg:leading-6
          "
        >
          <Link
            to="/nft/$nftId"
            params={{ nftId }}
            className="
              block truncate
              transition-colors
              hover:text-kurio-accent
              focus-visible:outline-2
              focus-visible:outline-kurio-accent
            "
          >
            {name}
          </Link>
        </h3>

        <p
          className="
            text-[16px] font-bold
            leading-4 text-kurio-accent
            lg:text-[18px] lg:leading-6
          "
        >
          {priceEth} ETH
        </p>
      </div>
    </article>
  );
}
