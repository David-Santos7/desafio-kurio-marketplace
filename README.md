# KURIO — NFT Marketplace

Marketplace demonstrativo de NFTs desenvolvido para o [Frontend Challenge da Jungle Gaming](https://github.com/junglegaming/frontend-challenge). A aplicação reproduz a identidade visual do Figma e oferece um fluxo de descoberta, conta, carteira e compra **simulada** em desktop e mobile.

**Aplicação:** https://desafio-kurio-marketplace.vercel.app/  
**Código:** https://github.com/David-Santos7/desafio-kurio-marketplace  
**Arquitetura e limitações:** [ARCHITECTURE.md](./ARCHITECTURE.md)

> **Demonstração:** não existe transação financeira ou blockchain real. Autenticação, carteiras, cotações, pedidos e Socket.IO são simulados com MSW no navegador. Não utilize senhas verdadeiras, chaves privadas nem carteiras reais.

## Tecnologias

- React 19, TypeScript 5.9 e Vite 8
- TanStack Router (rotas e parâmetros de URL)
- TanStack Query (consultas, mutations e cache remoto)
- Axios (requisições REST)
- Tailwind CSS 4, shadcn/ui, Radix UI e Lucide
- Mock Service Worker (MSW 2) e `@mswjs/socket.io-binding`
- `socket.io-client` (transporte real do protocolo Socket.IO contra o mock)
- Playwright (testes end-to-end em Chromium)
- Vercel (deploy) e Google PageSpeed Insights/Lighthouse (auditoria)

## Funcionalidades implementadas

- **Catálogo:** quatro NFTs fictícios, pesquisa textual, categorias *Todos*, *Novos lançamentos* e *Em alta*, ordenação por preço, página de detalhes com tratamento de NFT inexistente.
- **Favoritos e carrinho:** inclusão/remoção e persistência local após atualização; navegação por abas e indicador de quantidade no cabeçalho.
- **Conta:** cadastro, login, sessão autenticada, expiração simulada e logout; perfil com dados do colecionador.
- **Carteiras:** cadastro e edição de endereços EVM fictícios, redes Ethereum, Polygon e Base, escolha de carteira principal e conexão/desconexão simuladas.
- **Checkout:** proteção por autenticação, seleção de carteira conectada, cotação da API, cupom `KURIO10`, desconto, taxas por rede, validade da cotação, confirmação e recibo; a remoção dos itens do carrinho ocorre após resposta de confirmação.
- **Pedidos:** emissão de referência simulada, consulta por ID, armazenamento local e chave de idempotência para evitar duplicação de tentativa.
- **Tempo real:** Socket.IO sobre WebSocket interceptado pelo MSW; eventos `nft.updated`, `order.updated`, `kurio.ping` e `kurio.pong`; componente React de integração e tratamento básico de duplicatas/reconexão.
- **Interface:** visual inspirado no Figma, versões desktop/mobile, formulários com rótulos, feedbacks de carregamento e erro e avisos acessíveis.

## Instalação e execução

Requer **Node.js e npm** compatíveis com Vite 8 (recomenda-se Node.js 22.12+ ou 24+).

```bash
git clone https://github.com/David-Santos7/desafio-kurio-marketplace.git
cd desafio-kurio-marketplace
npm ci
npm run dev
```

Abra a URL indicada pelo Vite, geralmente `http://localhost:5173/`.

| Comando | Objetivo |
|---|---|
| `npm run dev` | Iniciar ambiente de desenvolvimento com MSW |
| `npm run lint` | Validar regras ESLint |
| `npx tsc -b` | Verificação de tipos TypeScript |
| `npm run build` | Build de produção em `dist/` |
| `npm run preview` | Pré-visualizar o build publicado |
| `npx playwright test --config=playwright.config.cjs` | Executar testes E2E |
| `npx playwright show-report` | Abrir relatório HTML local do Playwright |

**Variável de ambiente:** `VITE_ENABLE_MSW=false` desabilita os mocks no *build*. Para executar a versão demonstrativa, omita a variável ou utilize `VITE_ENABLE_MSW=true`. Sem MSW, é necessária uma API externa compatível (não fornecida neste repositório). O arquivo `public/mockServiceWorker.js` é copiado para `dist/` automaticamente.

## Acesso demonstrativo

| Conta | E-mail | Senha |
|---|---|---|
| Colecionador Demo | `demo@kurio.test` | `Demo12345!` |
| Colecionadora Teste | `teste@kurio.test` | `Teste12345!` |

As contas de demonstração são criadas pelos handlers de MSW no navegador. Dados de usuários diferentes **não são sincronizados entre dispositivos**; cada navegador mantém seu cenário local. A sessão simulada tem duração aproximada de uma hora.

**Como demonstrar uma compra:** abra o catálogo, adicione um NFT ao carrinho, faça login, cadastre no perfil uma carteira usando endereço **fictício** no formato `0x` seguido de 40 caracteres hexadecimais, conecte-a, vá ao checkout, solicite uma cotação (opcionalmente aplique `KURIO10`) e confirme o pedido. Nenhum valor é transferido de verdade.

## APIs simuladas e Socket.IO

Todas as requisições REST são atendidas pelos handlers registrados em `src/mocks/browser.ts`:

| Método | Recurso | Uso |
|---|---|---|
| GET | `/api/nfts` e `/api/nfts/:nftId` | Catálogo e detalhe |
| POST | `/api/auth/register`, `/api/auth/login` | Criar conta e autenticar |
| GET | `/api/auth/session` | Recuperar sessão |
| POST | `/api/auth/logout` | Encerrar sessão |
| GET/POST | `/api/wallets` | Listar e cadastrar carteiras |
| PATCH | `/api/wallets/:walletId` | Editar carteira |
| POST | `/api/wallets/:walletId/connect`, `/api/wallets/:walletId/disconnect` | Simular conexão |
| POST | `/api/checkout/quote` | Calcular cotação |
| POST | `/api/orders` | Confirmar pedido com `Idempotency-Key` |
| GET | `/api/orders/:orderId` | Recuperar pedido autorizado |

As rotas autenticadas utilizam `Authorization: Bearer <token>`; as respostas de erro incluem códigos como `400`, `401`, `404` e `409`. O mesmo `Idempotency-Key` com a mesma compra devolve o pedido existente; com dados diferentes, a API responde `409`.

O Socket.IO usa o endereço **fictício** `https://kurio-realtime.example`, com transporte `websocket` e `path: /socket.io/`, interceptado pelo handler MSW de `wss://kurio-realtime.example`. Não existe servidor WebSocket remoto. Consulte [ARCHITECTURE.md](./ARCHITECTURE.md) para semântica, decisões e limitações dos eventos.

## Estado e cenários de demonstração

A simulação usa `localStorage`/`sessionStorage` e estado temporário do navegador. Para **reiniciar o cenário**, abra as ferramentas do Chrome em *Application → Storage → Clear site data* para o domínio da aplicação e atualize a página. Essa operação apaga contas, carrinho, favoritos, carteiras e pedidos fictícios daquele navegador.

Não foi implementado um painel de seleção de cenários com latência, timeouts, indisponibilidade e pagamentos recusados reproduzíveis. Erros de autenticação, validação, recurso ausente e conflito de idempotência são tratados nos mocks. Não é correto apresentar os demais cenários como cobertos.

## Testes

```bash
npm run lint
npm run build
npx playwright test tests/e2e/critical-flows.spec.ts --config=playwright.config.cjs
```

**Resultado local informado em 01/11/2026:** `7 passed` (Chromium configurado no viewport mobile; um teste ajusta o viewport para desktop). Os cenários cobrem catálogo, pesquisa/ordenação, detalhes/404, proteção do checkout, compra com autenticação/carteira/cupom, idempotência e renderização desktop. Essa suíte **não equivale** à cobertura integral de cenários do enunciado. Relatórios locais são criados em `playwright-report/`; falhas e traces ficam em `test-results/` e não são versionados.

## Lighthouse / PageSpeed Insights

Medição **pontual da página inicial publicada**, em 01/11/2026, fornecida por capturas do PageSpeed Insights:

| Categoria | Mobile | Desktop | Meta do desafio |
|---|---:|---:|---:|
| Performance | **73** | **74** | ≥ 90 |
| Accessibility | **100** | **100** | ≥ 95 |
| Best Practices | **100** | **100** | ≥ 95 |
| SEO | **83** | **83** | ≥ 90 |

Acessibilidade e boas práticas atingiram a meta nessa medição; Performance e SEO ficaram abaixo. **Não foram executadas as três medições por página/perfil exigidas para calcular medianas**, nem concluída a auditoria separada da tela de detalhe. As imagens PNG de aproximadamente 1,9–2,1 MB cada e o bundle adicional dos mocks são pontos potenciais de otimização; não atribuímos a eles causalidade exclusiva sem diagnóstico completo. Resultados podem variar conforme a execução.

Para reproduzir uma auditoria, publique o build, abra https://pagespeed.web.dev/, analise a URL da aplicação e alterne entre Celular/Computador. O repositório não contém ainda configuração automatizada ou relatórios HTML/JSON versionados do Lighthouse.

## Limitações conhecidas / escopo parcial

O projeto é um **protótipo funcional para avaliação**, não um sistema de comércio eletrônico em produção. Permanecem parciais ou ausentes:

- Paginação e filtros combináveis alimentados por parâmetros REST; o catálogo é pequeno e parte dos filtros ocorre na interface.
- Quantidades editáveis, disponibilidade por edição, galeria/edição de NFT, favoritos persistidos por usuário na API.
- Edição completa dos dados do perfil/avatar/senha; restauração do checkout exatamente no ponto anterior ao login.
- Pedidos `pending`/`declined`, reconciliação de checkout interrompido, falhas de rede configuráveis e reset automatizado de fixtures.
- Simulação determinística de alteração de preço/estoque durante uma cotação, integração real entre disponibilidade/preço e todos os componentes; cobertura completa de duplicatas/reconexões.
- Testes completos de regressão visual, de falha, teclado, controle de foco e múltiplos viewports; relatórios Lighthouse exigidos em três repetições.

Esses pontos são detalhados em [ARCHITECTURE.md](./ARCHITECTURE.md). Nenhuma carteira real é conectada; o token e os dados no armazenamento local servem apenas para demonstração e **não constituem infraestrutura segura de autenticação em produção**.

## Entrega

- **Site:** https://desafio-kurio-marketplace.vercel.app/
- **Repositório:** https://github.com/David-Santos7/desafio-kurio-marketplace
- **Referência:** https://github.com/junglegaming/frontend-challenge

Projeto realizado como desafio técnico Front-End Junior — Jungle Gaming, novembro de 2026.
