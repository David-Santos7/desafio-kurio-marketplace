import { Button } from "@/components/ui/button";

function App() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-kurio-bg p-6">
      <div className="w-full max-w-xl rounded-xl border border-kurio-border bg-kurio-card p-8 text-center">
        <h1 className="mb-4 text-4xl font-bold text-kurio-primary">
          KURIO
        </h1>

        <p className="mb-6 text-lg text-kurio-text">
          Marketplace de NFTs
        </p>

        <p className="mb-8 text-sm text-kurio-muted">
          Desafio Front-End da Jungle Gaming
        </p>


        <Button
          type="button" className="bg-kurio-primary text-kurio-bg hover:bg-kurio-primary/90">
            Explorar NFTs
        </Button>

      </div>
    </main>
  );
}

export default App;

