# KURIO — Arquitetura e decisões técnicas

Documento complementar ao [README.md](./README.md) referente à entrega do Frontend Challenge da Jungle Gaming (01/11/2026).

## 1. Visão geral

Aplicação client-side em React 19 + TypeScript, criada com Vite 8. Não existe backend externo: as operações REST e o protocolo Socket.IO da demonstração são interceptados pelo Mock Service Worker (MSW) no navegador. A Vercel serve arquivos estáticos e aplica `vercel.json` para suportar refresh/acesso direto às rotas SPA.

```text
Navegador / React
  ├── TanStack Router → Início, NFT, Checkout, Login, Perfil
  ├── Context API → carrinho local
  ├── TanStack Query → cache das consultas e mutations
  ├── Axios → /api/*
  │    └── MSW (Service Worker) → handlers REST → armazenamento do navegador
  └── Socket.IO client → WebSocket fictício
       └── @mswjs/socket.io-binding → handlers MSW de eventos
            └── RealtimeBridge → validação REST / cache TanStack Query / feedback
```

## 2. Responsabilidades por pasta

| Local | Responsabilidade |
|---|---|
| `src/routes/` | Rotas de arquivo, páginas, parâmetros validados e acesso aos fluxos |
| `src/components/` | Componentes visuais desktop/mobile e ponte de tempo real |
| `src/context/CartContext.ts`, `CartProvider.tsx` | Estado e persistência do carrinho |
| `src/hooks/useNfts.ts` | Consultas de catálogo e detalhe com query keys estáveis |
| `src/services/` | Clientes Axios e wrapper do Socket.IO, tipos públicos |
| `src/mocks/browser.ts` | Composição dos handlers MSW |
| `src/mocks/handlers.ts` | Catálogo, cotações, idempotência, pedidos |
| `src/mocks/authHandlers.ts` | Cadastro, autenticação, sessões simuladas |
| `src/mocks/walletHandlers.ts` | Validação, cadastro e conexão fictícia de carteiras |
| `src/mocks/socketHandlers.ts` | Transporte/eventos Socket.IO simulados |
| `src/data/nfts.ts` | Fixtures locais de quatro NFTs e assets |
| `tests/e2e/` e `playwright.config.cjs` | Fluxos E2E com Chromium |
| `public/mockServiceWorker.js` | Script de interceptação do MSW |
| `vercel.json` | Fallback de rotas SPA no hosting |

## 3. Roteamento e estado

O TanStack Router usa a rota `/` com `tab` (`all`, `new`, `trending`, `favorites`, `cart`), `q` (busca) e `sort` (`price-asc`, `price-desc`) persistidos na URL. Existem rotas para `/nft/$nftId`, `/checkout`, `/login` e `/profile`.

O TanStack Query usa `['nfts']` para catálogo, `['nfts', nftId]` para detalhe, além de consultas de sessão/carteiras e recursos de pedido. O `QueryClient` define `staleTime: 30_000`, `retry: 1`, `refetchOnWindowFocus: false` por padrão; queries sensíveis de autenticação podem ajustar esses valores. As mutations não confirmam uma compra antecipadamente na UI: o recibo aparece após resposta REST 201/200 validada.

O carrinho utiliza `CartProvider`, armazena IDs únicos em `localStorage` (`kurio:cart`) e preserva conteúdo após refresh e login. É deliberadamente limitado a **uma unidade por ID**, não implementando quantidades editáveis. Favoritos persistem no navegador (`kurio:favorites`), e não em um endpoint remoto por usuário. Não foi implementada atualização otimista com rollback demonstrável de uma mutation remota.

## 4. Mocking, autenticação e dados

`main.tsx` aguarda `worker.start()` antes de montar o React, salvo quando `VITE_ENABLE_MSW=false`; com isso o build de demonstração dispõe de mocks. Os handlers processam requisições de rede reais do navegador, sem substituir Axios por chamadas diretas aos dados.

**Credenciais demonstrativas:** `demo@kurio.test` / `Demo12345!` e `teste@kurio.test` / `Teste12345!`. Usuários são persistidos no armazenamento local do contexto do mock. As senhas do mock são guardadas como hash SHA-256 com salt, **mas isso não é uma solução segura de armazenamento de credenciais de produção**. O token de sessão simulado fica em `localStorage` (`kurio:access-token`), é enviado no cabeçalho `Authorization: Bearer`, e sessões fictícias expiram em ~60 min. Tokens não são verificáveis por um backend real.

Carteiras são endereços EVM fictícios (`0x` + 40 caracteres hexadecimais) associados a uma conta, com redes Ethereum, Polygon e Base, opção principal e status de conexão. Não existe integração com MetaMask, Web3 ou blockchain. Dados são armazenados por origem/navegador, e não compartilhados entre dispositivos. O MSW não equivale a um servidor central multiusuário seguro.

Para reiniciar dados, remova os dados de armazenamento do site no Chrome em *Application → Storage → Clear site data* e atualize. **Não existe** interface automatizada de seleção/reset de cenários, controle reproduzível de latência, offline, timeout ou falha de pagamento.

## 5. Contratos REST e semântica

- `GET /api/nfts`, `GET /api/nfts/:nftId`: catálogo e detalhes.
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/session`, `POST /api/auth/logout`: ciclo de sessão simulada.
- `GET/POST /api/wallets`, `PATCH /api/wallets/:walletId`, `POST /api/wallets/:walletId/connect|disconnect`: gerenciamento fictício das carteiras.
- `POST /api/checkout/quote`: exige itens, carteira e rede; valida carteira conectada e cupom, devolve `id`, `expiresAt`, subtotal, desconto, taxa de rede e total, todos os valores monetários em strings ETH.
- `POST /api/orders`: exige autenticação e cabeçalho `Idempotency-Key`; confirma compra autorizada após validar carteira e cotação. Retorna recibo imutável com referência `KURIO-*`.
- `GET /api/orders/:orderId`: consulta autorizada por proprietário.

Os cálculos de ETH no mock de pedidos utilizam unidades inteiras do tipo `bigint` para evitar erros de precisão de ponto flutuante no total confirmado. Cupom demonstrativo `KURIO10` reduz 10% sobre o subtotal. A cotação expira após cerca de 5 minutos. A mesma chave de idempotência com a mesma assinatura retorna o pedido original (`200`), enquanto chave repetida com conteúdo diferente causa `409`; uma criação nova retorna `201`. O carrinho só perde os IDs confirmados após sucesso REST. O estado de pedidos atualmente é apenas `confirmed` — não há transições `pending` ou `declined`.

## 6. Socket.IO — transporte e reconciliação

O `socket.io-client` aponta para `https://kurio-realtime.example` com transporte `websocket` e path `/socket.io/`. O MSW intercepta `wss://kurio-realtime.example` por `ws.link(...)` e converte a conexão para semântica Socket.IO com `@mswjs/socket.io-binding`. **Não existe host WebSocket externo**. Eventos implementados:

| Evento | Origem | Ação na aplicação |
|---|---|---|
| `kurio.ping` / `kurio.pong` | Cliente / mock | Diagnóstico de conexão |
| `nft.watch` / `nft.updated` | Cliente / mock | Consulta de atualização dos IDs acompanhados e sincronização de dados do NFT |
| `order.updated` | Mock após salvar novo pedido | Cliente consulta `GET /api/orders/:id`; apenas pedidos acessíveis à sessão geram notificação |

`RealtimeBridge.tsx` monta listeners no ciclo de vida React, atualiza as query keys do TanStack Query quando recebe alteração de preço, descarta eventos de NFT com versão temporal antiga/duplicada e remove listeners ao desmontar. Na reconexão, invalida a consulta do catálogo, usando REST como referência. O listener de pedidos verifica o token atual e consulta o recibo autorizado antes de atualizar cache/notificação; eventos da outra conta não devem gerar notificação de sucesso. O mock de pedidos emite `order.updated` **depois de persistir**; reenvios idempotentes não emitem nova confirmação.

**Limitações:** o mock `nft.watch` publica os preços fixos das fixtures e não oferece interface determinística para alterar preço/estoque durante o checkout; o evento `order.updated` só comunica `confirmed`, e não simula `pending` ou `declined`. A validação automática de duplicatas, interrupções e reconexões não cobre todos os casos do enunciado. A notificação de tempo real na UI deve ser validada em uma compra na versão final; build aprovado, por si, não prova o evento.

## 7. UX, acessibilidade e fidelidade visual

O layout prioriza os frames mobile/desktop do Figma: cores escuras, acentos laranja, tipografia Roboto Mono, cards e navegação responsiva. Ícones de cabeçalho e barra inferior foram integrados a rotas reais. Formularios usam labels e mensagens de erro; elementos relevantes possuem `aria-label`, `aria-live` ou `role="status"` quando aplicável. A experiência não foi auditada integralmente quanto a zoom, teclado, gestão de foco em drawers e skeletons em todos os componentes.

Há desvios conhecidos: catálogo de demonstração reduzido; páginas de criadores/aprendizado apenas informativas; banner mobile em larguras muito estreitas pode causar sobreposição; escopo de perfil e quantidade não cobre a totalidade dos estados do edital. A prioridade da entrega foi preservar funcionalidades verificáveis e declarar o que está incompleto.

## 8. Testes e auditoria

**Testes locais reportados:** 7 cenários Playwright passaram em 01/11/2026, incluindo autenticação/carteira/cupom/compra, tratamento de NFT inexistente e idempotência. Executados com `npx playwright test tests/e2e/critical-flows.spec.ts --config=playwright.config.cjs`; o conjunto não abrange a matriz completa de testes, regressão visual e falhas determinísticas requerida. A configuração usa Chromium com viewport 414×896, e um cenário alterna para desktop.

**PageSpeed Insights — medição pontual da home publicada (01/11/2026):**

| Categoria | Mobile | Desktop | Meta |
|---|---:|---:|---:|
| Performance | 73 | 74 | 90 |
| Accessibility | 100 | 100 | 95 |
| Best Practices | 100 | 100 | 95 |
| SEO | 83 | 83 | 90 |

Performance e SEO não atingiram a meta. Um fator potencial é o peso das imagens PNG (aproximadamente 2 MB cada) e do código de mocking; investigações de LCP/CLS/TBT e otimização de assets ficam como evolução. Os dados são **uma medição por perfil, não medianas de três execuções**; não foram versionados relatórios HTML/JSON ou configurações Lighthouse, e o detalhe do NFT não foi auditado separadamente.

## 9. Limitações e próximos passos

- Buscar/filtrar/paginar pela API com múltiplos filtros combináveis, respostas fora de ordem e fixtures extensas.
- Alterar quantidade, reserva/disponibilidade por NFT/edição; refletir mudanças de estoque no subtotal do carrinho.
- Persistir favoritos por usuário e implementar contratos REST completos para carrinho e perfil.
- Editar nome/avatar/senha com validação e persistência por API.
- Simular pagamento pendente/recusado, reconciliação após timeout e refresh e cenários reproduzíveis via MSW.
- Ampliar testes E2E, regressão visual e relatórios Lighthouse com as três execuções e mediana solicitadas.
- Otimizar carregamento de imagens, fonts/subsets, code splitting e SEO técnico após auditoria detalhada.

**Decisão arquitetural:** priorizar uma demonstração autocontida, com API mockada na camada de rede e compra condicionada à confirmação REST, em vez de simular sucesso apenas com estado local no componente. Isso mantém os fluxos centrais demonstráveis sem expor serviços externos nem transações reais.
