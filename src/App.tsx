
import { Header } from "@/components/layout/Header";
import { MobileSearchBar } from "@/components/home/MobileSearchBar";
import { MobileHeroBanner } from "@/components/home/MobileHeroBanner";
import { Button } from "@/components/ui/button";
import { MobileNftTabs } from "@/components/home/MobileNftTabs";

function App() {
  return (
    <div className="min-h-screen bg-kurio-bg text-kurio-text">

      {/* Header desktop */}
      <div className="hidden pt-6 lg:block">
        <Header />
      </div>

      {/* Página inicial mobile */}
      <div className="px-6 pt-10 lg:hidden">
        <div className="mx-auto flex w-full max-w-[366px] flex-col gap-4">

          
          <MobileSearchBar />

          <MobileHeroBanner />

          <MobileNftTabs />


        </div>
      </div>

      {/* Conteúdo temporário desktop */}
      <main className="hidden min-h-[calc(100vh-69px)] items-center justify-center px-6 lg:flex">
        <section className="w-full max-w-xl rounded-2xl border border-kurio-border bg-kurio-card p-10 text-center">

          <h1 className="text-4xl font-bold text-kurio-primary">
            KURIO
          </h1>

          <h2 className="mt-4 text-lg font-semibold">
            Marketplace de NFTs
          </h2>

          <p className="mt-6 text-sm text-kurio-muted">
            Desafio Front-End da Jungle Gaming
          </p>

          <Button
            type="button"
            className="mt-8 bg-kurio-primary text-kurio-bg hover:bg-kurio-primary/90"
          >
            Explorar NFTs
          </Button>

        </section>
      </main>
    </div>
  );
}

export default App;
