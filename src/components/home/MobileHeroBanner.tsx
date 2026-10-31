
import heroBackground from "@/assets/mobile/hero-background.svg";
import nftMain from "@/assets/mobile/hero-nft-main.png";
import nftSecondary from "@/assets/mobile/hero-nft-secondary.png";
import arrowIcon from "@/assets/mobile/hero-arrow.svg";
import dotsIcon from "@/assets/mobile/hero-dots.svg";

export function MobileHeroBanner() {
  return (
    <section
      aria-label="Destaque do marketplace"
      className="relative h-[190px] w-full overflow-hidden rounded-[12px] bg-kurio-surface"
    >
      {/* Fundo original do Figma */}
      <img
        src={heroBackground}
        alt=""
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* Conteúdo textual */}
      <div className="absolute left-4 top-2 z-10 w-[190px]">
        <p className="text-[12px] font-medium leading-4 text-kurio-text">
          Bem-vindo à Kurio
        </p>

        <h2 className="mt-[6px] text-[18px] font-bold leading-[29px] text-kurio-text">
          SEJA DONO DA
          <br />
          CULTURA DIGITAL
        </h2>

        <p className="mt-[6px] text-[12px] leading-[18px] text-kurio-muted">
          Descubra NFTs selecionados de criadores do mundo todo.
        </p>

        {/* Chamada visual, sem navegação nesta etapa */}
        <span className="flex items-center gap-2 text-[12px] font-bold leading-[14px] text-kurio-accent">
          EXPLORAR
          <img
            src={arrowIcon}
            alt=""
            className="h-4 w-4"
          />
        </span>
      </div>

      {/* Imagens dos NFTs */}
      <div className="absolute right-4 top-[11px] h-[146px] w-[138px]">
        <img
          src={nftMain}
          alt="NFT de personagem com óculos verdes"
          className="h-[138px] w-[138px] rounded-2xl object-cover"
        />

        <img
          src={nftSecondary}
          alt="NFT de personagem com chapéu"
          className="absolute left-[14px] top-[88px] h-[58px] w-[58px] rounded-2xl object-cover"
        />
      </div>

      {/* Indicadores visuais do carrossel */}
      <img
        src={dotsIcon}
        alt=""
        className="absolute bottom-[6px] left-1/2 h-[7px] w-[33px] -translate-x-1/2"
      />
    </section>
  );
}
