
import { useState } from "react";

const categories = [
  "Todos os NFTs",
  "Novos lançamentos",
  "Em alta",
] as const;

type Category = (typeof categories)[number];

export function MobileNftTabs() {
  const [activeCategory, setActiveCategory] =
    useState<Category>("Todos os NFTs");

  return (
    <nav aria-label="Categorias de NFTs" className="w-full">
      <div className="flex items-start gap-4 overflow-x-auto">
        {categories.map((category) => {
          const isActive = activeCategory === category;

          return (
            <button
              key={category}
              type="button"
              aria-pressed={isActive}
              onClick={() => setActiveCategory(category)}
              className={`relative shrink-0 pb-[6px] text-[14px] leading-4 whitespace-nowrap transition-colors ${
                isActive
                  ? "font-bold text-kurio-accent"
                  : "font-normal text-kurio-text"
              }`}
            >
              {category}

              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute bottom-0 left-0 h-[2px] w-full bg-kurio-primary"
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
