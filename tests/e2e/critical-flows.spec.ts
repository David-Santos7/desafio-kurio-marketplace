
import { test, expect, type Page } from "@playwright/test";

// ==========================================
// KURIO — TESTES E2E DOS FLUXOS PRINCIPAIS
// ==========================================

// Abre o marketplace e aguarda a resposta
// HTTP da API simulada.
async function openCatalogue(page: Page) {
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nfts") &&
      response.request().method() === "GET" &&
      response.status() === 200
  );

  await page.goto("/");

  await responsePromise;
}

// ==========================================
// TESTE 1 — CATÁLOGO VIA API
// ==========================================

test("carrega os NFTs pela API simulada", async ({
  page,
}) => {
  await openCatalogue(page);

  const cards = page.locator(
    'section[aria-label="Catálogo de NFTs"] article'
  );

  await expect(cards).toHaveCount(4);

  await expect(
    page.getByRole("link", {
      name: "Ver detalhes de Emerald Ape #042",
    }).first()
  ).toBeVisible();
});

// ==========================================
// TESTE 2 — PESQUISA E ORDENAÇÃO
// ==========================================

test("pesquisa e ordena NFTs por preço", async ({
  page,
}) => {
  await openCatalogue(page);

  const search = page.getByRole("searchbox", {
    name: "Explorar coleções",
  });

  await search.fill("Nomad");

  const cards = page.locator(
    'section[aria-label="Catálogo de NFTs"] article'
  );

  await expect(cards).toHaveCount(2);

  await search.clear();

  await expect(cards).toHaveCount(4);

  await page.getByRole("button", {
    name: "Ordenar NFTs",
  }).click();

  await page.getByRole("button", {
    name: "Maior preço",
  }).click();

  await expect(cards.first()).toContainText(
    "1.69 ETH"
  );

  await expect(page).toHaveURL(
    /sort=price-desc/
  );
});

// ==========================================
// TESTE 3 — DETALHES E NFT INEXISTENTE
// ==========================================

test("abre detalhes e trata NFT inexistente", async ({
  page,
}) => {
  await openCatalogue(page);

  await page.getByRole("link", {
    name: "Ver detalhes de Emerald Ape #042",
  }).first().click();

  await expect(page).toHaveURL(
    /\/nft\/nft-1/
  );

await expect(
  page.getByRole("heading", {
    name: "Emerald Ape #042",
    exact: true,
  }).first()
).toBeVisible();

  await page.goto("/nft/inexistente");

  await expect(
    page.getByRole("heading", {
      name: "NFT não encontrado",
    })
  ).toBeVisible();
});

// ==========================================
// TESTE 4 — COMPRA COMPLETA
// ==========================================

test("confirma pedido via API e limpa o carrinho", async ({
  page,
}) => {
  await openCatalogue(page);

  // Adiciona um NFT ao carrinho.
  await page.getByRole("button", {
    name: "Adicionar Sage Nomad #009 ao carrinho",
  }).first().click();

  // Abre o carrinho.
  await page.goto("/?tab=cart");

  await expect(
    page.getByRole("heading", {
      name: "Meu carrinho",
    })
  ).toBeVisible();

  // Acessa o checkout.
  await page.getByRole("link", {
    name: "Finalizar pedido",
  }).click();

  await expect(
    page.getByRole("heading", {
      name: "Checkout",
    })
  ).toBeVisible();

  // Aguarda a confirmação HTTP.
  const orderResponsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", {
    name: "Confirmar pedido",
  }).click();

  const response = await orderResponsePromise;

  expect(response.status()).toBe(201);

  // Confirmação mostrada somente após a API.
  await expect(
    page.getByRole("heading", {
      name: "Pedido confirmado!",
    })
  ).toBeVisible();

  await expect(
    page.getByText("1.69 ETH")
  ).toBeVisible();

  // Carrinho vazio após confirmação.
  await page.goto("/?tab=cart");

  await expect(
    page.getByText("Seu carrinho está vazio")
  ).toBeVisible();
});

// ==========================================
// TESTE 5 — IDEMPOTÊNCIA DA API
// ==========================================

test("impede pedidos duplicados por idempotência", async ({
  page,
}) => {
  await openCatalogue(page);

  const results = await page.evaluate(async () => {
    const key = crypto.randomUUID();

    async function createOrder(nftId: string) {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Idempotency-Key": key,
        },
        body: JSON.stringify({
          items: [{ nftId, quantity: 1 }],
        }),
      });

      const data = await response.json();

      return {
        status: response.status,
        id: data.id ?? null,
      };
    }

    const first = await createOrder("nft-1");
    const repeated = await createOrder("nft-1");
    const conflict = await createOrder("nft-2");

    return {
      first,
      repeated,
      conflict,
    };
  });

  // Primeiro pedido criado.
  expect(results.first.status).toBe(201);

  // Pedido repetido recuperado.
  expect(results.repeated.status).toBe(200);

  // Mesmo identificador.
  expect(results.repeated.id).toBe(
    results.first.id
  );

  // Mesma chave com outros dados.
  expect(results.conflict.status).toBe(409);
});

// ==========================================
// TESTE 6 — CATÁLOGO NO DESKTOP
// ==========================================

test("exibe o catálogo na resolução desktop", async ({
  page,
}) => {
  await page.setViewportSize({
    width: 1440,
    height: 900,
  });

  await openCatalogue(page);

  await expect(
    page.getByRole("heading", {
      name: "Explore nossos NFTs",
    })
  ).toBeVisible();

  const cards = page.locator(
    'section[aria-label="Catálogo de NFTs"] article'
  );

  await expect(cards).toHaveCount(4);
});
