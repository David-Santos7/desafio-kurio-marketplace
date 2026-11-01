
import { Header } from "@/components/layout/Header";
import { MobileBottomNav } from "@/components/layout/MobileBottomNav";

import { MobileSearchBar } from "@/components/home/MobileSearchBar";
import { MobileHeroBanner } from "@/components/home/MobileHeroBanner";
import { MobileNftTabs } from "@/components/home/MobileNftTabs";
import { MobileNftGrid } from "@/components/home/MobileNftGrid";

// Imagens originais da KURIO
import emeraldApe from "@/assets/mobile/hero-nft-main.png";
import sageNomad from "@/assets/mobile/hero-nft-secondary.png";

function App() {
  return (
    <div className="min-h-screen bg-kurio-bg text-kurio-text">

      {/* Header exibido somente no desktop */}
      <header className="hidden pt-6 lg:block">
        <Header />
      </header>

      {/* Conteúdo principal da aplicação */}
      <main className="mx-auto w-full max-w-[1248px] px-6 pt-10 pb-[150px] lg:pb-20">

        <div className="mx-auto flex w-full max-w-[366px] flex-col gap-4 lg:max-w-[1200px] lg:gap-8">

          {/* Banner principal do desktop */}
          <section
            aria-labelledby="desktop-hero-title"
            className="hidden overflow-hidden rounded-[28px] border border-kurio-border bg-gradient-to-r from-kurio-card to-kurio-raised lg:order-1 lg:grid lg:min-h-[370px] lg:grid-cols-2"
          >
            {/* Conteúdo textual */}
            <div className="flex flex-col items-start justify-center gap-6 px-12 py-12">

              <span className="text-[13px] font-bold uppercase tracking-[0.2em] text-kurio-accent">
                KURIO NFT Marketplace
              </span>

              <h1
                id="desktop-hero-title"
                className="max-w-[520px] text-[42px] font-bold leading-[1.15] text-kurio-text xl:text-[50px]"
              >
                Seja dono da
                <span className="block text-kurio-accent">
                  cultura digital.
                </span>
              </h1>

              <p className="max-w-[440px] text-[14px] leading-7 text-kurio-secondary">
                Descubra coleções digitais, explore NFTs
                exclusivos e encontre novas oportunidades
                no universo da cultura digital.
              </p>

              <a
                href="#catalogo-nfts"
                className="inline-flex h-12 items-center justify-center rounded-[12px] bg-kurio-primary px-7 text-[14px] font-bold text-kurio-bg transition-colors hover:bg-kurio-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-kurio-accent"
              >
                Explorar NFTs
              </a>
            </div>

            {/* Imagens do banner desktop */}
            <div className="relative flex min-h-[340px] items-center justify-center gap-5 overflow-hidden px-6">

              <img
                src={emeraldApe}
                alt="Arte digital Emerald Ape"
                className="relative z-10 h-[260px] w-[200px] -rotate-6 rounded-[20px] border border-kurio-border object-cover shadow-2xl"
              />

              <img
                src={sageNomad}
                alt="Arte digital Sage Nomad"
                className="relative h-[235px] w-[180px] rotate-6 rounded-[20px] border border-kurio-border object-cover shadow-2xl"
              />

            </div>
          </section>

          {/* Título da seção do catálogo desktop */}
          <section className="hidden lg:order-2 lg:block">
            <h2 className="text-[28px] font-bold text-kurio-text">
              Explore nossos NFTs
            </h2>

            <p className="mt-2 text-[13px] text-kurio-secondary">
              Encontre coleções e ativos digitais exclusivos.
            </p>
          </section>

          {/* Pesquisa e ordenação compartilhadas */}
          <div className="order-1 w-full lg:order-3 lg:max-w-[520px]">
            <MobileSearchBar />
          </div>

          {/* Banner original da versão mobile */}
          <div className="order-2 lg:hidden">
            <MobileHeroBanner />
          </div>

          {/* Categorias compartilhadas */}
          <div className="order-3 w-full lg:order-4">
            <MobileNftTabs />
          </div>

          {/* Catálogo compartilhado entre mobile e desktop */}
          <div
            id="catalogo-nfts"
            className="order-4 w-full lg:order-5"
          >
            <MobileNftGrid />
          </div>

        </div>
      </main>

      {/* Navegação fixa exclusiva do mobile */}
      <MobileBottomNav />

    </div>
  );
}

export default App;
