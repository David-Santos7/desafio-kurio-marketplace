
import { Heart } from "lucide-react";

// Propriedades recebidas pelo componente
type MobileNftCardProps = {
  image: string;
  name: string;
  priceEth: string;
  isRare?: boolean;
  isFavorite: boolean;
  onToggleFavorite: () => void;
};

export function MobileNftCard({
  image,
  name,
  priceEth,
  isRare = false,
  isFavorite,
  onToggleFavorite,
}: MobileNftCardProps) {
  return (
    <article className="flex min-w-0 flex-col gap-2">

      {/* Área da imagem */}
      <div className="relative flex h-[200px] w-full items-center justify-center rounded-[20px] bg-gradient-to-br from-kurio-card to-kurio-raised">

        {/* Imagem principal do NFT */}
        <img
          src={image}
          alt={`Arte digital do NFT ${name}`}
          loading="lazy"
          className="h-[168px] w-[calc(100%-8px)] rounded-[16px] object-cover"
        />

        {/* Botão de adicionar ou remover dos favoritos */}
        <button
          type="button"
          onClick={onToggleFavorite}
          aria-pressed={isFavorite}
          aria-label={
            isFavorite
              ? `Remover ${name} dos favoritos`
              : `Adicionar ${name} aos favoritos`
          }
          className="absolute right-0 top-1 z-10 flex h-11 w-11 items-center justify-center rounded-full transition-transform active:scale-95 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kurio-accent"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full bg-kurio-card/90 transition-colors duration-200 ${
              isFavorite
                ? "text-kurio-accent"
                : "text-kurio-secondary"
            }`}
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
          <span className="absolute left-0 top-4 flex h-8 w-[68px] items-center bg-kurio-primary pl-2 text-[13px] font-medium text-kurio-bg">
            RARO
          </span>
        )}
      </div>

      {/* Informações do NFT */}
      <div className="flex flex-col pl-2">
        <h3 className="truncate text-[15px] font-normal leading-5 text-kurio-text">
          {name}
        </h3>

        <p className="text-[16px] font-bold leading-4 text-kurio-accent">
          {priceEth} ETH
        </p>
      </div>
    </article>
  );
}
