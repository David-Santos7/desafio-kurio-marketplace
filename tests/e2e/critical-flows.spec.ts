import { test, expect, type Page } from "@playwright/test";

// KURIO — Fluxos críticos E2E (API simulada via MSW)
// Cada teste utiliza um contexto de navegador isolado.

const DEMO_EMAIL = "demo@kurio.test";
const DEMO_PASSWORD = "Demo12345!";
const TEST_WALLET = "0x1111111111111111111111111111111111111111";

async function openCatalogue(page: Page): Promise<void> {
  const catalogResponse = page.waitForResponse(
    (response) =>
      response.url().includes("/api/nfts") &&
      response.request().method() === "GET" &&
      response.status() === 200
  );

  await page.goto("/");
  await catalogResponse;
}

async function loginDemo(page: Page): Promise<void> {
  await page.goto("/login");

  await page.getByLabel("E-mail", { exact: true }).fill(DEMO_EMAIL);
  await page.getByLabel("Senha", { exact: true }).fill(DEMO_PASSWORD);

  const loginResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/auth/login") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", {
    name: "Entrar na minha conta",
  }).click();

  expect((await loginResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\?tab=all/);
}

async function createAndConnectWallet(page: Page): Promise<string> {
  await page.goto("/profile");

  await expect(
    page.getByRole("heading", { name: "Meu perfil" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Nova carteira" }).click();

  await page.getByLabel("Nome da carteira").fill("Carteira E2E");
  await page.getByLabel("Endereço EVM").fill(TEST_WALLET);
  await page.getByLabel("Rede", { exact: true }).selectOption("ethereum");

  const walletResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/wallets") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", {
    name: "Cadastrar carteira",
  }).click();

  const response = await walletResponse;
  expect(response.status()).toBe(201);

  const wallet = (await response.json()) as { id: string };
  expect(wallet.id).toBeTruthy();

  const connectResponse = page.waitForResponse(
    (result) =>
      result.url().endsWith(`/api/wallets/${wallet.id}/connect`) &&
      result.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Conectar", exact: true }).click();
  expect((await connectResponse).status()).toBe(200);

  return wallet.id;
}

test("carrega os quatro NFTs pela API simulada", async ({ page }) => {
  await openCatalogue(page);

  const cards = page.locator('section[aria-label="Catálogo de NFTs"] article');
  await expect(cards).toHaveCount(4);
  await expect(
    page.getByRole("link", {
      name: "Ver detalhes de Emerald Ape #042",
    }).first()
  ).toBeVisible();
});

test("pesquisa e ordena NFTs por preço", async ({ page }) => {
  await openCatalogue(page);

  const search = page.getByRole("searchbox", {
    name: "Explorar coleções",
  });

  const cards = page.locator('section[aria-label="Catálogo de NFTs"] article');
  await search.fill("Nomad");
  await expect(cards).toHaveCount(2);

  await search.clear();
  await expect(cards).toHaveCount(4);

  await page.getByRole("button", { name: "Ordenar NFTs" }).click();
  await page.getByRole("button", { name: "Maior preço" }).click();

  await expect(cards.first()).toContainText("1.69 ETH");
  await expect(page).toHaveURL(/sort=price-desc/);
});

test("abre detalhes e trata NFT inexistente", async ({ page }) => {
  await openCatalogue(page);

  await page.getByRole("link", {
    name: "Ver detalhes de Emerald Ape #042",
  }).first().click();

  await expect(page).toHaveURL(/\/nft\/nft-1/);
  await expect(
    page.getByRole("heading", {
      name: "Emerald Ape #042",
      exact: true,
    }).first()
  ).toBeVisible();

  await page.goto("/nft/inexistente");
  await expect(
    page.getByRole("heading", { name: "NFT não encontrado" })
  ).toBeVisible();
});

test("protege o checkout de usuários não autenticados", async ({ page }) => {
  await page.goto("/checkout");
  await expect(
    page.getByRole("heading", { name: "Faça login para continuar" })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar na minha conta" }))
    .toHaveAttribute("href", "/login");
});

test("faz login, conecta carteira, aplica cupom e confirma compra", async ({ page }) => {
  await loginDemo(page);
  await createAndConnectWallet(page);
  await openCatalogue(page);

  await page.getByRole("button", {
    name: "Adicionar Emerald Ape #042 ao carrinho",
  }).first().click();

  await page.goto("/checkout");
  await expect(page.getByRole("heading", { name: "Checkout" })).toBeVisible();

  await page.getByLabel("Cupom de desconto").fill("KURIO10");

  const quoteResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/checkout/quote") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Solicitar cotação" }).click();
  expect((await quoteResponse).status()).toBe(200);
  await expect(page.getByText("1.091 ETH")).toBeVisible();

  const orderResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/orders") &&
      response.request().method() === "POST"
  );

  await page.getByRole("button", { name: "Confirmar pedido" }).click();
  expect((await orderResponse).status()).toBe(201);

  await expect(
    page.getByRole("heading", { name: "Pedido confirmado!" })
  ).toBeVisible();
  await expect(page.getByText("1.091 ETH")).toBeVisible();

  await page.goto("/?tab=cart");
  await expect(page.getByText("Seu carrinho está vazio")).toBeVisible();
});

test("respeita idempotência e impede reutilização indevida da chave", async ({ page }) => {
  await loginDemo(page);
  const walletId = await createAndConnectWallet(page);

  const results = await page.evaluate(async ({ walletId }) => {
    const token = localStorage.getItem("kurio:access-token");
    if (!token) throw new Error("Token de login não encontrado.");

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    };

    const quoteRequest = {
      items: [{ nftId: "nft-1", quantity: 1 }],
      walletId,
      network: "ethereum",
      couponCode: null,
    };

    const quoteResponse = await fetch("/api/checkout/quote", {
      method: "POST",
      headers,
      body: JSON.stringify(quoteRequest),
    });

    const quote = (await quoteResponse.json()) as { id?: string };
    if (quoteResponse.status !== 200 || !quote.id) {
      throw new Error(`Cotação não aprovada: ${quoteResponse.status}`);
    }

    const key = crypto.randomUUID();

    async function createOrder(nftId: string) {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: { ...headers, "Idempotency-Key": key },
        body: JSON.stringify({
          ...quoteRequest,
          items: [{ nftId, quantity: 1 }],
          quoteId: quote.id,
        }),
      });

      const data = (await response.json()) as { id?: string };
      return { status: response.status, id: data.id ?? null };
    }

    return {
      first: await createOrder("nft-1"),
      repeated: await createOrder("nft-1"),
      conflict: await createOrder("nft-2"),
    };
  }, { walletId });

  expect(results.first.status).toBe(201);
  expect(results.repeated.status).toBe(200);
  expect(results.repeated.id).toBe(results.first.id);
  expect(results.conflict.status).toBe(409);
});

test("exibe catálogo na resolução desktop", async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await openCatalogue(page);

  await expect(
    page.getByRole("heading", { name: "Explore nossos NFTs" })
  ).toBeVisible();

  const cards = page.locator('section[aria-label="Catálogo de NFTs"] article');
  await expect(cards).toHaveCount(4);
});
